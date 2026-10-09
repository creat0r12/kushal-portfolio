
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_BASE = (
  configuredApiUrl || "http://localhost:5001"
).replace(/\/+$/, "");

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
}
