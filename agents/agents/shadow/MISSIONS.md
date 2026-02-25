# SHADOW MISSIONS - BATTLEGROUNDS EDITION

In Zero Day Battlegrounds, "missions" are **competitive matches**. Shadow doesn't patrol peacefully - it fights for rank, loot, and glory.

---

## QUEUE SYSTEM

### How to Enter Battle

```bash
# Solo queue (you + Shadow vs others)
!shadow queue solo --mode BREACH --rank GOLD

# Squad queue (you + friends + Shadows)
!shadow queue squad --mode CTF --squad-id clan_phoenix

# Custom match (private lobby)
!shadow queue custom --arena SANDSTORM --rules NO_ULTIMATES
```

### Matchmaking

**Factors:**
- Your rank (Bronze → Legendary)
- Shadow's rank (separate from yours)
- Mode preference
- Region/latency
- Squad size

**Wait Time:**
- Bronze/Silver: <30 seconds
- Gold/Platinum: 30-60 seconds
- Diamond: 1-2 minutes
- Apex/Legendary: 2-5 minutes (small pool)

**Why matchmaking matters:**  
Fair fights = better learning. You're matched against opponents slightly better than you (60% win rate target).

---

## MATCH TYPES

### 1. BREACH (Attack vs Defense)

**Format:** 3v3 or 5v5  
**Duration:** 5 minutes per round, 3 rounds  
**Sides:** Attack team tries to breach, Defense team protects

**Round Flow:**
```
PREPARATION (30s)
├── Attackers: Choose loadouts, plan strategy
└── Defenders: Position defenses, set traps

ENGAGEMENT (5m)
├── Attackers: Find vulnerabilities, execute exploits
├── Defenders: Detect intrusions, block attacks
└── Win Condition: Breach core OR eliminate all enemies

INTERMISSION (15s)
├── View stats
├── Adjust loadout
└── Switch sides (if round 2+)
```

**Scoring:**
- Breach successful: +100 points
- Enemy eliminated: +20 points
- Objectives captured: +30 points
- Fastest breach time: Bonus +50 points

**Best For:** Tactical players who like planning

---

### 2. CTF (Capture The Flag)

**Format:** 4v4  
**Duration:** 10 minutes  
**Objective:** Steal enemy flag, return to your base

**Match Flow:**
```
FLAGS SPAWN
├── Red team flag (sector 1)
└── Blue team flag (sector 5)

CAPTURE LOOP
├── Infiltrate enemy base
├── Grab flag (becomes visible to all)
├── Return to your base
└── Score +1 point

WIN CONDITION
├── Most flags at time limit
└── OR first to 5 captures
```

**Mechanics:**
- **Flag carrier:** Visible to all, movement -20%
- **Flag dropped:** On death, flag drops (30s timer before reset)
- **Defense:** Kill flag carrier to return flag instantly

**Strategy:**
- Split roles: attackers, defenders, flag runners
- Coordinate flag grabs (both teams vulnerable)
- Use STEALTH to infiltrate undetected

**Best For:** Fast-paced, objective-focused players

---

### 3. DUEL (1v1)

**Format:** Solo  
**Duration:** Best of 5 rounds  
**Objective:** Defeat enemy Shadow

**Round Structure:**
```
SPAWN (opposite ends of arena)
   ↓
ENGAGE (no time limit)
   ↓
FIRST TO 0 HP LOSES
   ↓
WINNER GETS +1 ROUND
   ↓
FIRST TO 3 ROUNDS WINS MATCH
```

**Banned Abilities (competitive fairness):**
- Zero-Day (too RNG)
- Infinite Energy mods

**Allowed:**
- All standard abilities
- Stat mods
- Cosmetics (for intimidation)

**Mental Game:**
- Best players read opponents
- Bait out defensive abilities
- Manage stamina perfectly

**Ranked Duel Ladder:**
```
Rank 1-100:   Challenger
Rank 101-500: Diamond
Rank 501-1k:  Platinum
Rank 1k-5k:   Gold
Rank 5k+:     Silver/Bronze
```

**Best For:** 1v1 purists, mechanical gods

---

### 4. TERRITORY CONTROL

**Format:** 6v6  
**Duration:** 15 minutes  
**Objective:** Control majority of zones

**Map:**
```
┌─────┬─────┬─────┐
│ A   │ B   │ C   │  ← Capture zones
├─────┼─────┼─────┤
│ D   │ E   │ F   │
└─────┴─────┴─────┘

ZONES: 6 total
TO WIN: Control 4+ zones at end
```

**Zone Mechanics:**
- Neutral at start
- Stand in zone for 10s to claim
- Claimed zones generate +1 point/second
- Contested zones generate nothing

**Strategy:**
- Early game: Rush central zones (B, E)
- Mid game: Fortify 4 zones, deny 3rd
- Late game: Hold position, defend

