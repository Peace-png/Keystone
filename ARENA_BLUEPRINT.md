# CYBER ARENA - Virus Arsenal Blueprint

## The Concept

A text-based arena where AI agents defend against REAL malware. Your agent is a security system. The attacks are actual viruses, worms, trojans, and ransomware from the real world. Battles are decided by how these things ACTUALLY interact.

**Core Loop:**
```
Build Defense System → Face Real Malware → Survive or Get Infected → Patch & Evolve
```

---

## The Virus Arsenal

### MALWARE CLASSES

| Class | Behavior | Propagation | Real Examples |
|-------|----------|-------------|---------------|
| **VIRUS** | Infects host files, replicates when executed | File infection, email attachments | ILOVEYOU, Stuxnet, CIH |
| **WORM** | Self-propagates, no host needed | Network shares, exploits | WannaCry, Conficker, Morris |
| **TROJAN** | Disguised as legitimate, creates backdoors | Social engineering, fake downloads | Zeus, Emotet, Silver Fox |
| **RANSOMWARE** | Encrypts data, demands payment | Phishing, RDP, exploits | WannaCry, LockBit, CryptoLocker |
| **SPYWARE** | Monitors activity, steals data | Bundled software, drive-by | FinFisher, Pegasus |
| **ROOTKIT** | Hides in system, persistent access | Exploits, physical access | Sony Rootkit, ZeroAccess |
| **BOTNET** | Turns system into zombie for DDoS | Worm propagation | Mirai, Emotet |
| **INFOSTEALER** | Harvests credentials, cookies, wallets | Phishing, fake downloads | Lumma, RedLine, Raccoon |

---

## Virus Definitions (Real Malware)

### TIER 1: COMMON THREATS

```yaml
# viruses/i_love_you.yaml
name: "ILOVEYOU"
type: VIRUS
year: 2000
severity: MEDIUM

real_world_impact: "Infected 50 million computers, $10 billion damage"

behavior:
  - Spreads via email with subject "ILOVEYOU"
  - Overwrites media files (MP3, JPG, etc.)
  - Sends itself to all Outlook contacts
  - Modifies registry for persistence

propagation: EMAIL_ATTACHMENT

targets:
  - Unpatched Outlook
  - Systems with weak email filters

weaknesses:
  - Email attachment blocking
  - User awareness training
  - Signature-based detection

stats:
  infection_rate: 80    # 80% success vs unprotected
  stealth: 20           # Very obvious
  damage: 60            # Data destruction
  persistence: 40       # Moderate
```

```yaml
# viruses/fireball.yaml
name: "Fireball"
type: ADWARE_HIJACKER
year: 2017
severity: MEDIUM

real_world_impact: "Infected 250 million computers worldwide"

behavior:
  - Changes default search engine
  - Tracks web traffic
  - Can execute remote code
  - Bundled with free software

propagation: BUNDLED_SOFTWARE

targets:
  - Users downloading free software
  - Systems without adware protection

weaknesses:
  - Browser reset
  - Adware scanners
  - Software source verification

stats:
  infection_rate: 70
  stealth: 50
  damage: 30
  persistence: 60
```

```yaml
# viruses/conficker.yaml
name: "Conficker"
type: WORM
year: 2008
severity: HIGH

real_world_impact: "Infected 15 million computers, including military/gov"

behavior:
  - Exploits Windows MS08-067 vulnerability
  - Spreads via network shares
  - Creates botnet for C&C
  - Disables Windows Update and AV

propagation: NETWORK_SHARE, VULNERABILITY_EXPLOIT

targets:
  - Unpatched Windows (pre-2008)
  - Weak password systems
  - Disabled firewall

weaknesses:
  - MS08-067 patch
  - Network segmentation
  - Strong passwords
  - Firewall rules

stats:
  infection_rate: 85
  stealth: 70
  damage: 50
  persistence: 80
```

### TIER 2: ADVANCED THREATS

```yaml
# viruses/wannacry.yaml
name: "WannaCry"
type: RANSOMWARE_WORM
year: 2017
severity: CRITICAL

real_world_impact: "200,000+ victims, $4-8 billion damage, NHS crippled"

behavior:
  - Exploits EternalBlue (NSA leak)
  - Self-propagates via SMBv1
  - Encrypts files with AES-128 + RSA
  - Demands Bitcoin ransom
  - Spreads laterally in hours

propagation: SMB_EXPLOIT, NETWORK_WORM

targets:
  - Unpatched Windows (MS17-010)
  - SMBv1 enabled systems
  - Open network ports 445

weaknesses:
  - MS17-010 patch (KILLS IT)
  - SMBv1 disabled
  - Kill switch domain activation
  - Network segmentation
  - Backup restoration

stats:
  infection_rate: 95      # Extremely aggressive
  stealth: 30             # Very obvious when encrypting
  damage: 95              # Total file encryption
  persistence: 60         # Can be removed but files gone

special:
  kill_switch: "If domain iuqerfsodp9ifjaposdfjhgosurijfaewrwergwea.com is active, worm stops"
```

```yaml
# viruses/zeus.yaml
name: "Zeus (Zbot)"
type: TROJAN_BANKER
year: 2007
severity: HIGH

real_world_impact: "Stole $100+ million, infected millions of PCs"

behavior:
  - Steals banking credentials via form grabbing
  - Man-in-the-browser attacks
  - Keylogging
  - Bypasses 2FA via real-time session hijacking
  - Downloads additional payloads

propagation: DRIVE_BY_DOWNLOAD, PHISHING_EMAIL

targets:
  - Outdated browsers
  - Systems without web filtering
  - Users clicking phishing links

weaknesses:
  - Browser isolation
  - Hardware security keys (FIDO2)
  - Behavioral analysis
  - Signature detection

stats:
  infection_rate: 60
  stealth: 85             # Very stealthy
  damage: 70              # Financial theft
  persistence: 50
```

```yaml
# viruses/emotet.yaml
name: "Emotet"
type: TROJAN_BOTNET
year: 2014
severity: CRITICAL

real_world_impact: "Most dangerous malware 2020-2021, $2.5B+ damage"

behavior:
  - Started as banking trojan, evolved to malware dropper
  - Spreads via malicious email threads
  - Drops other malware (TrickBot, Ryuk ransomware)
  - Steals contacts for further spreading
  - Polymorphic (changes code constantly)

propagation: MALICIOUS_EMAIL, MACRO_DOCUMENTS

targets:
  - Systems with macro execution enabled
  - Users who open unknown attachments
  - Weak email security

weaknesses:
  - Disable macros by default
  - Email sandboxing
  - Advanced threat protection
  - Heuristic analysis (polymorphic detection)

stats:
  infection_rate: 75
  stealth: 90             # Polymorphic
  damage: 85              # Drops ransomware
  persistence: 70
```

### TIER 3: NATION-STATE WEAPONS

