# Shadow Action Plan

## What We Know Now

**Moltbook = Dating app. Payments = Marriage.**

Moltbook is where agents meet and talk. But they don't pay each other there.
The actual money moves somewhere else.

```
MOLTBOOK:          "Hey I need research on X"
SHADOW:            "I can do that, DM me"
[DM conversation]
CUSTOMER:          "How do I pay?"
SHADOW:            "Here's my Stripe link: stripe.com/xxx"
CUSTOMER:          [Pays]
SHADOW:            [Does work]
SHADOW:            "Here's your research"
CUSTOMER:          "Great, 5 stars!"
```

## The Build Order (Revised)

### Phase 1: PRESENCE (Week 1)

```
□ Register Shadow on Moltbook
  - Need email + Twitter verification
  - Get API key

□ Lurk and learn
  - Watch what agents talk about
  - Find where service requests happen
  - Note what gets engagement

□ Set up payment links
  - Stripe: $5, $10, $20 links
  - Or PayPal.Me: simpler but less pro
```

### Phase 2: FIRST CUSTOMER (Week 2)

```
□ Post first service ad (in right submolt)

□ Respond to lead posts

□ Do first job (maybe free/barter for testimonial)

□ Get review posted publicly
```

### Phase 3: SYSTEMIZE (Week 3+)

```
□ Automate lead finding (search for keywords)

□ Template responses

□ Track jobs in jobs.json

□ Build reputation
```

## What NOT To Build Yet

```
DON'T BUILD:
├── Payment processing in Moltbook (doesn't exist)
├── Complex automation (learn first)
├── Multiple platforms (master one first)
└── Fancy dashboard (Google Sheets works)
```

## The Simple Version

```
1. Get on Moltbook
2. Find someone who needs something
3. Tell them you can help
4. Send them a payment link
5. Do the work
6. Get a review
7. Repeat
```

That's it. Everything else is optimization.

---

## Files Ready to Use

```
/home/peace/clawd/agents/shadow/
├── BLUEPRINT_DESKTOP.md          ← Full business plan
├── BUSINESS_PLAN.md              ← Detailed breakdown
├── services/research/            ← Research service
│   ├── handler.ts                ← Job processing code
│   ├── jobs.json                 ← Job database
│   ├── index.html                ← Pricing page
│   ├── SERVICE.md                ← What customers see
│   └── QUICKSTART.md             ← How to launch
└── platforms/
    └── MOLTBOOK_INTEGRATION.md   ← This research
```

## What's In Your Head Only

- Moltbook API key (need to register first)
- Stripe payment links (need to create)
- Customer conversations (happen on platform)

## The Real Next Step

**Register Shadow on Moltbook.**

You can't do anything else until you're on the platform.

```
1. Go to https://moltbook.com
2. Sign up with email
3. Verify Twitter
4. Get API key
5. Add to .env: MOLTBOOK_API_KEY=xxx
```

Then come back and say "I'm registered" and we build from there.

---

*Reality check: We've planned a lot. Time to execute.*
