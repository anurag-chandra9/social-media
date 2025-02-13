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
    if (!file) {
      throw new Error('No file provided');
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new Error('Invalid or empty file buffer');
    }

    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      throw new Error(`Invalid file type: ${file.mimetype}`);
    }

    const b64 = Buffer.from(file.buffer).toString("base64");
    if (!b64) {
      throw new Error('Failed to convert buffer to base64');
    }
    
    const dataURI = "data:" + file.mimetype + ";base64," + b64;

    const uploadOptions = {
      resource_type: "auto",
      folder: folder,
      transformation: [
        { quality: "auto:good" },
        { fetch_format: "auto" }
      ]
    };

    const result = await cloudinary.uploader.upload(dataURI, uploadOptions);
    
    if (!result) {
      throw new Error('No result from Cloudinary upload');
    }

    if (!result.secure_url) {
      throw new Error('No secure URL in Cloudinary response');
    }

    return result.secure_url;
  } catch (error) {
    console.error('Error in uploadImage:', error);
    throw error;
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
