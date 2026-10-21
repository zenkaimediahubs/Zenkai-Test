// Zenkai Media audiobook helper.
// Finds free public-domain audiobooks on LibriVox (read by volunteers) and returns their chapters.
// The audio itself plays straight from the Internet Archive, where LibriVox keeps it. No key needed.

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: {
  "content-type": "application/json",
  "cache-control": status === 200 ? "public, max-age=3600" : "no-store",
  "netlify-cdn-cache-control": status === 200 ? "public, durable, s-maxage=604800, stale-while-revalidate=604800" : "no-store",
  "netlify-vary": "query",
} });
const norm = s => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/^(the|a|an)\s+/, "").replace(/[^a-z0-9]+/g, " ").trim();
const hms = s => { s = Number(s) || 0; const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60; return h ? `${h} h ${m} min` : `${m} min`; };
const https = u => String(u || "").replace(/^http:\/\//, "https://");

async function feed(params) {
  const u = new URL("https://librivox.org/api/feed/audiobooks/");
  for (const [k, v] of Object.entries({ format: "json", extended: "1", coverart: "1", limit: "8", ...params })) u.searchParams.set(k, v);
  const r = await fetch(u, { headers: { accept: "application/json", "user-agent": "ZenkaiMedia/1.0 (personal media tracker)" }, signal: AbortSignal.timeout(9000) });
  if (r.status === 404) return [];
  if (!r.ok) throw new Error("librivox " + r.status);
  const d = await r.json().catch(() => ({}));
  return Array.isArray(d.books) ? d.books : [];
}

export default async (req) => {
  const u = new URL(req.url);
  const title = String(u.searchParams.get("title") || "").replace(/[^\p{L}\p{N} '’:,.!?-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 80);
  const author = String(u.searchParams.get("author") || "").replace(/[^\p{L}' -]/gu, "").trim().slice(0, 40);
  if (title.length < 2) return json({ books: [] });
  let list = [];
  try {
    // Titles that start the same way first, then any title that contains the words
    list = await feed({ title: "^" + title, ...(author ? { author } : {}) });
    if (!list.length && author) list = await feed({ title: "^" + title });
    if (!list.length) list = await feed({ title });
  } catch (e) { return json({ books: [], error: "LibriVox didn't answer" }, 502); }
  const want = norm(title), who = norm(author);
  const books = list
    .filter(b => (b.language || "English") && Array.isArray(b.sections) && b.sections.length)
    .map(b => {
      const t = norm(b.title), names = (b.authors || []).map(a => `${a.first_name || ""} ${a.last_name || ""}`.trim()).filter(Boolean);
      let score = t === want ? 3 : t.startsWith(want) ? 2 : t.includes(want) ? 1 : 0;
      if (who && names.some(n => norm(n).includes(who.split(" ").pop()))) score += 2;
      if (/dramatic reading|abridged/i.test(b.title)) score -= 1;
      const ia = /archive\.org\/details\/([^/?#]+)/.exec(b.url_iarchive || "")?.[1] || "";
      return {
        score, id: String(b.id), title: b.title, authors: names.join(", "), language: b.language || "",
        time: b.totaltime || (b.totaltimesecs ? hms(b.totaltimesecs) : ""), page: https(b.url_librivox),
        cover: https(b.coverart_thumbnail || b.coverart_jpg || (ia ? `https://archive.org/services/img/${ia}` : "")),
        sections: b.sections.slice(0, 200).map(s => ({
          title: String(s.title || "").trim(), url: https(s.listen_url), time: s.playtime ? hms(s.playtime) : "",
          reader: (s.readers || []).map(r => r.display_name).filter(Boolean).slice(0, 2).join(", "),
        })).filter(s => /^https:\/\//.test(s.url)),
      };
    })
    .filter(b => b.score > 0 && b.sections.length)
    .sort((a, b) => b.score - a.score || (a.language === "English" ? -1 : 1))
    .slice(0, 3)
    .map(({ score, ...b }) => b);
  return json({ books });
};

export const config = { path: "/api/librivox" };
