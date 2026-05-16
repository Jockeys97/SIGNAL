import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bell,
  Bot,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Database,
  Filter,
  KanbanSquare,
  Link2,
  Mail,
  MessageSquareText,
  Play,
  Plus,
  Route,
  Search,
  Send,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserRoundCheck,
  Webhook,
  Zap
} from "lucide-react";
import { initialLeads } from "./data";
import { applyAiClassification } from "./scenarioEngine";
import type { AutomationLog, Lead, LeadStatus, Scenario } from "./types";
import {
  apiModeEnabled,
  changeApiScenario,
  classifyApiMessage,
  createApiLead,
  fetchApiLeads,
  toggleApiTask,
  updateApiLead
} from "./api";

type View = "pipeline" | "inbox" | "workflows" | "logs" | "settings";
type LeadDraft = Pick<Lead, "name" | "company" | "email" | "source" | "value" | "notes">;

const STORAGE_KEY = "flowpilot.leads.v1";
const SELECTED_LEAD_KEY = "flowpilot.selectedLead.v1";

const statusLabels: Record<LeadStatus, string> = {
  new: "New",
  qualified: "Qualified",
  onboarding: "Onboarding",
  active: "Active",
  inactive: "Inactive",
  at_risk: "At Risk"
};

const scenarioSteps: Scenario[] = ["Discovery", "Qualification", "Onboarding", "Active Client"];

const navItems = [
  { id: "pipeline", label: "Pipeline", icon: KanbanSquare },
  { id: "inbox", label: "AI Inbox", icon: MessageSquareText },
  { id: "workflows", label: "Workflows", icon: Zap },
  { id: "logs", label: "Automation Logs", icon: Webhook },
  { id: "settings", label: "Settings", icon: Settings }
] satisfies Array<{ id: View; label: string; icon: typeof KanbanSquare }>;

const workflowTemplates = [
  {
    id: "wf-qualification",
    name: "Lead qualification router",
    trigger: "ai_classified",
    status: "Live",
    runs: 248,
    successRate: "98.8%",
    steps: ["Capture message", "Classify intent", "Update score", "Notify sales"]
  },
  {
    id: "wf-onboarding",
    name: "Onboarding checklist generator",
    trigger: "scenario_changed",
    status: "Live",
    runs: 91,
    successRate: "96.4%",
    steps: ["Detect new scenario", "Create tasks", "Queue welcome email", "Provision access"]
  },
  {
    id: "wf-recovery",
    name: "Inactive lead recovery",
    trigger: "email_queued",
    status: "Review",
    runs: 37,
    successRate: "89.1%",
    steps: ["Find inactivity", "Write follow-up", "Schedule reminder", "Escalate if ignored"]
  }
];

const integrations = [
  { name: "OpenAI", status: "Mock mode", icon: Sparkles },
  { name: "n8n Webhooks", status: "Ready to connect", icon: Webhook },
  { name: "PostgreSQL", status: "Planned", icon: Database },
  { name: "Email provider", status: "Simulated", icon: Mail }
];

