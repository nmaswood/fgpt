import type { User } from "@fgpt/precedent-iso";

declare global {
  namespace Express {
    export interface Request {
      user: User;
      rawBody: Buffer;
      isImpersonating: boolean;
    }
  }
}
