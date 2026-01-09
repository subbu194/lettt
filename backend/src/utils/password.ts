import bcrypt from "bcrypt";

export const BCRYPT_SALT_ROUNDS = 10;

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function isStrongPassword(password: string) {
  // >= 8 chars, uppercase, lowercase, number
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
}
