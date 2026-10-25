# Zenkai Media: where to read, watch and listen

Written 20 October 2026. This covers the audit of what Zenkai already does, what each suggested project and API was found to do, what was built this round, and what's still unverified.

## 1. What already exists (audit)

Zenkai is one `index.html` (vanilla JavaScript, no build step) plus small Netlify helpers in `netlify/functions/`. Everything a person saves lives in their own browser (localStorage, and IndexedDB for their music files). There's no shared database yet.

| Area | Already working | Source |
| --- | --- | --- |
| Films, shows, dramas, documentaries | Details, cast, seasons, episodes, trailers, related works, **Where to watch** by country with stream / rent / buy / free / adverts | TMDB (watch data powered by JustWatch) |
| Anime, manga, manhwa, manhua, light novels | Details, characters, relations (sequel, adaptation, spin-off), airing times | AniList |
| Manga chapters | Chapter lists, with official links when MangaDex has them | MangaDex |
| Comics | New issues, series, creators; public-domain Golden Age comics readable in the app | Comic Vine; Internet Archive |
| Books | Details, free reading of public-domain books, free LibriVox audiobooks | Open Library, Project Gutenberg, LibriVox |
| Music | Albums, songs, artists, 30-second previews, lyrics, charts, openings/soundtracks box | Apple Music (iTunes Search), LRCLIB |
| YouTube | Search, trending, channels, a TV-style page, trailers that check country blocks | YouTube Data API |

Search already spans all of these at once and labels each result with its type.

Mauritius: TMDB returns no streaming services for Mauritius for most titles, so Zenkai shows France's options and **says so** instead of presenting them as Mauritian availability.

## 2. Candidate projects (checked by cloning the code, 20 October 2026)

| Project | What it actually is | Licence | Last commit | Reusable here? |
| --- | --- | --- | --- | --- |
| davidcralph/mangapages | Website plus crawlers that read 16 official sites' catalogues (MANGA Plus, VIZ, Azuki, BookWalker, J-Novel Club, Toomics and others) into a database, UK region only | MIT | Jan 2023 | The idea and its site list, yes. The crawlers are 3 years old and likely broken; running crawlers needs a server and a database. Superseded by MangaBaka below |
| techmengg/shujia | Full Next.js + Postgres manga tracker using the MangaUpdates and **MangaBaka** APIs | AGPL-3.0 | May 2026 | Code no (AGPL, different stack). It pointed to MangaBaka, which turned out to be the best source for "where to read" |
| mxbn-mubeen/manwha-tracker | Personal tracker that watches Telegram channels and scrapes unofficial scan sites, using FlareSolverr to get past Cloudflare | none | Oct 2026 | No. Unofficial sources and anti-bot bypassing |
| diogovalentte/mantium | Go dashboard tracking manga across MANGA Plus, MangaDex, MangaUpdates and several unofficial raw sites | MIT | Oct 2026 | Only the idea of MangaUpdates release checks. Several sources are unofficial |
| t2vi/arrgh | Self-hosted comics/novel library server with plugins for sites such as novelfull | GPL-3.0 | Oct 2026 | No. Self-hosted downloader, unofficial sources |
| bengraf9/Movie-Show-Watchlist | A Python script and GitHub Pages site using the Streaming Availability API (RapidAPI) | none | Oct 2026 | No code (no licence). Its API is an option if TMDB's data isn't enough, but it's paid beyond a small free tier |
| MllGll/where-to-watch | Next.js app using the Watchmode API | MIT | May 2026 | Watchmode is an alternative to TMDB watch data (free tier around 1,000 calls a month). Not needed now |
| ericg1840/movie-tv-tracker | Vite + Supabase tracker using TMDB and OMDb | none | Aug 2026 | No code. A useful example of Supabase for accounts later |
| Shiranuit/Cinetrack | Rust server + Flutter app using TheTVDB | Apache-2.0 | Aug 2026 | No; different stack, TheTVDB needs a paid key |
| CristaudoGiuseppe/tvtracker | Next.js + Drizzle tracker using TMDB | none | Jul 2026 | No code (no licence). Same data as Zenkai already has |
| kingoftheseas56/Colosseum | Qt/C++ desktop app for manga, comics, books, audiobooks, films and local files | MIT | Oct 2026 | Ideas only, rebuilt for the web in Batch 12: the book page, reader themes and typography, comic reader, manga volume view, cinematic loader, and Your files (its Vault). Its LibGen, AudioBookBay, Nyaa, GetComics and torrent sources are not used |
| DanielChahine0/comicverse-api | Could not be cloned (private, renamed or deleted) | unknown | unknown | Not verified |
| Seerr, Sonarr, Radarr, Jellyfin | Self-hosted request page, download managers and media server | GPL-3.0 / active | active | Removed from Zenkai. A Jellyfin sign-in and Seerr links were added earlier and later taken out; the download tools were never connected, because their API keys give full control of a server |

