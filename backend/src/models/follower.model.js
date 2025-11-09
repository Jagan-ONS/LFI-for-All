import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const followerSchema = new Schema(
    {
        following: { // The person being followed
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        follower: { // The person who is following
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

//do we have to use paginate 
//

//do we have to use aggregate-paginate 
//while fetching the details of the followers of some users we
//don't just want the id's of the followers we need their profiles
//and user names so we aggregate from fllowerSchema and match with 
//userId and lookup in userSchema for profile and username 
followerSchema.plugin(mongooseAggregatePaginate)
export const Follower = mongoose.model("Follower", followerSchema);

//in user model we are using just paginate 
//if we try to search for some name , how is this implemented 
//this is some good thing to learn 
//if we search by name how are we getting all the results 
