//in this page i will be writing controllers used in reminder page 


//filtering controllers , this will fetch all reminders according to 
//the filters

//add a periodic reminder which is seperate from adding normal reminders
//but updating and deleting is same 

//add a normal reminder by clicking on some date we want to add a reminder 
//we get 3 button when we click on some date add ,update , delete 
//so 3 controllers for them 

//in the left part we have to show a calander , along with them 
//i have to show the high sever incidents by some red mark on that day 
//and different types of colors for different types of reminders if any reminder exists 
//on that perticular day 

//i will also add housekeepng for deleting reminders which are older than 60 days 

import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { IncidentLog } from "../models/incidentLog.model.js";
import { Reminder } from "../models/reminder.model.js";

//
const getFilteredReminders = asyncHandler( async (req,res)=>{
    // const {startDate , endDate ,reminderType, reminderCategory} = req.query
    // //default value for the startDate is the starting of this month 
    // //endDate default value is ending of this month 
    // //reminderType default is all 
    // //reminderCategory default is all 
    // //how to set these 
    // //let say some how i have set these how to fetch the reminders 
    // //we can just use those as filters
    // const userId = req.user._id
    // //okay how to handle periodic reminders 
    // //how to filter them 

    const userId = req.user._id;

    // Get filters from query string
    const {reminderType, reminderCategory } = req.query;

    // --- 2. SET UP DATE RANGE (with defaults) ---

    // Get "now"
    const now = new Date();

    // Default: Start of the current month
    const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0); 
    
    // Default: End of the current month (JS trick: Day 0 of next month is last day of current)
    const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Use user-provided dates if they exist, otherwise use our defaults
    // We also wrap them in new Date() to ensure they are date objects
    const startDate = req.query.startDate ? new Date(req.query.startDate) : defaultStartDate;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : defaultEndDate;

    // This will hold all our final results
    let finalReminders = [];

    // --- 3. BUILD THE BASE QUERY ---
    // This filter applies to all queries we run.
    const baseFilter = { 
        userId: userId 
    };

    // Add category filter *if* it was provided and is not 'all'
    if (reminderCategory && reminderCategory !== 'all') {
        baseFilter.category = reminderCategory;
    }

    // --- 4. RUN QUERIES BASED ON reminderType ---

    // We run this block if the user wants 'all', 'manual', or 'scheduled'
    if (!reminderType || reminderType === 'all' || reminderType === 'manual' || reminderType === 'scheduled') {
        
        // This query is for one-time reminders. It's simple.
        const oneTimeQuery = {
            ...baseFilter, // { userId: ..., category: ... }
            remindAt: { $gte: startDate, $lte: endDate }, // Must be within our date range
        };

        // If the user *specifically* asked for 'manual' or 'scheduled', set it.
        // Otherwise, find both.
        if (reminderType && reminderType !== 'all') {
            oneTimeQuery.reminderType = reminderType; // e.g., 'manual'
        } else {
            oneTimeQuery.reminderType = { $in: ['manual', 'scheduled'] };
        }

        const oneTimeReminders = await Reminder.find(oneTimeQuery).sort({ remindAt: 1 });
        
        // Add them to our final list
        finalReminders.push(...oneTimeReminders);
    }

    // We run this block if the user wants 'all' or 'periodic'
    if (!reminderType || reminderType === 'all' || reminderType === 'periodic') {
        
        // This query is for periodic reminders.
        // **NOTICE**: We CANNOT filter by date here.
        const periodicQuery = {
            ...baseFilter, // { userId: ..., category: ... }
            reminderType: 'periodic',
        };

        const periodicReminders = await Reminder.find(periodicQuery);
        
        // Now, we loop through them in JavaScript to check their cron rules
        for (const reminder of periodicReminders) {
            try {
                // These options tell cron-parser to check within our date range
                const options = {
                    startDate: startDate,
                    endDate: endDate,
                    iterator: true // This allows us to use .hasNext()
                };
                
                // Parse the rule
                const interval = parseExpression(reminder.cronRule, options);

                // .hasNext() returns true if there is *at least one*
                // occurrence within our start/end date range.
                if (interval.hasNext()) {
                    finalReminders.push(reminder);
                }
            } catch (err) {
                console.error(`Invalid cron rule for reminder ${reminder._id}: ${err.message}`);
                // Don't crash, just skip this reminder
            }
        }
    }

    // --- 5. SORT AND SEND RESPONSE ---
    // we don't need to sort since we are just using this to fillout the callender 
    // We sort the final combined list by date
    // Note: Periodic reminders don't have a 'remindAt', so we sort them
    // but they might appear at the start or end. A more complex sort
    // would be needed if you want to mix them perfectly.
    // For a filter, this is usually fine.
    // finalReminders.sort((a, b) => {
    //     if (a.remindAt && b.remindAt) {
    //         return a.remindAt - b.remindAt;
    //     }
    //     return 0; // Keep original order if one is periodic
    // });
    
    return res
        .status(200)
        .json(new ApiResponse(200, finalReminders, "Reminders filtered successfully"));
})