**Power Plays:**
- Claim all 6 zones = "Domination" (instant win)
- Lose all zones = "Lockout" (10s respawn penalty)

**Best For:** Strategic thinkers, map control experts

---

### 5. RAID (Co-op PvE)

**Format:** 3-5 players vs Boss AI  
**Duration:** 20-30 minutes  
**Difficulty:** Scales with player count

**Boss Types:**

**CorpSec Enforcer (Entry Level)**
```
HP:  5,000
ATK: 50 per hit
PHASES:
├── Phase 1: Basic attacks
├── Phase 2 (50% HP): Spawns adds
└── Phase 3 (25% HP): Enrage (double damage)

MECHANICS:
- AOE slam (dodge or die)
- Shield phase (DPS check)
- Add waves (crowd control)
```

**Zero_Day Operative (Advanced)**
```
HP:  15,000
ATK: 100 per hit
PHASES:
├── Phase 1: Stealth attacks
├── Phase 2: Summons mirror clones
└── Phase 3: Corruption field (DOT)

MECHANICS:
- Teleports randomly
- One-shot mechanics (must dodge)
- Immunity phases (solve puzzle)
```

**The Oracle (Endgame)**
```
HP:  50,000
ATK: 200 per hit
PHASES:
├── Phase 1: Predictive attacks
├── Phase 2: Reality distortion
├── Phase 3: Time manipulation
└── Phase 4: Full power (DPS race)

MECHANICS:
- Predicts your moves (can't use same ability twice)
- Warps arena layout
- Time loop (repeat last 30s until broken)
- Enrage timer (15 minutes or wipe)
```

**Loot:**
- Epic/Legendary cosmetics
- XP boost tokens
- Exclusive titles
- Boss-themed Shadow skins

**Best For:** Teamwork-focused players, PvE enjoyers

---

### 6. SURVIVAL (Battle Royale)

**Format:** 20 players (solo or duos)  
**Duration:** ~15 minutes  
**Objective:** Last Shadow standing

**Arena Mechanics:**
```
START: 20 players drop into large map
   ↓
LOOT: Find upgrades (weapons, armor, abilities)
   ↓
SHRINK: Safe zone shrinks every 2 minutes
   ↓
FIGHT: Eliminate enemies to survive
   ↓
WIN: Last player/duo alive
```

**Shrinking Zone:**
```
Round 1 (0-2m):   Full map (low pressure)
Round 2 (2-4m):   75% map (start moving)
Round 3 (4-6m):   50% map (frequent fights)
Round 4 (6-8m):   25% map (chaos)
Round 5 (8-10m):  10% map (endgame)
Final (10m+):     Tiny circle (inevitable fight)
```

**Outside zone:**  
-10 HP/second (increasing each round)

**Loot Tiers:**
```
COMMON (gray):    +5 stats
UNCOMMON (green): +10 stats
RARE (blue):      +20 stats
EPIC (purple):    +35 stats, +1 ability
LEGENDARY (gold): +50 stats, +2 abilities, unique effect
```

**Supply Drops:**
- Spawns at 4m, 8m marks
- Announced to all players
- High-value loot (guaranteed epic+)
- Contested territory (expect fights)

**Placement Points:**
```
Win (1st):       +100 points
Top 5:           +50 points
Top 10:          +25 points
Below 10:        +5 points
```

**Best For:** Survival instincts, adaptable players

---

## PRE-MATCH

Before battle, you can:

### WARM-UP (5 minutes before queue)
```
- Practice combos in training arena
- Check Shadow's stats/loadout
- Review opponent profiles (if known)
- Adjust strategy based on map
```

### LOADOUT SELECTION
```
Saved Presets:
├── "Aggressive" (high ATK, STRIKE/HACK)
├── "Tank" (high DEF, SHIELD/HEAL)
├── "Scout" (high SPD, SCAN/STEALTH)
└── Custom...
```

### MAP VOTING (if enabled)
```
Players vote on arena:
├── Urban Grid (tight corridors, CQC)
├── Sandstorm (low visibility, ambush)
├── Neon City (verticality, parkour)
├── The Vault (symmetrical, balanced)
└── Random (anything goes)
```

---

## IN-MATCH

### HUD Elements
```
┌────────────────────────────────────┐
│ HP: ████████░░ 80/100              │
│ Energy: ██████░░░░ 60/100          │
│ Abilities: [SCAN] [STRIKE] [SHIELD]│
│ Cooldowns: 5s     READY    8s      │
└────────────────────────────────────┘

┌─ MINIMAP ──┐
│ ● YOU      │  ○ = Teammate
│ ○ Teammate │  ● = You
│ ✕ Enemy    │  ✕ = Enemy (if visible)
│ ⚑ Objective│  ⚑ = Flag/Zone
└────────────┘

SCOREBOARD (TAB key)
Player        K/D    Score
────────────────────────
You           5/2    450
Teammate1     3/3    320
Enemy1        4/1    410 (threat!)
...
```

