import express from "express";
import { checkImageExtension } from "../middlewares/file.middleware.js";
import { createArtist, getAllArtists, getArtistById, updateArtist, deleteArtist} from "../controllers/artist.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { authenticate} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create",upload.single("image"),authenticate,checkImageExtension,createArtist);
router.get("/all",authenticate,getAllArtists);
router.get("/get-by-id/:id",authenticate,getArtistById);
router.put("/update/:id",upload.single("image"),authenticate,checkImageExtension,updateArtist);
router.delete("/delete/:id",authenticate,deleteArtist);

export default router;