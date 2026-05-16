# FlowPilot CRM

An AI-driven CRM automation platform demo for managing lead journeys with scenario-based orchestration, AI classification, automation logs, tasks, and customer timelines.

## What It Shows

- Lead pipeline dashboard with score, priority, status, tags, and deal value
- Scenario engine that moves customers through Discovery, Qualification, Onboarding, Active Client, and At Risk states
- AI assistant flow that classifies a customer message and updates CRM state
- Event timeline for actions such as `lead_created`, `ai_classified`, `scenario_changed`, and `task_generated`
- Automation run logs designed to map cleanly to n8n webhook executions
- Responsive product UI for desktop and mobile

## Tech Stack

- React
- TypeScript
- Vite
- Lucide icons
- Playwright verification script

## Demo Flow

1. Select a lead from the pipeline.
2. Review CRM profile, score, scenario, timeline, tasks, and automation logs.
3. Send the sample customer message through the AI assistant.
4. The local scenario engine classifies the message, updates the lead score, changes scenario state, generates a task, and writes an automation log.

## Future Backend Architecture

The current MVP is frontend-first, but the domain model is structured to map naturally to a production backend:

- Node.js API for lead, event, task, and workflow endpoints
- PostgreSQL with Prisma models for persistent CRM state
- n8n webhooks for workflow execution
- OpenAI or Claude API for structured intent classification
- Automation retry/error tracking for workflow observability

## Commands

```bash
npm install
npm run dev
npm run build
node scripts/verify.mjs
```

The verification script opens the local app in Chrome, clicks the AI classification flow, checks for console errors, verifies desktop/mobile layout overflow, and saves screenshots in `artifacts/`.
