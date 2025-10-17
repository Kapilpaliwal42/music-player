import mongoose, { Schema } from 'mongoose';

const userLibrarySchema = new Schema({
    user : { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    songs: [{ type: Schema.Types.ObjectId, ref: 'Song' }],
    albums: [{ type: Schema.Types.ObjectId, ref: 'Album' }],
    artists: [{ type: Schema.Types.ObjectId, ref: 'Artist' }],
    playlists: [{ type: Schema.Types.ObjectId, ref: 'Playlist' }]
}, { timestamps: true });

const UserLibrary = mongoose.model('UserLibrary', userLibrarySchema);

export default UserLibrary;