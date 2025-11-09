//chane details 
//change pass 
//logout 

import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const updatePassword = asyncHandler(async (req , res) => {
    //we get the old pass word 
    //and the new pass 
    //if it's correct then we update it 
    const {oldPassword , newPassword} = req.body
    const user = await User.findById(req.user?._id)
    //we can also add check for op and np to be diff
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw new ApiError(401,"Invalid passoword")
    }
    
    user.password = newPassword
    await user.save({validateBeforeSave : false})
    return res
})

const updateDetails = asyncHandler(async (req,res) => {
    const {fullName,bio} = req.body
    if(!fullName|| !bio){
        throw new ApiError(400,"All feilds are required")
    }
    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                fullName,
                bio
            }
        },
        {
            new : true
        }
    ).select("-password")

    //don't we need to ask for password and verify before updating ?? 

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account details updated successfully"))
})

const updateEmail = asyncHandler(async (req, res) => {
    const { newEmail, password } = req.body;

    if (!newEmail || !password) {
        throw new ApiError(400, "New email and current password are required");
    }

    // 1. Find the user
    const user = await User.findById(req.user?._id);

    // 2. Verify their current password
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid password");
    }

    // 3. Update the email
    user.email = newEmail;
    await user.save({ validateBeforeSave: false }); // Skip validation on other fields

    return res.status(200).json(
        new ApiResponse(200, user, "Email updated successfully")
    );
});

//TODO : i have to code for session based login and jwt based login 
const logout = asyncHandler( async (req , res) =>{
    //clear tokens 
    //set refresh token to null
    await User.findByIdAndUpdate(
        req.user._id,
        {
            // $set : {
            //     refreshToken : undefined //we can keep null also
            // },
            $unset : {
                refreshToken : 1
            }
        },
        {
            new : true
            //when we say this we will the updated value in the response 
        }
    )
    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User Logged Out"))
})

//i have to update profile photo 

export {
    updateDetails,
    updatePassword,
    updateEmail,
    logout
}