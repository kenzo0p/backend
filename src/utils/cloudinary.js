import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs' //file system

cloudinary.config({
    cloud_name: 'process.env.CLOUDINARY_CLOUD_NAME',
    api_key: 'process.enc.CLOUDINARY_API_KEY',
    api_secret: 'process.env.CLOUDINARY_API_SECRET' // Click 'View API Keys' above to copy your API secret
});

const uploadOnClodinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        
        //file has been uploaded successfully
        console.log("FILE UPLOADED SUCCESSFULLY" ,response.url);
        fs.unlinkSync(localFilePath)
        return response;


    } catch (error) {
        fs.unlinkSync(localFilePath) //remove the locally saved temporary files as the upload operation got failed
        return null
        console.log("ERROR IN CLODINARY" ,error)
    }
}
export {uploadOnClodinary}