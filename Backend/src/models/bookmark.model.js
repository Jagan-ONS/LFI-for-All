import mongoose, { Schema } from "mongoose";

const bookmarkSchema = new Schema(
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

// This ensures a user can't bookmark the same post twice
// bookmarkSchema.index({ logId: 1, userId: 1 }, { unique: true });
// we can remove the bookmarked log from the db is it's already in the
// dp like toggleing 
export const Bookmark = mongoose.model("Bookmark", bookmarkSchema);