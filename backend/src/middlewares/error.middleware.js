import APIError from "../utils/APIError.js";
import mongoose from "mongoose";

const errorHandler = (err, req, res, next) => {
    let error = err;
    if (!(error instanceof APIError)) {
        const statuscode = error.statuscode || error instanceof mongoose.Error ? 400 : 500;
        const message = error?.message || 'Something went wrong';
        error = new APIError(statuscode, message,error?.errors || [], err?.stack);
    }
    const response = {
        ...error,
        message : error.message,
        ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {}),
    }
    res.status(error.statuscode).json(response);
}
export default errorHandler;
