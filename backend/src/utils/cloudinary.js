import { v2 as cloudinary } from 'cloudinary'
import fs from "fs"

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key:  process.env.CLOUDINARY_API_KEY, 
  api_secret:  process.env.CLOUDINARY_API_SECRET
});

//multer takes the file from the user and stores it in the local file 
//let say somehow we know the local file path
//now we need to write a function which takes file path as input and 
//uploads that file into cloudinary and it will return the link and 
//details of that video like length etc 

const uploadOnCloudinary = async (localFilePath)=>{
    try{
        if(!localFilePath){
            return null;//i don't know what to do next 
            //or we can return an error which says localFilePaths doesn't 
            //exists
        }
        const response = await cloudinary.uploader.upload(localFilePath,{resource_type : "auto"})
        console.log("file is uploaded on cloudinary",response.url)
        fs.unlinkSync(localFilePath)
        return response
    }
    catch(error){
        fs.unlinkSync(localFilePath)
    }
}

export {uploadOnCloudinary}