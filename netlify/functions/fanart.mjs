// Zenkai Media fanart.tv helper: banners, clear logos and clear art for films and shows.
// Uses the FANART_KEY saved in Netlify's environment variables.

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export default async (req) => {
  const key = (Netlify.env.get("FANART_KEY") || "").trim();
  if (!key) return json({ error: "nokey" }, 503);
  const u = new URL(req.url);
  const type = u.searchParams.get("type") === "tv" ? "tv" : "movies";
  const id = (u.searchParams.get("id") || "").replace(/[^\w-]/g, "").slice(0, 20);
  if (!id) return json({ error: "Missing id" }, 400);
  const r = await fetch(`https://webservice.fanart.tv/v3/${type}/${id}?api_key=${encodeURIComponent(key)}`, { headers: { Accept: "application/json" } });
  const body = r.status === 404 ? "{}" : await r.text();
  return new Response(body, {
    status: r.status === 404 ? 200 : r.status,
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=3600",
      "netlify-cdn-cache-control": "public, durable, s-maxage=604800, stale-while-revalidate=604800",
      "netlify-vary": "query",
    },
  });
};

export const config = { path: "/api/fanart" };
