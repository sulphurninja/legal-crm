import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // hashed
  role: {
    type: String,
    enum: ["super_admin", "admin", "agent"],
    default: "agent"
  },
  active: { type: Boolean, default: true }, // New field to track if user is active
  lastLogin: { type: Date }, // Optional: track last login timestamp
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }, // Added organization reference
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", userSchema);
