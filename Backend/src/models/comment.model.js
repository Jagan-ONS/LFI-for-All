import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema(
    {
        description: {
            type: String,
            required: true
        },
        logId: {
            type: Schema.Types.ObjectId,
            ref: "IncidentLog",
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

export const Comment = mongoose.model("Comment", commentSchema);