const addPeriodicReminder = asyncHandler( async (req,res)=>{
    //how to add a periodic reminder 
    //how to ask the user to enter a periodic reminder 
    //we will show some columns like daily , weekly, montly ??
    //if daily we just ask them to enter time 
    //if weekly ??

    //instead of that we can just ask them the freq by which he want 
    //to get reminders let say 2 days then we will ask a perticular time 
    //yeah this looks good
    //so from query we will get the freq and time at which he want to recieve reminders 

    //we will do in the first way because it is easy to build the cronRule that way 
    //rather than second way 
    //so what we will recieve from the frontend is just a string ??

    // 1. Get all data from the request body
    // The frontend sends the cronRule, not "freq" or "time"
    const { category, title, description, cronRule } = req.body;

    // 2. Validation
    if (!category || !title || !description || !cronRule) {
        throw new ApiError(400, "All fields (category, title, description, cronRule) are required.");
    }

    // 3. Validate the cronRule
    // This is a crucial security and stability check.
    try {
        // We use cron-parser to make sure the rule is valid
        parseExpression(cronRule);
    } catch (err) {
        // If the frontend sends a bad string (e.g., "every tuesday"), this will fail
        throw new ApiError(400, `Invalid cronRule format: ${err.message}`);
    }

    // 4. Create the reminder
    const reminder = await Reminder.create({
        userId: req.user._id,
        reminderType: 'periodic',
        category,
        title,
        description,
        cronRule, // Save the valid cron rule
        status: 'pending'
        // 'remindAt' is correctly left empty because this is periodic
    });

    // 5. Send the response
    return res
        .status(201)
        .json(new ApiResponse(201, reminder, "Periodic reminder created successfully"));


})

//from the incidentLog colleciton
// get all the highSeverlogs which happened in the current month
// const getAllHighSeverLogs = asyncHandler(async (req,res) =>{
    
// })

// const getAllReminders = asyncHandler( async (req,res)=>{
//     //get all reminders all periodic, manual, scheduled
//     //happened the current month 
// })

