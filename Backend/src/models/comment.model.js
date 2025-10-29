import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
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

//do we fetch some comments ?? 
//when we want to fetch comments of a perticular log 
//we use aggregation , if we click a video/log there will be 
//many comments associated with that video, we have to show 
//them we can do this by mathcing the required logId 
commentSchema.plugin(mongoosePaginate)
export const Comment = mongoose.model("Comment", commentSchema);
