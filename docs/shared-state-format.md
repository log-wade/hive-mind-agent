# Shared State Format

The hive-mind uses a shared file-based state that the central brain and workers read and update.

## Primary Store: context.md

Single source of truth for goals, strategy, tasks, and learnings.

### Structure

```markdown
# Hive Context

## Goals
- [Current high-level objective 1]
- [Current high-level objective 2]

## Strategy
[Current approach: what the brain has decided to do next]

## Pending Tasks
| ID | Description | Assigned | Status |
|----|-------------|----------|--------|
| 1  | [Task 1]    | -        | pending |
| 2  | [Task 2]    | -        | pending |

## Recent Outcomes (last 10)
| Date | Task | Status | Result |
|------|------|--------|--------|
| 2024-01-15 | [Brief] | success | [One-line summary] |

## Learnings
- [What the hive has learned from outcomes]
```

### Rules

- **Central brain** reads and writes `context.md`
- **Workers** read `context.md` for context; they do not write to it (they write outcomes to `outcomes/`)
- **Central brain** updates `context.md` after ingesting worker outcomes — adds to Recent Outcomes and Learnings, clears completed Pending Tasks

## Secondary Store: outcomes/

Workers write structured outcome files here. The central brain reads them to update `context.md`.

### Naming

`outcomes/YYYY-MM-DD-<task-slug>.md`

Example: `outcomes/2024-01-15-auth-explore.md`

### Format

```markdown
# Outcome: [Task description]

**Status:** success | partial | blocked | failed

## Result
[Summary of what was accomplished]

## Artifacts
- [path/to/created/file]

## Suggested Follow-ups
- [Optional follow-up task 1]
```

## Later: Standalone

In a standalone service, `context.md` becomes a database or key-value store. The schema above maps to tables or documents. `outcomes/` becomes an outcomes table or blob store.
