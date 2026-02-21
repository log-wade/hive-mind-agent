# Hive-Mind Reference

## Context Format (context.md)

```markdown
# Hive Context

## Goals
- [Objective 1]
- [Objective 2]

## Strategy
[Current approach]

## Pending Tasks
| ID | Description | Assigned | Status |
|----|-------------|----------|--------|
| 1  | [Task]      | -        | pending |

## Recent Outcomes (last 10)
| Date | Task | Status | Result |
|------|------|--------|--------|
| 2024-01-15 | [Brief] | success | [Summary] |

## Learnings
- [Learning 1]
```

## Outcome Format (outcomes/YYYY-MM-DD-slug.md)

```markdown
# Outcome: [Task description]

**Status:** success | partial | blocked | failed

## Result
[Summary]

## Artifacts
- path/to/file

## Suggested Follow-ups
- [Optional next task]
```

## Config Schema (hive.config.json)

```json
{
  "targetProducts": [{"name": "...", "path": "...", "description": "..."}],
  "workspaceRoots": ["/path/to/hive", "/path/to/product"],
  "contextPath": "context.md",
  "outcomesPath": "outcomes",
  "maxParallelTasks": 3
}
```

## Subagent Types

| Type | Use when |
|------|----------|
| `explore` | Codebase search, finding patterns |
| `shell` | Commands, terminal operations |
| `generalPurpose` | Research, complex tasks, enterprise roles (pass role in prompt) |

Enterprise roles: architect, implementer, reviewer, deployer, researcher, evangelist, launchSpecialist, etc. — use `generalPurpose` + role in prompt.
