import User from "../models/user.models.js";
import Song from "../models/song.models.js";
import { deleteImageFromCloudinary,deleteMusicFromCloudinary , uploadBufferToCloudinary } from "../utils/cloudinary.js";
import asyncHandler from "../utils/asyncHandler.js";
import APIError from "../utils/APIError.js";
import mongoose from "mongoose";
import Album from "../models/albums.models.js";
import Artist from "../models/artist.models.js";
import Playlist from "../models/playlist.models.js";






export const uploadSong = asyncHandler(async (req, res)=>{
    try {
        let {title, year, genre, duration, description , artistIds, albumId, lyrics} = req.body;
        const requiredFields = [title, artistIds, genre, albumId];
if (requiredFields.some(item => typeof item !== "string" || item.trim() === "")) {
  throw new APIError(400, "title, artistId, genre, albumId are required");
}

        const audioFile = req.files?.audioFile?.[0];
        const coverImage = req.files?.coverImage?.[0];
        if(!audioFile || !coverImage){
            throw new APIError(400, "Audio file and cover image are required");
            }
        artistIds = Array.isArray(artistIds) ? artistIds : [artistIds];

       const artists = await Artist.find({ _id: { $in: artistIds } });
        if (artists.length !== artistIds.length) {
            throw new APIError(404, "One or more artists not found");
        }

        const artistName = artists.map(artist => artist.name);
 
        const album = await Album.findById(albumId);
        if (!album) {
            throw new APIError(404, "Album not found");
        }
        const albumName = album.name;

        const audioUpload = await uploadBufferToCloudinary(audioFile.buffer, `songs/${Date.now()}_${audioFile.originalname}`);
        const coverUpload = await uploadBufferToCloudinary(coverImage.buffer, `covers/${Date.now()}_${coverImage.originalname}`);

        if(!audioUpload || !coverUpload){
            await deleteMusicFromCloudinary(audioUpload?.public_id);
            await deleteImageFromCloudinary(coverUpload?.public_id);
         throw new APIError(500, "Error uploading audio or cover image");
        }

        const song = new Song({
            title,
            artistName,
            albumName,
            year: year || album.releaseDate.getFullYear(),
            genre,
            duration,
            description,
            audioFile: audioUpload?.url,
            audioId: audioUpload?.public_id,
            artist: artistIds,
            album: albumId,
            coverImage: coverUpload?.url,
            coverId: coverUpload?.public_id,
            owner: req.user._id,
            lyrics: lyrics || "No lyrics available"
        })
        await song.save();
        await album.songs.push(song._id);
        await album.save();

        return res.status(201).json({message: "Song uploaded successfully", song});

    } catch (error) {
        console.error("Error uploading song:", error);
        throw new APIError(500, error.message, error);   
    }
})

export const searchSongs = asyncHandler(async (req, res)=>{
    try {
        const {query} = req.query;
        if(!query){
            throw new APIError(400, "Query is required");
        }
        let songs = await Song.find({
            $or:[
                {title:{$regex: query, $options: "i"}},
                {artistName:{$regex: query, $options: "i"}},
                {albumName:{$regex: query, $options: "i"}},
                {genre:{$regex: query, $options: "i"}},
                {description:{$regex: query, $options: "i"}},
                {lyrics:{$regex: query, $options: "i"}}
                ]
        }).populate("artist", "name image")
    .populate("album", "name coverImage").select("-__v -createdAt -updatedAt -audioFile -audioId -coverId")
    .limit(30)
    .sort({ playCount: -1 });
        let artists = await Artist.find({name:{$regex: query, $options: "i"}});
        let albums = await Album.find({name:{$regex: query, $options: "i"}});
        let playlists = await Playlist.find({name:{$regex: query, $options: "i"}});

        if(!playlists.length){
            playlists = [];
        }
        if(!songs.length){
            songs = [];
        }
        if(!artists.length){
            artists = [];
        }
        if(!albums.length){
            albums = [];
        }
        songs.sort((a, b) => b.playCount - a.playCount);
        albums.sort((a, b) => b.name - a.name);
        artists.sort((a, b) => b.name - a.name);
        playlists.sort((a, b) => b.name - a.name);

        songs.splice(30);
        return res.status(200).json({songs,artists,albums,playlists});
    } catch (error) {
        console.error("Error searching songs:", error);
        throw new APIError(500,error.message,error);
    }
})

