import mongoose,{Schema} from "mongoose"

const userSchema = new Schema(
    {
        username : {
            type : String,
            required : true,
            unique : true,
            lowercase : true,
            trim : true,
            index : true
        },
        email : {
            type : String,
            required : true,
            unique : true,
            lowercase : true,
            trim : true
        },
        fullName : {
            type : String,
            required : true,
            trim : true,
            index : true
        },
        avatar : {
            type : String,
            default: "https://example.com/default-avatar.png"
        },
        bio : {
            type : String,
            default : "Hey , how are you..?"
        },
        passwordHash : {
            type : String,
        },
        googleId : {
            type : String,
            unique : true,
            sparse : true
        },
        refreshToken : {
            type : String
        }
    },
    {
        timestamps : true
    }
)

export const User = mongoose.model("User",userSchema)