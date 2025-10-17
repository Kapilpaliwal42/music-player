import express from "express";
import { checkImageExtension } from "../middlewares/file.middleware.js";
import {createAlbum , getAllAlbums , getAlbumById , updateAlbum , deleteAlbum} from "../controllers/album.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { authenticate, isAdmin} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/all",authenticate,getAllAlbums);
router.get("/get-by-id/:id",authenticate,getAlbumById);
router.post("/create",upload.single("coverImage"),authenticate,checkImageExtension,createAlbum);
router.put("/update/:id",upload.single("coverImage"),authenticate,checkImageExtension,updateAlbum);
router.delete("/delete/:id",authenticate,deleteAlbum);

export default router;