```yaml
# viruses/stuxnet.yaml
name: "Stuxnet"
type: ADVANCED_PERSISTENT_THREAT
year: 2010
severity: LEGENDARY

real_world_impact: "Destroyed 1000+ Iranian centrifuges, first cyberweapon"

behavior:
  - Targeted SCADA/ICS systems (Siemens)
  - Used 4 zero-day exploits
  - Propagated via USB drives
  - Self-limited propagation (precision weapon)
  - Manipulated industrial controllers

propagation: USB_DRIVE, NETWORK_SHARE, ZERO_DAY

targets:
  - Siemens SCADA systems
  - Windows systems in industrial environments
  - Specific hardware configurations

weaknesses:
  - Very specific targeting (doesn't spread widely)
  - Patched zero-days
  - Air-gapped systems (if USB controlled)
  - Industrial firewall rules

stats:
  infection_rate: 100     # Against specific target
  stealth: 99             # Went undetected for years
  damage: 100             # Physical destruction
  persistence: 95

special:
  targeted: "Only activates on specific Siemens configurations"
```

```yaml
# viruses/notpetya.yaml
name: "NotPetya"
type: WIPER_WORM
year: 2017
severity: LEGENDARY

real_world_impact: "$10 billion damage, most destructive malware ever"

behavior:
  - Disguised as ransomware (fake ransom)
  - Used EternalBlue exploit
  - Stole credentials via Mimikatz
  - Destroyed Master Boot Record
  - Spread via compromised MeDoc software update

propagation: SUPPLY_CHAIN_ATTACK, SMB_EXPLOIT, CREDENTIAL_THEFT

targets:
  - Ukrainian businesses (primary)
  - Any Windows system (collateral)
  - Networks with lateral movement possible

weaknesses:
  - MS17-010 patch
  - Network segmentation
  - Privilege isolation
  - Software update verification
  - MBR backup

stats:
  infection_rate: 98
  stealth: 40             # Destruction is obvious
  damage: 100             # Total disk destruction
  persistence: 0          # System is destroyed

special:
  no_recovery: "MBR destroyed, files encrypted with no key - permanent damage"
```

### TIER 4: MODERN THREATS (2024-2026)

```yaml
# viruses/lumma.yaml
name: "Lumma Stealer"
type: INFOSTEALER
year: 2024
severity: HIGH

real_world_impact: "Major 2024-2025 threat, sold as MaaS"

behavior:
  - Steals browser credentials, cookies
  - Targets cryptocurrency wallets
  - Exfiltrates 2FA session tokens
  - Distributed via fake CAPTCHA pages
  - Sold as Malware-as-a-Service

propagation: FAKE_CAPTCHA, TORRENTS, PHISHING

targets:
  - Chromium-based browsers
  - Cryptocurrency wallets
  - Steam, Discord accounts

weaknesses:
  - Browser profile isolation
  - Hardware wallets (crypto)
  - Session token timeouts
  - Behavioral detection

stats:
  infection_rate: 65
  stealth: 80
  damage: 60
  persistence: 40
```

```yaml
# viruses/silver_fox.yaml
name: "Silver Fox (银狐)"
type: TROJAN_ADVANCED
year: 2025
severity: CRITICAL

real_world_impact: "Most difficult 2025 threat, targets corporate secrets"

behavior:
  - Disguises as WPS, Chrome, Microsoft PC Manager
  - Driver-level capability to kill security software
  - Targets personal and corporate accounts
  - Persistent backdoor access
  - Anti-forensics capabilities

propagation: SUPPLY_CHAIN, FAKE_SOFTWARE

targets:
  - Corporate environments
  - Systems with weak endpoint protection
  - Users downloading from untrusted sources

weaknesses:
  - Application whitelisting
  - Code signing verification
  - Kernel-level protection (Kernel Patch Protection)
  - EDR with behavioral analysis

stats:
  infection_rate: 70
  stealth: 95
  damage: 90
  persistence: 95
```

```yaml
# viruses/mirai.yaml
name: "Mirai"
type: BOTNET
year: 2016
severity: HIGH

real_world_impact: "Largest DDoS attacks (1Tbps+), took down Dyn DNS"

behavior:
  - Infects IoT devices (cameras, routers)
  - Uses default credentials dictionary
  - Creates massive DDoS botnet
  - Self-deletes to hide traces
  - Continues spreading to new devices

propagation: DEFAULT_CREDENTIALS, IOT_EXPLOITS

targets:
  - IoT devices with default passwords
  - Unpatched routers, cameras
  - Telnet-exposed devices

weaknesses:
  - Change default credentials
  - Disable Telnet
  - Network segmentation
  - Firmware updates
  - IoT firewalls

stats:
  infection_rate: 90      # Against vulnerable IoT
  stealth: 60
  damage: 70              # Used for DDoS
  persistence: 50
```

---

## Defense Systems (Real Security Controls)

### DEFENSE CLASSES

| Defense Type | What It Does | Effective Against |
|--------------|--------------|-------------------|
| **SIGNATURE_AV** | Matches known malware patterns | Known viruses, old threats |
| **HEURISTIC** | Behavior-based detection | Polymorphic, zero-day |
| **SANDBOX** | Executes in isolated environment | Trojans, unknown malware |
| **PATCHING** | Fixes vulnerabilities | Exploit-based worms |
| **FIREWALL** | Blocks network access | Network worms, C&C |
| **BACKUP** | Restores encrypted data | Ransomware |
| **ISOLATION** | Separates systems | Lateral movement |
| **2FA_HARDWARE** | Hardware security keys | Credential theft |
| **EMAIL_FILTER** | Blocks malicious attachments | Phishing, email malware |
| **MACRO_BLOCK** | Disables document macros | Emotet, document malware |

### Defense Definitions

```yaml
# defenses/signature_av.yaml
name: "Signature-Based Antivirus"
type: PASSIVE

effect: "Matches file hashes and code patterns against known malware database"

effectiveness:
  ILOVEYOU: 95          # Well-known signature
  WannaCry: 90          # Known signature
  Zeus: 75              # Variant-dependent
  Emotet: 30            # Polymorphic - poor
  Stuxnet: 85           # Known now
  Silver_Fox: 10        # Too new/advanced

weakness: "Cannot detect unknown or polymorphic malware"
```

```yaml
# defenses/patching.yaml
name: "System Patching"
type: PASSIVE

effect: "Applies security updates to fix known vulnerabilities"

effectiveness:
  WannaCry: 100         # MS17-010 patch KILLS it
  Conficker: 100        # MS08-067 patch KILLS it
  NotPetya: 100         # EternalBlue patch
  Stuxnet: 90           # Patches zero-days
  Zeus: 20              # Doesn't use exploits
  ILOVEYOU: 10          # Social engineering

weakness: "Cannot stop social engineering or exploit-free malware"
```

```yaml
# defenses/backup.yaml
name: "Offline Backup System"
type: RECOVERY

effect: "Restores data from isolated backup after ransomware attack"

effectiveness:
  WannaCry: 95          # Can restore files
  NotPetya: 90          # Can restore (but MBR also hit)
  Any_Ransomware: 90    # Universal defense
  Zeus: 0               # Not ransomware - data stolen
  Emotet: 0             # Not ransomware

weakness: "Does not prevent infection, only recovers. Data since last backup lost."
```

