const { name } = require('ejs');
const Blogs=require('./blogsModel')
const {v4:uuidv4}=require("uuid");
const BlogsCategory=require('./categoryModel')

exports.getBlogs = async (req, res) => {
    try {
        let { page = 1, limit = 10, sortBy = "createdAt" } = req.query;

        page = Number(page);
        limit = Number(limit);

        const skip = (page - 1) * limit;

        const [blogs, total] = await Promise.all([
            Blogs.find({})
                .populate('categoryId') // 💡 This resolves the categoryId into the full category document
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
                imageUrl: b.imageUrl, // 💡 Fixed field name here
                category: b.categoryId ? { // 💡 Conditionally check for category
                    id: b.categoryId._id,
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
        res.status(500).json({
            message: "Internal Server Error",
            error: err.message,
        });
    }
};

 exports.createBlog = async (req, res) => {
    try {
        const { title, description, categoryId, imageUrl } = req.body;

        // 1. Basic input validation
        if (!title || !description || !categoryId || !imageUrl) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // 2. Check if the provided categoryId is valid
        const category = await Categories.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        // 3. Generate a unique blogId
        const blogId = "blog_" + uuidv4().slice(0, 6);
        
        // 4. Create and save the new blog
        const newBlog = new Blogs({
            blogId,
            title,
            description,
            categoryId, // Storing the ObjectId reference
            imageUrl
        });
        const saved = await newBlog.save();
        
        // 5. Populate the category to send a complete response
        await saved.populate('categoryId');

        res.status(201).json({
            message: "Blog created successfully",
            blog: {
                id: saved.blogId,
                title: saved.title,
                description: saved.description,
                category: {
                    id: saved.categoryId._id,
                    name: saved.categoryId.name
                },
                imageUrl: saved.imageUrl
            }
        });
    } catch (err) {
        console.error("Create Blog Error:", err);
        res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};
 
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
                    id: blog.categoryId._id,
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

// Update an existing blog
exports.updateBlogs = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, categoryId, imageUrl } = req.body;
        
        if (!title && !description && !categoryId && !imageUrl) {
            return res.status(400).json({ message: "At least one field is required to update" });
        }
        
        const updated = await Blogs.findOneAndUpdate(
            { blogId: id },
            { title, description, categoryId, imageUrl },
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
                    id: updated.categoryId._id,
                    name: updated.categoryId.name,
                } : null,
                imageUrl: updated.imageUrl,
                updatedAt: updated.updatedAt,
            },
        });
    } catch (err) {
        console.error("Update Blog Error:", err);
        res.status(500).json({
            message: "Internal Server Error",
            error: err.message
        });
    }
};

// Delete a blog post
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
        res.status(500).json({
            message: "Internal Server Error",
            error: err.message,
        });
    }
};

// Get all categories for a dropdown list
exports.getCategories = async (req, res) => {
    try {
        const categories = await Categories.find({});
        res.json({
            categories: categories.map(cat => ({
                id: cat._id,
                name: cat.name
            }))
        });
    } catch (err) {
        console.error("Get Categories Error:", err);
        res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};
