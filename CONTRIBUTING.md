# Contributing to VIGIL

Thanks for taking a look. VIGIL is small and the bar to contribute is low —
this guide is here to keep it that way.

## Quick start

```sh
git clone https://github.com/deborahfam/VIGIL.git
cd VIGIL
npm install
npm run tauri dev
```

Requirements: Node 18+, Rust 1.77+, and the Tauri prerequisites for your OS
([list here](https://tauri.app/start/prerequisites)).

## Layout

```
src/                    React + TypeScript frontend
  catalog.ts            The 24-item catalog of protectable apps
  store.ts              Persisted user state (localStorage)
  notify.ts             Native notification helper
  screens/              Dashboard, ProtectedServices, Settings
  components/           WarningModal, CatalogModal, Sidebar, …
src-tauri/              Rust backend (Tauri 2)
  src/lib.rs            Tauri commands (vpn_status, list_running_apps)
  src/launch_observer.rs  Cross-platform process-launch detection
docs/screenshots/       Images used in the README
```

## Before you open a PR

1. **Type-check passes:** `npx tsc --noEmit`
2. **Backend compiles:** `(cd src-tauri && cargo check)`
3. **The dev build runs:** `npm run tauri dev` opens and works without
   warnings in the console.

There are no tests yet — adding them is welcome.

## Things that are easy to help with

- **Test on Windows or Linux.** The launch observer is cross-platform via
  `sysinfo`, but only macOS has been tested in anger. Bug reports with OS
  details are gold.
- **Add to the catalog.** New entries go in `src/catalog.ts`. Keep the list
  curated — favor apps that genuinely leak sensitive traffic. Open an issue
  first if you're unsure.
- **Improve process-name matching.** Right now it's substring case-insensitive
  (`src/App.tsx` → `matchAppService`). An exact-match or regex mode would
  reduce false positives.
- **Add a system tray.** VIGIL currently stops watching when the window
  closes. A minimize-to-tray would make it actually background-friendly.
- **Domain enforcement.** Real blocking would need a browser extension
  (cleanest) or `NetworkExtension`/WFP at the OS level (heavier).

## Style

- Match the existing brutalist aesthetic: sharp corners (`--radius-*: 0`),
  high-contrast borders, monospace for technical text.
- No new dependencies without a reason in the PR description.
- Comments only when *why* is non-obvious. Names should do the work.
- Keep React components in one file unless they're shared across screens.

## Reporting bugs

Open an issue with:

- OS and version
- VIGIL version (from package.json or commit hash)
- Steps to reproduce
- What you expected vs. what happened
- Screenshot or recording if it's a UI issue

For security issues, please email the maintainer instead of filing publicly.

## License

By contributing, you agree your changes are released under the [MIT
License](LICENSE).
