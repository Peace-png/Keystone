# Blur→Focus→Recall: Algorithm Specification

## The Picture

Imagine your visual cortex working:

1. **BLUR**: Your peripheral vision detects motion/vague shapes. You don't know what it is, but you know *something* is there.
2. **FOCUS**: You turn your head. Your fovea (high-resolution center) locks on. Details emerge.
3. **RECALL**: You recognize it. "That's my cat." Associated memories flood in.

Now imagine a search system that doesn't instantly return results, but **progressively sharpens** toward what you want — giving you a cognitive experience of "zeroing in" rather than "here's your answer."

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   QUERY ──▶ [BLUR] ──▶ [FOCUS] ──▶ [RECALL] ──▶ RESULTS       │
│              50ms       200ms        100ms                      │
│                                                                 │
│   Each stage:                                                   │
│   - Reduces candidate set by ~10x                               │
│   - Increases precision by ~2x                                  │
│   - Adds temporal "feel" of converging on answer                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Structures

### 1. Memory Document

```typescript
interface MemoryDocument {
  id: string;                    // Unique identifier
  content: {
    text?: string;               // Text content
    image?: ImageBuffer;         // Image data
    metadata: Record<string, any>; // Timestamps, tags, source
  };

  // Multi-vector embeddings (the key innovation)
  embeddings: {
    // BLUR stage: Single summary vector (fast, approximate)
    summary: Float32Array;       // 128-dim, L2 normalized

    // FOCUS stage: Token/patch level vectors (slow, precise)
    tokens: Float32Array[];      // N x 128-dim, one per token/patch
    tokenPositions: number[];    // Spatial/temporal positions
  };

  // RECALL stage: Graph connections
  links: {
    temporal: string[];          // IDs of temporally adjacent docs
    semantic: string[];          // IDs of semantically related docs
    causal: string[];            // IDs of causally linked docs
  };

  // SNN-inspired state
  state: {
    lastActivated: number;       // Timestamp of last retrieval
    activationCount: number;     // How often this doc is retrieved
    inhibitionStrength: number;  // Current lateral inhibition level
  };
}
```

### 2. Query State

```typescript
interface QueryState {
  query: {
    text: string;
    tokens: string[];
    summaryVector: Float32Array;    // 128-dim summary
    tokenVectors: Float32Array[];   // Per-token vectors
  };

  // Accumulator (SNN integration)
  accumulator: {
    candidates: Map<string, CandidateScore>;
    integrationWindow: number;      // ms to accumulate
    threshold: number;              // Firing threshold
  };

  // Stage tracking
  stage: 'BLUR' | 'FOCUS' | 'RECALL';
  stageHistory: StageResult[];
}

interface CandidateScore {
  docId: string;
  blurScore: number;      // Stage 1 score
  focusScore: number;     // Stage 2 score
  recallScore: number;    // Stage 3 score
  finalScore: number;     // Weighted combination
  activated: boolean;     // Has this candidate "fired"?
}
```

---

## Stage 1: BLUR (Coarse Retrieval)

### Purpose
Fast, approximate retrieval to get a broad candidate set. Like peripheral vision — you're not sure what you're looking at, but you're narrowing the space.

### Algorithm

```
ALGORITHM: BLUR_RETRIEVAL(query, index)

INPUT:
  - query: User query text
  - index: ClawMem index with BM25 + vector search

OUTPUT:
  - candidates: Top-K document IDs with scores

STEPS:

1. ENCODE QUERY (10ms)
   summaryVector = moondream.encode_text(query)  // 128-dim
   tokens = tokenize(query)

2. DUAL SEARCH (30ms)
   // Parallel searches
   vector_results = index.vector_search(summaryVector, k=200)
   bm25_results = index.bm25_search(query, k=200)

3. FUSE RESULTS (10ms)
   // Hybrid scoring (ClawMem formula)
   FOR each doc_id in union(vector_results, bm25_results):
     vector_score = vector_results.get(doc_id, 0)
     bm25_score = bm25_results.get(doc_id, 0)
     combined_score = 0.7 * vector_score + 0.3 * bm25_score

     candidates[doc_id] = {
       blurScore: combined_score,
       focusScore: 0,
       recallScore: 0
     }

4. SPARSE FIRING (SNN-inspired)
   // Only top candidates "fire" (activate)
   sorted = sort_by_score(candidates, descending=True)
   threshold = sorted[99].blurScore  // Top-100 threshold

   FOR i, candidate in enumerate(sorted):
     IF i < 100:
       candidate.activated = True
     ELSE:
       candidate.activated = False  // Inhibited

5. RETURN top 100 activated candidates
```

