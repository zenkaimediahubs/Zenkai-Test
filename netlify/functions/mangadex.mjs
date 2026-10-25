// Zenkai Media MangaDex helper: finds a manga, its details, covers and chapter lists.
// MangaDex needs no key. Only searching manga and reading chapter lists is allowed,
// and only for safe and suggestive titles. Netlify keeps copies for a few minutes.

const ALLOWED = /^\/(manga|chapter|cover|manga\/[0-9a-f-]{36}|manga\/[0-9a-f-]{36}\/feed|manga\/[0-9a-f-]{36}\/aggregate|statistics\/manga\/[0-9a-f-]{36})$/;
// Only lists of manga and chapters take a content-rating filter; the other endpoints reject it
const RATED = /^\/(manga|chapter|manga\/[0-9a-f-]{36}\/feed)$/;

export default async (req) => {
  const u = new URL(req.url);
  const path = u.searchParams.get("p") || "";
  if (!ALLOWED.test(path)) return new Response(JSON.stringify({ error: "That request isn't allowed." }), { status: 400, headers: { "content-type": "application/json" } });
  const target = new URL("https://api.mangadex.org" + path);
  for (const [k, v] of u.searchParams) {
    if (k === "p" || k.startsWith("contentRating")) continue;
    target.searchParams.append(k, v.slice(0, 200));
  }
  if (RATED.test(path)) { target.searchParams.append("contentRating[]", "safe"); target.searchParams.append("contentRating[]", "suggestive"); }
  const r = await fetch(target, { headers: { Accept: "application/json", "User-Agent": "ZenkaiMedia/1.0 (zenkaimedia.netlify.app)" } });
  const body = await r.text();
  return new Response(body, {
    status: r.status,
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=300",
      "netlify-cdn-cache-control": "public, durable, s-maxage=900, stale-while-revalidate=3600",
      "netlify-vary": "query",
    },
  });
};

export const config = { path: "/api/mangadex" };
