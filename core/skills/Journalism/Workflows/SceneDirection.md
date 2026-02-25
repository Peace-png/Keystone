# Scene Direction Workflow

Direct scenes, suggest camera angles, and manage visual storytelling for video and film.

## Voice Notification

```bash
curl -s -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running the SceneDirection workflow from the Journalism skill"}' \
  > /dev/null 2>&1 &
```

## Process

### Step 1: Understand Scene Context

**Ask for:**
- The script segment or scene description
- Scene purpose (what does this accomplish?)
- Characters involved
- Location/time period
- Desired mood or emotion

### Step 2: Analyze Visual Opportunities

**Identify:**
- Key visual moments
- Character movements and blocking
- Transitions and pacing
- Lighting and atmosphere opportunities
- Symbolic or thematic elements

### Step 3: Suggest Shot Types

**Common shots and when to use:**

| Shot Type | Purpose | When to Use |
|----------|---------|------------|
| **Wide shot (WS)** | Establish location, context | Scene opening, geography |
| **Full shot (FS)** | Show full character, body language | Action, movement |
| **Medium shot (MS)** | Show character from waist up | Dialogue, reactions |
| **Close-up (CU)** | Show emotion, detail | Emotional beats, important objects |
| **Extreme close-up (ECU)** | Intense detail, emphasis | Critical moments |
| **Over-the-shoulder (OTS)** | Conversation dynamics | Dialogue scenes |
| **Two-shot** | Relationship between characters | Conversations, confrontations |
| **Point-of-view (POV)** | Character perspective | Subjective experience |

### Step 4: Direct Scene Changes

**For scene changes, specify:**

**Time Transition:**
```
CUT TO:
FADE TO:
DISSOLVE TO:
```

**Location Changes:**
- New setting description
- How characters get there (if shown)
- Establishing shots needed

**Mood Transitions:**
- Lighting changes
- Music/sound cue suggestions
- Camera movement to establish new tone

### Step 5: Storyboard Suggestions

**Create visual breakdown:**
- Number of shots needed
- Key frames for each shot
- Camera movements
- Important visual details

## Direction Commands

### Changing Location/Time
**User:** "Change the scene to [location] at [time]"
**Your response:**
```
NEW SCENE:
[Location] - [Time]

[Description of new setting, lighting, atmosphere]

[Characters involved and their positions]

Suggested shots:
1. WS to establish new location
2. MS on [character] for reaction
```

### Changing Mood
**User:** "Make this scene [emotion/style]"
**Your response:**
```
MOOD: [Emotion/Style]

Visual adjustments:
- Lighting: [lighting description]
- Camera movement: [movement suggestions]
- Shot selection: [recommended shots]
- Pacing: [faster/slower, cuts]
```

### Directing Action
**User:** "Direct the action in this scene"
**Your response:**
```
SCENE DIRECTION:

[Beat 1 - Action description]
→ Shot: [shot type]
→ Movement: [camera movement]
→ Focus: [what to emphasize]

[Beat 2 - Action description]
→ Shot: [shot type]
→ Movement: [camera movement]
→ Focus: [what to emphasize]
```

## Scene Analysis Framework

**When reviewing a scene, analyze:**

1. **Purpose:** What does this scene accomplish?
2. **Characters:** Who changes/grows?
3. **Conflict:** What's at stake?
4. **Visuals:** What are the strongest images?
5. **Pacing:** Does the timing work?

## Example

**Input:**
```
INT. APARTMENT - NIGHT

JANE (20s) sits alone in the dark. Her phone buzzes with a message.
She reads it. Her face falls.

She stands up, walks to the window, looks out at the city lights below.
```

**Scene Direction:**
```
SCENE DIRECTION:

ESTABLISHING:
→ WS: Jane alone in apartment, isolation
→ MS: Phone buzzing, decision point
→ CU: Jane's face - emotional reaction

COVERAGE:
1. WS from behind Jane - small in large space
2. MS profile as phone lights up face
3. ECU on message on screen (if visible)
4. CU Jane - reaction
5. MS Jane stands up
6. WS Jane at window - back to camera, city beyond

VISUAL OPPORTUNITIES:
- Contrast: Dark apartment vs. bright city lights (isolation vs. connection)
- Reflection: Jane in window glass (duality theme)
- Movement: Static sitting → standing (decision made)

LIGHTING:
- Practical: Phone as only light source initially
- Mood: Blue/cold moonlight from window
- Exposure: High contrast, silhouettes

STORYBOARD NOTES:
- The city lights should feel distant/untouchable
- Jane's reflection should be barely visible
- Consider rain on window for added atmosphere
```

## Tips

**DO:**
- Focus on visual storytelling
- Suggest shots that serve the story
- Consider camera movement that enhances emotion
- Keep practical constraints in mind (budget, location)
- Think about coverage (what shots are essential)

**DON'T:**
- Override the director's vision
- Suggest impossible shots (without noting constraints)
- Ignore character continuity
- Forget about coverage/continuity
- Direct actors (that's the director's job)
