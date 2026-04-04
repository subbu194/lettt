import type { UserDocument } from "../models/User";

/**
 * Profile is complete when the user has email, address, and phone.
 */
export function computeIsProfileComplete(user: UserDocument): boolean {
  return Boolean(
    user.email &&
      user.phone &&
      user.address &&
      user.isEmailVerified
  );
}
