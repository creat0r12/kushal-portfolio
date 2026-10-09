
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dataDirectory = path.resolve(process.cwd(), "data");

fs.mkdirSync(dataDirectory, { recursive: true });

const databasePath = path.join(dataDirectory, "gallery.sqlite");

const db = new Database(databasePath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS gallery_images (
    id TEXT PRIMARY KEY,
    public_id TEXT NOT NULL UNIQUE,
    secure_url TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING'
      CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approved_at TEXT
  );
`);

export default db;
