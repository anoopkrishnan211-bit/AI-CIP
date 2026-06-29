# ANIRA Career Intelligence Platform

A privacy-first, session-only career readiness experience for students and early-career professionals.

The MVP takes a learner from resume intelligence through an assessment and interview. Its Career Intelligence Engine then reconciles those signals, ranks six career paths, explains the evidence and disagreements, and produces a downloadable 30–60–90 day Career Intelligence Report. It deliberately has no account, database, or persistent profile.

## Seminar mode

The app starts in deterministic demo mode when no OpenAI key is configured. This makes the full journey reliable during a live seminar. Add an API key to enable AI-enhanced report generation.

## Run locally

Requirements: Node.js 22+, Python 3.12+, and npm.

```powershell
copy .env.example .env
npm.cmd install
npm.cmd run install:all
npm.cmd run dev
```

Open `http://localhost:3000`. The API runs at `http://localhost:8000`.

## Quality checks

```powershell
npm.cmd run test
npm.cmd run build
```

## Documentation

- [Architecture](./ARCHITECTURE.md)
- [Career Intelligence Engine](./docs/CAREER_INTELLIGENCE_ENGINE.md)
- [Dependency inventory](./docs/DEPENDENCIES.md)
- [Seminar runbook](./docs/SEMINAR_RUNBOOK.md)
- [Task template](./TASK_TEMPLATE.md)