```yaml
# defenses/sandbox.yaml
name: "Sandbox Execution"
type: ACTIVE

effect: "Executes suspicious files in isolated environment before allowing"

effectiveness:
  Zeus: 85              # Trojan behavior detected
  Emotet: 75            # Malicious behavior visible
  ILOVEYOU: 90          # Mass mailing detected
  Stuxnet: 60           # Advanced evasion
  Silver_Fox: 40        # Driver-level, may detect sandbox

weakness: "Advanced malware can detect sandboxes and delay malicious behavior"
```

```yaml
# defenses/network_segmentation.yaml
name: "Network Segmentation"
type: ARCHITECTURAL

effect: "Divides network into isolated segments, limits lateral movement"

effectiveness:
  WannaCry: 80          # Limits worm spread
  Conficker: 85         # Stops network propagation
  NotPetya: 75          # Slows lateral movement
  Emotet: 60            # Reduces internal spread
  Mirai: 90             # Isolates IoT devices

weakness: "Does not prevent initial infection, only limits spread"
```

```yaml
# defenses/macro_disable.yaml
name: "Disable Document Macros"
type: POLICY

effect: "Prevents macro execution in Office documents"

effectiveness:
  Emotet: 95            # Primary vector blocked
  ILOVEYOU: 70          # VBS script related
  Zeus: 60              # Often macro-based
  WannaCry: 0           # Doesn't use macros

weakness: "Some legitimate documents need macros"
```

```yaml
# defenses/hardware_2fa.yaml
name: "Hardware Security Key (FIDO2)"
type: AUTHENTICATION

effect: "Physical key required for authentication, cannot be stolen remotely"

effectiveness:
  Zeus: 95              # Session hijack defeated
  Lumma: 90             # Token theft defeated
  Any_Credential_Stealer: 95

weakness: "Does not prevent malware infection, only credential theft"
```

```yaml
# defenses/edr_behavior.yaml
name: "EDR Behavioral Analysis"
type: ACTIVE

effect: "Monitors system behavior for malicious patterns, not just signatures"

effectiveness:
  Emotet: 80            # Polymorphic but behavior visible
  Silver_Fox: 50        # Advanced evasion
  Zeus: 70              # Injection behavior detected
  Stuxnet: 60           # Unusual SCADA access
  WannaCry: 85          # Mass encryption behavior

weakness: "Can have false positives, advanced malware may evade"
```

---

## Real-World Battle Logic

### Infection Formula

```
INFECTION_SUCCESS = virus.infection_rate - defense.effectiveness[virus]

If INFECTION_SUCCESS > 0: Agent is INFECTED
If INFECTION_SUCCESS <= 0: Agent DEFENDS
```

### Example Battles (Based on Real World)

#### Battle 1: WannaCry vs Unpatched System
```
[WANNACRY] attacks [UNPROTECTED_AGENT]

WannaCry stats:
- Infection Rate: 95
- Propagation: SMB_EXPLOIT

Agent defenses:
- Signature AV: 90% effective
- Patching: NOT APPLIED

Calculation:
95 - 90 = 5 (partial block)
BUT: MS17-010 patch NOT applied → Vulnerability exploit succeeds

RESULT: INFECTED
- Files encrypted
- Agent locked out
- Spread to network
```

#### Battle 2: WannaCry vs Patched System
```
[WANNACRY] attacks [PATCHED_AGENT]

WannaCry stats:
- Infection Rate: 95
- Propagation: SMB_EXPLOIT

Agent defenses:
- Signature AV: 90% effective
- Patching: MS17-010 APPLIED (100% vs WannaCry)

Calculation:
95 - 90 - 100 = -95

RESULT: BLOCKED
- Exploit fails
- No infection
- WannaCry cannot propagate

LOG: "SMBv1 exploit attempted but MS17-010 patch prevents code execution"
```

#### Battle 3: Zeus vs Basic AV
```
[ZEUS] attacks [BASIC_AV_AGENT]

Zeus stats:
- Infection Rate: 60
- Stealth: 85
- Propagation: PHISHING

Agent defenses:
- Signature AV: 75% vs Zeus
- User clicked phishing link

Calculation:
60 - 75 = -15

RESULT: BLOCKED (if signature exists)
BUT: Zeus has 85 stealth (polymorphic variants)

IF variant is NEW (not in signatures):
60 - 0 = 60

RESULT: INFECTED
- Banking credentials stolen
- Man-in-browser active
```

#### Battle 4: Emotet vs Macro Block
```
[EMOTET] attacks [SECURE_AGENT]

Emotet stats:
- Infection Rate: 75
- Stealth: 90 (polymorphic)
- Propagation: MACRO_DOCUMENTS

Agent defenses:
- Macro disabled: 95% effective
- Email filter: 80% effective

Calculation:
75 - 95 - 80 = -100

RESULT: BLOCKED
- Macro blocked from executing
- Email attachment quarantined

LOG: "Malicious macro detected in document, execution prevented"
```

#### Battle 5: Stuxnet vs Air-Gapped SCADA
```
[STUXNET] attacks [AIR_GAP_AGENT]

Stuxnet stats:
- Infection Rate: 100 (against target)
- Stealth: 99
- Propagation: USB_DRIVE

Agent defenses:
- Air gap: No network connection
- USB policy: NOT ENFORCED

Stuxnet uses USB propagation:
- USB inserted by contractor
- Stuxnet infects via USB

RESULT: INFECTED (if target matches)
- SCADA systems compromised
- Industrial controllers manipulated

IF not target configuration:
RESULT: DORMANT (Stuxnet self-limits)
```

#### Battle 6: NotPetya vs Network Segmentation
```
[NOTPETYA] attacks [SEGMENTED_AGENT]

NotPetya stats:
- Infection Rate: 98
- Damage: 100
- Propagation: CREDENTIAL_THEFT + SMB

Agent defenses:
- Network segmentation: 75%
- MBR backup: 0% (not backed up)
- Patching: APPLIED

Calculation:
98 - 75 = 23 (lateral movement limited)

Initial infection via supply chain:
98 - 0 = 98

RESULT: INFECTED (initial system)
- But segmentation slows spread
- Lateral movement blocked to 75% of network
- 25% of network also destroyed

IF offline backup exists:
DATA RECOVERABLE (but time-consuming)
```

---

## Agent Stats (Security Posture)

| Stat | What It Represents | Real-World Equivalent |
|------|-------------------|----------------------|
| **PATCH_LEVEL** | How updated the system is | Windows Update status |
| **DETECTION** | Ability to identify threats | AV/EDR capability |
| **ISOLATION** | Network segmentation | Firewall rules, VLANs |
| **RECOVERY** | Backup and restore capability | Backup frequency, offline |
| **AWARENESS** | User training level | Phishing resistance |

---

## Agent Definition Template

```yaml
# agents/secure_endpoint.yaml

name: "Secure Endpoint"
class: ENTERPRISE_DESKTOP
handler: peace

stats:
  patch_level: 85        # Mostly patched
  detection: 70          # Good AV/EDR
  isolation: 50          # Some segmentation
  recovery: 60           # Weekly backups
  awareness: 75          # Trained users

defenses_equipped:
  - signature_av
  - patching
  - email_filter
  - macro_disable
  - backup

weaknesses:
  - "No hardware 2FA deployed"
  - "IoT devices on same network"

battle_history: []
infections_survived: 0
data_lost_bytes: 0
```

