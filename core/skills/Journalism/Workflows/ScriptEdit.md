# Script Edit Workflow

Edit and improve scripts for film, video, and creative media.

## Voice Notification

```bash
curl -s -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running the ScriptEdit workflow from the Journalism skill"}' \
  > /dev/null 2>&1 &
```

## Process

### Step 1: Understand Current Script

**Ask for:**
- The script content (or file location)
- What type of edit is needed (pacing, dialogue, format, etc.)
- Target audience or platform
- Any specific constraints (length, style, format)

### Step 2: Analyze Issues

**Look for:**
- Pacing problems (too fast/slow)
- Dialogue issues (unnatural, exposition-heavy)
- Format inconsistencies
- Scene transition problems
- Character voice consistency

### Step 3: Apply Script Formatting

**Use industry standard format:**
```
SCENE HEADING

Location - Time

Character cues and dialogue centered at 60 columns

Action and description centered at 60 columns

TRANSITION:
```

### Step 4: Edit Content

**Fix:**
- **Dialogue:** Make natural, subtext-aware, character-appropriate
- **Action:** Clear, visual, concise
- **Pacing:** Balance information and action
- **Format:** Consistent throughout

### Step 5: Scene Analysis

**Evaluate:**
- Scene purpose (what does this scene accomplish?)
- Character arcs (do characters grow/change?)
- Conflict and tension
- Visual storytelling opportunities

## Edit Types

### Pacing Edit
**Purpose:** Adjust information flow and timing
**Actions:**
- Compress exposition
- Expand key moments
- Reorder beats for impact
- Adjust scene length

### Dialogue Edit
**Purpose:** Make dialogue natural and purposeful
**Actions:**
- Remove on-the-nose exposition
- Add subtext
- Ensure character voice consistency
- Fix mechanics (speech patterns, verbal tics)

### Format Edit
**Purpose:** Ensure proper script format
**Actions:**
- Fix margins and centering
- Correct scene headings
- Standardize character cues
- Fix transitions

### Punch Up Edit
**Purpose:** Make scenes more engaging
**Actions:**
- Sharpen conflict
- Heighten tension
- Strengthen character moments
- Add visual storytelling elements

## Example

**Before:**
```
INT. COFFEE SHOP - DAY

John sits down. He looks sad because his girlfriend broke up with him
yesterday. He starts crying.

JOHN
I can't believe she left me. This is the worst day of my life.
The waitress comes over.

WAITRESS
What would you like to order?

JOHN
Just coffee. Black. I'm too sad to eat anything.
```

**After:**
```
INT. COFFEE SHOP - DAY

JOHN (30s) slumps into a booth, eyes rimmed red. He stares at the empty
seat across from him. A WAITRESS approaches.

JOHN
Just coffee. Black.

The waitress hesitates, then moves on. John's phone buzzes. He ignores it.
```

## Tips

**DO:**
- Show, don't tell
- Use subtext in dialogue
- Keep action visual and concise
- Maintain consistent character voices
- Format for readability
- Respect standard industry format

**DON'T:**
- Write exposition in dialogue
- Over-describe action
- Use camera directions in scripts (that's the director's job)
- Make all characters sound the same
- Format inconsistently
