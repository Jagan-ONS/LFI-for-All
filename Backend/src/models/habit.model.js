import mongoose, { Schema } from "mongoose";

const habitSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String
        },
        minTime: { 
            type: Number,
            default: 0
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        }
    },
    {
        timestamps: true
    }
);

export const Habit = mongoose.model("Habit", habitSchema);