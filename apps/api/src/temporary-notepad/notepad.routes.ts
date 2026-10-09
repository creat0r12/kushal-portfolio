
import { Router, type Request, type Response, type NextFunction } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const router = Router();

// Assumes the API is started with apps/api as its working directory.
const dataFile = path.resolve(
  process.cwd(),
  "temporary-notepad",
  "notes.json",
);

type Note = {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
};

let operationQueue: Promise<unknown> = Promise.resolve();

function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const result = operationQueue.then(operation);
  operationQueue = result.catch(() => undefined);
  return result;
}

async function readNotes(): Promise<Note[]> {
  try {
    const data = await fs.readFile(dataFile, "utf8");
    const parsed: unknown = JSON.parse(data);

    if (!Array.isArray(parsed)) {
      throw new Error("Invalid notes.json format");
    }

    return parsed as Note[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }

    await fs.mkdir(path.dirname(dataFile), { recursive: true });
    await fs.writeFile(dataFile, "[]", { encoding: "utf8", flag: "wx" })
      .catch(async (writeError: unknown) => {
        if ((writeError as NodeJS.ErrnoException).code !== "EEXIST") {
          throw writeError;
        }
      });

    return [];
  }
}

async function saveNotes(notes: Note[]): Promise<void> {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });

  const tempFile = `${dataFile}.${randomUUID()}.tmp`;

  try {
    await fs.writeFile(tempFile, JSON.stringify(notes, null, 2), "utf8");
    await fs.rename(tempFile, dataFile);
  } finally {
    await fs.rm(tempFile, { force: true }).catch(() => undefined);
  }
}

function getNoteInput(req: Request):
  | { title: string; content: string }
  | null {
  const title =
    typeof req.body?.title === "string"
      ? req.body.title.trim().slice(0, 120)
      : "";

  const content =
    typeof req.body?.content === "string"
      ? req.body.content
      : "";

  if (!title || content.length > 100_000) {
    return null;
  }

  return { title, content };
}

// GET /api/notepad — load shared notes
router.get("/", async (_req, res, next) => {
  try {
    const notes = await serialize(() => readNotes());
    res.setHeader("Cache-Control", "no-store");
    res.json(notes);
  } catch (error) {
    next(error);
  }
});

// POST /api/notepad — create a note
router.post("/", async (req, res, next) => {
  try {
    const input = getNoteInput(req);

    if (!input) {
      res.status(400).json({ message: "Invalid title or content." });
      return;
    }

    const note = await serialize(async () => {
      const notes = await readNotes();

      const created: Note = {
        id: randomUUID(),
        ...input,
        updatedAt: new Date().toISOString(),
      };

      notes.unshift(created);
      await saveNotes(notes);

      return created;
    });

    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
});

// PUT /api/notepad/:id — update a note
router.put("/:id", async (req, res, next) => {
  try {
    const input = getNoteInput(req);

    if (!input) {
      res.status(400).json({ message: "Invalid title or content." });
      return;
    }

    const result = await serialize(async () => {
      const notes = await readNotes();
      const index = notes.findIndex((note) => note.id === req.params.id);

      if (index === -1) {
        return null;
      }

      const existing = notes[index];

      if (!existing) {
        return null;
      }

      const updated: Note = {
        id: existing.id,
        ...input,
        updatedAt: new Date().toISOString(),
      };

      notes[index] = updated;
      await saveNotes(notes);

      return updated;
    });

    if (!result) {
      res.status(404).json({ message: "Note not found." });
      return;
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/notepad/:id — delete a shared note
router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await serialize(async () => {
      const notes = await readNotes();
      const remaining = notes.filter((note) => note.id !== req.params.id);

      if (remaining.length === notes.length) {
        return false;
      }

      await saveNotes(remaining);
      return true;
    });

    if (!deleted) {
      res.status(404).json({ message: "Note not found." });
      return;
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
