import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2"

const habitSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        // month : {
        //     type : Number,
        //     required : true
        // },
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
        // i have to get month from this in the backend 
    }
);

//we query this along with the month 
//so we will get at max 7 8 habbits which we are doing in that month
habitSchema.plugin(mongoosePaginate)

export const Habit = mongoose.model("Habit", habitSchema);
