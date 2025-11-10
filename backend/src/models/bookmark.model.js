import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const bookmarkSchema = new Schema(
    {
        log: {
            type: Schema.Types.ObjectId,
            ref: "IncidentLog",
            required: true
        },
        user: {
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

//is pagination required ??
//are there any places we will do a simple query on bookmark collection?
//do we search in bookmark collection ?? no 

//is aggregate-paginate required ??
//it is required because if we want to fetch all the bookmarked logs of an user 
//we have to aggregate the details of bookmarked logs and we have to presnt them to the user 

bookmarkSchema.plugin(mongooseAggregatePaginate)
export const Bookmark = mongoose.model("Bookmark", bookmarkSchema);
