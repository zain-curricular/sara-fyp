# GDPR Conventions

UK GDPR compliance checklist for the Curricular codebase. Tailored to **Next.js 15 + Supabase + TypeScript** processing **children's educational data** — covers every check the GDPR CI review agent must perform on PRs that affect data processing.

## Context

Curricular is a **processor** acting on behalf of **school controllers**. All student data subjects are children aged 11–18. The ICO Children's Code applies. Teachers are the sole platform users — students never access the system directly.

**Compliance documentation lives in `compliance/`** — DPIA, ROPA, sub-processor register, children's code assessment, breach response, data transfers, DPA template. These docs must stay in sync with the codebase.

## Compliance Architecture

```
compliance/
├── dpia/DPIA.md                          ← Data Protection Impact Assessment (v2.3)
├── ropa/ROPA.md                          ← Records of Processing Activities
├── sub-processors/
│   ├── SUB-PROCESSOR-REGISTER.md         ← All third-party processors
│   └── {provider}/                       ← Per-provider DPA reviews
├── childrens-code/
│   ├── CHILDRENS-CODE-ASSESSMENT.md      ← ICO 15-standards assessment
│   ├── CHILD-PRIVACY-NOTICE.md           ← Student-facing notice
│   └── PARENT-PRIVACY-NOTICE.md          ← Parent/guardian notice
├── data-transfers/
│   └── TRANSFER-IMPACT-ASSESSMENT.md     ← Cross-border transfer analysis
├── breach-response/
│   └── BREACH-RESPONSE-PLAN.md           ← Incident response procedures
├── dpa-template/
│   ├── DPA-TEMPLATE.md                   ← School-facing DPA
│   ├── SCHEDULE-1-processing-details.md  ← Processing activities
│   ├── SCHEDULE-2-security-measures.md   ← Security measures
│   └── SCHEDULE-3-sub-processors.md      ← Sub-processor list
├── notification-templates/               ← Breach notification templates
└── ico-registration/                     ← ICO registration checklist
```

## Review Decision Tree

```
Changed file →
├── New DB column/table storing personal data?   → Check personal data rules (2-personal-data-and-storage.md)
├── New/changed API call to external service?     → Check data flows (3-data-flows-and-sub-processors.md)
├── Touches student data processing?              → Check children's data (4-childrens-data.md)
├── Changes consent collection or withdrawal?     → Check personal data rules (2-personal-data-and-storage.md)
├── New migration or schema change?               → Check doc update triggers (5-documentation-update-triggers.md)
├── Changes data retention or deletion logic?     → Check personal data rules + doc triggers
├── Adds/changes a third-party SDK or service?    → Check data flows + doc triggers
└── Modifies AI prompt content or tool results?   → Check children's data + data flows
```

## Severity Framework

| Severity     | Definition                                                         | Example                                                |
| ------------ | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Critical** | Unlawful processing, breach risk, or children's data exposed       | Student PII sent to unvetted third party, no DPA       |
| **High**     | Material compliance gap requiring documentation or code fix        | New data collection without ROPA update, consent drift |
| **Medium**   | Documentation drift — code changed but compliance docs not updated | New sub-processor without register update              |
| **Low**      | Best practice gap, no immediate compliance risk                    | Retention policy could be tightened                    |
| **Info**     | Reminder to review compliance docs at next scheduled review        | Processing activity unchanged but approaching review   |

## Data Subject Categories

| Category     | Ages  | Direct Platform Access | Data Enters Via            |
| ------------ | ----- | ---------------------- | -------------------------- |
| **Students** | 11–18 | **No**                 | Teacher uploads/actions    |
| **Teachers** | 18+   | **Yes**                | Self-registration          |
| **Parents**  | 18+   | **No**                 | Rights requests via school |

## Active Sub-Processors

| Provider | Purpose                  | Children's Data? | Transfer Destination |
| -------- | ------------------------ | ---------------- | -------------------- |
| Google   | AI marking + Atlas agent | **Yes**          | US                   |
| Supabase | Database, auth, storage  | **Yes**          | UK (eu-west-2)       |
| Vercel   | Hosting, analytics       | No               | US                   |
| Resend   | Transactional email      | No               | US                   |
| Upstash  | Rate limiting (Redis)    | No               | EU                   |

## Files

[Personal Data & Storage](./2-personal-data-and-storage.md) → [Data Flows & Sub-Processors](./3-data-flows-and-sub-processors.md) → [Children's Data](./4-childrens-data.md) → [Documentation Update Triggers](./5-documentation-update-triggers.md)
