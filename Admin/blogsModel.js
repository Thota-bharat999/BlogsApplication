const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({
  blogId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: String,
  image: String,
  categoryId: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Blogs", blogSchema);
