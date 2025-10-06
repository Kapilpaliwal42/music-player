import Playlist from "../models/playlist.models.js";
import User from "../models/user.models.js";
import Song from "../models/song.models.js";
import asyncHandler from "../utils/asyncHandler.js";
import APIError from "../utils/APIError.js";
import { uploadToCloudinary , deleteFromCloudinary} from "../utils/cloudinary.js";
import { unlinkSync } from "fs";
import mongoose from "mongoose";

export const getAllPublicPlaylists = asyncHandler(async (req, res) => {
    try {
        const playlists = await Playlist.find({isPublic: true}).populate("user" ,"username profileImage").select("-songs");
        if (!playlists || playlists.length === 0) {
        return res.status(200).json({ message: "No public playlists found.", playlists: [] });
    }

    return res.status(200).json({ playlists });

    } catch (error) {
        throw new APIError(500, error.message, error);
    }
});

export const getPlaylistById = asyncHandler(async (req, res) => {
    try {
        const playlistId = req.params.id;
        const playlist = await Playlist.findById(playlistId).populate("user", "username profileImage").populate({
            path: "songs",
            populate: [ 
                { path: "artist", select: "name image" },
                { path: "album", select: "name coverImage" }
            ],
            select: "title artistName albumName duration coverImage audioFile" 
        });
        if (!playlist) {
            throw new APIError(404, "Playlist not found");
        }

        if (!playlist.isPublic && playlist.user.toString() !== req.user._id.toString()) {
            throw new APIError(403, "Access denied. This playlist is private.");
        }
        return res.status(200).json({ playlist });

    } catch (error) {
      throw new APIError(500, error.message, error); 
    }
})

export const createPlaylist = asyncHandler(async (req, res) => {
    try {
        const { name, description, isPublic } = req.body;
        if (!name.trim()) {
            throw new APIError(400, "Name is required");
        }
        const user = await User.findById(req.user._id);
        if (!user) {
            throw new APIError(404, "User not found");
        }
        const coverImage = req.file?.path;
        if (!coverImage) {
            throw new APIError(400, "Cover image is required");
        }
        const upload = await uploadToCloudinary(coverImage);

        if (!upload) {
            throw new APIError(500, "Error uploading cover image");
        }


        const playlist = new Playlist({
            name,
            description,
            isPublic,
            user: user._id,
            coverImage: upload.url,
            coverId: upload.public_id
        });
        await playlist.save();
        return res.status(201).json({ message: "Playlist created successfully", playlist });
    } catch (error) {
        console.error("Error creating playlist:", error);
       if (req.file) {
         unlinkSync(req.file.path);
       }
        throw new APIError(500, error.message, error);   
    }
})

export const getUserPlaylists = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            throw new APIError(404, "User not found");
        }
        const playlists = await Playlist.find({ user: user._id }).populate("user", "username profileImage").select("-songs").sort({ createdAt: -1 });
        if (!playlists || playlists.length === 0) {
        return res.status(200).json({ message: "No playlists found for this user.", playlists: [] });
    }

        return res.status(200).json({ playlists });
    } catch (error) {
        throw new APIError(500, error.message, error);   
    }
})

export const updatePlaylist = asyncHandler(async (req, res) => {
    try {
        const playlistId = req.params.id;
        const { name, description, isPublic } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) {
            throw new APIError(404, "User not found");
        }
        const playlist = await Playlist.findById(playlistId);
        if(!playlist){
            throw new APIError(404, "Playlist not found");
        }
        if (playlist.user.toString() !== user._id.toString()|| user.role !== "admin") {
            throw new APIError(403, "Access denied. You are not the owner of this playlist.");
        }

        const coverImage = req.file?.path;
        if (coverImage) {
            const upload = await uploadToCloudinary(coverImage);
            if(!upload){
                throw new APIError(500, "Error uploading cover image");
                
            }
            if (playlist.coverImage) {
                await deleteFromCloudinary(playlist.coverId);
            }
            playlist.coverImage = upload.url;
            playlist.coverId = upload.public_id;
        }

        playlist.name = name || playlist.name;
        playlist.description = description || playlist.description;
        playlist.isPublic = isPublic !== undefined ? isPublic : playlist.isPublic;
        await playlist.save();
        return res.status(200).json({ message: "Playlist updated successfully", playlist });

    } catch (error) {
        console.error("Error updating playlist:", error);
        if (req.file) {
            unlinkSync(req.file.path);
        }
        throw new APIError(500, error.message, error);       
    }
})

export const addSongsToPlaylist = asyncHandler(async (req, res) => {
    try {
        const playlistId = req.params.id;
        const { songIds } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) {
            throw new APIError(404, "User not found");
        }
        const playlist = await Playlist.findById(playlistId);
        if(!playlist){
            throw new APIError(404, "Playlist not found");

        }
        if (playlist.user.toString() !== user._id.toString()|| user.role !== "admin") {
            throw new APIError(403, "Access denied. You are not the owner of this playlist.");
        }
        songIds = Array.isArray(songIds) ? songIds : [songIds];
        const songs = await Song.find({ _id: { $in: songIds } });
        if (songs.length !== songIds.length) {
            throw new APIError(404, "One or more songs not found");
        }
        playlist.songs = [...new Set([...playlist.songs, ...songIds])];
        await playlist.save();
        return res.status(200).json({ message: "Songs added to playlist successfully", playlist });
    } catch (error) {
        throw new APIError(500, error.message, error);   
    }
});

export const removeSongsFromPlaylist = asyncHandler(async (req, res) => {
    try {
        const playlistId = req.params.id;
        const { songIds } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) {
            throw new APIError(404, "User not found");
        }
        const playlist = await Playlist.findById(playlistId);
        if(!playlist){
            throw new APIError(404, "Playlist not found");
        }
        if (playlist.user.toString() !== user._id.toString()|| user.role !== "admin") {
            throw new APIError(403, "Access denied. You are not the owner of this playlist.");
        }
        songIds = Array.isArray(songIds) ? songIds : [songIds];
        const songs = await Song.find({ _id: { $in: songIds } });
        if (songs.length !== songIds.length) {
            throw new APIError(404, "One or more songs not found");
        }
        if(playlist.songs.length === 0){
            throw new APIError(400, "Playlist is empty");
        }
        playlist.songs = playlist.songs.filter(songId => !songIds.includes(songId.toString()));
    
        playlist.save();
        return res.status(200).json({ message: "Songs removed from playlist successfully", playlist });
    
    } catch (error) {
      throw new APIError(500, error.message, error);   
    }
});

export const deletePlaylist = asyncHandler(async (req, res) => {
    try {
        const playlistId = req.params.id;
        const user = await User.findById(req.user._id);
        if (!user) {
            throw new APIError(404, "User not found");
        }
        const playlist = await Playlist.findById(playlistId);
        if(!playlist){
            throw new APIError(404, "Playlist not found");
        }
        if (playlist.user.toString() !== user._id.toString()|| user.role !== "admin") {
            throw new APIError(403, "Access denied. You are not the owner of this playlist.")
        }
        await deleteFromCloudinary(playlist.coverId);
        await Playlist.deleteOne({ _id: playlistId });
        return res.status(200).json({ message: "Playlist deleted successfully" });
    }
    catch(error){
        throw new APIError(500, error.message, error);
    }
})