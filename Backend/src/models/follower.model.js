import mongoose, { Schema } from "mongoose";

const followerSchema = new Schema(
    {
        followingId: { // The person being followed
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        followerId: { // The person who is following
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

// This ensures you can't follow the same person twice
// followerSchema.index({ followingId: 1, followerId: 1 }, { unique: true });

export const Follower = mongoose.model("Follower", followerSchema);