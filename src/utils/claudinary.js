

import {v2 as cloudinary} from "cloudinary"

import fs from "fs"

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key : process.env.CLOUDINARY_API_KEY,
    api_secret : process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) =>{
        try{
        if(!localFilePath) return null
        // upload the file oncloudinary
       const res =  await cloudinary.uploader.upload(localFilePath , {
             resource_type: "auto"
        })
        // file has been uploaded successfully
        // console.log("File is uploaded on cloudinary :" , res.url);  //  ho gya kaam isliye hta rhe hai console.log or hn ab upload hone ke baad hm apne localstaorafe se v htayenge isliye {fs ka use kkrrhe hai}   
        fs.unlinkSync(localFilePath) // remove the locally save temporary file
        // console.log("print res",res)
        return res;

        }catch(err){
            fs.unlinkSync(localFilePath)  // remove the locally save temporary file as the upload operations got failed
            return null;

        }
}

export {uploadOnCloudinary}
