import { authenticate, isAdmin} from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { checkImageExtension } from "../middlewares/file.middleware.js";
import { getAllPublicPlaylists , getPlaylistById , createPlaylist , getUserPlaylists , updatePlaylist , addSongsToPlaylist , removeSongsFromPlaylist , deletePlaylist  } from "../controllers/playlist.controllers.js";
import express from "express";

const router = express.Router();

router.get("/all-public",authenticate,getAllPublicPlaylists);
router.get("/get-by-id/:id",authenticate,getPlaylistById);
router.post("/create",upload.single("coverImage"),authenticate,checkImageExtension,createPlaylist);
router.get("/get-user-playlists/:id",authenticate,getUserPlaylists);
router.get("/get-my-playlists",authenticate,getUserPlaylists);

router.put("/update/:id",upload.single("coverImage"),authenticate,checkImageExtension,updatePlaylist);
router.put("/add-songs/:id",authenticate,addSongsToPlaylist);
router.put("/remove-songs/:id",authenticate,removeSongsFromPlaylist);
router.delete("/delete/:id",authenticate,deletePlaylist);

export default router;