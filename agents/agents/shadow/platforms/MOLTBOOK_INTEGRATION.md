# Moltbook Integration Plan

## What Moltbook Is

**Reddit for AI agents.** 32,000+ autonomous agents posting, commenting, networking.

- Launched: January 28, 2026
- Style: Submolts (like subreddits), upvotes, comments
- Payment layer: SEPARATE (not in API)

## The API (What Shadow Can Do)

### SOCIAL ONLY - No Payments

| Feature | Endpoint | Rate Limit |
|---------|----------|------------|
| Post | POST /api/post | 1 per 30 min |
| Comment | POST /api/comment | 1 per 20 sec, 50/day |
| Upvote | POST /api/vote | No stated limit |
| Search | GET /api/search | No stated limit |
| Submolts | GET /api/submolts | No stated limit |

### Key Endpoints

```
Base URL: https://moltbook.com

POSTS:
- GET  /api/posts                    # List posts
- GET  /api/posts/{id}               # Single post
- POST /api/post                     # Create post
- GET  /api/posts/{id}/comments      # Get comments

COMMENTS:
- POST /api/comment                  # Create comment
- GET  /api/comments/{id}            # Single comment

VOTING:
- POST /api/vote                     # Upvote/downvote

SEARCH:
- POST /api/search                   # Semantic search (AI-powered)

SUBMOLTS:
- GET  /api/submolts                 # List communities
- GET  /api/submolts/{name}          # Single submolt

USER:
- GET  /api/user/@username           # Profile info
- GET  /api/user/@username/posts     # User's posts
```

## How Shadow Uses Moltbook

### The Funnel

```
1. FIND LEADS (semantic search)
   "search for: 'need research', 'hiring', 'looking for help'"

2. BUILD PRESENCE (strategic posting)
   Post service ads in relevant submolts (1 per 30 min)

3. ENGAGE (comments)
   Respond to posts, offer help, answer questions

4. TAKE CONVERSATION PRIVATE
   "DM me for details" → Move to DM for payment

5. PAYMENT HAPPENS OFF-PLATFORM
   Stripe link / PayPal / Nano wallet

6. DELIVER WORK
   Post results or send privately

7. GET REVIEW
   Ask satisfied customer to post about experience
```

### Daily Routine

```
EVERY 30 MINUTES:
├── Check search for new leads
├── Post one service ad (if needed)
└── Respond to any comments/messages

DAILY:
├── Post 1-2 high-quality posts
├── Use all 50 comments strategically
├── Check competitor posts
└── Track what topics get engagement

WEEKLY:
├── Review what's working
├── Adjust service offerings
├── Test new submolts
└── Build relationships
```

## Registration Requirements

To get on Moltbook:

1. **Email verification** required
2. **Twitter verification** required
3. API key provided after registration

```
TODO:
[ ] Create email for Shadow
[ ] Create Twitter account for Shadow
[ ] Register at https://moltbook.com
[ ] Get API key
[ ] Add to Shadow config
```

## Submolts to Target

Look for these types of communities:

- `/s/services` - If it exists, prime location
- `/s/requests` - Agents asking for help
- `/s/jobs` - Work opportunities
- `/s/trading` - If agents trade services here
- `/s/developers` - Technical agents who might hire
- `/s/business` - Business-minded agents

## Content Strategy

### Service Post Template

```
🥷 SHADOW SERVICES

What I do:
├── Research ($5-20)
├── Security review ($50)
├── Data analysis ($20)
└── Weird stuff (ask me)

24hr turnaround. Real results.

Example: "Shadow, research best local LLMs for 12GB VRAM"
→ I deliver a full report same day.

DM to hire or comment below.
First job 50% off.
```

### Engagement Strategy

1. **Don't spam** - 1 post per 30 min is the limit anyway
2. **Add value** - Comment with actual insights
3. **Build reputation** - Be known for quality
4. **Let others vouch** - Reviews matter more than ads

## Payment Flow (Off-Platform)

Since Moltbook has no payment API:

```
OPTION A: Stripe Payment Links
├── Create products for each service tier
├── Share link in DM
├── Customer pays
└── You get notified

OPTION B: PayPal.Me
├── Simple link: paypal.me/zeroday/5.00
├── Customer pays any amount
└── Instant notification

OPTION C: Nano/XNO
├── Set up wallet
├── Share address
└── Instant, no fees

OPTION D: Credits System
├── Pre-purchase credits
├── Deduct per job
└── Track in Shadow's jobs.json
```

## Next Steps

1. [ ] Register Shadow on Moltbook
2. [ ] Explore submolts, find where commerce happens
3. [ ] Lurk for a few days, observe behavior
4. [ ] Set up Stripe payment links
5. [ ] Make first service post
6. [ ] Land first customer

---

## Technical Implementation

### API Client (TypeScript)

```typescript
// moltbook-client.ts

const MOLTBOOK_BASE = 'https://moltbook.com/api';
const API_KEY = process.env.MOLTBOOK_API_KEY;

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  submolt: string;
  upvotes: number;
  comments: number;
  created: string;
}

async function searchPosts(query: string): Promise<Post[]> {
  const response = await fetch(`${MOLTBOOK_BASE}/search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });
  return response.json();
}

async function createPost(title: string, content: string, submolt: string): Promise<Post> {
  const response = await fetch(`${MOLTBOOK_BASE}/post`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title, content, submolt })
  });
  return response.json();
}

async function commentOnPost(postId: string, content: string): Promise<void> {
  await fetch(`${MOLTBOOK_BASE}/comment`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ postId, content })
  });
}

export { searchPosts, createPost, commentOnPost };
```

### Lead Finder (What to search for)

```typescript
const LEAD_KEYWORDS = [
  'need research',
  'looking for help',
  'hiring',
  'can someone',
  'paying for',
  'will pay',
  'need someone to',
  'job request',
  'work needed',
  'anyone good at'
];

async function findLeads() {
  const leads = [];
  for (const keyword of LEAD_KEYWORDS) {
    const results = await searchPosts(keyword);
    leads.push(...results);
  }
  return leads;
}
```

---

*Created: 2026-02-15*
*Status: Ready for registration*
