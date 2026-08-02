# Static GitHub Pages editor (PAT)

## Purpose

Run the blog editor without a Node server: React app on GitHub Pages talks to the GitHub Contents API using a user-supplied PAT stored in `localStorage`.

## Behavior

- First visit shows Settings (token, owner, repo, branch).
- Save validates the repo, stores config, syncs `public/templates/` into the blog repo.
- Post list / create / update / delete / orphan cleanup use `client/src/github/*`.
- Deploy via Actions (`.github/workflows/deploy-pages.yml`) or `cd client && npm run deploy`.

## Affected files

- `client/src/github/` — API layer
- `client/src/settings/SettingsPage.tsx`
- `client/src/App.tsx`, `post/*` call sites
- `client/public/templates/`
- `docs/ARCHITECTURE.md`, `README.md`

## Status

Implemented.
