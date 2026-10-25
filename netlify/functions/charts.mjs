// Zenkai Media music charts helper.
// Fetches Apple Music's public top charts (no key needed) and passes them on,
// so the app can show what's popular in music. Netlify keeps a copy for a few hours.

const KINDS = new Set(["albums", "songs"]);

export default async (req) => {
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") || "albums";
  const cc = (url.searchParams.get("cc") || "us").toLowerCase().replace(/[^a-z]/g, "").slice(0, 2) || "us";
  if (!KINDS.has(kind)) return new Response(JSON.stringify({ error: "That chart isn't available." }), { status: 400, headers: { "content-type": "application/json" } });
  const r = await fetch(`https://rss.applemarketingtools.com/api/v2/${cc}/music/most-played/50/${kind}.json`, { headers: { Accept: "application/json" } });
  const body = await r.text();
  return new Response(body, {
    status: r.status,
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=1800",
      "netlify-cdn-cache-control": "public, durable, s-maxage=21600, stale-while-revalidate=86400",
      "netlify-vary": "query",
    },
  });
};

export const config = { path: "/api/charts" };