Not cloned because they're websites, not code: Manga Atlas, FindManhwa, MangaUpdates, Where Can I Read Manga. Their data can only be used through an official API, and only MangaUpdates has one.

## 3. APIs and data sources

| Source | Used for | Key | Status |
| --- | --- | --- | --- |
| **MangaBaka** (api.mangabaka.dev) | Official links per series, typed as publisher / reading site / shop / info / piracy, with its own link-check date and HTTP status. Looks up by AniList id | No | Added. Spec read from its OpenAPI file. **Terms and rate limits not found online; must be checked on the live site** |
| **AnimeThemes** (api.animethemes.moe) | Openings and endings for an exact anime, with song title, artists and episodes | No | Added. Only song facts are used, not their video clips. **Rate limit and request format need live confirmation** |
| **Odesli / song.link** | One Apple Music link becomes Spotify, YouTube Music, Deezer, Tidal and other links | No (about 10 requests a minute without a key) | Added, cached for two weeks per song |
| TMDB watch providers | Where to watch films and shows, per country | Yes, already set | Already in use. Must show "JustWatch" attribution, which Zenkai does |
| AniList externalLinks | Official streaming links for anime | No | Added as **Where to watch** on anime pages |
| MusicBrainz | Recordings vs releases, artist relations | No (needs a proper User-Agent, 1 request a second) | Not added yet. Useful later to separate a song from its versions |
| Spotify Web API | Track links | Needs an app; new apps have limited access | Not added. Odesli already gives Spotify links |
| Deezer API | Search, 30-second previews | No | Not added. Odesli covers its links |
| MyAnimeList API | Anime/manga data | Needs a client id | Not needed; AniList covers the same |
| TVmaze | TV schedules, networks | No (CC BY-SA) | Not added. TMDB already covers dramas; could add broadcaster schedules later |
| Marvel Developer API | Marvel's catalogue | Needs a key | Not added. Its status wasn't confirmed this round (an earlier check suggested it was retired). Zenkai links straight to Marvel's own free-issues list instead |
| Comic Vine | Comics metadata | Yes, already set | Already in use |
| Website traffic (Similarweb and others) | Optional source directory | Paid | Not added. No reliable free provider; left out rather than showing guessed numbers |

## 4. Built this round

- **Where to read** on every manga, manhwa, manhua and light novel page: official reading sites first, then publishers, shops and information pages. Each row shows its language, an access label and when the link was last checked. Links MangaBaka marks as piracy are removed in the helper and never reach the browser. If there's no exact series match, it says so instead of guessing from a similar name.
- **Access labels** are deliberately careful: "Some chapters free" for sites like MANGA Plus and Webtoon, "Buy" for shops, "Information only", and "Access not confirmed" whenever no source says. Nothing is labelled fully "Free" without a source saying so.
- **Where to watch** on anime pages, from AniList's official streaming links.
- **Openings and endings** on anime pages (OP1, ED1…), with singers and episodes. Tapping one finds that exact song on Apple Music by title and singer. If there's no clear match, it opens a YouTube search instead of picking a wrong song.
- **Song pages link back** to the anime they're a theme of ("Theme song of One Piece, Opening 1, from AnimeThemes") and show **Where to listen** on other apps.
- **Marvel's free issues**: an official link in the Superheroes tab.
- Earlier batches already added Where to watch with country fallback, documentary and sports sections, the openings box, LibriVox and the trailer checks.

## 5. Tested

- The new helper with stubbed answers: piracy and social links are dropped, merged series ids are followed, only an exact title match is accepted, only Apple Music links are accepted, unknown requests are refused.
- The pages in a real browser at phone and computer sizes: Where to read, openings and endings, opening a theme, the song page linking back, the Marvel link, no sideways scrolling, no errors.
- All earlier automatic checks still pass.

**Not tested against the real services**, because they're blocked from the development workspace: MangaBaka, AnimeThemes and Odesli answers, AniList's live links. These need checking on the live site once Netlify deploys again.

## 6. Not done yet, and why

- **A shared catalogue with stored availability records, check history and a source directory.** Each person's data lives in their own browser today, so stored "last checked" history across everyone needs a shared database. That fits with Supabase, below.
- **Link checking by Zenkai itself.** MangaBaka's own check dates are shown. Zenkai checking links on a schedule needs a scheduled job and a database.
- **Website traffic figures.** Left out: no trustworthy free source.
- **Podcasts and games.** Possible later (for example the Podcast Index API, which needs a free key).

## 7. Next step: Supabase

Supabase is a hosted database with sign-in built in, and it has a free tier. It would give Zenkai:

- Accounts, with your shelf synced between phone and laptop.
- Friends, a shared feed ("Ray finished Frieren"), suggestions sent to each other, and weekly "who watched the most" boards.
- A shared catalogue for where-to-read/watch records, so link checks and their history are stored once for everyone.

What it needs from you: a free Supabase project, plus two values added to Netlify. Its public key is safe in the browser only when every table has row-level security rules, which would be part of that batch.
