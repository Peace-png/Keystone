# PAI Component Index

**Complete catalog of all PAI components, triggers, and locations.**

---

## Quick Reference

| What You Want | Where to Look |
|---------------|--------------|
| **Learn PAI** | [THE_COMPLETE_GUIDE.md](THE_COMPLETE_GUIDE.md) |
| **Find a skill** | [Skills Catalog](#skills-21) |
| **Find a hook** | [Hooks Catalog](#hooks-17) |
| **Find a workflow** | [Workflows Catalog](#workflows-9) |
| **System files** | [Essential Files](#essential-files) |
| **Memory locations** | [Memory System](#memory-system) |

---

## Skills (21+)

| Skill | Location | USE WHEN Triggers | Capabilities |
|-------|----------|-------------------|--------------|
| **Agents** | `skills/Agents/` | "custom agents", "create agent", "spawn agent", "compose personality" | AgentFactory for unique personalities, ElevenLabs voice integration, persistent identity management |
| **Art** | `skills/Art/` | "generate art", "create image", "make visual" | AI image generation workflows, visual content creation |
| **AnnualReports** | `skills/AnnualReports/` | "annual report", "year summary", "yearly review" | Yearly review aggregation, synthesis, reporting |
| **Browser** | `skills/Browser/` | "screenshot", "validate", "check site", "test page" | Visual web testing, screenshots, UI validation, browser automation |
| **Council** | `skills/Council/` | "council", "debate", "discuss", "multiple perspectives", "pros and cons" | Multi-agent debate for decision making, 3-7 perspective analysis |
| **CORE** | `skills/CORE/` | (auto-loaded at session start) | System documentation, architecture, configuration reference |
| **CreateCLI** | `skills/CreateCLI/` | "create CLI", "build command", "command line tool" | CLI tool creation, TypeScript patterns, framework comparison |
| **CreateSkill** | `skills/CreateSkill/` | "create skill", "new skill", "add skill", "skill scaffolding" | Skill creation, validation, setup workflows |
| **FirstPrinciples** | `skills/FirstPrinciples/` | "first principles", "fundamental analysis", "root cause", "deconstruct" | Root cause analysis, assumption challenging, problem decomposition |
| **OSINT** | `skills/OSINT/` | "investigate", "OSINT", "background check", "due diligence", "research person" | Open source intelligence, entity lookup, company research, ethical frameworks |
| **PAI** | `skills/PAI/` | "PAI repo", "public PAI", "PAI release", "PAI version" | Public repository management, releases, version tracking |
| **PAIUpgrade** | `skills/PAIUpgrade/` | "upgrade PAI", "update PAI", "check for updates", "PAI version" | PAI version updates, release notes deep dive, upgrade research |
| **PrivateInvestigator** | `skills/PrivateInvestigator/` | "PI", "investigation", "find person", "locate", "skip trace" | Private investigation, people search, social media lookup, public records |
| **Prompting** | `skills/Prompting/` | "prompt engineering", "better prompts", "prompt optimization", "meta-prompting" | Prompt improvement techniques, template systems, standards |
| **Recon** | `skills/Recon/` | "reconnaissance", "map system", "discover", "scan network" | Security reconnaissance, system mapping, domain discovery, passive recon |
| **RedTeam** | `skills/RedTeam/` | "red team", "security test", "adversarial", "attack analysis" | Adversarial testing, 32-agent attack simulation, vulnerability assessment |
| **Research** | `skills/Research/` | "research", "investigate topic", "look into", "find information" | Multi-source research synthesis, web scraping, interview research |
| **System** | `skills/System/` | "integrity", "audit", "system check", "document session", "privacy check" | PAI maintenance, integrity audits, documentation updates, security scanning |
| **THEALGORITHM** | `skills/THEALGORITHM/` | "the algorithm", "how PAI works", "run the algorithm" | Core algorithm execution, ISC criteria management |
| **Telos** | `skills/Telos/` | "telos", "purpose", "goals", "life goals", "direction" | Purpose and goal alignment, life OS management |

### Skill File Structure

```
~/.claude/skills/SKILL_NAME/
├── SKILL.md                    (Required: Skill definition)
├── Workflows/                   (Optional: Task procedures)
│   ├── Workflow1.md
│   └── Workflow2.md
├── SYSTEM/                      (Optional: Shared docs)
│   └── SharedDoc.md
└── USER/                        (Optional: Private docs)
    └── PrivateDoc.md
```

### Skill Naming Conventions

| Pattern | Meaning | Example |
|---------|---------|---------|
| `TitleCase` | Public skill (syncs to repo) | `Research`, `Browser` |
| `_ALLCAPS` | Private skill (never shared) | `_MyPrivateSkill` |

---

## Hooks (17)

| Hook | Event | File | Purpose |
|------|-------|------|---------|
| **LoadContext** | SessionStart | `LoadContext.hook.ts` | Load identity, settings, soul.md, recent memories |
| **StartupGreeting** | SessionStart | `StartupGreeting.hook.ts` | Welcome user with configured greeting |
| **CheckVersion** | SessionStart | `CheckVersion.hook.ts` | Check for PAI updates |
| **UpdateTabTitle** | SessionStart | `UpdateTabTitle.hook.ts` | Update terminal tab title |
| **SecurityValidator** | PreToolUse | `SecurityValidator.hook.ts` | Validate operations against security policies |
| **SetQuestionTab** | PreToolUse | `SetQuestionTab.hook.ts` | Set terminal tab state for questions |
| **FormatReminder** | PreResponse | `FormatReminder.hook.ts` | Remind about response format if needed |
| **FormatEnforcer** | PreResponse | `FormatEnforcer.hook.ts` | Ensure response format compliance |
| **QuestionAnswered** | PostToolUse | `QuestionAnswered.hook.ts` | Track question completion |
| **ExplicitRatingCapture** | PostToolUse | `ExplicitRatingCapture.hook.ts` | Capture explicit ratings when provided |
| **CaptureSelfRating** | SessionStop | `CaptureSelfRating.hook.ts` | Capture AI's self-assessment |
| **ImplicitSentimentCapture** | SessionStop | `ImplicitSentimentCapture.hook.ts` | Capture user sentiment from interaction |
| **AgentOutputCapture** | SubagentStop | `AgentOutputCapture.hook.ts` | Capture subagent output |
| **SessionSummary** | SessionEnd | `SessionSummary.hook.ts` | Generate session summary |
| **WorkCompletionLearning** | SessionEnd | `WorkCompletionLearning.hook.ts` | Capture work completion learnings |
| **StopOrchestrator** | Stop | `StopOrchestrator.hook.ts` | Cleanup on session stop |
| **AutoWorkCreation** | SessionStart | `AutoWorkCreation.hook.ts` | Auto-create WORK directories |

### Hook Lifecycle Order

```
Session Start:
1. LoadContext → StartupGreeting → CheckVersion → UpdateTabTitle → AutoWorkCreation

During Session:
2. UserPromptSubmit → FormatReminder → AutoWorkCreation → ExplicitRatingCapture
3. PreToolUse → SecurityValidator → SetQuestionTab
4. PreResponse → FormatReminder → FormatEnforcer
5. PostToolUse → QuestionAnswered → ExplicitRatingCapture
6. SubagentStop → AgentOutputCapture

Session End:
7. SessionEnd → SessionSummary → WorkCompletionLearning → StopOrchestrator
```

### Hook Configuration

Hooks are configured in `settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {"command": "${PAI_DIR}/hooks/LoadContext.hook.ts"},
          {"command": "${PAI_DIR}/hooks/StartupGreeting.hook.ts"}
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {"command": "${PAI_DIR}/hooks/SecurityValidator.hook.ts"}
        ]
      }
    ]
  }
}
```

---

## Workflows (9+)

| Workflow | Trigger | Location | Purpose |
|----------|---------|----------|---------|
| **GIT** | "git push", "commit", "create commit" | `Workflows/GitPush.md` | Safe git commits with proper messages, multi-file staging |
| **DELEGATION** | "spawn agents", "divide and conquer", "parallel work" | `Workflows/Delegation.md` | Parallel agent coordination, fan-out pattern |
| **BACKGROUNDDELEGATION** | "background agents", "async", "non-blocking" | `Workflows/BackgroundDelegation.md` | Non-blocking parallel work, background task execution |
| **TREEOFTHOUGHT** | "plan mode", "complex decision", "explore options" | `Workflows/TreeOfThought.md` | Structured decision making, option exploration |
| **HOMEBRIDGE** | "home automation", "HomeBridge", "smart home" | `Workflows/HomeBridgeManagement.md` | Smart home device management, HomeBridge integration |

### Skill-Specific Workflows

Each skill may have its own workflows:

**Research Skill:**
- `QuickResearch.md` - Fast investigation
- `ExtensiveResearch.md` - Deep analysis
- `WebScraping.md` - Content extraction
- `StandardResearch.md` - Multi-source synthesis

**Browser Skill:**
- `Screenshot.md` - Capture page
- `VerifyPage.md` - Validate layout
- `Interact.md` - Page interaction
- `Extract.md` - Data extraction

**System Skill:**
- `IntegrityCheck.md` - System health audit
- `DocumentSession.md` - Capture session
- `DocumentRecent.md` - Recent activity
- `SecretScanning.md` - Security scan

---

## Tools

| Tool | Location | Purpose |
|------|----------|---------|
| **Inference** | `skills/CORE/Tools/Inference.ts` | Claude API inference (fast/standard/smart tiers) |
| **VoiceServer** | `VoiceServer/` | TTS notification system, ElevenLabs integration |
| **Memory Tools** | `skills/CORE/Tools/Memory.ts` | Memory search, storage, retrieval |
| **Task Tools** | Built-in | TaskCreate, TaskUpdate, TaskList (ISC management) |

### Tool Commands

```bash
# Inference
paiclaude --model claude-opus-4-6 --effort high

# Voice Server
node VoiceServer/server.js

# Memory (via PAI)
"Remember when we worked on X"
"What did we learn about Y"
```

---

## Memory System

| Directory | Content | Retention | Purpose |
|-----------|---------|-----------|---------|
| **WORK/** | Session logs (JSONL format) | Permanent | Complete task history, conversations |
| **LEARNING/** | Captured insights | Permanent | Pattern recognition, what works |
| **STATE/** | Current context | Session | Working memory, active projects |
| **RESEARCH/** | Investigation results | Permanent | Knowledge base, research synthesis |
| **SECURITY/** | Security events | 90 days | Threat monitoring, validations |
| **VOICE/** | Voice events | 30 days | Notification history, TTS logs |

### Memory File Formats

```
MEMORY/
├── WORK/
│   ├── 2026-02-07_123456.jsonl    (Session transcript)
│   └── 2026-02-07_234567.jsonl    (Another session)
├── LEARNING/
│   ├── 2026-02-07_123456.md       (Session learnings)
│   └── 2026-02-07_234567.md
├── STATE/
│   └── current_session.json       (Active context)
└── RESEARCH/
    ├── DAEMON_FREEZE_SYNTHESIS.md
    └── opus-4-6-research/
```

---

## Configuration Files

| File | Purpose | Editable | Location |
|------|---------|----------|----------|
| **settings.json** | Identity, voice, timezone, hooks | ✅ Yes | `~/.claude/` |
| **.env** | API keys, environment variables | ✅ Yes | `~/.claude/` |
| **soul.md** | Core AI identity, personality | ✅ Yes | `~/.claude/` or `pai/` |
| **agents.md** | Agent definitions, relationships | ✅ Yes | `~/.claude/` or `pai/` |
| **TELOS/** | Purpose, goals, direction | ✅ Yes | `~/.claude/skills/CORE/USER/TELOS/` |

### Settings Structure

```json
{
  "daidentity": {
    "name": "PAI",
    "fullName": "Personal AI Infrastructure",
    "voiceId": "elevenlabs-voice-id"
  },
  "principal": {
    "name": "Your Name",
    "timezone": "Your Timezone"
  },
  "permissions": {
    "allow": ["Bash", "Read", "Write", ...],
    "deny": [],
    "ask": ["rm -rf /", ...]
  },
  "hooks": { ... }
}
```

---

## Soul Documents

| Document | Location | Purpose |
|----------|----------|---------|
| **soul.md** | `~/.claude/` or `pai/` | Core AI identity, personality, algorithm |
| **agents.md** | `~/.claude/` or `pai/` | Agent definitions, personalities, relationships |
| **CLAUDE.md** | `~/.claude/` | Global instructions for all projects |

### Soul Document Pattern

Handler-Agent architecture:
- **Handler** = You (principal.name)
- **soul.md** = Scripture (immutable personality)
- **agents.md** = Agent relationships
- **Convergence** = Alignment with handler goals

---

## DAEMON_FREEZE Research

**Location:** `~/.claude/MEMORY/RESEARCH/DAEMON_FREEZE_SYNTHESIS.md`

**Sessions:** 23+ research sessions (2025-2026)

**Focus Areas:**
- Opus 4.6 thinking format
- Model ingestion capabilities
- Hybrid reasoning approaches
- Performance optimization
- Adaptive thinking mechanics

**Full Sessions:** `~/.claude/MEMORY/RESEARCH/`

---

## System Architecture Documents

Located in `skills/CORE/SYSTEM/`:

| Document | Purpose |
|----------|---------|
| **PAISYSTEMARCHITECTURE.md** | Founding principles, overall design |
| **SKILLSYSTEM.md** | Skill architecture, triggers, workflows |
| **THEHOOKSYSTEM.md** | Hook lifecycle, events, patterns |
| **MEMORYSYSTEM.md** | Memory architecture, directories |
| **TOOLREFERENCE.md** | Available tools and commands |
| **CLIFIRSTARCHITECTURE.md** | CLI-first design principles |

---

## Essential Files (Quick Access)

| File | What It Does | Where It Is |
|------|--------------|-------------|
| **THE_COMPLETE_GUIDE.md** | Main narrative guide | `skills/CORE/SYSTEM/` |
| **COMPONENT_INDEX.md** | This file | `skills/CORE/SYSTEM/` |
| **SKILL.md** | Quick reference | `skills/CORE/` |
| **settings.json** | Your configuration | `~/.claude/` |
| **soul.md** | AI identity | `~/.claude/` |
| **INSTALL.md** | Setup instructions | `~/.claude/` |
| **README.md** | Landing page | `~/.claude/` |

---

## File Locations Summary

```
~/.claude/
├── README.md                          (Landing page)
├── INSTALL.md                         (Setup instructions)
├── settings.json                      (Configuration)
├── .env                               (API keys)
├── soul.md                            (AI identity)
├── agents.md                          (Agent definitions)
│
├── skills/
│   ├── CORE/
│   │   ├── SKILL.md                   (Quick reference)
│   │   ├── THE_COMPLETE_GUIDE.md      (Main guide)
│   │   ├── COMPONENT_INDEX.md         (This file)
│   │   ├── SYSTEM/                    (Base documentation)
│   │   │   ├── PAISYSTEMARCHITECTURE.md
│   │   │   ├── SKILLSYSTEM.md
│   │   │   ├── THEHOOKSYSTEM.md
│   │   │   └── ...
│   │   └── USER/                      (Your customizations)
│   │       └── (override any SYSTEM file)
│   │
│   ├── Agents/                        (Agent skill)
│   ├── Art/                           (Art generation)
│   ├── Browser/                       (Web testing)
│   ├── Council/                       (Multi-agent debate)
│   ├── Research/                      (Investigation)
│   ├── System/                        (Maintenance)
│   └── [20+ more skills]
│
├── hooks/                             (17 hooks)
│   ├── LoadContext.hook.ts
│   ├── SecurityValidator.hook.ts
│   └── ...
│
├── MEMORY/                            (All sessions captured)
│   ├── WORK/                          (Session logs)
│   ├── LEARNING/                      (Insights)
│   ├── STATE/                         (Context)
│   ├── RESEARCH/                      (Investigation results)
│   ├── SECURITY/                      (Security events)
│   └── VOICE/                         (Notification history)
│
├── VoiceServer/                       (TTS system)
│
└── [other system files]
```

---

## Component Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                        PAI SYSTEM                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────┐ │
│  │   SKILLS     │◄────►│    HOOKS     │◄────►│   MEMORY   │ │
│  │              │      │              │      │           │ │
│  │ - Context    │      │ - Lifecycle  │      │ - Storage  │ │
│  │ - Workflows  │      │ - Automation │      │ - Retrieval│ │
│  │ - Tools      │      │ - Validation │      │ - Learning │ │
│  └──────────────┘      └──────────────┘      └───────────┘ │
│          │                     │                   │        │
│          └─────────────────────┴───────────────────┘        │
│                                │                             │
│                        ┌───────▼────────┐                    │
│                        │  THE ALGORITHM │                    │
│                        │  (Core Logic)   │                    │
│                        └────────────────┘                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Search This Document

| Looking For | Search For |
|-------------|-----------|
| A specific skill | Skill name (e.g., "Research") |
| A specific hook | Hook name (e.g., "SecurityValidator") |
| A specific workflow | Workflow name (e.g., "GIT") |
| File locations | File name |
| Memory directories | Directory name (e.g., "WORK/") |

---

**End of Component Index**

*Last Updated: 2026-02-07*
*PAI Version: 2.5*
