# Zenkai Media: what's done and what's left (after Batch 22, 25 October 2026)

The word-for-word list of what Ray asked for, with a status on every item, is `docs/REQUESTS-LEDGER.md`. Check against that, not against this summary.

## Done in Batches 18 to 22
- Phone: every Home section folds; calendar swipes; Lists, Types and Hints as glass rectangles.
- Music player modes (Player, Lyrics, Video, Mini), sounds per kind, Google Books, book finder, Your links, screenshot reader, cards growing into pages, related titles as a map, Starr Park and One Piece and Runeterra tribute maps with storybook galleries.
- Batch 21: gift editor (drag, turn, resize, copy stickers; text boxes; pen and signature; Cover / First page / Whole book preview; Brawl Stars stickers with Supercell's notice) and Year in review (story cards, day grid, extra stats).
- Batch 22: living themes (Starry, Gloss with a light mode, Marquee drive-in, Sunset beach with sunrise, Sakura wind, Library, Washi, Matcha), theater player for your videos, YouTube categories and Live now, list opening with covers circling the name.

## Still to do
1. Starr Park skins per land: the Supercell fan kit can't be reached from Claude's workspace; the domains fankit.supercell.com and cdn-assets-eu.frontify.com have to be allowed (Settings → Capabilities), or skins can be uploaded in small zips.
2. Glass look tuned for every theme, springy sliders and menus (partly there).
3. Full audit of every earlier message against the app, adding anything missing to the ledger.
4. Check on the phone after deploying: TMDB, Google Books (`/api/gbooks?op=status`), YouTube live (`/api/youtube?op=live`), the theater player with a real video, the theme scenes on a real phone for speed.

## Things the app deliberately doesn't do
- No pirate or unofficial reading or download sites, and it doesn't search them.
- It doesn't open pasted links on the server; it only reads the address.
- It doesn't draw known characters; tribute maps and theme scenes use original drawings.
