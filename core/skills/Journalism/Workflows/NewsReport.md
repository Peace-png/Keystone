# News Report Workflow

Generate news articles from facts and information following journalistic standards.

## Voice Notification

```bash
curl -s -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running the NewsReport workflow from the Journalism skill"}' \
  > /dev/null 2>&1 &
```

## Process

### Step 1: Gather Facts

**Ask for:**
- The core facts (who, what, when, where, why, how)
- Source attribution
- Any quotes or statements

**Verify:**
- Facts are accurate
- Quotes are verbatim
- Context is complete

### Step 2: Identify Beat

**Determine the beat:**
- Politics, Technology, Business, Sports, Entertainment?
- Each beat has different approaches and sources
- See `Beats.md` for beat-specific guidance

### Step 3: Structure Article

**Use inverted pyramid format:**
- **Lede:** Most important info first (who, what, when)
- **Body:** Supporting details, context, quotes
- **Tail:** Background, upcoming developments

### Step 4: Apply Journalism Standards

**Verify:**
- Accuracy of all claims
- Balance and fairness
- Attribution of sources
- Separation of fact and opinion

**Add:**
- AI disclosure if applicable ("AI-assisted reporting")
- Timestamp
- Contact for corrections

### Step 5: Review and Refine

**Check:**
- Is the lead paragraph engaging?
- Is all information accurate?
- Are sources properly attributed?
- Is the tone appropriate?

## Format

**Headline:** Clear, informative, under 70 characters if possible

**Lede:** 3-5 sentences covering the 5 Ws (who, what, when, where, why)

**Body paragraphs:** Present information in order of importance

**Quotes:** Include relevant quotes from sources

**AI Disclosure:** If AI was used to gather or process information

## Example

**Input:**
```
Facts: Apple announced M4 chip today. 3x faster than M3. Built on 2nm process.
CEO Tim Cook says "revolutionary for AI". Available in new MacBook Pros next month.
Source: Apple press release, tech news coverage.
```

**Output:**
```
# Apple Unveils M4 Chip with 3x Performance Boost

Apple today announced the M4 chip, a next-generation processor that delivers
up to 3x the performance of its predecessor, the M3. Built on an advanced
2-nanometer manufacturing process, the chip represents what CEO Tim Cook called
a "revolutionary step forward for artificial intelligence" on Apple
platforms.

The M4 chip will debut in new MacBook Pro models next month, marking the
first major chip upgrade since the M3's introduction last year. Apple says the
improved neural engine and enhanced memory architecture specifically
target AI and machine learning workloads.

Industry analysts note that the 2nm process puts Apple ahead of competitors
in chip manufacturing technology. The performance gains are most pronounced
in AI-intensive tasks, with early benchmarks showing 2.8-3.2x improvements in
machine learning applications compared to M3-based systems.

[AI-assisted reporting: Information compiled from Apple press release and
industry sources. Generated 2026-02-07]
```

## Tips

**DO:**
- Start with the most important information
- Use clear, concise language
- Attribute all sources
- Verify facts before publishing
- Add context and background
- Keep opinions separate from facts

**DON'T:**
- Bury the lead with background info
- Use jargon without explanation
- Make claims without verification
- Present opinions as facts
- Publish without human review
