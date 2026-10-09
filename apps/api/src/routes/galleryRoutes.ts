import { Router } from "express";
import db from "../config/database";

const router = Router();

router.get("/approved", (_req, res) => {
  try {
    const images = db
      .prepare(`
        SELECT
          id,
          secure_url AS secureUrl,
          title,
          created_at AS createdAt,
          approved_at AS approvedAt
        FROM gallery_images
        WHERE status = 'APPROVED'
        ORDER BY approved_at DESC, created_at DESC
      `)
      .all();

    res.json({ images });
  } catch (error) {
    console.error("Failed to load approved gallery images.");
    res.status(500).json({ message: "Unable to load gallery images." });
  }
});

export default router;
