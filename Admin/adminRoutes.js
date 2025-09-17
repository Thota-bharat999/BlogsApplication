const express=require("express");
const {loginAdmin,forgotPassword,resetPassword,debugAuthCheck,getUsers, updateAdminInfo, changePassword,sendNotification}=require('./adminController')
const {createCategory,getCategories,updateCategory,deleteCategory}=require('./adminCategoryController')
const {createBlog,getBlogs,updateBlogs,deleteBlogs}=require('./adminBlogsController')
const { verifyAdmin } = require("./authMiddleware");
const router=express.Router()
router.post("/login",loginAdmin);
router.post('/forgot-password',forgotPassword);
router.post('/reset-password',resetPassword);
router.get('/users',verifyAdmin,getUsers);
router.put('/update-info',verifyAdmin,updateAdminInfo)
router.put('/change-password',verifyAdmin,changePassword)
router.post("/notify", verifyAdmin, sendNotification);
// category routes
router.post('/category', verifyAdmin,createCategory);
router.get('/categories',getCategories)
router.put('/category/:id',verifyAdmin,updateCategory);
router.delete('/category/:id',verifyAdmin,deleteCategory)

//blogs routes
router.post('/blog',verifyAdmin,createBlog)
router.get('/blogs',verifyAdmin,getBlogs)
router.put('/blog/:id',verifyAdmin,updateBlogs)
router.delete('/blog/:id',verifyAdmin,deleteBlogs)
// Debug route (only works when DEBUG_AUTH=1)
router.get('/debug/auth-check', debugAuthCheck);
module.exports=router