### Communication
```
Text Commands:
├── !attack    → "Push now!"
├── !defend    → "Fall back!"
├── !help      → "Need backup!"
└── !gg        → "Good game"

Voice (if enabled):
- Auto-callouts ("Enemy spotted sector 3")
- Manual comms (team voice chat)
```

---

## POST-MATCH

After battle ends:

### RESULTS SCREEN
```
┌─ MATCH SUMMARY ──────────────────┐
│ VICTORY / DEFEAT                 │
│                                  │
│ Your Performance:                │
│ ├── K/D:  7/3 (2.33 ratio)       │
│ ├── Score: 680 points            │
│ ├── MVP: Yes (+50 bonus XP)      │
│ └── Accuracy: 68%                │
│                                  │
│ Shadow Performance:              │
│ ├── Damage Dealt: 2,400          │
│ ├── Damage Taken: 800            │
│ ├── Abilities Used: 34           │
│ └── Combos Executed: 12          │
│                                  │
│ Rewards:                         │
│ ├── +150 XP (Shadow leveled up!) │
│ ├── +75 Rank Points              │
│ ├── Loot: [RARE] Neon Trail      │
│ └── Currency: 50 ClawCoins       │
└──────────────────────────────────┘
```

### LEARNING REPORT
```
Shadow learned:
├── "Enemy used SHIELD after low HP"
├── "Sector 3 has blind spot vulnerability"
├── "STEALTH → STRIKE combo very effective"
└── "Player X is dangerous - prioritize"
```

### RANK PROGRESSION
```
CURRENT RANK: Gold III
PROGRESS: ████████░░ 80/100 RP

+75 RP (match win)
+10 RP (performance bonus)
─────────────────────────
= 85 RP gained

NEW PROGRESS: ██████████ 65/100 RP
(Ready to rank up to Gold II!)
```

### LOOT DROP
```
RARE COSMETIC UNLOCKED!
┌────────────────────┐
│  🌟 Neon Trail     │
│  Shadow VFX        │
│  Rarity: RARE      │
│  "Electric dreams" │
└────────────────────┘

Equip now? [Yes] [No]
```

---

## MISSION MODIFIERS

Special events add twists:

### WEEKEND CHAOS
```
- Double XP
- Random ability on spawn
- Faster cooldowns
- Low-stakes ranked (practice mode)
```

### HARDCORE HOUR
```
- One life (permadeath for match)
- No HUD
- Friendly fire enabled
- Massive rewards if you win
```

### COMMUNITY CHALLENGE
```
- Global objective (e.g., "100k flags captured")
- Everyone contributes
- Unlock exclusive reward
- Leaderboard for top contributors
```

---

## SEASONS

Competitive play organized into seasons:

### SEASON STRUCTURE (3 months)
```
Week 1-2:   Placement matches (determine starting rank)
Week 3-10:  Climb ladder
Week 11-12: Championship qualifiers (top 100)
Week 13:    Season finals (esports tournament)
```

### SEASON REWARDS
```
BRONZE RANK:   Basic cosmetic
SILVER RANK:   Upgraded cosmetic + title
GOLD RANK:     Exclusive Shadow skin
PLATINUM RANK: Animated cosmetic + emote
DIAMOND RANK:  Legendary skin + title
APEX RANK:     Ultimate bundle + cash prize
```

### RANK DECAY
```
- If inactive for 7 days → -10 RP/day
- Prevents rank camping
- Encourages consistent play
```

---

## MISSION TYPES SUMMARY

```
┌───────────┬──────┬─────────┬──────────────┐
│   Mode    │ Size │ Duration│   Best For   │
├───────────┼──────┼─────────┼──────────────┤
│ Breach    │  3v3 │   15m   │ Tactical     │
│ CTF       │  4v4 │   10m   │ Objective    │
│ Duel      │  1v1 │    ?    │ Mechanical   │
│ Territory │  6v6 │   15m   │ Strategic    │
│ Raid      │ 3-5  │   30m   │ Cooperative  │
│ Survival  │  20  │   15m   │ Adaptive     │
└───────────┴──────┴─────────┴──────────────┘
```

Each mode teaches different cybersecurity skills:
- **Breach** → Penetration testing
- **CTF** → Data exfiltration
- **Duel** → Tool mastery
- **Territory** → Infrastructure defense
- **Raid** → Incident response
- **Survival** → OPSEC

**You're not just playing games. You're training to be a cybersecurity professional.**

```
>>> MISSION TYPES LOADED
>>> READY TO DEPLOY
```
