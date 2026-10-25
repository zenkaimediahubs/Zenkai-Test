// Zenkai Media comics helper: new issues, search, and details from Comic Vine.
// Uses the COMICVINE_KEY saved in Netlify's environment variables (a free key from comicvine.gamespot.com/api).
// Comic Vine's terms: non-commercial use, link back to Comic Vine, about 200 requests per hour,
// so Netlify keeps copies of every answer.

const UA = "ZenkaiMedia/1.0 (free personal media tracker; https://zenkaimedia.netlify.app)";
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const ISSUE = "id,name,issue_number,volume,image,cover_date,store_date,deck";
const VOLUME = "id,name,start_year,publisher,image,count_of_issues,deck";
const ymd = d => d.toISOString().slice(0, 10);

export default async (req) => {
  const key = (Netlify.env.get("COMICVINE_KEY") || "").trim();
  if (!key) return json({ error: "nokey" }, 503);
  const u = new URL(req.url), op = u.searchParams.get("op") || "new";
  const page = Math.max(1, Math.min(50, parseInt(u.searchParams.get("page") || "1", 10) || 1));
  let path, params = {}, secs = 21600;

  if (op === "new") {
    const end = new Date(), start = new Date(Date.now() - 21 * 864e5);
    path = "issues/";
    params = { sort: "store_date:desc", filter: `store_date:${ymd(start)}|${ymd(end)}`, limit: "24", offset: String((page - 1) * 24), field_list: ISSUE };
  } else if (op === "search") {
    const q = (u.searchParams.get("q") || "").slice(0, 80).trim();
    if (!q) return json({ results: [] });
    path = "search/";
    params = { query: q, resources: "volume,issue", limit: "12", field_list: ISSUE + ",resource_type,start_year,publisher,count_of_issues" };
    secs = 86400;
  } else if (op === "issue" || op === "volume") {
    const id = (u.searchParams.get("id") || "").replace(/\D/g, "").slice(0, 9);
    if (!id) return json({ error: "Missing id" }, 400);
    path = op === "issue" ? `issue/4000-${id}/` : `volume/4050-${id}/`;
    params = { field_list: op === "issue" ? ISSUE + ",description,character_credits,person_credits" : VOLUME + ",description,issues,character_credits,person_credits" };
    secs = 604800;
  } else return json({ error: "Unknown request" }, 400);

  const target = new URL("https://comicvine.gamespot.com/api/" + path);
  target.searchParams.set("api_key", key);
  target.searchParams.set("format", "json");
  for (const [k, v] of Object.entries(params)) target.searchParams.set(k, v);
  try {
    const r = await fetch(target, { headers: { "User-Agent": UA, Accept: "application/json" } });
    const body = await r.text();
    return new Response(body, {
      status: r.ok ? 200 : r.status,
      headers: {
        "content-type": "application/json",
        "cache-control": "public, max-age=1800",
        ...(r.ok ? { "netlify-cdn-cache-control": `public, durable, s-maxage=${secs}, stale-while-revalidate=${secs}`, "netlify-vary": "query" } : {}),
      },
    });
  } catch (e) {
    return json({ error: "Comic Vine isn't reachable." }, 502);
  }
};

export const config = { path: "/api/comicvine" };
