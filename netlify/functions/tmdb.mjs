// Zenkai Media search helper.
// It asks TMDB for film and show details using the key saved in Netlify's
// environment variables (TMDB_KEY), so visitors never see the key.
// Only the few kinds of request the app needs are allowed through.

const ALLOWED = new RegExp("^/(" + [
  "configuration",
  "search/(multi|tv|movie|person)",
  "trending/(all|movie|tv)/(day|week)",
  "tv/\\d+(/season/\\d+)?",
  "tv/\\d+/(images|videos|aggregate_credits|external_ids)",
  "movie/\\d+(/(images|videos|credits))?",
  "collection/\\d+",
  "find/tt\\d{5,10}",
  "movie/(upcoming|now_playing|popular|top_rated)",
  "tv/(on_the_air|airing_today|popular|top_rated)",
  "discover/(movie|tv)",
  "person/popular",
  "genre/(movie|tv)/list",
].join("|") + ")$");
const PARAMS = ["query", "page", "language", "region", "include_adult", "append_to_response", "include_image_language",
  "sort_by", "with_genres", "without_genres", "with_original_language", "primary_release_date.gte", "primary_release_date.lte",
  "first_air_date.gte", "first_air_date.lte", "air_date.gte", "air_date.lte", "vote_count.gte", "with_release_type",
  "primary_release_year", "first_air_date_year", "year", "vote_average.gte", "with_keywords", "with_origin_country", "watch_region", "external_source"];

const json = (body, status = 200, extra = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...extra } });

export default async (req) => {
  const url = new URL(req.url);
  const path = url.searchParams.get("p") || "";
  if (!ALLOWED.test(path)) return json({ error: "That request isn't allowed." }, 400);

  const key = (Netlify.env.get("TMDB_KEY") || "").trim();
  if (!key) return json({ error: "The TMDB_KEY setting is missing on Netlify." }, 503, { "cache-control": "no-store", "netlify-cdn-cache-control": "no-store" });

  const target = new URL("https://api.themoviedb.org/3" + path);
  for (const name of PARAMS) {
    const v = url.searchParams.get(name);
    if (v != null) target.searchParams.set(name, v.slice(0, 200));
  }
  const bearer = key.startsWith("eyJ");
  if (!bearer) target.searchParams.set("api_key", key);

  let r;
  try { r = await fetch(target, { headers: bearer ? { Authorization: "Bearer " + key, Accept: "application/json" } : { Accept: "application/json" }, signal: AbortSignal.timeout(8000) }); }
  catch (e) { return json({ error: "TMDB didn't answer in time. Try again in a minute." }, 504, { "cache-control": "no-store" }); }
  const body = await r.text();
  // A rejected key or any other error is never kept in the cache, so fixing the key works straight away
  if (!r.ok) {
    let msg = ""; try { msg = JSON.parse(body).status_message || ""; } catch (e) {}
    const why = r.status === 401 ? `TMDB rejected the key (${key.length} characters long). ${msg}`.trim() : `TMDB answered with error ${r.status}. ${msg}`.trim();
    return json({ error: why }, r.status === 401 ? 502 : r.status, { "cache-control": "no-store", "netlify-cdn-cache-control": "no-store" });
  }
  // Good answers are kept for a day, so repeat searches don't run the helper again
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=600",
      "netlify-cdn-cache-control": "public, durable, s-maxage=86400, stale-while-revalidate=604800",
      "netlify-vary": "query",
    },
  });
};

export const config = { path: "/api/tmdb" };
