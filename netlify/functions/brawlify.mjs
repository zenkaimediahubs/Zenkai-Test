// Brawl Stars pictures for the Starr Park tribute, from the free Brawlify database (api.brawlify.com, no key).
// Only two lists are passed along: Brawlers (name, picture, class) and environments (name, picture, taken from the maps).
// Answers are kept for a day so Brawlify is asked rarely. Credit: Brawlify. Unofficial, not endorsed by Supercell.
const ok = (obj, age = 86400) => new Response(JSON.stringify(obj), { headers: { "content-type": "application/json", "cache-control": `public, max-age=${age}`, "netlify-cdn-cache-control": `public, durable, s-maxage=${age}` } });
const bad = msg => new Response(JSON.stringify({ error: msg }), { status: 502, headers: { "content-type": "application/json", "cache-control": "no-store", "netlify-cdn-cache-control": "no-store" } });
async function get(path) {
  const r = await fetch(`https://api.brawlify.com/v1/${path}`, { headers: { accept: "application/json", "user-agent": "ZenkaiMedia/1.0 (fan tribute page)" }, signal: AbortSignal.timeout(9000) });
  if (!r.ok) throw new Error("brawlify " + r.status);
  return r.json();
}
export default async (req) => {
  const op = new URL(req.url).searchParams.get("op");
  try {
    if (op === "brawlers") {
      const d = await get("brawlers"), list = Array.isArray(d) ? d : d.list || [];
      return ok({ brawlers: list.map(b => ({ name: b.name, img: b.imageUrl2 || b.imageUrl || b.imageUrl3 || "", imgs: [b.imageUrl2, b.imageUrl, b.imageUrl3].filter(Boolean), cls: b.class?.name || "", rarity: b.rarity?.name || "", color: b.rarity?.color || "", desc: String(b.description || "").slice(0, 220) })).filter(b => b.name) });
    }
    if (op === "environments") {
      const d = await get("maps"), list = Array.isArray(d) ? d : d.list || [], seen = new Map();
      for (const m of list) { const e = m.environment; if (e?.name && !seen.has(e.name)) seen.set(e.name, { name: e.name, img: e.imageUrl || "" }); }
      return ok({ environments: [...seen.values()] });
    }
    return bad("Unknown request");
  } catch (e) { return bad("Brawlify isn't answering right now."); }
};
export const config = { path: "/api/brawlify" };
