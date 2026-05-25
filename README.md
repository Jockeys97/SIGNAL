# SIGNAL

AI Operational Intelligence prototype that turns scattered business signals into interpreted decisions, recommended actions, and workflow automations.

- Repository: [github.com/Jockeys97/SIGNAL](https://github.com/Jockeys97/SIGNAL)
- Live demo: [jockeys97.github.io/SIGNAL](https://jockeys97.github.io/SIGNAL/) (after GitHub Pages is enabled on `main`)

SIGNAL is built as a portfolio-grade product demo: part decision dashboard, part knowledge intelligence layer, part process automation cockpit. It reflects how modern organizations use AI inside core operations, not as a disconnected marketing tool.

## What It Shows

- Decision board across Analysis, Impact, Project, Operational, and Risk stages
- AI interpretation of business signals from dashboards, documents, market monitors, and process audits
- Root-cause panel with recommended actions for each signal type
- Knowledge signal triage for document-backed questions
- Workflow studio with automation templates mapped to real operating models
- Decision observability with webhook-ready execution logs
- Settings for AI model, knowledge base, reputation monitoring, and workflow routing
- Local persistence with `localStorage`
- Optional local API powered by Express and SQLite
- Frontend API mode via `VITE_API_URL`, with localStorage fallback for static deployment

## Demo Flow

1. Open the Decision Board and select a business signal such as conversion drop, policy query, or reputation watch.
2. Review operating stage, AI interpretation, root cause, and recommended actions.
3. Paste an operational message into the AI Command panel, for example a performance anomaly or document question.
4. SIGNAL interprets the signal, updates the operating stage, generates the next action, and logs the automation event.
5. Use Workflow Studio and Event Logs to show how the same logic would connect to n8n, internal alerts, and management dashboards.

## Why This Project

SIGNAL is designed to communicate a hybrid skill set: frontend product craft, AI-assisted decision logic, process automation thinking, and backend/API readiness.

The narrative aligns with strategy-led AI consultancies: analyze how the organization works today, identify where AI creates measurable impact, design the system architecture, implement workflows inside existing tools, and make performance observable over time.

The current implementation is intentionally local-first and demo-friendly. External systems such as OpenAI, n8n, PostgreSQL, and email providers are represented as integration states and workflow-ready concepts, not live production dependencies.

## Tech Stack

- React
- TypeScript
- Vite
- Lucide icons
- Express
- SQLite via Node.js `node:sqlite`
- Playwright verification script

## Architecture

```text
Business signal
  -> local AI interpreter
  -> operating stage update
  -> root cause + recommended action
  -> generated task
  -> timeline event
  -> automation log
  -> localStorage or Express/SQLite persistence
```

## Commands

```bash
npm install
npm run dev
npm run build
npm run verify
```

The verification script opens the local app in Chrome, runs the AI interpretation flow, checks for console errors, verifies desktop/mobile layout overflow, and saves screenshots in `artifacts/`. Start the Vite dev server before running it.

## Local API Mode

Static deployments run the frontend-only version with `localStorage`. For local backend persistence:

```bash
npm run setup:api
npm run dev:api
VITE_API_URL=http://127.0.0.1:8787 npm run dev
```

The API exposes:

- `GET /health`
- `GET /api/leads`
- `POST /api/leads`
- `PATCH /api/leads/:id`
- `POST /api/leads/:id/scenario`
- `POST /api/leads/:id/tasks/:taskId/toggle`
- `POST /api/leads/:id/classify`
