import {Schema} from "mongoose";
import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const followSchema = new Schema({
    follower: { type: Schema.Types.ObjectId, ref: "User", required: true },
    following: { type: Schema.Types.ObjectId, ref: "User", required: true },
},
 { timestamps: true }
);

followSchema.plugin(mongooseAggregatePaginate);

followSchema.index({ follower: 1, following: 1 }, { unique: true });
const Follow = mongoose.model("Follow", followSchema);

export default Follow;