
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import multer from "multer";

import galleryRoutes from "./routes/galleryRoutes";
import authRoutes from "./routes/authRoutes";
import ownerRoutes from "./routes/ownerRoutes";

const app = express();
const PORT = Number(process.env.PORT) || 5001;
const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:5173";

app.disable("x-powered-by");
app.use(helmet());

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "portfolio-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/owner/gallery", ownerRoutes);

// Central error handler
app.use((
  error: unknown,
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction,
) => {
  if (error instanceof multer.MulterError) {
    res.status(400).json({
      message: "Upload rejected. Check the image size and try again.",
    });
    return;
  }

  if (error instanceof Error && error.message.startsWith("Only JPEG")) {
    res.status(400).json({ message: error.message });
    return;
  }

  console.error("API request failed.");
  res.status(500).json({ message: "Unexpected server error." });
});

app.listen(PORT, () => {
  console.log(`Portfolio API running on port ${PORT}`);
});