### Parameters

| Parameter | Default | Range | Effect |
|-----------|---------|-------|--------|
| `k_vector` | 200 | 100-500 | Initial vector search width |
| `k_bm25` | 200 | 100-500 | Initial keyword search width |
| `blur_top_k` | 100 | 50-200 | How many candidates survive |
| `vector_weight` | 0.7 | 0.5-0.9 | Semantic vs. keyword balance |

### Timing Target: 50ms

---

## Stage 2: FOCUS (Multi-Vector Refinement)

### Purpose
Precise, token-level matching using ColBERT-style late interaction. Like foveal vision — high-resolution examination of promising candidates.

### Algorithm

```
ALGORITHM: FOCUS_RETRIEVAL(query, candidates, index)

INPUT:
  - query: User query with token vectors
  - candidates: Top-100 from BLUR stage
  - index: ClawMem with multi-vector embeddings

OUTPUT:
  - refined_candidates: Top-10 with MaxSim scores

STEPS:

1. ENCODE QUERY TOKENS (20ms)
   // Already done in BLUR, but ensure per-token vectors
   query_tokens = moondream.encode_tokens(query.tokens)
   // Result: N x 128 matrix, one 128-dim vector per token

2. MAXSIM SCORING (150ms for 100 docs)
   // Late interaction: Each query token matches each doc token

   FOR each candidate in candidates:
     doc_tokens = index.get_token_embeddings(candidate.docId)

     // MaxSim operation (the heart of ColBERT)
     maxsim_score = 0

     FOR each query_token in query_tokens:
       // Find best-matching document token
       max_similarity = -infinity

       FOR each doc_token in doc_tokens:
         similarity = cosine_similarity(query_token, doc_token)

         // Track maximum for this query token
         IF similarity > max_similarity:
           max_similarity = similarity

       // Sum the maximums
       maxsim_score += max_similarity

     candidate.focusScore = maxsim_score / len(query_tokens)

3. LATERAL INHIBITION (20ms)
   // SNN-inspired: Winners suppress neighbors
   // This implements Winner-Take-All dynamics

   sorted = sort_by(candidates, key='focusScore', descending=True)

   FOR i, candidate in enumerate(sorted):
     // Inhibit candidates based on rank
     inhibition = -0.4 * (i / len(sorted))  // Stronger inhibition for lower ranks

     IF i < 10:
       // Top-10 get positive reinforcement
       candidate.focusScore *= (1.0 - inhibition * 0.5)
       candidate.activated = True
     ELSE:
       // Rest get inhibited
       candidate.focusScore *= (1.0 + inhibition)
       candidate.activated = False

4. RE-RANK (10ms)
   // Combine BLUR and FOCUS scores
   FOR each candidate in top_10:
     candidate.finalScore =
       0.3 * candidate.blurScore +
       0.7 * candidate.focusScore

5. RETURN top 10 activated candidates
```

### MaxSim Visualized

```
Query: "sunset over mountains"
Tokens: ["sunset", "over", "mountains"]

Document: "Beautiful photo of golden sunset behind rocky peaks"
Tokens: ["Beautiful", "photo", "of", "golden", "sunset", "behind", "rocky", "peaks"]

MaxSim Calculation:
┌─────────────┬─────────────────────────────────────────┬─────────┐
│ Query Token │ Best Doc Match                         │ Sim     │
├─────────────┼─────────────────────────────────────────┼─────────┤
│ "sunset"    │ "sunset" (exact)                       │ 0.98    │
│ "over"      │ "behind" (spatial)                     │ 0.72    │
│ "mountains" │ "peaks" (synonym)                      │ 0.85    │
└─────────────┴─────────────────────────────────────────┴─────────┘
                                                       Sum: 2.55
                                                  Normalized: 0.85
```

### Parameters

| Parameter | Default | Range | Effect |
|-----------|---------|-------|--------|
| `focus_top_k` | 10 | 5-20 | How many survive FOCUS |
| `inhibition_strength` | -0.4 | -0.2 to -1.0 | WTA suppression level |
| `blur_weight` | 0.3 | 0.1-0.5 | How much BLUR score matters |

