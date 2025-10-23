import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema(
    {
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

// This ensures a user can't like the same post twice
// likeSchema.index({ logId: 1, userId: 1 }, { unique: true });

export const Like = mongoose.model("Like", likeSchema);