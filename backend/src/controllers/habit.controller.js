import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Habit } from "../models/habit.model.js";
import { HabitLog } from "../models/habitLog.model.js";

/**
 * @description Get all data needed to render the habit grid for a specific month.
 * @route GET /api/v1/habits/month-data?year=2025&month=11
 */
export const getHabitPageData = asyncHandler(async (req, res) => {
    const { year, month } = req.query; // month is 1-indexed (Jan=1)
    const userId = req.user._id;

    if (!year || !month) {
        throw new ApiError(400, "Year and month query parameters are required.");
    }

    // --- 1. Calculate Date Range ---
    // JS Date month is 0-indexed (Jan=0), so we subtract 1
    const monthIndex = parseInt(month) - 1;
    const yearNum = parseInt(year);

    const startDate = new Date(yearNum, monthIndex, 1, 0, 0, 0);
    const endDate = new Date(yearNum, monthIndex + 1, 0, 23, 59, 59);

    // --- 2. Fetch Habits (Columns) ---
    // Find all habits that were created *before* the end of this month.
    // This correctly includes habits from previous months.
    const habits = await Habit.find({
        userId,
        createdAt: { $lte: endDate , $gte : startDate } 
    }).sort({ createdAt: 1 }); // Oldest habits first

    // --- 3. Fetch Logs (Cells) ---
    // Find all logs that fall within this month.
    // This is the "fetch all" strategy you correctly identified.
    const logs = await HabitLog.find({
        userId,
        logDate: { $gte: startDate, $lte: endDate }
    });

    // --- 4. Send Both ---
    const pageData = {
        habits, // The list of habits for the top row
        logs    // The list of all log entries for the cells
    };

    return res
        .status(200)
        .json(new ApiResponse(200, pageData, "Habit page data fetched successfully"));
});

/**
 * @description Create a new habit (a new "column").
 * @route POST /api/v1/habits
 */
export const createHabit = asyncHandler(async (req, res) => {
    const { name, description, minTime } = req.body;

    if (!name) {
        throw new ApiError(400, "Habit name is required.");
    }

    const habit = await Habit.create({
        name,
        description,
        minTime,
        userId: req.user._id
        // 'createdAt' will be set to *now*. This is correct.
        // Your frontend logic will know not to show "red boxes"
        // for dates before this habit's createdAt.
    });

    return res
        .status(201)
        .json(new ApiResponse(201, habit, "Habit created successfully"));
});

/**
 * @description Create or Update a habit log (fills a "cell").
 * This is an "upsert" operation.
 * @route POST /api/v1/habits/log
 */
export const logHabit = asyncHandler(async (req, res) => {
    const { habitId, logDate, description, timeSpent } = req.body;
    const userId = req.user._id;

    if (!habitId || !logDate || timeSpent === undefined) {
        throw new ApiError(400, "habitId, logDate, and timeSpent are required.");
    }

    // 1. Verify this user owns the parent habit
    const habit = await Habit.findOne({ _id: habitId, userId });
    if (!habit) {
        throw new ApiError(404, "Habit not found or you do not have permission.");
    }

    // 2. Normalize the date to the start of the day (in UTC)
    // This ensures your unique index {habitId, logDate, userId} works correctly.
    const date = new Date(logDate);
    date.setUTCHours(0, 0, 0, 0);

    // 3. Find and Upsert
    const filter = {
        habitId,
        userId,
        logDate: date
    };

    const update = {
        description,
        timeSpent: Number(timeSpent)
    };

    const options = {
        new: true,    // Return the new/updated document
        upsert: true  // Create it if it doesn't exist
    };

    const habitLog = await HabitLog.findOneAndUpdate(filter, update, options);

    return res
        .status(200)
        .json(new ApiResponse(200, habitLog, "Habit logged successfully"));
});

/**
 * @description Deletes a single habit log (clears a "cell").
 * @route DELETE /api/v1/habits/log/:logId
 */
export const deleteHabitLog = asyncHandler(async (req, res) => {
    const { logId } = req.params;

    const log = await HabitLog.findOneAndDelete({
        _id: logId,
        userId: req.user._id // Security check: Can only delete your own logs
    });

    if (!log) {
        throw new ApiError(404, "Log not found or you do not have permission.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Habit log deleted."));
});

/**
 * @description Updates the details of a Habit (the "column").
 * @route PATCH /api/v1/habits/:habitId
 */
export const updateHabit = asyncHandler(async (req, res) => {
    const { habitId } = req.params;
    const { name, description, minTime } = req.body;

    if (!name && !description && minTime === undefined) {
        throw new ApiError(400, "At least one field (name, description, minTime) is required.");
    }
    
    // Build update object
    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (minTime !== undefined) updateData.minTime = Number(minTime);

    const habit = await Habit.findOneAndUpdate(
        { _id: habitId, userId: req.user._id }, // Filter: Find by ID and check ownership
        { $set: updateData },
        { new: true } // Return the updated document
    );

    if (!habit) {
        throw new ApiError(404, "Habit not found or you do not have permission.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, habit, "Habit updated successfully"));
});

/**
 * @description Deletes a Habit (the "column") and ALL its logs.
 * @route DELETE /api/v1/habits/:habitId
 */
export const deleteHabit = asyncHandler(async (req, res) => {
    const { habitId } = req.params;

    // 1. Find and delete the habit, while checking ownership
    const habit = await Habit.findOneAndDelete({
        _id: habitId,
        userId: req.user._id
    });

    if (!habit) {
        throw new ApiError(404, "Habit not found or you do not have permission.");
    }

    // 2. Cascade Delete: Delete all logs associated with this habit
    await HabitLog.deleteMany({ habitId: habitId, userId: req.user._id });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Habit and all its logs deleted successfully."));
});