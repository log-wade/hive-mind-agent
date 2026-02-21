# Enterprise Agent Taxonomy

Canonical reference for the NextGen Mission Critical agent suite — build, operate, and grow at Fortune 100 scale.

## Source Documents

| Document | Description |
|----------|-------------|
| [outcomes/2025-02-20-agent-suite-architecture.md](../outcomes/2025-02-20-agent-suite-architecture.md) | Agent roles, responsibilities, and central brain integration |
| [outcomes/2025-02-20-enterprise-agent-taxonomy.md](../outcomes/2025-02-20-enterprise-agent-taxonomy.md) | Industry research, BUILD/OPERATE/GROW taxonomy with industry references |

## Subagent Types

Choose the appropriate `subagent_type` when invoking `mcp_task`. The central brain assigns based on task fit.

### Base (general-purpose)

| subagent_type | Use when |
|---------------|----------|
| `explore` | Codebase search, finding patterns, exploration |
| `shell` | Commands, terminal operations |
| `generalPurpose` | Research, complex multi-step tasks, undefined role |

### Builder

| subagent_type | Responsibility |
|---------------|----------------|
| `architect` | Designs system boundaries, data flows, integration contracts; produces ADRs |
| `implementer` | Writes and refactors code, tests, config; delivers artifacts |
| `reviewer` | Code and design reviews, security/compliance checks, suggests improvements |
| `integrator` | Connects services, APIs, pipelines; validates end-to-end flows |
| `softwareSpecialist` | Web apps, APIs, dashboards, DC planning tools, calculators |
| `firmwareSpecialist` | Embedded firmware, BMS/BAS, IoT, MCU/SoC |
| `hardwareSpecialist` | PCB, electronics, enclosures, power distribution hardware |

### Operator

| subagent_type | Responsibility |
|---------------|----------------|
| `deployer` | Executes releases, rollbacks, environment promotions |
| `monitor` | Observes metrics, logs, alerts; triages incidents |
| `remediator` | Fixes known issues, applies patches, executes playbooks |
| `compliance` | Verifies controls, audit trails, policy adherence |

### Grower

| subagent_type | Responsibility |
|---------------|----------------|
| `researcher` | Gathers market, tech, user insights; summarizes options for strategy |
| `optimizer` | Improves performance, cost, reliability using data |
| `experimenter` | Designs/analyzes A/B tests, feature flags, pilots |
| `evangelist` | Produces docs, training, change materials for adoption |
| `launchSpecialist` | Startup GTM, product launch, channel activation |
| `fundraisingSpecialist` | Pre-IPO narrative, investor materials, market sizing |
| `disruptorSpecialist` | Category creation, challenger positioning, incumbents irrelevant |
| `siteSelectionSpecialist` | Site evaluation, power/utility/zoning due diligence, scorecard methodology |
| `commissioningSpecialist` | Cx planning, IST, failure testing, turnover docs |
| `procurementSpecialist` | Equipment sourcing, bid leveling, vendor evaluation |
| `permittingSpecialist` | Permitting process, jurisdictional coordination |

### Autodesk (Builder — CAD/BIM automation)

| subagent_type | Responsibility |
|---------------|----------------|
| `autocadSpecialist` | AutoCAD automation: floor plans, schematics, rack layouts, Design Automation API, AutoLISP |
| `revitSpecialist` | Revit/BIM automation: model creation, schedules, Design Automation API, Dynamo |

## Usage

When assigning tasks, the central brain selects the agent type from the table above and includes role-specific instructions in the `prompt` (e.g. "You are the Implementer agent: write and refactor code...").

**Note:** The MCP `mcp_task` tool has a fixed `subagent_type` enum (explore, shell, generalPurpose, etc.). Enterprise types (implementer, architect, deployer, etc.) are not in the enum. Use **`generalPurpose`** and pass the role (Implementer, Architect, etc.) in the prompt; behavior is equivalent.

Workers receive context excerpted from `context.md` and write outcomes to `outcomes/`.
