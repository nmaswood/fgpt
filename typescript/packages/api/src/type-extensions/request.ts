import type { User } from "@fgpt/precedent-iso";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    export interface Request {
      user: User;
      rawBody: Buffer;
      isImpersonating: boolean;
    }
  }
}
