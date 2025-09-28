import { Schema } from "mongoose";

const playlistSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  coverImage: { type: String },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  songs: [{ type: Schema.Types.ObjectId, ref: "Song" }],
  isPublic: { type: Boolean, default: true }
},
 { timestamps: true }
);

const Playlist = mongoose.model("Playlist", playlistSchema);

export default Playlist;
