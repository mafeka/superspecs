# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.2.0] - 2026-07-24

### Added
- OpenCode support: `.opencode/command/superspec-*.md` command twins,
  `.opencode/agent/superspec.md`, and `.opencode/superspec/*-prompt.md`
  dispatch templates mirroring the Claude Code workflow, dispatched via
  OpenCode's Task tool (`subagent_type: general`).
- `bin/install.js` `--host <claude|opencode|all>` flag (default `all`)
  selecting which payload set(s) to install.

## [0.1.0] - 2026-07-23

### Added
- Initial SuperSpec: forked OpenSpec schema enforcing terse requirements,
  semantic lint script, `/superspec-*` slash commands, subagent dispatch
  templates, installer.
- README with alpha warning.
