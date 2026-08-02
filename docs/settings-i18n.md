# Settings page i18n (ko / en / ja)

## Purpose

Make the PAT settings screen clearer and less “suspicious”, with copy in Korean, English, and Japanese based on the browser language.

## Behavior

- Locale from `navigator.languages` / `navigator.language` via `detectLocale()` (`ko` / `ja` / `en`, default `en`).
- Settings UI strings live in `client/src/i18n/settings.ts` and are used by `SettingsPage`.

## Affected files

- `client/src/i18n/settings.ts`
- `client/src/settings/SettingsPage.tsx`

## Status

Implemented.
