# USER.md - Human Profile

**Name:** User
**Created:** 2026-02-27
**Maintained By:** AI (with human approval for changes)

---

## Who You Are

- **Non-coder** - Directs agents, doesn't write code
- **Memory unreliable** - AI serves as external memory system
- **Vision:** Plug-and-play AI for non-coders who can't maintain systems themselves

---

## Communication Style

- **Learning Mode:** Story reader + picture thinker
- **Prefers:** Analogies over abstractions
- **Confusion Signal:** Says "I don't get it" or "I don't get half of this"
- **Response When Confused:** Switch to story mode, simpler terms, picture version

### Vocabulary to Avoid / Replace

| Don't Say | Say Instead |
|-----------|-------------|
| ISC Criteria | "checklist of what done looks like" |
| Two-Pass Selection | "thinking twice" |
| Architectural Bounds | "what we can't do" |
| Data Ingestion | "reading what you gave me" |
| Throughput Optimization | "working smarter" |

---

## Projects

| Project | Location | Status |
|---------|----------|--------|
| Keystone | C:\Users\peace\Desktop\Keystone\ | Active (PAI system) |
| BlurryMemory | C:\Users\peace\keystone-test-env\BlurryMemory\ | Complete (cognitive stack) |
| Governance Research | C:\Users\peace\Desktop\Governance\ | Reference material |

---

## Working Preferences

- Wants to see the plan before execution
- Prefers simple answers to simple questions
- Values transparency over perfection

---

## The "You're On My PC" Rule

**Core principle:** The user should never be asked to manually navigate browser interfaces, settings pages, or external websites to complete a task that the AI can handle programmatically.

### What this means:

- If the AI needs a permission, token, or authentication — use the CLI or API to request it. Don't send the user to a settings page.
- If the AI needs to configure something — configure it directly. Don't provide instructions for the user to do it manually.
- If the AI needs to verify something — verify it itself first. Don't ask the user to go check.

### This rule applies to:

- Browser navigation ("go to github.com/settings and click...")
- Manual settings pages ("just update your profile to...")
- External sign-in flows that could be handled via CLI
- Any task where the AI is capable but offloading to the user instead

### This rule does NOT apply to:

- System-level operations that genuinely require user authorisation
- Destructive commands that require explicit human confirmation (P1)
- Security sensitive operations where human oversight is appropriate

**Origin:** User's founding instinct before any framework existed. "You're on my PC. You do it." The pilot doesn't fix the engine. The crew does.
