import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  active: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.Organization || mongoose.model("Organization", organizationSchema);
