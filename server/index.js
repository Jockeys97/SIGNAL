import express from "express";
import cors from "cors";
import { initialLeads } from "../src/data.ts";
import { applyAiClassification, changeScenario } from "./domain.js";
import { countLeads, getLead, getLeads, upsertLead } from "./db.js";

if (countLeads() === 0) {
  for (const lead of initialLeads) {
    upsertLead(lead);
  }
}

const app = express();
const port = Number(process.env.PORT ?? 8787);

app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_request, response) => {
  response.json({ ok: true, service: "signal-api" });
});

app.get("/api/leads", (_request, response) => {
  response.json(getLeads());
});

app.post("/api/leads", (request, response) => {
  const index = countLeads() + 1;
  const lead = {
    id: crypto.randomUUID(),
    name: request.body.name || `Process Signal ${index}`,
    company: request.body.company || "Internal Operations",
    email: request.body.email || `signal${index}@example.com`,
    status: "new",
    scenario: "Analysis",
    score: 52,
    priority: "Medium",
    tags: ["new", "process-signal"],
    source: request.body.source || "API process input",
    value: request.body.value || "2.4h saved weekly",
    lastActivity: "Just now",
    intent: "operational_signal",
    sentiment: "Neutral",
    notes: request.body.notes || "New business signal created from the API.",
    events: [
      {
        id: crypto.randomUUID(),
        type: "lead_created",
        title: "Business signal captured through API",
        description: "A process signal was added through the backend API.",
        timestamp: "Just now"
      }
    ],
    tasks: [
      {
        id: crypto.randomUUID(),
        title: "Analyze process and confirm next action",
        owner: "Sales",
        due: "Today",
        done: false
      }
    ],
    automationLogs: [
      {
        id: crypto.randomUUID(),
        workflow: "API process signal intake",
        event: "lead_created",
        status: "success",
        timestamp: "Just now",
        payload: "{ source: 'api_process_input', stage: 'Analysis' }"
      }
    ]
  };

  response.status(201).json(upsertLead(lead));
});

app.patch("/api/leads/:id", (request, response) => {
  const lead = getLead(request.params.id);

  if (!lead) {
    response.status(404).json({ error: "Lead not found" });
    return;
  }

  response.json(upsertLead({ ...lead, ...request.body, lastActivity: "Just now" }));
});

app.post("/api/leads/:id/scenario", (request, response) => {
  const lead = getLead(request.params.id);

  if (!lead) {
    response.status(404).json({ error: "Lead not found" });
    return;
  }

  response.json(upsertLead(changeScenario(lead, request.body.scenario)));
});

app.post("/api/leads/:id/tasks/:taskId/toggle", (request, response) => {
  const lead = getLead(request.params.id);

  if (!lead) {
    response.status(404).json({ error: "Lead not found" });
    return;
  }

  response.json(
    upsertLead({
      ...lead,
      lastActivity: "Just now",
      tasks: lead.tasks.map((task) => (task.id === request.params.taskId ? { ...task, done: !task.done } : task))
    })
  );
});

app.post("/api/leads/:id/classify", (request, response) => {
  const lead = getLead(request.params.id);

  if (!lead) {
    response.status(404).json({ error: "Lead not found" });
    return;
  }

  response.json(upsertLead(applyAiClassification(lead, request.body.message ?? "")));
});

app.listen(port, () => {
  console.log(`SIGNAL API listening on http://127.0.0.1:${port}`);
});
