require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./Admin/authModel"); // adjust path if needed

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ Connection error:", err));

async function seedAdmin() {
  try {
    const email = "paugreufonezu-7814@yopmail.com";
    const plainPassword = "Admin@1234";

    let admin = await Admin.findOne({ email });
    if (admin) {
      console.log("⚠️ Admin already exists:", email);
      mongoose.connection.close();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    admin = new Admin({
      name: "Super Admin",   // ✅ required field
      email,
      password: hashedPassword,
      role: "superadmin",
      isAdmin: true,
    });

    await admin.save();

    console.log("🎉 Admin user created successfully!");
    console.log("➡️ Email:", email);
    console.log("➡️ Password:", plainPassword);

    mongoose.connection.close();
  } catch (err) {
    console.error("❌ Error seeding admin:", err.message);
    mongoose.connection.close();
  }
}

seedAdmin();
