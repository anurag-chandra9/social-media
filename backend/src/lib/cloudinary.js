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
    console.log('Verifying Cloudinary configuration...');
    const config = {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key_exists: !!process.env.CLOUDINARY_API_KEY,
      api_secret_exists: !!process.env.CLOUDINARY_API_SECRET
    };
    console.log('Cloudinary config:', config);

    if (!config.cloud_name || !config.api_key_exists || !config.api_secret_exists) {
      console.error('❌ Missing Cloudinary credentials');
      return;
    }

    cloudinary.api.ping()
      .then(() => console.log('✅ Cloudinary connection successful'))
      .catch((error) => console.error('❌ Cloudinary connection failed:', error));
  } catch (error) {
    console.error('Error verifying Cloudinary config:', error);
  }
};

verifyConfig();

export const uploadImage = async (file) => {
  try {
    console.log('Starting image upload process...', {
      fileExists: !!file,
      hasBuffer: !!file?.buffer,
      bufferLength: file?.buffer?.length,
      mimetype: file?.mimetype,
      originalname: file?.originalname
    });

    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new Error('Invalid or empty file buffer');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(`Invalid file type. Allowed types are: ${allowedTypes.join(', ')}`);
    }

    // Convert to base64
    const b64 = Buffer.from(file.buffer).toString("base64");
    if (!b64) {
      throw new Error('Failed to convert file to base64');
    }

    const dataURI = "data:" + file.mimetype + ";base64," + b64;

    // Enhanced upload options
    const uploadOptions = {
      resource_type: "auto",
      folder: "social_media_posts",
      allowed_formats: ["jpg", "jpeg", "png", "gif"],
      transformation: [
        { width: 1200, height: 1200, crop: "limit" },
        { quality: "auto:best" },
        { fetch_format: "auto" }
      ],
      unique_filename: true,
      overwrite: true
    };

    console.log('Uploading to Cloudinary...', {
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      options: {
        resource_type: uploadOptions.resource_type,
        folder: uploadOptions.folder,
        allowed_formats: uploadOptions.allowed_formats
      }
    });

    const result = await cloudinary.uploader.upload(dataURI, uploadOptions);

    if (!result) {
      console.error('Upload failed - no result from Cloudinary');
      throw new Error('Failed to upload image to Cloudinary');
    }

    if (!result.secure_url) {
      console.error('Upload failed - no secure URL in response:', result);
      throw new Error('Failed to get secure URL from Cloudinary');
    }

    console.log('✅ Upload successful:', {
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      size: result.bytes,
      width: result.width,
      height: result.height
    });

    return result.secure_url;
  } catch (error) {
    console.error('❌ Cloudinary upload error:', {
      message: error.message,
      code: error.http_code,
      name: error.name,
      details: error.message,
      stack: error.stack
    });
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

export const deleteImage = async (imageUrl) => {
  try {
    if (!imageUrl) {
      console.log('No image URL provided for deletion');
      return;
    }

    // Extract public_id from URL
    const splitUrl = imageUrl.split('/');
    const lastSegments = splitUrl.slice(-2);
    const publicId = lastSegments.join('/').split('.')[0];

    console.log('Attempting to delete image:', {
      url: imageUrl,
      publicId
    });

    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      console.log('✅ Image deleted successfully:', publicId);
    } else {
      console.warn('⚠️ Image deletion returned unexpected result:', result);
    }

    return result;
  } catch (error) {
    console.error('❌ Error deleting from Cloudinary:', {
      message: error.message,
      stack: error.stack
    });
    // Don't throw error for deletion failures
    return null;
  }
};

export default cloudinary;
