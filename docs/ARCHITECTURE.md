# Architecture & storage (git-blog-editor)

## Two different “surfaces”

| Surface | What it is | In this repo |
|--------|------------|----------------|
| **Editor** | Tool for the author to write posts, upload media, publish JSON to GitHub. | `client/` (React). Runs as a **static** app on **GitHub Pages** (or locally via `npm start` in `client/`). Browser talks to GitHub API with a user-provided PAT. |
| **Published blog** | Static site on GitHub Pages: list + post detail. | **`client/public/templates/`** (and legacy `server/templates/`) → synced to the **blog repo** root as `index.html`, `post.html`, etc. **No Node server** for visitors. |

The React app is **only the editor**. Readers only load **static HTML/JS** from the blog repo’s Pages.

## Auth (no Express required)

Settings UI stores `token`, `owner`, `repo`, `branch` in `localStorage` (`git-blog-editor:config`). Prefer a **fine-grained PAT** with Contents write on the blog repo only. The token never leaves the author’s browser except for GitHub API calls. Settings copy is localized (ko / en / ja) from the browser language (`client/src/i18n/settings.ts`).

Core modules: `client/src/github/` (`config`, `posts`, `files`, `meta`, `cleanup`, `templates`).

Optional legacy: `server/` Express API still exists for local use with `.env`, but is **not required** for Pages.

## How templates reach the blog repo

On **Save & continue** (or **Sync templates**) in Settings, `syncTemplates()`:

1. Ensures `posts/`, `images/`, `content/` directories exist.
2. Fetches bundled files from `public/templates/` and writes them to the blog repo root after replacing `__GITHUB_OWNER__` / `__GITHUB_REPO__`.

## Comments (static blog — no API server)

The public blog **cannot** call a private Express API on Pages. Comments use **Utterances** in `post.html`: one `<script>` tag; threads live in **GitHub Issues** on the same repo (or another you configure).

1. Turn on **Issues** for the blog repository.
2. Install the **Utterances** GitHub App: https://github.com/apps/utterances  
3. Sync templates from the editor so `post.html` has `repo="owner/repo"` filled from settings.

**Stable page URL:** Utterances uses `issue-term="url"` (the **browser address bar** only). Do not put cache-busting query params on `post.html` links. **JSON loading** uses `fetch(url, { cache: "no-store" })` instead.

## Repo layout (typical blog content repo)

| Path | Purpose |
|------|---------|
| `posts/meta.json` | Index of post filenames. |
| `posts/{uuid}.json` | Post body + metadata. |
| `images/`, `content/` | Media. |
| Root `index.html`, `post.html`, … | From templates — **public blog**. |

## Editor deploy

- CRA `homepage`: GitHub Pages path for this editor repo.
- Workflow: `.github/workflows/deploy-pages.yml` builds `client/` and deploys to Pages.
- Local: `cd client && npm run deploy` (gh-pages) or open `npm start` for development.

## Related files

- `client/src/github/` — Octokit browser API (posts, files, templates, cleanup).
- `client/src/settings/SettingsPage.tsx` — PAT / owner / repo UI.
- `client/public/templates/` — blog static templates bundled with the editor.
- `server/` — optional legacy Node API (not used by Pages editor).
