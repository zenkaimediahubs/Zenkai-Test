// Zenkai Media picture helper.
// Share cards are drawn on a canvas, and browsers only let a canvas be saved when its pictures allow it.
// Many cover sites don't, so this fetches the cover for the app from a short list of known cover sites.

const HOSTS = [
  /^image\.tmdb\.org$/, /^s4\.anilist\.co$/, /^img\.anili\.st$/, /^uploads\.mangadex\.org$/, /^covers\.openlibrary\.org$/,
  /^i\d?\.ytimg\.com$/, /^yt3\.(ggpht|googleusercontent)\.com$/, /^is\d-ssl\.mzstatic\.com$/, /^assets\.fanart\.tv$/,
  /^comicvine\.gamespot\.com$/, /^media\.kitsu\.(app|io)$/, /^cdn\.myanimelist\.net$/, /^(ia\d+\.us\.)?archive\.org$/,
  /^www\.gutenberg\.org$/, /^(th|w)\.wallhaven\.cc$/, /^static\.wikia\.nocookie\.net$/, /^books\.google\.com$/,
];
const MAX = 8 * 1024 * 1024;

export default async (req) => {
  let target;
  try { target = new URL(new URL(req.url).searchParams.get("u") || ""); } catch (e) { return new Response("Bad address", { status: 400 }); }
  if (target.protocol !== "https:" && target.protocol !== "http:") return new Response("Bad address", { status: 400 });
  if (!HOSTS.some(rx => rx.test(target.hostname))) return new Response("That site isn't on the list", { status: 403 });
  target.protocol = "https:";
  // Redirects are followed by hand, so every step stays on a site from the list
  let r;
  try {
    for (let hop = 0; hop < 4; hop++) {
      r = await fetch(target, { headers: { accept: "image/*", "user-agent": "ZenkaiMedia/1.0" }, redirect: "manual", signal: AbortSignal.timeout(8000) });
      if (r.status < 300 || r.status >= 400) break;
      const next = new URL(r.headers.get("location") || "", target);
      if (next.protocol === "http:") next.protocol = "https:";
      if (next.protocol !== "https:" || !HOSTS.some(rx => rx.test(next.hostname))) return new Response("That site isn't on the list", { status: 403 });
      target = next; r = null;
    }
  } catch (e) { return new Response("Couldn't fetch it", { status: 502 }); }
  if (!r) return new Response("Too many redirects", { status: 502 });
  const type = r.headers.get("content-type") || "";
  if (!r.ok || !/^image\//.test(type)) return new Response("Not a picture", { status: 502 });
  const len = Number(r.headers.get("content-length") || 0);
  if (len > MAX) return new Response("Too big", { status: 413 });
  const buf = await r.arrayBuffer();
  if (buf.byteLength > MAX) return new Response("Too big", { status: 413 });
  return new Response(buf, { headers: {
    "content-type": type, "access-control-allow-origin": "*", "x-content-type-options": "nosniff",
    "cache-control": "public, max-age=86400", "netlify-cdn-cache-control": "public, durable, s-maxage=2592000",
  } });
};

export const config = { path: "/api/img" };
