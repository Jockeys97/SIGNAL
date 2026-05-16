import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const dataDir = join(root, "data");
const dbPath = join(dataDir, "flowpilot.db");

mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT NOT NULL,
    email TEXT NOT NULL,
    status TEXT NOT NULL,
    scenario TEXT NOT NULL,
    score INTEGER NOT NULL,
    priority TEXT NOT NULL,
    tags TEXT NOT NULL,
    source TEXT NOT NULL,
    value TEXT NOT NULL,
    lastActivity TEXT NOT NULL,
    intent TEXT NOT NULL,
    sentiment TEXT NOT NULL,
    notes TEXT NOT NULL,
    events TEXT NOT NULL,
    tasks TEXT NOT NULL,
    automationLogs TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

export function serializeLead(lead) {
  return {
    id: lead.id,
    name: lead.name,
    company: lead.company,
    email: lead.email,
    status: lead.status,
    scenario: lead.scenario,
    score: lead.score,
    priority: lead.priority,
    tags: JSON.stringify(lead.tags ?? []),
    source: lead.source,
    value: lead.value,
    lastActivity: lead.lastActivity,
    intent: lead.intent,
    sentiment: lead.sentiment,
    notes: lead.notes,
    events: JSON.stringify(lead.events ?? []),
    tasks: JSON.stringify(lead.tasks ?? []),
    automationLogs: JSON.stringify(lead.automationLogs ?? [])
  };
}

export function parseLead(row) {
  return {
    ...row,
    tags: JSON.parse(row.tags),
    events: JSON.parse(row.events),
    tasks: JSON.parse(row.tasks),
    automationLogs: JSON.parse(row.automationLogs)
  };
}

export function upsertLead(lead) {
  const data = serializeLead(lead);

  db.prepare(`
    INSERT INTO leads (
      id, name, company, email, status, scenario, score, priority, tags, source, value,
      lastActivity, intent, sentiment, notes, events, tasks, automationLogs, updatedAt
    )
    VALUES (
      :id, :name, :company, :email, :status, :scenario, :score, :priority, :tags, :source, :value,
      :lastActivity, :intent, :sentiment, :notes, :events, :tasks, :automationLogs, CURRENT_TIMESTAMP
    )
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      company = excluded.company,
      email = excluded.email,
      status = excluded.status,
      scenario = excluded.scenario,
      score = excluded.score,
      priority = excluded.priority,
      tags = excluded.tags,
      source = excluded.source,
      value = excluded.value,
      lastActivity = excluded.lastActivity,
      intent = excluded.intent,
      sentiment = excluded.sentiment,
      notes = excluded.notes,
      events = excluded.events,
      tasks = excluded.tasks,
      automationLogs = excluded.automationLogs,
      updatedAt = CURRENT_TIMESTAMP
  `).run(data);

  return getLead(lead.id);
}

export function getLeads() {
  return db.prepare("SELECT * FROM leads ORDER BY updatedAt DESC").all().map(parseLead);
}

export function getLead(id) {
  const row = db.prepare("SELECT * FROM leads WHERE id = ?").get(id);
  return row ? parseLead(row) : null;
}

export function countLeads() {
  return db.prepare("SELECT COUNT(*) AS count FROM leads").get().count;
}
