
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";

const router = Router();

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? "none" : "lax") as
    "none" | "lax",
  maxAge: 2 * 60 * 60 * 1000,
  path: "/",
};

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/login", limiter, async (req, res) => {
  const username = req.body?.username;
  const password = req.body?.password;

  const ownerUsername = process.env.OWNER_USERNAME ?? "";
  const passwordHash = process.env.OWNER_PASSWORD_HASH ?? "";
  const jwtSecret = process.env.JWT_SECRET ?? "";

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    !ownerUsername ||
    !passwordHash ||
    jwtSecret.length < 32
  ) {
    res.status(400).json({
      message: "Invalid login configuration or input.",
    });
    return;
  }

  try {
    const passwordMatches = await bcrypt.compare(
      password,
      passwordHash,
    );

    if (
      username !== ownerUsername ||
      !passwordMatches
    ) {
      res.status(401).json({
        message: "Invalid username or password.",
      });
      return;
    }

    const token = jwt.sign(
      { role: "owner" },
      jwtSecret,
      {
        expiresIn: "2h",
        issuer: "portfolio-gallery",
        audience: "portfolio-owner",
      },
    );

    res.cookie(
      "gallery_owner_token",
      token,
      cookieOptions,
    );

    res.json({ message: "Login successful." });
  } catch (error) {
    console.error("Owner login failed.");

    res.status(500).json({
      message: "Unable to log in.",
    });
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie("gallery_owner_token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: cookieOptions.sameSite,
    path: "/",
  });

  res.json({ message: "Logged out successfully." });
});

export default router;
