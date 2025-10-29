import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true 
        },
        stripeCustomerId: {
            type: String,
            required: true,
            unique: true
        },
        subscriptionStatus: {
            type: String,
            enum: ['active', 'canceled', 'incomplete', 'past_due', 'unpaid'],
            required: true
        },
        currentPeriodEnd: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
