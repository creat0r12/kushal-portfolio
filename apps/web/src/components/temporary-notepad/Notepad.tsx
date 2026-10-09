
import { useCallback, useEffect, useRef, useState } from "react";
import { apiUrl } from "../../lib/api";
import "./Notepad.css";

type Note = {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
};

export default function Notepad() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Loading notes…");
  const [search, setSearch] = useState("");

  const selectedIdRef = useRef("");
  const draftRef = useRef({ title: "", content: "" });
  const dirtyRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveVersionRef = useRef(0);
  const savingRef = useRef(false);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    draftRef.current = { title, content };
  }, [title, content]);

  const fetchNotes = useCallback(async () => {
    try {
      const response = await fetch(apiUrl("/api/notepad"), {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Could not load notes");
      }

      const incoming: Note[] = await response.json();

      setNotes((current) => {
        if (!dirtyRef.current && !savingRef.current) {
          return incoming;
        }

        // Preserve the active draft while it has unsaved changes.
        const activeId = selectedIdRef.current;
        const local = current.find((note) => note.id === activeId);

        if (!local) return incoming;

        const existsOnServer = incoming.some(
          (note) => note.id === activeId,
        );

        const merged = incoming.map((note) =>
          note.id === activeId ? local : note,
        );

        if (!existsOnServer) {
          merged.unshift(local);
        }

        return merged;
      });

      if (!dirtyRef.current && !savingRef.current) {
        setStatus("Connected · Shared notes");
      }
    } catch {
      setStatus("Connection problem · Check the API");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotes();

    const interval = window.setInterval(() => {
      void fetchNotes();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [fetchNotes]);

  const saveNote = useCallback(
    async (
      id: string,
      draft: { title: string; content: string },
      version: number,
    ): Promise<boolean> => {
      if (!draft.title.trim()) {
        setStatus("Enter a title to save");
        return false;
      }

      savingRef.current = true;
      setStatus("Saving…");

      try {
        const response = await fetch(
          apiUrl(`/api/notepad/${encodeURIComponent(id)}`),
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: draft.title.trim(),
              content: draft.content,
            }),
          },
        );

        if (!response.ok) {
          throw new Error("Save failed");
        }

        const saved: Note = await response.json();

        setNotes((current) =>
          current.map((note) =>
            note.id === saved.id ? saved : note,
          ),
        );

        if (version === saveVersionRef.current) {
          dirtyRef.current = false;
          setStatus("All changes saved");
        }

        return true;
      } catch {
        setStatus("Save failed · Please try again");
        return false;
      } finally {
        savingRef.current = false;
      }
    },
    [],
  );

  // Save the latest draft immediately when switching notes.
  const flushPendingSave = useCallback(async (): Promise<boolean> => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    if (!dirtyRef.current) {
      return true;
    }

    const id = selectedIdRef.current;
    const draft = { ...draftRef.current };

    if (!id || !draft.title.trim()) {
      setStatus("Enter a title to save");
      return false;
    }

    const version = ++saveVersionRef.current;

    return saveNote(id, draft, version);
  }, [saveNote]);

  // Debounced autosave.
  useEffect(() => {
    if (!selectedId || !dirtyRef.current) {
      return;
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    const id = selectedId;
    const draft = { title, content };
    const version = ++saveVersionRef.current;

    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      void saveNote(id, draft, version);
    }, 700);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [selectedId, title, content, saveNote]);

  async function selectNote(note: Note) {
    const saved = await flushPendingSave();

    if (!saved) return;

    dirtyRef.current = false;
    selectedIdRef.current = note.id;

    setSelectedId(note.id);
    setTitle(note.title);
    setContent(note.content);

    draftRef.current = {
      title: note.title,
      content: note.content,
    };

    setStatus("Ready");
  }

  async function createNote() {
    const saved = await flushPendingSave();

    if (!saved) return;

    try {
      setStatus("Creating…");

      const response = await fetch(apiUrl("/api/notepad"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Untitled note",
          content: "",
        }),
      });

      if (!response.ok) {
        throw new Error("Create failed");
      }

      const note: Note = await response.json();

      dirtyRef.current = false;
      selectedIdRef.current = note.id;

      setNotes((current) => [
        note,
        ...current.filter((item) => item.id !== note.id),
      ]);

      setSelectedId(note.id);
      setTitle(note.title);
      setContent(note.content);

      draftRef.current = {
        title: note.title,
        content: note.content,
      };

      setOpen(true);
      setStatus("Note created");
    } catch {
      setStatus("Could not create note");
    }
  }

  async function deleteNote(note: Note) {
    if (!window.confirm(`Delete "${note.title}" for everyone?`)) {
      return;
    }

    if (selectedIdRef.current === note.id) {
      const saved = await flushPendingSave();

      if (!saved) return;
    }

    try {
      const response = await fetch(
        apiUrl(`/api/notepad/${encodeURIComponent(note.id)}`),
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      if (selectedIdRef.current === note.id) {
        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current);
          saveTimerRef.current = null;
        }

        dirtyRef.current = false;
        selectedIdRef.current = "";

        setSelectedId("");
        setTitle("");
        setContent("");

        draftRef.current = {
          title: "",
          content: "",
        };
      }

      setNotes((current) =>
        current.filter((item) => item.id !== note.id),
      );

      setStatus("Note deleted");
    } catch {
      setStatus("Could not delete note");
    }
  }

  function updateTitle(value: string) {
    setTitle(value);
    dirtyRef.current = true;
    setStatus("Unsaved changes…");

    setNotes((current) =>
      current.map((note) =>
        note.id === selectedId
          ? { ...note, title: value }
          : note,
      ),
    );
  }

  function updateContent(value: string) {
    setContent(value);
    dirtyRef.current = true;
    setStatus("Unsaved changes…");

    setNotes((current) =>
      current.map((note) =>
        note.id === selectedId
          ? { ...note, content: value }
          : note,
      ),
    );
  }

  const filteredNotes = notes.filter((note) =>
    `${note.title} ${note.content}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="temporary-notepad">
      <button
        type="button"
        className="tn-launcher"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? "Close shared notepad" : "Open shared notepad"}
      >
        <span aria-hidden="true">✎</span>
        <span>Shared Notes</span>
      </button>

      {open && (
        <section className="tn-panel" aria-label="Shared notepad">
          <header className="tn-header">
            <div>
              <p className="tn-eyebrow">PORTFOLIO TOOL</p>
              <h2>Shared Notepad</h2>
              <p className="tn-status" role="status">{status}</p>
            </div>

            <button
              type="button"
              className="tn-icon-button"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
          </header>

          <div className="tn-toolbar">
            <input
              className="tn-search"
              placeholder="Find a note by title or content..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search notes"
            />

            <button
              type="button"
              className="tn-new-button"
              onClick={() => void createNote()}
            >
              + New
            </button>
          </div>

          <div className="tn-layout">
            <aside className="tn-list" aria-label="Notes list">
              {loading && <p className="tn-empty">Loading…</p>}

              {!loading && filteredNotes.length === 0 && (
                <p className="tn-empty">No notes yet. Create one.</p>
              )}

              {filteredNotes.map((note) => (
                <div
                  className={`tn-note-row ${
                    selectedId === note.id ? "is-selected" : ""
                  }`}
                  key={note.id}
                >
                  <button
                    type="button"
                    className="tn-note-select"
                    onClick={() => void selectNote(note)}
                  >
                    <strong>{note.title || "Untitled note"}</strong>
                    <span>{note.content.slice(0, 65) || "Empty note"}</span>
                    <time>
                      {new Date(note.updatedAt).toLocaleString()}
                    </time>
                  </button>

                  <button
                    type="button"
                    className="tn-delete"
                    onClick={() => void deleteNote(note)}
                    aria-label={`Delete ${note.title}`}
                    title="Delete for everyone"
                  >
                    ×
                  </button>
                </div>
              ))}
            </aside>

            <div className="tn-editor">
              {selectedId ? (
                <>
                  <input
                    className="tn-title-input"
                    value={title}
                    maxLength={120}
                    onChange={(event) => updateTitle(event.target.value)}
                    placeholder="Note title"
                    aria-label="Note title"
                  />

                  <textarea
                    className="tn-content-input"
                    value={content}
                    maxLength={100000}
                    onChange={(event) => updateContent(event.target.value)}
                    placeholder="Write something… changes save automatically."
                    aria-label="Note content"
                  />

                  <footer className="tn-editor-footer">
                    <span>
                      {content.length.toLocaleString()} / 100,000 characters
                    </span>
                    <span>{status}</span>
                  </footer>
                </>
              ) : (
                <div className="tn-welcome">
                  <span>✎</span>
                  <h3>Your shared space</h3>
                  <p>
                    Select a note or create one. Notes are visible to anyone
                    who can access this page.
                  </p>

                  <button
                    type="button"
                    className="tn-new-button"
                    onClick={() => void createNote()}
                  >
                    Create a note
                  </button>
                </div>
              )}
            </div>
          </div>

          <p className="tn-privacy-note">
            Public shared notes · No account required · Anyone can edit or delete
          </p>
        </section>
      )}
    </div>
  );
}
