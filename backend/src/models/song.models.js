import { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const songSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  artist: {
    type: Schema.Types.ObjectId,
    ref: "Artist",
    required: true
  },
  artistName: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true,
    default: "unknown"
  },
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
  audioFile: {
    type: String,
    required: true
  }, 
  lyrics: {
    type: String
  }, 
  videoId: {
    type: String
  },
  playCount: {
    type: Number,
    default: 0
  },
  source: {
    type: String,
    enum: ["local", "ytmusic"],
    required: true
  }

}, { timestamps: true });


songSchema.plugin(mongooseAggregatePaginate);

const Song = mongoose.model("Song", songSchema);

export default Song;
