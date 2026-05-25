const nowLabel = "Just now";

export function classifyMessage(message) {
  const text = message.toLowerCase();

  if (text.includes("document") || text.includes("contratt") || text.includes("procedur") || text.includes("manual")) {
    return {
      intent: "knowledge_query",
      sentiment: "Positive",
      scoreDelta: 12,
      nextScenario: "Project",
      action: "Retrieve the source-backed answer and log confidence",
      eventTitle: "AI detected knowledge-base query"
    };
  }

  if (text.includes("costo") || text.includes("efficien") || text.includes("process") || text.includes("automat")) {
    return {
      intent: "process_automation",
      sentiment: "Positive",
      scoreDelta: 16,
      nextScenario: "Operational",
      action: "Map the process quick win and trigger automation workflow",
      eventTitle: "AI detected operational automation opportunity"
    };
  }

  if (text.includes("reputazione") || text.includes("competitor") || text.includes("sentiment") || text.includes("trend")) {
    return {
      intent: "reputation_risk",
      sentiment: "Concerned",
      scoreDelta: -8,
      nextScenario: "Risk",
      action: "Create reputation response brief and monitor weak signals",
      eventTitle: "AI detected market reputation risk"
    };
  }

  if (text.includes("anomalia") || text.includes("cal") || text.includes("conversion") || text.includes("rischio") || text.includes("causa")) {
    return {
      intent: "performance_anomaly",
      sentiment: "Concerned",
      scoreDelta: 10,
      nextScenario: "Impact",
      action: "Identify root cause and assign the highest-impact action",
      eventTitle: "AI detected performance anomaly"
    };
  }

  return {
    intent: "operational_signal",
    sentiment: "Neutral",
    scoreDelta: 5,
    nextScenario: "Analysis",
    action: "Analyze available data and estimate business impact",
    eventTitle: "AI detected operational signal"
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
        title: `Operating stage changed to ${classification.nextScenario}`,
        description: "Business signal moved by the SIGNAL engine after AI interpretation.",
        timestamp: nowLabel
      },
      ...lead.events
    ],
    tasks: [
      {
        id: crypto.randomUUID(),
        title: classification.action,
        owner: classification.nextScenario === "Risk" ? "Sales" : "AI Assistant",
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
        payload: `{ signal: '${classification.intent}', stage: '${classification.nextScenario}', confidence: ${score} }`
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
        title: `Operating stage manually changed to ${scenario}`,
        description: "Operator updated the AI operating stage from the API.",
        timestamp: nowLabel
      },
      ...lead.events
    ],
    automationLogs: [
      {
        id: crypto.randomUUID(),
        workflow: "Manual operating stage override",
        event: "scenario_changed",
        status: "success",
        timestamp: nowLabel,
        payload: `{ stage: '${scenario}', operator: 'api_user' }`
      },
      ...lead.automationLogs
    ]
  };
}

export function scenarioToStatus(scenario) {
  const map = {
    Analysis: "new",
    Impact: "qualified",
    Project: "onboarding",
    Operational: "active",
    Risk: "at_risk"
  };

  return map[scenario] ?? "new";
}

function workflowForScenario(scenario) {
  const map = {
    Analysis: "AI readiness analyzer",
    Impact: "Anomaly-to-action router",
    Project: "Knowledge answer workflow",
    Operational: "Process automation quick win",
    Risk: "Reputation monitoring loop"
  };

  return map[scenario] ?? "AI readiness analyzer";
}
