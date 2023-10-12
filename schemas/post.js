const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PostSchema = new Schema({
  imageName: String,
  caption: String,
});

const Post = mongoose.model("Post", PostSchema);
module.exports = Post;
