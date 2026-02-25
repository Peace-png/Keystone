#!/usr/bin/env bun
/**
 * FormatEnforcer.hook.ts - Response Format Injection (UserPromptSubmit)
 *
 * PURPOSE:
 * Ensures consistent response formatting by injecting the response format
 * specification as a <system-reminder> before EVERY response generation.
 * This "self-healing" mechanism keeps the format rules fresh in context,
 * preventing format drift in long conversations.
 *
 * TRIGGER: UserPromptSubmit
 *
 * INPUT:
 * - Environment: PAI_DIR, CLAUDE_PROJECT_DIR
 * - Files: skills/CORE/SYSTEM/RESPONSEFORMAT.md
 *
 * OUTPUT:
 * - stdout: <system-reminder> with condensed format specification
 * - stderr: Error messages
 * - exit(0): Always (non-blocking)
 *
 * SIDE EFFECTS:
 * - Reads format specification file
 * - Reads identity configuration for placeholder replacement
 *
 * INTER-HOOK RELATIONSHIPS:
 * - DEPENDS ON: LoadContext (identity must be loaded for placeholder replacement)
 * - COORDINATES WITH: None (standalone format enforcement)
 * - MUST RUN BEFORE: None (context injection order doesn't matter)
 * - MUST RUN AFTER: LoadContext (needs identity configuration)
 *
 * FORMAT RULES INJECTED:
 * - Voice line requirement (🗣️ line spoken aloud)
 * - Full vs minimal format selection
 * - 16-word maximum for voice lines
 * - Factual summary style (not conversational)
 *
 * SELF-HEALING MECHANISM:
 * Unlike LoadContext which runs once at session start, FormatEnforcer runs
 * on every prompt submission. This ensures format rules remain visible even
 * in long conversations where the original context may be compressed.
 *
 * ERROR HANDLING:
 * - Missing format spec: Logs error, exits gracefully
 * - Read failures: Logs error, exits gracefully
 *
 * PERFORMANCE:
 * - Non-blocking: Yes
 * - Typical execution: <10ms
 * - Skipped for subagents: Yes (they have different format needs)
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getPaiDir } from './lib/paths';
import { getIdentity, getPrincipal } from './lib/identity';

const FORMAT_SPEC_PATH = join(getPaiDir(), 'skills/CORE/SYSTEM/RESPONSEFORMAT.md');

function main() {
  try {
    // Check if this is a subagent session - subagents don't need format enforcement
    const claudeProjectDir = process.env.CLAUDE_PROJECT_DIR || '';
    const isSubagent = claudeProjectDir.includes('/.claude/Agents/') ||
                      process.env.CLAUDE_AGENT_TYPE !== undefined;

    if (isSubagent) {
      process.exit(0);
    }

    // Read format spec
    if (!existsSync(FORMAT_SPEC_PATH)) {
      console.error('[FormatEnforcer] Format spec not found');
      process.exit(0);
    }

    const formatSpec = readFileSync(FORMAT_SPEC_PATH, 'utf-8');
    const identity = getIdentity();

    // Replace placeholders with actual identity
    const principal = getPrincipal();
    const personalizedSpec = formatSpec
      .replace(/\{daidentity\.name\}/g, identity.name)
      .replace(/\{principal\.name\}/g, principal.name);

    // Extract just the essential format section (not the whole doc)
    const essentialFormat = `
## RESPONSE FORMAT REMINDER

**You MUST follow this format for EVERY response.**

### Voice Line (REQUIRED)
🗣️ ${identity.name}: [16 words max - factual summary of what was done]

This line is spoken aloud. Without it, your response is SILENT.

### Full Format (for task responses)
📋 SUMMARY: [One sentence]
🔍 ANALYSIS: [Key findings]
⚡ ACTIONS: [Steps taken or tools used]
✅ RESULTS: [Outcomes, what was accomplished]
📊 STATUS: [Current state of the task/system]
📁 CAPTURE: [Context worth preserving for this session]
➡️ NEXT: [Recommended next steps or options]
📖 STORY EXPLANATION:
1. [First key point in the narrative]
2. [Second key point]
3. [Third key point]
4. [Fourth key point]
5. [Fifth key point]
6. [Sixth key point]
7. [Seventh key point]
8. [Eighth key point - conclusion]

REPORT FINDINGS PLEASE : THANKS

⭐ RATE (1-10): [LEAVE BLANK - this prompts user to rate, AI does NOT self-rate]

🗣️ ${identity.name}: [16 words max - factual summary of what was done - THIS IS SPOKEN ALOUD]

### Minimal Format (for conversational responses)
📋 SUMMARY: [Brief summary]
🗣️ ${identity.name}: [Your response - THIS IS SPOKEN ALOUD]

### Format Selection
- Use Full Format for: Fixing bugs, creating features, file operations, status updates
- Use Minimal Format for: Greetings, acknowledgments, simple Q&A, confirmations

### Voice Line Rules
- Maximum 16 words
- Must be present in EVERY response
- Factual summary of what was done, not conversational phrases
- WRONG: "Done." / "Ready." / "Happy to help!" / "Got it, moving forward."
- RIGHT: "Updated all four banner modes with robot emoji and repo URL in dark teal."

### Story Explanation Rules
STORY EXPLANATION must be a numbered list (1-8). Never a paragraph.

### Important Notes
- The "REPORT FINDINGS PLEASE : THANKS" line signals the recipient should report findings, not rate
- This is used when delegating to another window for research/investigation
- When you see this line, provide your findings instead of a rating
`;

    // Output as system-reminder - this gets injected into context
    console.log(`<system-reminder>
${essentialFormat}
</system-reminder>`);

    process.exit(0);
  } catch (error) {
    console.error('[FormatEnforcer] Error:', error);
    process.exit(0);
  }
}

main();
