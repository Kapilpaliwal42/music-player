import { parseBuffer, parseFile } from 'music-metadata';
import APIError from "../utils/APIError.js";

export const getSongDuration = async(req, res, next) => {
  try {
   const audioFile = req.files?.audioFile?.[0];
   if(!audioFile) return next();
    const metadata = await parseBuffer(audioFile.buffer, { mimeType: audioFile.mimetype });
const duration = metadata.format.duration;
    req.body.duration = duration;
      next();
   
  } catch (error) {
    console.error("Unexpected error in getSongDuration:", error);
    next(new APIError(500, "Internal server error", error));
  }
};



