export type UserRole = "user" | "admin";

export type JwtPayload = {
  userId: string;
  email: string;
  role: UserRole;
};

export type SafeUser = {
  _id: string;
  email: string;
  name?: string;
  role: UserRole;
  profileImage?: string;
  phone?: string;
  address?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface Request {
      user?: JwtPayload;
    }
  }
}
