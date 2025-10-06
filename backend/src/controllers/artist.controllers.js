import mongoose from "mongoose";
import Album from "../models/albums.models.js";
import asyncHandler from "../utils/asyncHandler.js";
import Song from "../models/song.models.js";
import APIError from "../utils/APIError.js";
import Artist from "../models/artist.models.js";
import fs from "fs";
import { deleteFromCloudinary, uploadToCloudinary } from "../utils/cloudinary.js";



export const getAllArtists = asyncHandler(async (req, res) => {
  try {
    const  {query}  = req.query;
    const filter = {};

    if (typeof query === 'string' && query.trim()) {
        console.log(query);
        
      filter.name = { $regex: query.trim(), $options: 'i' };
    }
    console.log(filter);
    
    const artists = await Artist.find(filter).sort({ name: 1 });
    return res.status(200).json({ artists });
  } catch (error) {
    console.error("Error fetching artists:", error);
    throw new APIError(500, error.message, error);
  }
});



export const createArtist = asyncHandler(async (req, res) => {
    try {
        let { name, description, genre } = req.body;
        if ([name , genre].some((item) => item.trim() === "")) {
            throw new APIError(400, "All fields are required");
        }
        const existingArtist = await Artist.findOne({
            $and:[
                {name: {$regex: name, $options: "i"}},
                {genre: {$regex: genre, $options: "i"}}
            ]
        });
        if (existingArtist) {
            throw new APIError(409, "Artist with this name and genre already exists");
        }
        const image = req.file?.path;
        if (!image) {
            throw new APIError(400, "Image is required");
        }
        const upload = await uploadToCloudinary(image);
        if (!upload) {
            throw new APIError(500, "Error uploading image");
        }
        const artist = new Artist({
            name,
            description,
            genre,
            image: upload.url,
            imageId: upload.public_id
        });
        await artist.save();
        return res.status(201).json({ message: "Artist created successfully", artist });
        
    } catch (error) {
        console.error("Error creating artist:", error);
        if (fs.existsSync(req.file?.path)) {
                fs.unlinkSync(req.file.path);
            }
        throw new APIError(500, error.message, error);
    }
})

export const getArtistById = asyncHandler(async (req, res) => {
    try {
        const artistId = req.params.id;
        const artist = await Artist.findById(artistId);
        if (!artist) {
            throw new APIError(404, "Artist not found");
        }
        const albums = await Album.find({ artist: artistId }).populate("songs","title duration coverImage").sort({ releaseDate : -1 });
        const songs = await Song.find({ artist: artistId }).sort({ playCount: -1 }).limit(10).select("title albumName coverImage duration");
        return res.status(200).json({ artist , albums , songs});
    } catch (error) {
      console.error("error finding artist",error);
      throw new APIError(500, error.message, error);
        
    }
})



export const updateArtist = asyncHandler(async (req, res) => {
    try {
        const artistId = req.params.id;
        const { name, description, genre } = req.body;
        
        const artist = await Artist.findById(artistId);
        if (!artist) {
            throw new APIError(404, "Artist not found");
        }
        if (name) {
            artist.name = name;
        }
        if (description) {
            artist.description = description;
        }
        if (genre) {
            artist.genre = genre?(Array.isArray(genre)) ? genre : [genre]: artist.genre;
        }
        if (req.file) {
            const image = req.file.path;
            const upload = await uploadToCloudinary(image);
            if(!upload){
                throw new APIError(500, "Error uploading image");
            }
            if (artist.image) {
                await deleteFromCloudinary(artist.imageId);
            }
            artist.image = upload.url;
            artist.imageId = upload.public_id;
        }
        
        await artist.save();
        return res.status(200).json({ message: "Artist updated successfully", artist });


    } catch (error) {
       console.error("error updating artist",error);
       throw new APIError(500, error.message, error);
    }
})

export const deleteArtist = asyncHandler(async (req, res) => {
    try {
        const artistId = req.params.id;
        const artist = await Artist.findById(artistId);
        if (!artist) {
            throw new APIError(404, "Artist not found");
        }
        
        const albums = await Album.find({ artist: artistId });
        for (const album of albums) {
            await deleteFromCloudinary(album.coverId);
            await Album.deleteOne({ _id: album._id });
        }

        const songs = await Song.find({ artist: artistId });
        for (const song of songs) {
            await deleteFromCloudinary(song.audioId);
            await deleteFromCloudinary(song.coverId);
            await Song.deleteOne({ _id: song._id });
        }
        await deleteFromCloudinary(artist.imageId);
        await Artist.deleteOne({ _id: artistId });
        return res.status(200).json({ message: "Artist deleted successfully" });

    } catch (error) {
      console.error("error deleting Artist",error);
       throw new APIError(500, error.message, error); 
    }
})

