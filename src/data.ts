import type { Lead } from "./types";

export const initialLeads: Lead[] = [
  {
    id: "lead-001",
    name: "Marta Ricci",
    company: "Studio Forma",
    email: "marta.ricci@studioforma.it",
    status: "qualified",
    scenario: "Qualification",
    score: 78,
    priority: "High",
    tags: ["pricing", "high-intent", "fitness"],
    source: "Landing page",
    value: "EUR 4.800",
    lastActivity: "12 min ago",
    intent: "Pricing request",
    sentiment: "Positive",
    notes: "Interested in a premium onboarding program for a corporate wellness pilot.",
    events: [
      {
        id: "evt-001",
        type: "lead_created",
        title: "Lead captured from landing page",
        description: "Form submitted with company size and budget range.",
        timestamp: "Today, 09:42"
      },
      {
        id: "evt-002",
        type: "ai_classified",
        title: "AI classified intent as pricing_interest",
        description: "Lead score increased because the message included budget and timeline.",
        timestamp: "Today, 09:43"
      }
    ],
    tasks: [
      {
        id: "task-001",
        title: "Send pricing deck with enterprise option",
        owner: "Sales",
        due: "Today",
        done: false
      }
    ],
    automationLogs: [
      {
        id: "log-001",
        workflow: "Lead qualification router",
        event: "ai_classified",
        status: "success",
        timestamp: "Today, 09:43",
        payload: "{ intent: 'pricing_interest', score: 78 }"
      }
    ]
  },
  {
    id: "lead-002",
    name: "Luca Bianchi",
    company: "Northline SaaS",
    email: "luca@northline.io",
    status: "onboarding",
    scenario: "Onboarding",
    score: 84,
    priority: "High",
    tags: ["demo-booked", "automation", "sales"],
    source: "Referral",
    value: "EUR 8.200",
    lastActivity: "1 h ago",
    intent: "Implementation request",
    sentiment: "Positive",
    notes: "Wants a guided onboarding with CRM sync and customer lifecycle automations.",
    events: [
      {
        id: "evt-003",
        type: "scenario_changed",
        title: "Scenario moved to Onboarding",
        description: "Demo completed and onboarding checklist generated.",
        timestamp: "Yesterday, 17:18"
      },
      {
        id: "evt-004",
        type: "task_generated",
        title: "Success task generated",
        description: "Prepare workflow map before kickoff call.",
        timestamp: "Yesterday, 17:19"
      }
    ],
    tasks: [
      {
        id: "task-002",
        title: "Prepare kickoff checklist",
        owner: "Success",
        due: "Tomorrow",
        done: false
      },
      {
        id: "task-003",
        title: "Validate webhook payload mapping",
        owner: "AI Assistant",
        due: "Tomorrow",
        done: true
      }
    ],
    automationLogs: [
      {
        id: "log-002",
        workflow: "Onboarding checklist generator",
        event: "scenario_changed",
        status: "success",
        timestamp: "Yesterday, 17:19",
        payload: "{ scenario: 'Onboarding', tasks: 4 }"
      }
    ]
  },
  {
    id: "lead-003",
    name: "Giulia Conti",
    company: "Casa Verde",
    email: "giulia@casaverde.it",
    status: "at_risk",
    scenario: "At Risk",
    score: 46,
    priority: "Medium",
    tags: ["inactive", "needs-followup"],
    source: "Webinar",
    value: "EUR 2.400",
    lastActivity: "9 days ago",
    intent: "Unclear",
    sentiment: "Concerned",
    notes: "Stopped replying after initial interest. Needs a human follow-up with a concrete next step.",
    events: [
      {
        id: "evt-005",
        type: "email_queued",
        title: "Reactivation email queued",
        description: "Lead was inactive for more than 7 days.",
        timestamp: "Today, 08:30"
      }
    ],
    tasks: [
      {
        id: "task-004",
        title: "Call and confirm interest",
        owner: "Sales",
        due: "Today",
        done: false
      }
    ],
    automationLogs: [
      {
        id: "log-003",
        workflow: "Inactive lead recovery",
        event: "email_queued",
        status: "pending",
        timestamp: "Today, 08:30",
        payload: "{ daysInactive: 9, channel: 'email' }"
      }
    ]
  },
  {
    id: "lead-004",
    name: "Andrea Leone",
    company: "Peak Lab",
    email: "andrea@peaklab.co",
    status: "active",
    scenario: "Active Client",
    score: 92,
    priority: "High",
    tags: ["active", "premium", "expansion"],
    source: "Outbound",
    value: "EUR 12.500",
    lastActivity: "28 min ago",
    intent: "Expansion",
    sentiment: "Positive",
    notes: "Active account. Strong fit for advanced automations and reporting add-on.",
    events: [
      {
        id: "evt-006",
        type: "onboarding_completed",
        title: "Onboarding completed",
        description: "Client reached activation milestone and premium access was enabled.",
        timestamp: "Monday, 11:04"
      }
    ],
    tasks: [
      {
        id: "task-005",
        title: "Suggest reporting automation add-on",
        owner: "Success",
        due: "Friday",
        done: false
      }
    ],
    automationLogs: [
      {
        id: "log-004",
        workflow: "Premium access provisioning",
        event: "onboarding_completed",
        status: "success",
        timestamp: "Monday, 11:04",
        payload: "{ plan: 'premium', provisioned: true }"
      }
    ]
  }
];
