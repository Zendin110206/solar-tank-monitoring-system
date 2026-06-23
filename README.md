# Solar Tank Monitoring System

![Project Status](https://img.shields.io/badge/status-foundation_scaffold-blue)
![Stack](https://img.shields.io/badge/stack-Next.js%20%7C%20TypeScript%20%7C%20Telemetry-111827)
![License](https://img.shields.io/badge/license-MIT-green)

Solar Tank Monitoring System is a portfolio-grade full-stack application scaffold for monitoring fuel tank telemetry, estimated remaining volume, runtime availability, and operational status from IoT-style device data.

The repository is currently focused on building a clean, maintainable project foundation before implementation work begins. The structure is prepared for a future dashboard, telemetry ingestion API, tank-volume calculation module, simulator, alerting workflow, and deployment documentation.

## Project Status

Current phase:

```text
Repository foundation and public-safe project structure.
```

The repository currently contains:

- a Next.js application scaffold;
- public-safe repository documentation;
- a mature folder structure for future dashboard, telemetry, device, tank, simulator, deployment, and firmware work;
- empty documentation and source placeholders for the next implementation phase.

The repository does not yet contain a production monitoring system, real device integration, real tank data, real credentials, or organization-specific deployment details.

## Project Goal

The long-term goal is to provide a practical monitoring platform for fuel tank operations:

1. devices or simulators send telemetry readings;
2. the application validates and normalizes incoming payloads;
3. tank geometry and calibration settings convert sensor distance into fuel volume;
4. runtime estimates are calculated from remaining volume and configured consumption rate;
5. dashboard views show current level, status, history, and operational signals;
6. future alerting can notify users when runtime or data freshness enters a risky state.

## Product Principle

```text
Telemetry informs, operators decide.
```

The system should support operational awareness. It should not claim production readiness, site safety, or measurement accuracy before real hardware calibration, domain review, deployment review, and safety validation are completed.

## Current Scope

This repository is intentionally public-safe and implementation-ready. It is prepared for:

- local development with dummy data;
- simulator-driven telemetry during early development;
- configurable tank geometry;
- dashboard-first monitoring workflows;
- clean API contracts for future IoT ingestion;
- documentation suitable for reviewers and collaborators.

This repository intentionally excludes:

- real customer or organization names;
- private network information;
- real domain configuration;
- API keys, database credentials, device secrets, or WiFi credentials;
- copied private deployment folders or artifacts;
- hardware claims that have not been validated.

## Design Lessons Applied

The repository structure is informed by an existing field-monitoring prototype audit. The following lessons are applied without copying private source code or credentials:

- devices should push telemetry to an API instead of requiring a public website to pull data from a local network device;
- server-side validation should own ingestion, normalization, persistence, and response shaping;
- tank formula logic should be isolated and testable because rectangular tanks, vertical cylinders, and horizontal cylinders use different calculations;
- payload adapters should support evolving firmware formats without forcing dashboard code to understand every raw payload shape;
- dummy data and simulators should unblock development before hardware access is finalized;
- deployment concerns should be documented separately from domain logic;
- secrets must never be committed.

## Planned Product Surface

### Operations Dashboard

Planned responsibilities:

- show all monitored sites or tanks;
- highlight latest volume, level percentage, estimated runtime, and data freshness;
- separate healthy, warning, and critical states;
- support search, filtering, and fast scanning.

### Tank Detail View

Planned responsibilities:

- show one tank/device in detail;
- display current telemetry;
- show historical volume and percentage trend;
- expose device metadata and calibration assumptions;
- show the latest accepted payload timestamp.

### Telemetry Ingestion API

Planned responsibilities:

- accept device or simulator payloads;
- validate required headers or device credentials;
- normalize raw payload fields;
- store raw and normalized readings;
- return clear success and error responses.

### Simulator

Planned responsibilities:

- generate realistic dummy telemetry;
- simulate decreasing fuel level;
- simulate refuel events;
- simulate stale or offline device behavior;
- allow dashboard development without physical hardware.

### Alerting and Status Rules

Planned responsibilities:

- derive status from estimated runtime;
- derive freshness status from last telemetry timestamp;
- support threshold changes per site or device;
- prepare future notification integration.

## Architecture

Planned high-level flow:

```text
IoT Device or Local Simulator
  -> Telemetry Ingestion API
  -> Payload Validation
  -> Payload Normalization
  -> Storage Layer
  -> Dashboard Queries
  -> Web Dashboard and Charts
```

The frontend should not read sensors directly. Devices or simulators send telemetry to the server, and the dashboard reads clean data from application APIs.

## Stack

Current scaffold:

- Next.js 16 with App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Recharts for future dashboard visualization
- lucide-react for interface icons
- Vitest for future domain logic tests
- pnpm for package management

Planned additions are expected to be introduced only when implementation work needs them.

## Repository Structure

```text
.
├── .github/
│   ├── ISSUE_TEMPLATE/
│   └── workflows/
├── database/
│   ├── migrations/
│   └── seed/
├── deploy/
│   ├── caddy/
│   ├── docker/
│   ├── self-hosted/
│   └── vercel/
├── docs/
│   ├── api/
│   ├── decisions/
│   ├── deployment/
│   ├── domain/
│   ├── operations/
│   ├── references/
│   ├── architecture.md
│   ├── api-contract.md
│   ├── data-model.md
│   ├── decision-log.md
│   ├── deployment.md
│   ├── development-log.md
│   ├── device-ingestion.md
│   ├── domain-model.md
│   ├── reviewer-quickstart.md
│   ├── roadmap.md
│   ├── safety-and-limitations.md
│   └── system-boundaries.md
├── examples/
│   ├── api-clients/
│   ├── curl/
│   └── payloads/
├── firmware/
│   ├── docs/
│   ├── nodemcu/
│   └── simulator/
├── public/
├── references/
│   └── existing-system-audit/
├── scripts/
│   ├── data/
│   ├── dev/
│   └── verification/
├── src/
│   ├── app/
│   │   ├── api/
│   │   ├── alerts/
│   │   ├── dashboard/
│   │   ├── login/
│   │   ├── settings/
│   │   ├── sites/
│   │   └── tanks/
│   ├── components/
│   │   ├── charts/
│   │   ├── dashboard/
│   │   ├── forms/
│   │   ├── layout/
│   │   ├── maps/
│   │   ├── status/
│   │   ├── tanks/
│   │   ├── telemetry/
│   │   └── ui/
│   ├── data/
│   │   ├── fixtures/
│   │   ├── mock/
│   │   └── seed/
│   ├── features/
│   │   ├── alerts/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── devices/
│   │   ├── ingestion/
│   │   ├── maps/
│   │   ├── runtime/
│   │   ├── simulator/
│   │   ├── tanks/
│   │   └── telemetry/
│   ├── lib/
│   │   ├── calculations/
│   │   ├── config/
│   │   ├── constants/
│   │   ├── dates/
│   │   ├── db/
│   │   ├── domain/
│   │   ├── errors/
│   │   ├── ingestion/
│   │   ├── security/
│   │   ├── telemetry/
│   │   └── validation/
│   ├── server/
│   │   ├── actions/
│   │   ├── repositories/
│   │   ├── services/
│   │   └── use-cases/
│   └── types/
├── tests/
│   ├── e2e/
│   ├── fixtures/
│   ├── integration/
│   └── unit/
├── .env.example
├── CONTRIBUTING.md
├── LICENSE
├── SECURITY.md
├── package.json
└── README.md
```

## Local Setup

Install dependencies:

```powershell
pnpm install
```

Run the local development server:

```powershell
pnpm dev
```

Open:

```text
http://localhost:3000
```

Run linting:

```powershell
pnpm lint
```

Run type checking:

```powershell
pnpm typecheck
```

Run tests:

```powershell
pnpm test
```

Run the full local verification command:

```powershell
pnpm check
```

Build the app:

```powershell
pnpm build
```

## Environment Variables

Copy the example environment file before introducing local runtime values:

```powershell
Copy-Item .env.example .env.local
```

The repository must only contain public-safe example values. Real credentials, device keys, database URLs, API keys, and deployment secrets must stay outside Git.

## Scripts

| Script | Purpose |
|---|---|
| `pnpm dev` | Start the Next.js development server |
| `pnpm build` | Build the application |
| `pnpm start` | Start the production build locally |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm test` | Run Vitest in non-watch mode |
| `pnpm test:watch` | Run Vitest in watch mode |
| `pnpm check` | Run typecheck, lint, tests, and build |

## Documentation Map

The documentation folder is scaffolded for the next implementation phase:

- `docs/architecture.md` - system architecture and runtime boundaries;
- `docs/api-contract.md` - planned API request and response contracts;
- `docs/data-model.md` - device, tank, telemetry, and status entities;
- `docs/device-ingestion.md` - device/simulator payload shape and ingestion rules;
- `docs/domain-model.md` - tank geometry, runtime, and status calculations;
- `docs/deployment.md` - local, demo, and self-hosted deployment notes;
- `docs/safety-and-limitations.md` - safety, calibration, and claim boundaries;
- `docs/roadmap.md` - staged project plan;
- `docs/reviewer-quickstart.md` - future reviewer guide;
- `docs/decision-log.md` - engineering decisions and tradeoffs;
- `docs/development-log.md` - implementation progress log;
- `docs/system-boundaries.md` - what belongs in this repo and what does not.

## Development Roadmap

### Phase 1 - Repository Foundation

- Replace the default framework README.
- Establish project-safe documentation and folder structure.
- Define public-safe boundaries and repository conventions.

### Phase 2 - Domain Logic

- Add tank geometry calculation helpers.
- Add runtime estimation and status classification.
- Add tests for critical calculation behavior.

### Phase 3 - Dummy Dashboard

- Add dummy devices and tanks.
- Replace the starter page with an operations dashboard.
- Add current status, runtime, and history UI.

### Phase 4 - Telemetry Simulator

- Add a local telemetry generator.
- Simulate normal consumption, refuel, stale data, and offline states.
- Use simulator data to validate dashboard workflows.

### Phase 5 - Ingestion API

- Add telemetry ingestion endpoint.
- Add payload validation and normalization.
- Store raw and normalized readings.

### Phase 6 - Deployment Readiness

- Document self-hosted and demo deployment options.
- Add deployment checks.
- Add security review checklist.

## Safety and Limitations

This repository is not production-ready.

Before real-world fuel tank use, the following must be validated:

- hardware mounting and site safety;
- sensor suitability for the actual tank environment;
- tank dimensions and geometry;
- calibration method;
- measurement error tolerance;
- network and deployment policy;
- authentication and authorization;
- backup and monitoring requirements;
- operator review and approval.

No public demo should contain real private telemetry, site details, credentials, network addresses, or sensitive deployment information.

## Maintainer

Primary author:

```text
Muhammad Zaenal Abidin Abdurrahman
```

Contributor and collaboration credits can be updated when implementation scope and roles are confirmed.

## License

This project is released under the MIT License. See `LICENSE` for details.
