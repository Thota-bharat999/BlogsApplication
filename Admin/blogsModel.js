// blogsModel.js

const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({
  blogId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: String,
  imageUrl: String,
  // 💡 CHANGE type to Schema.Types.ObjectId and add 'ref'
  categoryId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Categories', // Replace 'Categories' with the actual name of your Category model
      required: true 
  },
}, { timestamps: true });

module.exports = mongoose.model("Blogs", blogSchema)