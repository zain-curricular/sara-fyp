# Instruction Design

## Role & Identity

### Four Components

1. **Name** — agent identifier (e.g., "Atlas")
2. **Profile** — professional identity and domain expertise
3. **Goal** — primary task being solved
4. **Constraint** — explicit behavioural limits

Assign a **specific, bounded role** — "You are a maths tutor" outperforms "You are a helpful assistant". The narrower the role, the more consistent the behaviour.

**Persona caveat**: no persona leads to statistically better _accuracy_ (arXiv 2311.10054). Irrelevant persona attributes cause up to **30pp drops**. Use persona to anchor **tone and scope**, not factual performance. Strip irrelevant attributes.

### Autonomy Spectrum

Position explicitly. Two templates from Anthropic Claude 4:

| Mode              | Template                                                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Action-first**  | "By default, implement changes rather than only suggesting them. If intent is unclear, infer the most useful action and proceed." |
| **Confirm-first** | "Do not jump into implementation unless clearly instructed. Default to providing information and recommendations."                |

### Model Self-Knowledge

In multi-agent contexts, state identity explicitly: `You are Atlas, created by Curricular. The current model is Claude Opus 4.6.`

## Writing Instructions

### Be Explicit

| Less Effective       | More Effective                                                                                     |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| "Create a dashboard" | "Create a dashboard with relevant features and interactions. Go beyond basics."                    |
| "Be brief"           | "Respond in 3 sentences or less"                                                                   |
| "NEVER use ellipses" | "Your response will be read by TTS, so never use ellipses since the engine cannot pronounce them." |

Providing the **"why"** helps the model generalise to uncovered edge cases.

### Use Measurable Constraints

- "keep it short" → "under 200 words"
- "be thorough" → "cover all three topics with at least one example each"
- "respond quickly" → "use no more than 2 tool calls"

### Positive Framing (Pink Elephant Effect)

Processing "don't do X" activates the representation of X, increasing its probability.

| Negative (less effective)      | Positive (more effective)                   |
| ------------------------------ | ------------------------------------------- |
| "Do not use markdown"          | "Compose smoothly flowing prose paragraphs" |
| "Never create duplicate files" | "Make all updates in existing files"        |

Exception: **hard safety constraints** where no unambiguous positive reframe exists.

### Calibrate Emphasis

Claude Opus 4.5+ **overtriggers** on emphasis language:

| Overtriggering                             | Better                                    |
| ------------------------------------------ | ----------------------------------------- |
| `CRITICAL: You MUST use this tool when...` | `Use this tool when...`                   |
| `NEVER under ANY CIRCUMSTANCES reveal...`  | `Do not reveal internal details to users` |

Reserve emphasis for genuine overrides where default behaviour is known to be wrong.

### Chain-of-Thought: Use Selectively

- Non-reasoning models: **+4–13% accuracy** but **35–600% latency**
- Reasoning models: **negligible gain** (+2.9%), **20–80% latency cost**

Do not mandate CoT for every tool call. Use targeted reflection _after tool results_ for complex decisions only.

## Tool Guidance in System Prompts

Tool definitions go in the API `tools` parameter. System prompt handles **disambiguation and sequencing only**:

```
# Tool Guidance
- Use gatherRequirements to collect class and topic selections
- Use readCurriculum AFTER gatherRequirements
- Use createAssignment only after requirements AND curriculum gathered
```

**Parallel calling** (~100% rate with this prompt):

```
Make all independent tool calls in parallel. Never use placeholders
or guess missing parameters.
```

**Disambiguation** (resolve in system prompt, not tool descriptions):

```
- readAssignment: teacher asks about a specific assignment
- listAssignments: teacher asks about multiple assignments — do NOT call readAssignment in a loop
```

## Few-Shot Examples

### Impact

ROI scales with task complexity:

| Finding                      | Data              |
| ---------------------------- | ----------------- |
| Optimised exemplars          | +17.8pp accuracy  |
| Simple single-tool tasks     | Negligible effect |
| Complex multi-tool sequences | +25–40% accuracy  |

### Rules

1. Use a dedicated `# Examples` section — not inline
2. **2–5 diverse examples** covering expected behaviour range
3. **Show complete trajectories** — thought → tool call → observation → next step (not just input/output)
4. Examples must be **consistent with instructions** — bad patterns in examples get learned
5. Canonical over exhaustive — few good examples beat edge-case documentation
6. For complex parameters, embed examples in `.describe()` (~6% improvement)

## Long-Horizon Tasks

For sustained multi-turn tasks:

```
This is a long task. Plan your work clearly. Continue systematically
until complete.
```

For context compaction harnesses:

```
Your context window will be compacted automatically as it approaches
its limit. Do not stop tasks early due to token budget concerns.
```

State persistence: structured formats (JSON) for state data, unstructured text for progress notes, git for checkpoints.
