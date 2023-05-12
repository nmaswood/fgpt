export interface User {
  id: string;
  email: string;
  organizationId: string;
}

export interface IdentitySub {
  provider: "google";
  value: string;
}
