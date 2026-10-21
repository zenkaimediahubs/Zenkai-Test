// Zenkai Media openings and soundtracks helper.
// Looks up the theme song or soundtrack of an anime, film or show on Apple Music's public search
// (no key needed), and returns the best match with its official 30-second preview.
// Netlify keeps each answer for a week, so Apple's search isn't asked twice for the same title.

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: {
  "content-type": "application/json",
  "cache-control": status === 200 ? "public, max-age=86400" : "no-store",
  "netlify-cdn-cache-control": status === 200 ? "public, durable, s-maxage=604800, stale-while-revalidate=604800" : "no-store",
  "netlify-vary": "query",
} });
const norm = s => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

async function search(term, entity = "song", country = "us") {
  const u = new URL("https://itunes.apple.com/search");
  for (const [k, v] of Object.entries({ term, media: "music", entity, limit: "40", country })) u.searchParams.set(k, v);
  const r = await fetch(u, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error("itunes " + r.status);
  return (await r.json()).results || [];
}

export default async (req) => {
  const u = new URL(req.url);
  const title = String(u.searchParams.get("title") || "").replace(/[^\p{L}\p{N} '’:!?.&-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 80);
  const alt = String(u.searchParams.get("alt") || "").replace(/[^\p{L}\p{N} '’:!?.&-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 80);
  const kind = u.searchParams.get("kind") === "film" ? "film" : "anime";
  if (title.length < 2) return json({ track: null });
  const words = [...new Set([norm(title), norm(alt)].filter(Boolean).flatMap(t => t.split(" ")).filter(w => w.length > 2 && !["the", "and", "season", "part", "movie", "film"].includes(w)))];
  let list = [];
  try {
    list = kind === "anime" ? [...await search(title), ...(alt && alt !== title ? await search(alt) : [])] : await search(`${title} soundtrack`);
  } catch (e) { return json({ track: null, error: "Apple Music didn't answer" }, 502); }
  const seen = new Set();
  const scored = list.filter(x => x.kind === "song" && x.previewUrl && !seen.has(x.trackId) && seen.add(x.trackId)).map(x => {
    const where = norm(`${x.collectionName} ${x.trackName}`), genre = x.primaryGenreName || "";
    let s = words.filter(w => where.includes(w)).length * 2;
    if (kind === "anime") {
      if (genre === "Anime") s += 4; else if (/J-Pop|Soundtrack|Japan/i.test(genre)) s += 2;
      if (/\b(op|opening|theme|main theme)\b/i.test(`${x.trackName} ${x.collectionName}`)) s += 3;
      if (/\bfrom\b.*\b(anime|tv|series)\b/i.test(x.trackName + " " + x.collectionName)) s += 2;
    } else {
      if (/Soundtrack/i.test(genre)) s += 4;
      if (/soundtrack|motion picture|original score|music from/i.test(x.collectionName)) s += 3;
      if (x.trackNumber === 1) s += 1;
    }
    if (/karaoke|instrumental version|cover|tribute|8-bit|lullaby|piano version|music box/i.test(`${x.trackName} ${x.collectionName} ${x.artistName}`)) s -= 6;
    return { s, x };
  }).filter(o => o.s >= (kind === "anime" ? 6 : 6)).sort((a, b) => b.s - a.s);
  const best = scored[0]?.x;
  if (!best) return json({ track: null });
  return json({ track: {
    id: String(best.trackId), name: best.trackName, artist: best.artistName, album: best.collectionName,
    preview: best.previewUrl, art: (best.artworkUrl100 || "").replace(/\d+x\d+bb/, "300x300bb"), url: best.trackViewUrl || "",
    secs: Math.round((best.trackTimeMillis || 0) / 1000),
  } });
};

export const config = { path: "/api/ost" };
