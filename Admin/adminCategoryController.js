
const BlogsCategory=require('./categoryModel');
const { v4: uuidv4 } = require("uuid");

exports.createCategory=async(req,res)=>{
    try{
        console.log("Incoming body:", req.body);
        const {name,description}=req.body;
        if(!name){
            return res.status(400).json({message:"Category name is required"})
        }
        const categoryId="cat_"+uuidv4().slice(0,6);
        const newCategory=new BlogsCategory({
            categoryId,
            name,description
        });
        const saved=await newCategory.save()
        res.status(201).json({
            message: "Category created successfully",
            category:{
                id:saved.categoryId,
                name:saved.name,
                description:saved.description,
            },
        });
    }catch(err){
        console.error("Create Blog Category Error:", err);
        res.status(500).json({
            message: "Internal Server Error",
            error: err.message,
        })
    }
}

// Get Categories
exports.getCategories=async(req,res)=>{
    try{

let {page=1,limit=10}=req.query;
page=Number(page);
limit=Number(limit);
const skip=(page-1)*limit;
const [categories,total]=await Promise.all([
    BlogsCategory.find().skip(skip).limit(limit),
    BlogsCategory.countDocuments()
]);
res.json({
    BlogsCategory:categories.map(cat=>({
        id:cat._id,
        name:cat.name,
        description:cat.description
    })),
    page,
    limit,
    total

});
    }catch(err){
    console.error("Get Categories Error:", err.message);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
    }

}

exports.updateCategory=async(req,res)=>{
  try{
const {id}=req.params;
const {name,description}=req.body;
if (!name && !description){
  return res.status(400).json({message:"Name or description is required"})
}
const updatedCategory=await BlogsCategory.findByIdAndUpdate(
    id,
    {name,description},
    {new:true,runValidators:true}
);
if(!updatedCategory){
    return res.status(404).json({message:"Category is Not Found"})
}
res.json({
    message:"category Update Successfully",
    category:{
        id:updatedCategory._id,
        name:updatedCategory.name,
        description:updatedCategory.description
    }
})

  }catch(err){
console.log("update Category Error",err.message);
res.status(500).json({message:"Server Error ",
    error:err.message,
})
  }
}

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params; // e.g. cat_1811a2

    const deletedCategory = await BlogsCategory.findOneAndDelete({ categoryId: id }); // ✅ custom ID

    if (!deletedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({
      message: "Category deleted successfully",
      category: {
        id: deletedCategory.categoryId,
        name: deletedCategory.name,
        description: deletedCategory.description,
      },
    });
  } catch (err) {
    console.error("Delete Category Error:", err.message);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};
