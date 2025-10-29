import mongoose, { Schema } from "mongoose";

const habitLogSchema = new Schema(
    {
        description: {
            type: String
        },
        timeSpent: {
            type: Number,
            required: true
        },
        logDate: { 
            type: Date,
            required: true
        },
        habitId: {
            type: Schema.Types.ObjectId,
            ref: "Habit",
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

// Ensures a user can only log a habit once per day
// habitLogSchema.index({ habitId: 1, logDate: 1 }, { unique: true });

//do we need paginate 
//we use this for just populating the habbit page 
//inorder to populate this we will map over all the logs and 
//we mark the block green or some thigns else 
//

//do we need aggregate-paginate 

export const HabitLog = mongoose.model("HabitLog", habitLogSchema);
//one doubt is when we use this we will fetch all docs and show some docs or 
//we will fetch only some docs and show those docs in the frontend 

//if we only fetch some docs then how can we fill the habit page ??
//so we may have to fetch all at once 