### Timing Target: 200ms

---

## Stage 3: RECALL (Context Activation)

### Purpose
Activate related memories through graph traversal. Like recognition triggering associations — "Oh, this reminds me of..."

### Algorithm

```
ALGORITHM: RECALL_ACTIVATION(candidates, index)

INPUT:
  - candidates: Top-10 from FOCUS stage
  - index: ClawMem with temporal/semantic/causal links

OUTPUT:
  - final_results: Top-10 with expanded context

STEPS:

1. PRIMARY ACTIVATION (20ms)
   // The top candidates are "recognized"
   FOR each candidate in candidates:
     candidate.state.lastActivated = now()
     candidate.state.activationCount += 1
     candidate.recallScore = candidate.finalScore

2. CONTEXT EXPANSION (60ms)
   // Activate related memories
   context_docs = []

   FOR each candidate in top_3:  // Only expand from top results
     // Temporal neighbors (what came before/after)
     temporal_neighbors = index.get_links(candidate.docId, 'temporal')
     context_docs.extend(temporal_neighbors[:3])

     // Semantic neighbors (similar content)
     semantic_neighbors = index.get_links(candidate.docId, 'semantic')
     context_docs.extend(semantic_neighbors[:2])

     // Causal neighbors (what caused/was caused by)
     causal_neighbors = index.get_links(candidate.docId, 'causal')
     context_docs.extend(causal_neighbors[:1])

3. SCORE PROPAGATION (15ms)
   // Related docs get partial activation
   FOR each context_doc in context_docs:
     IF context_doc not in candidates:
       // Inherit partial score from primary
       distance = link_distance(top_candidate, context_doc)
       context_doc.recallScore = top_candidate.finalScore * (0.5 / distance)

4. FINAL ASSEMBLY (5ms)
   // Combine primary results with context
   final_results = []

   FOR each candidate in candidates:
     result = {
       doc: candidate,
       isPrimary: True,
       context: get_context_for(candidate, context_docs)
     }
     final_results.append(result)

5. RETURN final_results with context
```

### Graph Structure

```
                    ┌──────────────┐
                    │   Doc A      │
                    │  (primary)   │
                    └──────┬───────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │   Doc B      │ │   Doc C      │ │   Doc D      │
    │  (temporal)  │ │  (semantic)  │ │   (causal)   │
    │  prev/next   │ │   similar    │ │  caused-by   │
    └──────────────┘ └──────────────┘ └──────────────┘

Link Types:
- temporal: t-1, t+1 (what happened before/after)
- semantic: similarity > 0.7 (related topics)
- causal: explicit cause-effect relationships
```

### Parameters

| Parameter | Default | Range | Effect |
|-----------|---------|-------|--------|
| `context_depth` | 1 | 1-3 | How many hops to expand |
| `temporal_weight` | 3 | 1-5 | How many temporal neighbors |
| `semantic_weight` | 2 | 1-5 | How many semantic neighbors |
| `causal_weight` | 1 | 0-3 | How many causal neighbors |
| `propagation_decay` | 0.5 | 0.3-0.7 | Score reduction per hop |

### Timing Target: 100ms

---

## Complete Pipeline

```
ALGORITHM: BLUR_FOCUS_RECALL(query, index)

TOTAL TARGET: 350ms (perceived as instant by users)

STAGE 1: BLUR (50ms)
  candidates_100 = BLUR_RETRIEVAL(query, index)

STAGE 2: FOCUS (200ms)
  candidates_10 = FOCUS_RETRIEVAL(query, candidates_100, index)

STAGE 3: RECALL (100ms)
  results = RECALL_ACTIVATION(candidates_10, index)

RETURN results
```

### Streaming Option (for UX)

```
STREAMING IMPLEMENTATION:

t=0ms:    Return {"stage": "BLUR", "status": "started"}
t=50ms:   Return {"stage": "BLUR", "candidates": top_100}
t=50ms:   Return {"stage": "FOCUS", "status": "started"}
t=250ms:  Return {"stage": "FOCUS", "candidates": top_10}
t=250ms:  Return {"stage": "RECALL", "status": "started"}
t=350ms:  Return {"stage": "RECALL", "results": final_10_with_context}

UX Benefit: User sees progressive narrowing, feels like "zeroing in"
```

