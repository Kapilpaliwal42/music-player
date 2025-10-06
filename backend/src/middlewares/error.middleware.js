import ApiError from "../utils/APIError.js";
import mongoose from "mongoose";

export const errorHandler = (err, req, res, next) => {
    let error = err;
    if(!(error instanceof ApiError)){
        const statusCode = error.statusCode || error instanceof mongoose.Error ? 400 : 500;
        const message = error.message || "something went wrong";
        error = new ApiError(statusCode, message,error?.errors || [],err.stack);
    }
    const response = {
        ...error,
        message: error.message,
        ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {})
    };
    res.status(error.statusCode).json(response);
};
export default errorHandler; 