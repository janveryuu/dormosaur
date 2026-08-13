# Hosting notes (FramerExporter static export)

Your ZIP is **fully static** HTML, CSS, JS, images, and binary assets — including
`.framercms` files that Framer already downloaded at export time. Nothing calls Framer
or a CMS API in production.

Framer's runtime may request those local files with `?range=…` query parameters.
Every HTML page includes a small inline script (`framexporter-framercms-shim`) that
handles that in the browser so **any static HTTP server** works (Netlify, Cloudflare
Pages, Vercel, GitHub Pages, FTP, cPanel, etc.).

Also included:

- `_headers` — MIME types for `.mjs`, `.framercms`, `.lottie` (Netlify and Cloudflare Pages)
- `_redirects` — placeholder only; nested folders already serve clean URLs (`journey/index.html` → `/journey/`)
- `vercel.json` — Vercel MIME headers
- `.htaccess` — Apache / cPanel / Hostinger MIME types

Deploy the site at the **domain root** (`index.html` at the publish root). Subpath deploys
(e.g. `username.github.io/repo/`) are not the optimized case for this export layout.

## Static site vs opening files from disk

| How you open the export | What works |
|-------------------------|------------|
| **Published on HTTP/HTTPS** (Netlify, Cloudflare Pages, Vercel, `npx serve`, FramerExporter preview) | Full site: routes, Lottie, search, CMS snapshot |
| **Double-click `index.html` (`file://`)** | Partial: homepage and assets often load; **Lottie and ES modules usually fail**; internal links need the file-protocol shim (included) |

“Static site” in production means **files served over HTTP**, not PHP or a database — not
“opened directly from Finder/Explorer.” Browsers restrict `file://` for security (especially
`type="module"` scripts such as Framer bundles and `dotlottie-player`).

### Test locally before deploy

From the unzipped folder:

```bash
npx serve .
# or: python3 -m http.server 8080
```

Then open `http://localhost:3000` (or `:8080`). Routes like `/journey/` or `/projects/mar`
match `journey/index.html` / `projects/mar/index.html` on disk. Opening a subpage directly
(and hard-refreshing) should keep the URL and load images from `/images/…`.

### Cloudflare Pages

1. Unzip the export (or push the unzipped folder to Git).
2. In Cloudflare Pages: create a project → upload assets **or** connect Git.
3. Build command: leave empty. Output / publish directory: folder that contains `index.html`.
4. Deploy. `_headers` is picked up automatically for MIME types.

### If you must use `file://`

- Prefer opening each page file directly, e.g. `projects/mar/index.html`, for that screen only.
- A small script (`framexporter-file-protocol-shim`) helps **in-app links** map routes to
  the correct relative HTML when you start from `index.html`.
- **Lottie (`.lottie`)** still requires HTTP — the player is an ES module the browser
  blocks on `file://`. Use Netlify / Cloudflare Pages / preview / `npx serve` to verify animations.

## Production

Serve over **HTTPS** (or HTTP on localhost), not `file://`.
