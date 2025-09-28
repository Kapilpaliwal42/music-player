import User from "../models/user.models.js";
import Song from "../models/song.models.js";
import { deleteFromCloudinary , uploadToCloudinary } from "../utils/cloudinary.js";
import asyncHandler from "../utils/asyncHandler.js";
import APIError from "../utils/APIError.js";
import mongoose from "mongoose";


export const uploadS