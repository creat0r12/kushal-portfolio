
import {
  useEffect,
  useState,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import "./Gallery.css";

const API = "http://localhost:5001";

type GalleryImage = {
  id: string;
  secureUrl: string;
  title: string;
  createdAt?: string;
};

type ImageSize = "fit" | "original";

export default function Gallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState<GalleryImage[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  // Image viewer state
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [slideShow, setSlideShow] = useState(false);
  const [imageSize, setImageSize] = useState<ImageSize>("fit");
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  async function loadImages() {
    try {
      const response = await fetch(`${API}/api/gallery/approved`);

      if (!response.ok) {
        throw new Error("Unable to load Gallery.");
      }

      const data = await response.json();
      setImages(data.images ?? []);
    } catch {
      setMessage("Gallery is temporarily unavailable.");
    }
  }

  async function loadPending() {
    const response = await fetch(`${API}/api/owner/gallery/pending`, {
      credentials: "include",
    });

    if (response.status === 401) {
      setAuthenticated(false);
      setPending([]);
      return;
    }

    if (!response.ok) {
      throw new Error("Unable to load pending images.");
    }

    const data = await response.json();
    setPending(data.images ?? []);
  }

  async function loadOwner() {
    try {
      const response = await fetch(`${API}/api/owner/gallery/me`, {
        credentials: "include",
      });

      if (response.ok) {
        setAuthenticated(true);
        await loadPending();
      } else {
        setAuthenticated(false);
      }
    } catch {
      // Public browsing remains available if the owner API is offline.
    }
  }

  useEffect(() => {
    void loadImages();
    void loadOwner();
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "Login failed.");
      }

      setAuthenticated(true);
      setShowLogin(false);
      setPassword("");
      setMessage("Welcome back!");

      await loadPending();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file || !title.trim()) {
      setMessage("Choose an image and enter a title.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("title", title.trim());

      const response = await fetch(`${API}/api/owner/gallery/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "Upload failed.");
      }

      setMessage("Uploaded! Your image is awaiting approval.");
      setTitle("");
      setFile(null);

      const fileInput = document.getElementById(
        "gallery-file-input",
      ) as HTMLInputElement | null;

      if (fileInput) fileInput.value = "";

      await loadPending();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function moderate(
    id: string,
    action: "approve" | "reject",
  ) {
    setBusy(true);

    try {
      const response = await fetch(
        `${API}/api/owner/gallery/${encodeURIComponent(id)}/${action}`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "Action failed.");
      }

      setMessage(data.message ?? "Updated.");
      await loadPending();

      if (action === "approve") {
        await loadImages();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    try {
      await fetch(`${API}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setAuthenticated(false);
      setShowLogin(false);
      setPending([]);
      setPassword("");
      setMessage("Logged out.");
    }
  }

  // Viewer controls
  function resetViewerSettings() {
    setZoom(1);
    setBrightness(100);
    setImageSize("fit");
    setPan({ x: 0, y: 0 });
    setDragging(false);
  }

  function openViewer(index: number) {
    setActiveImageIndex(index);
    resetViewerSettings();
    setSlideShow(false);
  }

  function closeViewer() {
    setActiveImageIndex(null);
    setSlideShow(false);
    setDragging(false);
  }

  function moveImage(direction: number) {
    setActiveImageIndex((current) => {
      if (current === null || images.length === 0) return current;

      return (current + direction + images.length) % images.length;
    });

    setZoom(1);
    setPan({ x: 0, y: 0 });
    setDragging(false);
  }

  function changeZoom(nextZoom: number) {
    const boundedZoom = Math.max(0.5, Math.min(5, nextZoom));

    setZoom(boundedZoom);

    if (boundedZoom <= 1) {
      setPan({ x: 0, y: 0 });
    }
  }

  function handleWheel(event: ReactWheelEvent<HTMLDivElement>) {
    event.preventDefault();

    changeZoom(zoom + (event.deltaY < 0 ? 0.15 : -0.15));
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLImageElement>) {
    if (zoom <= 1) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);

    setDragStart({
      x: event.clientX - pan.x,
      y: event.clientY - pan.y,
    });
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLImageElement>) {
    if (!dragging) return;

    setPan({
      x: event.clientX - dragStart.x,
      y: event.clientY - dragStart.y,
    });
  }

  // Keyboard controls
  useEffect(() => {
    if (activeImageIndex === null) return;

    function handleKey(event: KeyboardEvent) {
      const target = event.target;

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (event.key === "Escape") closeViewer();
      if (event.key === "ArrowRight") moveImage(1);
      if (event.key === "ArrowLeft") moveImage(-1);

      if (event.key === "+" || event.key === "=") {
        setZoom((value) => Math.min(5, value + 0.25));
      }

      if (event.key === "-") {
        setZoom((value) => Math.max(0.5, value - 0.25));
      }
    }

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, [activeImageIndex, images.length]);

  // Slideshow: automatically advance every three seconds
  useEffect(() => {
    if (!slideShow || activeImageIndex === null || images.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveImageIndex((current) => {
        if (current === null) return current;
        return (current + 1) % images.length;
      });

      setZoom(1);
      setPan({ x: 0, y: 0 });
    }, 3000);

    return () => window.clearInterval(timer);
  }, [slideShow, activeImageIndex, images.length]);

  return (
    <section className="gallery-section" id="gallery">
      <div className="gallery-heading">
        <div>
          <p className="gallery-eyebrow">SELECTED MOMENTS</p>
          <h2>
            Gallery<span>.</span>
          </h2>
          <p>Snapshots, experiments, and moments worth keeping.</p>
        </div>

        <button
          type="button"
          className="gallery-owner-button"
          onClick={() => {
            setShowLogin((value) => !value);
            setMessage("");
          }}
        >
          {authenticated ? "Manage Gallery" : "Owner Upload"}
        </button>
      </div>

      {message && (
        <p className="gallery-message" role="status">
          {message}
        </p>
      )}

      {showLogin && !authenticated && (
        <form className="gallery-owner-panel" onSubmit={login}>
          <h3>Owner Login</h3>

          <label>
            Username
            <input
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <button disabled={busy} type="submit">
            {busy ? "Please wait…" : "Unlock uploads"}
          </button>
        </form>
      )}

      {authenticated && (
        <div className="gallery-owner-panel">
          <div className="gallery-owner-top">
            <h3>Manage Gallery</h3>
            <button type="button" onClick={() => void logout()}>
              Log out
            </button>
          </div>

          <form onSubmit={upload}>
            <label>
              Image title
              <input
                maxLength={120}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </label>

            <label>
              Choose image (JPEG, PNG, WebP; max 8 MB)
              <input
                id="gallery-file-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) =>
                  setFile(event.target.files?.[0] ?? null)
                }
                required
              />
            </label>

            <button disabled={busy} type="submit">
              {busy ? "Working…" : "Upload for approval"}
            </button>
          </form>

          <h3>Awaiting approval ({pending.length})</h3>

          {pending.length === 0 && (
            <p>No images are waiting for approval.</p>
          )}

          {pending.map((image) => (
            <div className="gallery-pending-row" key={image.id}>
              <span>{image.title}</span>

              <button
                type="button"
                disabled={busy}
                onClick={() => void moderate(image.id, "approve")}
              >
                Approve
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => void moderate(image.id, "reject")}
              >
                Reject
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Public image grid */}
      <div className="gallery-grid">
        {images.map((image, index) => (
          <figure className="gallery-card" key={image.id}>
            <button
              type="button"
              className="gallery-image-trigger"
              onClick={() => openViewer(index)}
              aria-label={`View ${image.title}`}
            >
              <img
                src={image.secureUrl}
                alt={image.title}
                loading="lazy"
              />
              <span className="gallery-view-hint">View image ↗</span>
            </button>

            <figcaption>{image.title}</figcaption>
          </figure>
        ))}
      </div>

      {images.length === 0 && (
        <p className="gallery-empty">New moments will appear here soon.</p>
      )}

      {/* Full-screen image viewer */}
      {activeImageIndex !== null && images[activeImageIndex] && (
        <div
          className="gallery-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeViewer();
          }}
        >
          <div className="gallery-lightbox-header">
            <span>
              {images[activeImageIndex].title} · {activeImageIndex + 1} /{" "}
              {images.length}
            </span>

            <button
              type="button"
              onClick={closeViewer}
              aria-label="Close viewer"
            >
              ✕
            </button>
          </div>

          <div
            className="gallery-lightbox-stage"
            onWheel={handleWheel}
          >
            <img
              className="gallery-lightbox-image"
              src={images[activeImageIndex].secureUrl}
              alt={images[activeImageIndex].title}
              draggable={false}
              style={{
                filter: `brightness(${brightness}%)`,
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                maxWidth: imageSize === "fit" ? "100%" : "none",
                maxHeight: imageSize === "fit" ? "100%" : "none",
                cursor:
                  zoom > 1
                    ? dragging
                      ? "grabbing"
                      : "grab"
                    : "default",
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={() => setDragging(false)}
              onPointerCancel={() => setDragging(false)}
            />
          </div>

          <div className="gallery-lightbox-controls">
            <div className="gallery-viewer-buttons">
              <button
                type="button"
                onClick={() => moveImage(-1)}
                disabled={images.length < 2}
              >
                ← Previous
              </button>

              <button
                type="button"
                onClick={() => moveImage(1)}
                disabled={images.length < 2}
              >
                Next →
              </button>

              <button
                type="button"
                onClick={() => changeZoom(zoom - 0.25)}
              >
                − Zoom
              </button>

              <button
                type="button"
                onClick={() => changeZoom(zoom + 0.25)}
              >
                + Zoom
              </button>

              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                  setImageSize("fit");
                }}
              >
                Fit screen
              </button>

              <button
                type="button"
                onClick={() => {
                  setImageSize("original");
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
              >
                Original size
              </button>

              <button
                type="button"
                onClick={() => setSlideShow((value) => !value)}
                disabled={images.length < 2}
              >
                {slideShow ? "❚❚ Pause slideshow" : "▶ Slideshow"}
              </button>
            </div>

            <label className="gallery-slider">
              <span>Brightness: {brightness}%</span>
              <input
                type="range"
                min="25"
                max="200"
                value={brightness}
                onChange={(event) =>
                  setBrightness(Number(event.target.value))
                }
              />
            </label>

            <label className="gallery-slider">
              <span>Zoom: {Math.round(zoom * 100)}%</span>
              <input
                type="range"
                min="50"
                max="500"
                step="25"
                value={Math.round(zoom * 100)}
                onChange={(event) =>
                  changeZoom(Number(event.target.value) / 100)
                }
              />
            </label>
          </div>
        </div>
      )}
    </section>
  );
}
