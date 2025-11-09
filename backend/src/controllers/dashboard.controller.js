//this holds the functionalities of main page 

import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import { User } from "../models/user.model.js";
import { IncidentLog } from "../models/incidentLog.model.js";
import { Follower } from "../models/follower.model.js"; 
import { Reminder } from "../models/reminder.model.js";
import { HabitLog } from "../models/habitLog.model.js";
import { Journal } from "../models/journal.model.js";
// You will likely need a 'Insight' model for "top 5 things": { owner: userId, insights: [String] }
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";

//left part 
// const getDashboardFeed = asyncHandler(async (req,req) => {
//     //we need some 10 incident cards which shouws the basic details of that log
//     const { page =1 , limit =10} = req.query

//     pageNum = parseInt(page)
//     limitNum = parseInt(limit)

//     const userId = req.user._id
//     //fetch all the users the cur is user is following , that means we have to find
//     //all the documents in which follwer : userId
//     const followingList = await Follower.find({follower : userId}).select("following") 
//     //this will be an array of object [{id : 1},{id : 2}]
    
//     //we will make an array of id from the objects 
//     //we can use .map()
//     const followingIds = followingList.map((item)=>{return item.following})
//     const logsList = await IncidentLog
//     .find({
//         owner : { $in : followingIds }
//     })
//     .populate("owner","avatar username")
//     .sort({createdAt : -1})
//     .skip((pageNum-1)*limitNum)
//     .limit(limitNum)
//     //if we just use .populate("owner") then we will get the whole user document inpalce of 
//     //owner feild so we user .populate("owner","avatar username") this replace the owner feild 
//     //in the documents with avatar and username name of that owner from User model

//     return res
//     .status(200)
//     .json( new ApiResponse(200,logsList,"logs fetched successfully.."))
// })

const getFeed = asyncHandler(async (req, res) => {
    
    
    const { page = 1, limit = 10 } = req.query;
    const limitNum = parseInt(limit);
    const skip = (page - 1) * limitNum;
    const userId = req.user._id;

    
    const followingList = await Follower.find({ follower: userId }).select("following");
    
    const followingIds = followingList.map(item => mongoose.Types.ObjectId(item.following));
    
    const feed = await IncidentLog.aggregate([
        {
            $match: {
                owner: { $ne: userId }, 
                isPrivate: { $ne: true } 
            }
        },
        {
            $addFields: {
                priority: {
                    $in: ["$owner", followingIds] 
                }
            }
        },
        {
            $sort: {
                priority: -1,   
                createdAt: -1   
            }
        },
        { $skip: skip },
        { $limit: limitNum },
        {
            $lookup: {
                from: "likes", 
                localField: "_id", 
                foreignField: "logId", 
                as: "likesArray" 
            }
        },
        {
            $lookup: {
                from: "comments", 
                localField: "_id",
                foreignField: "logId",
                as: "commentsArray"//array of documents not just the ids
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        // $unwind is necessary because $lookup always creates an array.
        // We assume an owner always exists, so we don't need 'preserveNullAndEmptyArrays'
        {
            $unwind: "$ownerDetails"
        },
        {
            $project: {
                title: 1,
                description: 1,
                tags: 1,
                createdAt: 1,
                likesCount: { $size: "$likesArray" },
                commentsCount: { $size: "$commentsArray" },
                owner: {
                    _id: "$ownerDetails._id",
                    username: "$ownerDetails.username",
                    avatar: "$ownerDetails.avatar"
                }
                //creating a new owner object
            }
        }
    ]);
    return res
        .status(200)
        .json(new ApiResponse(200, feed, "Feed fetched successfully"));
});


//top 5 things to keep in mind 
//some ai summarizer will give this 
//based on our logs

//after this query we should have array of objects where each 
//object contains context and array of learning from this context 

//how to show this 
//should i show this some context wise or 
//whole top 5 things to keep in mind 
//it's better to show them context wise

const getTopInsights = asyncHandler(async (req, res) => {
    
    const allUserCategories = await IncidentLog.distinct("category", {
        owner: req.user._id
    });

    // If user has no logs, we can't show insights
    if (!allUserCategories || allUserCategories.length === 0) {
        return res
            .status(200)
            // Return an empty array, which is correct for a carousel
            .json(new ApiResponse(200, [], "Not enough data for insights. Start logging incidents!"));
    }

    // This will hold our final array of insight objects
    const allInsights = [];

    
    // We use a for...of loop to allow 'await' inside
    for (const contextName of allUserCategories) {
        
        // This pipeline finds the *most impactful* insights for that one category
        const topLearningsPipeline = [
            // 1. Find all logs for this user that match the category
            { 
                $match: { 
                    owner: req.user._id, 
                    // Match the category case-insensitively
                    category: contextName, 
                } 
            },
            // 3. Sort by most severe, then by most recent
            { $sort: { severity: -1, createdAt: -1 } },

            // 4. Get the Top 5 insights for this category
            { $limit: 5 },

            // 5. Project to a clean output shape for the frontend
            {
                $project: {
                    // _id: 0, // Don't include the log's _id
                    // title: "$title",
                    learning: "$learnings", // The main insight
                    // mistake: "$doneBad",  // The associated mistake
                    // severity: "$severity",
                    incidentId: "$_id" // Send the ID in case they want to click
                }
            }
        ];

        const topLearnings = await IncidentLog.aggregate(topLearningsPipeline);

        // Combine into a single object and add to our array
        allInsights.push({
            context: contextName,
            insights: topLearnings 
        });
    }

    return res
        .status(200)
        .json(new ApiResponse(200, allInsights, "Top insights fetched successfully"));
});


const getMostLikedIncidents = asyncHandler(async (req, res) => {
    const {page = 1,limit = 10} = req.query
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)

    const topIncidents = await Like.aggregate([
        { $group: { _id: "$logId", likesCount: { $sum: 1 } } },
        { $sort: { followersCount: -1 } },
        { $skip : (pageNum-1)*limitNum},
        { $limit : limitNum},
        {
            $lookup: {
                from: "incidentlogs",
                localField: "_id",
                foreignField: "_id",
                as: "incident"
            }
        },
        { $unwind: "$incident" },
        {
            $project: {
                _id: "$incident._id",
                title: "$incident.title",
                category : "$incident.category",
                severity : "$incident.severity",
                likesCount: 1
            }
        }
    ]);

    return res
    .status(200)
    .json(new ApiResponse(200, topIncidents, "Top incidents with most likes fetched successfully"));
});

const getMostFollowedUsers = asyncHandler(async (req, res) => {
    const {page = 1,limit = 10} = req.query
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)

    const topUsers = await Follower.aggregate([
        { $group: { _id: "$following", followersCount: { $sum: 1 } } },
        { $sort: { followersCount: -1 } },
        { $skip : (pageNum-1)*limitNum},
        { $limit : limitNum},
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "user"
            }
        },
        { $unwind: "$user" },
        {
            $project: {
                _id: "$user._id",
                username: "$user.username",
                avatar: "$user.avatar",
                followersCount: 1
            }
        }
    ]);

    return res
    .status(200)
    .json(new ApiResponse(200, topUsers, "Top users with most followers fetched successfully"));
});