export const getCalendarMonthData = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // --- 1. Get Date Range from Query ---
    const { year, month } = req.query; // e.g., year=2025, month=11 (for November)
    const now = new Date();

    // Default to current year/month if not provided
    // We parse them as integers
    // Note: JS Date month is 0-indexed (Jan=0), so we subtract 1
    const queryYear = year ? parseInt(year) : now.getFullYear();
    const queryMonth = month ? parseInt(month) - 1 : now.getMonth();

    // Create the date range for the entire month
    const startDate = new Date(queryYear, queryMonth, 1);
    const endDate = new Date(queryYear, queryMonth + 1, 0, 23, 59, 59);

    // --- 2. Fetch High-Severity Incident Markers ---
    // We find incidents with severity 3 ('Very High')
    const incidentMarkers = await IncidentLog.find({
        owner: userId,
        severity: 3 , 
        createdAt: {
            $gte: startDate,
            $lte: endDate
        }
    }).select('createdAt'); // Only select the data we need

    // Clean up the data for the frontend
    const incidentData = incidentMarkers.map(incident => ({
        date: incident.createdAt.toISOString().split('T')[0], // "YYYY-MM-DD"
    }));

    // --- 3. Fetch Reminder Markers ---
    
    const reminderData = [];
    
    // 3a. Find all 'manual' and 'scheduled' reminders in the range
    const oneTimeReminders = await Reminder.find({
        userId: userId,
        reminderType: { $in: ['manual', 'scheduled'] },
        remindAt: { $gte: startDate, $lte: endDate }
    }).select('remindAt reminderType');

    // Add them to our list
    oneTimeReminders.forEach(r => {
        reminderData.push({
            date: r.remindAt.toISOString().split('T')[0], // "YYYY-MM-DD"
            type: r.reminderType
        });
    });

    // 3b. Find ALL 'periodic' reminders and calculate their occurrences
    const periodicReminders = await Reminder.find({
        userId: userId,
        reminderType: 'periodic'
    });

    for (const reminder of periodicReminders) {
        try {
            const options = {
                startDate: startDate,
                endDate: endDate,
                iterator: true // Allows us to loop
            };
            const interval = parseExpression(reminder.cronRule, options);
            
            // Loop through ALL occurrences in this month
            while (interval.hasNext()) {
                const date = interval.next().toDate();
                reminderData.push({
                    date: date.toISOString().split('T')[0],
                    type: reminder.reminderType
                });
            }
        } catch (err) {
            console.error(`Invalid cron rule for reminder ${reminder._id}: ${err.message}`);
        }
    }

    // --- 4. Combine and Send ---
    const calendarData = {
        incidentMarkers: incidentData,
        reminderMarkers: reminderData
    };

    return res
        .status(200)
        .json(new ApiResponse(200, calendarData, "Calendar data fetched successfully"));
});

//upto above we don't need any data right ??
//we just need reminder._id which is stored in some date 
//

// const getRemindersOnSomeDate = asyncHandler(async (req,res)=>{
//     //when we click on some date 
//     //we will see a new small screen on that we will see 
//     //the titles of all reminders 
//     //when we click that we will see some description 
//     //which will be sent to the user via email or push notification 
//     //let say we clicked some reminder 
//     //then we will have some options 
//     //case - 1 if it's periodic 
//     //
// })


const getDetailsForDay = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // 1. Get the specific date from the query
    const { date } = req.query; // e.g., "2025-11-20"
    if (!date) {
        throw new ApiError(400, "A 'date' query parameter is required (YYYY-MM-DD).");
    }

    // 2. Create a 24-hour date range for that day
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    // 3. Fetch high-severity incidents for that day
    const incidents = await IncidentLog.find({
        owner: userId,
        severity: 2, // 2: High, 3: Very High
        createdAt: { $gte: dayStart, $lte: dayEnd }
    });

    // 4. Fetch reminders for that day (this is the tricky part)
    
    // 4a. Find one-time reminders for the day
    const oneTimeReminders = await Reminder.find({
        userId: userId,
        reminderType: { $in: ['manual', 'scheduled'] },
        remindAt: { $gte: dayStart, $lte: dayEnd }
    });

    // 4b. Find periodic reminders that run on this day
    const periodicReminders = await Reminder.find({
        userId: userId,
        reminderType: 'periodic'
    });

    const finalPeriodicReminders = [];
    for (const reminder of periodicReminders) {
        try {
            const options = {
                startDate: dayStart,
                endDate: dayEnd,
                iterator: true
            };
            const interval = parseExpression(reminder.cronRule, options);
            
            // If it has at least one occurrence today, add it to the list
            if (interval.hasNext()) {
                // We add the *full* reminder object
                finalPeriodicReminders.push(reminder);
            }
        } catch (err) {
            console.error(`Invalid cron rule for reminder ${reminder._id}: ${err.message}`);
        }
    }

    // 5. Combine and Send
    const dayData = {
        incidents: incidents,
        reminders: [
            ...oneTimeReminders,
            ...finalPeriodicReminders
        ]
    };

    return res
        .status(200)
        .json(new ApiResponse(200, dayData, "Details for day fetched successfully"));
});

