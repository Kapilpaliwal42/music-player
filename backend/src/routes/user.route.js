import express from 'express';
import { registerUser, loginUser, logoutUser, getUserProfile, updateUserProfile, changeUserPassword, refreshToken , changeUserProfilePicture ,getAllUsers , getUserFollowCount , getUserFollowings , getUserFollowers , toggleFavoriteSong , deleteUserAccount , getUserHistory } from '../controllers/user.controllers.js';
import { authenticate , isAdmin } from '../middlewares/auth.middleware.js';
import {upload} from "../middlewares/multer.middleware.js"

const router = express.Router();
router.post('/register', upload.single("profileImage"), registerUser);
router.post('/login', loginUser);

// Protected routes
router.post('/logout', authenticate, logoutUser);
router.get('/get-profile', authenticate, getUserProfile);
router.put('/update-profile', authenticate, updateUserProfile);
router.put('/change-password', authenticate, changeUserPassword);
router.post('/refresh-token', refreshToken);
router.put('/change-profile-picture',upload.single("profileImage"), authenticate, changeUserProfilePicture);
router.get('/history', authenticate, getUserHistory);
router.get('/follow-count/:id', authenticate, getUserFollowCount);
router.get('/followings/:id', authenticate, getUserFollowings);
router.get('/followers/:id', authenticate, getUserFollowers);
router.put('/toggle-favorite-song/:songId', authenticate, toggleFavoriteSong);
router.delete('/delete-account', authenticate, deleteUserAccount);

import { toggleActiveStatus, deleteUser, adminGetAllUsers , changeUserRole } from '../controllers/user.admin.controllers.js';
// Admin routes
router.get('/admin/all-users', authenticate, isAdmin, adminGetAllUsers);
router.put('/admin/toggle-active-status/:id', authenticate, isAdmin, toggleActiveStatus);
router.delete('/admin/delete-user/:id', authenticate, isAdmin, deleteUser);
router.put('/admin/change-user-role/:id', authenticate, isAdmin, changeUserRole);


export default router;