import { v2 as cloudinary } from "cloudinary";
import fs from "fs"; //file system
import dotenv from 'dotenv'

dotenv.config()

// configure cloudinary
cloudinary.config({
  cloud_name: "process.env.CLOUDINARY_CLOUD_NAME",
  api_key: "process.enc.CLOUDINARY_API_KEY",
  api_secret: "process.env.CLOUDINARY_API_SECRET", // Click 'View API Keys' above to copy your API secret
});

const uploadOnClodinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    //file has been uploaded successfully
    console.log("FILE UPLOADED SUCCESSFULLY",response.url);
    // once the file is uploaded , we would like to delete it from our server
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); //remove the locally saved temporary files as the upload operation got failed
    return null;
  }
};

const deleteFromCloudinary = async(publicId)=>{
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    console.log("deleted from clodinary",publicId)
  } catch (error) {
    console.log("error deleting from cloudinary",error)
  }
}
export { uploadOnClodinary ,deleteFromCloudinary };
