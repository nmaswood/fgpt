import type { NextFunction, Request, Response } from "express";
export function ensureAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user.role !== "superadmin") {
    res.status(403).json({ message: "Forbidden" });
    return;
  }
  next();
}
