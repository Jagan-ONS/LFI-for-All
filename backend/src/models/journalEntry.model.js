import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

/**
 * @description Represents a single Journal Entry (a "Page").
 * Each entry belongs to one Journal.
 */
const journalEntrySchema = new Schema(
    {
        journalId: { // Link to the "Book"
            type: Schema.Types.ObjectId,
            ref: "Journal",
            required: true,
            index: true
        },
        userId: { // Denormalized for easy queries
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        entryDate: { // The date this entry is for
            type: Date,
            required: true
        },
        description: { // The content
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

// Ensures a user can only have one entry, per journal, per day
journalEntrySchema.index({ journalId: 1, entryDate: 1 }, { unique: true });

journalEntrySchema.plugin(mongoosePaginate);

export const JournalEntry = mongoose.model("JournalEntry", journalEntrySchema);