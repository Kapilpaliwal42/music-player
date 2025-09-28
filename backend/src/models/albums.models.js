import { Schema } from "mongoose";
const albumSchema = new Schema({
  name: { type: String, required: true },
  artist: [{ type: Schema.Types.ObjectId, ref: "Artist", required: true }],
  artistName: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true,
    default: "unknown"
  },
  description: { type: String },
  releaseDate: { type: Date, required: true },
  genre: { type: String, required: true },
  coverImage: { type: String, required: true },
  songs: [{ type: Schema.Types.ObjectId, ref: "Song" }],
  source: {
    type: String,
    enum: ["local", "ytmusic"],
    required: true
  }
},
 { timestamps: true }
);

const Album = mongoose.model("Album", albumSchema);

export default Album;
