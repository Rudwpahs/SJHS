# SJHS Source Structure Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restore a reproducible, testable source tree for the already-published SJHS Memory Palace without changing the verified 159,032-byte canonical UI source.

**Architecture:** Keep the recovered verified HTML as canonical source under `src/`. Node-only tooling with zero runtime dependencies validates graph/UI invariants, packages the source into the four-chunk gzip/base64 Pages delivery model, and verifies byte-for-byte restoration. The currently published root snapshot remains untouched during recovery.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, Node.js >=20 built-ins (`node:test`, `vm`, `zlib`, `crypto`), GitHub Pages.

**Spec:** `SKILL.md` and `design-system/sjhs-memory-palace/MASTER.md`

## Global Constraints

- Existing canonical node coordinates are persistent memory anchors; no auto-relayout.
- Canonical graph contains validated knowledge only; no misconception nodes.
- 2015 revised middle-school science 24-unit coverage must not regress.
- No runtime third-party dependency is introduced.
- Publication stays compatible with the current four-payload GitHub Pages loader.
- Source SHA-256 stays `3b1a36475caebac8eebc0923c176bdb5ff0a46eb77e1704c45ec47971d053232` during recovery.

---

### Task 1: Restore canonical source and characterization tests

- [x] Write 26 failing characterization tests for source integrity, graph counts, edge validity, accessibility, semantic zoom and core math helpers.
- [x] Confirm RED because canonical source is absent.
- [x] Recover the verified 159,032-byte source from the published payload.
- [x] Run `npm test` and require 26/26 passing.

### Task 2: Restore build and audit tooling

- [x] Restore source SHA and graph extraction helpers.
- [x] Restore static UI/graph audit.
- [x] Restore four-chunk Pages packaging into `dist/`.
- [x] Verify generated payload restores canonical source byte-for-byte.
- [x] Run local `npm run verify` with all gates green.

### Task 3: Restore repository workflow

- [x] Document source recovery and verification commands.
- [x] Add branch CI running `npm run verify`.
- [x] Keep current root Pages snapshot unchanged.
- [ ] Require green branch CI and open PR to `main` without merging.
