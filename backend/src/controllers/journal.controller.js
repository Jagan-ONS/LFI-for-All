import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { Journal } from "../models/journal.model.js"
import { JournalEntry } from "../models/journalEntry.model.js"
//what are the functionalities i will have in this app??
//there will some icons of daily journals , weekly journals , monthly jornals , project journals
//if we click them we wil have a list of journals in that context 
//we can select anything, we will see an empty page where we have to enter our journal 
//we can write something there and save it 
//we can delete that journal 
//we can update that journal

const createJournal = asyncHandler( async(req , res)=>{
    //get data from query 
    //only the user logged in can create a journal 
    
    //take name , type , password
    //if there is another journal with same name throw error, 
    //if password do something , else do somethig 
    //just crate 
    const {name,type,password} = req.query
    const userId = req.user._id
    if(!name || !type){
        throw new ApiError(400,"Name and type of the journal are required")
    }
    //check if there is a journal with same name 
    const existingJournal = await Journal.find({userId,name})
    if(!existingJournal){
        throw new ApiError(400,"A journal with this name already exists please change the name of the journal")
    }
    const journalData = {
        userId,
        name,
        type,
        isProtected : !!password,
        password : password || undefined
    }
    const journal = await Journal.create(journalData)
    journal.password = undefined

    return res
    .status(201)
    .json(new ApiResponse(201,journal,"Journal created successfully"))
})

//controller to get all journals for the user

const getAllJournalsOfAType = asyncHandler( async(req,res)=>{
    const userId = req.user._id
    const {type} = req.query
    //do we have to check if the user is verified or not
    //no since we have already did that in the verifyJwt middleware 
    const Journals = await Journal.find({userId,type}).select("-password")
    return res
    .status(200)
    .json(new ApiResponse(200,Journals,"fetched all journals"))
})

const verifyJournalPassword = asyncHandler( async(req,res)=>{
    //how do we get the data of the journal we are trying to open 
    //let say if we have the data of that 
    //we will take the password entered by user 
    //and use the .ispasswordcorrect method to check
    //how to get the journal id ??
    const {journalId} = req.params
    const {password} = req.body
    if(!password){
        throw new ApiError(400,"Password is required :)")
    }
    const journal = await Journal.find({_id : journalId})
    if(!journal){
        throw new ApiError(404,"Journal not found")
    }
    //if it's not locked then we won't do password verifications right ??
    // TODO: check this once after completion 
    if (!journal.isProtected) {
        return res.status(200).json(new ApiResponse(200, { verified: true }, "Journal is not protected"));
    }
    const isPasswordValid = journal.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401,"Invalid password")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, { verified: true }, "Password verified successfully"));
})

const getJournalEntry = asyncHandler( async(req,res)=>{
    //get the journal entry of daily journal of this date 
    const {journalId} = req.params
    const {date} = req.query
    const userId = req.user._id
    if(!date){
        throw new ApiError(400,"date is required")
    }
    //change this date to date type 
    //check if this journalId belongs to the 
    const journal = await Journal.findById(journalId)
    if(!journal || journal.userId.to_string() != userId.to_string()){
        throw new ApiError(404, "Journal not found");
    }
    const entry = await JournalEntry.findOne({
        journalId,
        userId: req.user._id,
        entryDate: entryDate
    });
    if (!entry) {
        return res
            .status(200)
            .json(new ApiResponse(200, null, "No entry found for this date."));
    }

    // Check if the parent journal is protected.
    // We send the entry, but tell the frontend it must be unlocked.
    if (journal.isProtected) {
        return res
            .status(200)
            .json(new ApiResponse(200, { entry, isLocked: true }, "Entry fetched, but journal is locked."));
    }

    // Journal is not protected, send the entry
    return res
        .status(200)
        .json(new ApiResponse(200, { entry, isLocked: false }, "Entry fetched successfully"));
})

const createOrUpdateJournalEntry = asyncHandler(async (req, res) => {
    const { journalId } = req.params;
    const { description, entryDate } = req.body; // Date string

    if (!description || !entryDate) {
        throw new ApiError(400, "Description and entryDate are required.");
    }

    // Security Check: Does this user own the parent journal?
    const journal = await Journal.findById(journalId);
    if (!journal || journal.userId.toString() !== req.user._id.toString()) {
        throw new ApiError(404, "Journal not found or you do not have permission.");
    }

    // --- Password Check ---
    // If journal is protected, the user MUST have provided a valid password
    // in the same request, or a temporary auth token (we'll use password for now).
    // NOTE: A better way is to use the `verifyJournalPassword` controller
    // and have the frontend send a temporary JWT, but for simplicity:
    if (journal.isProtected) {
        const { password } = req.body;
        if (!password) throw new ApiError(401, "Password is required to save to a protected journal.");
        
        const isCorrect = await journal.isPasswordCorrect(password);
        if (!isCorrect) throw new ApiError(401, "Invalid password.");
    }

    // Find and Update (Upsert) logic
    const date = new Date(entryDate);
    date.setUTCHours(0, 0, 0, 0);

    const filter = {
        journalId,
        userId: req.user._id,
        entryDate: date
    };

    const update = {
        description
    };

    const options = {
        new: true,    // Return the new/updated document
        upsert: true  // Create it if it doesn't exist
    };

    const entry = await JournalEntry.findOneAndUpdate(filter, update, options);

    return res
        .status(200)
        .json(new ApiResponse(200, entry, "Entry saved successfully"));
});

const deleteJournalEntry = asyncHandler(async (req, res) => {
    const { entryId } = req.params;

    if (!mongoose.isValidObjectId(entryId)) {
        throw new ApiError(400, "Invalid Entry ID");
    }

    const entry = await JournalEntry.findOneAndDelete({
        _id: entryId,
        userId: req.user._id // CRITICAL: Users can only delete their own entries
    });

    if (!entry) {
        throw new ApiError(404, "Entry not found or you do not have permission.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Entry deleted successfully"));
});

const deleteJournal = asyncHandler(async (req, res) => {
    const { journalId } = req.params;

    // 1. Delete the journal itself (and check for ownership)
    const journal = await Journal.findOneAndDelete({
        _id: journalId,
        userId: req.user._id
    });

    if (!journal) {
        throw new ApiError(404, "Journal not found or you do not have permission.");
    }

    // 2. Cascade Delete: Delete all entries associated with this journal
    await JournalEntry.deleteMany({ journalId: journalId });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Journal and all its entries deleted successfully."));
});

export {
    createJournal,
    getAllJournalsOfAType,
    verifyJournalPassword,
    getJournalEntry,
    createOrUpdateJournalEntry,
    deleteJournal,
    deleteJournalEntry
}