# Data Flows & Sub-Processors

Rules for sending personal data to third-party services and managing sub-processor compliance.

## Current Data Flow Architecture

```
Teacher (Browser)
│
├── Supabase (UK — eu-west-2)
│   ├── Database — all personal data at rest
│   ├── Auth — teacher identity
│   └── Storage — exam images, files
│
├── Google Gemini (US)
│   ├── Marking pipeline — exam answers (NO student names)
│   └── Atlas agent — analytics queries (student names in tool results)
│
├── Vercel (US)
│   ├── Hosting — essential request metadata
│   └── Analytics — consent-gated only (no student data)
│
├── Resend (US)
│   └── Email — teacher addresses only (no student data)
│
├── Sentry (US)
│   └── Error monitoring — stack traces, performance timing (NO PII — sendDefaultPii: false)
│
└── Upstash (EU)
    └── Rate limiting — ephemeral teacher IDs as Redis keys
```

## Adding a New External Service

Any new API call, SDK, or third-party integration that **sends or receives personal data** triggers the sub-processor onboarding process. This applies even if the service claims not to store data.

### Before Code Ships

1. **Verify DPA exists** — the provider must have a Data Processing Agreement covering UK GDPR
2. **Review the DPA** — create `compliance/sub-processors/{provider}/{provider}-dpa-review.md` following existing review format
3. **Update the sub-processor register** — add entry to `compliance/sub-processors/SUB-PROCESSOR-REGISTER.md`
4. **Assess transfer mechanism** — if data leaves the UK, document the transfer basis in `compliance/data-transfers/TRANSFER-IMPACT-ASSESSMENT.md`
5. **Update the ROPA** — add or modify the relevant processing activity in `compliance/ropa/ROPA.md`
6. **Update the DPIA** — add the provider to §7.5 and assess new risks in §8–9

### School Notification

Under Article 28(2), schools must be notified **30 days before** a new sub-processor is activated. The change notification process is documented in the sub-processor register.

## Data Transfer Rules (International)

All cross-border transfers of personal data must have a **documented legal basis**:

| Transfer Destination | Primary Mechanism                      | Backup Mechanism       |
| -------------------- | -------------------------------------- | ---------------------- |
| US (DPF-certified)   | UK-US Data Bridge (DPF + UK Extension) | EU SCCs                |
| US (not DPF)         | EU SCCs + UK Addendum                  | Supplementary measures |
| EU/EEA               | UK adequacy decision                   | None needed            |
| Other                | EU SCCs + Transfer Impact Assessment   | Supplementary measures |

### What to Flag

- **New `fetch()`, SDK call, or API integration** sending personal data to an external service
- External service **not listed** in the sub-processor register
- Data sent to a **US provider without verified DPF certification**
- Personal data sent to **any provider without a DPA**
- **Model training** — verify the provider's paid tier prohibits training on customer data
- Inactive providers (**OpenAI**, **Anthropic**) being activated without DPA verification

## AI-Specific Data Flow Rules

The AI pipeline has strict rules about what data is sent to providers:

### Marking Pipeline (Google Gemini)

- **Zero student PII** — names, emails, and roster data are never sent to the marking AI
- Server-side fuzzy matching (Levenshtein + token comparison) replaces AI-based name identification
- Only exam answers and mark schemes are sent
- **Flag**: any change that adds student identifying information to marking prompts

### Atlas Agent (Google Gemini)

- Student **display names, answers, marks, and feedback** are sent as tool call results (accepted risk R13)
- Student **email addresses are never sent** — stripped from all analytics tool results
- This is **teacher-triggered** (on-demand), not automated batch processing
- **Flag**: any change that adds student email or other new PII categories to Atlas tool results

### General AI Rules

- **30-day API log retention** — all AI providers retain logs for abuse detection only, then delete
- **No model training** — all providers are on paid tiers prohibiting customer data for training
- **Flag**: switching to a free tier, enabling model improvement flags, or changing to a provider without training prohibitions
