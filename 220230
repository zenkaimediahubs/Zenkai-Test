// Zenkai Media free books helper: lists public-domain books from Project Gutenberg
// (through Gutendex) and fetches the plain text of one book so it can be read in the app.
// No key needed. Netlify keeps copies, so Gutenberg is asked as little as possible.

const UA = "ZenkaiMedia/1.0 (free personal media tracker; https://zenkaimedia.netlify.app)";
const cacheHeaders = (type, secs) => ({
  "content-type": type,
  "cache-control": "public, max-age=3600",
  "netlify-cdn-cache-control": `public, durable, s-maxage=${secs}, stale-while-revalidate=${secs}`,
  "netlify-vary": "query",
});
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export default async (req) => {
  const u = new URL(req.url);
  const op = u.searchParams.get("op") || "list";

  if (op === "text") {
    const id = (u.searchParams.get("id") || "").replace(/\D/g, "").slice(0, 7);
    if (!id) return json({ error: "Missing id" }, 400);
    const tries = [
      `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`,
      `https://www.gutenberg.org/ebooks/${id}.txt.utf-8`,
    ];
    for (const url of tries) {
      try {
        const r = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
        if (r.ok) {
          const text = await r.text();
          if (text.length > 500) return new Response(text, { headers: cacheHeaders("text/plain; charset=utf-8", 2592000) });
        }
      } catch (e) {}
    }
    return json({ error: "That book couldn't be fetched." }, 502);
  }

  // A list of books, most downloaded first
  const q = new URLSearchParams({ languages: u.searchParams.get("lang") === "fr" ? "fr" : "en", copyright: "false" });
  const page = (u.searchParams.get("page") || "").replace(/\D/g, "").slice(0, 4);
  const search = (u.searchParams.get("search") || "").slice(0, 80);
  const ids = (u.searchParams.get("ids") || "").replace(/[^\d,]/g, "").slice(0, 80);
  const topic = (u.searchParams.get("topic") || "").slice(0, 40);
  if (page) q.set("page", page);
  if (search) q.set("search", search);
  if (ids) q.set("ids", ids);
  if (topic) q.set("topic", topic);
  // Gutendex first. It can be slow, so give it a few seconds, then ask Gutenberg's own catalogue instead.
  try {
    const r = await fetch(`https://gutendex.com/books/?${q}`, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(4500) });
    if (r.ok) return new Response(await r.text(), { headers: cacheHeaders("application/json", search ? 86400 : 43200) });
  } catch (e) {}
  try {
    const body = await fromCatalogue({ page: Number(page) || 1, search: search || topic, ids });
    if (body.results.length) return new Response(JSON.stringify(body), { headers: cacheHeaders("application/json", 21600) });
  } catch (e) {}
  return json({ error: "Project Gutenberg isn't answering right now." }, 502);
};

// Project Gutenberg's OPDS catalogue (Atom XML), turned into the same shape Gutendex gives
const unxml = t => String(t || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&amp;/g, "&").trim();
const tag = (x, name) => { const m = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`).exec(x); return m ? unxml(m[1]) : ""; };
async function fromCatalogue({ page, search, ids }) {
  const urls = ids ? ids.split(",").filter(Boolean).slice(0, 5).map(id => `https://www.gutenberg.org/ebooks/${id}.opds`)
    : [`https://www.gutenberg.org/ebooks/search.opds/?${new URLSearchParams({ sort_order: "downloads", start_index: String((page - 1) * 25 + 1), ...(search ? { query: search } : {}) })}`];
  const results = [], seen = new Set();
  for (const url of urls) {
    const only = ids ? Number((/ebooks\/(\d+)\.opds/.exec(url) || [])[1]) : 0;
    const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/atom+xml" }, signal: AbortSignal.timeout(4500) });
    if (!r.ok) continue;
    const xml = await r.text();
    for (const e of xml.split(/<entry[\s>]/).slice(1)) {
      const id = Number((/\/ebooks\/(\d+)/.exec(e) || [])[1]); if (!id || seen.has(id) || (only && id !== only)) continue;
      const title = tag(e, "title"); if (!title) continue;
      seen.add(id);
      const who = tag(e, "name") || tag(e, "content").split("\n")[0];
      results.push({ id, title, authors: who ? [{ name: who }] : [], summaries: [], subjects: [], bookshelves: [], languages: ["en"], copyright: false,
        formats: { "image/jpeg": `https://www.gutenberg.org/cache/epub/${id}/pg${id}.cover.medium.jpg`, "text/plain; charset=utf-8": `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt` }, download_count: 0 });
      if (ids) break;
    }
  }
  return { count: results.length ? 70000 : 0, next: !ids && results.length >= 20 ? "more" : null, previous: null, results };
}

export const config = { path: "/api/gutenberg" };
