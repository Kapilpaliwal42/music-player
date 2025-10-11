import User from "../models/user.models.js"
import jwt from "jsonwebtoken"
import { deleteFromCloudinary, uploadToCloudinary } from "../utils/cloudinary.js";
import asyncHandler from "../utils/asyncHandler.js"
import APIError from "../utils/APIError.js";
import { options } from "../../Constants.js";
import Follow from "../models/follow.models.js";
import mongoose from "mongoose";
import { unlinkSync } from "fs";


export const registerUser = asyncHandler(async (req, res) => {
    try {

        const {username, email, password, fullname} = req.body;
        if([username, email, password, fullname].some((item) => item.trim() === "")){
            throw new APIError(400, "All fields are required");
        }
        const existingUser = await User.findOne({$or: [{email}, {username}]});
        if(existingUser){
            throw new APIError(409, "User with this email or username already exists");
        }
        
        const profileImage = req.file?.path;


        if (!profileImage) {
            throw new APIError(400, "Profile image is required");
        }
    const upload = await uploadToCloudinary(profileImage);
    console.log("Profile image upload result:", upload);

   

    
        const user = await User.create({
            username,
            email,
            password,
            fullname,
            profileImage: upload?.url || "",
            profileImagePublicId: upload?.public_id || ""
        });
        return res.status(201).json({message: "User registered successfully", user});
    } catch (error) {
        console.error("Error registering user:", error);
        unlinkSync(req.file.path);
        return res.status(500).json({message: "Error registering user:", error: error.message});
    }
}
)

const generateAccessAndRefreshToken = async (user_id) => {
    try {
        let user = await User.findById(user_id);
        if(!user) throw new APIError(404, "User not found");
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        await user.save({validateBeforeSave: false});
        return {accessToken, refreshToken};
        
    } catch (error) {
        console.error("Error generating tokens:", error);
        throw new APIError(500,error.message,error);
    }
}

export const loginUser = asyncHandler(async (req, res) => {
    try {
        const {username, password ,email} = req.body;
        if([username ?? email, password].some((item) => item.trim() === "")){
            throw new APIError(400, "All fields are required");
        }
        const identifier = username?.trim() || email?.trim();
        let user = await User.findOne({$or: [{email: identifier}, {username: identifier}]}).select("+password");
        if(!user){
            throw new APIError(404, "User not found");
        }
        if(user.isDeleted){
            throw new APIError(403, "account has been deleted, please contact support");
        }
        const isPasswordValid = await user.comparePassword(password);
        console.log("isPasswordValid",isPasswordValid,password);
        
        if(!isPasswordValid){
            throw new APIError(401, "Invalid credentials");
        }
        const {accessToken  , refreshToken} = await generateAccessAndRefreshToken(user._id);
        user.isActive = true;
        await user.save();
        user = await User.findById(user._id).select("-password  -__v -createdAt -updatedAt");
        return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json({message: "User logged in successfully", user , accessToken});

    } catch (error) {
        console.error("Error logging in user:", error);
        return res.status(500).json({message: "Internal server error", error: error.message});
    }
})

export const logoutUser = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if(!user){
            throw new APIError(404, "User not found");
        }
        user.isActive = false;
        user.refreshToken = "";
        await user.save();
       return res.clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .status(200).json({message: "User logged out successfully"});
    } catch (error) {
        console.error("Error logging out user:", error);
        return res.status(500).json({message: "Internal server error", error: error.message});
    }

})

export const getUserProfile = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password -__v -createdAt -updatedAt");
        if (!user) {
            throw new APIError(404, "User not found");
        }
        if(user.isDeleted){
            throw new APIError(403, "Account has been deleted, please contact support");
        }
        return res.status(200).json({ user });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return res.status(500).json({ message: "Internal server error" , error: error.message});
    }
});


export const updateUserProfile = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            throw new APIError(404, "User not found");
        }
        if(user.isDeleted){
            throw new APIError(403, "Account has been deleted, please contact support");
        }
        const { fullname, email } = req.body;

        if([fullname,email].some((item) => item.trim() === "")){
            throw new APIError(400, "All fields are required");
        }
        user.fullname = fullname || user.fullname;
        user.email = email || user.email;
        await user.save();
        return res.status(200).json({ message: "User profile updated successfully", user });
    } catch (error) {
        console.error("Error updating user profile:", error);
        return res.status(500).json({ message: "Internal server error" , error: error.message});
    }
});

