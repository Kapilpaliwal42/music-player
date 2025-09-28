import { Schema } from "mongoose";
const artistSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    genre: [{ type: String, required: true }],
    image: { type: String, required: true },
    source: {
    type: String,
    enum: ["local", "ytmusic"],
    required: true
  }
},
    
 { timestamps: true }
);

const Artist = mongoose.model("Artist", artistSchema);

export default Artist;