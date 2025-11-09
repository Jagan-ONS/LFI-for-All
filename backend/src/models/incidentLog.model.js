import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const incidentLogSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true
        },
        category : {
            type : String,
            required : true,
            trim : true,
            lowercase : true,
            index : true
        },
        severity: {
            type: Number,
            required: true,
            enum: [1, 2, 3],
            default: 1
            // enum: ['Medium', 'High', 'Very High'],
            // default: 'Medium'
        },
        isPublic: {
            type: Boolean,
            default: false
        },
        doneBad: { // "what have we done wrong"
            type: String
        },
        learnings: { // "what we should have done"
            //write in such a way that this is not just related to this 
            //this will help for this type of context 
            type: String,
            required: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        }
    },
    {
        timestamps: true
    }
);

//we have to use paginate to fecthc all the logs of a user 
incidentLogSchema.plugin(mongoosePaginate)
incidentLogSchema.plugin(mongooseAggregatePaginate)
export const IncidentLog = mongoose.model("IncidentLog", incidentLogSchema);
