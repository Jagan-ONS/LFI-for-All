//verify if the user is logged in or not 
//just check tokens

import { User } from "../models/user.model"
import { ApiError } from "../utils/ApiError"
import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler"

export const verifyJWT = asyncHandler(async (req,res,next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","") 
        if(!token){
            throw new ApiError(401,"Unauthorized request")
        }
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        const user = User.findById(decodedToken?._id).select("-password -refreshToken")
        if(!user){
            throw new ApiError(401,"Invalid access token")
        }
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401,error?.message || "invalid access token")
    }
})
