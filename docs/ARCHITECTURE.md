# Architecture & storage (git-blog-editor)

## Two different “surfaces”

| Surface | What it is | In this repo |
|--------|------------|----------------|
| **Editor** | Tool for the author to write posts, upload media, publish JSON to GitHub. | `client/` (React) + `server/` API (`/api/posts`, `/api/files`). Runs **locally** (or wherever you host the editor); it is **not** the public blog runtime. |
| **Published blog** | Static site on GitHub Pages: list + post detail. | **`server/templates/`** → synced to the **blog repo** root as `index.html`, `post.html`, etc. **No Node server** for visitors. |

The React app is **only the editor**. Readers only load **static HTML/JS** from Pages.

## How templates reach the blog repo

On server start, `server/utils/initialize.ts` calls `createOrUpdateTemplate()` for each file in `server/templates/`. Those files are written to the **root of `GITHUB_OWNER` / `GITHUB_REPO`** (same repo as `posts/`, `images/`, …).

`applyTemplateEnv()` in `server/utils/template.ts` replaces `__GITHUB_OWNER__` and `__GITHUB_REPO__` so templates can embed values (e.g. Utterances `repo`).

## Comments (static blog — no API server)

The public blog **cannot** call a private Express API on Pages. Comments use **Utterances** in `server/templates/post.html`: one `<script>` tag; threads live in **GitHub Issues** on the same repo (or another you configure).

1. Turn on **Issues** for the blog repository.
2. Install the **Utterances** GitHub App: https://github.com/apps/utterances  
3. Restart the editor server so `post.html` syncs with `repo="owner/repo"` filled from `.env`.

**Stable page URL:** Utterances uses `issue-term="url"` (the **browser address bar** only). Do not put cache-busting query params on `post.html` links. **JSON loading** uses `fetch(url, { cache: "no-store" })` instead, so updates show without changing `window.location` and without `?time=` on fetches.

No `COMMENT_API_BASE`, no `comments/*.json` in-repo for this flow.

## Repo layout (typical)

| Path | Purpose |
|------|---------|
| `posts/meta.json` | Index of post filenames. |
| `posts/{uuid}.json` | Post body + metadata. |
| `images/`, `content/` | Media. |
| Root `index.html`, `post.html`, … | From `server/templates/` — **public blog**. |

## Related files

- `server/utils/template.ts` — read local template, env substitution, push to blog repo.
- `server/utils/initialize.ts` — ensure dirs + sync templates.
- `server/routes/posts.ts` — editor API for posts (used when authoring, not by Pages readers).
