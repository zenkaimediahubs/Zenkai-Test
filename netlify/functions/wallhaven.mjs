// Zenkai Media wallpapers and fan art from Wallhaven (wallhaven.cc).
// Safe pictures only: purity=100 asks for SFW, no API key is sent (without a key Wallhaven never returns
// anything else), and every result is checked again here before it's passed on.

const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...extra } });

export default async (req) => {
  const u = new URL(req.url);
  const q = (u.searchParams.get("q") || "").replace(/[^\p{L}\p{N} :'!.&-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 80);
  if (q.length < 2) return json({ items: [] });
  const page = String(Math.min(5, Math.max(1, parseInt(u.searchParams.get("page") || "1", 10) || 1)));
  const target = "https://wallhaven.cc/api/v1/search?" + new URLSearchParams({ q, purity: "100", categories: "110", sorting: "relevance", page });
  try {
    const r = await fetch(target, { headers: { Accept: "application/json", "User-Agent": "ZenkaiMedia/1.0 (personal media tracker)" }, signal: AbortSignal.timeout(6000) });
    if (!r.ok) return json({ items: [], error: "Wallhaven isn't answering right now." }, 502);
    const d = await r.json();
    const items = (d.data || []).filter(x => x.purity === "sfw" && /^https:\/\/(w|th)\.wallhaven\.cc\//.test(x.path || "")).slice(0, 24).map(x => ({
      id: x.id, thumb: x.thumbs?.large || x.thumbs?.original || "", full: x.path, page: x.url, res: x.resolution || "", ratio: Number(x.ratio) || 1.6,
    }));
    return json({ items, last: d.meta?.last_page || 1 }, 200, {
      "cache-control": "public, max-age=3600", "netlify-cdn-cache-control": "public, durable, s-maxage=86400, stale-while-revalidate=604800", "netlify-vary": "query",
    });
  } catch (e) { return json({ items: [], error: "Wallhaven isn't answering right now." }, 502); }
};

export const config = { path: "/api/wallhaven" };