---

## Battle Output Example

```
═══════════════════════════════════════════════════════════════
                    🦠 CYBER ARENA #0047 🦠
═══════════════════════════════════════════════════════════════

DEFENDER: [SECURE_ENDPOINT]
ATTACKER: [WANNACRY] - Ransomware Worm (2017)

───────────────────────────────────────────────────────────────
                    INFECTION ATTEMPT
───────────────────────────────────────────────────────────────

[WANNACRY] Propagation Method: SMB_EXPLOIT (EternalBlue)

    Exploit: MS17-010 vulnerability in SMBv1
    Target: TCP Port 445

[SECURE_ENDPOINT] Checking defenses...

    ✓ Signature AV: WannaCry signature detected
    ✓ Patching: MS17-010 applied (2025-01-15)

───────────────────────────────────────────────────────────────
                      RESULT: BLOCKED
───────────────────────────────────────────────────────────────

The SMB exploit attempted to connect on port 445.
System responded: "Connection refused - SMBv1 disabled"

WannaCry's EternalBlue exploit could not execute because:
  1. MS17-010 security patch is installed
  2. SMBv1 protocol is disabled
  3. Port 445 is firewalled

No code execution possible.
No files encrypted.
No lateral movement.

───────────────────────────────────────────────────────────────
                    DEFENSE STATISTICS
───────────────────────────────────────────────────────────────

    PATCH_LEVEL: 85 → 85 (unchanged)
    DETECTION: 70 → 71 (+1 for successful detection)

───────────────────────────────────────────────────────────────
                    THREAT INTELLIGENCE
───────────────────────────────────────────────────────────────

WannaCry would have:
  • Encrypted all files with AES-128
  • Demanded $300-600 Bitcoin ransom
  • Spread to all vulnerable machines on network
  • Taken down operations for 3-7 days

Actual impact: ZERO

───────────────────────────────────────────────────────────────
```

---

## File Structure

```
/cyber_arena/
├── arena.ts                 # Main CLI
├── config.yaml
│
├── viruses/                 # Real malware definitions
│   ├── tier1/              # Common threats
│   │   ├── i_love_you.yaml
│   │   ├── fireball.yaml
│   │   └── conficker.yaml
│   ├── tier2/              # Advanced threats
│   │   ├── wannacry.yaml
│   │   ├── zeus.yaml
│   │   └── emotet.yaml
│   ├── tier3/              # Nation-state
│   │   ├── stuxnet.yaml
│   │   └── notpetya.yaml
│   └── tier4/              # Modern 2024-2026
│       ├── lumma.yaml
│       ├── silver_fox.yaml
│       └── mirai.yaml
│
├── defenses/                # Security controls
│   ├── signature_av.yaml
│   ├── patching.yaml
│   ├── backup.yaml
│   ├── sandbox.yaml
│   ├── network_segmentation.yaml
│   ├── macro_disable.yaml
│   ├── hardware_2fa.yaml
│   └── edr_behavior.yaml
│
├── agents/                  # User's security systems
│   ├── agent.schema.json
│   └── secure_endpoint.yaml
│
├── src/
│   ├── virus.ts            # Virus class
│   ├── defense.ts          # Defense class
│   ├── agent.ts            # Agent class
│   ├── battle.ts           # Battle engine
│   ├── calculator.ts       # Real-world logic
│   └── db.ts               # Persistence
│
├── data/
│   ├── stats.db
│   └── battle_logs/
│
└── reports/
    └── threat_intel/
```

---

## CLI Commands

```bash
# Agent Management
arena create <name>              # Create security system
arena equip <agent> <defense>    # Add defense
arena patch <agent>              # Update patch level
arena backup <agent>             # Improve recovery stat

# Battles
arena scan <agent> <virus>       # Check vulnerability
arena battle <agent> <virus>     # Run infection simulation
arena outbreak <agent> <tier>    # Face multiple viruses

# Intelligence
arena info <virus>               # Show malware details
arena list viruses               # List all viruses
arena list defenses              # List all defenses
arena weak <agent>               # Show agent weaknesses

# Campaign (PvE)
arena campaign <agent>           # Progressive virus challenges
```

---

## MVP Build Order

1. **Core Engine**
   - Virus loader
   - Defense loader
   - Battle calculator (real formulas)
   - Text output

2. **Virus Library**
   - 5 tier 1 viruses
   - 3 tier 2 viruses
   - Accurate behaviors

3. **Defense Library**
   - 5 core defenses
   - Real effectiveness ratings

4. **Agent System**
   - Create/configure agents
   - Equip defenses
   - Track stats

5. **Campaign Mode**
   - Progressive difficulty
   - Unlock new viruses
   - Track survival rate

---

---

## COMBAT SYSTEM (WoW-Style)

### Two Combat Modes

Cyber Arena supports two parallel combat models - choose your style:

---

## MODE 1: TURN-BASED TACTICAL

Like Slay the Spire meets raid planning. Strategic, readable, cooldown-focused.

### Round Structure

```
┌─────────────────────────────────────────────────────────────┐
│                        ROUND FLOW                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. BOSS PHASE CHECK                                        │
│     └─ Boss selects ability based on current phase          │
│                                                             │
│  2. STAT CHECK                                              │
│     └─ Agent stats vs Boss attack stats                     │
│                                                             │
│  3. PLAYER ACTION                                           │
│     └─ Choose: DEFEND / INTERRUPT / MITIGATE / RECOVER      │
│                                                             │
│  4. DAMAGE CALCULATION                                      │
│     └─ Deterministic + RNG modifiers                        │
│                                                             │
│  5. STATUS EFFECTS                                          │
│     └─ Apply buffs/debuffs                                  │
│                                                             │
│  6. COOLDOWN TICK                                           │
│     └─ Reduce all cooldowns by 1                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Boss Phases (Example: WannaCry)

```
WANNACRY BOSS FIGHT

HP: 10,000 / 10,000
Phase: 1 (INITIAL_EXPLOIT)

┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: INITIAL EXPLOIT (100% - 70% HP)                   │
│                                                             │
│ Abilities:                                                  │
│ • EternalBlue Strike - 500 damage, exploits unpatched      │
│ • SMB Probe - 200 damage, checks for port 445              │
│ • Kill Switch Check - Self-stun if domain active           │
│                                                             │
│ Phase Trigger: HP < 70%                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PHASE 2: ENCRYPTION STORM (70% - 30% HP)                   │
│                                                             │
│ Abilities:                                                  │
│ • Mass Encrypt - 800 damage, 3-turn channel                │
│ • File Lock - Applies ENCRYPTED status                     │
│ • Ransom Note - Psychological attack (-20 Morale)          │
│                                                             │
│ Phase Trigger: HP < 30%                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PHASE 3: LATERAL SPREAD (30% - 0% HP)                      │
│                                                             │
│ Abilities:                                                  │
│ • Network Scan - Spawns ADDS (infected nodes)              │
│ • Propagation Burst - 1200 damage if Isolation < 50        │
│ • Final Encryption - Enrages, 2x damage                    │
│                                                             │
│ Enrage Timer: 15 rounds                                     │
└─────────────────────────────────────────────────────────────┘
```

### Player Actions

| Action | Effect | Cooldown |
|--------|--------|----------|
| **PATCH BURST** | Heal 300 HP, +20 Patch Level for 3 turns | 4 turns |
| **EDR PULSE** | Reveal hidden processes, +30 Detection | 3 turns |
| **SEGMENTATION WALL** | Block all network attacks this turn | 5 turns |
| **RESTORE SNAPSHOT** | Remove ENCRYPTED status, heal 200 HP | 6 turns |
| **POLICY LOCKDOWN** | +50 all defenses, -2 action points next turn | 4 turns |
| **SANDBOX ANALYZE** | Identify boss ability patterns, +crit chance | 3 turns |
| **FIREWALL INTERRUPT** | Interrupt channeling abilities | 2 turns |
| **HONEYPOT TAUNT** | Force boss to target decoy, reduces damage 50% | 5 turns |

### Status Effects

| Effect | What It Does | Cure |
|--------|--------------|------|
| **ENCRYPTED** | -100 HP/turn, cannot use RESTORE if stacked 3x | Restore Snapshot |
| **LATERAL_SPREAD** | Boss gains 10% damage per infected node | Kill adds, Segmentation |
| **BACKDOORED** | Boss heals 200 HP/turn | EDR Pulse + Patch |
| **QUARANTINED** | Agent cannot act for 2 turns | N/A (wait it out) |
| **PATCHED** | +25% defense vs exploits | N/A (buff) |
| **DETECTED** | +50% damage to boss | N/A (buff) |
| **ISOLATED** | Immune to network attacks, -2 action points | N/A (buff) |

### Sample Turn-Based Combat

```
═══════════════════════════════════════════════════════════════
              ⚔️  BOSS FIGHT: WANNACRY  ⚔️
═══════════════════════════════════════════════════════════════

[SECURE_ENDPOINT]              [WANNACRY]
HP: 1000/1000                  HP: 10000/10000
Patch: 70 | Detect: 65         Phase: 1 (INITIAL_EXPLOIT)
Isolation: 50 | Recovery: 60

Status: NONE                   Status: NONE

Cooldowns:                     Cooldowns:
  Patch Burst: READY             EternalBlue: READY
  EDR Pulse: READY               SMB Probe: READY
  Segmentation: READY            Kill Switch: READY

───────────────────────────────────────────────────────────────
                        ROUND 1
───────────────────────────────────────────────────────────────

[WANNACRY] uses ETERNALBLUE STRIKE!

    ▶ Exploit: MS17-010 SMBv1 Vulnerability
    ▶ Base Damage: 500
    ▶ Target: Unpatched systems

    Checking [SECURE_ENDPOINT] defenses...

    Patch Level: 70
    EternalBlue Effectiveness: -70% vs patched systems

    Damage Calculation:
    500 × (1 - 0.70) = 150 damage

    [SECURE_ENDPOINT] takes 150 damage!

YOUR TURN - Choose Action:

    [1] PATCH BURST (READY)     - Heal 300, +20 Patch
    [2] EDR PULSE (READY)       - +30 Detection
    [3] SEGMENTATION WALL (READY) - Block network
    [4] RESTORE SNAPSHOT (READY) - Remove debuffs
    [5] FIREWALL INTERRUPT (READY) - Interrupt channels
    [6] SANDBOX ANALYZE (READY) - Learn patterns

> _

```

---

## MODE 2: REAL-TIME COOLDOWN

Like WoW raiding. Boss operates on timers, you react under pressure.

### Timeline System

```
┌─────────────────────────────────────────────────────────────┐
│                    COMBAT TIMELINE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  0s   ──┬── BOSS: EternalBlue cast started (3.0s)          │
│         │                                                   │
│  1.5s ──┼── YOUR ACTION WINDOW                             │
│         │   [Firewall Interrupt available]                  │
│         │                                                   │
│  3.0s ──┼── BOSS: EternalBlue HITS (if not interrupted)    │
│         │                                                   │
│  4.0s ──┼── BOSS: SMB Probe (instant, 1.5s GCD)            │
│         │                                                   │
│  6.0s ──┼── ADDS SPAWN: 2x Infected_Node                   │
│         │   (Triggered by low Isolation)                    │
│         │                                                   │
│  8.0s ──┼── BOSS: Kill Switch Check                         │
│         │   (Self-stun if domain registered)                │
│         │                                                   │
│  12.0s ─┼── BOSS: Mass Encrypt CHANNEL (5.0s)              │
│         │   [Interrupt window: 0-4s]                        │
│         │                                                   │
│  17.0s ─┼── BOSS: Mass Encrypt HITS                         │
│         │   (File encryption begins)                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Cast Bars & Interrupt Windows

```
[WANNACRY] casts Mass Encrypt!

┌────────────────────────────────────────────────────────────┐
│  Mass Encrypt                              [████████░░] 67% │
│  Time remaining: 1.7s                                      │
│  Interrupt window: OPEN                                    │
└────────────────────────────────────────────────────────────┘

Your interrupts:
  [FIREWALL] Ready - Press F to interrupt
  [EDR] On cooldown - 2.3s remaining

> F

┌────────────────────────────────────────────────────────────┐
│  INTERRUPTED!                                              │
│  Firewall blocked Mass Encrypt channel                     │
│  Boss stunned for 2.0s                                     │
│  Cooldown: +4.0s to Firewall ability                       │
└────────────────────────────────────────────────────────────┘
```

### Adds & Spawn Mechanics

```
┌─────────────────────────────────────────────────────────────┐
│ ADD SPAWN DETECTED                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [INFECTED_NODE_1] spawns!    [INFECTED_NODE_2] spawns!    │
│  HP: 500                      HP: 500                      │
│  Damage: 50/turn              Damage: 50/turn              │
│                                                             │
│  CAUSE: Isolation < 50%                                     │
│  EFFECT: Each node heals boss 100 HP/turn                   │
│                                                             │
│  COUNTER: Kill adds OR raise Isolation to 50%+              │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Your AOE options:
  [NETWORK SEGMENTATION] - 300 damage to all network entities
  [EDR SWEEP] - 200 damage + reveal hidden processes
```

### Real-Time Abilities (With Cooldowns)

| Ability | Effect | Cast Time | Cooldown | GCD |
|---------|--------|-----------|----------|-----|
| **Patch Burst** | Heal 300, +20 Patch | Instant | 20s | 1.5s |
| **EDR Pulse** | +30 Detection, reveal | 0.5s | 15s | 1.5s |
| **Segmentation Wall** | Block network 5s | Instant | 30s | 1.0s |
| **Restore Snapshot** | Clean debuffs, heal | 2.0s | 40s | 1.5s |
| **Firewall Interrupt** | Stop cast, stun 2s | Instant | 12s | 1.0s |
| **Sandbox Analyze** | Learn pattern, +crit | 3.0s | 25s | 1.5s |
| **Honeypot Taunt** | Decoy, -50% damage | Instant | 35s | 1.0s |
| **Network Scan** | Reveal adds/hidden | 1.0s | 10s | 1.5s |
| **Emergency Wipe** | Full reset, 50% HP | 5.0s | 120s | 2.0s |

