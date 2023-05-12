import { IdentitySub } from "@fgpt/precedent-iso";
import type { UserOrgService } from "@fgpt/precedent-node";
import type { NextFunction, Response } from "express";
import type { Request } from "express-jwt";
import { z } from "zod";

export class UserInformationMiddleware {
  constructor(private readonly userOrgService: UserOrgService) {}

  addUser =
    () =>
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const sub = req?.auth?.sub;
      if (!sub) {
        res.json({
          status: "failed",
          message: "User is not logged in",
        });
        res.end();
        return;
      }

      const jwt = ZJwt.parse(req.auth);
      const user = await this.userOrgService.upsert({
        email: jwt.app_data.email,
        sub: parseSub(jwt.sub),
      });

      req.user = user;
      next();
    };
}

function parseSub(sub: string): IdentitySub {
  if (!sub.startsWith("goog")) {
    throw new Error("invalid state");
  }
  return {
    provider: "google",
    value: sub,
  };
}

const ZJwt = z.object({
  sub: z.string(),
  app_data: z.object({
    email: z.string(),
  }),
});
