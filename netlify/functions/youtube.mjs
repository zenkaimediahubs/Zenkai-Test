// Zenkai Media YouTube helper.
// Uses the YOUTUBE_KEY saved in Netlify's environment variables, so nobody sees the key.
// Only a few read-only requests are allowed, and Netlify keeps copies so the daily
// allowance from Google lasts (trending and channel details cost 1 unit, a search costs 100).

const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...extra } });
const clip = (v, n = 120) => (v || "").toString().slice(0, n);

export default async (req) => {
  const key = (Netlify.env.get("YOUTUBE_KEY") || "").trim();
  if (!key) return json({ error: "nokey" }, 503);
  const u = new URL(req.url), op = u.searchParams.get("op") || "";
  const region = clip(u.searchParams.get("region"), 2).toUpperCase().replace(/[^A-Z]/g, "") || "US";
  const page = clip(u.searchParams.get("pageToken"), 60);
  let path, params, ttl = 3600;
  if (op === "trending") {
    path = "videos"; params = { part: "snippet,statistics,contentDetails", chart: "mostPopular", regionCode: region, maxResults: "24" };
    const cat = clip(u.searchParams.get("cat"), 3).replace(/\D/g, ""); if (cat) params.videoCategoryId = cat;
    if (page) params.pageToken = page;
  } else if (op === "search") {
    const q = clip(u.searchParams.get("q"), 100).trim(); if (q.length < 2) return json({ items: [] });
    const type = u.searchParams.get("type") === "channel" ? "channel" : "video,channel";
    path = "search"; params = { part: "snippet", q, type, maxResults: "10", safeSearch: "moderate" }; ttl = 86400;
  } else if (op === "find") {
    // One round trip for the whole search box: channels and videos are searched side by side, then their details are
    // fetched side by side, so the page can show channels first and videos right under them.
    const q = clip(u.searchParams.get("q"), 100).trim(); if (q.length < 2) return json({ channels: [], videos: [] });
    const get = (p2, ps) => { const t = new URL("https://www.googleapis.com/youtube/v3/" + p2); for (const [k, v] of Object.entries(ps)) t.searchParams.set(k, v); t.searchParams.set("key", key); return fetch(t, { headers: { Accept: "application/json" } }); };
    const [sc, sv] = await Promise.all([get("search", { part: "snippet", q, type: "channel", maxResults: "3", safeSearch: "moderate" }), get("search", { part: "snippet", q, type: "video", maxResults: "12", safeSearch: "moderate" })]);
    if (!sc.ok && !sv.ok) return json({ error: "youtube" }, sc.status === 403 || sv.status === 403 ? 403 : 502, { "cache-control": "no-store" });
    const cj = sc.ok ? await sc.json() : { items: [] }, vj = sv.ok ? await sv.json() : { items: [] };
    const cid = (cj.items || []).map(x => x.id?.channelId).filter(Boolean).join(","), vid = (vj.items || []).map(x => x.id?.videoId).filter(Boolean).join(",");
    const [cd, vd] = await Promise.all([
      cid ? get("channels", { part: "snippet,statistics,contentDetails,brandingSettings", id: cid }).then(r => r.ok ? r.json() : { items: [] }) : { items: [] },
      vid ? get("videos", { part: "snippet,statistics,contentDetails", id: vid }).then(r => r.ok ? r.json() : { items: [] }) : { items: [] }]);
    return json({ channels: cd.items || [], videos: vd.items || [] }, 200, { "cache-control": "public, max-age=3600", "netlify-cdn-cache-control": "public, durable, s-maxage=86400, stale-while-revalidate=86400", "netlify-vary": "query" });
  } else if (op === "videos") {
    const id = clip(u.searchParams.get("id"), 600).replace(/[^\w,-]/g, ""); if (!id) return json({ items: [] });
    path = "videos"; params = { part: "snippet,statistics,contentDetails", id }; ttl = 21600;
  } else if (op === "check") {
    // Can these videos play inside another site, and in which countries? Used to pick a trailer that works.
    const id = clip(u.searchParams.get("id"), 240).replace(/[^\w,-]/g, ""); if (!id) return json({ items: [] });
    path = "videos"; params = { part: "status,contentDetails", id, maxResults: "10" }; ttl = 86400;
  } else if (op === "channels") {
    path = "channels"; params = { part: "snippet,statistics,contentDetails,brandingSettings" }; ttl = 86400;
    const id = clip(u.searchParams.get("id"), 600).replace(/[^\w,-]/g, ""), handle = clip(u.searchParams.get("handle"), 60).replace(/[^\w.@-]/g, "");
    if (id) params.id = id; else if (handle) params.forHandle = handle; else return json({ items: [] });
  } else if (op === "uploads") {
    const id = clip(u.searchParams.get("id"), 60).replace(/[^\w-]/g, ""); if (!id) return json({ items: [] });
    path = "playlistItems"; params = { part: "snippet,contentDetails", playlistId: id, maxResults: "24" }; ttl = 7200;
    if (page) params.pageToken = page;
  } else return json({ error: "That request isn't allowed." }, 400);

  const target = new URL("https://www.googleapis.com/youtube/v3/" + path);
  for (const [k, v] of Object.entries(params)) target.searchParams.set(k, v);
  target.searchParams.set("key", key);
  const r = await fetch(target, { headers: { Accept: "application/json" } });
  const body = await r.text();
  return new Response(body, {
    status: r.status,
    headers: {
      "content-type": "application/json",
      "cache-control": r.ok ? `public, max-age=${Math.min(ttl, 3600)}` : "no-store",
      "netlify-cdn-cache-control": r.ok ? `public, durable, s-maxage=${ttl}, stale-while-revalidate=86400` : "no-store",
      "netlify-vary": "query",
    },
  });
};

export const config = { path: "/api/youtube" };