function App() {
  const [leads, setLeads] = useState<Lead[]>(() => loadStoredLeads());
  const [selectedLeadId, setSelectedLeadId] = useState(() => localStorage.getItem(SELECTED_LEAD_KEY) ?? initialLeads[0].id);
  const [message, setMessage] = useState("Vorrei iscrivermi, ma prima vorrei capire prezzi e percorso.");
  const [activeView, setActiveView] = useState<View>("pipeline");
  const [searchQuery, setSearchQuery] = useState("");
  const [apiStatus, setApiStatus] = useState(apiModeEnabled ? "Connecting API" : "Local demo mode");
  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) ?? leads[0];

  useEffect(() => {
    if (apiModeEnabled) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem(SELECTED_LEAD_KEY, selectedLead.id);
  }, [selectedLead.id]);

  useEffect(() => {
    if (!apiModeEnabled) return;

    fetchApiLeads()
      .then((apiLeads) => {
        setLeads(apiLeads);
        setSelectedLeadId((currentId) => apiLeads.find((lead) => lead.id === currentId)?.id ?? apiLeads[0]?.id ?? currentId);
        setApiStatus("API connected");
      })
      .catch(() => setApiStatus("API unavailable"));
  }, []);

  const filteredLeads = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return leads;

    return leads.filter((lead) =>
      [lead.name, lead.company, lead.email, lead.intent, lead.scenario, ...lead.tags].some((field) =>
        field.toLowerCase().includes(query)
      )
    );
  }, [leads, searchQuery]);

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

  const allLogs = useMemo(
    () =>
      leads.flatMap((lead) =>
        lead.automationLogs.map((log) => ({
          ...log,
          leadName: lead.name,
          company: lead.company
        }))
      ),
    [leads]
  );

  async function handleClassify() {
    if (!message.trim()) return;

    if (apiModeEnabled) {
      const updatedLead = await classifyApiMessage(selectedLead.id, message.trim());
      replaceLead(updatedLead);
      return;
    }

    replaceLead(applyAiClassification(selectedLead, message.trim()));
  }

  function handleLeadSelect(leadId: string, view: View = activeView) {
    setSelectedLeadId(leadId);
    setActiveView(view);
  }

  async function handleCreateLead() {
    const lead = apiModeEnabled ? await createApiLead() : createDemoLead(leads.length + 1);

    setLeads((currentLeads) => [lead, ...currentLeads]);
    setSelectedLeadId(lead.id);
    setActiveView("pipeline");
  }

  async function handleUpdateLead(patch: Partial<LeadDraft>) {
    const optimisticLead = { ...selectedLead, ...patch, lastActivity: "Just now" };
    replaceLead(optimisticLead);

    if (apiModeEnabled) {
      replaceLead(await updateApiLead(selectedLead.id, patch));
    }
  }

  async function handleScenarioChange(scenario: Scenario) {
    if (apiModeEnabled) {
      replaceLead(await changeApiScenario(selectedLead.id, scenario));
      return;
    }

    replaceLead(applyScenarioChange(selectedLead, scenario));
  }

  async function handleToggleTask(taskId: string) {
    if (apiModeEnabled) {
      replaceLead(await toggleApiTask(selectedLead.id, taskId));
      return;
    }

    replaceLead({
      ...selectedLead,
      tasks: selectedLead.tasks.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task)),
      lastActivity: "Just now"
    });
  }

  function handleResetDemo() {
    setLeads(initialLeads);
    setSelectedLeadId(initialLeads[0].id);
    setSearchQuery("");
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SELECTED_LEAD_KEY);
  }

  function replaceLead(updatedLead: Lead) {
    setLeads((currentLeads) => currentLeads.map((lead) => (lead.id === updatedLead.id ? updatedLead : lead)));
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
          <input
            aria-label="Search leads"
            placeholder="Search leads"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>

        <nav className="side-nav" aria-label="Workspace navigation">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                className={activeView === item.id ? "active" : ""}
                key={item.id}
                onClick={() => setActiveView(item.id)}
                title={item.label}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <section className="lead-list" aria-label="Lead list">
          <div className="section-heading">
            <span>Leads</span>
            <strong>{filteredLeads.length}</strong>
          </div>

          {filteredLeads.map((lead) => (
            <button
              className={`lead-row ${lead.id === selectedLead.id ? "selected" : ""}`}
              key={lead.id}
              onClick={() => handleLeadSelect(lead.id, "pipeline")}
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
            <h1>{viewTitle(activeView)}</h1>
            <span className={`mode-pill ${apiModeEnabled ? "api" : "local"}`}>{apiStatus}</span>
          </div>
          <div className="topbar-actions">
            <button className="secondary-action">
              <Filter size={16} />
              Filters
            </button>
            <button className="secondary-action" onClick={handleCreateLead}>
              <Plus size={16} />
              New lead
            </button>
            <button className="primary-action" onClick={() => setActiveView("workflows")}>
              <Play size={17} />
              Run demo workflow
            </button>
          </div>
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

        {activeView === "pipeline" && (
          <PipelineView
            allLogs={allLogs}
            handleClassify={handleClassify}
            leads={filteredLeads}
            message={message}
            onLeadSelect={handleLeadSelect}
            onScenarioChange={handleScenarioChange}
            onToggleTask={handleToggleTask}
            onUpdateLead={handleUpdateLead}
            selectedLead={selectedLead}
            setMessage={setMessage}
          />
        )}

        {activeView === "inbox" && (
          <InboxView
            handleClassify={handleClassify}
            leads={filteredLeads}
            message={message}
            onLeadSelect={handleLeadSelect}
            selectedLead={selectedLead}
            setMessage={setMessage}
          />
        )}

        {activeView === "workflows" && <WorkflowsView />}

        {activeView === "logs" && <LogsView logs={allLogs} />}

        {activeView === "settings" && <SettingsView onResetDemo={handleResetDemo} />}
      </section>
    </main>
  );
}

function PipelineView({
  allLogs,
  handleClassify,
  leads,
  message,
  onLeadSelect,
  onScenarioChange,
  onToggleTask,
  onUpdateLead,
  selectedLead,
  setMessage
}: {
  allLogs: Array<AutomationLog & { leadName: string; company: string }>;
  handleClassify: () => void;
  leads: Lead[];
  message: string;
  onLeadSelect: (leadId: string, view?: View) => void;
  onScenarioChange: (scenario: Scenario) => void;
  onToggleTask: (taskId: string) => void;
  onUpdateLead: (patch: Partial<LeadDraft>) => void;
  selectedLead: Lead;
  setMessage: (message: string) => void;
}) {
  return (
    <section className="content-grid">
      <div className="main-stack">
        <KanbanBoard leads={leads} onLeadSelect={onLeadSelect} selectedLeadId={selectedLead.id} />
        <LeadDetail
          onScenarioChange={onScenarioChange}
          onToggleTask={onToggleTask}
          onUpdateLead={onUpdateLead}
          selectedLead={selectedLead}
        />
      </div>

      <aside className="right-rail">
        <AiPanel
          handleClassify={handleClassify}
          message={message}
          selectedLead={selectedLead}
          setMessage={setMessage}
        />
        <AutomationPanel logs={selectedLead.automationLogs} />
        <QuickSignals logs={allLogs} />
      </aside>
    </section>
  );
}

function InboxView({
  handleClassify,
  leads,
  message,
  onLeadSelect,
  selectedLead,
  setMessage
}: {
  handleClassify: () => void;
  leads: Lead[];
  message: string;
  onLeadSelect: (leadId: string, view?: View) => void;
  selectedLead: Lead;
  setMessage: (message: string) => void;
}) {
  return (
    <section className="split-view">
      <article className="lead-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">AI triage queue</p>
            <h2>Messages waiting for routing</h2>
          </div>
          <span className="status status-qualified">{leads.length} leads</span>
        </div>

        <div className="inbox-list">
          {leads.map((lead) => (
            <button
              className={`inbox-item ${lead.id === selectedLead.id ? "selected" : ""}`}
              key={lead.id}
              onClick={() => onLeadSelect(lead.id, "inbox")}
            >
              <span className="avatar">{lead.name.slice(0, 1)}</span>
              <span>
                <strong>{lead.name}</strong>
                <small>{lead.notes}</small>
              </span>
              <span className={`status status-${lead.status}`}>{statusLabels[lead.status]}</span>
            </button>
          ))}
        </div>
      </article>

      <aside className="right-rail">
        <AiPanel
          handleClassify={handleClassify}
          message={message}
          selectedLead={selectedLead}
          setMessage={setMessage}
        />
        <section className="automation-panel">
          <div className="section-heading">
            <span>Suggested reply</span>
            <strong>Draft</strong>
          </div>
          <div className="reply-draft">
            <p>
              Hi {selectedLead.name.split(" ")[0]}, thanks for reaching out. Based on your request, I can send the
              pricing overview and help you pick the best onboarding path.
            </p>
            <button className="secondary-action full">
              <Send size={16} />
              Queue reply
            </button>
          </div>
        </section>
      </aside>
    </section>
  );
}

function WorkflowsView() {
  return (
    <section className="workflow-layout">
      <article className="lead-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Workflow builder</p>
            <h2>Automation templates</h2>
          </div>
          <button className="secondary-action">
            <Plus size={16} />
            New workflow
          </button>
        </div>

        <div className="workflow-grid">
          {workflowTemplates.map((workflow) => (
            <article className="workflow-card" key={workflow.id}>
              <div className="workflow-topline">
                <div>
                  <strong>{workflow.name}</strong>
                  <span>Trigger: {workflow.trigger}</span>
                </div>
                <span className={`workflow-state ${workflow.status.toLowerCase()}`}>{workflow.status}</span>
              </div>

              <div className="workflow-steps">
                {workflow.steps.map((step, index) => (
                  <div className="workflow-step" key={step}>
                    <span>{index + 1}</span>
                    <p>{step}</p>
                  </div>
                ))}
              </div>

              <div className="workflow-stats">
                <Info label="Runs" value={workflow.runs.toString()} />
                <Info label="Success rate" value={workflow.successRate} />
              </div>
            </article>
          ))}
        </div>
      </article>

      <aside className="automation-panel workflow-preview">
        <div className="section-heading">
          <span>Event map</span>
          <strong>Live demo</strong>
        </div>
        <div className="event-map">
          {["lead_created", "ai_classified", "scenario_changed", "task_generated", "webhook_triggered"].map((event) => (
            <div className="event-node" key={event}>
              <span />
              <p>{event}</p>
            </div>
          ))}
        </div>
      </aside>
    </section>
  );
}

function LogsView({ logs }: { logs: Array<AutomationLog & { leadName: string; company: string }> }) {
  return (
    <section className="lead-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Observability</p>
          <h2>Automation execution history</h2>
        </div>
        <button className="secondary-action">
          <SlidersHorizontal size={16} />
          Configure retries
        </button>
      </div>

      <div className="logs-table">
        {logs.map((log) => (
          <article className="logs-row" key={log.id}>
            <div>
              <strong>{log.workflow}</strong>
              <span>{log.leadName} - {log.company}</span>
            </div>
            <code>{log.event}</code>
            <p>{log.payload}</p>
            <span className={`log-status ${log.status}`}>{log.status}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function SettingsView({ onResetDemo }: { onResetDemo: () => void }) {
  return (
    <section className="settings-grid">
      <article className="lead-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Integrations</p>
            <h2>Connection center</h2>
          </div>
          <span className="status status-new">Demo mode</span>
        </div>

        <div className="integration-list">
          {integrations.map((integration) => {
            const Icon = integration.icon;

            return (
              <div className="integration-item" key={integration.name}>
                <span className="integration-icon">
                  <Icon size={18} />
                </span>
                <div>
                  <strong>{integration.name}</strong>
                  <small>{integration.status}</small>
                </div>
                <button className="icon-button" title={`Configure ${integration.name}`}>
                  <Link2 size={17} />
                </button>
              </div>
            );
          })}
        </div>
      </article>

      <article className="automation-panel">
        <div className="section-heading">
          <span>Workspace controls</span>
          <strong>4 enabled</strong>
        </div>
        <div className="control-list">
          <Control icon={ShieldCheck} label="Role-based CRM access" />
          <Control icon={Bell} label="Sales alert notifications" />
          <Control icon={Database} label="Persistent data model planned" />
          <Control icon={Webhook} label="Webhook retry policy" />
        </div>
        <button className="secondary-action full reset-action" onClick={onResetDemo}>
          Reset local demo data
        </button>
      </article>
    </section>
  );
}

function KanbanBoard({
  leads,
  onLeadSelect,
  selectedLeadId
}: {
  leads: Lead[];
  onLeadSelect: (leadId: string, view?: View) => void;
  selectedLeadId: string;
}) {
  const columns: Array<{ label: string; scenario: Scenario }> = [
    { label: "Discovery", scenario: "Discovery" },
    { label: "Qualification", scenario: "Qualification" },
    { label: "Onboarding", scenario: "Onboarding" },
    { label: "Active", scenario: "Active Client" },
    { label: "Risk", scenario: "At Risk" }
  ];

  return (
    <article className="kanban-panel">
      <div className="panel-header compact">
        <div>
          <p className="eyebrow">Pipeline</p>
          <h2>Scenario board</h2>
        </div>
        <span className="status status-new">{leads.length} records</span>
      </div>

      <div className="kanban-board">
        {columns.map((column) => {
          const columnLeads = leads.filter((lead) => lead.scenario === column.scenario);

          return (
            <section className="kanban-column" key={column.scenario}>
              <div className="kanban-heading">
                <strong>{column.label}</strong>
                <span>{columnLeads.length}</span>
              </div>
              {columnLeads.map((lead) => (
                <button
                  className={`kanban-card ${lead.id === selectedLeadId ? "selected" : ""}`}
                  key={lead.id}
                  onClick={() => onLeadSelect(lead.id, "pipeline")}
                >
                  <strong>{lead.name}</strong>
                  <span>{lead.company}</span>
                  <div>
                    <small>{lead.intent}</small>
                    <b>{lead.score}</b>
                  </div>
                </button>
              ))}
            </section>
          );
        })}
      </div>
    </article>
  );
}

function LeadDetail({
  onScenarioChange,
  onToggleTask,
  onUpdateLead,
  selectedLead
}: {
  onScenarioChange: (scenario: Scenario) => void;
  onToggleTask: (taskId: string) => void;
  onUpdateLead: (patch: Partial<LeadDraft>) => void;
  selectedLead: Lead;
}) {
  return (
    <article className="lead-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Selected account</p>
          <h2>{selectedLead.name}</h2>
        </div>
        <span className={`status status-${selectedLead.status}`}>{statusLabels[selectedLead.status]}</span>
      </div>

      <div className="profile-grid">
        <EditableInfo label="Company" value={selectedLead.company} onChange={(value) => onUpdateLead({ company: value })} />
        <EditableInfo label="Email" value={selectedLead.email} onChange={(value) => onUpdateLead({ email: value })} />
        <EditableInfo label="Source" value={selectedLead.source} onChange={(value) => onUpdateLead({ source: value })} />
        <EditableInfo label="Deal value" value={selectedLead.value} onChange={(value) => onUpdateLead({ value })} />
        <Info label="Intent" value={selectedLead.intent} />
        <Info label="Sentiment" value={selectedLead.sentiment} />
      </div>

      <div className="scenario-control">
        <label htmlFor="scenario-select">Scenario</label>
        <select
          id="scenario-select"
          value={selectedLead.scenario}
          onChange={(event) => onScenarioChange(event.target.value as Scenario)}
        >
          {[...scenarioSteps, "At Risk"].map((scenario) => (
            <option key={scenario} value={scenario}>
              {scenario}
            </option>
          ))}
        </select>
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

      <div className="notes-block editable-notes">
        <textarea
          aria-label="Lead notes"
          value={selectedLead.notes}
          onChange={(event) => onUpdateLead({ notes: event.target.value })}
        />
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
              <button className={`task-item ${task.done ? "done" : ""}`} key={task.id} onClick={() => onToggleTask(task.id)}>
                <CheckCircle2 size={17} />
                <div>
                  <strong>{task.title}</strong>
                  <span>
                    {task.owner} - {task.due}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}

function AiPanel({
  handleClassify,
  message,
  selectedLead,
  setMessage
}: {
  handleClassify: () => void;
  message: string;
  selectedLead: Lead;
  setMessage: (message: string) => void;
}) {
  return (
    <section className="ai-panel">
      <div className="panel-header compact">
        <div>
          <p className="eyebrow">AI assistant</p>
          <h2>Classify and route</h2>
        </div>
        <Bot size={22} />
      </div>

      <textarea aria-label="Customer message" value={message} onChange={(event) => setMessage(event.target.value)} />

      <button className="primary-action full" onClick={handleClassify}>
        <Sparkles size={17} />
        Analyze message
      </button>

      <div className="ai-result">
        <div>
          <span>Current intent</span>
          <strong title={selectedLead.intent}>{selectedLead.intent}</strong>
        </div>
        <ArrowRight size={17} />
        <div>
          <span>Scenario</span>
          <strong title={selectedLead.scenario}>{selectedLead.scenario}</strong>
        </div>
      </div>
    </section>
  );
}

function AutomationPanel({ logs }: { logs: AutomationLog[] }) {
  return (
    <section className="automation-panel">
      <div className="section-heading">
        <span>Automation logs</span>
        <strong>{logs.length}</strong>
      </div>

      <div className="log-list">
        {logs.map((log) => (
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
  );
}

function QuickSignals({ logs }: { logs: Array<AutomationLog & { leadName: string; company: string }> }) {
  const failed = logs.filter((log) => log.status === "error").length;
  const pending = logs.filter((log) => log.status === "pending").length;

  return (
    <section className="automation-panel compact-panel">
      <div className="section-heading">
        <span>System signals</span>
        <strong>Live</strong>
      </div>
      <div className="signal-grid">
        <Info label="Pending runs" value={pending.toString()} />
        <Info label="Errors" value={failed.toString()} />
      </div>
    </section>
  );
}

function Control({ icon: Icon, label }: { icon: typeof ShieldCheck; label: string }) {
  return (
    <div className="control-item">
      <Icon size={18} />
      <span>{label}</span>
      <strong>On</strong>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-item">
      <span>{label}</span>
      <strong title={value}>{value}</strong>
    </div>
  );
}

function EditableInfo({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="info-item editable-info">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function viewTitle(view: View) {
  const titles: Record<View, string> = {
    pipeline: "AI-driven CRM command center",
    inbox: "AI inbox and lead triage",
    workflows: "Workflow automation builder",
    logs: "Automation observability",
    settings: "Workspace settings"
  };

  return titles[view];
}

export default App;

function loadStoredLeads() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return initialLeads;

    const parsed = JSON.parse(stored) as Lead[];
    return Array.isArray(parsed) && parsed.length ? parsed : initialLeads;
  } catch {
    return initialLeads;
  }
}

function createDemoLead(index: number): Lead {
  return {
    id: crypto.randomUUID(),
    name: `New Lead ${index}`,
    company: "New Account",
    email: `lead${index}@example.com`,
    status: "new",
    scenario: "Discovery",
    score: 52,
    priority: "Medium",
    tags: ["new", "manual-entry"],
    source: "Manual entry",
    value: "EUR 1.500",
    lastActivity: "Just now",
    intent: "general_interest",
    sentiment: "Neutral",
    notes: "New lead created from the CRM workspace. Qualify the request and route it to the right scenario.",
    events: [
      {
        id: crypto.randomUUID(),
        type: "lead_created",
        title: "Lead created manually",
        description: "A CRM operator added this lead from the product demo workspace.",
        timestamp: "Just now"
      }
    ],
    tasks: [
      {
        id: crypto.randomUUID(),
        title: "Qualify lead and confirm next step",
        owner: "Sales",
        due: "Today",
        done: false
      }
    ],
    automationLogs: [
      {
        id: crypto.randomUUID(),
        workflow: "Manual lead intake",
        event: "lead_created",
        status: "success",
        timestamp: "Just now",
        payload: "{ source: 'manual_entry', scenario: 'Discovery' }"
      }
    ]
  };
}

function scenarioToStatus(scenario: Scenario): LeadStatus {
  const map: Record<Scenario, LeadStatus> = {
    Discovery: "new",
    Qualification: "qualified",
    Onboarding: "onboarding",
    "Active Client": "active",
    "At Risk": "at_risk"
  };

  return map[scenario];
}

function applyScenarioChange(lead: Lead, scenario: Scenario): Lead {
  return {
    ...lead,
    scenario,
    status: scenarioToStatus(scenario),
    lastActivity: "Just now",
    events: [
      {
        id: crypto.randomUUID(),
        type: "scenario_changed",
        title: `Scenario manually changed to ${scenario}`,
        description: "CRM operator updated the customer journey stage from the account workspace.",
        timestamp: "Just now"
      },
      ...lead.events
    ],
    automationLogs: [
      {
        id: crypto.randomUUID(),
        workflow: "Manual scenario override",
        event: "scenario_changed",
        status: "success",
        timestamp: "Just now",
        payload: `{ scenario: '${scenario}', operator: 'demo_user' }`
      },
      ...lead.automationLogs
    ]
  };
}
