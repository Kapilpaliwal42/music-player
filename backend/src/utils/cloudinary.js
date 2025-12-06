import cloudinary from 'cloudinary';
import streamifier from 'streamifier';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_CLOUD_SECRET
})

function sanitizePublicId(filename) {
  return filename
    // Replace spaces with underscores
    .replace(/\s+/g, "_")
    // Remove all characters except letters, numbers, underscores, hyphens, slashes, and dot
    .replace(/[^a-zA-Z0-9_\-/.]/g, "")
    // Prevent multiple underscores in a row
    .replace(/_+/g, "_")
    // Trim underscores or hyphens from start/end
    .replace(/^[_-]+|[_-]+$/g, "");
}



const MAX_BASE64_SIZE = 10 * 1024 * 1024; // 10MB

export const uploadBufferToCloudinary = (buffer, filename) => {
  return new Promise((resolve, reject) => {
    if (!buffer || !(buffer instanceof Buffer)) {
      return reject(new Error('Invalid buffer passed to Cloudinary upload'));
    }

    // Use base64 upload for small files
    if (buffer.length <= MAX_BASE64_SIZE) {
      const base64 = buffer.toString('base64');
      const dataUri = `data:application/octet-stream;base64,${base64}`;

      filename = sanitizePublicId(filename);

      cloudinary.v2.uploader.upload(
        dataUri,
        {
          resource_type: 'auto',
          public_id: filename,
          timeout: 120000,
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary base64 upload error:', error);
            return reject(error);
          }
          resolve(result);
        }
      );
    } else {
      // Use stream upload for larger files
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        {
          resource_type: 'auto',
          public_id: filename,
          timeout: 120000,
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary stream upload error:', error);
            return reject(error);
          }
          resolve(result);
        }
      );

      const readStream = streamifier.createReadStream(buffer);
      readStream.on('error', (err) => {
        console.error('Read stream error:', err);
        reject(err);
      });

      readStream.pipe(uploadStream).on('finish', () => {
        console.log('Upload stream finished');
      });
    }
  });
};

export const deleteImageFromCloudinary = async (publicId) => {
    try{
        if(!publicId) return null;
       
        const result = await cloudinary.v2.uploader.destroy(publicId,{
  invalidate: true,
  resource_type: "image"
});
        console.info("File deleted from Cloudinary successfully", result);
        return result;
    } catch (error) {
        console.error("Error deleting file from Cloudinary", error);
        return null;
    }
}
export const deleteMusicFromCloudinary = async (publicId) => {
    try{
        if(!publicId) return null;
       
        const result = await cloudinary.v2.uploader.destroy(publicId,{
  invalidate: true,
  resource_type: "raw"
});
        console.info("File deleted from Cloudinary successfully", result);
        return result;
    } catch (error) {
        console.error("Error deleting file from Cloudinary", error);
        return null;
    }
}

export default cloudinary;