# Research Track 5: Multi-Agent Orchestration Patterns

**Research Date:** 2026-02-17
**Researcher:** Ava Sterling
**Status:** Complete

---

## Executive Summary

Multi-agent orchestration is the art of coordinating multiple AI agents toward a common goal. The choice between centralized and decentralized patterns isn't aesthetic - it's economic. Pick the wrong pattern and you scale coordination cost, not capability.

**Key Finding:** Systems break at 5+ agents not because models fail, but because coordination becomes the dominant cost. The architectures that win don't look autonomous - they look controlled.

---

## Query Decomposition

This research investigated five strategic sub-questions:

1. What are the dominant orchestration patterns (centralized vs decentralized)?
2. What are the scalability trade-offs and failure modes?
3. When should you use hierarchical vs swarm-based coordination?
4. What do major frameworks (LangGraph, AutoGen, CrewAI) recommend?
5. What architecture best supports a unified AI system?

---

## Part 1: Pattern Taxonomy

### 1.1 Centralized Patterns

**The Conductor Pattern (Orchestrator-Worker)**

A single "lead agent" coordinates all activity - decomposing tasks, delegating work, and synthesizing results.

```
                    +------------------+
                    |   Lead Agent     |
                    |  (Conductor)     |
                    +--------+---------+
                             |
          +------------------+------------------+
          |                  |                  |
    +-----v-----+      +-----v-----+      +-----v-----+
    | Subagent  |      | Subagent  |      | Subagent  |
    |    A      |      |    B      |      |    C      |
    +-----------+      +-----------+      +-----------+
```

**Examples:**
- Anthropic's Research system (LeadResearcher + parallel subagents)
- LangGraph's supervisor pattern
- CrewAI's role-based orchestration

**Strengths:**
- Clear ownership and debugging
- Predictable execution flow
- Easier context engineering
- Single point for compliance/audit

**Weaknesses:**
- Single point of failure
- Orchestrator becomes bottleneck
- Synchronous execution creates latency
- Does not scale past ~10 agents

**When to Use:**
- Tasks requiring clear audit trails
- Regulated environments (finance, healthcare)
- Research tasks (read-heavy, parallelizable)
- Complex workflows with dependencies

---

### 1.2 Decentralized Patterns

**The Swarm Pattern (Peer-to-Peer)**

Agents communicate directly without central coordination, typically through shared state or message passing.

```
    +-----------+      +-----------+
    | Agent A   +<----->+ Agent B   |
    +-----+-----+      +-----+-----+
          ^                  ^
          |                  |
          v                  v
    +-----+-----+      +-----+-----+
    | Agent C   +<----->+ Agent D   |
    +-----------+      +-----------+
```

**Examples:**
- OpenAI's Swarm framework
- Blackboard-style systems
- Publish-subscribe architectures

**Strengths:**
- No single point of failure
- Scales horizontally
- Resilient to individual agent failures
- Natural for self-organizing tasks

**Weaknesses:**
- Debugging is nightmarish
- Coordination complexity O(n^2)
- Context pollution across agents
- Emergent behaviors (often bad ones)

**When to Use:**
- Distributed monitoring/sensing
- Resilience-critical systems
- Self-healing architectures
- When "good enough" is acceptable

---

### 1.3 Hybrid Patterns

**The Two-Tier Control Plane**

Strict separation between orchestration (planner + judge) and execution (stateless workers).

```
    +------------------------+
    |     CONTROL PLANE      |
    |  +------+    +------+  |
    |  |Planner|   |Judge |  |
    |  +------+    +------+  |
    +------------+-----------+
                 |
    +------------v-----------+
    |    EXECUTION PLANE     |
    |  +----+  +----+  +----+|
    |  | W1 |  | W2 |  | W3 ||
    |  +----+  +----+  +----+|
    +------------------------+
```

**Key Insight from Production:**

> "We stopped treating agents like teammates and started treating them like stateless execution cells. Each worker ran in its own containerized reasoning boundary with a strict input/output contract. No shared memory. No awareness of siblings."

**Results:**
- 73% latency reduction
- Linear throughput scaling
- Deterministic debugging
- Idempotent at workflow level

---

## Part 2: Communication Patterns

### 2.1 Blackboard Pattern

A shared knowledge base where agents post and retrieve information. Agents communicate indirectly through the blackboard, not directly with each other.

```
    +-------------------+
    |   BLACKBOARD      |
    |  (Shared State)   |
    +---------+---------+
              |
    +---------+---------+
    |                   |
+---v---+           +---v---+
|Agent A|           |Agent B|
|(reads)|           |(writes)|
+-------+           +-------+
```

