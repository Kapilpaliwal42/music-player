import APIError from "../utils/APIError.js";

const checkAudioExtension = (req, res, next) => {
    const audioFile = req.files?.audioFile?.[0];
    const coverImage = req.files?.coverImage?.[0];
    if(!audioFile) {
       return next();
    }
    const allowedAudioExtensions = ['.mp3', '.wav', '.ogg', '.flac'];
    const allowedImageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    if (audioFile) {
        const audioExtension = audioFile.originalname.substring(audioFile.originalname.lastIndexOf('.')).toLowerCase();
        if(!allowedAudioExtensions.includes(audioExtension)) {
            throw new APIError(400, "Invalid audio file format");
        }
    }
    if (coverImage) {
        const imageExtension = coverImage.originalname.substring(coverImage.originalname.lastIndexOf('.')).toLowerCase();
        if(!allowedImageExtensions.includes(imageExtension)) {
            throw new APIError(400, "Invalid cover image format");
        }
    }
    next();
}

const checkImageExtension = (req, res, next) => {
  const imageFile = req.files?.[0];

  if (!imageFile || !imageFile.originalname) {
    return next(); // No image provided, skip validation
  }

  const allowedImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const extension = imageFile.originalname.substring(imageFile.originalname.lastIndexOf('.')).toLowerCase();

  if (!allowedImageExtensions.includes(extension)) {
    throw new APIError(400, 'Invalid cover image format');
  }

  next();
};

import { parseBuffer } from 'music-metadata';

const ensureCoverImage = async (req, res, next) => {
  try {
    const userProvided = req.files?.coverImage?.[0]?.buffer;
    if (userProvided) return next();

    const audioFile = req.files?.audioFile?.[0];
    if (!audioFile?.buffer) return next();

    const metadata = await parseBuffer(audioFile.buffer, audioFile.mimetype);
    const picture = metadata.common.picture?.[0];
    if (!picture) throw new APIError(400, 'Cover image is required');

    const originalname = 'extracted-cover.jpg';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = originalname + '-' + uniqueSuffix;

    // Inject into memoryStorage-style req.files
    req.files.coverImage = req.files.coverImage || [];
    req.files.coverImage.push({
      fieldname: 'coverImage',
      originalname,
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: picture.data,
      size: picture.data.length
    });

    next();
  } catch (error) {
    console.error('Error extracting cover image:', error);
    next(error);
  }
};

export {
    checkAudioExtension,
    checkImageExtension,
    ensureCoverImage
}
