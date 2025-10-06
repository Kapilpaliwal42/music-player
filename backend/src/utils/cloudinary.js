import cloudinary from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_CLOUD_SECRET
})

export const uploadToCloudinary = async (localFilePath) => {
    try{
        if(!localFilePath) return null;
        const result = await cloudinary.v2.uploader.upload(localFilePath,{resource_type:"auto",timeout:60000});
        console.info("File uploaded to Cloudinary successfully", result.url);
        fs.unlinkSync(localFilePath);
        return result;
    } catch (error) {
        console.error("Error uploading file to Cloudinary", error);
        fs.unlinkSync(localFilePath);
        return null;
    }
}




export const deleteFromCloudinary = async (publicId) => {
    try{
        if(!publicId) return null;
       
        const result = await cloudinary.v2.uploader.destroy(publicId);
        console.info("File deleted from Cloudinary successfully", result);
        return result;
    } catch (error) {
        console.error("Error deleting file from Cloudinary", error);
        return null;
    }
}

export default cloudinary;