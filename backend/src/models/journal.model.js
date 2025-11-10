import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const journalSchema = new Schema(
    {
        type: {
            type: String,
            enum: ['daily', 'weekly', 'monthly','singleLine', 'project'],
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

//we can see previous days journal
//if i write any query to get all journals of a page we need to paginate
//else if i write queries like the journal of a user on some date we don't need it 
//lets just add paginate eventhough we don't use it for now 
journalSchema.plugin(mongoosePaginate)

export const Journal = mongoose.model("Journal", journalSchema);
