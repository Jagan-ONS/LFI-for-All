import mongoose, { Schema } from "mongoose";

const habitLogSchema = new Schema(
    {
        description: {
            type: String
        },
        timeSpent: {
            type: Number,
            required: true
        },
        logDate: { 
            type: Date,
            required: true
        },
        habitId: {
            type: Schema.Types.ObjectId,
            ref: "Habit",
            required: true
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

// Ensures a user can only log a habit once per day
habitLogSchema.index({ habitId: 1, logDate: 1 }, { unique: true });


export const HabitLog = mongoose.model("HabitLog", habitLogSchema);