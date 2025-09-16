const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["admin", "superadmin"], // you can add more roles later
    default: "admin",
  },
  isAdmin: { type: Boolean, default: true },
  resetPasswordOtp: String,
  resetPasswordExpiry: Date
}, {
  collection: "admins" // force Mongo to create/use "admins" collection
});

module.exports = mongoose.model("Admin", AdminSchema);
