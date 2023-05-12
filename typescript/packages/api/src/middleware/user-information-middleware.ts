import { User } from "@songbird/precedent-iso";
import type { NextFunction, Response } from "express";
import type { Request } from "express-jwt";

import type { UserService } from "../services/user-service";

export class UserInformationMiddleware {
  constructor(private readonly userService: UserService) {}

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

      const { user, isNewUser } = await this.#getUser(sub);

      const impersonate = req.headers["x-impersonate"];
      if (typeof impersonate === "string") {
        if (user.role !== "admin") {
          throw new Error("Only admins can impersonate");
        }
        req.user = await this.userService.getById(impersonate);
      } else {
        req.user = user;
      }

      next();
    };

  #getUser = async (sub: string) => {
    const fromSub = await this.userService.getBySub(sub);

    const user =
      fromSub === undefined || !fromSub.emailVerified
        ? await this.#upsertUser(sub)
        : fromSub;

    return { user, isNewUser: fromSub === undefined };
  };
}
