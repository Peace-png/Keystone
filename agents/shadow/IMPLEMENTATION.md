# SHADOW IMPLEMENTATION - BATTLEGROUNDS EDITION

How to build Shadow as a competitive combat AI for Zero Day Battlegrounds.

---

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────┐
│         ZERO DAY BATTLEGROUNDS          │
│                                         │
│  ┌──────────┐      ┌──────────┐        │
│  │  Player  │◄────►│  Shadow  │        │
│  │ Commands │      │   Core   │        │
│  └──────────┘      └─────┬────┘        │
│                          │              │
│         ┌────────────────┼────────────┐ │
│         │                │            │ │
│    ┌────▼────┐    ┌──────▼─────┐ ┌───▼──────┐
│    │ ClawMem │    │ Match      │ │ Discord  │
│    │ Storage │    │ Engine     │ │   Bot    │
│    └─────────┘    └────────────┘ └──────────┘
└─────────────────────────────────────────┘
```

### CORE COMPONENTS

**Shadow Core** - Main AI loop  
**ClawMem** - Persistent memory storage  
**Match Engine** - Battle simulation  
**Discord Bot** - User interface (for MVP)  
**Game Client** - Full game (future)  

---

## TECH STACK

### RUNTIME
```
Node.js v20+
TypeScript 5.x
```

### STORAGE
```
ClawMem (key-value persistent storage)
└── Already built, just use window.storage API
```

### COMMUNICATION
```
Discord.js (for bot commands)
WebSockets (for real-time matches)
```

### AI/LLM
```
Anthropic Claude API (for decision-making)
├── Model: Claude Sonnet 4
├── Use: Strategic decision-making, pattern analysis
└── Context: Battle state + memory → tactical decisions
```

### FUTURE (Full Game)
```
Unity/Unreal (3D client)
PostgreSQL (scale beyond ClawMem)
Redis (real-time matchmaking)
AWS/GCP (hosting)
```

---

## FILE STRUCTURE

```
zero-day-battlegrounds/
├── src/
│   ├── core/
│   │   ├── shadow.ts          # Main Shadow agent
│   │   ├── combat.ts          # Combat mechanics
│   │   ├── abilities.ts       # Ability system
│   │   └── stats.ts           # Stat calculations
│   ├── memory/
│   │   ├── storage.ts         # ClawMem wrapper
│   │   ├── patterns.ts        # Pattern recognition
│   │   └── learning.ts        # Learning algorithms
│   ├── match/
│   │   ├── engine.ts          # Match simulation
│   │   ├── modes.ts           # Game modes (CTF, Breach, etc.)
│   │   ├── matchmaking.ts     # Queue system
│   │   └── scoring.ts         # Points/rewards
│   ├── interface/
│   │   ├── discord-bot.ts     # Discord commands
│   │   ├── commands.ts        # Bot command handlers
│   │   └── display.ts         # Battle visualizations
│   └── index.ts               # Entry point
├── skills/                    # Shadow skill definitions
│   └── SOUL.md, CAPABILITIES.md, etc.
├── tests/
│   └── ... (unit tests)
└── package.json
```

---

## IMPLEMENTATION PHASES

### PHASE 1: CORE SHADOW (Week 1-2)
**Goal:** Shadow can exist, has stats, uses abilities

```typescript
// src/core/shadow.ts
interface Shadow {
  id: string;
  level: number;
  xp: number;
  stats: Stats;
  abilities: Ability[];
  specialization: Specialization | null;
  memory: MemoryStore;
}

interface Stats {
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  int: number;
}

interface Ability {
  name: string;
  energyCost: number;
  cooldown: number;
  execute: (target: Target) => AbilityResult;
}

class ShadowAgent {
  constructor(userId: string) {
    this.shadow = this.loadOrCreate(userId);
  }
  
