import { Schema } from "mongoose";
import mongoose from "mongoose";

const playlistSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  coverImage: { type: String },
  coverId: { type: String },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  songs: [{ type: Schema.Types.ObjectId, ref: "Song" }],
  isPublic: { type: Boolean, default: true }
},
 { timestamps: true }
);
playlistSchema.index({ name: 1, user: 1 }, { unique: true });
playlistSchema.index({ coverId: 1, coverImage: 1 }, { required: true });
const Playlist = mongoose.model("Playlist", playlistSchema);

export default Playlist;
