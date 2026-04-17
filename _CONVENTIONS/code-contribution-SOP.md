# Contribution Procedure

Standard operating procedure for working on features, bug fixes, and enhancements. Every code change follows this flow — no exceptions.

## 1. Branch from a Linear Task

Every branch **must** be linked to a Linear task. No unlinked branches.

1. Open your assigned task in Linear
2. Click **"Copy branch name"** — Linear generates a branch name in the format `username/cur-XXX-task-title`
3. Create the branch locally:

```bash
git checkout -b <paste-branch-name>
```

### Planning Large Features

If the task requires significant planning before execution:

- **Create sub-issues** under the parent task in Linear — break the work into discrete, shippable chunks
- **Set sub-issues to "In Review"** if a senior needs to approve the plan before you start coding
- For small tasks, skip sub-issues — just work directly on the task

## 2. Push as a Remote Tracking Branch

Push your branch immediately so the team can see what you're working on:

```bash
git push -u origin <branch-name>
```

This links your local branch to the remote and makes your work visible in GitHub and Linear.

## 3. Update Linear Status

Set the Linear task to **In Progress** as soon as you start coding. Keep the status accurate throughout:

| Status          | When to Set                                               |
| --------------- | --------------------------------------------------------- |
| **Backlog**     | Task exists but has no concrete plan yet                  |
| **Todo**        | Planned and ready to start, but not yet started           |
| **In Progress** | You've started working on the code                        |
| **In Review**   | PR is open and waiting for review                         |
| **Done**        | _Never set this yourself_ — a senior marks it after merge |

If you get blocked or need to context-switch, move the task back to **Todo** with a comment explaining why.

## 4. Build the Feature

Work on the feature following the project's coding conventions. Key things to remember:

- **Commit atomically** — each commit should represent one logical change, not a dump of all work at the end
- **Write descriptive commit messages** — explain _why_, not just _what_. Use AI for commiting with strong clear messages
- **Run tests as you go** — don't wait until the end to discover breakages

### Commit Hygiene

```bash
# Good — atomic, descriptive
git commit -m "Add validation schema for submission responses"
git commit -m "Fix curriculum mapper returning duplicate topic IDs"

# Bad — vague, monolithic
git commit -m "WIP"
git commit -m "Done"
git commit -m "Fix stuff"
```

## 5. Ensure Observability

Before writing tests, verify that your code has proper logging and observability. The project has **observability conventions** and a dedicated **`/observability` skill** that Claude Code can invoke to load all logging best practices.

### Using the Observability Skill

Ask Claude Code to review your work for observability compliance:

```
Review all the code I've worked on in this task to ensure it aligns with
the project's observability best practices. Invoke /observability first
to load the conventions, then audit my changes.
```

### What Gets Checked

- **Debug logging** — data access functions, pipeline steps, and agent operations have appropriate `logger.debug()` calls
- **Error and warning logging** — caught errors are logged with full context before being re-thrown or handled
- **Log context** — structured metadata (IDs, counts, durations) is attached to log entries

**Tip:** Use **observability sub-agents** to carry this out quickly — Claude Code can spawn specialist agents that audit multiple files in parallel.

## 6. Write New Tests

If you've added new data access functions, utility functions, pipeline steps, or any standalone logic — **write tests for it**. If you've changed existing behavior, update the affected tests.

### What Needs Tests

- **Data access functions** — integration tests that verify queries against a real Supabase instance
- **Pure utility functions** — unit tests for transforms, validators, formatters, and helpers
- **Pipeline steps** — unit tests for individual agent steps with mocked I/O
- **API route handlers** — integration tests for request/response contracts

### Using the Test Writing Skills

The project has two dedicated skills that load all testing conventions into context:

- **`/unit-testing`** — loads unit test conventions, factory patterns, and mocking strategies
- **`/integration-testing`** — loads integration test conventions, seed functions, and database test patterns

Ask Claude Code to invoke the relevant skill before writing tests:

