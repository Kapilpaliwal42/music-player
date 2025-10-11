import mongoose, { Schema  } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const songSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  artist: [{
    type: Schema.Types.ObjectId,
    ref: "Artist",
    required: true
  }],
  artistName: [{
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true,
    default: "unknown"
  }],
  description: {
    type: String
  },
  album: {
    type: Schema.Types.ObjectId,
    ref: "Album",
    required: true
  },
  albumName: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true,
    default: "unknown"
  },
  year: {
    type: Number,
    required: true
  },
  genre: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  }, 
  coverImage: {
    type: String,
    required: true
  }, 
  coverId: {
    type: String
  }, 
  audioFile: {
    type: String,
    required: true
  }, 
  audioId: {
    type: String
  }, 
  lyrics: {
    type: String,
    trim: true,
    default: "No lyrics available"
  }, 
  
  playCount: {
    type: Number,
    default: 0
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  }

}, { timestamps: true });


songSchema.plugin(mongooseAggregatePaginate);

const Song = mongoose.model("Song", songSchema);

export default Song;