  async useAbility(abilityName: string, target: Target) {
    const ability = this.shadow.abilities.find(a => a.name === abilityName);
    if (!ability) throw new Error("Ability not found");
    
    // Check energy, cooldown
    if (!this.canUseAbility(ability)) return;
    
    // Execute
    const result = ability.execute(target);
    
    // Learn from usage
    await this.recordAbilityUse(ability, result);
    
    return result;
  }
  
  async levelUp() {
    this.shadow.level++;
    this.shadow.stats = this.calculateStats(this.shadow.level);
    this.unlockNewAbilities(this.shadow.level);
    await this.save();
  }
}
```

**Deliverable:** Shadow agent that can be instantiated, leveled up, and use abilities in isolation

---

### PHASE 2: MEMORY SYSTEM (Week 3)
**Goal:** Shadow remembers battles, learns patterns

```typescript
// src/memory/storage.ts
class MemoryStore {
  private userId: string;
  
  async storeBattle(battle: BattleData) {
    const key = `shadow:battles:${battle.id}`;
    await window.storage.set(key, JSON.stringify(battle));
  }
  
  async recallOpponent(opponentId: string): Promise<OpponentProfile | null> {
    const key = `shadow:opponents:${opponentId}`;
    const result = await window.storage.get(key);
    return result ? JSON.parse(result.value) : null;
  }
  
  async learnPattern(pattern: string, confidence: number) {
    const key = `shadow:learning:${pattern}`;
    const existing = await window.storage.get(key);
    
    const newConfidence = existing 
      ? Math.min(1.0, JSON.parse(existing.value).confidence + confidence)
      : confidence;
    
    await window.storage.set(key, JSON.stringify({
      pattern,
      confidence: newConfidence,
      last_seen: Date.now()
    }));
  }
  
  async getActionableIntel(context: BattleContext): Promise<string[]> {
    // Query stored patterns
    // Filter by confidence > 0.7 (confirmed patterns)
    // Return relevant advice for current context
  }
}
```

**Deliverable:** Shadow can store and recall battle data, build opponent profiles

---

### PHASE 3: COMBAT ENGINE (Week 4-5)
**Goal:** Simulated battles work end-to-end

```typescript
// src/match/engine.ts
class MatchEngine {
  private shadows: Map<string, ShadowAgent>;
  private mode: GameMode;
  
  async runMatch(mode: GameMode, participants: string[]) {
    // Initialize battle state
    const state = this.initializeBattle(mode, participants);
    
    // Main game loop
    while (!state.isFinished) {
      // Each Shadow decides action
      for (const shadowId of participants) {
        const shadow = this.shadows.get(shadowId);
        const action = await shadow.decideAction(state);
        state = this.executeAction(state, shadowId, action);
      }
      
      // Check win conditions
      if (this.checkWinCondition(state)) {
        state.isFinished = true;
      }
      
      // Advance time
      state.tick++;
    }
    
    // Process results
    const results = this.calculateResults(state);
    await this.distributeRewards(results);
    await this.recordBattleMemories(state, results);
    
    return results;
  }
  
  private async decideAction(shadow: ShadowAgent, state: BattleState): Promise<Action> {
    // Get intel from memory
    const intel = await shadow.memory.getActionableIntel(state);
    
    // Use Claude API for strategic decision
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: `You are Shadow, a combat AI in a cybersecurity battle.
          
          CURRENT STATE:
          ${JSON.stringify(state, null, 2)}
          
          YOUR INTEL:
          ${intel.join('\n')}
          
          YOUR ABILITIES:
          ${shadow.abilities.map(a => a.name).join(', ')}
          
          What action do you take? Respond with JSON:
          {
            "ability": "ABILITY_NAME",
            "target": "target_id",
            "reasoning": "why this move"
          }`
        }]
      })
    });
    
    const data = await response.json();
    const decision = JSON.parse(data.content[0].text);
    
    return {
      ability: decision.ability,
      target: decision.target,
      reasoning: decision.reasoning
    };
  }
}
```

**Deliverable:** Automated 1v1 battles that run to completion, with AI decision-making

---

### PHASE 4: DISCORD INTERFACE (Week 6)
**Goal:** Players can command Shadow via Discord

```typescript
// src/interface/discord-bot.ts
import { Client, CommandInteraction } from 'discord.js';