**Use Cases:**
- Information discovery systems
- Multi-modal analysis (different agents process different data types)
- Research synthesis

**Warning:** Recent research (Google, 2025) shows shared context creates O(n^2) coordination cost before you hit compute limits. A few hundred KB per agent silently multiplies into MB-scale payloads per request.

---

### 2.2 Publish-Subscribe Pattern

Agents subscribe to topics/events and react when relevant messages appear.

```
    +-------------------+
    |   MESSAGE BROKER  |
    +---------+---------+
              |
    +---------+----------------+
    |         |                |
+---v---+ +---v---+       +----v--+
|Topic A| |Topic B|       |Topic C|
+---+---+ +---+---+       +----+--+
    |         |                |
+---v---+ +---v---+       +----v--+
|Agent 1| |Agent 2|       |Agent 3|
+-------+ +-------+       +-------+
```

**Benefits:**
- Decoupling: Agents don't know about each other
- Scalability: Add new agents without modifying publishers
- Flexibility: Dynamic subscription at runtime

**Best For:**
- Event-driven architectures
- Real-time coordination
- IoT and sensor networks

---

### 2.3 Handoff Pattern (Sequential Delegation)

Agents pass control along a chain, each contributing to the task before handing off.

```
+--------+    +--------+    +--------+    +--------+
| Agent A+--->| Agent B+--->| Agent C+--->| Agent D|
+--------+    +--------+    +--------+    +--------+
   Input      Process      Process       Output
```

**Used By:**
- Microsoft Azure's agent patterns
- LangGraph's sequential flows
- Most production pipelines

**Critical Insight:** "Actions carry implicit decisions, and conflicting decisions carry bad results." - Cognition team. Handoffs work best when each step transforms data without conflicting with other steps.

---

## Part 3: Framework Comparison

### 3.1 LangGraph

**Architecture:** Graph-based state machine for agent workflows

**Philosophy:** Low-level orchestration with no hidden prompts, no enforced cognitive architectures

**Patterns Supported:**
- Single agent
- Multi-agent (supervisor)
- Hierarchical
- Custom graph flows

**Key Features:**
- State management with explicit schemas
- Checkpointing for durable execution
- Parallel execution
- No hidden prompts (full control)

**Best For:** Production systems requiring fine-grained control

