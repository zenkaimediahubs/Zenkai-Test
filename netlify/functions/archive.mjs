// Zenkai Media free comics from the Internet Archive (archive.org).
// Only items marked as public domain or as Golden Age comics are asked for, the way the open-source
// ACBR comic reader (github.com/binarynonsense/comic-book-reader) searches it. Covers come from
// archive.org's own picture service. Pages open in Zenkai's own comic reader (op=pages) or in the Internet Archive's reader.

const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...extra } });
const FREE = '(licenseurl:*publicdomain* OR subject:"public domain" OR subject:"golden age" OR collection:goldenagecomics OR collection:comicbooks_publicdomain)';
const COMICS = '(collection:comics OR subject:comics OR subject:"comic books" OR subject:"comic book")';

const HEAD = { Accept: "application/json", "User-Agent": "ZenkaiMedia/1.0 (personal media tracker)" };
const list = v => (Array.isArray(v) ? v : v == null ? [] : [v]).map(x => String(x).toLowerCase());

// The page pictures of one public-domain comic, from the Internet Archive's IIIF service, for Zenkai's own comic reader.
// The item's metadata is checked first, so only public-domain and Golden Age comics can be opened this way.
async function pages(id) {
  if (!/^[\w.-]{3,100}$/.test(id)) return json({ error: "That isn't an Internet Archive item." }, 400);
  try {
    const md = await fetch(`https://archive.org/metadata/${encodeURIComponent(id)}/metadata`, { headers: HEAD, signal: AbortSignal.timeout(7000) });
    if (!md.ok) return json({ error: "The Internet Archive isn't answering right now." }, 502);
    const m = (await md.json()).result || {};
    const free = list(m.licenseurl).some(x => x.includes("publicdomain")) || list(m.subject).some(x => /public domain|golden age/.test(x))
      || list(m.collection).some(x => x === "goldenagecomics" || x === "comicbooks_publicdomain");
    if (!free) return json({ error: "Only public-domain comics open in Zenkai's reader." }, 403);
    const r = await fetch(`https://iiif.archive.org/iiif/3/${encodeURIComponent(id)}/manifest.json`, { headers: HEAD, signal: AbortSignal.timeout(9000) });
    if (!r.ok) return json({ error: "This comic has no page pictures." }, 502);
    const man = await r.json(), out = [];
    for (const cv of man.items || []) {
      const body = cv.items?.[0]?.items?.[0]?.body; if (!body) continue;
      const svc = [].concat(body.service || [])[0], sid = svc?.id || svc?.["@id"];
      if (sid && /^https:\/\/[\w.-]*archive\.org\//.test(sid)) out.push({ full: `${sid}/full/!1600,2400/0/default.jpg`, thumb: `${sid}/full/!200,300/0/default.jpg` });
      else if (body.id && /^https:\/\/[\w.-]*archive\.org\//.test(body.id)) out.push({ full: body.id, thumb: body.id });
      if (out.length >= 800) break;
    }
    return json({ pages: out, title: String([].concat(m.title || "")[0] || id).slice(0, 140) }, 200, {
      "cache-control": "public, max-age=86400", "netlify-cdn-cache-control": "public, durable, s-maxage=604800", "netlify-vary": "query",
    });
  } catch (e) { return json({ error: "The Internet Archive isn't answering right now." }, 502); }
}

export default async (req) => {
  const u = new URL(req.url);
  if (u.searchParams.get("op") === "pages") return pages(u.searchParams.get("id") || "");
  const q = (u.searchParams.get("q") || "").replace(/[^\p{L}\p{N} '-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 60);
  const page = String(Math.min(50, Math.max(1, parseInt(u.searchParams.get("page") || "1", 10) || 1)));
  const query = [q ? `title:(${q})` : "", "mediatype:texts", COMICS, FREE].filter(Boolean).join(" AND ");
  const target = "https://archive.org/advancedsearch.php?" + new URLSearchParams({ q: query, rows: "24", page, output: "json" })
    + "&fl[]=identifier&fl[]=title&fl[]=creator&fl[]=year&fl[]=date&fl[]=publisher&fl[]=downloads&sort[]=" + encodeURIComponent(q ? "" : "downloads desc");
  try {
    const r = await fetch(target, { headers: { Accept: "application/json", "User-Agent": "ZenkaiMedia/1.0 (personal media tracker)" }, signal: AbortSignal.timeout(7000) });
    if (!r.ok) return json({ items: [], error: "The Internet Archive isn't answering right now." }, 502);
    const d = await r.json(), docs = d.response?.docs || [];
    const one = v => Array.isArray(v) ? v[0] : v;
    const items = docs.filter(x => /^[\w.-]{3,100}$/.test(x.identifier || "")).map(x => ({
      id: x.identifier, title: String(one(x.title) || x.identifier).slice(0, 140), creator: String(one(x.creator) || one(x.publisher) || "").slice(0, 80),
      year: String(one(x.year) || String(one(x.date) || "").slice(0, 4) || ""), downloads: x.downloads || 0,
    }));
    return json({ items, total: d.response?.numFound || items.length }, 200, {
      "cache-control": "public, max-age=3600", "netlify-cdn-cache-control": "public, durable, s-maxage=86400, stale-while-revalidate=604800", "netlify-vary": "query",
    });
  } catch (e) { return json({ items: [], error: "The Internet Archive isn't answering right now." }, 502); }
};

export const config = { path: "/api/archive" };