```
Invoke /unit-testing, then write unit tests for the new utility functions
I've added in this task. Use test specialist sub-agents to write tests
for multiple files in parallel.
```

**Tip:** Claude Code has **specialist test-writing sub-agents** (`unit-test-specialist` and `integration-test-specialist`) that can write tests across multiple files in parallel.

## 7. Update Documentation

Every code change should leave documentation at least as good as you found it.

- Update relevant **file headers** if you've changed a file's purpose or integrations
- Update **README files** in affected feature directories
- Update **CLAUDE.md** if you've changed architecture, added new modules, or altered conventions
- Update **barrel exports** (`index.ts`) if you've added or removed public APIs

**Tip:** Use Claude Code sub-agents to help read and update documentation across multiple files in parallel.

## 8. Run the Full Test Suite

Before considering your work done, **all tests must pass**:

```bash
# Unit tests
npm run test:unit:ci

# Integration tests (requires local Supabase running)
npm run test:integration

# Lint
npm run lint

# Type check + build
npm run build
```

**All four must pass.** Fix any failures before moving on — do not rely on the PR review to catch broken tests.

## 9. Write a Manual Testing Checklist

Before creating a PR, write a checklist of manual tests to complete. This goes in your PR description. Think about:

- **Happy path** — does the core feature work end-to-end?
- **Edge cases** — empty states, large inputs, concurrent operations
- **Permissions** — does auth work correctly? Can unauthorized users access anything?
- **Regressions** — did you break anything adjacent to your changes?

Complete the checklist yourself before opening the PR.

## 10. Pre-Push Checks

Before pushing your final changes, run the full verification suite:

```bash
npm run lint && npm run build && npm run test:all
```

This catches issues that would otherwise block your PR. Fix anything that fails before pushing.

## 11. Push and Create a PR into Staging

Push your branch and create a pull request targeting **staging**:

```bash
git push
```

### PR Description

Your PR message should contain a thorough overview of all changes since you branched. Use Claude Code to analyze your commits and generate a comprehensive summary:

```
# In Claude Code, ask it to review your commits and write a PR summary
# It will analyze git log, diffs, and produce a structured overview
```

The PR description should include:

- **Summary** — what was built/fixed and why
- **Key changes** — organized by area (API, UI, data layer, etc.)
- **Manual testing checklist** — from step 9
- **Screenshots** — if there are UI changes

### Linear Auto-Sync

If you used the branch name copied from Linear (step 1), the PR will **automatically link** to the Linear task. No manual linking required.

## 12. Handle Merge Conflicts

If staging has diverged from your branch:

1. **Rebase onto staging** (preferred for clean history):

```bash
git fetch origin
git rebase origin/staging
```

2. Resolve conflicts carefully — if unsure about a conflict, ask the author of the conflicting code
3. Re-run the full test suite after resolving
4. Force-push your branch (only acceptable after a rebase):

```bash
git push --force-with-lease
```

**Use `--force-with-lease`**, never `--force` — it protects against overwriting someone else's pushes.

## 13. Request Review

- **Never merge into staging without approval** from a senior developer or designated reviewer
- Request a review from the appropriate person in GitHub
- Update the Linear task status to **In Review**
- Respond to review feedback promptly — push fixes as new commits, don't force-push during review

## 14. Post-Merge Cleanup

After your PR is approved and merged:

1. **Delete your remote branch** — GitHub offers this button after merge, or:

```bash
git push origin --delete <branch-name>
```

2. **Delete your local branch**:

```bash
git checkout main && git pull && git branch -d <branch-name>
```

3. **Do not** set the Linear task to Done — a senior will do this after verifying the merge

## Quick Reference

```
Linear Task → Copy Branch Name → Create Branch → Push -u →
Work (atomic commits) → Observability Audit → Write Tests →
Update Docs → Full Test Suite → Manual Test Checklist →
Pre-Push Checks → Push → Create PR → Resolve Conflicts →
Request Review → Address Feedback → Merge (senior approval) → Delete Branch
```
