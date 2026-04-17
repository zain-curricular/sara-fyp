# Personal Data & Storage

Rules for collecting, storing, and managing personal data in the Curricular codebase.

## What Counts as Personal Data

Any information relating to an identified or identifiable person. In this codebase:

**Student data** (special care — children):

- Display names, email addresses (optional)
- Handwritten exam images, transcribed answers
- AI-generated marks, feedback, confidence scores
- Class membership, assignment associations

**Teacher data**:

- Email, first/last name, password hash
- Consent records (version, timestamp, IP)
- Security events (login attempts, password changes)
- Conversation history (Atlas agent)

**Operational data** (may be personal):

- IP addresses, browser metadata (essential hosting)
- Page views, web vitals (consent-gated analytics)
- Rate limit keys (ephemeral, auto-expiring)

## Collection Rules

### Never Collect Without Purpose

- Every new personal data field **must map to a documented processing activity** in the ROPA (`compliance/ropa/ROPA.md`)
- If no existing processing activity covers the new field, a **new PA row is required** before the code ships

### Data Minimisation (Article 5(1)(c))

- **Only collect what you need** — if a feature works without a data field, don't collect it
- **Student email is optional** — never make it required in class rosters
- **No special category data** — no health, ethnicity, religion, biometrics. If a feature needs this, stop and escalate — it requires explicit consent under Article 9
- **Ephemeral over persistent** — prefer short-lived data (Redis TTL, session-scoped) over permanent storage

### Consent

- **Teacher consent** is collected at signup — checkbox accepting privacy policy and terms
- **Re-consent gate** — existing users see a blocking modal when consent version is stale. Version auto-derived from legal document dates
- **Student consent** is **not collected directly** — the school controller (via the DPA) authorises processing under legitimate interests (education)
- **Analytics consent** — Vercel Analytics/Speed Insights are off by default, enabled only after explicit teacher opt-in

## Storage Rules

### Database (Supabase PostgreSQL)

- **RLS on every table** containing personal data — no exceptions
- **Admin client** (`adminClient`) bypasses RLS — audit every usage, document justification
- **Cascading deletes** — when a teacher deletes their account, all associated data (classes, students, submissions, marks, conversations, files) must cascade
- **Retention periods** are defined in the DPIA §3.3 and DPA Schedule 1 §4:

| Data Category               | Retention Period                              |
| --------------------------- | --------------------------------------------- |
| Student submissions + marks | Academic year + 1 year                        |
| Teacher conversations       | 90 days from last message                     |
| Security events             | 2 years from event date                       |
| Consent records             | Agreement duration + 6 years (limitation act) |
| Rate limit keys             | Ephemeral (1 min – 24 hour TTL)               |
| AI provider API logs        | 30 days (provider-controlled)                 |

### File Storage (Supabase Storage)

- **Path-based storage RLS** — files are owned by the uploading teacher's context
- **No public buckets** for personal data — all access authenticated
- **File deletion cascades** — when submissions are deleted, associated storage files must be removed

### What to Flag

- New database column storing personal data without RLS
- New table without cascading delete logic for account deletion
- Retention period longer than documented in DPIA
- Personal data stored in a public bucket or without access control
- `adminClient` usage without documented justification
- New data collection without corresponding ROPA entry
- Consent bypass — processing personal data before consent is recorded
