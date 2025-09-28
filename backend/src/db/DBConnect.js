import mongoose from "mongoose";
import { appName } from "../../Constants.js";
const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.DATABASE}/${appName}`);
        console.log("MongoDB connected");
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        process.exit(1);
    }
};
export default connectDB;
