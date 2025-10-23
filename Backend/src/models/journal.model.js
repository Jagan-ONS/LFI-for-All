import mongoose, { Schema } from "mongoose";

const journalSchema = new Schema(
    {
        type: {
            type: String,
            enum: ['daily', 'weekly', 'monthly', 'yearly', 'singleLine', 'project'],
            default: 'daily'
        },
        isProtected: { 
            type: Boolean,
            default: false
        },
        passwordHash: { 
            type: String
        },
        entryDate: {
            type: Date,
            required: true
        },
        description: {
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

export const Journal = mongoose.model("Journal", journalSchema);