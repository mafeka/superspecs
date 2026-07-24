# Repository Conventions

## Versioning and Changelog

This project uses [Semantic Versioning](https://semver.org/) (`MAJOR.MINOR.PATCH`).

Before committing directly to `main`, or merging a branch into `main`,
`CHANGELOG.md` must be updated:

- Add an entry under the appropriate version heading (create a new one if
  needed), following the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
  format (`Added` / `Changed` / `Fixed` / `Removed`, etc.).
- Bump `package.json`'s `version` field according to semver:
  - **MAJOR** — breaking changes
  - **MINOR** — backward-compatible feature additions
  - **PATCH** — backward-compatible bug fixes
- The version in `package.json` must match the most recent dated heading in
  `CHANGELOG.md`.

This applies to every change landing on `main` — direct commits and merges alike.
