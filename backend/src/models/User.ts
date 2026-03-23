import mongoose, { Schema } from "mongoose";
import type { UserRole, SafeUser } from "../types";
import { comparePassword, hashPassword } from "../utils/password";

export interface UserDocument extends mongoose.Document {
  email: string;
  password: string;
  name?: string;
  role: UserRole;
  profileImage?: string;
  phone?: string;
  address?: string;
  city?: string;
  pincode?: string;
  isProfileComplete: boolean;
  tokenVersion: number;
  comparePassword: (candidate: string) => Promise<boolean>;
  toSafeJSON: () => SafeUser;
}

const UserSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    name: { type: String, trim: true },
    role: { type: String, enum: ["user", "admin"], default: "user", index: true },
    profileImage: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    pincode: { type: String, trim: true },
    isProfileComplete: { type: Boolean, default: false },
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await hashPassword(this.password);
});

UserSchema.methods.comparePassword = async function (candidate: string) {
  return comparePassword(candidate, this.password);
};

UserSchema.methods.toSafeJSON = function () {
  return {
    _id: this._id.toString(),
    email: this.email,
    name: this.name,
    role: this.role,
    profileImage: this.profileImage,
    phone: this.phone,
    address: this.address,
    city: this.city,
    pincode: this.pincode,
    isProfileComplete: this.isProfileComplete,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const User = mongoose.model<UserDocument>("User", UserSchema);