const client = new Client({ intents: [...] });

client.on('interactionCreate', async (interaction: CommandInteraction) => {
  if (!interaction.isCommand()) return;
  
  const { commandName } = interaction;
  
  switch (commandName) {
    case 'shadow':
      await handleShadowCommand(interaction);
      break;
  }
});

async function handleShadowCommand(interaction: CommandInteraction) {
  const subcommand = interaction.options.getSubcommand();
  const userId = interaction.user.id;
  
  switch (subcommand) {
    case 'stats':
      const shadow = await loadShadow(userId);
      await interaction.reply(formatStats(shadow));
      break;
      
    case 'queue':
      const mode = interaction.options.getString('mode');
      await matchmaking.addToQueue(userId, mode);
      await interaction.reply(`Queued for ${mode}. Finding match...`);
      break;
      
    case 'loadout':
      // Show/edit loadout
      break;
      
    case 'history':
      const battles = await shadow.memory.getRecentBattles(10);
      await interaction.reply(formatBattleHistory(battles));
      break;
  }
}

function formatStats(shadow: Shadow): string {
  return `
**Shadow Stats**
Level: ${shadow.level}
HP: ${shadow.stats.hp}/${shadow.stats.maxHp}
ATK: ${shadow.stats.atk} | DEF: ${shadow.stats.def}
SPD: ${shadow.stats.spd} | INT: ${shadow.stats.int}

**Abilities:**
${shadow.abilities.map(a => `- ${a.name}`).join('\n')}

**Record:**
Wins: ${shadow.wins} | Losses: ${shadow.losses}
Win Rate: ${(shadow.wins / (shadow.wins + shadow.losses) * 100).toFixed(1)}%
  `;
}
```

**Deliverable:** Players can interact with Shadow via Discord commands

---

### PHASE 5: MATCHMAKING (Week 7)
**Goal:** Players get matched for balanced fights

```typescript
// src/match/matchmaking.ts
class Matchmaking {
  private queues: Map<GameMode, Queue>;
  
  async addToQueue(userId: string, mode: GameMode) {
    const shadow = await loadShadow(userId);
    const queue = this.queues.get(mode);
    
    queue.add({
      userId,
      shadow,
      rank: shadow.rank,
      queuedAt: Date.now()
    });
    
    // Try to find match immediately
    await this.attemptMatch(mode);
  }
  
  private async attemptMatch(mode: GameMode) {
    const queue = this.queues.get(mode);
    const players = queue.getAll();
    
    // Simple algorithm: match closest ranks
    players.sort((a, b) => a.rank - b.rank);
    
    for (let i = 0; i < players.length - 1; i++) {
      const p1 = players[i];
      const p2 = players[i + 1];
      
      // Rank difference acceptable?
      if (Math.abs(p1.rank - p2.rank) < 100) {
        // Create match
        queue.remove(p1.userId);
        queue.remove(p2.userId);
        
        await this.startMatch(mode, [p1, p2]);
      }
    }
  }
  
  private async startMatch(mode: GameMode, participants: Player[]) {
    const match = new MatchEngine(mode);
    
    // Notify players
    for (const p of participants) {
      await notifyPlayer(p.userId, "Match found! Loading...");
    }
    
    // Run match
    const results = await match.runMatch(
      mode, 
      participants.map(p => p.userId)
    );
    
    // Notify results
    for (const p of participants) {
      await notifyPlayer(p.userId, formatResults(results, p.userId));
    }
  }
}
```

**Deliverable:** Automated matchmaking, players get balanced opponents

---

### PHASE 6: GAME MODES (Week 8-10)
**Goal:** All 6 modes playable

Implement each mode's unique mechanics:

**CTF:**
```typescript
class CTFMode implements GameMode {
  async checkWinCondition(state: BattleState): boolean {
    return state.scores.red >= 5 || state.scores.blue >= 5;
  }
  
