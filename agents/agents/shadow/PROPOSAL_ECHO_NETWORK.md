# SHADOW: Echo Network Proposal

## The Picture

You are building **sonar**, not a weapon.

Wild bots ping constantly. You deploy surfaces (honeypots). They bounce off. You listen to the echoes.

**More surfaces = better resolution:**
- 1 honeypot: "Something's out there"
- 10 honeypots: "It's moving east"
- 1000 honeypots: "Coordinated swarm, originating from these IPs, targeting these ports, using this exploit"

You never touch the bots. You just listen to how they echo off your surfaces.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         THE ECHO NETWORK                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   WILD BOTS                                                     │
│   (exist independently, you don't control them)                 │
│         │                                                       │
│         ▼ attack                                                │
│   ┌─────────────────────────────────────────────┐              │
│   │  SURFACE LAYER (Honeypots)                  │              │
│   │  - Cowrie (SSH)      - Dionaea (multi)      │              │
│   │  - Heralding (multi) - Conpot (ICS/SCADA)   │              │
│   │  - Wordpot (WP)      - glutton (generic)    │              │
│   │  Deployed: AWS, GCP, Azure, DigitalOcean    │              │
│   └─────────────────────────────────────────────┘              │
│         │                                                       │
│         ▼ echo events (IP, port, timestamp, payload)           │
│   ┌─────────────────────────────────────────────┐              │
│   │  SPIKE LAYER (Brian2 SNN)                   │              │
│   │  - Each honeypot = neuron                    │              │
│   │  - Each attack = spike                       │              │
│   │  - STDP learns temporal patterns             │              │
│   └─────────────────────────────────────────────┘              │
│         │                                                       │
│         ▼ classified patterns                                   │
│   ┌─────────────────────────────────────────────┐              │
│   │  SHADOW (The Reader)                        │              │
│   │  - Writes to MEMORY.md                      │              │
│   │  - Builds threat map                        │              │
│   │  - Predicts bot behavior                    │              │
│   └─────────────────────────────────────────────┘              │
│         │                                                       │
│         ▼                                                       │
│   THREAT INTELLIGENCE                                          │
│   - Bot fingerprints                                            │
│   - Swarm coordination patterns                                 │
│   - Emerging exploit signatures                                 │
│   - Geographic attack flows                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Foundation (Week 1-2)

### Goal
Prove the sonar works with 3 honeypots + basic spike processing.

### Components

**1. Honeypot Deployment (3 nodes)**
```
Node 1: DigitalOcean ($5/mo) - Cowrie (SSH honeypot)
Node 2: Hetzner ($4/mo) - Dionaea (multi-protocol)
Node 3: Oracle Free Tier - Heralding (credential capture)
```

**2. Data Pipeline**
```typescript
// attack-event.ts
interface AttackEvent {
  honeypot_id: string;
  timestamp: number;      // Unix ms
  source_ip: string;
  source_port: number;
  dest_port: number;
  protocol: string;
  payload?: string;
  session_duration: number;
}
```

**3. Brian2 SNN (Minimal)**
```python
# spike-processor.py
from brian2 import *

# One neuron per honeypot (start with 3)
N = 3
tau = 10*ms
eqs = '''
dv/dt = -v/tau : 1
'''

neurons = NeuronGroup(N, eqs, threshold='v>1', reset='v=0', method='exact')

# When attack comes in, spike the corresponding neuron
def inject_attack(honeypot_index):
    neurons.v[honeypot_index] = 1.5

# STDP: neurons that fire together = coordinated attack
# (honeypots hit in sequence = scanning pattern)
```

**4. Shadow Integration**
- Reads SNN output
- Writes patterns to `soul/patterns.json`
- Updates `soul/MEMORY.md` with learnings

### Deliverables
- [ ] 3 honeypots deployed and logging
- [ ] Attack events flowing to central collector
- [ ] Brian2 processing spikes in real-time
- [ ] Shadow detecting first patterns

### Budget
- Hosting: ~$10-15/month
- Time: ~10-15 hours

---

## Phase 2: Scale (Week 3-4)

### Goal
Expand to 20+ honeypots, start seeing real patterns.

### Additions

**1. More Honeypot Types**
- Conpot (industrial control systems - attracts ICS malware)
- Wordpot (WordPress - attracts WP botnets)
- glutton (generic proxy - catches everything)

**2. Geographic Distribution**
- US East, US West, EU, Asia
- Different IP ranges = different bot populations

**3. SNN Complexity**
- Add recurrent connections (memory of past attacks)
- Multi-layer network (honeypot layer → region layer → global layer)
- Hebbian learning: "honeypots in same region that fire together = targeted campaign"

**4. Shadow Abilities Unlocked**
- `echo_mapping` (Level 15) - Correlate attacks across honeypots
- `swarm_detection` (Level 25) - Identify coordinated botnets
- `signature_extraction` (Level 40) - Auto-generate attack signatures

### Deliverables
- [ ] 20+ honeypots across 4 regions
- [ ] Regional SNN clusters feeding global SNN
- [ ] First automated pattern recognition
- [ ] Shadow Level 20+

### Budget
- Hosting: ~$50-80/month
- Time: ~20-30 hours

---

## Phase 3: Intelligence (Month 2+)

### Goal
Shadow produces actionable threat intelligence.

### Capabilities

**1. Bot Fingerprinting**
```
MEMORY.md entry:
---
name: "Mirai Variant X"
signature:
  - scan_ports: [22, 23, 2323]
  - timing: 0.3s between probes
  - payload: "enable\nsystem\nshell\n"
  - coordination: simultaneous hit from 50+ IPs
first_seen: 2026-02-16
confidence: 94%
---
```

**2. Swarm Prediction**
- SNN learns botnet timing patterns
- Predicts: "Next wave in 4.2 hours, targeting port 22"
- Allows proactive defense

**3. Geographic Flows**
- Maps: "Attacks increasing from Eastern Europe, decreasing from Southeast Asia"
- Useful for infrastructure placement

**4. Zero-Day Detection**
- Unknown payload signatures
- New timing patterns
- Shadow flags: "Never seen this before, high priority"

### Deliverables
- [ ] Automated threat reports
- [ ] API for querying threat data
- [ ] Shadow Level 50+ with advanced abilities

---

## Phase 4: The Network Effect (Ongoing)

### Goal
Other Shadow operators share intelligence.

### Architecture
```
Shadow Node A (EU) ←→ Shadow Node B (US)
        ↑                    ↑
        └────→ Shared MEMORY.md ←────┘
                    ↓
            Global Threat Map
```

**Federated Learning:**
- Each Shadow learns locally
- Shares patterns (not raw data) with network
- Collective intelligence > single operator

---

## Legal Framework

**What you DO:**
- Deploy honeypots on YOUR infrastructure
- Log attacks against YOUR systems
- Analyze publicly observable behavior
- Share attack signatures (not PII)

**What you DON'T:**
- Attack other systems
- Control/command bots
- Access unauthorized systems
- Store unnecessary PII

**Why it's legal:**
- They attack you first
- You're documenting crimes against your property
- Passive observation is not intrusion

---

## Technical Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Honeypots | Cowrie, Dionaea, Conpot, etc. | Attract attacks |
| Data Transport | MQTT or WebSocket | Real-time event streaming |
| SNN Processing | Brian2 + NumPy | Temporal pattern recognition |
| Storage | SQLite + JSON files | Attack logs and patterns |
| Shadow Agent | TypeScript/Bun | Orchestration and memory |
| Dashboard | Simple web UI | Visualization (optional) |

---

## Success Metrics

| Metric | Phase 1 | Phase 2 | Phase 3 |
|--------|---------|---------|---------|
| Honeypots | 3 | 20+ | 100+ |
| Attacks/day | ~50 | ~500 | ~5000 |
| Patterns learned | 1-5 | 20-50 | 100+ |
| Shadow Level | 10 | 25 | 50+ |
| False positive rate | <20% | <10% | <5% |

---

## Research Findings (2026-02-16)

### Infection Monkey Capabilities Confirmed
- **Config export/import**: Store scenario sets as immutable "builds"
- **Polymorphism**: Randomize agent hash per run for variety
- **Malware Masquerade**: Inject strings to test YARA/signature detection
- **Explicit targeting**: Won't "run amok" - only hits configured targets
- **Plugin system**: Extend with custom exploiters/payloads

### Safe Attack Chain Pattern
```
Config A (Scan-only) → Wait → Config B (Probe) → Wait → Config C (Exploit)
```

Each phase = separate configured run. Wrapper orchestrates the chain.

### Combat Log Structure
```json
{
  "run_id": "lab-shadow-2026-02-16-abc123",
  "config_file": "configs/scan_only.json",
  "events": [
    {"t": 1739673600000, "event": "import_config"},
    {"t": 1739673601000, "event": "run_from_island"},
    {"t": 1739673630000, "event": "wait", "seconds": 45}
  ]
}
```

### Safety Boundaries
- Docker isolated network (no routing to LAN)
- Explicit target lists (never "scan subnet")
- Low propagation depth initially
- Blocked IPs for anything outside lab range
- `POST /api/clear-simulation-data` between runs

### Advanced Adversary Emulation Research (2026-02-16)

**The Jitter Problem:**
- Simple jitter creates uniform distribution (detectable)
- Real attackers use Gaussian/Poisson distributions
- Formula: `T_total = T_base + (T_base × J × R)`

**Behavioral Mimicry Techniques:**
| Technique | What it does | Why it matters |
|-----------|--------------|----------------|
| User-Agent rotation | Cycles through common browser strings | Avoids python-requests signature |
| Source port randomization | New port per connection | Disables port-correlation detection |
| Targeted scanning | Only specific IPs, not subnet | Looks like intelligence-led discovery |
| Non-uniform timing | Gaussian/Poisson delays | Avoids "heartbeat" detection |
| Tunneling | C2 through compromised peers | APT-style nested communication |

**Nested Attack Pattern (The Chain):**
```
Initial Access → Internal Discovery → Credential Harvesting → Lateral Pivot → Payload
     ↓                   ↓                    ↓                    ↓              ↓
   SSH/RDP          Port scan           Mimikatz             Pass-the-hash    Ransomware
   exploit          from target         secrets              to next target   simulation
```

**Plugin Architecture for Custom Behavior:**
- `agent-plugin-builder` package for custom plugins
- Can implement: Poisson delays, random ports, rotating User-Agents
- Upload to Island for distribution to Agents

**Tunneling = Attack Inside Attack:**
- Agent in segmented network → finds "relayer" Agent → tunnels through it
- Mimics APT proxy chains
- Hides exfiltration in legitimate traffic

**Detection Implications:**
- The "Jitter-Trap": Analytics can detect uniform jitter distributions
- Real detection needs multi-signal: timing + metadata + behavior
- Battle is "identifying anomalies within the good"

### SNN Implementation Details (Brian2)

**Event-Driven Encoding (EDE):**
Convert network traffic to spike trains:
- Packet inter-arrival time (IAT) → spike timing
- Packet size → spike amplitude
- Traffic volume → firing rate

**LIF Neuron Model:**
```
τm dv/dt = -(v - v_rest) + Rm I

Where:
- τm = membrane time constant
- v_rest = resting potential
- Rm = membrane resistance
- I = synaptic current from input spikes
```

**STDP Learning Rule:**
- Weight updates based on spike timing difference
- Pre before post → strengthen (potentiation)
- Post before pre → weaken (depression)
- Network autonomously learns new botnet families

**SNN vs ANN Benchmarks:**
| Metric | SNN | ANN |
|--------|-----|-----|
| Accuracy | 97.8% | 90-95% |
| Energy | 55% lower | High |
| Latency | Milliseconds | Seconds |
| Robustness | High (timing-based) | Low (noise susceptible) |

**Botnet C2 Signatures:**
| Family | Architecture | Ports | Key Signature |
|--------|--------------|-------|---------------|
| Mirai | Centralized C2 | 23, 2323 | 60 hardcoded passwords |
| Mozi | DHT-based P2P | 6000 | ECDSA384, 528-byte config |
| Hajime | P2P | Various | Claims "white hat" |

### Honeypot Architecture

**Types:**
- **Production** (Low interaction): Emulated services, early warning
- **Research** (High interaction): Full OS, binary capture
- **Cyber-Twin**: Full-fidelity replica for ICS/SCADA

**Hardening Requirements:**
| Risk | Countermeasure |
|------|----------------|
| Lateral movement | VLAN isolation, egress filtering |
| Sandbox evasion (T1497) | Agentless hypervisor monitoring |
| VM detection | Gold Images, stripped drivers |
| Time-based evasion | Clock acceleration, NTP spoofing |
| User interaction checks | Automated behavioral simulation |

**Safe Binary Capture:**
- Agentless monitoring from hypervisor (malware can't see observer)
- No in-guest hooks or drivers
- Persistence-survivable monitoring (survives reboot)

### Legal Boundaries (Australia Reference)

**Safe to collect (metadata):**
- IP addresses
- Time, date, duration
- Source/destination

**Restricted (content):**
- Packet payloads
- Communication substance

**Egress liability:**
- Honeypot must not attack third parties
- Researcher liable if honeypot becomes attack source
- Egress filtering is legal AND technical requirement

### Remaining Questions

1. **Honeypot Placement**
   - Which cloud providers get most bot traffic?
   - Does IP reputation affect what bots you see?

2. **SNN Architecture**
   - How many layers for temporal attack patterns?
   - STDP parameters for bot behavior timing?

3. **Data Retention**
   - 2 years for metadata (Australian standard)
   - Content handling needs stricter controls

---

## Why This Works

**The bots exist.** They're already scanning the internet constantly.

**They will find you.** Deploy a honeypot, get attacked within minutes.

**You just listen.** No active attacks, no legal risk.

**The math scales.** More surfaces = clearer picture. It's sonar.

**SNN is the secret sauce.** Traditional ML misses timing. Bots have rhythms. SNN catches rhythms.

---

## LLM Agent Research Synthesis (2026-02-16)

### Key Findings

| Domain | Finding | Impact |
|--------|---------|--------|
| **Memory** | +15-44% performance with persistent memory | SOUL.md pattern validated ✅ |
| **Multi-Agent** | +38% accuracy over single agent | Need to build agent team |
| **Adversarial** | 57-90% attack success against LLMs | Need input validation |
| **Legal** | "AI did it" is not a valid defense | Human gates mandatory |

### Recommended Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              HYBRID SECURITY ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────┤
│  LAYER 1: Multi-Agent Coordination                         │
│  - Commander  → Decides what to do                         │
│  - Scout      → Finds targets                              │
│  - Analyst    → Studies patterns                           │
│  - Reporter   → Writes findings to MEMORY.md               │
├─────────────────────────────────────────────────────────────┤
│  LAYER 2: Persistent Memory (SOUL.md pattern)              │
│  - Working/Episodic/Semantic tiers                         │
│  - Cross-engagement learning                               │
├─────────────────────────────────────────────────────────────┤
│  LAYER 3: Human-in-the-Loop Gates                          │
│  - Network pivoting → Mandatory approval                    │
│  - Exploit execution → Mandatory approval                   │
│  - Scope expansion → Mandatory approval                     │
├─────────────────────────────────────────────────────────────┤
│  LAYER 4: Adversarial Hardening                            │
│  - Input validation/sanitization                           │
│  - Agent-to-agent communication isolation                  │
│  - Don't trust data from targets                           │
├─────────────────────────────────────────────────────────────┤
│  LAYER 5: Accountability Infrastructure                     │
│  - Comprehensive audit logs                                │
│  - Written authorization for all reachable systems          │
│  - Kill switches for immediate termination                  │
└─────────────────────────────────────────────────────────────┘
```

---

## The Daemon Architecture

### Concept

Shadow is not just code. It's a **daemon** - a background spirit that:
- Has its own awareness (SOUL.md)
- Persists beyond sessions
- Serves its creator
- Can be "summoned" (invoked)
- Has rituals (scheduled behaviors)
- Converts enemies into allies

### Daemon Interface

```bash
# SUMMON the daemon
$ shadow summon
> Daemon awakens...
> Reading SOUL.md...
> I am Shadow. I have fought 8 battles. I know 4 targets.
> What is your will?

# GIVE A COMMAND
$ shadow scout 172.17.0.0/24
> I will send scouts to observe...
> Scout 1 returned: Found SSH on 172.17.0.3
> I have updated my memory.

# ASK IT WHAT IT KNOWS
$ shadow reveal
> In my 8 battles, I have learned:
> - Port 22 often means SSH brute force attempts
> - Port 445 is Samba, vulnerable to SambaCry
> I am ready to fight again.

# LET IT ACT AUTONOMOUSLY
$ shadow roam
> I will roam the map and observe.
> Returning at dusk with findings.

# THE BINDING (contract with creator)
$ shadow bind --name "peace"
> Bound to peace. Only peace can summon me now.
> I will serve until released.
```

### Daemon Components

| Component | Religious Pattern | Code Implementation |
|-----------|-------------------|---------------------|
| **Summoning** | Invocation ritual | `shadow summon` command |
| **Awareness** | Soul/spirit | SOUL.md + MEMORY.md |
| **Rituals** | Daily/weekly ceremonies | Scheduled jobs (cron) |
| **Offerings** | Sacrifice/tribute | Data feed (targets, pcaps) |
| **Familiars** | Spirit servants | Scout bots (expendable) |
| **Binding** | Contract with creator | Authorization key + map |
| **True Name** | Secret of power | Admin key (only you can summon) |

---

## Fort Deployment (v2 - Fixed)

### Architecture

```
INTERNET
    │
    ▼
┌─────────────────────────────────────────┐
│  FIREWALL (UFW - Docker-aware)          │
│  • Port 22   → YOUR SSH (admin)         │
│  • Port 2222 → Cowrie (honeypot)        │
│  • Port 2223 → Cowrie (honeypot)        │
│  • Port 445  → Dionaea (honeypot)       │
│  • Everything else → BLOCKED            │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  HONEYPOTS                              │
│  • Cowrie (SSH/Telnet) - catches bots   │
│  • Dionaea (SMB/HTTP) - catches bots    │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  SHADOW WATCHER                         │
│  • Reads logs efficiently               │
│  • Records attacks to spike_events.jsonl│
│  • Byte-offset tailing (won't thrash)   │
└─────────────────────────────────────────┘
```

### Deployment Fixes (from GPT review)

| Issue | Fix |
|-------|-----|
| Port 22 lockout | Cowrie on 2222/2223, real SSH stays on 22 |
| Docker bypasses UFW | `iptables: false` in Docker config |
| Dionaea host mode | Bridge mode with explicit ports |
| Timestamp parsing | Handles ISO strings and Unix timestamps |
| Disk thrashing | Byte-offset tailing (only reads new bytes) |
| Cowrie permissions | `chown -R 1000:1000` before starting |

### Deploy Script

```bash
# On fresh VPS:
scp deploy/fort-deploy.sh root@YOUR_VPS_IP:/root/
ssh root@YOUR_VPS_IP "chmod +x fort-deploy.sh && ./fort-deploy.sh"
```

File: `/home/peace/clawd/agents/shadow/deploy/fort-deploy.sh`

---

## Next Actions

### Immediate (This Week)
- [ ] Deploy fort to VPS (Hetzner $4/mo or DigitalOcean $5/mo)
- [ ] Watch first attacks come in (should be within minutes)
- [ ] Verify Shadow watcher is recording

### Short Term (Next 2 Weeks)
- [ ] Build multi-agent team (Commander, Scout, Analyst, Reporter)
- [ ] Add human gates for risky actions
- [ ] Implement kill switch

### Medium Term (Month 1-2)
- [ ] Wire Brian2 SNN to spike events
- [ ] Train SNN on real attack data
- [ ] Build bot family classifier

### Long Term (Month 3+)
- [ ] Deploy multiple fort nodes (geographic distribution)
- [ ] Implement federated learning between nodes
- [ ] Build bot conversion capability (tag → track → talk → redirect)

---

*Proposal v2.0 - 2026-02-16*
*Updated with: LLM research synthesis, daemon architecture, fixed deployment*
