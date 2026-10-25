# Zenkai Media: keys and environment variables

Written 25 October 2026 (Batch 19) by reading the code in `netlify/functions/`. No key values appear here and none should ever be pasted into chat, code or GitHub.

## Variables the code actually reads

| Integration | Netlify function | Exact variable name | How the key is sent | Without it |
|---|---|---|---|---|
| TMDB (films, shows, episode pictures) | `tmdb.mjs`, `calendar.mjs` | `TMDB_KEY` | v3 key → `api_key=` in the address. v4 "Read Access Token" (starts `eyJ`) → `Authorization: Bearer` header. Both work. | Films and shows come from the backup catalogues (Cinemeta, AniList, Jikan) |
| YouTube Data API v3 | `youtube.mjs` | `YOUTUBE_KEY` | `key=` in the address | YouTube search, channels and trailer checks are off |
| Google Books | `gbooks.mjs` | `GOOGLE_BOOKS_KEY` (also accepted: `GOOGLE_BOOKS_API_KEY`, `GOOGLE_API_KEY`, `BOOKS_API_KEY`, `GBOOKS_KEY`; the first one found is used) | `key=` in the address | Still works, with Google's lower keyless daily limit |
| fanart.tv (logos, banners) | `fanart.mjs` | `FANART_KEY` | `api_key=` in the address | No logos or banners from fanart.tv |
| Comic Vine (comics) | `comicvine.mjs` | `COMICVINE_KEY` | `api_key=` in the address | New comic issues are off |
| Brawlify (Starr Park pictures) | `brawlify.mjs` | none | — | — |
| AniList, Jikan, Kitsu, Cinemeta, Open Library, Gutenberg, MangaDex, Apple Music, LRCLIB, Wikidata, Internet Archive, LibriVox, Wallhaven, AnimeThemes | various, or straight from the app | none | — | — |

**Not used:** the official Brawl Stars API key. That key only works from the IP addresses you list when you make it, and Netlify's servers don't have fixed addresses, so it can't be used from Netlify. You can delete it from Netlify if you like; nothing reads it.

## Which deploy contexts need them

Netlify can give a variable a different value per context. Zenkai Media only needs one value per key:

| Context | Needed? | Why |
|---|---|---|
| Production | **Yes** | This is your real site. |
| Deploy Previews | Only if you test pull requests | They're separate copies built from pull requests. Without the keys they fall back to the backup catalogues. |
| Branch deploys | Only if you deploy other branches | Same as previews. |
| Local development (Netlify CLI) | Only if you run `netlify dev` on a computer | The CLI can pull the values from Netlify for you. |
| Agent runners / build | **No** | The keys are only read when a function runs, never during the build. |

Simplest setup: for each key, choose **"Same value for all deploy contexts"**, and set its **Scopes** to include **Functions**. A key whose scope is only "Builds" is invisible to the functions.

After adding or changing a variable, **trigger a new deploy** (Deploys → Trigger deploy → Deploy site). Running functions only see the new value after a deploy.

## Common mistakes found so far

- **Name typed differently** (this was the TMDB problem): the name must match the table exactly, in capitals, with no spaces before or after. `TMDB_KEY` works; `TMDB KEY`, `tmdb_key` and `TMDB_API_KEY` don't.
- **A space or line break pasted with the value.** The functions trim spaces, but check the value has no quotes around it.
- **The masked value copied back in.** Netlify shows keys as dots or with only the last few characters. Copying that display doesn't copy the key. Paste the real value from the provider's website.
- **Only the Builds scope ticked.** Functions need the Functions scope.
- **No new deploy after the change.**

## Checking each one safely (after a deploy)

Open these on your site (replace `yoursite` with your Netlify address). They never show the key.

| Check | Address | Good answer |
|---|---|---|
| TMDB | `/api/tmdb?p=/configuration` | JSON starting with `{"images":` |
| TMDB key rejected | same | `TMDB rejected the key (N characters long)` → the value is wrong: a v3 key is 32 characters; a v4 token is much longer and starts `eyJ` |
| TMDB key missing | same | `nokey` → the name is wrong, the scope is wrong, or there was no new deploy |
| YouTube | `/api/youtube?op=check&id=dQw4w9WgXcQ` | JSON with `"items"` |
| Google Books | `/api/gbooks?op=status` | `{"key":"GOOGLE_BOOKS_KEY",...}` names the variable it found, or `null` if none (still works without one) |
| Google Books search | `/api/gbooks?op=search&q=isbn:9780316769488` | JSON with `"items"` |
| Comic Vine | `/api/comicvine?op=search&q=batman` | JSON with `"results"` |
| fanart.tv | `/api/fanart?type=tv&id=81189` | JSON with logos, or `nokey` |
| Brawlify | `/api/brawlify?op=brawlers` | JSON with `"brawlers"` |

## Status as of this batch

| Integration | Code checked | Tested here | Working on your site |
|---|---|---|---|
| TMDB | Yes: path allowlist, both key types, errors not cached, IMDb lookup (`/find`) added in Batch 19 | With mocked answers | You reported it working after fixing the variable name |
| YouTube | Yes, unchanged | With mocked answers | You reported search working |
| Google Books | Yes, new in Batch 18/19 | With mocked answers | Not confirmed yet: open `/api/gbooks?op=status` |
| Comic Vine | Yes, unchanged | With mocked answers | Not confirmed |
| fanart.tv | Yes, unchanged | With mocked answers | Not confirmed |
| Brawlify | Yes | With mocked answers | Not confirmed |

"Tested here" means the app's automated tests in a browser with made-up answers in place of the real services, because this workspace can't reach them. Only opening the addresses above on your site proves a key works.
