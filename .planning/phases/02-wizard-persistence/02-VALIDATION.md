---
phase: 02
slug: wizard-persistence
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (or jest — TBD by planner) |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | PERS-01 | unit | `npm test` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | PERS-03 | unit | `npm test` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | PERS-04 | unit | `npm test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Test framework install (vitest or jest)
- [ ] Test config file
- [ ] Stubs for PERS-01 (wizard state persistence)
- [ ] Stubs for PERS-03 (arena data persistence)
- [ ] Stubs for PERS-04 (start forfra clears state)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Hydration: no flash on first load | PERS-01 | Visual check | Open app, verify no layout shift or flash of default state |
| Project overview renders correctly | PERS-01 | Visual check | Save project, reload, verify overview shows horse + level |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
