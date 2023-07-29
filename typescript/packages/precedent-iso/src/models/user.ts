import { z } from "zod";

export const ZUserRole = z.enum(["user", "superadmin"]);
export type UserRole = z.infer<typeof ZUserRole>;

export const ZUserStatus = z.enum(["activate", "inactive"]);
export type UserStatus = z.infer<typeof ZUserStatus>;

export interface User {
  id: string;
  email: string;
  organizationId: string;
  role: UserRole;
  status: UserStatus;
}

export interface IdentitySub {
  provider: "google";
  value: string;
}

export interface InvitedUser {
  id: string;
  email: string;
  organizationId: string | undefined;
}
