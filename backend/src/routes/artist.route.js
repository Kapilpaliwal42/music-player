import express from "express";
import { checkImageExtension } from "../middlewares/file.middleware.js";
import { createArtist, getAllArtists, getArtistById, updateArtist, deleteArtist} from "../controllers/artist.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { authenticate, isAdmin , isDeleted } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create",upload.single("image"),authenticate,isDeleted,checkImageExtension,createArtist);
router.get("/all",authenticate,isDeleted,getAllArtists);
router.get("/get-by-id/:id",authenticate,isDeleted,getArtistById);
router.put("/update/:id",upload.single("image"),authenticate,isDeleted,checkImageExtension,updateArtist);
router.delete("/delete/:id",authenticate||isAdmin,isDeleted,deleteArtist);

export default router;