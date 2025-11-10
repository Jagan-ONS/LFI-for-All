import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { IncidentLog } from "../models/incidentLog.model.js";
import { Bookmark } from "../models/bookmark.model.js";

/**
 * @description Get all incident logs for the logged-in user with pagination, filtering, and search.
 * @route GET /api/v1/incidents
 * @query page, limit, search, category, severity, sortBy, sortOrder
 */
const getAllIncidents = asyncHandler(async (req, res) => {
    // --- 1. Get query params ---
    const {
        page = 1,
        limit = 10,
        search,
        category,
        severity,
        sortBy = "createdAt", // Default sort
        sortOrder = "desc"    // Default sort order
    } = req.query;

    // --- 2. Build the Aggregation Pipeline ---
    
    // We start an aggregation on the IncidentLog model
    // This allows us to build complex queries
    const aggregate = IncidentLog.aggregate();

    // STAGE 1: (CRITICAL) Match only logs owned by the logged-in user
    // This is the most important security filter.
    aggregate.match({
        owner: mongoose.Types.ObjectId(req.user._id)
    });

    // STAGE 2: Handle Search Query
    // If a 'search' query is provided, find it in title or description
    if (search) {
        aggregate.match({
            $or: [
                // 'i' for case-insensitive
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ]
        });
    }

    // STAGE 3: Handle Filters
    const filterMatch = {};
    if (category) {
        filterMatch.category = category.toLowerCase();
    }
    if (severity) {
        // Convert 'severity' (which is a string "1", "2", "3") to a number
        const severityNum = parseInt(severity);
        if (![1, 2, 3].includes(severityNum)) {
            throw new ApiError(400, "Invalid severity. Must be 1, 2, or 3.");
        }
        filterMatch.severity = severityNum;
    }
    // Add the filters to the pipeline (if any)
    if (Object.keys(filterMatch).length > 0) {
        aggregate.match(filterMatch);
    }

    // STAGE 4: Handle Sorting
    const sortCriteria = {};
    sortCriteria[sortBy] = sortOrder === 'asc' ? 1 : -1; // 1 for asc, -1 for desc
    aggregate.sort(sortCriteria);

    // --- 3. Execute Aggregation with Pagination ---
    
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    // 'aggregatePaginate' is a magic function from your plugin.
    // It takes our complex 'aggregate' pipeline and applies pagination to it.
    const paginatedLogs = await IncidentLog.aggregatePaginate(aggregate, options);

    // if (!paginatedLogs) {
    //     throw new ApiError(404, "No incident logs found");
    // }

    return res
        .status(200)
        .json(new ApiResponse(200, paginatedLogs, "Incident logs fetched successfully"));
});

/**
 * @description Create a new incident log.
 * @route POST /api/v1/incidents
 */
const createIncidentLog = asyncHandler(async (req, res) => {
    // 1. Get data from the form
    const { title, description, category, severity, isPublic, doneBad, learnings } = req.body;

    // 2. Validate required fields
    if (!title || !description || !category || !learnings) {
        throw new ApiError(400, "Title, description, category, and learnings are required.");
    }
    
    // 3. Create the log
    const incident = await IncidentLog.create({
        title,
        description,
        category: category.toLowerCase(),
        severity: parseInt(severity) || 1,
        isPublic: Boolean(isPublic),
        doneBad,
        learnings,
        owner: req.user._id // Attach the logged-in user as the owner
    });

    return res
        .status(201)
        .json(new ApiResponse(201, incident, "Incident log created successfully"));
});

/**
 * @description Delete an incident log.
 * @route DELETE /api/v1/incidents/:logId
 */
const deleteIncidentLog = asyncHandler(async (req, res) => {
    const { logId } = req.params;

    // 1. Check if it's a valid ID
    if (!mongoose.isValidObjectId(logId)) {
        throw new ApiError(400, "Invalid log ID");
    }

    // 2. Find the log
    const log = await IncidentLog.findById(logId);
    if (!log) {
        throw new ApiError(404, "Incident log not found");
    }

    // 3. (CRITICAL) Security check: Is this user the owner?
    if (log.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission to delete this log.");
    }

    // 4. Delete the log
    await IncidentLog.findByIdAndDelete(logId);

    // 5. (Cascade Delete) Also remove any bookmarks associated with this log
    await Bookmark.deleteMany({ logId: logId });
    
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Incident log deleted successfully"));
});

/**
 * @description Toggle a bookmark for an incident log.
 * @route POST /api/v1/incidents/toggle-bookmark/:logId
 */
const toggleBookmark = asyncHandler(async (req, res) => {
    const { logId } = req.params;
    const userId = req.user._id;

    if (!mongoose.isValidObjectId(logId)) {
        throw new ApiError(400, "Invalid log ID");
    }

    // 1. Check if the log exists and is public (or owned by user)
    const log = await IncidentLog.findById(logId);
    if (!log) {
        throw new ApiError(404, "Incident log not found");
    }
    
    if (!log.isPublic && log.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "Cannot bookmark a private log you don't own.");
    }

    // 2. Check if a bookmark *already* exists
    const existingBookmark = await Bookmark.findOne({ logId, userId });

    if (existingBookmark) {
        // 3. If it exists, remove it
        await Bookmark.findByIdAndDelete(existingBookmark._id);
        return res
            .status(200)
            .json(new ApiResponse(200, { isBookmarked: false }, "Bookmark removed"));
    } else {
        // 4. If it doesn't exist, create it
        await Bookmark.create({ logId, userId });
        return res
            .status(201)
            .json(new ApiResponse(201, { isBookmarked: true }, "Bookmark added"));
    }
});

/**
 * @description Get all logs bookmarked by the user.
 * @route GET /api/v1/incidents/bookmarked
 */
const getBookmarkedLogs = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // 1. Find all bookmark documents for the user
    const bookmarks = await Bookmark.find({ user : userId })
        .populate('log'); // <-- This is the magic!
    // .populate('logId') finds the bookmark, takes the 'logId',
    // and "populates" it with the full IncidentLog document.

    // 2. The frontend just wants the logs, not the bookmark objects
    const bookmarkedLogs = bookmarks.map(bookmark => bookmark.log).filter(log => log); 
    // .filter(log => log) removes any nulls if a log was deleted

    return res
        .status(200)
        .json(new ApiResponse(200, bookmarkedLogs, "Bookmarked logs fetched successfully"));
});

export {
    getAllIncidents,
    createIncidentLog,
    deleteIncidentLog,
    toggleBookmark,
    getBookmarkedLogs,
}