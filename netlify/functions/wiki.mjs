// Zenkai Media fan wiki helper.
// Big shows have fan wikis on Fandom (onepiece.fandom.com, naruto.fandom.com and so on), written by fans.
// This finds the wiki for a title, and the opening of a page on it (a character, say), as plain text.
// Only *.fandom.com is ever asked, through its public MediaWiki API.

const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...extra } });
const CACHE = { "cache-control": "public, max-age=86400", "netlify-cdn-cache-control": "public, durable, s-maxage=604800, stale-while-revalidate=604800", "netlify-vary": "query" };
const UA = { "User-Agent": "ZenkaiMedia/1.0 (personal media tracker)", Accept: "application/json" };
const SLUG = /^[a-z0-9][a-z0-9-]{1,40}$/;
const api = async (slug, params) => {
  const r = await fetch(`https://${slug}.fandom.com/api.php?` + new URLSearchParams({ format: "json", ...params }), { headers: UA, redirect: "manual", signal: AbortSignal.timeout(5000) });
  if (r.status !== 200) return null;
  try { return await r.json(); } catch (e) { return null; }
};
const decode = s => s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");

function candidates(title) {
  const t = title.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[:(].*$/, "").replace(/^the /, "").trim();
  const words = t.replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter(Boolean);
  const out = [words.join(""), words.join("-"), words.filter(w => !/^(no|of|the|a|wa|to|and)$/.test(w)).join(""), words.length >= 3 ? words.slice(0, 2).join("") : ""];
  return [...new Set(out.filter(s => s && SLUG.test(s)))].slice(0, 5);
}

export default async (req) => {
  const u = new URL(req.url), op = u.searchParams.get("op");
  if (op === "find") {
    const title = (u.searchParams.get("title") || "").slice(0, 100).trim();
    if (title.length < 2) return json({ wiki: null });
    for (const slug of candidates(title)) {
      const d = await api(slug, { action: "query", meta: "siteinfo", siprop: "general" });
      const g = d?.query?.general;
      // The wiki's name has to share a real word with the title, so "Moving" never lands on an unrelated wiki
      const name = (g?.sitename || "").toLowerCase(), words = title.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length >= 4);
      if (g?.sitename && (words.some(w => name.includes(w)) || name.replace(/[^a-z0-9]/g, "").includes(slug.replace(/-/g, "")))) return json({ wiki: slug, name: g.sitename, url: `https://${slug}.fandom.com/wiki/`, main: g.mainpage ? `https://${slug}.fandom.com/wiki/${encodeURIComponent(g.mainpage.replace(/ /g, "_"))}` : `https://${slug}.fandom.com/` }, 200, CACHE);
    }
    return json({ wiki: null }, 200, CACHE);
  }
  if (op === "page") {
    const slug = (u.searchParams.get("wiki") || "").toLowerCase(), q = (u.searchParams.get("q") || "").slice(0, 100).trim();
    if (!SLUG.test(slug) || q.length < 2) return json({ error: "That request isn't allowed." }, 400);
    const s = await api(slug, { action: "query", list: "search", srsearch: q, srlimit: "3", srnamespace: "0" });
    const hit = s?.query?.search?.[0];
    if (!hit) return json({ found: false }, 200, CACHE);
    const p = await api(slug, { action: "parse", page: hit.title, prop: "text", section: "0", redirects: "1", disablelimitreport: "1", disableeditsection: "1" });
    let html = p?.parse?.text?.["*"] || "";
    const imgM = /<aside[^>]*portable-infobox[\s\S]*?<img[^>]+(?:data-src|src)="(https:\/\/static\.wikia\.nocookie\.net\/[^"]+)"/.exec(html);
    html = html.replace(/<aside[\s\S]*?<\/aside>/g, "").replace(/<table[\s\S]*?<\/table>/g, "").replace(/<sup[\s\S]*?<\/sup>/g, "").replace(/<style[\s\S]*?<\/style>/g, "");
    const paras = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map(m => decode(m[1].replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim()).filter(t => t.length > 40);
    let text = ""; for (const t of paras) { if ((text + " " + t).length > 900) break; text = text ? text + "\n\n" + t : t; }
    if (!text && paras[0]) text = paras[0].slice(0, 900) + "…";
    const title = p?.parse?.title || hit.title;
    return json({ found: true, title, text, image: imgM ? imgM[1].replace(/\/revision\/latest\/scale-to-width-down\/\d+/, "/revision/latest/scale-to-width-down/400") : "", url: `https://${slug}.fandom.com/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}` }, 200, CACHE);
  }
  return json({ error: "That request isn't allowed." }, 400);
};

export const config = { path: "/api/wiki" };
