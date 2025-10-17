import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import User from './src/models/user.models.js'; // adjust path

await mongoose.connect(`mongodb+srv://paliwalkapil371:7791986741@cluster0.z2j9tqx.mongodb.net/spotify`);

await User.updateMany(
  { isDeleted: { $exists: true } },
  { $unset: { isDeleted: "" } }
);

console.log("Removed 'isDeleted' from all users");
await mongoose.disconnect();