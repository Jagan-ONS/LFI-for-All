import mongoose,{Schema} from "mongoose"
import mongoosePaginate from "mongoose-paginate-v2"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

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

userSchema.pre("save", async function(next){
    //we only update pass if it's changed 
    if(!this.isModified("passwordHash")) return next();
    this.passwordHash = await bcrypt.hash(this.passwordHash,10);
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.passwordHash)
} 

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id : this._id,
            email : this.email,
            username : this.username,
            fullName : this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id : this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

userSchema.plugin(mongoosePaginate);
export const User = mongoose.model("User",userSchema)