---

## Integration with ClawMem

### Storage Schema

```sql
-- Core document storage (SQLite)
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  content TEXT,
  metadata JSON,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Summary vectors (for BLUR stage)
CREATE VIRTUAL TABLE vec_summary USING vec0(
  doc_id TEXT PRIMARY KEY,
  embedding FLOAT[128]
);

-- Token/patch vectors (for FOCUS stage)
CREATE TABLE vec_tokens (
  doc_id TEXT,
  token_idx INTEGER,
  embedding BLOB,  -- 128 floats
  position INTEGER,
  PRIMARY KEY (doc_id, token_idx)
);

-- Graph edges (for RECALL stage)
CREATE TABLE graph_edges (
  source_id TEXT,
  target_id TEXT,
  edge_type TEXT,  -- 'temporal', 'semantic', 'causal'
  weight REAL,
  PRIMARY KEY (source_id, target_id, edge_type)
);

-- Full-text search (for BLUR stage BM25)
CREATE VIRTUAL TABLE fts_index USING fts5(
  doc_id,
  content,
  tokenize='porter unicode61'
);
```

### Indexing Pipeline

```
ALGORITHM: INDEX_DOCUMENT(doc, moondream, index)

1. EXTRACT EMBEDDINGS
   IF doc.has_image:
     patches = split_into_patches(doc.image, grid=32x32)
     patch_embeddings = [moondream.encode_image(p) for p in patches]
     doc.embeddings.tokens = patch_embeddings

   IF doc.has_text:
     tokens = tokenize(doc.text)
     token_embeddings = [moondream.encode_text(t) for t in tokens]
     doc.embeddings.tokens.extend(token_embeddings)

   // Summary vector = mean of token vectors
   doc.embeddings.summary = mean(doc.embeddings.tokens)

2. STORE DOCUMENT
   INSERT INTO documents (id, content, metadata)
   INSERT INTO vec_summary (doc_id, embedding)
   INSERT INTO vec_tokens (doc_id, token_idx, embedding, position)

3. BUILD GRAPH EDGES
   // Temporal: Link to prev/next by timestamp
   prev_doc = SELECT id FROM documents WHERE created_at < doc.created_at ORDER BY created_at DESC LIMIT 1
   next_doc = SELECT id FROM documents WHERE created_at > doc.created_at ORDER BY created_at ASC LIMIT 1
   INSERT INTO graph_edges (source, target, type) VALUES (doc.id, prev_doc, 'temporal')
   INSERT INTO graph_edges (source, target, type) VALUES (doc.id, next_doc, 'temporal')

   // Semantic: Find similar docs
   similar = VECTOR_SEARCH(doc.embeddings.summary, k=5)
   FOR each similar_doc in similar WHERE similarity > 0.7:
     INSERT INTO graph_edges (source, target, type, weight)
     VALUES (doc.id, similar_doc.id, 'semantic', similar_doc.similarity)

4. UPDATE FTS INDEX
   INSERT INTO fts_index (doc_id, content) VALUES (doc.id, doc.text)
```

---

## Moondream Integration

### Vision Encoding

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
from PIL import Image
import numpy as np

class MoondreamEncoder:
    def __init__(self):
        self.model = AutoModelForCausalLM.from_pretrained(
            "vikhyatk/moondream2",
            trust_remote_code=True
        )
        self.tokenizer = AutoTokenizer.from_pretrained("vikhyatk/moondream2")

    def encode_image(self, image_path: str) -> np.ndarray:
        """Extract 128-dim embedding from image"""
        image = Image.open(image_path)
        embedding = self.model.encode_image(image)
        return embedding.detach().numpy()  # Shape: (128,)

    def encode_image_patches(self, image_path: str, grid_size: int = 32) -> list[np.ndarray]:
        """Split image into patches and encode each (for MaxSim)"""
        image = Image.open(image_path)
        width, height = image.size

        patch_w = width // grid_size
        patch_h = height // grid_size

        patch_embeddings = []
        for i in range(grid_size):
            for j in range(grid_size):
                patch = image.crop((
                    j * patch_w,
                    i * patch_h,
                    (j + 1) * patch_w,
                    (i + 1) * patch_h
                ))
                embedding = self.model.encode_image(patch)
                patch_embeddings.append(embedding.detach().numpy())

        return patch_embeddings  # Shape: (1024, 128) for 32x32 grid

    def encode_text(self, text: str) -> np.ndarray:
        """Extract 128-dim embedding from text"""
        # Moondream can encode text through its language model
        tokens = self.tokenizer(text, return_tensors="pt")
        embedding = self.model.encode_text(tokens)
        return embedding.detach().numpy()  # Shape: (128,)

    def encode_text_tokens(self, text: str) -> list[np.ndarray]:
        """Encode each token separately (for MaxSim)"""
        tokens = self.tokenizer.tokenize(text)
        token_embeddings = []

        for token in tokens:
            token_ids = self.tokenizer(token, return_tensors="pt")
            embedding = self.model.encode_text(token_ids)
            token_embeddings.append(embedding.detach().numpy())

        return token_embeddings  # Shape: (N, 128)