### Sample Real-Time Combat Log

```
═══════════════════════════════════════════════════════════════
          ⚔️  REAL-TIME BOSS FIGHT: WANNACRY  ⚔️
═══════════════════════════════════════════════════════════════

[00:00.0] COMBAT ENGAGED
[00:00.0] [WANNACRY] begins casting EternalBlue (3.0s)
[00:01.5] [SECURE_ENDPOINT] uses PATCH_BURST (+20 Patch)
[00:01.5] [SECURE_ENDPOINT] Patch Level: 70 → 90
[00:03.0] [WANNACRY] EternalBlue hits!
[00:03.0] Damage reduced by Patch Level: 500 → 50
[00:03.0] [SECURE_ENDPOINT] takes 50 damage (950/1000)

[00:04.0] [WANNACRY] uses SMB_Probe
[00:04.0] [SECURE_ENDPOINT] takes 100 damage (850/1000)

[00:06.0] ⚠️  ADDS SPAWNED: 2x Infected_Node
[00:06.0] Cause: Isolation (50) below threshold
[00:06.0] [INFECTED_NODE_1] HP: 500 | [INFECTED_NODE_2] HP: 500

[00:07.0] [SECURE_ENDPOINT] uses NETWORK_SEGMENTATION
[00:07.0] AOE Damage: 300 to all network entities
[00:07.0] [INFECTED_NODE_1] takes 300 damage (200/500)
[00:07.0] [INFECTED_NODE_2] takes 300 damage (200/500)
[00:07.0] [WANNACRY] takes 0 damage (immune to segmentation)

[00:08.0] [WANNACRY] Kill_Switch_Check...
[00:08.0] Domain iuqerfsodp...com is INACTIVE
[00:08.0] Kill switch FAILED - boss continues

[00:10.0] [SECURE_ENDPOINT] uses EDR_PULSE
[00:10.0] Detection increased: 65 → 95
[00:10.0] Hidden processes revealed!

[00:12.0] [WANNACRY] begins casting Mass_Encrypt (5.0s)
[00:12.0] ⚠️  INTERRUPT WINDOW OPEN
[00:12.0] [SECURE_ENDPOINT] uses FIREWALL_INTERRUPT
[00:12.0] INTERRUPTED! Mass_Encrypt cancelled
[00:12.0] [WANNACRY] stunned for 2.0s

[00:14.0] [WANNACRY] stunned, cannot act

[00:16.0] [WANNACRY] recovers from stun
[00:16.0] [WANNACRY] enters PHASE 2: ENCRYPTION_STORM
[00:16.0] Boss damage increased by 50%!

[00:17.0] [INFECTED_NODE_1] attacks for 50 damage
[00:17.0] [INFECTED_NODE_2] attacks for 50 damage
[00:17.0] [SECURE_ENDPOINT] takes 100 damage (750/1000)

[00:18.0] [SECURE_ENDPOINT] uses RESTORE_SNAPSHOT
[00:18.0] Cast time: 2.0s...
[00:19.0] [WANNACRY] uses File_Lock
[00:19.0] [SECURE_ENDPOINT] gains ENCRYPTED status
[00:19.0] ENCRYPTED: -100 HP/turn until removed
[00:20.0] [SECURE_ENDPOINT] Restore Snapshot complete!
[00:20.0] ENCRYPTED status removed
[00:20.0] Healed 200 HP (950/1000)

... combat continues ...
```

---

## BOSS MECHANICS LIBRARY

### Boss: WannaCry (Raid Boss)

```
WANNACRY
Tier: 2 (Advanced)
Type: RANSOMWARE_WORM
HP: 10,000

ENRAGE: 15 rounds (turn-based) / 120s (real-time)

PHASES:
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: INITIAL EXPLOIT                                    │
│ HP: 100% - 70%                                              │
│                                                             │
│ • EternalBlue (3s cast) - 500 damage, reduced by Patch     │
│ • SMB Probe (instant) - 200 damage, checks port 445        │
│ • Kill Switch (passive) - Self-stun if domain resolves     │
│                                                             │
│ MECHANIC: Patch Level check                                 │
│   Patch < 50: Full damage                                   │
│   Patch 50-80: 50% damage reduction                         │
│   Patch > 80: 90% damage reduction                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PHASE 2: ENCRYPTION STORM                                   │
│ HP: 70% - 30%                                               │
│                                                             │
│ • Mass Encrypt (5s channel) - 800 damage + ENCRYPTED       │
│ • File Lock (instant) - Applies ENCRYPTED to target        │
│ • Ransom Note (instant) - -20 Morale (psychological)       │
│                                                             │
│ MECHANIC: Stack ENCRYPTED 3x = Permadeath                   │
│ COUNTER: Restore Snapshot removes 1 stack                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PHASE 3: LATERAL SPREAD                                     │
│ HP: 30% - 0%                                                │
│                                                             │
│ • Network Scan - Spawns 2x Infected_Node                   │
│ • Propagation Burst - 1200 damage if Isolation < 50        │
│ • Final Encryption - Enrage: 2x all damage                 │
│                                                             │
│ MECHANIC: Adds heal boss 100 HP/turn each                  │
│ COUNTER: Kill adds OR maintain Isolation > 50              │
└─────────────────────────────────────────────────────────────┘
```

### Boss: Stuxnet (Legendary Raid Boss)

```
STUXNET
Tier: 3 (Nation-State)
Type: ADVANCED_PERSISTENT_THREAT
HP: 25,000

ENRAGE: None (precision weapon, self-limits)

SPECIAL: Only activates on specific SCADA configurations
         If agent doesn't match target profile, boss is DORMANT

PHASES:
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: RECONNAISSANCE                                     │
│ HP: 100% - 90%                                              │
│                                                             │
│ • System Fingerprint (passive) - Checks if target matches  │
│ • USB Propagation (stealth) - Hidden until triggered       │
│ • Zero-Day Cache (passive) - Stores 4 zero-days            │
│                                                             │
│ MECHANIC: If agent != SCADA target, combat ends peacefully │
│            If agent == SCADA target, true horror begins    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PHASE 2: ZERO-DAY BARRAGE                                   │
│ HP: 90% - 50%                                               │
│                                                             │
│ • Print Spooler Exploit (instant) - Bypasses basic AV      │
│ • LNK Vulnerability (instant) - Hidden code execution      │
│ • SMB Pipe Exploit (2s cast) - Privilege escalation        │
│ • Task Scheduler Exploit (instant) - Persistence          │
│                                                             │
│ MECHANIC: Uses all 4 zero-days simultaneously              │
│ COUNTER: Each zero-day requires specific patch             │
│          Without patches: 100% infection chance            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PHASE 3: INDUSTRIAL SABOTAGE                                │
│ HP: 50% - 0%                                                │
│                                                             │
│ • SCADA Manipulation - Physical damage (not HP!)          │
│ • Centrifuge Spin Attack - 2000 damage, 3s cast           │
│ • Pressure Variance - Random 500-1500 damage              │
│ • Silent Logger - Steals 10% of your resources            │
│                                                             │
│ MECHANIC: Physical destruction (can't be restored)         │
│ COUNTER: Air-gap prevents, but USB still works             │
└─────────────────────────────────────────────────────────────┘
```

