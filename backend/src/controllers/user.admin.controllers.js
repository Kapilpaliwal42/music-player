import User from "../models/user.models.js"
import { deleteFromCloudinary } from "../utils/cloudinary.js";
import asyncHandler from "../utils/asyncHandler.js"
import APIError from "../utils/APIError.js";

// Admin Controllers

export const adminGetAllUsers = asyncHandler(async (req, res) => {
    try {
        const _id = req.params._id;
        if (_id) {
            const user = await User.findById(_id).select("-password");
            if (!user) {
                throw new APIError(404, "User not found");
            }
            return res.status(200).json({ user });
        }
        const users = await User.find().select("-password");
        
        return res.status(200).json({ users });
    } catch (error) {
        console.error("Error fetching all users:", error);
        throw new APIError(500, error.message, error);
    }
});

export const deleteUser = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            throw new APIError(404, "User not found");
        }
        if (user.profileImage) {
            await deleteFromCloudinary(user.profileImagePublicId);
        }
        const result = await User.deleteOne({ _id: req.params.id });
        if (result.deletedCount === 0) {
            throw new APIError(404, "User not found");
        }
        return res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        throw new APIError(500, error.message, error);
    }
});

export const toggleActiveStatus = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            throw new APIError(404, "User not found");
        }
        user.isActive = !user.isActive;
        await user.save();
        return res.status(200).json({ message: "User active status updated successfully", user });
    } catch (error) {
        console.error("Error toggling user active status:", error);
        throw new APIError(500, error.message, error);
    }
});

export const changeUserRole = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            throw new APIError(404, "User not found");
        }
        user.role = req.body.role;
        await user.save();
        return res.status(200).json({ message: "User role updated successfully", user });
    } catch (error) {
        console.error("Error changing user role:", error);
        throw new APIError(500, error.message, error);
    }
});

export const forceLogout = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            throw new APIError(404, "User not found");
        }
        user.isActive = false;
        user.refreshToken = "";
        await user.save();
        return res.status(200).json({ message: "User logged out successfully" });
    } catch (error) {
        console.error("Error forcing user logout:", error);
        throw new APIError(500,error.message,error);
    }
});
