import express from 'express';
import { registerUser, loginUser, logoutUser, getUserProfile, updateUserProfile, changeUserPassword, refreshToken , changeUserProfilePicture ,getAllUsers , getUserFollowCount , getUserFollowings , getUserFollowers , toggleFavoriteSong , deleteUserAccount , getUserHistory , toggleUserLibraryItem , clearUserLibrary , getUserLibrary,getFavoriteSongs } from '../controllers/user.controllers.js';
import { authenticate , isAdmin  } from '../middlewares/auth.middleware.js';
import {upload} from "../middlewares/multer.middleware.js"
import { checkImageExtension } from '../middlewares/file.middleware.js';
import { followUser, unfollowUser , isFollowing  } from '../controllers/follow.controller.js';

const router = express.Router();
router.post('/register', upload.single("profileImage"), checkImageExtension, registerUser);
router.post('/login', loginUser);

// Protected routes
router.post('/logout', authenticate, logoutUser);
router.get('/get-profile', authenticate, getUserProfile);
router.put('/update-profile', authenticate, updateUserProfile);
router.put('/change-password', authenticate, changeUserPassword);
router.post('/refresh-token',authenticate,refreshToken);
router.put('/change-profile-picture',upload.single("profileImage"), checkImageExtension, authenticate, changeUserProfilePicture);
router.get('/history', authenticate, getUserHistory);
router.get('/follow-count/:id', authenticate, getUserFollowCount);
router.get('/followings/:id', authenticate, getUserFollowings);
router.get('/followers/:id', authenticate, getUserFollowers);
router.put('/toggle-favorite-song/:songId', authenticate, toggleFavoriteSong);
router.delete('/delete-account', authenticate, deleteUserAccount);
router.get('/all-users', authenticate, getAllUsers);
router.get('/all-users/:id', authenticate, getAllUsers);
router.post('/follow/:id', authenticate, followUser);
router.delete('/unfollow/:id', authenticate, unfollowUser);
router.get('/is-following/:id', authenticate, isFollowing);
router.get('/library', authenticate, getUserLibrary);
router.put('/library', authenticate, toggleUserLibraryItem);
router.delete('/library', authenticate, clearUserLibrary);
router.get('/favorite-songs', authenticate, getFavoriteSongs);


import { toggleActiveStatus, deleteUser, adminGetAllUsers , changeUserRole, forceLogout , getUserStatistics , getUserPlaylists, deleteUserPlaylist} from '../controllers/user.admin.controllers.js';
// Admin routes
router.get('/admin/all-users', authenticate, isAdmin, adminGetAllUsers);
router.put('/admin/toggle-active-status/:id', authenticate, isAdmin, toggleActiveStatus);
router.delete('/admin/delete-user/:id', authenticate, isAdmin, deleteUser);
router.put('/admin/change-user-role/:id', authenticate, isAdmin, changeUserRole);
router.post('/admin/force-logout/:id', authenticate, isAdmin, forceLogout);
router.get('/admin/user-statistics', authenticate, isAdmin, getUserStatistics);
router.get('/admin/user-playlists/:id', authenticate, isAdmin, getUserPlaylists);
router.delete('/admin/user-playlists/:id/:playlistId', authenticate, isAdmin, deleteUserPlaylist);


export default router;