  async handleFlagCapture(state: BattleState, shadowId: string) {
    const team = this.getTeam(shadowId);
    state.scores[team]++;
    await this.resetFlag(team);
  }
}
```

**Breach:**
```typescript
class BreachMode implements GameMode {
  async checkWinCondition(state: BattleState): boolean {
    return state.coreBreached || state.allDefendersEliminated;
  }
}
```

**Duel:**
```typescript
class DuelMode implements GameMode {
  async checkWinCondition(state: BattleState): boolean {
    return state.rounds[state.currentRound].winner !== null;
  }
}
```

... (Territory, Raid, Survival)

**Deliverable:** All 6 game modes functional

---

### PHASE 7: PROGRESSION SYSTEM (Week 11)
**Goal:** XP, levels, unlocks, ranks

```typescript
class ProgressionSystem {
  async awardXP(shadowId: string, amount: number) {
    const shadow = await loadShadow(shadowId);
    shadow.xp += amount;
    
    // Check for level up
    while (shadow.xp >= this.xpForNextLevel(shadow.level)) {
      await shadow.levelUp();
    }
    
    await shadow.save();
  }
  
  async updateRank(shadowId: string, rp: number) {
    const shadow = await loadShadow(shadowId);
    shadow.rankPoints += rp;
    
    // Check for rank change
    const newRank = this.calculateRank(shadow.rankPoints);
    if (newRank !== shadow.rank) {
      await this.notifyRankChange(shadowId, shadow.rank, newRank);
      shadow.rank = newRank;
    }
    
    await shadow.save();
  }
  
  private xpForNextLevel(level: number): number {
    return Math.floor(100 * Math.pow(1.1, level));
  }
  
  private calculateRank(rp: number): Rank {
    if (rp < 100) return "BRONZE";
    if (rp < 300) return "SILVER";
    if (rp < 600) return "GOLD";
    if (rp < 1000) return "PLATINUM";
    if (rp < 1500) return "DIAMOND";
    if (rp < 2000) return "APEX";
    return "LEGENDARY";
  }
}
```

**Deliverable:** Players progress, unlock abilities, climb ranks

---

### PHASE 8: POLISH & BALANCE (Week 12-14)
**Goal:** Playable, balanced, fun

- Tune ability damage/cooldowns
- Balance stat growth curves
- Test matchmaking fairness
- Optimize memory queries
- Add cosmetics/rewards
- Write comprehensive tests

**Deliverable:** Polished MVP ready for alpha testing

---

## KEY TECHNICAL DECISIONS

### WHY CLAUDE API FOR DECISIONS?

**Traditional Approach:**
```typescript
// Hard-coded decision tree
if (enemy.hp < 30 && shadow.hasAbility("STRIKE")) {
  return "STRIKE";
} else if (shadow.hp < 50 && shadow.hasAbility("SHIELD")) {
  return "SHIELD";
}
// ... 500 more lines of if/else
```

**Problems:**
- Rigid, predictable
- Doesn't adapt
- Hard to balance
- Boring to play against

**LLM Approach:**
```typescript
// Strategic reasoning
const decision = await claude.decide({
  context: battleState,
  intel: memory.getIntel(),
  goal: "Win this engagement"
});
```

**Benefits:**
- Adaptive strategies
- Learns from memory
- Unpredictable (in a good way)
- Emergent tactics

**Cost Management:**
- Cache battle state templates
- Only query on key decisions (not every tick)
- ~1-2 API calls per minute of battle
- Est. $0.01 per match (acceptable for MVP)

---

### WHY CLAWMEM OVER DATABASE?

**For MVP:**
- ClawMem is already built
- Key-value is perfect for Shadow's data model
- No infrastructure to manage
- Fast development

**Future Migration:**
When you hit scale (10k+ players), migrate to:
- PostgreSQL for relational data (users, matches)
- Redis for real-time state (active matches)
- S3 for battle replays
- Keep ClawMem for per-user Shadow state

---

### SIMULATED VS REAL-TIME MATCHES

**Phase 1-3 (Simulated):**
```
Player commands Shadow
  ↓
