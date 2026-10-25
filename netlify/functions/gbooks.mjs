// Google Books helper: public book search and details (descriptions, ISBNs, categories, covers, preview links).
// The key, if one is set in Netlify, stays here on the server. Google Books also answers without a key, with a lower daily limit.
// Accepted names for the key (the first one found is used): GOOGLE_BOOKS_KEY, GOOGLE_BOOKS_API_KEY, GOOGLE_API_KEY, BOOKS_API_KEY, GBOOKS_KEY.
const NAMES = ["GOOGLE_BOOKS_KEY", "GOOGLE_BOOKS_API_KEY", "GOOGLE_API_KEY", "BOOKS_API_KEY", "GBOOKS_KEY"];
const json = (body, status = 200, cache = true) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json",
  "cache-control": cache && status === 200 ? "public, max-age=3600" : "no-store", "netlify-cdn-cache-control": cache && status === 200 ? "public, durable, s-maxage=86400" : "no-store", "netlify-vary": "query" } });
const keyInfo = () => { for (const n of NAMES) { const v = (Netlify.env.get(n) || "").trim(); if (v) return { name: n, value: v }; } return null; };
const pick = v => { const i = v.volumeInfo || {}, ids = Object.fromEntries((i.industryIdentifiers || []).map(x => [x.type, x.identifier]));
  return { id: v.id, title: i.title || "", subtitle: i.subtitle || "", authors: i.authors || [], publisher: i.publisher || "", published: i.publishedDate || "", description: i.description || "",
    isbn13: ids.ISBN_13 || "", isbn10: ids.ISBN_10 || "", pages: i.pageCount || 0, categories: i.categories || [], rating: i.averageRating || null, ratings: i.ratingsCount || 0, language: i.language || "",
    cover: (i.imageLinks?.thumbnail || i.imageLinks?.smallThumbnail || "").replace(/^http:/, "https:").replace("&edge=curl", ""), preview: i.previewLink || "", viewable: v.accessInfo?.viewability || "", series: i.seriesInfo?.bookDisplayNumber || "" }; };
export default async (req) => {
  const u = new URL(req.url), op = u.searchParams.get("op") || "search";
  const k = keyInfo();
  if (op === "status") return json({ key: k ? k.name : null, note: k ? "A Google Books key is set." : "No key found: Google Books still works with a lower daily limit." }, 200, false);
  let target;
  if (op === "search") {
    const q = (u.searchParams.get("q") || "").trim().slice(0, 160); if (!q) return json({ items: [] });
    target = new URL("https://www.googleapis.com/books/v1/volumes"); target.searchParams.set("q", q); target.searchParams.set("maxResults", String(Math.min(20, Number(u.searchParams.get("n")) || 12)));
    target.searchParams.set("printType", "books"); const start = Number(u.searchParams.get("start")) || 0; if (start) target.searchParams.set("startIndex", String(Math.min(400, start)));
    const lang = (u.searchParams.get("lang") || "").replace(/[^a-z]/g, "").slice(0, 2); if (lang) target.searchParams.set("langRestrict", lang);
  } else if (op === "volume") {
    const id = (u.searchParams.get("id") || "").replace(/[^\w-]/g, "").slice(0, 20); if (!id) return json({ error: "No id" }, 400, false);
    target = new URL(`https://www.googleapis.com/books/v1/volumes/${id}`);
  } else return json({ error: "Unknown request" }, 400, false);
  if (k) target.searchParams.set("key", k.value);
  try {
    const r = await fetch(target, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(8000) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return json({ error: d?.error?.message ? `Google Books: ${d.error.message}` : `Google Books answered with error ${r.status}.` }, r.status === 403 ? 403 : 502, false);
    return json(op === "volume" ? { item: pick(d) } : { total: d.totalItems || 0, items: (d.items || []).map(pick) });
  } catch (e) { return json({ error: "Google Books didn't answer in time." }, 504, false); }
};
export const config = { path: "/api/gbooks" };
