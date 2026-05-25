import type { Lead } from "./types";

export const DEMO_LEAD_ID = "lead-001";

export const DEMO_MESSAGE =
  "Le conversioni sono calate e il team non capisce da quale causa partire.";

export const initialLeads: Lead[] = [
  {
    id: DEMO_LEAD_ID,
    name: "Conversion Drop",
    company: "Growth Team",
    email: "growth@signal.demo",
    status: "qualified",
    scenario: "Impact",
    score: 78,
    priority: "High",
    tags: ["anomalia", "performance", "root-cause"],
    source: "Cruscotto decisionale",
    value: "-18% conversioni",
    lastActivity: "12 min fa",
    intent: "performance_anomaly",
    sentiment: "Concerned",
    notes:
      "Le conversioni sono sotto soglia. SIGNAL collega l'anomalia alla pausa budget paid e all'attrito sulla landing mobile.",
    events: [
      {
        id: "evt-001",
        type: "lead_created",
        title: "Anomalia rilevata dal cruscotto",
        description: "Il tasso di conversione è calato del 18% rispetto al target mobile.",
        timestamp: "Oggi, 09:42"
      },
      {
        id: "evt-002",
        type: "ai_classified",
        title: "AI ha individuato la causa radice",
        description: "Pausa budget e bounce mobile identificati come leve principali.",
        timestamp: "Oggi, 09:43"
      }
    ],
    tasks: [
      {
        id: "task-001",
        title: "Riattivare budget e correggere landing mobile",
        owner: "Sales",
        due: "Oggi",
        done: false
      }
    ],
    automationLogs: [
      {
        id: "log-001",
        workflow: "Router anomalia → azione",
        event: "ai_classified",
        status: "success",
        timestamp: "Oggi, 09:43",
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
    tags: ["knowledge-base", "documenti", "procedure"],
    source: "Knowledge base",
    value: "1,3s risposta",
    lastActivity: "1 h fa",
    intent: "knowledge_query",
    sentiment: "Positive",
    notes:
      "Il team ha posto una domanda in linguaggio naturale su contratti, procedure e manuali. SIGNAL ha tracciato il percorso di risposta con fonte.",
    events: [
      {
        id: "evt-003",
        type: "scenario_changed",
        title: "Knowledge system spostato in Progetto",
        description: "Workflow documentale mappato e soglia di confidenza configurata.",
        timestamp: "Ieri, 17:18"
      },
      {
        id: "evt-004",
        type: "task_generated",
        title: "Task knowledge generato",
        description: "Validare le procedure indicizzate prima del rollout team.",
        timestamp: "Ieri, 17:19"
      }
    ],
    tasks: [
      {
        id: "task-002",
        title: "Validare collezioni documenti e regole di confidenza",
        owner: "Success",
        due: "Domani",
        done: false
      },
      {
        id: "task-003",
        title: "Collegare i log risposta al cruscotto management",
        owner: "AI Assistant",
        due: "Domani",
        done: true
      }
    ],
    automationLogs: [
      {
        id: "log-002",
        workflow: "Workflow risposta knowledge",
        event: "scenario_changed",
        status: "success",
        timestamp: "Ieri, 17:19",
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
    tags: ["reputazione", "sentiment", "competitor"],
    source: "Monitor di mercato",
    value: "-12 sentiment",
    lastActivity: "9 giorni fa",
    intent: "reputation_risk",
    sentiment: "Concerned",
    notes:
      "Segnali negativi deboli sul confronto con i competitor. Serve un framework di risposta prima che il tema cresca.",
    events: [
      {
        id: "evt-005",
        type: "email_queued",
        title: "Risposta reputazione in coda",
        description: "Sentiment in calo sulle query monitorate e sulle menzioni competitor.",
        timestamp: "Oggi, 08:30"
      }
    ],
    tasks: [
      {
        id: "task-004",
        title: "Preparare brief di risposta e proof point competitor",
        owner: "Sales",
        due: "Oggi",
        done: false
      }
    ],
    automationLogs: [
      {
        id: "log-003",
        workflow: "Loop monitor reputazione",
        event: "email_queued",
        status: "pending",
        timestamp: "Oggi, 08:30",
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
    tags: ["automazione", "riduzione-costi", "quick-win"],
    source: "Audit processi",
    value: "-42% lavoro manuale",
    lastActivity: "28 min fa",
    intent: "process_automation",
    sentiment: "Positive",
    notes:
      "Attività finance ricorrente convertita in workflow AI con risparmio misurabile sul tempo operativo.",
    events: [
      {
        id: "evt-006",
        type: "onboarding_completed",
        title: "Automazione in stato operativo",
        description: "Workflow production-ready con alerting attivo.",
        timestamp: "Lunedì, 11:04"
      }
    ],
    tasks: [
      {
        id: "task-005",
        title: "Monitorare risparmio e gestione eccezioni",
        owner: "Success",
        due: "Venerdì",
        done: false
      }
    ],
    automationLogs: [
      {
        id: "log-004",
        workflow: "Quick win automazione processo",
        event: "onboarding_completed",
        status: "success",
        timestamp: "Lunedì, 11:04",
        payload: "{ process: 'invoice_triage', costReduction: 42, active: true }"
      }
    ]
  }
];
