import express from "express";
import { checkImageExtension } from "../middlewares/file.middleware.js";
import {createAlbum , getAllAlbums , getAlbumById , updateAlbum , deleteAlbum} from "../controllers/album.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { authenticate, isAdmin, isDeleted} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/all",authenticate,isDeleted,getAllAlbums);
router.get("/get-by-id/:id",authenticate,isDeleted,getAlbumById);
router.post("/create",upload.single("coverImage"),authenticate,isDeleted,checkImageExtension,createAlbum);
router.put("/update/:id",upload.single("coverImage"),authenticate,isDeleted,checkImageExtension,updateAlbum);
router.delete("/delete/:id",authenticate||isAdmin,isDeleted,deleteAlbum);

export default router;

