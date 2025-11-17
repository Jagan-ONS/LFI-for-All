import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { IncidentLog } from "../models/incidentLog.model.js";
import { Follower } from "../models/follower.model.js";
import { JournalEntry } from "../models/journalEntry.model.js";

/**
 * @description
 * Gets the header stats for the profile page.
 * Fetches user details, follower/following counts, and incident stats
 * (grouped by category and severity) in parallel.
 * @route GET /api/v1/profile/header
 */
export const getProfileHeader = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // We run all these database queries in parallel for maximum speed
    const [
        // 1. Get User Details
        userDetails,
        
        // 2. Get Follower Count (People who follow the user)
        followerCount,
        
        // 3. Get Following Count (People the user follows)
        followingCount,
        
        // 4. Get Incident Stats (grouped by category and severity)
        // This will be an array, we'll take the first element
        incidentStats
    ] = await Promise.all([
        User.findById(userId).select("username avatar bio createdAt"),
        Follower.countDocuments({ following: userId }),
        Follower.countDocuments({ follower: userId }),
        IncidentLog.aggregate([
            // Find all logs for this user
            { $match: { owner: userId } },
            
            // $facet lets us run two *separate* aggregations in parallel
            {
                $facet: {
                    // First aggregation: Group by category
                    byCategory: [
                        { $group: { _id: "$category", count: { $sum: 1 } } },
                        { $sort: { count: -1 } },
                        { $project: { category: "$_id", count: 1, _id: 0 } }
                    ],
                    // Second aggregation: Group by severity
                    bySeverity: [
                        { $group: { _id: "$severity", count: { $sum: 1 } } },
                        { $project: { severity: "$_id", count: 1, _id: 0 } },
                        { $sort: { severity: 1 } }
                    ]
                }
            }
        ])
    ]);

    // The final combined data object
    const profileHeaderData = {
        userDetails,
        followerCount,
        followingCount,
        // incidentStats is an array [ { byCategory: [], bySeverity: [] } ]
        // We just want the object inside
        stats: incidentStats[0] 
    };

    return res
        .status(200)
        .json(new ApiResponse(200, profileHeaderData, "Profile header data fetched successfully"));
});


/**
 * @description
 * Gets data for the timeline graph (v1: Incidents only).
 * Fetches a list of incident counts grouped by date, and a separate
 * list of high-severity incident dates for "red dots".
 * @route GET /api/v1/profile/timeline?category=contest
 */
export const getProfileTimelineGraph = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { category } = req.query;

    // --- 1. Build Base Filter ---
    // This filter applies to all our queries
    const baseMatch = { 
        owner: userId 
    };

    if (category) {
        baseMatch.category = category.toLowerCase();
    }

    // --- 2. Run Queries in Parallel ---
    const [
        // Query A: Get the data for the main plot (date, count)
        incidentPlot,
        
        // Query B: Get the dates for the "red dots" (severity 3)
        highSeverityIncidents
    ] = await Promise.all([
        // Query A: Aggregate incidents by date
        IncidentLog.aggregate([
            { $match: baseMatch },
            {
                // Project the 'createdAt' to just the Date part (YYYY-MM-DD)
                $project: {
                    dateOnly: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
                }
            },
            {
                // Group by that date and count
                $group: {
                    _id: "$dateOnly",
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }, // Sort chronologically
            { $project: { date: "$_id", count: 1, _id: 0 } } // Clean up output
        ]),

        // Query B: Find all sev 3 incidents
        IncidentLog.find({
            ...baseMatch,
            severity: 3
        }).select("createdAt") // Only select the date
    ]);

    // Post-processing for Query B: Get a unique list of dates
    const highSeverityDates = [
        ...new Set( // Use a Set to automatically handle duplicates
            highSeverityIncidents.map(incident => 
                incident.createdAt.toISOString().split('T')[0] // Format as YYYY-MM-DD
            )
        )
    ];
    
    // --- 3. Combine and Send ---
    const graphData = {
        incidentPlot,
        highSeverityDots: highSeverityDates
    };

    return res
        .status(200)
        .json(new ApiResponse(200, graphData, "Timeline data fetched successfully"));
});


/**
 * @description
 * Gets data for the GitHub-style heatmap.
 * Returns an object where keys are dates (YYYY-MM-DD) and
 * values are the "highest activity level" for that day.
 * Levels: 3 (Sev 3), 2 (Sev 2), 1 (Sev 1), 0 (Journal)
 * @route GET /api/v1/profile/heatmap?year=2025
 */
export const getProfileHeatmap = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { year } = req.query;

    if (!year) {
        throw new ApiError(400, "A 'year' query parameter is required.");
    }

    // --- 1. Create Date Range for the Year ---
    const yearNum = parseInt(year);
    const startDate = new Date(yearNum, 0, 1); // Jan 1st
    const endDate = new Date(yearNum, 11, 31, 23, 59, 59); // Dec 31st

    // --- 2. Run the Main Aggregation ---
    // This query is complex. It finds all incidents, assigns them a level (1, 2, or 3),
    // then *unions* them with all journal entries (assigned level 0),
    // then groups by date to find the *highest* level for that day.
    
    const activityLevels = await IncidentLog.aggregate([
        // Stage 1: Find all Incidents for the user in that year
        {
            $match: {
                owner: userId,
                createdAt: { $gte: startDate, $lte: endDate }
            }
        },
        // Stage 2: Project them into the shape we need
        {
            $project: {
                _id: 0,
                date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                level: "$severity" // This is already a number (1, 2, or 3)
            }
        },
        
        // Stage 3: (The Magic) Union this data with Journal Entries
        {
            $unionWith: {
                coll: "journalentries", // The *collection* name
                pipeline: [
                    // Find all journals for this user in that year
                    {
                        $match: {
                            userId: userId,
                            entryDate: { $gte: startDate, $lte: endDate }
                        }
                    },
                    // Project them into the *same shape*
                    {
                        $project: {
                            _id: 0,
                            date: { $dateToString: { format: "%Y-%m-%d", date: "$entryDate" } },
                            level: { $literal: 0 } // Journals are level 0
                        }
                    }
                ]
            }
        },

        // At this point, we have a big list like:
        // [ { date: "2025-10-01", level: 3 },
        //   { date: "2025-10-01", level: 0 }, ... ]
        
        // Stage 4: Group by date and find the highest level
        {
            $group: {
                _id: "$date",
                maxLevel: { $max: "$level" }
            }
        }
    ]);

    // --- 3. Convert Array to Object (Map) ---
    // The frontend wants an object for fast lookups, not an array.
    // e.g., { "2025-10-01": 3, "2025-10-02": 1 }
    const heatmapData = activityLevels.reduce((acc, day) => {
        acc[day._id] = day.maxLevel;
        return acc;
    }, {});

    return res
        .status(200)
        .json(new ApiResponse(200, heatmapData, "Profile heatmap data fetched successfully"));
});