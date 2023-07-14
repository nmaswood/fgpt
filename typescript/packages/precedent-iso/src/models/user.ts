import { z } from "zod";

export const ZUserRole = z.enum(["user", "superadmin"]);
export type UserRole = z.infer<typeof ZUserRole>;

export interface User {
  id: string;
  email: string;
  organizationId: string;
  role: UserRole;
}

export interface IdentitySub {
  provider: "google";
  value: string;
}
