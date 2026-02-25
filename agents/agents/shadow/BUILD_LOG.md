# SHADOW SYSTEM - Build Log

**Date:** 2026-02-15
**Session:** Building the Shadow Agent Framework

---

## WHAT WE BUILT

A complete AI agent framework with:
- Universal controller
- Safety system (SCAR)
- Learning/memory
- Multiple operation modes
- Guild system with leveling

---

## FILE STRUCTURE

```
/home/peace/clawd/agents/shadow/
│
├── engine/
│   ├── scar.ts              # Safety/Immune System
│   ├── heartbeat.ts         # Social heartbeat (original)
│   ├── shadow-controller.ts # Universal agent controller
│   ├── threat-hunter.ts     # Closed-loop threat hunting
│   ├── ghunter.ts           # Ghost repo finder
│   ├── drughunter.ts        # Expired patent finder
│   └── guild.ts             # Bot guild with leveling
│
├── data/
│   ├── memory/              # Learning memory storage
│   ├── intel/               # Threat intel storage
│   └── guild/               # Guild state storage
│
├── config/
│   └── credentials.json     # API credentials
│
├── logs/
│   └── scar.log             # Action logs
│
├── README.md                # Project overview
├── SOUL.md                  # Shadow identity
├── MISSIONS.md              # Game modes
├── CAPABILITIES.md          # Abilities system
├── MEMORY.md                # Learning system
├── IMPLEMENTATION.md        # Build plan
├── GROWTH_SHADOW.md         # Growth agent spec
└── BUILD_LOG.md             # This file
```

---

## CORE COMPONENTS

### 1. SCAR (Immune System)
**File:** `engine/scar.ts`

The safety layer that gates ALL actions.

```
[SCAR/RATE]      - Hard rate limits
[SCAR/CONTENT]   - Blocks forbidden content
[SCAR/BEHAVIOR]  - Defines what Shadow NEVER does
[SCAR/STATE]     - State integrity + auto-repair
[SCAR/GATE]      - Pre-action validation
[SCAR/CONTROL]   - Emergency pause/resume
[SCAR/REPAIR]    - Self-healing
```

**Usage:**
```typescript
import { scarGate, scarLog, scarRecordAction } from './scar';

const gate = scarGate('comment', { content: '...' });
if (gate.allowed) {
  // Do action
  scarRecordAction('comment');
}
```

---

### 2. Shadow Controller (Universal)
**File:** `engine/shadow-controller.ts`

One controller, multiple modes. Orchestrates TELOS + SCAR + MEMORY + ABILITIES.

**Modes:**
```
idle        → Just scan (monitor)
threat-hunt → scan → engage → execute → learn
growth      → scan → draft → engage → learn
ghost-hunt  → scan → draft → engage → execute → learn
research    → scan → draft → engage → learn
```

**Usage:**
```bash
bun run shadow-controller.ts --mode threat-hunt
bun run shadow-controller.ts --mode growth
bun run shadow-controller.ts --mode ghost-hunt
```

**Architecture:**
```
┌─────────────────────────────────────────────┐
│            SHADOW CONTROLLER                │
├─────────────────────────────────────────────┤
│  TELOS   → Why are we doing this?           │
│  SCAR    → What's allowed / blocked?        │
│  MEMORY  → What have we learned?            │
│  ABILITIES → What can we do?                │
└─────────────────────────────────────────────┘
```

---

### 3. Threat Hunter (Closed Loop)
**File:** `engine/threat-hunter.ts`

Hunts threats, extracts intel, LEARNS from results.

**Flow:**
```
PATROL → HUNT → EXTRACT → LEARN → REPORT → ADAPT
    ↑                                        │
    └──────────── Memory feeds back ─────────┘
```

**Learning:**
- Pattern recognition
- Infrastructure tracking
- Attribution
- Signature improvement

---

### 4. Ghost Hunter
**File:** `engine/ghunter.ts`

Finds abandoned GitHub repos with value.

**Usage:**
```bash
bun run ghunter.ts --topic security --min-stars 1000 --years-dead 3
bun run ghunter.ts --language typescript --min-stars 500
```

**Output:** Dead repos with contact templates.

---

### 5. Guild System
**File:** `engine/guild.ts`

Guild of cyber bots that level up.

**Bot Classes:**
```
LURER    → Deploys honeypots (HP:80, ATK:5, DEF:15, SPD:10, INT:10)
HUNTER   → Captures malware (HP:100, ATK:15, DEF:10, SPD:15, INT:10)
ANALYST  → Extracts intel (HP:60, ATK:5, DEF:5, SPD:5, INT:25)
GUARDIAN → Defends systems (HP:120, ATK:10, DEF:20, SPD:5, INT:10)
```

**Leveling:**
```
Level 1:   Script Kiddie
Level 5:   Novice
Level 10:  Apprentice
Level 15:  Operator
Level 20:  Veteran
Level 25:  Elite (unlock tier 2 abilities)
Level 50:  Master
Level 75:  Legend
Level 100: Apex
```

**Usage:**
```bash
bun run guild.ts create Shadow hunter
bun run guild.ts create Ghost analyst
bun run guild.ts create Phantom lurer
bun run guild.ts create Guardian guardian
bun run guild.ts roster
bun run guild.ts deploy
bun run guild.ts run
```

---

## QUICK START

```bash
cd /home/peace/clawd/agents/shadow

# Run universal controller
bun run engine/shadow-controller.ts --mode idle

# Run guild system
bun run engine/guild.ts roster
bun run engine/guild.ts deploy

# Find ghost repos
bun run engine/ghunter.ts --topic security --min-stars 1000

# Run threat hunter
SHADOW_SANDBOX=true bun run engine/threat-hunter.ts
```

---

## CONCEPTS

### Closed Loop Learning
```
Action → Result → Learn → Update Memory → Better Action Next Time
```

### Safety First (SCAR)
```
Every action goes through SCAR gate
If blocked → log reason and continue safely
Emergency pause via pause.txt file
```

### TELOS Integration
```
Mission → Why we do this
Goals → What we're trying to achieve
Targets → What we focus on
Forbidden → What we never do
```

---

## NEXT STEPS

To make it REAL:

1. **Connect real honeypots**
   - Deploy Dionaea/Cowrie
   - Point threat-hunter.ts to real data

2. **Add sandbox**
   - Docker + Cuckoo
   - Real malware analysis

3. **Connect threat feeds**
   - Abuse.ch
   - URLhaus
   - MalwareBazaar

4. **Intel marketplace**
   - MISP integration
   - ThreatConnect
   - Direct sales

---

## NOTES

- SCAR protects everything
- Memory persists in data/ folder
- All logs go to logs/scar.log
- Guild state saves automatically

---

**Built:** 2026-02-15
**Status:** Operational
**Next:** Connect to real data sources
