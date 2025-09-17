require('dotenv').config();
const express=require('express');
const mongoose=require('mongoose')
const cors = require("cors");
const adminRoutes = require("./Admin/adminRoutes");

const app =express();

app.use(express.json());
app.use(cors({
  origin: [
    "http://localhost:3000",         // React local dev
    "http://localhost:3001",         // in case you run on 3001 sometimes
    "https://your-frontend.onrender.com" // Render frontend deployment
  ],
  credentials: true
}));

app.use(express.urlencoded({ extended: true })); 
// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});
// Health check
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB error", err));
// Admin API
app.use("/api/admin",adminRoutes)
// 404 handler
app.use((req, res) => {
  console.log(`404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: "Not Found" });
})
// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

