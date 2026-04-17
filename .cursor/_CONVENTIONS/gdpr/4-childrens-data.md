# Children's Data

Rules for processing children's personal data under the ICO Children's Code (Age Appropriate Design Code). All student data subjects are children aged 11–18.

## Core Principle

**The best interests of the child are the primary consideration.** Every design decision affecting student data must be evaluated through this lens. When in doubt, choose the option that minimises risk to children.

## Teacher-in-the-Loop Requirement

AI marks are **never final**. They are presented as drafts for teacher review, editing, and approval.

- No automated decision-making produces legal or similarly significant effects on children without meaningful human intervention (Article 22 safeguard)
- Parents can request **human-only marking** — their child's exams marked entirely by a teacher without AI

### What to Flag

- Any code path where AI output becomes final without teacher review
- Removal or bypassing of the teacher approval step
- New automated decisions affecting students without human oversight

## Data Minimisation for Children

Children's data gets **stricter minimisation rules** than teacher data:

- **Marking pipeline** — zero student names sent to AI. Server-side matching only
- **No special category data** — no health, ethnicity, disability, religion collected about students
- **No behavioural tracking** — no student usage analytics, engagement metrics, or gamification
- **No cross-service data combination** — student data is not combined across schools or with external sources
- **Each submission marked independently** — the AI does not build longitudinal student profiles

### What to Flag

- New student data field that isn't strictly necessary for the educational purpose
- Student identifying information added to AI prompts or tool results
- Any form of student profiling, scoring, or categorisation beyond teacher-controlled analytics
- Student data combined across different contexts (classes, schools, academic years)

## No Direct Student Access

Students **do not have accounts** and **do not access the platform**. All student data enters via teacher actions.

### What to Flag

- Any student-facing route, login flow, or authentication mechanism (student platform is paused indefinitely)
- Features that assume students interact with the system directly
- Student email being made required (it must remain optional)

## Consent and Legal Basis

| Data Subject | Legal Basis                                                | Consent Collected By    |
| ------------ | ---------------------------------------------------------- | ----------------------- |
| Students     | Legitimate interests (education) — school controller's DPA | School (not Curricular) |
| Teachers     | Consent (signup checkbox) + contract (Terms of Service)    | Curricular              |
| Parents      | N/A — rights exercised via school                          | N/A                     |

- **Curricular does not collect student consent** — the school controller authorises processing under legitimate interests
- Parental consent is **not required** because processing is for educational purposes under the school's authority
- If this basis changes (e.g. direct student access, non-educational features), consent requirements must be reassessed

## Privacy Notices

Three notices exist and must reflect actual processing:

| Notice                         | Audience          | Path                                                         |
| ------------------------------ | ----------------- | ------------------------------------------------------------ |
| Child-friendly privacy notice  | Students (13+)    | `compliance/childrens-code/CHILD-PRIVACY-NOTICE.md`          |
| Parent/guardian privacy notice | Parents           | `compliance/childrens-code/PARENT-PRIVACY-NOTICE.md`         |
| School template parent letter  | Schools → Parents | `compliance/childrens-code/SCHOOL-TEMPLATE-PARENT-LETTER.md` |

### What to Flag

- New processing activity affecting children not described in privacy notices
- Changes to AI marking process not reflected in the child-friendly explanation
- New data sharing with third parties not documented in the parent notice
