# Zenkai Media: setup and handover, step by step

For whoever is taking over the hosting. Written 21 October 2026. The app's version label is **Batch 18**.

The order matters: GitHub first (it holds the code), then Netlify (it publishes the code from GitHub and runs the helpers), then the keys, then a test, then Supabase later.

What you need before you start: an email address you can open, and a password manager for the keys.

---

## Part 1. GitHub: create the account and put the files in

1. Go to github.com and choose **Sign up**. Enter an email, a password and a username, then verify the email.
2. Click the **+** at the top right → **New repository**.
3. Name it (for example `Zenkai-Media`). Choose **Private**. Do not tick "Add a README". Click **Create repository**.
4. On the empty repository page, click **uploading an existing file**.
5. Upload the files from the `zenkai-upload` folder with the same layout:
   - In the main folder: `index.html`, `README.md`, `manifest.webmanifest`, `sw.js`, `icon-192.png`, `icon-512.png`, `icon-maskable.png`.
   - In `vendor/`: `unrar.js`, `unrar.wasm`, `node-unrar-js-LICENSE.md` and `README.md` (used to convert CBR comics).
   - In `netlify/functions/`: every `.mjs` file (`archive`, `audiosilo`, `brawlify`, `calendar`, `charts`, `comicvine`, `fanart`, `gbooks`, `gutenberg`, `img`, `librivox`, `mangadex`, `ost`, `tmdb`, `wallhaven`, `where`, `wiki`, `youtube`).
   - In `docs/`: `discovery-plan.md` and `SETUP-AND-HANDOVER.md`.
   - Dragging a whole folder into the upload page keeps its folder name. If only some files are in the zip you were sent, upload the older files from the current repository too, because the helpers that did not change this round still need to be there.
6. At the bottom, write a message such as "Zenkai Media, Batch 15" and click **Commit changes**.
7. To give someone else access: repository **Settings → Collaborators → Add people** (write access).

Rules for GitHub: never upload a key, a `.env` file or a password. Old files named `index-v…-backup.html` are not used by the app and don't need uploading.

---

## Part 2. Netlify: create the account and publish the site

1. Go to netlify.com and choose **Sign up**. Choose **Sign up with GitHub**, so Netlify can read the repository.
2. **Add new project → Import an existing project → GitHub.** Allow Netlify to access the repository and pick it.
3. On the settings screen:
   - Branch to deploy: `main`.
   - Build command: leave empty.
   - Publish directory: leave empty (or `.` if Netlify asks for something).
   - Netlify finds the helpers in `netlify/functions/` by itself. Each file becomes an address: `where.mjs` becomes `/api/where`, `tmdb.mjs` becomes `/api/tmdb`, and so on.
4. Click **Deploy**. The first deploy will work, but films and shows won't load until the keys are added (Part 3).
5. Under **Site configuration → Change site name** pick the address you want, for example `zenkaimedia.netlify.app`.
6. Every later change you commit to GitHub deploys automatically. Check the **Deploys** page after each change. A red deploy is usually a typing mistake in a function file.
7. **Check the cost first.** The earlier account used up its credits quickly. Open **Billing / Usage** and look at which part uses the most (functions, bandwidth or builds), and check whether usage alerts or limits can be set. Plans and prices change, so read the current Netlify pricing page before relying on the free allowance.

---

## Part 3. The keys: where to get each one and where to put it

Put each key in **Netlify → Project configuration → Environment variables → Add a variable**, using the exact name below. After adding or changing a key, go to **Deploys → Trigger deploy** so the helpers pick it up.

### TMDB (required): `TMDB_KEY`
Used for films, shows, episodes and where to watch.
1. Go to themoviedb.org and create a free account. Verify the email.
2. Click your profile picture → **Settings → API**.
3. Click **Request an API key** → choose **Developer**. Accept the terms.
4. Fill in the form. Application name: Zenkai Media. Application URL: your Netlify address. Summary: a free personal tracker for films, shows, anime and books. Type: personal use.
5. Copy the **API Key (v3 auth)**, the short one. Don't use the long "API Read Access Token".
6. Put it in Netlify as `TMDB_KEY`. Choose **Same value for all deploy contexts**. The short v3 key and the long Read Access Token (starts with eyJ) both work.

TMDB asks for credit. The app already shows "TMDB" and "JustWatch" notices. Keep them.

### Google, for YouTube (optional): `YOUTUBE_KEY`
Used for YouTube rows, search and checking that a trailer plays in a country.
1. Go to console.cloud.google.com and sign in with a Google account.
2. Click the project picker at the top → **New project** → name it Zenkai Media → **Create**.
3. Open **APIs & Services → Library**, search for **YouTube Data API v3**, and click **Enable**.
4. Go to **APIs & Services → Credentials → Create credentials → API key**.
5. Click **Edit API key**. Under "API restrictions" choose **Restrict key** and select only **YouTube Data API v3**. Save.
6. Copy the key and put it in Netlify as `YOUTUBE_KEY`.

