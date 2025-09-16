const { name } = require('ejs');
const Blogs=require('./blogsModel')
const {v4:uuidv4}=require("uuid");


exports.createBlog=async(req,res)=>{
    try{
        const{title,description, categoryId,imageUrl}=req.body
        if(!title || !description || !categoryId || !imageUrl){
            return res.status(401).json({message:"All fields are required"})
        }
        const blogId="blog_"+uuidv4().slice(0,6);
        const newBlog=new Blogs({
            blogId,
            title,
            description,
            categoryId,
            imageUrl
        });
        const saved=await newBlog.save()
        res.status(201).json({
            message:"Blog created successfully",
            blog:{
                id:saved.blogId,
                name:saved.name,
                description:saved.description,
                categoryId:saved.categoryId,
                imageUrl:saved.imageUrl
            }
        });

    }catch(err){
         console.error("Create Blog Error:", err);
          res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
}

// GetBlogs
exports.getBlogs = async (req, res) => {
  try {
    let { page = 1, limit = 10, sortBy = "createdAt" } = req.query;

    page = Number(page);
    limit = Number(limit);

    const skip = (page - 1) * limit;

    // Fetch blogs with pagination & sorting
    const [blogs, total] = await Promise.all([
      Blogs.find({})
        .sort({ [sortBy]: -1 }) // descending (latest first)
        .skip(skip)
        .limit(limit),
      Blogs.countDocuments(),
    ]);

    res.json({
      blogs: blogs.map((b) => ({
        id: b.blogId,
        title: b.title,
        description: b.description,
        image: b.image,
        categoryId: b.categoryId,
        createdAt: b.createdAt,
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

//update Blog
exports.updateBlogs=async(req,res)=>{
    try{
        const{id}=req.params;
        const{title,description,categoryId,imageUrl}=req.body;
        if(!title && !description && !categoryId && !imageUrl){
            return res.status(401).json({message:"At least one field is required to update"})

        }
        const updated = await Blogs.findOneAndUpdate(
      { blogId: id },  // ✅ Correct query
      { title, description, categoryId, imageUrl },
      { new: true }
    );
        if(!updated){
            return res.status(404).json({message:"Blog not found"})
        }
        res.json({
            message:"Blog updated successfully",
            blog:{
                id:updated.blogId,
                title:updated.title,
                description:updated.description,
                categoryId:updated.categoryId,
                imageUrl:updated.imageUrl,
                updatedAt:updated.updatedAt
            },
        })

    }catch(err){
         console.error("Update Blog Error:", err);
         res.status(500).json({
            message:"Internal Server Error",
            error:err.message
         });
    }
}

// blogDeleted
// Delete Blog
exports.deleteBlogs = async (req, res) => {
  try {
    const { id } = req.params; // This is blogId (e.g., blog_5a84ad)

    // Make sure you're querying by blogId field, not Mongo _id
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
