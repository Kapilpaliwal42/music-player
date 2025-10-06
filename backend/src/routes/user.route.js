import express from 'express';
import { registerUser, loginUser, logoutUser, getUserProfile, updateUserProfile, changeUserPassword, refreshToken , changeUserProfilePicture ,getAllUsers , getUserFollowCount , getUserFollowings , getUserFollowers , toggleFavoriteSong , deleteUserAccount , getUserHistory } from '../controllers/user.controllers.js';
import { authenticate , isAdmin , isDeleted } from '../middlewares/auth.middleware.js';
import {upload} from "../middlewares/multer.middleware.js"
import { checkImageExtension } from '../middlewares/file.middleware.js';
import { followUser, unfollowUser   } from '../controllers/follow.controller.js';

const router = express.Router();
router.post('/register', upload.single("profileImage"), checkImageExtension, registerUser);
router.post('/login', loginUser);

// Protected routes
router.post('/logout', authenticate, isDeleted, logoutUser);
router.get('/get-profile', authenticate,isDeleted, getUserProfile);
router.put('/update-profile', authenticate,isDeleted, updateUserProfile);
router.put('/change-password', authenticate,isDeleted, changeUserPassword);
router.post('/refresh-token',authenticate,isDeleted,refreshToken);
router.put('/change-profile-picture',upload.single("profileImage"), checkImageExtension, authenticate,isDeleted, changeUserProfilePicture);
router.get('/history', authenticate,isDeleted, getUserHistory);
router.get('/follow-count/:id', authenticate,isDeleted, getUserFollowCount);
router.get('/followings/:id', authenticate,isDeleted, getUserFollowings);
router.get('/followers/:id', authenticate,isDeleted, getUserFollowers);
router.put('/toggle-favorite-song/:songId', authenticate,isDeleted, toggleFavoriteSong);
router.delete('/delete-account', authenticate,isDeleted, deleteUserAccount);
router.get('/all-users', authenticate,isDeleted, getAllUsers);
router.post('/follow/:id', authenticate,isDeleted, followUser);
router.delete('/unfollow/:id', authenticate,isDeleted, unfollowUser);


import { toggleActiveStatus, deleteUser, adminGetAllUsers , changeUserRole } from '../controllers/user.admin.controllers.js';
// Admin routes
router.get('/admin/all-users', authenticate,isDeleted, isAdmin, adminGetAllUsers);
router.put('/admin/toggle-active-status/:id', authenticate,isDeleted, isAdmin, toggleActiveStatus);
router.delete('/admin/delete-user/:id', authenticate,isDeleted, isAdmin, deleteUser);
router.put('/admin/change-user-role/:id', authenticate,isDeleted, isAdmin, changeUserRole);


export default router;