There is a daily quota (Google shows it under the API's Quotas tab). If YouTube rows stop loading late in the day, the quota is the likely reason.

### fanart.tv (optional): `FANART_KEY`
Used for banners and clear logos.
1. Go to fanart.tv and create an account.
2. Open your account page and copy your personal **API key**.
3. Put it in Netlify as `FANART_KEY`.

### Comic Vine (optional): `COMICVINE_KEY`
Used for comic issues, series and creators.
1. Go to comicvine.gamespot.com/api and sign up or log in.
2. Copy the API key shown on that page.
3. Put it in Netlify as `COMICVINE_KEY`. It is limited to a few hundred requests an hour.

### No key needed
AniList (anime and manga data), Jikan and Kitsu (anime, used as backups), Cinemeta (films and series, used as a backup), Audiosilo (audiobook narrators), LRCLIB (lyrics), MangaDex, Open Library, Internet Archive, Project Gutenberg, Apple Music search, LibriVox, MangaBaka, AnimeThemes, Odesli, Wallhaven and Fandom wikis. There is nothing to sign up for. AnimeKai and similar sites are unofficial streaming sites and are not used in this app.

### Key safety
- A key goes only in Netlify's environment variables. Never in `index.html`, the README, a commit, a chat or a screenshot.
- If a key has ever been shared in any of those places, make a new one in the provider's dashboard and delete the old one.

---

## Part 4. Check that it works

After the first deploy with the keys added, open these in a browser (replace the address with yours). Each should show text starting with `{`, not an error page:

1. `/api/where?op=read&title=Absolute%20Sword%20Sense`
2. `/api/librivox?title=Frankenstein`
3. `/api/ost?kind=anime&title=One%20Piece`

Then open the site and check:
1. Search for a film. Open it and look for Where to watch.
2. Search for an anime. Look for Where to watch, and Openings and endings.
3. Search for a manga. Look for Where to read.
4. Type in the search box. A keyboard click plays (Settings → Sound → Keyboard clicks while you type turns it off).
5. Settings → About and credits says **Batch 18**.
6. Open Your files (sidebar, or the link on the Library page), add a CBZ or EPUB, and check it opens. Then add a CBR comic and a MOBI book: they should say "Converted from CBR" and "Converted from MOBI".

Several services have not been tested against their live answers from the development environment: MangaBaka, AnimeThemes, Odesli, Jikan, Kitsu, Cinemeta and Audiosilo. If checks 1 to 3 on the lists above show an error, open the helper's log in Netlify (**Logs → Functions**) and send it with a screenshot. Also read each service's terms and rate limits yourself before a wider launch.

---

## Part 5. Supabase (accounts, friends, shared records)

This is the next stage and is not built yet. What it should give: accounts, a shelf synced between devices, friends and shared suggestions, a weekly "who watched the most" board, and one shared, checked list of where to read and watch.

1. Go to supabase.com and **Sign up** (you can use the GitHub account).
2. **New project.** Pick an organisation, a name (Zenkai Media), a strong database password (save it in the password manager), and a region close to the users. Wait for it to finish.
3. Open **Project Settings → API** (or "API Keys"). You will see:
   - **Project URL**: safe to use in the browser.
   - **anon / publishable key**: safe in the browser **only if every table has row-level security (RLS) rules**.
   - **service_role / secret key**: has full access and skips RLS. It goes only in Netlify as `SUPABASE_SERVICE_KEY`, used by helpers, never in `index.html` and never in a chat.
4. **Authentication → Providers**: turn on Email. For a site where anyone with the link can join, also:
   - Under **URL Configuration**, set the Site URL to the Netlify address.
   - Set up a custom email sender (SMTP). Supabase's built-in sender is limited to very few emails per hour, which is not enough for open sign-up.
   - Turn on CAPTCHA protection and check the rate limits, so bots can't fill the sign-up form.
5. Create the tables in **SQL Editor** and switch RLS **on for every table**, with a policy for each one. A small example to start from (review it before using it):

```sql
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null check (char_length(name) <= 40),
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "anyone signed in can read names" on profiles for select to authenticated using (true);
create policy "you edit only your own profile" on profiles for update to authenticated using (auth.uid() = id);
create policy "you create only your own profile" on profiles for insert to authenticated with check (auth.uid() = id);
```

6. Add the Project URL and the anon key to the app (a small settings block near the top of `index.html`, or two Netlify variables a helper hands out). The next batch will build the sign-in screen, friends and the shared board.

Rules for sharing between friends: a person's shelf is private by default. Suggestions and the feed are readable only by the people the owner chose. Write the RLS policy for each of these before any screen uses the table.

Data note: today everything lives in each person's browser. Before accounts exist, people should make a backup in Settings → Your data, so they can move their shelf across.

---

## Rules the app keeps (please keep them)

- Official and legal sources only. No pirate or unofficial streaming servers, no paywall, CAPTCHA or anti-bot bypassing, no scraping of protected pages, no rehosting of copyrighted media.
- Availability is shown only for the country it was checked for. Other countries' results are never presented as Mauritian, and unconfirmed information is labelled as such.
- No adult-content sources.
- Attribution stays: TMDB and JustWatch, and the links to AniList, MangaBaka, AnimeThemes and the other sources.
