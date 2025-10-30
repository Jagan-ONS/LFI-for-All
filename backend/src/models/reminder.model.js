import mongoose, { Schema } from "mongoose"

const reminderSchema = new Schema(
    {
        title: {
            type: String,
            required: true
        },
        description: { // The manual or AI-generated summary
            type: String,
            required: true
        },
        reminderType: {
            type: String,
            enum: ['periodic', 'scheduled', 'manual'],
            required: true
        },
        scheduledAt: {
            type: Date,
        },
        // cronRule: { // e.g., "0 9 * * 1" for 9am every Monday
        //     type: String, // Used for 'periodic'
        //     sparse: true
        // },
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

//in this we will query for are there any reminders todays
//we may have atmax have 10 may be 20 reminders we don't need pagination for this
// 

export const Reminder = mongoose.model("Reminder", reminderSchema);
