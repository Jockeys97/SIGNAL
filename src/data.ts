import type { Lead } from "./types";

export const initialLeads: Lead[] = [
  {
    id: "lead-001",
    name: "Conversion Drop",
    company: "Growth Team",
    email: "growth@signal.demo",
    status: "qualified",
    scenario: "Impact",
    score: 78,
    priority: "High",
    tags: ["anomaly", "performance", "root-cause"],
    source: "Decision dashboard",
    value: "-18% conversions",
    lastActivity: "12 min ago",
    intent: "performance_anomaly",
    sentiment: "Concerned",
    notes: "Conversions dropped below threshold. SIGNAL connected the anomaly to paid budget interruption and mobile landing friction.",
    events: [
      {
        id: "evt-001",
        type: "lead_created",
        title: "Anomaly captured from dashboard",
        description: "Conversion rate dropped 18% compared with the rolling target.",
        timestamp: "Today, 09:42"
      },
      {
        id: "evt-002",
        type: "ai_classified",
        title: "AI identified root cause",
        description: "Budget pause and mobile bounce rate were detected as the strongest intervention points.",
        timestamp: "Today, 09:43"
      }
    ],
    tasks: [
      {
        id: "task-001",
        title: "Reactivate budget and fix mobile landing friction",
        owner: "Sales",
        due: "Today",
        done: false
      }
    ],
    automationLogs: [
      {
        id: "log-001",
        workflow: "Anomaly-to-action router",
        event: "ai_classified",
        status: "success",
        timestamp: "Today, 09:43",
        payload: "{ signal: 'conversion_drop', rootCause: 'budget_pause', confidence: 78 }"
      }
    ]
  },
  {
    id: "lead-002",
    name: "Policy Query",
    company: "Operations Team",
    email: "ops@signal.demo",
    status: "onboarding",
    scenario: "Project",
    score: 84,
    priority: "High",
    tags: ["knowledge-base", "documents", "procedure"],
    source: "Knowledge base",
    value: "1.3s response",
    lastActivity: "1 h ago",
    intent: "knowledge_query",
    sentiment: "Positive",
    notes: "Team asked a natural-language question across contracts, procedures and manuals. SIGNAL returned the source-backed answer path.",
    events: [
      {
        id: "evt-003",
        type: "scenario_changed",
        title: "Knowledge system moved to Project",
        description: "Document workflow mapped and answer confidence threshold configured.",
        timestamp: "Yesterday, 17:18"
      },
      {
        id: "evt-004",
        type: "task_generated",
        title: "Knowledge task generated",
        description: "Validate indexed procedures before team rollout.",
        timestamp: "Yesterday, 17:19"
      }
    ],
    tasks: [
      {
        id: "task-002",
        title: "Validate document collections and confidence rules",
        owner: "Success",
        due: "Tomorrow",
        done: false
      },
      {
        id: "task-003",
        title: "Connect answer logs to management dashboard",
        owner: "AI Assistant",
        due: "Tomorrow",
        done: true
      }
    ],
    automationLogs: [
      {
        id: "log-002",
        workflow: "Knowledge answer workflow",
        event: "scenario_changed",
        status: "success",
        timestamp: "Yesterday, 17:19",
        payload: "{ documents: 247, avgResponse: '1.3s', accuracy: 98 }"
      }
    ]
  },
  {
    id: "lead-003",
    name: "Reputation Watch",
    company: "Brand Team",
    email: "brand@signal.demo",
    status: "at_risk",
    scenario: "Risk",
    score: 46,
    priority: "Medium",
    tags: ["reputation", "sentiment", "competitor"],
    source: "Market monitor",
    value: "-12 sentiment",
    lastActivity: "9 days ago",
    intent: "reputation_risk",
    sentiment: "Concerned",
    notes: "Weak negative signals are emerging around competitor comparison queries. Needs response framework before the issue scales.",
    events: [
      {
        id: "evt-005",
        type: "email_queued",
        title: "Reputation response queued",
        description: "Sentiment dropped across monitored queries and competitor mentions.",
        timestamp: "Today, 08:30"
      }
    ],
    tasks: [
      {
        id: "task-004",
        title: "Prepare response brief and competitor proof points",
        owner: "Sales",
        due: "Today",
        done: false
      }
    ],
    automationLogs: [
      {
        id: "log-003",
        workflow: "Reputation monitoring loop",
        event: "email_queued",
        status: "pending",
        timestamp: "Today, 08:30",
        payload: "{ sentimentDelta: -12, competitors: 3, risk: 'medium' }"
      }
    ]
  },
  {
    id: "lead-004",
    name: "Invoice Automation",
    company: "Finance Team",
    email: "finance@signal.demo",
    status: "active",
    scenario: "Operational",
    score: 92,
    priority: "High",
    tags: ["automation", "cost-reduction", "quick-win"],
    source: "Process audit",
    value: "-42% manual work",
    lastActivity: "28 min ago",
    intent: "process_automation",
    sentiment: "Positive",
    notes: "Recurring manual finance task converted into an AI-assisted workflow with measurable time savings.",
    events: [
      {
        id: "evt-006",
        type: "onboarding_completed",
        title: "Automation moved to operations",
        description: "Workflow reached production-ready state and alerting was enabled.",
        timestamp: "Monday, 11:04"
      }
    ],
    tasks: [
      {
        id: "task-005",
        title: "Monitor savings and improve exception handling",
        owner: "Success",
        due: "Friday",
        done: false
      }
    ],
    automationLogs: [
      {
        id: "log-004",
        workflow: "Process automation quick win",
        event: "onboarding_completed",
        status: "success",
        timestamp: "Monday, 11:04",
        payload: "{ process: 'invoice_triage', costReduction: 42, active: true }"
      }
    ]
  }
];
