/**
 * api.js — shared API base URL for all fetch() calls.
 *
 * In development, Vite's proxy forwards /api → localhost:5001.
 * In production (Vercel), we must call the Render backend directly
 * because Vercel cannot proxy websocket traffic and does not support
 * external rewrite targets in vercel.json without serverless functions.
 *
 * Set VITE_API_URL in the Vercel dashboard to override the default.
 */
const API_BASE = (
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? '' // empty string → Vite proxy handles /api/... in dev
    : 'https://oee-backend-pjpu.onrender.com')
).replace(/\/+$/, '');

/**
 * Build a fully-qualified URL for the given API path.
 * @param {string} path  Must start with "/" (e.g. "/api/machines")
 * @returns {string}
 */
export function apiUrl(path) {
  return `${API_BASE}${path}`;
}
