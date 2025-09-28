import User from "../models/user.models.js";
import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import APIError from "../utils/APIError.js";

export const authenticate = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || req.headers?.authorization?.split(" ")[1];
    if (!token) {
        throw new APIError(401, "Authentication token is missing");
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded._id);
        if (!req.user) {
            throw new APIError(404, "User not found");
        }
        next();
    } catch (error) {
        throw new APIError(401, "Invalid authentication token");
    }
});

export const isAdmin = async (req, res, next) => {
    const user = await User.findById(req.user._id);
    if (user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admins only." });
    }
    next();

}