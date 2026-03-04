# Changelog

All notable changes to Keystone will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-03-04

### Added
- **SCAR Conscience System** - Full principle enforcement pipeline
  - Phase 1: Parser extracts YIN/YANG/CONSTRAINTS from SOUL.md
  - Phase 2: Enriched MatchResult returns wound/consequence/checks/remember
  - Phase 3: Session checkpoint integration with EVENTS-only extraction
- **EVENTS Section** in SESSION.md - Operational feed for SCAR reflection
- **Tag Vocabulary** - machine-readable metadata (domain/risk/signal/artifact)
- **De-duplication Markers** - Prevents repeat advisories via hash-based markers
- **Service Tree Documentation** - Full architecture diagram (`specs/SERVICE_TREE_CURRENT.md`)
- **Keystone Layer Model** - 5-layer architecture documentation

### Changed
- SCAR daemon now loads full principle context (not just rules)
- Session checkpoint extracts only EVENTS section (not philosophy)

### Technical
- `scar-daemon.ts` - Extended Scar interface with yin/yang/constraints/remember
- `scar-session-checkpoint.ts` - New session-end reflection script
- Hash function fixed: `createHash().update(data)` instead of `createHash('', data)`

---

## [0.2.0] - 2026-03-02

### Added
- **ClawMem Integration** - GPU-accelerated semantic search
- **Cognitive Firewall** - Three-layer protection system
- **Service Health Checks** - Boot verification for all daemons
- **PARKING_LOT.md** - Non-blocking issue tracking

### Changed
- Boot sequence now starts 5 services in parallel
- Health summary shows 6/7 services (Witness disabled)

---

## [0.1.0] - 2026-02-27

### Added
- **Core Boot System** - START-KEYSTONE.cmd entry point
- **CHECK_IDENTITY.bat** - P11 enforcement (git identity verification)
- **Constitution Structure**
  - SOUL.md - 13 behavioral principles (P1-P13)
  - USER.md - Human profile and workflow rules
  - VOICE.md - Communication style
  - SESSION.md - Session handoff
- **Service Daemons**
  - CORE (pai-daemon.ts) - Unified engine orchestrator
  - SEARCH (clawmem-daemon.ts) - Memory indexing
  - SHADOW (shadow-daemon.ts) - Security operations
  - FIREWALL (cognitive-firewall.ts) - Input filtering
  - SCAR (scar-daemon.ts) - Principle enforcement
- **Ollama Integration** - Local LLM via http://localhost:11434

---

## Version Summary

| Version | Codename | Focus |
|---------|----------|-------|
| 0.1.0 | Core Boot | System initialization, constitution structure |
| 0.2.0 | ClawMem | Semantic search, cognitive firewall |
| 0.3.0 | Conscience | SCAR principle enforcement, session reflection |

---

**Future:**
- 0.4.0 - Witness Integration (cryptographic file verification)
- 0.5.0 - Unified Loop (all services through single event stream)
