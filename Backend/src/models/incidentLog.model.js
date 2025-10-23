import mongoose, { Schema } from "mongoose";

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
            type: String,
            required: true,
            enum: ['Medium', 'High', 'Very High'],
            default: 'Medium'
        },
        isPublic: {
            type: Boolean,
            default: false
        },
        doneBad: { // "what have we done wrong"
            type: String
        },
        learnings: { // "what we should have done"
            type: String,
            required: true
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
    }
);

export const IncidentLog = mongoose.model("IncidentLog", incidentLogSchema);