```

---

## Evaluation Protocol

### Automated Metrics

```python
def evaluate_blur_focus_recall(test_queries, ground_truth, index):
    """
    Evaluate the three-stage pipeline.

    Metrics per stage:
    - BLUR: Recall@100 (did we include the right doc?)
    - FOCUS: Recall@10, MRR@10 (how well did we rank?)
    - RECALL: nDCG@10 + context relevance (final quality)
    """

    results = {
        'blur': {'recall_100': []},
        'focus': {'recall_10': [], 'mrr_10': []},
        'recall': {'ndcg_10': [], 'context_precision': []}
    }

    for query, relevant_docs in zip(test_queries, ground_truth):

        # Stage 1: BLUR
        blur_results = blur_retrieval(query, index)
        blur_recall = len(set(blur_results) & set(relevant_docs)) / len(relevant_docs)
        results['blur']['recall_100'].append(blur_recall)

        # Stage 2: FOCUS
        focus_results = focus_retrieval(query, blur_results, index)
        focus_recall = len(set(focus_results) & set(relevant_docs)) / len(relevant_docs)
        results['focus']['recall_10'].append(focus_recall)

        # MRR: Position of first relevant doc
        for i, doc in enumerate(focus_results):
            if doc in relevant_docs:
                results['focus']['mrr_10'].append(1 / (i + 1))
                break
        else:
            results['focus']['mrr_10'].append(0)

        # Stage 3: RECALL
        final_results = recall_activation(focus_results, index)
        ndcg = calculate_ndcg(final_results, relevant_docs)
        results['recall']['ndcg_10'].append(ndcg)

    # Average metrics
    return {
        'blur_recall_100': np.mean(results['blur']['recall_100']),
        'focus_recall_10': np.mean(results['focus']['recall_10']),
        'focus_mrr_10': np.mean(results['focus']['mrr_10']),
        'recall_ndcg_10': np.mean(results['recall']['ndcg_10'])
    }
```

### Novel Metrics for Blur→Focus Experience

```python
def evaluate_temporal_experience(query_traces):
    """
    Measure the "feel" of blur→focus progression.

    Novel metrics:
    - Time-to-focus: Iterations to reach 90% of final recall
    - Sharpness curve: Smoothness of recall improvement
    - Cognitive load proxy: Variance in result changes per stage
    """

    metrics = {
        'time_to_focus': [],
        'sharpness_curve': [],
        'result_stability': []
    }

    for trace in query_traces:
        # trace = [recall@1, recall@5, recall@10, recall@50, recall@100]

        # Time-to-focus: When do we hit 90% of max recall?
        max_recall = max(trace)
        for i, recall in enumerate(trace):
            if recall >= 0.9 * max_recall:
                metrics['time_to_focus'].append(i)
                break

        # Sharpness curve: How smooth is the improvement?
        # Ideal: monotonic increase, low variance
        improvements = [trace[i+1] - trace[i] for i in range(len(trace)-1)]
        monotonic = all(imp >= 0 for imp in improvements)
        variance = np.var(improvements)
        metrics['sharpness_curve'].append({
            'monotonic': monotonic,
            'variance': variance
        })

    return metrics
```

---

## Worked Example

### Query: "Find photos from my Japan trip with temples"

```
STAGE 0: QUERY ENCODING
├── Text: "Find photos from my Japan trip with temples"
├── Tokens: ["Japan", "trip", "temples", "photos"]
├── Summary vector: [0.12, -0.34, 0.56, ...] (128-dim)
└── Token vectors: 4 x 128-dim matrix

