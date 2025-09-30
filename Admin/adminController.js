const Admin=require('./authModel');
const bcrypt = require("bcryptjs"); 
const jwt=require('jsonwebtoken')
const nodemailer=require("nodemailer")
const crypto=require("crypto")

// Debug endpoint to verify auth conditions without exposing secrets
exports.debugAuthCheck = async (req, res) => {
  try {
    if (process.env.DEBUG_AUTH !== '1') {
      return res.status(404).json({ message: "Not Found" });
    }
    let { email, password } = req.query;
    if (!email) {
      return res.status(400).json({ message: "email query param is required" });
    }
    email = String(email).toLowerCase().trim();
    if (password !== undefined) password = String(password).trim();

    const admin = await Admin.findOne({ email }).collation({ locale: 'en', strength: 2 });
    if (!admin) {
      return res.json({ found: false });
    }

    if (password === undefined) {
      return res.json({ found: true, email: admin.email, role: admin.role });
    }

    const match = await bcrypt.compare(password, admin.password);
    return res.json({ found: true, match, email: admin.email, role: admin.role });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.loginAdmin = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    email = String(email).toLowerCase().trim();
    password = String(password).trim();

    console.log("➡️ Login attempt:", { email });

    const admin = await Admin.findOne({ email }).collation({ locale: "en", strength: 2 });

    if (!admin) {
      console.log("❌ Admin not found in DB");
      return res.status(401).json({ message: "Invalid email or Password" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      console.log("Password check right after save:", isMatch);
      return res.status(401).json({ message: "Invalid email or Password" });
    }

    const token = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET ||
        "3b9e6f3c8d7a4f09b1c6d82f57a2a9e5f1c4d73a8b6e9f2c1d0a7b4e5f8c2d9a",
      { expiresIn: "1d" }
    );

    console.log("✅ Login successful for", email);

    return res.status(200).json({
      message: "Login successful - Welcome to Blogs Admin Panel",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err.message);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};


exports.forgotPassword=async (req,res)=>{
    try{
        const{email}=req.body;
        if(!email){
            return res.status(400).json({message:"Email is requird"})
        }
        const admin=await Admin.findOne({email})
        if(!admin){
            return res.status(404).json({message:"Admin is Not Found"})
        }
        const otp=Math.floor(100000+Math.random()*900000).toString();
        const otpExpiry=Date.now()+10*60*1000;
        admin.resetPasswordOtp=crypto.createHash("sha256").update(otp).digest("hex");
        admin.resetPasswordExpiry=otpExpiry;
        await admin.save();

        const  transporter=nodemailer.createTransport({
            service:"gmail",
            auth:{
                user:process.env.SMTP_USER,
                pass:process.env.SMTP_PASS,
            },
        });
        // send email
        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: email,
            subject: "Admin Password Reset OTP",
            text: `<p>Hello Admin,</p>
             <p>Your OTP for password reset is: <b>${otp}</b></p>
             <p>This OTP is valid for 10 minutes.</p>
             <p>If you did not request this, please ignore.</p>`,
        })
        return res.json({ message: "OTP sent to registered email" });
    }catch(err){
      console.error("Forgot Password Error:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
}

exports.resetPassword = async (req, res) => {
  try {
    const { otp, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!otp || !newPassword || !confirmPassword) {
      return res
        .status(400)
        .json({ message: "OTP, newPassword and confirmPassword are required" });
    }

    // Check password match
    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ message: "New password and confirm password do not match" });
    }

    // Hash OTP
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    // Find admin by OTP
    const admin = await Admin.findOne({
      resetPasswordOtp: hashedOtp,
      resetPasswordExpiry: { $gt: Date.now() }, // not expired
    });

    if (!admin) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update admin password and clear OTP fields
    admin.password = hashedPassword;
    admin.resetPasswordOtp = undefined;
    admin.resetPasswordExpiry = undefined;

    await admin.save();

    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
};


//Get Users List 

exports.getUsers=async(req,res)=>{
  try{


  let {page=1,limit=20}=req.query;
    page=Number(page);
    limit=Number(limit);
    const skip=(page-1)*limit;
    const [users,total]=await Promise.all([
      Users.find({})
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }), // latest first
      Users.countDocuments(),
    ]);
    res.json({
      users:users.map((u)=>({
        id:u.userId,
        name:u.name,
        email:u.email,
        role: u.role || "user",  // optional extra field
        createdAt: u.createdAt,
      })),
      page,
      limit,
      total
    });
  } catch(err){
    console.error("Get Users Error:", err);
    res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    })
  }
}
// Update Admin Info

