
import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

export interface OwnerRequest extends Request {
  owner?: { role: "owner" };
}

export function requireOwner(
  req: OwnerRequest,
  res: Response,
  next: NextFunction,
): void {
  const secret = process.env.JWT_SECRET ?? "";

  if (secret.length < 32) {
    res.status(500).json({ message: "Authentication is not configured." });
    return;
  }

  const token = req.cookies?.gallery_owner_token as string | undefined;

  if (!token) {
    res.status(401).json({ message: "Owner login required." });
    return;
  }

  try {
    const decoded: string | JwtPayload = jwt.verify(token, secret, {
      issuer: "portfolio-gallery",
      audience: "portfolio-owner",
    });

    if (
      typeof decoded !== "object" ||
      decoded === null ||
      decoded.role !== "owner"
    ) {
      res.status(403).json({ message: "Owner access required." });
      return;
    }

    req.owner = { role: "owner" };
    next();
  } catch {
    res.status(401).json({ message: "Session expired. Please log in again." });
  }
}