STAGE 1: BLUR (50ms)
├── Vector search finds 200 candidates
├── BM25 search finds 200 candidates
├── Fusion: 0.7 * vector + 0.3 * BM25
├── Top 100 survive, rest inhibited
│
│   Top 5 (BLUR scores):
│   1. IMG_2847.jpg (0.82) - "Kyoto temple visit"
│   2. IMG_1912.jpg (0.79) - "Tokyo street photo"
│   3. travel_notes.md (0.76) - "Japan day 3: temples"
│   4. IMG_2851.jpg (0.74) - "Fushimi Inari gates"
│   5. IMG_0042.jpg (0.71) - "Random street photo"
│
└── Output: 100 candidates → Stage 2

STAGE 2: FOCUS (200ms)
├── MaxSim scoring on 100 candidates
├── Query token "temples" matches doc tokens:
│   - IMG_2847: matches "temple" (0.95), "Kyoto" (0.72) → MaxSim: 0.84
│   - IMG_1912: matches "Tokyo" (0.68), "street" (0.45) → MaxSim: 0.57
│   - travel_notes.md: matches "temples" (0.92), "Japan" (0.88) → MaxSim: 0.90
│   - IMG_2851: matches "Fushimi" (0.78), "Inari" (0.76) → MaxSim: 0.77
│
├── Lateral inhibition: Top-10 reinforced, rest suppressed
│
│   Re-ranked Top 5 (FOCUS scores):
│   1. travel_notes.md (0.90) - "Japan day 3: temples"
│   2. IMG_2847.jpg (0.84) - "Kyoto temple visit"
│   3. IMG_2851.jpg (0.77) - "Fushimi Inari gates"
│   4. IMG_1912.jpg (0.57) - "Tokyo street photo" (demoted)
│   5. IMG_3012.jpg (0.53) - "Nara deer park"
│
└── Output: 10 candidates → Stage 3

STAGE 3: RECALL (100ms)
├── Expand context from top 3 results
│
│   Context for "travel_notes.md":
│   - Temporal: "Japan day 2: Osaka" (prev), "Japan day 4: Tokyo" (next)
│   - Semantic: "kyoto_guide.pdf", "temple_itinerary.md"
│   - Causal: "flight_booking.pdf" (planned the trip)
│
│   Context for "IMG_2847.jpg":
│   - Temporal: IMG_2846.jpg, IMG_2848.jpg (burst photos)
│   - Semantic: IMG_2851.jpg (same temple complex)
│
├── Final output with context:
│
│   PRIMARY: travel_notes.md (0.90)
│   └─ Context: Japan day 2/4 notes, temple itinerary
│
│   PRIMARY: IMG_2847.jpg (0.84)
│   └─ Context: IMG_2846-2849 (burst), IMG_2851 (same location)
│
│   PRIMARY: IMG_2851.jpg (0.77)
│   └─ Context: Related Fushimi Inari photos
│
└── Output: 10 results with context → User

TOTAL TIME: 350ms
USER EXPERIENCE: "Zeroing in" on Japan temple photos
```

---

## Next Steps

1. **Implement storage layer**: Extend ClawMem schema with multi-vector tables
2. **Build moondream encoder**: Image → patch embeddings pipeline
3. **Implement BLUR stage**: Hybrid search with sparse firing
4. **Implement FOCUS stage**: MaxSim scoring with lateral inhibition
5. **Implement RECALL stage**: Graph traversal for context
6. **Add streaming API**: Progressive result delivery
7. **Build evaluation suite**: Standard metrics + temporal experience metrics
8. **User testing**: A/B test standard search vs. blur→focus UX

---

## References

- [ColBERT: Late Interaction over BERT](https://arxiv.org/abs/2004.12832)
- [ColPali: Visual Document Retrieval](https://arxiv.org/abs/2407.01449)
- [SNN Temporal Dynamics](https://pmc.ncbi.nlm.nih.gov/articles/PMC5099523/)
- [ClawMem Memory Store](https://github.com/danielmiessler/openclaw)
- [Moondream Vision Model](https://huggingface.co/vikhyatk/moondream2)
- [Coarse-to-Fine Retrieval](https://arxiv.org/html/2403.10746v1)
