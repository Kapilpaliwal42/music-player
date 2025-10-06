
import { Schema } from "mongoose";
import mongoose from "mongoose";

const artistSchema = new Schema({
    name: { type: String, required: true , unique: true },
    description: { type: String },
    genre: [{ type: String, required: true }],
    image: { type: String },
    imageId: { type: String , unique: true,sparse: true }
},
    
 { timestamps: true }
);

artistSchema.index({ name: 1, genre: 1 }, { unique: true });
artistSchema.index({imageId: 1,image: 1},{required: true})

const Artist = mongoose.model("Artist", artistSchema);

export default Artist;