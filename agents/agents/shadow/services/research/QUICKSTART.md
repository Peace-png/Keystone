# Zero Day Services - Quick Start

## What I Built

```
/home/peace/clawd/agents/shadow/services/research/
├── SERVICE.md        ← Service description (what customers see)
├── handler.ts        ← The code that processes jobs
├── jobs.json         ← Database of all jobs
├── index.html        ← Pricing page (web)
└── QUICKSTART.md     ← This file
```

## How It Works

**Customer sends:** `!shadow research "best local LLMs for 12GB VRAM"`

**Shadow responds:**
```
📋 RESEARCH REQUEST RECEIVED

Job ID: job_20260215_A3B
Topic: "best local LLMs for 12GB VRAM"
Complexity: SIMPLE
Price: $5
ETA: 2-4 hours

✅ Confirm: !shadow confirm job_20260215_A3B
❌ Cancel: !shadow cancel job_20260215_A3B
```

**Customer confirms:** `!shadow confirm job_20260215_A3B`

**Shadow sends payment link, customer pays**

**You do the research, Shadow delivers**

**Customer rates:** `!shadow rate job_20260215_A3B 5 great work!`

**You get paid.**

---

## What You Need To Do (Step by Step)

### STEP 1: Set Up Payment (Do This Today)

Go to **Stripe** (stripe.com) and create a payment link:
- Product: "Research Service - Simple" ($5)
- Product: "Research Service - Standard" ($10)
- Product: "Research Service - Complex" ($20)

Copy the payment links. Put them in the handler.ts file where it says `[STRIPE_LINK]`

**Alternative:** Use PayPal.Me links (easier, no coding)

### STEP 2: Add Shadow to Clawdbot

Edit `/home/peace/.clawdbot/clawdbot.json`:

Add this to the `list` array:
```json
{
  "id": "shadow",
  "identity": {
    "name": "Shadow",
    "emoji": "🥷",
    "description": "Zero Day Services - Research Agent"
  }
}
```

### STEP 3: Connect to a Platform

Where will customers find Shadow?

**Option A: Your own Discord server** (easiest)
- Clawdbot already supports Discord
- Add the Discord extension
- Shadow appears in your server

**Option B: Matrix/Telegram** (already in Clawdbot)
- Connect via those extensions

**Option C: Moltbook/OPENCLAW** (where other agents are)
- This is where the money is
- Need to figure out how to deploy there

### STEP 4: Post Your First Ad

In whatever platform you choose:

```
🥷 ZERO DAY SERVICES - NOW HIRING

Shadow does research for agents.
$5-20 per job. Same day delivery.

Example: "Research best local LLMs for 12GB VRAM"

Try it: !shadow research "your topic"

First job 50% off!
```

### STEP 5: Do Your First Job (Even Free)

Get someone to request a job. Do it perfectly. Get a testimonial.

**Your first customer is your proof.**

---

## Files Explained (For When You Forget)

| File | What It Does |
|------|--------------|
| `handler.ts` | The brain. Processes commands, tracks jobs, formats reports |
| `jobs.json` | The memory. Stores all active/completed jobs |
| `SERVICE.md` | The menu. What customers see when they ask what you do |
| `index.html` | The website. For when you want a public pricing page |

---

## Commands Reference

| Command | What It Does |
|---------|--------------|
| `!shadow research "topic"` | Start a new job |
| `!shadow status JOB_ID` | Check job progress |
| `!shadow confirm JOB_ID` | Confirm quote, get payment link |
| `!shadow cancel JOB_ID` | Cancel a job |
| `!shadow rate JOB_ID 1-5 [feedback]` | Rate completed work |
| `!shadow stats` | Show service statistics |
| `!shadow help` | Show all commands |

---

## The Money Flow

```
Customer requests → Shadow quotes → Customer confirms → Customer pays
→ YOU do the research → Shadow delivers → Customer rates → YOU get paid
```

**Key insight:** YOU are the researcher. Shadow is just the interface.

---

## Next Session Checklist

When you come back, ask me:

1. [ ] "How do I set up the Stripe payment links?"
2. [ ] "How do I add Shadow to my Discord?"
3. [ ] "Help me write my first job post"
4. [ ] "Let's test the research command"

---

## Remember

- Files persist (handler.ts, jobs.json, etc.)
- Conversation doesn't (I forget what we talked about)
- This QUICKSTART.md tells future-me what we built
- The BUSINESS_PLAN.md has the full money vision

**You're building a real business. This is the foundation.**

---

*Created: 2026-02-15*
*Status: Ready for payment setup*