export const changeUserPassword = asyncHandler(async (req, res) => {
    try {
        let user = await User.findById(req.user._id);
        if (!user) {
            throw new APIError(404, "User not found");
        }
        if(user.isDeleted){
            throw new APIError(403, "Account has been deleted, please contact support");
        }
        const { currentPassword, newPassword } = req.body;
        if ([currentPassword, newPassword].some((item) => item.trim() === "")) {
            throw new APIError(400, "All fields are required");
        }
        console.log("new password is here :",newPassword);
        console.log("old password is also here :",currentPassword);
        
        const isPasswordValid = await user.comparePassword(currentPassword);
        if (!isPasswordValid) {
            console.log("password is not valid");
            throw new APIError(401, "Invalid credentials");
            
        }
        user.password = newPassword;
        await user.save();
        return res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
        console.error("Error changing user password:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message});
    }
});

export const refreshToken = asyncHandler(async (req, res) => {
    try {
        const token = req.cookies?.refreshToken || req.headers?.authorization?.split(" ")[1];
        if (!token) {
            throw new APIError(401, "No refresh token provided");
        }
        const decoded = jwt.verify(token, process.env.KEY);
        const user = await User.findById(decoded.id);
        if (!user) {
            throw new APIError(404, "User not found");
        }
        if(user.isDeleted){
            throw new APIError(403, "Account has been deleted, please contact support");
        }
        if(user.isActive === false){
            throw new APIError(403, "User is logged out, please login again");
        }

        const newAccessToken = user.generateAccessToken();
        return res.status(200).json({ accessToken: newAccessToken });
    } catch (error) {
        console.error("Error refreshing token:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message});
    }
});

export const changeUserProfilePicture = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            throw new APIError(404, "User not found");
        }
        if(user.isDeleted){
            throw new APIError(403, "Account has been deleted, please contact support");
        }
        const profileImagePath = req.file?.path;
        if (!profileImagePath) {
            throw new APIError(400, "No profile image provided");
        }
        const oldImagePublicId = user.profileImagePublicId;
        const upload = await uploadToCloudinary(profileImagePath);
        if(!upload){
            throw new APIError(500, "Error uploading profile image");
        }
        await deleteFromCloudinary(oldImagePublicId);
        user.profileImage = upload.url;
        user.profileImagePublicId = upload.public_id;
        await user.save();
        return res.status(200).json({ message: "Profile picture updated successfully" });
    } catch (error) {
        console.error("Error changing profile picture:", error);
        unlinkSync(req.file.path);
        return res.status(500).json({ message: "Internal server error", error: error.message});
    }
});

export const getAllUsers = asyncHandler(async (req, res) => {
    try {
        const _id = req.params._id;
        if (_id) {
            const user = await User.findById(_id).select("-password -__v -createdAt -updatedAt");
            if (!user) {
                throw new APIError(404, "User not found");
            }
            return res.status(200).json({ user });
        }
        const users = await User.find().select("-password -__v -createdAt -updatedAt");
        return res.status(200).json({ users });
    } catch (error) {
        console.error("Error fetching all users:", error);
        throw new APIError(500, error.message, error);
    }
});

export const toggleFavoriteSong = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            throw new APIError(404, "User not found");
        }
        const { songId } = req.params;
        if (!songId) {
            throw new APIError(400, "Song ID is required");
        }
        const index = user.favorites.indexOf(songId);
        if (index > -1) {
            user.favorites.splice(index, 1);
        } else {
            user.favorites.push(songId);
        }
        await user.save();
        return res.status(200).json({ message: "Favorite songs updated successfully", favorites: user.favorites });
    } catch (error) {
        console.error("Error toggling favorite song:", error);
        throw new APIError(500,error.message,error);
    }
});

export const deleteUserAccount = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            throw new APIError(404, "User not found");
        }
        user.isDeleted = true;
        await user.save();
        return res.status(200).json({ message: "your account has been deleted successfully" });
    } catch (error) {
        console.error("Error deleting user account:", error);
        throw new APIError(500, error.message, error);
    }
});



export const getUserHistory = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate({path:"history",
            options: { sort: { createdAt: -1 } }});
        if (!user) {
            throw new APIError(404, "User not found");
        }
        return res.status(200).json({ history: user.history });
    } catch (error) {
        console.error("Error fetching user history:", error);
        throw new APIError(500, error.message, error);
    }
});

export const getUserFollowCount = asyncHandler(async (req, res) => {
    try {
        const userId = req.params.id || req.user._id;
        const user = await User.findById(userId);
        if (!user) {
            throw new APIError(404, "User not found");
        }
        const [followersCount, followingCount] = await Promise.all([
            Follow.countDocuments({ following: user._id }),
            Follow.countDocuments({ follower: user._id })
        ]);
        return res.status(200).json({ followers: followersCount, following: followingCount });
        
    } catch (error) {
        console.error("Error fetching user followers:", error);
        throw new APIError(500, error.message, error);
    }
});

export const getUserFollowings = asyncHandler(async (req, res) => {
    try {
        const userId = req.params.id || req.user._id;
        const user = await User.findById(userId);
        if (!user) {
            throw new APIError(404, "User not found");
        }
        const following = await Follow.aggregate([
            {
                $match: { follower: new mongoose.Types.ObjectId(user._id) }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "following",
                    foreignField: "_id",
                    as: "followingDetails"
                }
            },
            {
                $unwind: "$followingDetails"
            },
            {
                $project: {
                    _id: 0,
                    following: "$followingDetails._id",
                    username: "$followingDetails.username",
                    fullname: "$followingDetails.fullname",
                    profileImage: "$followingDetails.profileImage",
                }
            }
        ])

        if (!following.length) {
            return res.status(200).json({ following: [] });
        }
        return res.status(200).json({ following });
    } catch (error) {
        console.error("Error fetching user followings:", error);
        throw new APIError(500, error.message, error);
    }
});

export const getUserFollowers = asyncHandler(async (req, res) => {
    try {
        const userId = req.params.id || req.user._id;   
        const user = await User.findById(userId);
        if (!user) {
            throw new APIError(404, "User not found");
        }
        const followers = await Follow.aggregate([
            {
                $match: { following: new mongoose.Types.ObjectId(user._id) }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "follower",
                    foreignField: "_id",
                    as: "followerDetails"
                }
            },
            {
                $unwind: "$followerDetails"
            },
            {
                $project: {
                    _id: 0,
                    follower: "$followerDetails._id",
                    username: "$followerDetails.username",
                    fullname: "$followerDetails.fullname",
                    profileImage: "$followerDetails.profileImage",
                }
            }
        ])

        if (!followers.length) {
            return res.status(200).json({ followers: [] });
        }
        return res.status(200).json({ followers });
    } catch (error) {
        console.error("Error fetching user followers:", error);
        throw new APIError(500, error.message, error);
    }
});


