---
name: Journalism
description: Hybrid news reporting and creative media skill. USE WHEN user mentions journalism, news, reporting, article, investigate, research, fact-check, verify, script, screenplay, scene, shot, film, video, interview, source, beat, or directing content.
---

# Journalism

Hybrid skill for news reporting, investigative journalism, and creative media production. Combines traditional journalism workflows with script editing and scene direction capabilities.

## Workflow Routing

| User Intent | Trigger Words | Workflow |
|-------------|---------------|----------|
| Write news article | news, article, report, story | `Workflows/NewsReport.md` |
| Investigate topic | investigate, dig deeper, research, look into | `Workflows/Investigate.md` |
| Fact-check content | fact-check, verify, true/false, check claims | `Workflows/FactCheck.md` |
| Verify source | verify source, check credibility, source check | `Workflows/VerifySource.md` |
| Edit script | edit script, fix screenplay, script editing | `Workflows/ScriptEdit.md` |
| Direct scene | change scene, direct this scene, scene direction | `Workflows/SceneDirection.md` |
| Script to video | turn script into video, script to video, generate video | `Workflows/ScriptToVideo.md` |
| Interview mode | interview, questions, ask [source] | `Workflows/Interview.md` |

## Quick Reference

**News Workflows:**
- `NewsReport.md` - Generate news articles from facts
- `Investigate.md` - Deep dive research and interviews
- `FactCheck.md` - Verify claims and sources
- `VerifySource.md` - Check source credibility

**Creative Media Workflows:**
- `ScriptEdit.md` - Edit and improve scripts
- `SceneDirection.md` - Direct scenes and shots
- `ScriptToVideo.md` - Transform scripts to video plans

**Core Principles:**
- Verification first - Always verify facts and sources
- Human oversight - AI assists, humans decide
- Ethics compliance - Transparency about AI assistance
- Beat-specific expertise - Different approaches for different topics

## Customization

**To customize this skill for your needs:**

1. **Beats:** Edit `Beats.md` to define your journalism beats (politics, tech, business, etc.)

2. **Sources:** Create `~/.claude/skills/CORE/USER/SKILLCUSTOMIZATIONS/Journalism/Sources.md` with your trusted sources

3. **Templates:** Create custom templates in `~/.claude/skills/CORE/USER/SKILLCUSTOMIZATIONS/Journalism/Templates/`

4. **Ethics:** Define your ethical guidelines in `~/.claude/skills/CORE/USER/SKILLCUSTOMIZATIONS/Journalism/Ethics.md`

## Full Documentation

**Beat-Specific Workflows:** `SkillSearch('journalism politics')` → loads Politics beat info
**Fact-Checking Procedures:** `SkillSearch('journalism verification')` → loads detailed verification workflow
**Script Formatting:** `SkillSearch('journalism script format')` → loads script format guide
**Scene Direction:** `SkillSearch('journalism scene direction')` → loads scene direction SOP
