const mongoose=require("mongoose");
const blogCategorySchema=new mongoose.Schema({
    categoryId:{type:String,required:true,unique: true},
    name:{type:String,required:true},
    description:{type:String}
})
module.exports=mongoose.model("BlogsCategory",blogCategorySchema)