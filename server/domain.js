const nowLabel = "Just now";

export function classifyMessage(message) {
  const text = message.toLowerCase();

  if (text.includes("prezzo") || text.includes("pricing") || text.includes("costo") || text.includes("iscriv")) {
    return {
      intent: "pricing_interest",
      sentiment: "Positive",
      scoreDelta: 12,
      nextScenario: "Qualification",
      action: "Send pricing deck and create sales follow-up",
      eventTitle: "AI detected pricing intent"
    };
  }

  if (text.includes("demo") || text.includes("call") || text.includes("consulenza")) {
    return {
      intent: "demo_request",
      sentiment: "Positive",
      scoreDelta: 16,
      nextScenario: "Onboarding",
      action: "Book demo and generate onboarding checklist",
      eventTitle: "AI detected demo request"
    };
  }

  if (text.includes("problema") || text.includes("non riesco") || text.includes("dubbi")) {
    return {
      intent: "support_or_objection",
      sentiment: "Concerned",
      scoreDelta: -8,
      nextScenario: "At Risk",
      action: "Create human follow-up task",
      eventTitle: "AI detected objection"
    };
  }

  return {
    intent: "general_interest",
    sentiment: "Neutral",
    scoreDelta: 5,
    nextScenario: "Discovery",
    action: "Ask qualifying question and keep lead in discovery",
    eventTitle: "AI detected general interest"
  };
}

export function applyAiClassification(lead, message) {
  const classification = classifyMessage(message);
  const score = Math.max(0, Math.min(100, lead.score + classification.scoreDelta));
  const status = scenarioToStatus(classification.nextScenario);

  return {
    ...lead,
    status,
    scenario: classification.nextScenario,
    score,
    priority: score > 75 ? "High" : score > 45 ? "Medium" : "Low",
    intent: classification.intent,
    sentiment: classification.sentiment,
    lastActivity: nowLabel,
    tags: Array.from(new Set([...lead.tags, classification.intent])),
    events: [
      {
        id: crypto.randomUUID(),
        type: "ai_classified",
        title: classification.eventTitle,
        description: `${classification.action}. Original message: "${message}"`,
        timestamp: nowLabel
      },
      {
        id: crypto.randomUUID(),
        type: "scenario_changed",
        title: `Scenario changed to ${classification.nextScenario}`,
        description: "Lead moved by the scenario engine after AI classification.",
        timestamp: nowLabel
      },
      ...lead.events
    ],
    tasks: [
      {
        id: crypto.randomUUID(),
        title: classification.action,
        owner: classification.nextScenario === "At Risk" ? "Sales" : "AI Assistant",
        due: "Today",
        done: false
      },
      ...lead.tasks
    ],
    automationLogs: [
      {
        id: crypto.randomUUID(),
        workflow: workflowForScenario(classification.nextScenario),
        event: "ai_classified",
        status: "success",
        timestamp: nowLabel,
        payload: `{ intent: '${classification.intent}', nextScenario: '${classification.nextScenario}', score: ${score} }`
      },
      ...lead.automationLogs
    ]
  };
}

export function changeScenario(lead, scenario) {
  return {
    ...lead,
    scenario,
    status: scenarioToStatus(scenario),
    lastActivity: nowLabel,
    events: [
      {
        id: crypto.randomUUID(),
        type: "scenario_changed",
        title: `Scenario manually changed to ${scenario}`,
        description: "CRM operator updated the customer journey stage from the API.",
        timestamp: nowLabel
      },
      ...lead.events
    ],
    automationLogs: [
      {
        id: crypto.randomUUID(),
        workflow: "Manual scenario override",
        event: "scenario_changed",
        status: "success",
        timestamp: nowLabel,
        payload: `{ scenario: '${scenario}', operator: 'api_user' }`
      },
      ...lead.automationLogs
    ]
  };
}

export function scenarioToStatus(scenario) {
  const map = {
    Discovery: "new",
    Qualification: "qualified",
    Onboarding: "onboarding",
    "Active Client": "active",
    "At Risk": "at_risk"
  };

  return map[scenario] ?? "new";
}

function workflowForScenario(scenario) {
  const map = {
    Discovery: "Discovery question generator",
    Qualification: "Lead qualification router",
    Onboarding: "Onboarding checklist generator",
    "Active Client": "Expansion opportunity detector",
    "At Risk": "Inactive lead recovery"
  };

  return map[scenario] ?? "Discovery question generator";
}
