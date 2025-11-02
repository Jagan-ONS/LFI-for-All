import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {User} from "../models/user.model.js"
import jwt from "jsonwebtoken"
//controllers means the functions or the logic we have to execute when we click something
//clicking something means hitting some route

const registerUser = asyncHandler( async (req,res)=>{//using just mail pass 
    //no google Oauth

    //destructure the data from body 
    const {fullName, email, username, password, bio} = req.body

    //check if any of them are empty 
    //even we can do this in frontend but "  " this is an edge case for FE
    if(
        [fullName,email,username,password].some( (feild)=> {
            return (feild?.trim() === "")
        })
    )
    {
        throw new ApiError(400,"All fields are required")
    }

    //check if there is any entry with same username or email id
    const existedUser = await User.findOne({
        $or : [{username : username.toLowerCase()},{email}]
    })
    //if yes throw an error 
    if(existedUser){
        throw new ApiError(409,"User with username or email already exists")
    }

    //get the localPath of profile path //for now let say it's mandatory
    const avatarLocalPath = req.file.path;
    
    //if no avatarLocalPath throw error
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    //now we got localPath of the avatar 
    //upload it on cloudinary and get url string 
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    //check if it's successfully uploeaded or not 
    if(!avatar){
        throw new ApiError(400,"unsuccessful file upload to the cloudinary")
    }
    //create a user with the given details
    const user = await User.create({
        fullName,
        avatar : avatar.url,
        email,
        password,
        username : username.toLowerCase(),
        bio
    })
    
    if(!user){
        throw new ApiError(500,"Something went wrong while registering the user")
    }
    //for sending the data to the frontend ??
    //do we need to do this here while registering 
    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User Registered Successfully")
    )
    //we need to send data even after registering, not just after loging in because 
    //at first we will be directed to main page after registering there we have to show 
    //the basic details like the name and avatar at top ig 
})

const loginUser = asyncHandler(async (req,res) => {
    
    //what if we have already logged in but we closed the window
    //we still have accessToken where is the code for that to 
    //directly redirect to the main page after trying to logging in atleast

    //user sends mail and pass through req body
    //ans user is added to the req while verification 
    const {email,password} = req.body
    // const userId = req.user._id we don't know this yet

    //check if both mail and pass are entered
    if(!email || !password){
        throw new ApiError(400,"Both email and password are required")
    }

    //get the userdetails of the user with userId 
    const user = await User.findOne({email});

    //if there is no user with userId as given 
    if(!user){
        throw new ApiError(404,"user doesn't exists please register")
    }

    //else check if the entered password is correct or not
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(404,"Invalid user credentials")
    }
    //does that mean upto here the verification is done 
    //now the below part will get tokens and options for how they have 
    //to be sent 

    //if correct then genereate access and refresh tokens 
    const {accessToken , refreshToken} = await generateAccessTokenAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure : true
    }
    //we send data so that after logging in the basic details like 
    //user name avatar will be shown in main page ???
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user : loggedInUser,
                accessToken,
                refreshToken
            },
            "User logged in successfully"
        )
    )
})

const refreshAccessToken = asyncHandler(async (req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){//does this mean the user in not logged in ??
        throw new ApiError(401,"unauthorized request")
    }
    try{
        //we have a refresh token 
        //how do we know if that is our refresh token or not ??
        //what does verifing mean here ??
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken._id)
        //what if this gives the userid of another guy ??
        if(!user){
            throw new ApiError(401,"invalid refresh token")
        }
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used")
        }
        const options = {
            httpOnly : true,
            secure : true
        }
        const {accessToken , newRefreshToken} = await generateAccessAndRefreshToken(user._id)
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken : newRefreshToken
                },
                "Access token refreshed"
    
            )
        )
    }
    catch(error){
        throw new ApiError(401,error?.message || "Invalid refresh token")
    }

})
//while writing this i learned that if some error occurs then we
//use if else blocks to check if some error occured or not 
//instead of waiting for the whole code to crash 
//and in catch block it sends a uniform error response 
//or handles the errors safely

//this funciton takes an userid and generates access and refresh tokens
const generateAccessAndRefreshToken = async(userId) => {
    //why haven't we used async handler
    try{
        const user = await User.findById({userId});
        //we bypass this user is there or not check since if we are using this funciton means
        //we are already a authorized user 
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        //since we have changed the data of the user document 
        //we will try to save it 

        await  user.save({validateBeforeSave : false})
        //why we are not validating before saving ??
        //system update or the updates which are obvious that 
        //they are not malicius can be saved wihtout validating
        //like increasing the view or likes or the post by the system 

        //but user updates should be validated
        return {accessToken,refreshToken}
    }
    catch(error){
        throw new ApiError(500,error?.message || "something went wrong")
    }
}

//why do we use this first i will find why we use this
//and later i will code it  
const getCurrentUser = asyncHandler(async (req,res) => {
    
})

//now i will add the google auth and later i will add phone number
//login 








export {
    registerUser,
    loginUser,
}

//what does a user in my app can do 
//he can register using google and mail/pass 
//he can login 
//he can change profile photo
//he can change password 
//he can like, follow, comment 

//Main page

//get some quote or motivational image or some image  
//get logs with most likes 
//get users with most followers 
//get all notifacation of today like contest in code forces ie reminders 

//Reminders page

//get all the reminders b/w two dates (filtering option)
//get the nearest reminder 
//get all the reminders of some category and severity 
//get the log which we want to review , in reminder
//get the description of the reminder 
//if haven't written journal till perticular time reminder for that 

//Incident page 

//log an incident 
//get logs based on some query 
//get all logs
//get starred logs (we can see them as a carousal)
//get logs based on some filters
//root cause analysys discussion with llm or some user 

//Journal 

//get journal of some day 
//get journal of some type 

//habit tracking 

//get all habbit logs 
//get this month habits 
//get summary if it's month end summary of whole month 
//button which will give the summary till now 
//add a habit log 
//edit a habit log 
//add a habit 
//delete a habit

//Profile page 

//get total logs
//get cnt of different types of logs based on severity conext and +ve or -ve 
//get avatar 
//get user details 
//get what is the heighest sever incident on that day for each day 
//if our profile get all type of logs else only public 

//Search page 

//get some user or incident somehting 
//search on some context 

//Payments page 

//monthly payment 
//yearly payment 