export const getSongById = asyncHandler(async (req, res)=>{
    try {
        const songId = req.params.id;
        let song = await Song.findById(songId).populate("artist","name image").populate("album","name coverImage artistName");
        if(!song){
            throw new APIError(404, "Song not found");
        }

        song.playCount =  song.playCount + 1;
        await song.save();

        if(req.user){
            let user = await User.findById(req.user._id);
            if(user){
                user.history = user.history.filter(id=>id.toString() !== song._id.toString())
                user.history.unshift(song._id);
                user.history = user.history.slice(0,50);
                await user.save();
            }
        }
        return res.status(200).json({song});
    } catch (error) {
        throw new APIError(500, error.message, error);
    }
})


export const getAllSongs = asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      genre,
      artistId,
      albumId,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const filter = {};
    if (genre) filter.genre = genre;
    if (artistId && mongoose.Types.ObjectId.isValid(artistId)) {
      filter.artist = new mongoose.Types.ObjectId(artistId);
    }
    if (albumId && mongoose.Types.ObjectId.isValid(albumId)) {
      filter.album = new mongoose.Types.ObjectId(albumId);
    }

    const aggregateQuery = Song.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "artists",
          localField: "artist",
          foreignField: "_id",
          as: "artist"
        }
      },
      {
        $lookup: {
          from: "albums",
          localField: "album",
          foreignField: "_id",
          as: "album"
        }
      },
      {
        $unwind: "$artist"
      },
      {
        $unwind: "$album"
      },
      {
        $project: {
          __v: 0,
          createdAt: 0,
          updatedAt: 0,
          audioFile: 0,
          audioId: 0,
          coverId: 0
        }
      }
    ]);

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 }
    };

    const songs = await Song.aggregatePaginate(aggregateQuery, options);

    return res.status(200).json({
      success: true,
      data: songs.docs,
      totalPages: songs.totalPages,
      currentPage: songs.page,
      totalSongs: songs.totalDocs
    });
  } catch (error) {
    throw new APIError(500, error.message, error);
  }
});

export const updateSong = asyncHandler(async (req, res)=>{
    try {
        const songId = req.songId || req.params.id ;
        if(!songId){
            throw new APIError(400, "Song ID is required");
        }
        let song = await Song.findById(songId);
        if(!song){
            throw new APIError(404, "Song not found");
        }

        const {title, year, genre, duration, description , artistIds, albumId, lyrics} = req.body;


         if (req.files?.audioFile?.[0]) {
        const audioUpload = await uploadBufferToCloudinary(req.files.audioFile[0].buffer, `songs/${Date.now()}_${req.files.audioFile[0].originalname}`);
        if (!audioUpload) throw new APIError(500, "Failed to upload new audio file");
        if (song.audioFile) await deleteMusicFromCloudinary(song.audioId);
        song.audioFile = audioUpload.url;
        song.audioId = audioUpload.public_id;
    }

    if (req.files?.coverImage?.[0]) {
        const coverUpload = await uploadBufferToCloudinary(req.files.coverImage[0].buffer, `covers/${Date.now()}_${req.files.coverImage[0].originalname}`);
        if (!coverUpload) throw new APIError(500, "Failed to upload new cover image");
        if (song.coverImage) await deleteImageFromCloudinary(song.coverId);
        song.coverImage = coverUpload.url;
        song.coverId = coverUpload.public_id;
    }

    if (artistIds) {
        const artists = await Artist.find({ _id: { $in: artistIds } });
        if (artists.length !== artistIds.length) {
            throw new APIError(400, "One or more specified artists not found.");
        }
        song.artist = artistIds;
        song.artistName = artists.map(artist => artist.name);
    }

    if (albumId && song.album.toString() !== albumId){
        const newAlbum = await Album.findById(albumId);
        if (!newAlbum) {
            throw new APIError(400, "Album not found.");
        }
        let oldAlbum = await Album.findById(song.album);
        if(oldAlbum){
            oldAlbum.songs = oldAlbum.songs.filter(id=>id.toString() !== song._id.toString());
            await oldAlbum.save();
        }
        newAlbum.songs.push(song._id);
        await newAlbum.save();
        song.album = albumId;
        song.albumName = newAlbum.name;
    }

    song.title = title || song.title;
    song.year = year || song.year;
    song.genre = genre || song.genre;
    song.duration = duration || song.duration;
    song.description = description || song.description;
    song.lyrics = lyrics || song.lyrics || "No lyrics available";

    await song.save();
    return res.status(200).json({message: "Song updated successfully", song});



    }
    catch(error){
        console.error("Error updating song:", error);
        throw new APIError(500, error.message, error);
    }
})

