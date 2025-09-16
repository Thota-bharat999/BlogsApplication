const jwt = require("jsonwebtoken");
const Admin=require('./authModel');

// Verify Admin Middleware
exports.verifyAdmin = async (req, res, next) => {
  try {
    // 1. Get token from headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token required" });
    }

    const token = authHeader.split(" ")[1];

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Find admin user
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({ message: "Invalid token: Admin not found" });
    }

    // 4. Check if user is admin
    if (!admin.isAdmin) {
      return res.status(403).json({ message: "Access denied: Not an admin" });
    }

    req.admin = admin; // attach admin info for later use
    next();
  } catch (err) {
    console.error("VerifyAdmin Error:", err.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
