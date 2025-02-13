import { v2 as cloudinary } from "cloudinary";
import { config } from "dotenv";

config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Verify configuration
const verifyConfig = () => {
  try {
    cloudinary.api.ping().then(() => {
      console.log('Cloudinary connection successful');
    }).catch((error) => {
      console.error('Cloudinary connection failed:', error);
    });
  } catch (error) {
    console.error('Error verifying Cloudinary config:', error);
  }
};

verifyConfig();

export const uploadImage = async (file, folder = 'posts') => {
  try {
    const b64 = Buffer.from(file.buffer).toString("base64");
    const dataURI = "data:" + file.mimetype + ";base64," + b64;
    
    const result = await cloudinary.uploader.upload(dataURI, {
      resource_type: "auto",
      folder: folder,
      transformation: [
        { quality: "auto:good" },
        { fetch_format: "auto" }
      ]
    });
    
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload image');
  }
};

export const deleteImage = async (imageUrl) => {
  try {
    if (!imageUrl) return;
    
    const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0];
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
  }
};

export default cloudinary;
