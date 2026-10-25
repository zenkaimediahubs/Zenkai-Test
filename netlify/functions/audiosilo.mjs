// Audiobook details (narrators, recordings) from the open Audiosilo metadata database.
// Its core facts are released as CC0 and its read-only API needs no key. This helper only passes
// the question along and keeps the answer for a day, so the browser never has to ask the site itself.
const BASE = "https://meta.audiosilo.app/api/v1";
const ok = (obj, age = 86400) => new Response(JSON.stringify(obj), { headers: { "content-type": "application/json", "access-control-allow-origin": "*", "cache-control": `public, max-age=${age}`, "netlify-cdn-cache-control": `public, durable, s-maxage=${age}` } });
export default async (req) => {
  const u = new URL(req.url), q = (u.searchParams.get("q") || "").trim().slice(0, 120), isbn = (u.searchParams.get("isbn") || "").replace(/[^0-9Xx]/g, "").slice(0, 13);
  if (!q && !isbn) return ok({ results: [] }, 60);
  try {
    const url = isbn ? `${BASE}/lookup?isbn=${isbn}` : `${BASE}/search?q=${encodeURIComponent(q)}`;
    const r = await fetch(url, { headers: { accept: "application/json", "user-agent": "ZenkaiMedia/1.0 (personal media tracker)" }, signal: AbortSignal.timeout(6000) });
    if (!r.ok) return ok({ results: [], error: r.status }, 300);
    const d = await r.json();
    return ok({ results: Array.isArray(d) ? d : d.results || d.works || (d.work ? [d.work] : []) });
  } catch (e) { return ok({ results: [], error: "unreachable" }, 120); }
};
export const config = { path: "/api/audiosilo" };
