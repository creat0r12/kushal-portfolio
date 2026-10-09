
import { Router } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import db from "../config/database";
import cloudinary from "../integrations/cloudinary";
import { requireOwner } from "../middleware/ownerAuth";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      callback(new Error("Only JPEG, PNG, and WebP images are allowed."));
      return;
    }
    callback(null, true);
  },
});

router.use(requireOwner);

router.get("/me", (_req, res) => {
  res.json({ authenticated: true, role: "owner" });
});

router.get("/pending", (_req, res) => {
  const images = db.prepare(`
    SELECT id, title, status, created_at AS createdAt
    FROM gallery_images
    WHERE status = 'PENDING'
    ORDER BY created_at DESC
  `).all();

  res.json({ images });
});

router.post("/upload", upload.single("image"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: "Select an image to upload." });
    return;
  }

  const title =
    typeof req.body?.title === "string" ? req.body.title.trim() : "";

  if (!title || title.length > 120) {
    res.status(400).json({ message: "Title must be 1–120 characters." });
    return;
  }

  try {
    const result = await new Promise<{
      public_id: string;
      secure_url: string;
    }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: "kushal-portfolio/gallery",
          resource_type: "image",
          allowed_formats: ["jpg", "jpeg", "png", "webp"],
        },
        (error, uploaded) => {
          if (error) {
            reject(error);
          } else if (!uploaded) {
            reject(new Error("Cloudinary returned no upload result."));
          } else {
            resolve({
              public_id: uploaded.public_id,
              secure_url: uploaded.secure_url,
            });
          }
        },
      ).end(req.file!.buffer);
    });

    const id = randomUUID();

    try {
      db.prepare(`
        INSERT INTO gallery_images
          (id, public_id, secure_url, title, status)
        VALUES (?, ?, ?, ?, 'PENDING')
      `).run(id, result.public_id, result.secure_url, title);
    } catch (databaseError) {
      // Compensate for a database failure so an untracked upload is not left behind.
      await cloudinary.uploader.destroy(result.public_id, {
        resource_type: "image",
      }).catch(() => undefined);
      throw databaseError;
    }

    res.status(201).json({
      message: "Image uploaded and awaiting approval.",
      image: { id, title, status: "PENDING" },
    });
  
} catch (error) {
  console.error("Gallery upload failed:", error);

  res.status(500).json({
    message: "Upload failed. Please try again.",
  });
}

});

router.post("/:id/approve", (req, res) => {
  const id = String(req.params.id);

  const result = db.prepare(`
    UPDATE gallery_images
    SET status = 'APPROVED', approved_at = CURRENT_TIMESTAMP
    WHERE id = ? AND status = 'PENDING'
  `).run(id);

  if (result.changes === 0) {
    res.status(404).json({ message: "Pending image not found." });
    return;
  }

  res.json({ message: "Image approved and now public." });
});

router.post("/:id/reject", (req, res) => {
  const id = String(req.params.id);

  const result = db.prepare(`
    UPDATE gallery_images
    SET status = 'REJECTED', approved_at = NULL
    WHERE id = ? AND status = 'PENDING'
  `).run(id);

  if (result.changes === 0) {
    res.status(404).json({ message: "Pending image not found." });
    return;
  }

  res.json({ message: "Image rejected and remains hidden." });
});

export default router;
