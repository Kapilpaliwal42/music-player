import express from "express";
import { authenticate, isAdmin} from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {getSongDuration} from "../middlewares/song.middleware.js";
import { checkImageExtension , ensureCoverImage , checkAudioExtension } from "../middlewares/file.middleware.js";
import { uploadSong , searchSongs , getSongById , getAllSongs , updateSong , deleteSong, playNextSong, playPreviousSong, getTopPlayedSongs, getMostRecentSongs, getSongsByArtist, getSongsByAlbum} from "../controllers/song.controllers.js";
const router = express.Router();

router.post('/upload',upload.fields([{name:"audioFile" , maxCount:1},{name:"coverImage",maxCount:1}]),authenticate,ensureCoverImage,checkImageExtension,checkAudioExtension,getSongDuration,uploadSong);

router.get("/search",authenticate,searchSongs)

router.get("/get-all",authenticate,getAllSongs)

router.get("/listen/:id",authenticate,getSongById)

router.put("/update/:id",upload.fields([{name:"audioFile" , maxCount:1},{name:"coverImage",maxCount:1}]),authenticate,ensureCoverImage,checkImageExtension,checkAudioExtension,getSongDuration,updateSong)

router.delete("/delete/:id",authenticate,deleteSong)
router.delete("/delete", authenticate , deleteSong);

router.get("/next",authenticate,playNextSong)

router.get("/previous",authenticate,playPreviousSong)
router.get("/top-played",authenticate,getTopPlayedSongs)

router.get("/most-recent",authenticate,getMostRecentSongs)

router.get("/artist/:artistId",authenticate,getSongsByArtist)

router.get("/album/:albumId",authenticate,getSongsByAlbum)


export default router

