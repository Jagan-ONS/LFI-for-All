import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

/**
 * @description Represents a Journal (the "Book").
 * A user can have multiple journals (e.g., "Daily", "Project X").
 * This model stores the settings for the journal, including password.
 */
const journalSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        type: {
            type: String,
            enum: ['daily', 'weekly', 'monthly', 'project'],
            required: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        isProtected: { 
            type: Boolean,
            default: false
        },
        password: { 
            type: String, // Hashed password
            sparse: true
        }
    },
    {
        timestamps: true
    }
);

// --- Password Hashing ---

// Hash password before saving
journalSchema.pre("save", async function(next) {
    if (!this.isModified("password") || !this.password) {
        // If password isn't being set/changed, or is empty, skip hashing
        // We set passwordHash to undefined if isProtected is false
        if (!this.isProtected) {
            this.password = undefined;
        }
        return next();
    }

    try {
        // Hash the new password
        this.password = await bcrypt.hash(this.password, 10);
        this.isProtected = true; // Ensure it's marked as protected
        next();
    } catch (error) {
        next(error);
    }
});

// Method to check password
journalSchema.methods.isPasswordCorrect = async function(password) {
    if (!this.isProtected || !this.password) {
        return false; // Not a protected journal
    }
    return await bcrypt.compare(password, this.password);
};

export const Journal = mongoose.model("Journal", journalSchema);



// import mongoose, { Schema } from "mongoose";
// import mongoosePaginate from "mongoose-paginate-v2";

// const journalSchema = new Schema(
//     {
//         type: {
//             type: String,
//             enum: ['daily', 'weekly', 'monthly', 'project'],
//             default: 'daily'
//         },
//         name : {
//             type : String,
//             required : true
//         },
//         isProtected: { 
//             type: Boolean,
//             default: false
//         },
//         password: { 
//             type: String
//         },
//         entryDate: {
//             type: Date,
//             required: true
//         },
//         description: {
//             type: String,
//             required: true
//         },
//         userId: {
//             type: Schema.Types.ObjectId,
//             ref: "User",
//             required: true,
//             index: true
//         }
//     },
//     {
//         timestamps: true
//     }
// );

// //we can see previous days journal
// //if i write any query to get all journals of a page we need to paginate
// //else if i write queries like the journal of a user on some date we don't need it 
// //lets just add paginate eventhough we don't use it for now 
// journalSchema.plugin(mongoosePaginate)

// export const Journal = mongoose.model("Journal", journalSchema);
