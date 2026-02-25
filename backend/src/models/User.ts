import mongoose, { Schema } from "mongoose";
import type { UserRole, JwtPayload, SafeUser } from "../types";
import { comparePassword, hashPassword } from "../utils/password";
import { signJwt } from "../utils/jwt";

export interface UserDocument extends mongoose.Document {
  email: string;
  password: string;
  name?: string;
  role: UserRole;
  profileImage?: string;
  phone?: string;
  address?: string;
  comparePassword: (candidate: string) => Promise<boolean>;
  generateToken: (secret?: string) => string;
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
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    name: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    profileImage: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return (next as (err?: Error) => void)();
  this.password = await hashPassword(this.password);
  (next as (err?: Error) => void)();
});

UserSchema.methods.comparePassword = async function (candidate: string) {
  return comparePassword(candidate, this.password);
};

UserSchema.methods.generateToken = function (secret?: string) {
  const jwtSecret = secret ?? process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }
  const payload: JwtPayload = {
    userId: this._id.toString(),
    email: this.email,
    role: this.role,
  };
  return signJwt(payload, jwtSecret);
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
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const User = mongoose.model<UserDocument>("User", UserSchema);
