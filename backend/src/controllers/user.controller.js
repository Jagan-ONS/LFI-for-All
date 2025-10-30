import {asyncHandler} from "../utils/asyncHandler.js"

//controllers means the functions or the logic we have to execute when we click something
//clicking something means hitting some route

const registerUser = asyncHandler( async (req,res)=>{
    res.status(200).json({
        message : "ok"
    })
})

export {registerUser}