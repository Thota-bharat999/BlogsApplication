const Blogs = require('./blogsModel');
const { v4: uuidv4 } = require("uuid");
const BlogsCategory = require('./categoryModel'); // still needed for validation when creating/updating blogs

// Get Blogs (Paginated)
exports.getBlogs = async (req, res) => {
  try {
    let { page = 1, limit = 10, sortBy = "createdAt" } = req.query;

    page = Number(page);
    limit = Number(limit);

    const skip = (page - 1) * limit;

    const [blogs, total] = await Promise.all([
      Blogs.find({})
        .populate('categoryId')
        .sort({ [sortBy]: -1 })
        .skip(skip)
        .limit(limit),
      Blogs.countDocuments(),
    ]);

    res.json({
      blogs: blogs.map((b) => ({
        id: b.blogId,
        title: b.title,
        description: b.description,
        imageUrl: b.imageUrl,
        category: b.categoryId ? {
          id: b.categoryId.categoryId,   // ✅ return custom id
          name: b.categoryId.name,
        } : null,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      })),
      page,
      limit,
      total,
    });
  } catch (err) {
    console.error("Get Blogs Error:", err.message);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};

// =============================
// Create Blog
// =============================
exports.createBlog = async (req, res) => {
  try {
    const { title, description, categoryId, imageUrl } = req.body;

    if (!title || !description || !categoryId || !imageUrl) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const category = await BlogsCategory.findOne({ categoryId }); // ✅ validate category exists
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const blogId = "blog_" + uuidv4().slice(0, 6);

    const newBlog = new Blogs({
      blogId,
      title,
      description,
      categoryId: category._id, // store ObjectId reference
      imageUrl
    });

    const saved = await newBlog.save();
    await saved.populate('categoryId');

    res.status(201).json({
      message: "Blog created successfully",
      blog: {
        id: saved.blogId,
        title: saved.title,
        description: saved.description,
        category: {
          id: category.categoryId,
          name: category.name,
        },
        imageUrl: saved.imageUrl,
      },
    });
  } catch (err) {
    console.error("Create Blog Error:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};

// =============================
// Get Blog By ID
// =============================
exports.getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blogs.findOne({ blogId: id }).populate('categoryId');

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.json({
      blog: {
        id: blog.blogId,
        title: blog.title,
        description: blog.description,
        imageUrl: blog.imageUrl,
        category: blog.categoryId ? {
          id: blog.categoryId.categoryId,
          name: blog.categoryId.name,
        } : null,
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt,
      }
    });
  } catch (err) {
    console.error("Get Blog By ID Error:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};

// =============================
// Update Blog
// =============================
exports.updateBlogs = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, categoryId, imageUrl } = req.body;

    if (!title && !description && !categoryId && !imageUrl) {
      return res.status(400).json({ message: "At least one field is required to update" });
    }

    let updateData = { title, description, imageUrl };
    if (categoryId) {
      const category = await BlogsCategory.findOne({ categoryId });
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      updateData.categoryId = category._id;
    }

    const updated = await Blogs.findOneAndUpdate(
      { blogId: id },
      updateData,
      { new: true }
    ).populate('categoryId');

    if (!updated) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.json({
      message: "Blog updated successfully",
      blog: {
        id: updated.blogId,
        title: updated.title,
        description: updated.description,
        category: updated.categoryId ? {
          id: updated.categoryId.categoryId,
          name: updated.categoryId.name,
        } : null,
        imageUrl: updated.imageUrl,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (err) {
    console.error("Update Blog Error:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};

// =============================
// Delete Blog
// =============================
exports.deleteBlogs = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Blogs.findOneAndDelete({ blogId: id });

    if (!deleted) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.json({ message: "Blog deleted successfully" });
  } catch (err) {
    console.error("Delete Blog Error:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};