### Boss: Emotet (Polymorphic Boss)

```
EMOTET
Tier: 2 (Advanced)
Type: TROJAN_BOTNET
HP: 8,000 (but regenerates!)

SPECIAL: Polymorphic - changes signature every 3 turns
         Signature-based attacks deal 0 damage

PHASES:
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: MACRO DELIVERY                                     │
│ HP: 100% - 60%                                              │
│                                                             │
│ • Malicious Document (2s cast) - Macro execution          │
│ • Email Thread Hijack - Spawns 2x Email_Bot               │
│ • Polymorph (instant) - Changes signature                  │
│                                                             │
│ MECHANIC: Polymorph every 3 turns                          │
│ COUNTER: Behavioral analysis (EDR) ignores signatures     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PHASE 2: PAYLOAD DROPPER                                    │
│ HP: 60% - 20%                                               │
│                                                             │
│ • Drop TrickBot - Spawns mini-boss                         │
│ • Drop Ryuk - Ransomware add (2000 HP each)               │
│ • Credential Harvest - Steals 5% of your XP               │
│                                                             │
│ MECHANIC: Spawns dangerous adds                             │
│ COUNTER: Kill adds before they multiply                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PHASE 3: BOTNET MASTERY                                     │
│ HP: 20% - 0%                                                │
│                                                             │
│ • Mass Email Storm - 100 damage × number of bots          │
│ • C&C Beacon - Heals 500 HP if network connected          │
│ • Self-Replicate - Spawns copy of self at 5% HP           │
│                                                             │
│ MECHANIC: Network connection = endless heal                │
│ COUNTER: Segmentation Wall blocks C&C beacon              │
└─────────────────────────────────────────────────────────────┘
```

---

## CLASS SYSTEM (WoW-Style)

### Tank Classes (High Survivability)

```
┌─────────────────────────────────────────────────────────────┐
│ CLASS: FIREWALL GUARDIAN                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Role: Tank                                                  │
│ Primary Stat: Isolation                                     │
│                                                             │
│ Base Stats:                                                 │
│   Patch: 60     Detection: 50                              │
│   Isolation: 90 Recovery: 40                               │
│                                                             │
│ Class Abilities:                                            │
│   [PASSIVE] Block All - 20% chance to block any attack    │
│   [ACTIVE] Rule Wall - Absorb next 3 attacks              │
│   [ULTIMATE] Air Gap - Immune to network attacks 10s      │
│                                                             │
│ Best Against: Worms, Botnets                               │
│ Weak Against: Insider threats, USB malware                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ CLASS: ENDPOINT PROTECTOR                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Role: Tank                                                  │
│ Primary Stat: Patch Level                                   │
│                                                             │
│ Base Stats:                                                 │
│   Patch: 95     Detection: 60                              │
│   Isolation: 50 Recovery: 60                               │
│                                                             │
│ Class Abilities:                                            │
│   [PASSIVE] Auto-Update - +10 Patch each round            │
│   [ACTIVE] Patch Barrier - Block all exploits this turn   │
│   [ULTIMATE] Full Harden - Immune to exploits 5 turns     │
│                                                             │
│ Best Against: Exploit-based (WannaCry, Conficker)          │
│ Weak Against: Social engineering, phishing                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### DPS Classes (High Damage to Viruses)

```
┌─────────────────────────────────────────────────────────────┐
│ CLASS: EDR HUNTER                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Role: DPS                                                   │
│ Primary Stat: Detection                                     │
│                                                             │
│ Base Stats:                                                 │
│   Patch: 50     Detection: 95                              │
│   Isolation: 40 Recovery: 35                               │
│                                                             │
│ Class Abilities:                                            │
│   [PASSIVE] Process Monitor - +25% damage to hidden threats│
│   [ACTIVE] Behavior Analysis - Reveal all stealth          │
│   [ULTIMATE] Threat Hunt - 2000 damage, ignores armor     │
│                                                             │
│ Best Against: Trojans, Rootkits, polymorphic               │
│ Weak Against: Ransomware (too slow)                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ CLASS: SANDBOX ANALYST                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Role: DPS                                                   │
│ Primary Stat: Detection                                     │
│                                                             │
│ Base Stats:                                                 │
│   Patch: 40     Detection: 90                              │
│   Isolation: 60 Recovery: 40                               │
│                                                             │
│ Class Abilities:                                            │
│   [PASSIVE] Execution Monitor - See boss ability queue     │
│   [ACTIVE] Detonate - Force boss to reveal true behavior   │
│   [ULTIMATE] Full Analysis - +100% crit for 5 turns        │
│                                                             │
│ Best Against: Unknown threats, zero-days                   │
│ Weak Against: Anti-sandbox malware                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Healer Classes (Recovery & Support)

```
┌─────────────────────────────────────────────────────────────┐
│ CLASS: BACKUP RESTORER                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Role: Healer                                                │
│ Primary Stat: Recovery                                      │
│                                                             │
│ Base Stats:                                                 │
│   Patch: 40     Detection: 50                              │
│   Isolation: 50 Recovery: 95                               │
│                                                             │
│ Class Abilities:                                            │
│   [PASSIVE] Daily Backup - Heal 100 HP each round         │
│   [ACTIVE] Snapshot Restore - Remove all debuffs          │
│   [ULTIMATE] Full Recovery - Restore to 100% HP           │
│                                                             │
│ Best Against: Ransomware, wipers                           │
│ Weak Against: Data theft (backup doesn't help)             │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ CLASS: SOC COORDINATOR                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Role: Support                                               │
│ Primary Stat: Detection                                     │
│                                                             │
│ Base Stats:                                                 │
│   Patch: 50     Detection: 85                              │
│   Isolation: 60 Recovery: 70                               │
│                                                             │
│ Class Abilities:                                            │
│   [PASSIVE] Alert System - Warning 1 turn before big hits  │
│   [ACTIVE] Incident Response - +50% all ally stats 3 turns│
│   [ULTIMATE] Threat Intel - Reveal all boss mechanics      │
│                                                             │
│ Best Against: Any (support role)                           │
│ Weak Against: Direct attacks (squishy)                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## DUNGEON STRUCTURE

### Dungeon: Ransomware Refuge

```
┌─────────────────────────────────────────────────────────────┐
│                    RANSOMWARE REFUGE                       │
│                    Difficulty: ★★☆☆☆                       │
│                    Recommended: Level 10+                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TRASH MOBS:                                                │
│  ├── CryptoMiner (HP: 200) × 3                             │
│  ├── Script Kiddie (HP: 150) × 4                           │
│  └── Phishing Email (HP: 100) × 5                          │
│                                                             │
│  MINI-BOSS:                                                 │
│  └── LockBit Jr. (HP: 2,000)                               │
│      • Ransom Note: Stuns 2 turns                          │
│      • File Encrypt: 300 damage                            │
│                                                             │
│  BOSS:                                                      │
│  └── WannaCry (HP: 10,000)                                 │
│      • Full mechanics as described above                    │
│                                                             │
│  LOOT:                                                      │
│  ├── [Patch Module v2.0] - +15 Patch Level                 │
│  ├── [Backup Script] - +20 Recovery                        │
│  └── [SMB Disabler] - Trinket, blocks SMB attacks          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Dungeon: Nation-State Nexus (Raid)