export const deleteSong = asyncHandler(async (req, res)=>{
    try {
        const songId = req.params.id || req.query.songId;

        const song = await Song.findById(songId);
        if(!song){
            throw new APIError(404, "Song not found");
        }

        const album = await Album.findById(song.album);
        if(album){
            album.songs = album.songs.filter(id=>id.toString() !== song._id.toString());
            await album.save();
        }
        
        await User.updateMany(
          { $or: [{ favorites: song._id }, { history: song._id }, { playlists: song._id}] },
          { $pull: { favorites: song._id, history: song._id, playlists: song._id }  }
        );
        await deleteMusicFromCloudinary(song.audioId);
        await deleteImageFromCloudinary(song.coverId);

        await Song.deleteOne({_id: song._id});
        return res.status(200).json({message: "Song deleted successfully"});
    }
    catch(error){
        throw new APIError(500, error.message, error);
    }
})

export const playNextSong = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) throw new APIError(404, "User not found");

    const lastPlayedId = user.history?.[0];
    if (!lastPlayedId) throw new APIError(400, "No song history found");

    const song = await Song.findById(lastPlayedId);
    if (!song) throw new APIError(404, "Last played song not found");

    const candidates = await Song.find({
      _id: { $ne: song._id },
      $or: [
        { artist: { $in: song.artist } },
        { album: song.album },
        { genre: song.genre },
        { year: song.year }
      ]
    });

    if (!candidates.length) {
      return res.status(200).json({ message: "No more songs to play" });
    }

    const randomSong = candidates[Math.floor(Math.random() * candidates.length)];

    
    user.history.unshift(randomSong._id);
    randomSong.playCount++;
    await randomSong.save();
    await user.save();

    return res.status(200).json({ song: randomSong });

  } catch (error) {
    console.error("Error in playNextSong:", error);
    return next(error instanceof APIError ? error : new APIError(500, "Internal server error", [], error.stack));
  }
});

export const playPreviousSong = asyncHandler(async (req, res, next) => {
    try {
    const user = await User.findById(req.user._id);
    if (!user) throw new APIError(404, "User not found");
    const lastPlayedId = user.history?.[1];
        const previousSong = await Song.findById(lastPlayedId);
        if (!previousSong) throw new APIError(404, "Last played song not found");
        previousSong.playCount++;
        await previousSong.save();

    res.status(200).json({ song: previousSong });
    } catch (error) {
        console.error("Error in playPreviousSong:", error);
        throw new APIError(500,error.message, [], error.stack);
    }
});


export const getTopPlayedSongs = asyncHandler(async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const songs = await Song.find().sort({ playCount: -1 }).limit(limit);
        return res.status(200).json({ songs });
    } catch (error) {
        console.error("Error fetching top played songs:", error);
         throw new APIError(500, error.message, error);       
    }
});

export const getMostRecentSongs = asyncHandler(async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const songs = await Song.find().sort({ createdAt: -1 }).limit(limit);
        return res.status(200).json({ songs });
    } catch (error) {
        console.error("Error fetching most recent songs:", error);
        throw new APIError(500, error.message, error);
    }
});

export const getSongsByArtist = asyncHandler(async (req, res) => {
    try {
        const artistId = req.params.artistId;
        const artist = await Artist.findById(artistId);
        if (!artist) {
            throw new APIError(404, "Artist not found");
        }
        const songs = await Song.find({ artist: artistId }).sort({ playCount: -1 });
        return res.status(200).json({ songs });
    } catch (error) {
        console.error("Error fetching songs by artist:", error);
        throw new APIError(500, error.message, error);
    }
});

export const getSongsByAlbum = asyncHandler(async (req, res) => {
    try {
        const albumId = req.params.albumId;
        const album = await Album.findById(albumId);
        if (!album) {
            throw new APIError(404, "Album not found");
        }
        const songs = await Song.find({ album: albumId }).sort({ playCount: -1 });
        return res.status(200).json({ songs });
    } catch (error) {
        console.error("Error fetching songs by album:", error);
        throw new APIError(500, error.message, error);
    }
});
