import { authenticate, isAdmin, isDeleted} from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { checkImageExtension } from "../middlewares/file.middleware.js";
import { getAllPublicPlaylists , getPlaylistById , createPlaylist , getUserPlaylists , updatePlaylist , addSongsToPlaylist , removeSongsFromPlaylist , deletePlaylist  } from "../controllers/playlist.controllers.js";
import express from "express";

const router = express.Router();

router.get("/all-public",authenticate,isDeleted,getAllPublicPlaylists);
router.get("/get-by-id/:id",authenticate,isDeleted,getPlaylistById);
router.post("/create",upload.single("coverImage"),authenticate,isDeleted,checkImageExtension,createPlaylist);
router.get("/get-user-playlists",authenticate,isDeleted,getUserPlaylists);
router.put("/update",upload.single("coverImage"),authenticate,isDeleted,checkImageExtension,updatePlaylist);
router.put("/add-songs",authenticate,isDeleted,addSongsToPlaylist);
router.put("/remove-songs",authenticate,isDeleted,removeSongsFromPlaylist);
router.delete("/delete/:id",authenticate||isAdmin,isDeleted,deletePlaylist);

export default router;