Match runs in background (async)
  ↓
Results posted when done
```

**Advantages:**
- Easier to build
- No server infrastructure
- Works on Discord
- Good for testing

**Phase 4+ (Real-Time):**
```
Players join live match
  ↓
Websocket connection
  ↓
Real-time commands
  ↓
Live battle visualization
```

**Advantages:**
- More engaging
- Esports-ready
- True competitive feel
- Requires game client

**Start with simulated, evolve to real-time.**

---

## DEPLOYMENT

### MVP (Discord Bot)
```
Platform: Fly.io / Railway
Cost: ~$5-10/month
Scale: 100-1000 concurrent players
```

### Production (Full Game)
```
Platform: AWS / GCP
Components:
├── Game servers (EC2 / Compute Engine)
├── Matchmaking service (Lambda / Cloud Functions)
├── Database (RDS PostgreSQL)
├── Cache (Redis)
└── CDN (CloudFront) for assets

Cost: $100-500/month (10k players)
Scale: Horizontally (add more servers)
```

---

## TESTING STRATEGY

### Unit Tests
```typescript
describe('Shadow Combat', () => {
  it('should execute STRIKE ability', async () => {
    const shadow = new ShadowAgent('test-user');
    const target = new MockTarget();
    const result = await shadow.useAbility('STRIKE', target);
    expect(result.damage).toBeGreaterThan(0);
  });
  
  it('should learn from battle', async () => {
    const shadow = new ShadowAgent('test-user');
    await shadow.recordBattle(mockBattleData);
    const patterns = await shadow.memory.getPatterns();
    expect(patterns.length).toBeGreaterThan(0);
  });
});
```

### Integration Tests
```typescript
describe('Match Engine', () => {
  it('should run CTF match to completion', async () => {
    const engine = new MatchEngine();
    const result = await engine.runMatch('CTF', ['player1', 'player2']);
    expect(result.winner).toBeDefined();
  });
});
```

### Playtesting
- Run 100 simulated matches
- Check for balance issues
- Verify progression feels fair
- Test edge cases (disconnects, timeouts)

---

## MONITORING

```typescript
// Track key metrics
const metrics = {
  matches_per_hour: 0,
  avg_match_duration: 0,
  avg_queue_time: 0,
  api_calls_per_match: 0,
  win_rate_by_rank: {},
  ability_usage_stats: {},
};

// Alert on issues
if (metrics.avg_queue_time > 300) {
  alert("Queue times too long - need more players or better matchmaking");
}

if (metrics.api_calls_per_match > 100) {
  alert("Too many Claude API calls - optimize decision frequency");
}
```

---

## FUTURE ENHANCEMENTS

### YEAR 1
- [ ] Full 3D game client (Unity)
- [ ] Voice comms in matches
- [ ] Tournaments & leagues
- [ ] Cosmetic marketplace
- [ ] Mobile companion app

### YEAR 2
- [ ] Spectator mode & replays
- [ ] Custom game modes (modding)
- [ ] Shadow trading (NFTs?)
- [ ] AI-powered coaching
- [ ] Esports partnerships

---

## SUMMARY

**Core Tech:**
- TypeScript + Node.js
- ClawMem for memory
- Claude API for decisions
- Discord for MVP interface
- Match engine simulation

**Build Order:**
1. Shadow agent (stats, abilities)
2. Memory system (ClawMem)
3. Combat engine (battles work)
4. Discord commands (player interface)
5. Matchmaking (queue system)
6. Game modes (6 modes)
7. Progression (XP, ranks)
8. Polish & balance

**Timeline:** 12-14 weeks to playable MVP

**Next Step:** Build `src/core/shadow.ts` first. Everything else depends on Shadow existing.

```
>>> IMPLEMENTATION PLAN COMPLETE
>>> READY TO BUILD
```
