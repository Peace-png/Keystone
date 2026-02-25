# Fact Check Workflow

Verify factual claims and assess accuracy of content.

## Voice Notification

```bash
curl -s -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running the FactCheck workflow from the Journalism skill"}' \
  > /dev/null 2>&1 &
```

## Process

### Step 1: Identify Claims

**Extract all factual claims:**
- Statistics and numbers
- Specific events (who, what, when, where)
- Quotes and attributions
- Cause-and-effect assertions
- Scientific/technical claims

**Organize by:**
- Priority (most important to verify)
- Ease of verification
- Type of claim (statistic, event, quote)

### Step 2: Claim Analysis

**For each claim, determine:**
- **Verifiability:** Can this be proven true/false?
- **Evidence needed:** What documents/sources required?
- **Complexity:** Does this require expertise?
- **Time sensitivity:** Is this time-sensitive?

### Step 3: Evidence Gathering

**For Statistics:**
- Find original source
- Check methodology if available
- Look for corroborating data
- Check if data is current
- Note sample size and margin of error

**For Events:**
- Find official records
- Check news coverage from multiple sources
- Verify with primary sources when possible
- Check timing and sequence
- Look for official statements

**For Quotes:**
- Find original source (transcript preferred)
- Verify full context, not just excerpt
- Check if meaning changed by omission
- Verify attribution
- Note any relevant context

**For Scientific/Technical Claims:**
- Consult expert sources
- Check peer-reviewed research
- Look for consensus
- Check for opposing views
- Note level of certainty in field

### Step 4: Cross-Reference

**Compare:**
- Multiple sources on same claim
- Official vs. reporting
- Current vs. outdated information
- Different perspectives on same event

**Look for:**
- Consensus across sources
- Outliers that need explanation
- Conflicts that need resolution

### Step 5: Conclusion

**Determine:**

| Outcome | Description | Action |
|---------|-------------|--------|
| **Verified True** | Claim is accurate with evidence | Document as confirmed |
| **Verified False** | Claim is inaccurate | Document as false |
| **Partially True** | Some elements true, others false | Document what's true and what's false |
| **Unverifiable** | Cannot determine with available evidence | Note as unverifiable |
| **Opinion** | Subjective judgment, not fact | Label as opinion, not fact |
| **Disputed** | Sources disagree | Note dispute, present all sides |
| **Outdated** | Was true but no longer accurate | Note current status |

### Step 6: Documentation

**Create fact-check report:**

```
CLAIM: [exact claim to fact-check]

VERIFICATION:
- Sources consulted: [list]
- Evidence found: [summary]
- Confidence: [high/medium/low]

CONCLUSION:
- Status: [true/false/partial/unverifiable/opinion]
- Details: [explanation]

SOURCES:
- [Citation for each source]

NOTES:
- [Any remaining questions or concerns]
```

## Fact-Checking Frameworks

**For News Articles:**
- Lead paragraph claims
- Statistics and data
- Attributed quotes
- Background information
- Photo/video captions

**For Social Media:**
- Image authenticity
- Quote verification
- Source identification
- Context verification
- Metadata analysis

**For Political Content:**
- Policy positions
- Voting records
- Official statements
- Campaign promises vs. record
- Financial disclosures

## Quick Reference Checklist

```
□ What is the exact claim?
□ Who made the claim?
□ What evidence supports it?
□ What contradicts it?
□ Is this a fact or opinion?
□ Can I verify this with available sources?
□ Have I documented my verification?
□ Is there context that changes meaning?
□ Are there conflicts of interest?
```

## Common Claims to Verify

**Statistics:**
- "Crime is up X%" (Check: FBI UCR, official stats)
- "Economy grew by X%" (Check: Bureau of Economic Analysis)
- "X% of people believe..." (Check: Original poll methodology)

**Political:**
- "Candidate said X" (Check: Full transcript, video)
- "Bill does X" (Check: Full bill text, analysis)
- "Policy will lead to X" (Check: Expert analysis, CBO scoring)

**Science/Tech:**
- "Study shows..." (Check: Peer review, methodology)
- "New breakthrough..." (Check: Independent verification)
- "Expert says..." (Check: Expertise in this specific field)

## Timing the Fact-Check

**Before publishing:** Always verify before going live
**After publishing:** When new information emerges, update promptly
**Ongoing:** Periodically re-verify claims in ongoing stories

## Common Mistakes

**Don't:**
- Treat headlines as accurate summaries
- Assume social posts are factual
- Take press releases as neutral truth
- Ignore context that changes meaning
- Present multiple sources as independent confirmation when they're all citing one source
- Forget to update when new information emerges

**Do:**
- Verify quotes in full (not excerpts)
- Check original data (not secondhand reporting)
- Note when something is opinion vs. fact
- Document your verification process
- Update stories when new information emerges
- Be transparent about what you can and can't verify