const addManualReminder = asyncHandler(async (req,res)=>{
    // 1. Get data from the body
    // 'remindAt' is the specific date the user clicked (e.g., "2025-11-20T10:30:00Z")
    // 'reminderType' will be 'manual' or 'scheduled'
    const { category, title, description, remindAt, reminderType, externalUrl, associatedIncident } = req.body;

    // 2. Validation
    if (!category || !title || !description || !remindAt || !reminderType) {
        throw new ApiError(400, "Category, title, description, remindAt, and reminderType are required.");
    }

    if (reminderType === 'periodic') {
        throw new ApiError(400, "Please use the 'periodic reminder' form for this type.");
    }

    // 3. Create the reminder
    const reminder = await Reminder.create({
        userId: req.user._id,
        reminderType, // 'manual' or 'scheduled'
        category,
        title,
        description,
        remindAt: new Date(remindAt), // Ensure it's a Date object
        externalUrl,
        associatedIncident,
        status: 'pending'
    });

    // 4. Send response
    return res
        .status(201)
        .json(new ApiResponse(201, reminder, "Reminder created successfully"));

})

const updateReminder = asyncHandler(async (req,res)=>{
    // We get the reminder's ID from the URL parameters
    const { reminderId } = req.params;

    // We get the new data from the body
    const { category, title, description, remindAt, cronRule, externalUrl, associatedIncident, status } = req.body;

    // 1. Find the reminder and make sure it belongs to the user
    const reminder = await Reminder.findOne({
        _id: reminderId,
        userId: req.user._id
    });

    if (!reminder) {
        throw new ApiError(404, "Reminder not found.");
    }

    // 2. Build the update object dynamically
    // We only update fields that are provided in the request
    const updateData = {};
    if (category) updateData.category = category;
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (status) updateData.status = status;
    if (externalUrl) updateData.externalUrl = externalUrl;
    if (associatedIncident) updateData.associatedIncident = associatedIncident;

    // 3. Handle specific date/rule updates
    if (reminder.reminderType === 'periodic') {
        if (cronRule) {
            // Validate the new cron rule
            try {
                parseExpression(cronRule);
                updateData.cronRule = cronRule;
            } catch (err) {
                throw new ApiError(400, `Invalid cronRule format: ${err.message}`);
            }
        }
    } else {
        // For 'manual' or 'scheduled', we update 'remindAt'
        if (remindAt) updateData.remindAt = new Date(remindAt);
    }
    
    // 4. Perform the update
    const updatedReminder = await Reminder.findByIdAndUpdate(
        reminderId,
        { $set: updateData },
        { new: true } // This option returns the *newly updated* document
    );

    return res
        .status(200)
        .json(new ApiResponse(200, updatedReminder, "Reminder updated successfully"));

})

const deleteReminder = asyncHandler(async (req,res)=>{
    const { reminderId } = req.params;

    // 1. Find the reminder and make sure it belongs to the user
    const reminder = await Reminder.findOne({
        _id: reminderId,
        userId: req.user._id
    });

    if (!reminder) {
        throw new ApiError(404, "Reminder not found.");
    }

    // 2. Delete it
    await Reminder.findByIdAndDelete(reminderId);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Reminder deleted successfully"));

})



export {
    getFilteredReminders,
    addPeriodicReminder,
    getCalendarMonthData,
    getDetailsForDay,
    addManualReminder,
    updateReminder,
    deleteReminder
}