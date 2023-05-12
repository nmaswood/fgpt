import express from "express";

export class UserOrgRouter {
  init() {
    const router = express.Router();

    router.get("/me", async (req: express.Request, res: express.Response) => {
      const user = req.user;
      res.json({ user });
    });

    return router;
  }
}
