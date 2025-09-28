import { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const likeSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  song: { type: Schema.Types.ObjectId, ref: "Song", required: true }
},
 { timestamps: true }
);

likeSchema.index({ user: 1, song: 1 }, { unique: true });

likeSchema.plugin(mongooseAggregatePaginate);

const Like = mongoose.model("Like", likeSchema);

export default Like;