const getNearestReminders = asyncHandler(async (req, res) => {
    const now = new Date();
    const userId = req.user._id;

    // 1. Fetch all 'pending' reminders that are *relevant*
    // This includes all 'periodic' ones and any one-time
    // reminders that haven't happened yet.
    const allReminders = await Reminder.find({
        userId: userId,
        status: 'pending',
        $or: [
            // A) It's a periodic reminder (we must calculate its next date)
            { reminderType: 'periodic' },
            
            // B) It's a one-time reminder set for the future
            { 
                reminderType: { $in: ['manual', 'scheduled'] },
                remindAt: { $gte: now } 
            }
        ]
    });

    const allUpcomingOccurrences = [];

    // 2. Calculate the *next* occurrence for each reminder
    for (const reminder of allReminders) {
        if (reminder.reminderType === 'manual' || reminder.reminderType === 'scheduled') {
            
            // For one-time reminders, the date is simple
            allUpcomingOccurrences.push({
                reminder: reminder.toObject(), // .toObject() cleans the Mongoose doc
                nextOccurrence: reminder.remindAt 
            });

        } else if (reminder.reminderType === 'periodic') {
            
            // For periodic, we must calculate the next date
            try {
                const interval = parseExpression(reminder.cronRule, { currentDate: now });
                const nextDate = interval.next().toDate();
                allUpcomingOccurrences.push({
                    reminder: reminder.toObject(),
                    nextOccurrence: nextDate 
                });
            } catch (err) {
                // This catches bad cron rules
                console.error(`Invalid cron rule for reminder ${reminder._id}: ${err.message}`);
            }
        }
    }

    // 3. Sort the combined list by the calculated date (nearest first)
    allUpcomingOccurrences.sort((a, b) => {
        return a.nextOccurrence.getTime() - b.nextOccurrence.getTime();
    });

    // 4. Get the top 3
    // const nearestReminders = allUpcomingOccurrences.slice(0, 3);
    //or we can paginate this 

    return res
        .status(200)
        .json(new ApiResponse(200, allUpcomingOccurrences, "Nearest 3 reminders fetched"));
});

const getRecentLogs = asyncHandler(async (req,res) => {
    //so that i can show the titles of them as recent actions 

})

const getQuickInsights = asyncHandler(async(req,res) => {
    //if enter some category we will get the quick insigts of that category 
    //this will just send the data, how it is shown is done by frontend 
})

export {
    getFeed,
    getMostFollowedUsers,
    getMostLikedIncidents,
    getNearestReminders,
    getTopInsights,
    getMostFollowedUsers,
    getRecentLogs,
    getQuickInsights
}

