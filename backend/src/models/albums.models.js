import { Schema } from "mongoose";
import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const albumSchema = new Schema({
  name: { type: String, required: true },
  artist: [{ type: Schema.Types.ObjectId, ref: "Artist", required: true }],
  artistName: [{
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true,
    default: "unknown"
  }],
  description: { type: String },
  releaseDate: { type: Date, required: true },
  genre: { type: String, required: true },
  coverImage: { type: String, required: true },
  coverId: { type: String },
  songs: [{ type: Schema.Types.ObjectId, ref: "Song" }]
},
 { timestamps: true }
);

albumSchema.plugin(mongooseAggregatePaginate);

albumSchema.index({ name: 1, artist: 1 }, { unique: true });

const Album = mongoose.model("Album", albumSchema);


export default Album;
