import APIError from "../utils/APIError.js";
import fs from "fs";
import path from "path";
import {parseFile} from "music-metadata";
import { fileURLToPath } from "url";


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
    const avatar = req.file;

    if(!avatar||!avatar.originalname) {
       return next();
    }

    const allowedImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const avatarExtension = avatar.originalname.substring(avatar.originalname.lastIndexOf('.')).toLowerCase();
    if(!allowedImageExtensions.includes(avatarExtension)) {
        throw new APIError(400, "Invalid avatar image format");
    }
    next();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COVER_DEST = path.join(__dirname,'../public/temp/');

const ensureCoverImage = async (req, res, next) => {
    try {
        const userProvided = req.files?.coverImage?.[0]?.path;
        if(userProvided) return next();
        
        const audioFile = req.files?.audioFile?.[0]?.path;
        if(!audioFile) return next();

        const metadata = await parseFile(audioFile);
        const picture = metadata.common.picture?.[0];
        if(!picture) throw new APIError(400, "Cover image is required");

        const originalname = "extracted-cover.jpg";
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = originalname+ '-' + uniqueSuffix;
        const finalPath = path.join(COVER_DEST, filename);
        fs.mkdirSync(COVER_DEST, { recursive: true });

        fs.writeFileSync(finalPath, picture.data);
        
        fs.writeFileSync(finalPath, picture.data);

        req.files.coverImage = req.files.coverImage || [];

        req.files.coverImage.push({
  fieldname: 'coverImage',
  originalname,
  encoding: '7bit',
  mimetype: 'image/jpeg',
  destination: COVER_DEST,
  filename,
  path: finalPath,
  size: picture.data.length
});
        next();

    } catch (error) {
        console.error('Error extracting cover image:', error);
        next(error);
    }
}


export {
    checkAudioExtension,
    checkImageExtension,
    ensureCoverImage
}
