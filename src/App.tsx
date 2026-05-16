import { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  CircleAlert,
  Clock3,
  KanbanSquare,
  Mail,
  MessageSquareText,
  Play,
  Route,
  Search,
  Sparkles,
  UserRoundCheck,
  Webhook
} from "lucide-react";
import { initialLeads } from "./data";
import { applyAiClassification } from "./scenarioEngine";
import type { Lead, LeadStatus } from "./types";

const statusLabels: Record<LeadStatus, string> = {
  new: "New",
  qualified: "Qualified",
  onboarding: "Onboarding",
  active: "Active",
  inactive: "Inactive",
  at_risk: "At Risk"
};

const scenarioSteps = ["Discovery", "Qualification", "Onboarding", "Active Client"];

function App() {
  const [leads, setLeads] = useState(initialLeads);
  const [selectedLeadId, setSelectedLeadId] = useState(initialLeads[0].id);
  const [message, setMessage] = useState("Vorrei iscrivermi, ma prima vorrei capire prezzi e percorso.");
  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) ?? leads[0];

  const metrics = useMemo(() => {
    const activeValue = leads.filter((lead) => lead.status === "active").length;
    const avgScore = Math.round(leads.reduce((sum, lead) => sum + lead.score, 0) / leads.length);
    const openTasks = leads.reduce((sum, lead) => sum + lead.tasks.filter((task) => !task.done).length, 0);
    const automations = leads.reduce((sum, lead) => sum + lead.automationLogs.length, 0);

    return [
      { label: "Pipeline value", value: "EUR 27.9k", icon: Activity },
      { label: "Avg lead score", value: `${avgScore}%`, icon: Sparkles },
      { label: "Active clients", value: activeValue.toString(), icon: UserRoundCheck },
      { label: "Open tasks", value: openTasks.toString(), icon: Clock3 },
      { label: "Automation runs", value: automations.toString(), icon: Webhook }
    ];
  }, [leads]);

  function handleClassify() {
    if (!message.trim()) return;

    setLeads((currentLeads) =>
      currentLeads.map((lead) => (lead.id === selectedLead.id ? applyAiClassification(lead, message.trim()) : lead))
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Route size={20} />
          </div>
          <div>
            <p>FlowPilot</p>
            <span>AI CRM Automation</span>
          </div>
        </div>

        <div className="search-box">
          <Search size={16} />
          <input aria-label="Search leads" placeholder="Search leads" />
        </div>

        <nav className="side-nav" aria-label="Workspace navigation">
          <button className="active" title="Pipeline">
            <KanbanSquare size={18} />
            Pipeline
          </button>
          <button title="AI inbox">
            <MessageSquareText size={18} />
            AI Inbox
          </button>
          <button title="Automation runs">
            <Webhook size={18} />
            Automations
          </button>
        </nav>

        <section className="lead-list" aria-label="Lead list">
          <div className="section-heading">
            <span>Leads</span>
            <strong>{leads.length}</strong>
          </div>

          {leads.map((lead) => (
            <button
              className={`lead-row ${lead.id === selectedLead.id ? "selected" : ""}`}
              key={lead.id}
              onClick={() => setSelectedLeadId(lead.id)}
            >
              <span className="avatar">{lead.name.slice(0, 1)}</span>
              <span className="lead-row-main">
                <strong>{lead.name}</strong>
                <small>{lead.company}</small>
              </span>
              <span className={`score score-${lead.priority.toLowerCase()}`}>{lead.score}</span>
            </button>
          ))}
        </section>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Customer journey orchestration</p>
            <h1>AI-driven CRM command center</h1>
          </div>
          <button className="primary-action">
            <Play size={17} />
            Run demo workflow
          </button>
        </header>

        <section className="metrics-grid" aria-label="CRM metrics">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <article className="metric-card" key={metric.label}>
                <Icon size={18} />
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </article>
            );
          })}
        </section>

        <section className="content-grid">
          <article className="lead-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Selected account</p>
                <h2>{selectedLead.name}</h2>
              </div>
              <span className={`status status-${selectedLead.status}`}>{statusLabels[selectedLead.status]}</span>
            </div>

            <div className="profile-grid">
              <Info label="Company" value={selectedLead.company} />
              <Info label="Email" value={selectedLead.email} />
              <Info label="Source" value={selectedLead.source} />
              <Info label="Deal value" value={selectedLead.value} />
              <Info label="Intent" value={selectedLead.intent} />
              <Info label="Sentiment" value={selectedLead.sentiment} />
            </div>

            <div className="scenario-strip" aria-label="Scenario progress">
              {scenarioSteps.map((scenario, index) => {
                const isCurrent = selectedLead.scenario === scenario;
                const isComplete = scenarioSteps.indexOf(selectedLead.scenario) > index;

                return (
                  <div className={`scenario-step ${isCurrent ? "current" : ""} ${isComplete ? "complete" : ""}`} key={scenario}>
                    <span>{isComplete ? <CheckCircle2 size={15} /> : index + 1}</span>
                    <p>{scenario}</p>
                  </div>
                );
              })}
              {selectedLead.scenario === "At Risk" && (
                <div className="scenario-step risk current">
                  <span>
                    <CircleAlert size={15} />
                  </span>
                  <p>At Risk</p>
                </div>
              )}
            </div>

            <div className="notes-block">
              <p>{selectedLead.notes}</p>
              <div className="tag-row">
                {selectedLead.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </div>

            <div className="two-column">
              <section>
                <div className="section-heading">
                  <span>Timeline</span>
                  <strong>{selectedLead.events.length}</strong>
                </div>
                <div className="timeline">
                  {selectedLead.events.map((event) => (
                    <div className="timeline-item" key={event.id}>
                      <span className="timeline-dot" />
                      <div>
                        <strong>{event.title}</strong>
                        <p>{event.description}</p>
                        <small>{event.timestamp}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="section-heading">
                  <span>Tasks</span>
                  <strong>{selectedLead.tasks.filter((task) => !task.done).length} open</strong>
                </div>
                <div className="task-list">
                  {selectedLead.tasks.map((task) => (
                    <div className={`task-item ${task.done ? "done" : ""}`} key={task.id}>
                      <CheckCircle2 size={17} />
                      <div>
                        <strong>{task.title}</strong>
                        <span>{task.owner} - {task.due}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </article>

          <aside className="right-rail">
            <section className="ai-panel">
              <div className="panel-header compact">
                <div>
                  <p className="eyebrow">AI assistant</p>
                  <h2>Classify and route</h2>
                </div>
                <Bot size={22} />
              </div>

              <textarea
                aria-label="Customer message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />

              <button className="primary-action full" onClick={handleClassify}>
                <Sparkles size={17} />
                Analyze message
              </button>

              <div className="ai-result">
                <div>
                  <span>Current intent</span>
                  <strong>{selectedLead.intent}</strong>
                </div>
                <ArrowRight size={17} />
                <div>
                  <span>Scenario</span>
                  <strong>{selectedLead.scenario}</strong>
                </div>
              </div>
            </section>

            <section className="automation-panel">
              <div className="section-heading">
                <span>Automation logs</span>
                <strong>{selectedLead.automationLogs.length}</strong>
              </div>

              <div className="log-list">
                {selectedLead.automationLogs.map((log) => (
                  <article className="log-item" key={log.id}>
                    <div className="log-topline">
                      <strong>{log.workflow}</strong>
                      <span className={`log-status ${log.status}`}>{log.status}</span>
                    </div>
                    <p>{log.payload}</p>
                    <small>
                      <Mail size={13} />
                      {log.event} - {log.timestamp}
                    </small>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default App;