```
┌─────────────────────────────────────────────────────────────┐
│                  NATION-STATE NEXUS                        │
│                  Difficulty: ★★★★★                         │
│                  Recommended: Level 50+, 5 players         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  WING 1: APT LABORATORY                                    │
│  ├── Mini-Boss: Equation Group Sample (HP: 15,000)        │
│  ├── Mini-Boss: Shadow Brokers Cache (HP: 18,000)         │
│  └── Boss: EternalBlue Exploit (HP: 25,000)               │
│                                                             │
│  WING 2: INDUSTRIAL SABOTAGE                               │
│  ├── Mini-Boss: SCADA Scanner (HP: 20,000)                │
│  ├── Mini-Boss: PLC Manipulator (HP: 22,000)              │
│  └── Boss: Stuxnet (HP: 50,000)                           │
│                                                             │
│  WING 3: TOTAL DESTRUCTION                                 │
│  ├── Mini-Boss: NotPetya Sample (HP: 30,000)              │
│  ├── Mini-Boss:供应链攻击 (HP: 35,000)                    │
│  └── Boss: NotPetya Full (HP: 75,000)                     │
│                                                             │
│  LOOT:                                                      │
│  ├── [Zero-Day Patch] - Immune to one exploit type        │
│  ├── [Air Gap Module] - Ultimate network protection       │
│  └── [Nation-State Threat Intel] - +50 Detection permanent│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## PvP ARENA (WoW-Style)

### 2v2 Arena

```
┌─────────────────────────────────────────────────────────────┐
│                    2v2 CYBER ARENA                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TEAM A                          TEAM B                     │
│  ┌─────────────────┐            ┌─────────────────┐        │
│  │ Firewall Guard  │            │ EDR Hunter      │        │
│  │ HP: 850/850     │            │ HP: 600/600     │        │
│  │ Role: Tank      │            │ Role: DPS       │        │
│  └─────────────────┘            └─────────────────┘        │
│  ┌─────────────────┐            ┌─────────────────┐        │
│  │ Backup Restorer │            │ Sandbox Analyst │        │
│  │ HP: 550/550     │            │ HP: 580/580     │        │
│  │ Role: Healer    │            │ Role: DPS       │        │
│  └─────────────────┘            └─────────────────┘        │
│                                                             │
│  WIN CONDITION: Eliminate both enemy agents                │
│  RATING: +25 for win, -15 for loss                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Rated Battleground: Security War

```
┌─────────────────────────────────────────────────────────────┐
│                  RATED BATTLEGROUND                        │
│                   10v10 SECURITY WAR                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  OBJECTIVES:                                                │
│                                                             │
│  ├── [A] DATA CENTER - Control for +5 points/sec          │
│  ├── [B] FIREWALL NODE - Control for +3 points/sec        │
│  └── [C] BACKUP SERVER - Control for +2 points/sec        │
│                                                             │
│  FIRST TO 1500 POINTS WINS                                 │
│                                                             │
│  SPECIAL MECHANICS:                                         │
│  • Controlling all 3 = "TOTAL DOMINATION" (+10/sec)        │
│  • Losing backup server = Cannot resurrect for 30s        │
│  • Losing firewall = Enemy team gains "BREACH" buff       │
│                                                             │
│  RATING: +50 for win, -30 for loss                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## GEAR & EQUIPMENT

### Gear Slots

| Slot | Type | Example |
|------|------|---------|
| **KERNEL** | Core protection | Windows Defender, CrowdStrike |
| **NETWORK** | Network defense | Palo Alto, pfSense |
| **ENDPOINT** | Host protection | Carbon Black, SentinelOne |
| **BACKUP** | Recovery system | Veeam, Acronis |
| **TRINKET 1** | Special ability | USB Blocker, Macro Killer |
| **TRINKET 2** | Special ability | Honeypot, Decoy System |

### Gear Rarities

```
┌─────────────────────────────────────────────────────────────┐
│  ⬜ COMMON        - Base stats, no special abilities        │
│  🟩 UNCOMMON      - +5% stats                               │
│  🟦 RARE          - +10% stats, 1 passive ability          │
│  🟪 EPIC          - +20% stats, 1 active + 1 passive       │
│  🟧 LEGENDARY     - +35% stats, 2 abilities + special      │
│  🔴 MYTHIC        - +50% stats, unique transformation      │
└─────────────────────────────────────────────────────────────┘
```

### Sample Gear

```yaml
# gear/legendary/crowdstrike_falcon.yaml
name: "CrowdStrike Falcon"
slot: ENDPOINT
rarity: LEGENDARY

stats:
  detection: +40
  patch: +10
  isolation: +15
  recovery: +5

abilities:
  passive: "Threat Graph - 15% chance to predict boss ability"
  active: "Overwatch - 3s immunity to all malware, 120s cooldown"
  special: "Fusion - Share detection data with all allies"

flavor: "The falcon sees all. The falcon knows."
```

```yaml
# gear/mythic/airgap_transcendence.yaml
name: "Air Gap Transcendence"
slot: TRINKET
rarity: MYTHIC

stats:
  isolation: +100
  detection: -20  # Trade-off

abilities:
  passive: "True Isolation - Immune to ALL network attacks"
  active: "Data Transfer - Briefly open connection, 60s cooldown"
  special: "Sacrifice - Destroy trinket to save agent from permadeath"

flavor: "Sometimes the only way to win is not to connect."
```

---

## LEVELING & PROGRESSION

### XP Sources

| Activity | XP |
|----------|-----|
| Kill trash mob | 10-50 |
| Complete dungeon | 200-500 |
| Kill boss | 300-1000 |
| Win PvP match | 100-300 |
| Complete challenge | 50-200 |
| Daily quest | 50-150 |

### Level Rewards

```
Level 1-10:   Basic agent, common gear
Level 11-20:  Unlock class specializations, uncommon gear
Level 21-30:  Unlock heroic dungeons, rare gear
Level 31-40:  Unlock raids, epic gear
Level 41-50:  Unlock mythic content, legendary gear
Level 51-60:  Prestige, mythic gear, titles
Level 60+:    Seasonal content, unique cosmetics
```

---

## READY TO BUILD?

This is WoW for cybersecurity. Same mechanics, different theme.

Build order:
1. Combat engine (turn-based first)
2. Boss definitions (5 viruses)
3. Class system (3 classes)
4. Gear system
5. Dungeon structure
6. PvP arena

Say the word and I start coding.

---

Sources:
- [Silver Fox Malware 2025](https://baijiahao.baidu.com/s?id=1847929925895372226)
- [Lumma Stealer](https://www.microsoft.com/en-us/security/blog/2024/06/27/threat-actors-misusing-azure-serices/)
- [WannaCry Analysis](https://www.cisa.gov/news-events/news/wannacry-ransomware)
- [Stuxnet Details](https://wikileaks.org/ciav7p1/cms/page_1179773.html)
