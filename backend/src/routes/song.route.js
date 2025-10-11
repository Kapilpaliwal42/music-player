import express from "express";
import { authenticate, isAdmin, isDeleted} from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {getSongDuration} from "../middlewares/song.middleware.js";
import { checkImageExtension , ensureCoverImage , checkAudioExtension } from "../middlewares/file.middleware.js";
import { uploadSong , searchSongs , getSongById , getAllSongs , updateSong , deleteSong, playNextSong, playPreviousSong } from "../controllers/song.controllers.js";
const router = express.Router();

router.post('/upload',upload.fields([{name:"audioFile" , maxCount:1},{name:"coverImage",maxCount:1}]),authenticate,isDeleted,ensureCoverImage,checkImageExtension,checkAudioExtension,getSongDuration,uploadSong);

router.get("/search",authenticate,isDeleted,searchSongs)

router.get("/get-all",authenticate,isDeleted,getAllSongs)

router.get("/listen/:id",authenticate,isDeleted,getSongById)

router.put("/update/:id",upload.fields([{name:"audioFile" , maxCount:1},{name:"coverImage",maxCount:1}]),authenticate,isDeleted,ensureCoverImage,checkImageExtension,checkAudioExtension,getSongDuration,updateSong)

router.delete("/delete/:id",authenticate||isAdmin,isDeleted,deleteSong)
router.delete("/delete", authenticate || isAdmin, isDeleted, deleteSong);

router.get("/next",authenticate,isDeleted,playNextSong)

router.get("/previous",authenticate,isDeleted,playPreviousSong)

export default router

