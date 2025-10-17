import Album from "../models/albums.models.js";
import Artist from "../models/artist.models.js";
import Song from "../models/song.models.js";
import asyncHandler from "../utils/asyncHandler.js";
import APIError from "../utils/APIError.js";
import { deleteImageFromCloudinary, uploadBufferToCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

export const getAllAlbums = asyncHandler(async (req, res) => {
    try {
        const {query} = req.query;
        let filter = {};
        if(query){
            filter.name = {$regex: query, $options: "i"};
        }
        const albums = await Album.find(filter).populate("artist","name image").populate("songs","title duration").sort({releaseDate: -1});
        return res.status(200).json({ albums });
    } catch (error) {
       console.error("Error fetching albums:", error);
       throw new APIError(500, error.message, error);
    }
});

export const getAlbumById = asyncHandler(async (req, res) => {
    try {
        const albumId = req.params.id;
        console.log(albumId);
        
        const album = await Album.findById(albumId).populate("artist","name image").populate("songs","title duration coverImage");
        if (!album) {
            throw new APIError(404, "Album not found");
        }
        return res.status(200).json({ album });

    } catch (error) {
       console.error("error finding the album",error);
       throw new APIError(500, error.message, error);
    }
})

export const createAlbum = asyncHandler(async (req, res) => {
    try {
        let { name, artistId, description, releaseDate, genre } = req.body;
        if ([name, artistId, genre, releaseDate].some((item) => item?.trim() === "")) {
            throw new APIError(400, "name, artistId, genre, releaseDate are required");
        }

         artistId = Array.isArray(artistId) ? artistId : [artistId];
        console.log(artistId);
        
        const artists = await Artist.find({ _id: { $in: artistId } });
        if (artists.length !== artistId.length) {
            throw new APIError(404, "One or more artists not found");
        }

        const artistName = artists.map(artist => artist.name);

        const existing = await Album.findOne({
            $and: [
                { name: { $regex: name, $options: "i" } },
                { artist: { $in: artistId } }
            ]
        });
        if (existing) {
            throw new APIError(409, "Album with this name and artist already exists");
        }
        const coverImage = req.file;
        if (!coverImage) {
            throw new APIError(400, "Cover image is required");
        }
        const upload = await uploadBufferToCloudinary(coverImage.buffer, `album_covers/${Date.now()}_${coverImage.originalname}`);
        if (!upload) {
            throw new APIError(500, "Error uploading cover image");
        }
        const album = new Album({
            name,
            artist: artistId,
            artistName,
            description,
            releaseDate,
            genre,
            coverImage: upload.url,
            coverId: upload.public_id
        });
        await album.save();
        return res.status(201).json({ message: "Album created successfully", album });


    } catch (error) {
        console.error("Error creating album:", error);
        throw new APIError(500, error.message, error);
    }
});

export const updateAlbum = asyncHandler(async (req, res) => {
    try {
        const albumId = req.params.id;
        let { name, artistId, description, releaseDate, genre } = req.body;
        const album = await Album.findById(albumId);
        if (!album) {
            throw new APIError(404, "Album not found");
        }
        if(artistId){
            artistId = Array.isArray(artistId) ? artistId : artistId.split(" ");
            const artists = await Artist.find({ _id: { $in: artistId } });
            if (artists.length !== artistId.length) {
                throw new APIError(404, "One or more artists not found");
            }
            album.artist = artistId;
            album.artistName = artists.map(artist => artist.name);
        }
        const coverImage = req.file;
        if (coverImage) {
            const upload = await uploadBufferToCloudinary(coverImage.buffer, `album_covers/${Date.now()}_${coverImage.originalname}`);
            if(!upload){
                throw new APIError(500, "Error uploading cover image");
            }
            if (album.coverImage) {
                await deleteImageFromCloudinary(album.coverId);
            }
            album.coverImage = upload.url;
            album.coverId = upload.public_id;
        }
        album.name = name || album.name;
        album.description = description || album.description;
        album.releaseDate = releaseDate || album.releaseDate;
        album.genre = genre || album.genre;
        await album.save();
        return res.status(200).json({ message: "Album updated successfully", album });


    } catch (error) {
     console.error("error updating album",error);
     throw new APIError(500, error.message, error);
    }
});

export const deleteAlbum = asyncHandler(async (req, res) => {
    try {
        const albumId = req.params.id;
        const album = await Album.findById(albumId);
        if (!album) {
            throw new APIError(404, "Album not found");
        }
        await Song.updateMany({ album: albumId }, { $set: { album: "unknown", albumName: "unknown" } });
        await deleteImageFromCloudinary(album.coverId);
        await Album.deleteOne({ _id: albumId });
        return res.status(200).json({ message: "Album deleted successfully" });
    } catch (error) {
        console.error("error deleting album",error);
        throw new APIError(500, error.message, error);
    }
});