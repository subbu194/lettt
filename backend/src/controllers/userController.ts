import type { RequestHandler } from "express";
import { z } from "zod";
import { User } from "../models/User";
import { AppError } from "../middleware/errorHandler";
import { isStrongPassword } from "../utils/password";

const updateProfileDetailsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  phone: z.string().min(10, "Phone must be at least 10 characters").optional(),
  address: z.string().min(5, "Address must be at least 5 characters").optional(),
  profileImage: z.string().url("Profile image must be a valid URL").optional(),
});

const updateEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
  currentPassword: z.string().min(1, "Current password is required"),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Confirm password is required"),
});

// Get current user profile
export const getProfile: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    
    const user = await User.findById(req.user.userId);
    if (!user) throw new AppError("User not found", 404);
    
    return res.status(200).json({ user: user.toSafeJSON() });
  } catch (err) {
    return next(err);
  }
};

// Update profile details (name, phone, address, profileImage)
export const updateProfileDetails: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    
    const updates = updateProfileDetailsSchema.parse(req.body);
    
    const user = await User.findById(req.user.userId);
    if (!user) throw new AppError("User not found", 404);
    
    // Update only provided fields
    if (updates.name !== undefined) user.name = updates.name;
    if (updates.phone !== undefined) user.phone = updates.phone;
    if (updates.address !== undefined) user.address = updates.address;
    if (updates.profileImage !== undefined) user.profileImage = updates.profileImage;
    
    await user.save();
    
    return res.status(200).json({ 
      message: "Profile updated successfully",
      user: user.toSafeJSON() 
    });
  } catch (err) {
    return next(err);
  }
};

// Update email (requires password confirmation)
export const updateEmail: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    
    const { email, currentPassword } = updateEmailSchema.parse(req.body);
    
    const user = await User.findById(req.user.userId).select("+password");
    if (!user) throw new AppError("User not found", 404);
    
    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new AppError("Current password is incorrect", 401);
    }
    
    // Check if email is already taken by another user
    const emailExists = await User.findOne({ 
      email: email.toLowerCase(),
      _id: { $ne: user._id }
    });
    if (emailExists) {
      throw new AppError("Email already in use", 400);
    }
    
    user.email = email.toLowerCase();
    await user.save();
    
    return res.status(200).json({ 
      message: "Email updated successfully",
      user: user.toSafeJSON() 
    });
  } catch (err) {
    return next(err);
  }
};

// Update password (requires current password)
export const updatePassword: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    
    const { currentPassword, newPassword, confirmPassword } = updatePasswordSchema.parse(req.body);
    
    // Check if passwords match
    if (newPassword !== confirmPassword) {
      throw new AppError("New passwords do not match", 400);
    }
    
    // Validate password strength
    if (!isStrongPassword(newPassword)) {
      throw new AppError(
        "Password must include uppercase, lowercase, and number",
        400
      );
    }
    
    const user = await User.findById(req.user.userId).select("+password");
    if (!user) throw new AppError("User not found", 404);
    
    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new AppError("Current password is incorrect", 401);
    }
    
    // Check if new password is same as current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      throw new AppError("New password must be different from current password", 400);
    }
    
    user.password = newPassword;
    await user.save();
    
    return res.status(200).json({ 
      message: "Password updated successfully" 
    });
  } catch (err) {
    return next(err);
  }
};

// Delete user account (requires password confirmation)
export const deleteAccount: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    
    const { password } = z.object({
      password: z.string().min(1, "Password is required")
    }).parse(req.body);
    
    const user = await User.findById(req.user.userId).select("+password");
    if (!user) throw new AppError("User not found", 404);
    
    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError("Password is incorrect", 401);
    }
    
    await User.findByIdAndDelete(req.user.userId);
    
    return res.status(200).json({ 
      message: "Account deleted successfully" 
    });
  } catch (err) {
    return next(err);
  }
};