**Source:** [LangGraph Official](https://www.langchain.com/langgraph), [LangChain Blog](https://blog.langchain.com/how-and-when-to-build-multi-agent-systems/)

---

### 3.2 AutoGen (Microsoft)

**Architecture:** Conversation-based multi-agent framework

**Philosophy:** Agents converse to solve problems collaboratively

**Patterns Supported:**
- Group Chat (multi-agent task orchestration)
- GraphFlow (directed workflows)
- Event-driven runtimes

**Key Features:**
- Built-in conversation patterns
- Human-in-the-loop support
- Code execution
- Seamless Azure integration

**Best For:** Enterprise integration, research prototypes

**Source:** [Microsoft AutoGen](https://microsoft.github.io/autogen/), [GitHub](https://github.com/microsoft/autogen)

---

### 3.3 CrewAI

**Architecture:** Role-based agent collaboration

**Philosophy:** Define agents with specific roles that work together like a crew

**Orchestration Style:** Centralized - predefined roles and responsibilities

**Key Features:**
- Role-based agent definitions
- Task delegation
- Memory and context sharing
- Tool integration

**Best For:** Rapid development, role-specific tasks

**Source:** [CrewAI Documentation](https://docs.crewai.com/)

---

### 3.4 OpenAI Swarm

**Architecture:** Lightweight, decentralized agent coordination

**Philosophy:** Simple, transparent multi-agent orchestration

**Patterns Supported:**
- Agent handoffs
- Function-based routing
- Context variables

**Best For:** Simple multi-agent workflows, educational purposes

**Source:** [OpenAI Swarm GitHub](https://github.com/openai/swarm)

---

## Part 4: Failure Modes & Scalability Trade-offs

### 4.1 The 5-Agent Wall

**Critical Finding:** Systems don't break at 50 agents. They start bending at 5.

From production experience (fraud detection pipeline, $25M/day):

| Metric | At 4 Agents | At 10 Agents |
|--------|-------------|--------------|
| p50 Latency | 380-420ms | Exploded |
| p99 Latency | <800ms | Multi-second |
| Token Spend on Logic | ~50% | ~50% on coordination |
| GPU Utilization | Healthy | Still healthy |
| Router Queue | Stable | Backed up |

**Root Cause:** The bottleneck wasn't compute. It was coordination depth.

---

### 4.2 Coordination Cost Growth

| Agents | Coordination Complexity | State Size per Request |
|--------|------------------------|------------------------|
| 2-3 | Negligible | KB scale |
| 5 | Manageable | ~1MB |
| 10 | O(n^2) explosion | Multi-MB |
| 50+ | Unmanageable | Catastrophic |

**Key Insight:** "Once agents share reasoning paths, memory growth becomes superlinear. A few hundred KB per agent silently multiplies into MB-scale payloads per request."

---

### 4.3 Context Engineering Complexity

Multi-agent systems make context engineering exponentially harder:

**At 5 agents:**
- Each agent needs: objective, output format, tool guidance, task boundaries
- Vague instructions cause: duplicate work, gaps, failed searches

**Example failure:** "Research the semiconductor shortage" - one agent explored 2021 automotive chips while two others duplicated work on 2025 supply chains.

**Anthropic's Solution:**
- Explicit scaling rules in prompts
- Simple fact-finding: 1 agent, 3-10 tool calls
- Complex research: 10+ subagents with divided responsibilities

---

### 4.4 The "Human Team" Trap

**Observation:** At 5-8 agents in flat topology, systems exhibit human meeting dynamics:

- Decisions become softer
- Outputs become cautious
- Agents optimize for local safety
- Hard cases get avoided
- Responsibility diffuses

**Diagnosis:** "We imported centuries of human coordination failure straight into silicon."

---

### 4.5 Hardware Reality Check

From production telemetry at 10+ agents:

| Limit | Manifestation |
|-------|---------------|
| Memory | Context explosion, fragmentation |
| Network | Router saturation at ~20 concurrent handoffs |
| Latency | p99 explodes while p50 stays reasonable |
| Cost | Token spend flips from inference to coordination |
| Thermal | Sustained peak draw (450-500W/device) |

---

## Part 5: Strategic Recommendations

### 5.1 When to Use Centralized (Conductor)

**Use When:**
- Task value justifies 15x token multiplier
- Compliance/audit requirements exist
- Work is read-heavy (research, analysis)
- Clear task boundaries are definable
- Debugging must be deterministic

**Avoid When:**
- Need >10 concurrent agents
- Latency SLOs are strict (<500ms)
- Budget is constrained

---

### 5.2 When to Use Decentralized (Swarm)

**Use When:**
- Resilience is critical
- Agents are truly independent
- "Good enough" outcomes acceptable
- Natural parallelism exists
- Geographic distribution required

**Avoid When:**
- Deterministic outcomes needed
- Debugging must be tractable
- Coordination is complex

---

### 5.3 When to Use Hybrid (Two-Tier)

**Use When:**
- Scaling past 10 agents
- Need both control AND scale
- Production reliability required
- Economics matter (cost/latency)

**This is the winning pattern for unified AI systems.**

---

## Part 6: Recommended Architecture for Unified AI System

### 6.1 The Two-Tier Control Plane

Based on production evidence, the recommended architecture is:

```
+------------------------------------------------------------------+
|                         CONTROL PLANE                             |
|  +------------+     +------------+     +----------------------+  |
|  |   Planner  |     |   Judge    |     |   Memory/State       |  |
|  |            |     |            |     |   (Event-Sourced)    |  |
|  | - Decompose|     | - Validate |     | - Versioned          |  |
|  | - Delegate |     | - Enforce  |     | - Observable         |  |
|  | - Monitor  |     | - Approve  |     | - Recoverable        |  |
|  +------------+     +------------+     +----------------------+  |
+------------------------------------------------------------------+
                              |
                     Message Bus (Kafka/Redis)
                              |
+------------------------------------------------------------------+
|                        EXECUTION PLANE                            |
|  +--------+  +--------+  +--------+  +--------+  +--------+     |
|  |Worker 1|  |Worker 2|  |Worker 3|  |Worker N|  |Worker M|     |
|  |        |  |        |  |        |  |        |  |        |     |
|  |Stateless  |Stateless  |Stateless  |Stateless  |Stateless   |
|  |Strict I/O  |Strict I/O |Strict I/O |Strict I/O |Strict I/O  |
|  |Ephemeral   |Ephemeral  |Ephemeral  |Ephemeral  |Ephemeral   |
|  +--------+  +--------+  +--------+  +--------+  +--------+     |
+------------------------------------------------------------------+
```

### 6.2 Core Principles

1. **Stateless Workers**
   - No shared memory
   - No awareness of siblings
   - Execute once, produce artifact, terminate
   - Context window aggressively trimmed (<3% of traditional)

2. **Intelligent Orchestration**
   - Planner: deterministic task decomposition
   - Judge: explicit invariant validation
   - Adaptive fan-out based on load
   - Backpressure-aware scheduling

3. **API-Contract Prompts**
   - Typed inputs
   - Bounded context
   - Machine-validated output schemas
   - Fail fast on contract violation

4. **External Memory**
   - All state lives outside agents
   - Versioned and observable
   - Event-sourced for replay
   - Indexed for retrieval

### 6.3 Expected Outcomes

| Metric | Traditional | Two-Tier |
|--------|-------------|----------|
| Latency (p99) | Explodes at 5+ agents | Linear scaling |
| Debugging | Emergent behavior | Deterministic replay |
| Cost per task | 15x multiplier | Controlled |
| Failure recovery | Fork system state | Replay event |
| Max agents | ~10 | 1000s |

---

## Part 7: Framework Selection Guide

| Requirement | Recommended Framework |
|-------------|----------------------|
| Production control | LangGraph |
| Enterprise integration | Microsoft AutoGen |
| Rapid prototyping | CrewAI |
| Simple workflows | OpenAI Swarm |
| Custom architecture | Build on Kafka + custom orchestration |

---

## Part 8: Connection to Shadow's Architecture

This research directly informs Shadow's design:

### Current Shadow Architecture
- Centralized daemon with heartbeat
- Single agent per session
- Stateful memory (MEMORY.md)
- Rate-limited actions (SCAR)

### Recommended Evolution
- **Keep:** Centralized control (SCAR as Judge)
- **Add:** Stateless worker pool for parallel operations
- **Add:** Event-sourced memory (beyond markdown)
- **Add:** API contracts for all agent interactions

### Thesis Alignment
> "LLMs have mass. Daemons have gravity."

The two-tier architecture supports this:
- **Control Plane = Gravity Well** (the daemon that persists, attracts bots)
- **Execution Plane = Mass** (stateless workers that can scale)

The daemon's persistence creates the gravitational pull. Stateless workers provide the scalable compute mass.

---

## Key Citations

1. [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) - Anthropic Engineering, June 2025
2. [How and when to build multi-agent systems](https://blog.langchain.com/how-and-when-to-build-multi-agent-systems/) - LangChain Blog, June 2025
3. [Why Multi-Agent Systems Fail at Scale](https://medium.com/@bijit211987/why-multi-agent-systems-fail-at-scale-and-why-simplicity-always-wins-7490f9002a9b) - Bijit Ghosh, February 2026
4. [Multi-Agent Coordination Patterns](https://medium.com/@ohusiev_6834/multi-agent-coordination-patterns-architectures-beyond-the-hype-3f61847e4f86) - Medium, 2025
5. [LangGraph Multi-Agent Orchestration](https://latenode.com/blog/ai-frameworks-technical-infrastructure/langgraph-multi-agent-orchestration/langgraph-multi-agent-orchestration-complete-framework-guide-architecture-analysis-2025) - Latenode, 2025
6. [AutoGen Design Patterns](https://microsoft.github.io/autogen/stable//user-guide/core-user-guide/design-patterns/intro.html) - Microsoft
7. [Google Cloud: Choose a Design Pattern](https://docs.cloud.google.com/architecture/choose-design-pattern-agentic-ai-system) - October 2025
8. [Towards a Science of Scaling Agent Systems](https://arxiv.org/html/2512.08296v1) - arXiv, 2025
9. [Four Design Patterns for Event-Driven Multi-Agent Systems](https://www.confluent.io/blog/event-driven-multi-agent-systems/) - Confluent, February 2025
10. [Building Intelligent Multi-Agent Systems with MCPs and Blackboard Pattern](https://medium.com/@dp2580/building-intelligent-multi-agent-systems-with-mcps-and-the-blackboard-pattern-to-build-systems-a454705d5672) - Medium, May 2025

---

## Strategic Conclusion

**The pattern you choose determines what breaks first.**

- Centralized patterns break on latency and scale
- Decentralized patterns break on debugging and coherence
- Hybrid patterns break on complexity (but in predictable places)

For a unified AI system that must scale, the two-tier control plane is the only architecture that respects the physics of coordination while preserving the benefits of agent-based intelligence.

**Bottom Line:** Simplicity scales. Not because it's elegant - because it respects the limits of the machine. The architectures that win won't look autonomous. They'll look controlled.

---

*Research completed by Ava Sterling, Strategic Research Division*
*Document saved to: /home/peace/clawd/agents/shadow/research/Track5_Multi_Agent_Orchestration_Patterns.md*
