import Follow from "../models/follow.models.js";
import User from "../models/user.models.js";
import asyncHandler from "../utils/asyncHandler.js";
import APIError from "../utils/APIError.js";

export const toggleFollowUser = asyncHandler(async (req, res) => {
    
        const userId = req.params.id;
        const user = await User.findById(userId);
        if (!user) {
            throw new APIError(404, "User not found");
        }
        const follower = await User.findById(req.user._id);
        if (!follower) {
            throw new APIError(404, "Follower not found");
        }
        const follow = await Follow.findOne({ follower: follower._id, following: user._id });
        if (follow) {
            await Follow.findOneAndDelete({ follower: follower._id, following: user._id });
            return res.status(200).json({ message: "User unfollowed successfully" });
        }
        const newFollow = new Follow({
            follower: follower._id,
            following: user._id
        });
        await newFollow.save();
        return res.status(201).json({ message: "User followed successfully" });
    
});

export const isFollowing = async (req,res) => {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
        throw new APIError(404, "User not found");
    }
    const follower = await User.findById(req.user._id);
    if (!follower) {
        throw new APIError(404, "Follower not found");
    }
    const follow = await Follow.findOne({ follower: follower._id, following: user._id });
    return res.status(200).json({ isFollowing: !!follow });
}