exports.updateAdminInfo = async (req, res) => {
  try{
    const { id, name, email } = req.body;
const adminId = req.admin?._id || req.user?._id || id;

if (!adminId) {
  return res.status(400).json({ message: "Admin ID not found" });
}

const updatedAdmin = await Admin.findByIdAndUpdate(
  adminId,
  { name, email },
  { new: true, runValidators: true }
).select("_id name email"); // ✅ make sure name is included

if (!updatedAdmin) {
  return res.status(404).json({ message: "Admin not found" });
}

res.json({
  message: "Admin info updated successfully",
  admin: {
    id: updatedAdmin._id,
    name: updatedAdmin.name,
    email: updatedAdmin.email,
  },
});


  }catch(err){
    res.status(500).json({ message: "Error updating admin info", error: err.message });
  }
}

// Admin Change Password SuperAdmin@123
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Both oldPassword and newPassword are required" });
    }

    // Get admin id from middleware / token or body fallback
    const adminId = req.admin?._id || req.user?._id || req.body.id;
    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized: admin not found in request" });
    }

    // IMPORTANT: if your Admin schema sets password: { select: false }, we MUST explicitly select it
    const admin = await Admin.findById(adminId).select("+password"); // <-- explicit select
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Normalize inputs
    const oldP = String(oldPassword).trim();
    const newP = String(newPassword).trim();

    // If password field missing or empty -> error
    if (!admin.password) {
      console.warn(`[changePassword] admin ${adminId} has no stored password`);
      return res.status(500).json({ message: "Server error: password not set for admin" });
    }

    // Determine stored format: bcrypt hashes typically start with $2
    let isMatch = false;
    if (typeof admin.password === "string" && admin.password.startsWith("$2")) {
      // expected bcrypt hash
      isMatch = await bcrypt.compare(oldP, admin.password);
    } else {
      // Legacy plaintext fallback (unsafe) — ONLY for compatibility during migration
      // If this fires, you should re-hash the existing password immediately after verify.
      isMatch = admin.password === oldP;
      if (isMatch) console.warn(`[changePassword] admin ${adminId} used plaintext password; re-hash to secure.`);
    }

    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    // Hash new password and save
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newP, salt);
    await admin.save();

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("[changePassword] error:", err);
    return res.status(500).json({ message: "Error changing password", error: err.message });
  }
};

// Notification 

exports.sendNotification = async (req, res) => {
  try {
    const { to, subject, message } = req.body;
    console.log("📩 Incoming notify request", req.body);

    if (!to || !subject || !message) {
      return res.status(400).json({ message: "to, subject, and message are required" });
    }
    console.log("Sending email to:", to);

    // ✅ Configure transporter (use your real SMTP details or Gmail App Password)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for port 465, false for other ports
      auth: {
        user: process.env.SMTP_USER, // e.g. your email
        pass: process.env.SMTP_PASS, // app password or smtp pass
      },
    });

    // ✅ Prepare mail options
    const mailOptions = {
      from: process.env.SMTP_FROM || `"Admin" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text: message,
    };

    // ✅ Send email
    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: "Email sent successfully" });
  } catch (err) {
    console.error("❌ Email error:", err);
    return res.status(500).json({ message: "Failed to send email", error: err.message });
  }
};