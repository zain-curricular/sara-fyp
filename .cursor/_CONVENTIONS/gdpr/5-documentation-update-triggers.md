# Documentation Update Triggers

When code changes affect data processing, the compliance documentation **must be updated before or alongside the code change**. Documentation drift — where the codebase no longer matches what the compliance docs describe — is a compliance risk.

## Master Trigger Table

| Code Change                                        | Documents to Update                                                                                |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **New DB table/column with personal data**         | ROPA, DPIA §3 (data inventory), DPA Schedule 1                                                     |
| **New third-party service processing data**        | Sub-processor register, DPIA §7.5, DPA Schedule 3, TIA (if cross-border), ROPA                     |
| **Changed/removed third-party service**            | Sub-processor register, DPIA §7.5, DPA Schedule 3, TIA, ROPA                                       |
| **New AI provider or model switch**                | Sub-processor register, DPIA §7.5 + §8–9 (risk assessment), children's code §8 (data minimisation) |
| **Student PII sent to new destination**            | DPIA §3 + §8–9, ROPA, children's code §8, privacy notices (child + parent)                         |
| **Changed data retention logic**                   | DPIA §3.3, DPA Schedule 1 §4, ROPA                                                                 |
| **New consent collection or changed consent flow** | DPIA §6 (lawful basis), privacy policy (`/privacy`), DPA Template                                  |
| **New cross-border data transfer**                 | TIA (new transfer entry), DPA Schedule 3, sub-processor register, ROPA §3                          |
| **Changed security measures**                      | DPA Schedule 2, DPIA §7 (security measures)                                                        |
| **New processing activity**                        | ROPA (new PA row), DPIA §3, DPA Schedule 1                                                         |
| **Account deletion logic changed**                 | DPIA §3.3 (retention), children's code §15 (online tools)                                          |
| **AI prompt changes affecting student data**       | DPIA §8–9 (risk register), children's code §1 (best interests) + §8 (minimisation)                 |
| **Student platform unpaused**                      | Full reassessment: DPIA, children's code (standards 1, 3, 7, 11, 12, 13, 15), privacy notices      |

## Document Locations Quick Reference

| Document                       | Path                                                       | Key Sections                                               |
| ------------------------------ | ---------------------------------------------------------- | ---------------------------------------------------------- |
| **DPIA**                       | `compliance/dpia/DPIA.md`                                  | §3 data inventory, §7.5 sub-processors, §8–9 risk register |
| **ROPA**                       | `compliance/ropa/ROPA.md`                                  | §1 processing activities, §2 sub-processors, §3 transfers  |
| **Sub-processor register**     | `compliance/sub-processors/SUB-PROCESSOR-REGISTER.md`      | Active providers, inactive providers, change log           |
| **Transfer Impact Assessment** | `compliance/data-transfers/TRANSFER-IMPACT-ASSESSMENT.md`  | Per-transfer entries (T1–T4)                               |
| **Children's Code Assessment** | `compliance/childrens-code/CHILDRENS-CODE-ASSESSMENT.md`   | 15 standards, reassessment triggers table                  |
| **DPA Template**               | `compliance/dpa-template/DPA-TEMPLATE.md`                  | Processing terms                                           |
| **DPA Schedule 1**             | `compliance/dpa-template/SCHEDULE-1-processing-details.md` | Processing activities, retention                           |
| **DPA Schedule 2**             | `compliance/dpa-template/SCHEDULE-2-security-measures.md`  | Technical + organisational measures                        |
| **DPA Schedule 3**             | `compliance/dpa-template/SCHEDULE-3-sub-processors.md`     | Approved sub-processors                                    |
| **Privacy Policy**             | App route `/privacy`                                       | User-facing privacy policy                                 |
| **Child Privacy Notice**       | `compliance/childrens-code/CHILD-PRIVACY-NOTICE.md`        | Student-facing explanation                                 |
| **Parent Privacy Notice**      | `compliance/childrens-code/PARENT-PRIVACY-NOTICE.md`       | Full Article 13–14 notice                                  |
| **Breach Response Plan**       | `compliance/breach-response/BREACH-RESPONSE-PLAN.md`       | Incident procedures                                        |

## How to Flag Documentation Drift

When the CI agent detects a code change matching the trigger table but **no corresponding documentation update in the same PR**:

1. **Comment on the PR** identifying the specific code change and which documents need updating
2. **Label the PR** `gdpr-review-needed`
3. **Reference the specific document sections** that likely need changes (use the key sections column above)
4. **Severity: Medium** for documentation drift — it's not an immediate breach, but it creates compliance risk

## Review Schedule Reminders

All compliance documents have scheduled review dates independent of code changes:

| Document                   | Review Frequency                 | Next Review |
| -------------------------- | -------------------------------- | ----------- |
| DPIA                       | Annually (or on material change) | March 2027  |
| ROPA                       | Quarterly                        | June 2026   |
| Sub-processor register     | Annually (or on change)          | March 2027  |
| Children's Code Assessment | Annually (or on material change) | March 2027  |
| Transfer Impact Assessment | Annually (or on transfer change) | March 2027  |
| Breach Response Plan       | Annually (or post-incident)      | March 2027  |
| DPF certifications         | Annually                         | March 2027  |
