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
    // Validate file object
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file buffer
    if (!file.buffer || file.buffer.length === 0) {
      console.error('Invalid file buffer:', {
        hasBuffer: !!file.buffer,
        bufferLength: file.buffer ? file.buffer.length : 0
      });
      throw new Error('Invalid or empty file buffer');
    }

    // Validate file type
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      throw new Error(`Invalid file type: ${file.mimetype}`);
    }

    console.log('Starting Cloudinary upload process:', {
      fileType: file.mimetype,
      fileSize: file.size,
      folder: folder,
      bufferSize: file.buffer.length
    });

    // Convert buffer to base64
    const b64 = Buffer.from(file.buffer).toString("base64");
    if (!b64) {
      throw new Error('Failed to convert buffer to base64');
    }
    
    const dataURI = "data:" + file.mimetype + ";base64," + b64;
    console.log('Prepared data URI for upload');

    const uploadOptions = {
      resource_type: "auto",
      folder: folder,
      transformation: [
        { quality: "auto:good" },
        { fetch_format: "auto" }
      ]
    };

    console.log('Uploading to Cloudinary with options:', uploadOptions);

    const result = await cloudinary.uploader.upload(dataURI, uploadOptions);
    
    if (!result) {
      throw new Error('No result from Cloudinary upload');
    }

    if (!result.secure_url) {
      console.error('Invalid Cloudinary response:', result);
      throw new Error('No secure URL in Cloudinary response');
    }

    console.log('Cloudinary upload successful:', {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      size: result.bytes,
      width: result.width,
      height: result.height
    });

    return result.secure_url;
  } catch (error) {
    console.error('Error in uploadImage:', {
      error: error.message,
      stack: error.stack,
      fileInfo: file ? {
        mimetype: file.mimetype,
        size: file.size,
        hasBuffer: !!file.buffer
      } : 'No file'
    });
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
