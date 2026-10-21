// Zenkai Media "where to read, which songs, where to listen" helper.
// Three public services, no keys needed, each asked through here so answers are cached for everyone:
//  - op=read:   MangaBaka (api.mangabaka.dev) lists a manga's official links: publishers, reading sites and shops.
//               Links MangaBaka marks as piracy are dropped here and never reach the app.
//  - op=themes: AnimeThemes (api.animethemes.moe) lists an anime's opening and ending songs and who sings them.
//               Only the song facts are used, not AnimeThemes' video clips.
//  - op=listen: Odesli (api.song.link) turns one Apple Music link into the same song on Spotify, YouTube Music,
//               Deezer, Tidal and others.

const UA = "ZenkaiMedia/1.0 (personal media tracker; https://zenkaimedia.netlify.app)";
const json = (body, status = 200, days = 3) => new Response(JSON.stringify(body), { status, headers: {
  "content-type": "application/json",
  "cache-control": status === 200 ? "public, max-age=3600" : "no-store",
  "netlify-cdn-cache-control": status === 200 ? `public, durable, s-maxage=${days * 86400}, stale-while-revalidate=${days * 86400}` : "no-store",
  "netlify-vary": "query",
} });
const get = async (url) => {
  const r = await fetch(url, { headers: { accept: "application/json", "user-agent": UA }, signal: AbortSignal.timeout(8000) });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
};
const norm = s => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const KEEP = new Set(["publisher", "webplatform", "retailer", "info"]);

async function read(al, title) {
  let id = null;
  if (al) {
    const d = await get(`https://api.mangabaka.dev/v1/source/anilist/${al}`);
    const s = (d?.data?.series || []).find(x => x.state !== "deleted");
    id = s ? (s.state === "merged" && s.merged_with ? s.merged_with : s.id) : null;
  }
  if (!id && title) {
    const d = await get(`https://api.mangabaka.dev/v1/series/search?${new URLSearchParams({ q: title, limit: "5" })}`);
    const want = norm(title);
    const hit = (d?.data || []).find(x => [x.title, x.romanized_title, x.native_title].some(t => norm(t) === want));
    id = hit?.id || null; // only an exact title match counts, so a different series with a similar name isn't used
  }
  if (!id) return { links: [], series: null };
  const d = await get(`https://api.mangabaka.dev/v1/series/${id}/links?limit=100`);
  const seen = new Set();
  const links = (d?.data || []).filter(l => KEEP.has(l.type) && /^https:\/\//.test(l.url || "") && !seen.has(l.url) && seen.add(l.url)).map(l => ({
    url: l.url, site: l.name_display || l.name, domain: l.name, type: l.type, lang: l.language && l.language !== "unknown" ? l.language : "",
    checked: l.last_checked_at || null, status: Number.isInteger(l.status) ? l.status : null,
  }));
  return { links, series: id, source: "https://mangabaka.dev" };
}

async function themes(al, mal) {
  const site = al ? "AniList" : "MyAnimeList", ext = al || mal;
  const q = new URLSearchParams({ "filter[has]": "resources", "filter[site]": site, "filter[external_id]": String(ext), include: "animethemes.song.artists,animethemes.animethemeentries" });
  const d = await get(`https://api.animethemes.moe/anime?${q}`);
  const a = (d?.anime || [])[0];
  if (!a) return { themes: [] };
  const list = (a.animethemes || []).filter(t => t.song?.title).map(t => ({
    type: t.type, seq: t.sequence || 1, slug: t.slug, title: t.song.title,
    artists: (t.song.artists || []).map(x => x.artistsong?.as || x.name).filter(Boolean),
    episodes: (t.animethemeentries || [])[0]?.episodes || "",
  })).sort((x, y) => (x.type === y.type ? x.seq - y.seq : x.type === "OP" ? -1 : 1));
  return { themes: list, anime: a.name, source: a.slug ? `https://animethemes.moe/anime/${a.slug}` : "" };
}

const PLATFORMS = { spotify: "Spotify", appleMusic: "Apple Music", youtubeMusic: "YouTube Music", youtube: "YouTube", deezer: "Deezer", tidal: "Tidal", amazonMusic: "Amazon Music", soundcloud: "SoundCloud", pandora: "Pandora", anghami: "Anghami", boomplay: "Boomplay", audiomack: "Audiomack" };
async function listen(url) {
  const d = await get(`https://api.song.link/v1-alpha.1/links?${new URLSearchParams({ url, userCountry: "US" })}`);
  const out = Object.entries(d?.linksByPlatform || {}).filter(([k, v]) => PLATFORMS[k] && /^https:\/\//.test(v.url || "")).map(([k, v]) => ({ platform: k, name: PLATFORMS[k], url: v.url }));
  return { links: out, page: d?.pageUrl || "" };
}

export default async (req) => {
  const u = new URL(req.url), op = u.searchParams.get("op");
  const al = /^\d{1,8}$/.test(u.searchParams.get("al") || "") ? u.searchParams.get("al") : "";
  const mal = /^\d{1,8}$/.test(u.searchParams.get("mal") || "") ? u.searchParams.get("mal") : "";
  const title = String(u.searchParams.get("title") || "").replace(/[^\p{L}\p{N} '’:!?.,&-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 100);
  try {
    if (op === "read") { if (!al && title.length < 2) return json({ links: [] }); return json(await read(al, title)); }
    if (op === "themes") { if (!al && !mal) return json({ themes: [] }); return json(await themes(al, mal), 200, 7); }
    if (op === "listen") {
      let url; try { url = new URL(u.searchParams.get("url") || ""); } catch (e) { return json({ links: [] }); }
      if (url.protocol !== "https:" || !/(^|\.)(music\.apple\.com|itunes\.apple\.com)$/.test(url.hostname)) return json({ error: "Only Apple Music links" }, 400);
      return json(await listen(url.href), 200, 14);
    }
    return json({ error: "That request isn't allowed." }, 400);
  } catch (e) {
    return json({ error: "The service didn't answer", detail: String(e.message || e).slice(0, 40) }, 502);
  }
};

export const config = { path: "/api/where" };
