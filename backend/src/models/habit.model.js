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
            //this is the minimum focused time i should work on this habbit
            //this will be usefull for the analysys part in version 2 or 3 
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
//do i have to use aggrigate also ??
//i only do one query which is getting all these habbits of perticular month
//so no need of aggregations
//do i need pagination ??

export const Habit = mongoose.model("Habit", habitSchema);
