import mongoose, { Schema } from "mongoose";

const reminderSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        reminderType: {
            type: String,
            enum: ['periodic', 'scheduled', 'manual'],
            required: true
        },
        
        // "contest", "interview", "speech", "monthly summary"
        category: {
            type: String,
            required: true,
            trim: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: { // The manual or AI-generated summary
            type: String,
            required: true,
            trim: true
        },
        
        // --- Fields for different reminder types ---

        // For 'manual' and 'scheduled' types (one-time)
        remindAt: {
            type: Date,
            // This is not required for 'periodic' reminders
            sparse: true 
        },
        
        // For 'periodic' type
        cronRule: { // e.g., "0 9 * * 1" (9am every Monday), "0 8 1 * *" (8am on the 1st of every month)
            type: String, 
            sparse: true
        },

        // NEW: For 'scheduled' type (e.g., Google Meet, LeetCode contest link)
        externalUrl: {
            type: String,
            trim: true
        },

        // NEW: For 'manual' type (e.g., to review a specific incident)
        associatedIncident: {
            type: Schema.Types.ObjectId,
            ref: "IncidentLog"
        },
        
        // NEW: To track if a reminder has been seen
        status: {
            type: String,
            enum: ['pending', 'dismissed'],
            default: 'pending'
        }
    },
    {
        timestamps: true
    }
);

export const Reminder = mongoose.model("Reminder", reminderSchema);

//in this we will query for are there any reminders todays
//we may have atmax have 10 may be 20 reminders we don't need pagination for this
// 

