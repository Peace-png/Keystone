# The Complete Guide to PAI

**Personal AI Infrastructure - Your AI, Your Way**

---

## Table of Contents

- [Part 1: The Essentials (15 min)](#part-1-the-essentials-15-min)
- [Part 2: Using PAI (30 min)](#part-2-using-pai-30-min)
- [Part 3: Understanding PAI (45 min)](#part-3-understanding-pai-45-min)
- [Part 4: Customizing PAI (1 hour)](#part-4-customizing-pai-1-hour)
- [Part 5: Reference Index](#part-5-reference-index)

---

# Part 1: The Essentials (15 min read)

## What PAI Is (In 3 Sentences)

PAI is a personalized agentic system that helps you accomplish your goals in life—and performs the work required to get there. It provides the scaffolding that makes AI assistance dependable, maintainable, and effective across all domains. Everything in PAI exists to serve **The Algorithm**: Current State → Ideal State via verifiable iteration.

## What PAI Does

PAI helps you:
1. **Accomplish tasks** through skills, agents, and tools
2. **Automate workflows** through hooks and triggers
3. **Build continuously** through memory capture and learning
4. **Customize everything** through the two-tier SYSTEM/USER architecture

## 3 Things You Can Do Right Now

### 1. Use a Skill
```
You: "Help me research quantum computing"

PAI automatically:
- Activates the Research skill
- Uses multiple sources to investigate
- Synthesizes findings into clear output
```

### 2. Spawn an Agent
```
You: "Create three agents to debate this decision"

PAI:
- Launches Council skill with 3 debate agents
- Each agent argues different perspectives
- Synthesizes consensus view
```

### 3. Access Memory
```
You: "What did we learn about hooks?"

PAI:
- Searches MEMORY/LEARNING/ for hook insights
- Retrieves relevant session history
- Synthesizes key learnings
```

## The One Thing to Remember

**PAI is not a tool—it's an algorithm that upgrades itself.**

Every session:
1. Captures signals (what you did, how it went)
2. Stores learnings (what worked, what didn't)
3. Improves execution (next time is better)

## How PAI Works: The Big Picture

```
┌─────────────────────────────────────────────────────────────┐
│                    THE PAI ALGORITHM                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│    CURRENT STATE → IDEAL STATE                              │
│         │              │                                    │
│         │              │                                    │
│    [What Is]      [What Should Be]                          │
│         │              │                                    │
│         └──────► │VERIFIABLE ITERATION│ ◄─────┘            │
│                    │                                           │
│                    ▼                                           │
│              IMPROVEMENT                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘

HOW IT HAPPENS:
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   SKILLS    │───►│    WORK     │───►│  LEARNING   │
│ (Know-how)  │    │ (Execution) │    │ (Insights)  │
└─────────────┘    └─────────────┘    └─────────────┘
     ▲                   ▲                   ▲
     │                   │                   │
     └───────────────────┴───────────────────┘
                    HOOKS (Automation)
```

---

# Part 2: Using PAI (30 min read)

## Skills: Domain Expertise on Demand

Skills are self-activating packages of domain expertise. Each skill contains:
- Context about its domain
- Workflows for common tasks
- Tools for specialized work

### How Skills Work

1. **You state your intent** → "Help me write a blog post"
2. **PAI matches intent** → Finds skill with "blog post" trigger
3. **Skill loads context** → Domain knowledge activates
4. **You accomplish goal** → Skill guides execution

### Example Skills

| Skill | Trigger | What It Does |
|-------|---------|--------------|
| **Research** | "investigate", "research", "look into" | Multi-source investigation and synthesis |
| **Browser** | "screenshot", "validate", "check site" | Visual web testing and validation |
| **Agents** | "create agent", "spawn agent" | Compose unique AI personalities |
| **Council** | "debate", "discuss", "perspectives" | Multi-agent decision making |
| **System** | "integrity", "audit", "check system" | PAI maintenance and health checks |

### Using Skills

Skills activate automatically based on your intent. Just say what you want:

```
"Research the latest developments in quantum computing"
→ Research skill activates

"Take a screenshot of that page and validate the layout"
→ Browser skill activates

"Create three agents to debate this architecture decision"
→ Agents skill activates
```

## Agents: Specialized Help

PAI has three agent systems:

### 1. Task Subagents (Internal)
Used automatically by skills for parallel work
- ClaudeResearcher, GeminiResearcher, GrokResearcher
- Engineer, Architect, Designer, QATester
- Run in background, return with results

### 2. Named Agents (Persistent)
Agents with fixed identities and voices
- Defined in agents.md or skill contexts
- Have ElevenLabs voice configurations
- Remember personality across sessions

### 3. Custom Agents (On-Demand)
Created in real-time for specific needs
```
"Create an agent that's an expert in Rust security"
→ AgentFactory composes unique personality
→ Agent completes task with that voice
→ Agent disappears (or you save it)
```

### When to Use Agents

- **Divide and conquer**: Complex tasks with independent parts
- **Specialized expertise**: Need domain-specific knowledge
- **Parallel processing**: Speed up research/investigation
- **Persistent personalities**: Ongoing character for narrative work

## Memory: Everything is Captured

PAI automatically stores everything in MEMORY/:

| Directory | Content | Example |
|-----------|---------|---------|
| **WORK/** | Session logs (JSONL) | Complete conversation history |
| **LEARNING/** | Captured insights | "Hooks execute before tools" |
| **STATE/** | Current context | Active projects, recent files |
| **RESEARCH/** | Investigation results | Opus 4.6 research synthesis |
| **SECURITY/** | Security events | Blocked commands, validations |
| **VOICE/** | Notification history | TTS events, voice server logs |

### Using Memory

```
"Remember when we worked on the deployment?"
→ PAI searches WORK/ for that session

"What did we learn about hooks?"
→ PAI retrieves LEARNING/ insights

"Continue from where we left off"
→ PAI loads STATE/ context
```

## Common Workflows

### Workflow 1: Research Task
```
1. "Research [topic]"
2. Research skill activates
3. Multiple agents investigate sources
4. Results synthesized into report
5. Stored in MEMORY/RESEARCH/
```

### Workflow 2: Code Task
```
1. "Fix this bug" / "Add this feature"
2. Engineer skill activates
3. Code is written, tested, verified
4. Session captured in MEMORY/WORK/
5. Learnings stored in MEMORY/LEARNING/
```

### Workflow 3: Agent Collaboration
```
1. "Spawn 3 agents to help with [complex task]"
2. Agents work in parallel
4. Results synthesized
5. Each agent's output captured
```

---

# Part 3: Understanding PAI (45 min read)

## The Algorithm: Gravitational Center

**Current State → Ideal State via verifiable iteration**

This simple formula powers everything in PAI:

```
CURRENT STATE          IDEAL STATE
    (What Is)    →    (What Should Be)
        │                    ▲
        │                    │
        └──► ITERATION ◄────┘
            (Verify & Improve)
```

### In Practice

```
GOAL: "Deploy this application safely"
│
├─ CURRENT STATE: Code written, untested
├─ IDEAL STATE: Deployed, tested, monitored
└─ ITERATION: Test → Fix → Deploy → Verify

Each iteration produces:
- Evidence (test results)
- Learning (what worked)
- Improvement (next time is better)
```

### How Components Support The Algorithm

| Component | Role in Algorithm |
|-----------|-------------------|
| **Skills** | Package workflows for iteration |
| **Hooks** | Capture signals at each step |
| **Memory** | Store evidence for verification |
| **Learning** | Improve next iteration |

## The Architecture: Two-Tier Design

PAI uses a consistent SYSTEM/USER pattern:

```
~/.claude/skills/CORE/
├── SYSTEM/         ← Base functionality (auto-syncs)
│   └── RESPONSEFORMAT.md
└── USER/           ← Your customizations (never touched)
    └── RESPONSEFORMAT.md
```

### How It Works

1. PAI checks USER/ first
2. If found → use YOUR version
3. If not found → fall back to SYSTEM/
4. PAI updates never touch USER/ files

### Why This Matters

- **You control overrides**: Your customization always wins
- **Safe updates**: PAI can update SYSTEM/ without breaking your changes
- **Easy sharing**: USER/ stays local, SYSTEM/ syncs to repo

## The Hook System: Lifecycle Automation

Hooks execute at specific events in the PAI lifecycle:

```
Session Start
    │
    ├─► LoadContext (identity, settings, soul.md)
    ├─► StartupGreeting (welcome message)
    └─► CheckVersion (PAI updates)

During Session
    │
    ├─► PreToolUse → SecurityValidator (check safety)
    ├─► UserPromptSubmit → FormatReminder (ensure format)
    └─► PostToolUse → OutputCapture (save results)

Session End
    │
    ├─► SessionSummary (what we did)
    ├─► WorkCompletionLearning (what we learned)
    └─► Memory storage (WORK/, LEARNING/, STATE/)
```

### What Hooks Enable

- **Voice notifications**: Spoken status updates
- **Session capture**: Every conversation saved
- **Security validation**: Dangerous operations confirmed
- **Observability**: System behavior monitored

## The Memory System: Continuous Learning

```
┌─────────────────────────────────────────────────────────────┐
│                       MEMORY/                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  WORK/          ──►  Session logs (what happened)          │
│  LEARNING/      ──►  Insights (what we learned)            │
│  STATE/         ──►  Context (what we're doing)            │
│  RESEARCH/      ──►  Knowledge (investigation results)      │
│  SECURITY/      ──►  Events (safety validations)           │
│  VOICE/         ──►  Audio (notification history)          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### How Memory Works

1. **Session starts** → STATE/ loaded
2. **Work happens** → Context captured in real-time
3. **Session ends** → WORK/ + LEARNING/ updated
4. **Next session** → Previous context available

### Memory as Competitive Advantage

Every session builds on previous sessions. PAI:
- Remembers what worked
- Avoids what didn't
- Accumulates expertise
- Improves continuously

---

# Part 4: Customizing PAI (1 hour read)

## Identity: Make PAI Yours

Edit `~/.claude/settings.json`:

```json
{
  "daidentity": {
    "name": "Your AI Name",
    "fullName": "Full Name",
    "voiceId": "elevenlabs-voice-id",
    "startupCatchphrase": "Your greeting here"
  },
  "principal": {
    "name": "Your Name",
    "timezone": "Your Timezone"
  }
}
```

### Voice Configuration

PAI uses ElevenLabs for voice output:
- Set `voiceId` to your preferred voice
- Adjust `stability`, `similarity_boost`, `style`
- Configure `speed` and `volume`

### Startup Greeting

Customize what PAI says when session starts:
```json
"startupCatchphrase": "Ready to accomplish your goals."
```

## Creating Skills

### Skill Structure

```
~/.claude/skills/YOUR_SKILL/
├── SKILL.md              (skill definition)
├── Workflows/            (task procedures)
├── SYSTEM/               (shared docs)
└── USER/                 (private docs)
```

### Skill Definition Format

```markdown
---
name: YOUR_SKILL
description: What it does. USE WHEN [intent triggers]. [Capabilities].
---

# YOUR_SKILL

Context about this domain...

## Workflows

- [Workflow 1](Workflows/Task1.md)
- [Workflow 2](Workflows/Task2.md)

## Tools

[Specialized tools for this domain]
```

### Naming Conventions

- `TitleCase` → Public skills (sync to repo)
- `_ALLCAPS` → Private skills (never shared)

### Example: Creating a Skill

```bash
# Create skill directory
mkdir -p ~/.claude/skills/MySkill/Workflows

# Create SKILL.md
cat > ~/.claude/skills/MySkill/SKILL.md << 'EOF'
---
name: MySkill
description: My custom skill. USE WHEN [my specific task]. Does X, Y, Z.
---

# MySkill

Context for my domain...

## Workflows

- [Do X](Workflows/DoX.md)
EOF
```

## Creating Hooks

### Hook Structure

```typescript
// ~/.claude/hooks/YourHook.hook.ts
import { HookContext, HookResult } from '../types/core';

export async function yourHook(context: HookContext): Promise<HookResult> {
  // Your hook logic here
  return { success: true };
}
```

### Hook Lifecycle Events

| Event | When It Fires | Use For |
|-------|--------------|---------|
| **SessionStart** | PAI starts | Load context, greet user |
| **PreToolUse** | Before tool executes | Validate security |
| **PostToolUse** | After tool executes | Capture output |
| **UserPromptSubmit** | User sends message | Format reminder |
| **SessionEnd** | PAI stops | Save session, capture learning |

### Example: Custom Hook

```typescript
export async function MyCustomHook(context: HookContext): Promise<HookResult> {
  // Do something before tool execution
  console.log('Tool about to execute:', context.tool);

  // Return success
  return { success: true };
}
```

### Registering Hooks

Add to `settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{
          "type": "command",
          "command": "${PAI_DIR}/hooks/MyCustomHook.hook.ts"
        }]
      }
    ]
  }
}
```

## The USER Override System

Override any SYSTEM file:

```
~/.claude/skills/CORE/
├── SYSTEM/
│   └── RESPONSEFORMAT.md        (default format)
└── USER/
    └── RESPONSEFORMAT.md        (your custom format)
```

PAI will:
1. Check USER/RESPONSEFORMAT.md first
2. Use it if it exists
3. Fall back to SYSTEM/ if not found

### What Can Be Overridden

- Response formats
- Skill behaviors
- Hook configurations
- Documentation
- ANYTHING in SYSTEM/ can have a USER/ counterpart

### Override Pattern

```
For any file in SYSTEM/:
  ~/.claude/skills/CORE/SYSTEM/File.md

Create your version:
  ~/.claude/skills/CORE/USER/File.md

PAI will use YOUR version, never the SYSTEM version
```

---

# Part 5: Reference Index

## Complete Component Catalog

### Skills (21+)

| Skill | USE WHEN | Purpose |
|-------|----------|---------|
| **Agents** | "custom agents", "create agent" | Compose unique personalities |
| **Art** | "generate art", "create image" | AI image generation |
| **AnnualReports** | "annual report", "year summary" | Yearly review synthesis |
| **Browser** | "screenshot", "validate", "check site" | Visual web testing |
| **Council** | "council", "debate", "perspectives" | Multi-agent debate |
| **CORE** | (auto-loaded) | System documentation |
| **CreateCLI** | "create CLI", "build command" | CLI tool creation |
| **CreateSkill** | "create skill", "new skill" | Skill scaffolding |
| **FirstPrinciples** | "first principles", "fundamental" | Root cause analysis |
| **OSINT** | "investigate", "OSINT", "background" | Open source intelligence |
| **PAI** | "PAI repo", "public PAI" | Public repository management |
| **PAIUpgrade** | "upgrade PAI", "update PAI" | Version updates |
| **PrivateInvestigator** | "PI", "investigation" | Private investigation |
| **Prompting** | "prompt engineering", "better prompts" | Prompt optimization |
| **Recon** | "reconnaissance", "map system" | System mapping |
| **RedTeam** | "red team", "security test" | Adversarial testing |
| **Research** | "research", "investigate topic" | Multi-source research |
| **System** | "integrity", "audit", "system check" | PAI maintenance |
| **THEALGORITHM** | "the algorithm", "how PAI works" | Core algorithm docs |
| **Telos** | "telos", "purpose", "goals" | Purpose alignment |

### Hooks (17)

| Hook | Event | Purpose |
|------|-------|---------|
| **LoadContext** | SessionStart | Load identity, settings, soul.md |
| **StartupGreeting** | SessionStart | Welcome user |
| **SecurityValidator** | PreToolUse | Validate operations |
| **FormatEnforcer** | PreResponse | Ensure format compliance |
| **FormatReminder** | PreResponse | Remind about format |
| **ImplicitSentimentCapture** | SessionStop | Capture sentiment |
| **ExplicitRatingCapture** | PostToolUse | Capture ratings |
| **CaptureSelfRating** | SessionStop | AI self-assessment |
| **SessionSummary** | SessionStop | Generate summary |
| **AgentOutputCapture** | PostToolUse | Capture subagent output |
| **AutoWorkCreation** | SessionStart | Create WORK directories |
| **CheckVersion** | SessionStart | Check for updates |
| **QuestionAnswered** | PostToolUse | Track completion |
| **SetQuestionTab** | PreToolUse | Set terminal tab |
| **UpdateTabTitle** | SessionStart | Update tab title |
| **StopOrchestrator** | SessionStop | Cleanup |

### Workflows (9+)

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **GIT** | "git push", "commit" | Safe git commits |
| **DELEGATION** | "spawn agents" | Parallel coordination |
| **BACKGROUNDDELEGATION** | "background agents" | Non-blocking work |
| **TREEOFTHOUGHT** | "plan mode", "complex decision" | Structured decisions |

### Memory Directories

| Directory | Content | Retention |
|-----------|---------|-----------|
| **WORK/** | Session logs | Permanent |
| **LEARNING/** | Insights | Permanent |
| **STATE/** | Current context | Session |
| **RESEARCH/** | Investigation results | Permanent |
| **SECURITY/** | Security events | 90 days |
| **VOICE/** | Voice events | 30 days |

## Essential Commands

```bash
# Start PAI
pai

# Update PAI
cd ~/.claude && git pull

# View session history
ls ~/.claude/MEMORY/WORK/

# Check system integrity
# (invoke System skill)
"Run integrity audit"

# Create a new skill
# (invoke CreateSkill skill)
"Create a skill for [domain]"

# Research a topic
# (invoke Research skill)
"Research [topic]"
```

## Essential Files

| File | Purpose | Editable |
|------|---------|----------|
| `~/.claude/settings.json` | Identity, voice, timezone | ✅ Yes |
| `~/.claude/.env` | API keys | ✅ Yes |
| `~/.claude/skills/CORE/USER/*` | Personal overrides | ✅ Yes |
| `~/.claude/skills/CORE/SYSTEM/*` | Base config | ❌ No (use USER/) |
| `~/.claude/soul.md` | AI identity | ✅ Yes |
| `~/.claude/agents.md` | Agent definitions | ✅ Yes |

## Troubleshooting

### Common Issues

**Problem**: PAI isn't responding
- **Check**: Session started properly?
- **Check**: settings.json has valid JSON?
- **Solution**: Restart session

**Problem**: Hooks not firing
- **Check**: Hook registered in settings.json?
- **Check**: Hook file has execute permissions?
- **Solution**: Run `chmod +x hooks/YourHook.hook.ts`

**Problem**: Skill not activating
- **Check**: SKILL.md has valid format?
- **Check**: USE WHEN triggers match your intent?
- **Solution**: Rephrase request to match triggers

**Problem**: Memory not saving
- **Check**: MEMORY/ directories exist?
- **Check**: Write permissions?
- **Solution**: Run `mkdir -p ~/.claude/MEMORY/{WORK,LEARNING,STATE}`

### Getting Help

1. **Ask PAI**: "Help me with [X]"
2. **Check this guide**: Search relevant section
3. **Deep dive**: See SYSTEM/ folder for details
4. **Research**: Check MEMORY/RESEARCH/

## Further Reading

- **Architecture**: `skills/CORE/SYSTEM/PAISYSTEMARCHITECTURE.md`
- **Skills**: `skills/CORE/SYSTEM/SKILLSYSTEM.md`
- **Hooks**: `skills/CORE/SYSTEM/THEHOOKSYSTEM.md`
- **Memory**: `skills/CORE/SYSTEM/MEMORYSYSTEM.md`
- **Research**: `MEMORY/RESEARCH/DAEMON_FREEZE_SYNTHESIS.md`
- **Community**: [github.com/danielmiessler/PAI](https://github.com/danielmiessler/PAI)

---

## Appendix: Quick Reference

### Response Format (REQUIRED)

**Full Format:**
```
📋 SUMMARY: [One sentence]
🔍 ANALYSIS: [Key findings]
⚡ ACTIONS: [Steps taken]
✅ RESULTS: [Outcomes]
📊 STATUS: [Current state]
📁 CAPTURE: [Context to preserve]
➡️ NEXT: [Next steps]
📖 STORY EXPLANATION:
1. [Point 1]
2. [Point 2]
...
⭐ RATE (1-10): [Leave blank for user]
🗣️ PAI: [16 words max, factual summary]
```

**Minimal Format:**
```
📋 SUMMARY: [Brief summary]
🗣️ PAI: [Your response]
```

### The Algorithm (v0.2.25)

```
🤖 PAI ALGORITHM ═════════════

🗒️ TASK: [8 words exactly]

━━━ 👁️ OBSERVE ━━━ 1/7
[Reverse engineer request]
⚠️ CREATE ISC TASKS NOW

━━━ 🧠 THINK ━━━ 2/7
[Thinking tools assessment]
🎯 CAPABILITY SELECTION

━━━ 📋 PLAN ━━━ 3/7
[Finalize approach]

━━━ 🔨 BUILD ━━━ 4/7
[Create artifacts]

━━━ ⚡ EXECUTE ━━━ 5/7
[Run the work]

━━━ ✅ VERIFY ━━━ 6/7
[Verify each ISC]

━━━ 📚 LEARN ━━━ 7/7
[What to improve]

🗣️ PAI: [Spoken summary]
```

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        PAI v2.5                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │   SKILLS    │───►│    WORK     │───►│  LEARNING   │   │
│  │  (Know-how) │    │ (Execution) │    │ (Insights)  │   │
│  └─────────────┘    └─────────────┘    └─────────────┘   │
│         │                   │                   │         │
│         └───────────────────┴───────────────────┘         │
│                             │                             │
│                        ┌──────▼──────┐                  │
│                        │   HOOKS     │                  │
│                        │ (Automation)│                 │
│                        └─────────────┘                  │
│                                                              │
│  CORE PRINCIPLE: Current → Ideal via Verifiable Iteration  │
│  GOAL: Euphoric Surprise in every execution                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

**End of The Complete Guide to PAI**

*Last Updated: 2026-02-07*
*PAI Version: 2.5*
*Repository: [github.com/danielmiessler/PAI](https://github.com/danielmiessler/PAI)*
