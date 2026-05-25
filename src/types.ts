export type LeadStatus = "new" | "qualified" | "onboarding" | "active" | "inactive" | "at_risk";

export type Scenario = "Analysis" | "Impact" | "Project" | "Operational" | "Risk";

export type AutomationStatus = "success" | "pending" | "error";

export type EventType =
  | "lead_created"
  | "ai_classified"
  | "scenario_changed"
  | "task_generated"
  | "webhook_triggered"
  | "email_queued"
  | "onboarding_completed";

export interface TimelineEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  timestamp: string;
}

export interface Task {
  id: string;
  title: string;
  owner: "Sales" | "Success" | "AI Assistant";
  due: string;
  done: boolean;
}

export interface AutomationLog {
  id: string;
  workflow: string;
  event: EventType;
  status: AutomationStatus;
  timestamp: string;
  payload: string;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  status: LeadStatus;
  scenario: Scenario;
  score: number;
  priority: "High" | "Medium" | "Low";
  tags: string[];
  source: string;
  value: string;
  lastActivity: string;
  intent: string;
  sentiment: "Positive" | "Neutral" | "Concerned";
  notes: string;
  events: TimelineEvent[];
  tasks: Task[];
  automationLogs: AutomationLog[];
}

export interface AiClassification {
  intent: string;
  sentiment: Lead["sentiment"];
  scoreDelta: number;
  nextScenario: Scenario;
  action: string;
  eventTitle: string;
}
