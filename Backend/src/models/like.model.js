import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
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
//pagiante ??

//aggrigate paginate 
//do we ever use aggreagate paginate 
//our app don't have a functionality of viewing who liked this just like yt 
//but if in future we want 

likeSchema.plugin(mongooseAggregatePaginate);

export const Like = mongoose.model("Like", likeSchema);
