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
import { DEMO_LEAD_ID, DEMO_MESSAGE, initialLeads } from "./data";
import { applyAiClassification } from "./scenarioEngine";
import type { AutomationLog, Lead, LeadStatus, Scenario } from "./types";
import {
  apiModeEnabled,
  changeApiScenario,
  checkApiHealth,
  classifyApiMessage,
  createApiLead,
  fetchApiLeads,
  toggleApiTask,
  updateApiLead
} from "./api";

type View = "pipeline" | "inbox" | "workflows" | "logs" | "settings";
type LeadDraft = Pick<Lead, "name" | "company" | "email" | "source" | "value" | "notes">;

const STORAGE_KEY = "signal.audiences.v1";
const SELECTED_LEAD_KEY = "signal.selectedAudience.v1";
const INTRO_KEY = "signal.intro.seen.v1";

const statusLabels: Record<LeadStatus, string> = {
  new: "In analisi",
  qualified: "Impatto mappato",
  onboarding: "In progetto",
  active: "Operativo",
  inactive: "Inattivo",
  at_risk: "A rischio"
};

const scenarioSteps: Scenario[] = ["Analysis", "Impact", "Project", "Operational"];

const navItems = [
  { id: "pipeline", label: "Cruscotto", icon: KanbanSquare },
  { id: "inbox", label: "Segnali", icon: MessageSquareText },
  { id: "workflows", label: "Automazioni", icon: Zap },
  { id: "logs", label: "Storico", icon: Webhook },
  { id: "settings", label: "Sistema", icon: Settings }
] satisfies Array<{ id: View; label: string; icon: typeof KanbanSquare }>;

const workflowTemplates = [
  {
    id: "wf-qualification",
    name: "Router anomalia → azione",
    trigger: "ai_classified",
    status: "Attivo",
    runs: 248,
    successRate: "98,8%",
    steps: ["Cattura segnale debole", "Trova causa radice", "Consiglia azione", "Notifica owner"]
  },
  {
    id: "wf-onboarding",
    name: "Workflow risposta knowledge",
    trigger: "knowledge_query",
    status: "Attivo",
    runs: 91,
    successRate: "96,4%",
    steps: ["Analizza domanda", "Recupera fonte", "Genera risposta", "Registra confidenza"]
  },
  {
    id: "wf-recovery",
    name: "Loop monitor reputazione",
    trigger: "market_signal",
    status: "In revisione",
    runs: 37,
    successRate: "89,1%",
    steps: ["Traccia sentiment", "Confronta competitor", "Rileva rischio", "Escala risposta"]
  }
];

const integrations = [
  { name: "Modello decisionale AI", status: "Motore regole locale", icon: Sparkles },
  { name: "Webhook n8n", status: "Pronto per workflow", icon: Webhook },
  { name: "Knowledge base aziendale", status: "Indice simulato", icon: Database },
  { name: "Monitor reputazione", status: "Segnali di mercato mock", icon: Mail }
];

const eventMapLabels: Record<string, string> = {
  data_ingested: "Dati acquisiti",
  ai_interpreted: "AI interpreta segnale",
  root_cause_found: "Causa radice trovata",
  task_generated: "Task generato",
  workflow_triggered: "Workflow attivato"
};

function App() {
  const [showIntro, setShowIntro] = useState(() => !localStorage.getItem(INTRO_KEY));
  const [leads, setLeads] = useState<Lead[]>(() => loadStoredLeads());
  const [selectedLeadId, setSelectedLeadId] = useState(() => localStorage.getItem(SELECTED_LEAD_KEY) ?? initialLeads[0].id);
  const [message, setMessage] = useState(DEMO_MESSAGE);
  const [activeView, setActiveView] = useState<View>("pipeline");
  const [searchQuery, setSearchQuery] = useState("");
  const [apiStatus, setApiStatus] = useState(apiModeEnabled ? "Verifica API…" : "Demo interattiva");
  const [flashTick, setFlashTick] = useState(0);
  const [mobilePipelineView, setMobilePipelineView] = useState<"list" | "detail">("list");
  const [isMobile, setIsMobile] = useState(false);
  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) ?? leads[0];

  useEffect(() => {
    if (apiModeEnabled) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem(SELECTED_LEAD_KEY, selectedLead.id);
  }, [selectedLead.id]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 820px)");
    const syncMobile = () => setIsMobile(media.matches);
    syncMobile();
    media.addEventListener("change", syncMobile);
    return () => media.removeEventListener("change", syncMobile);
  }, []);

  useEffect(() => {
    if (!apiModeEnabled) return;

    checkApiHealth()
      .then((healthy) => {
        if (!healthy) {
          setApiStatus("API non raggiungibile");
          return;
        }

        return fetchApiLeads().then((apiLeads) => {
          setLeads(apiLeads);
          setSelectedLeadId(
            (currentId) => apiLeads.find((lead) => lead.id === currentId)?.id ?? apiLeads[0]?.id ?? currentId
          );
          setApiStatus("API collegata");
        });
      })
      .catch(() => setApiStatus("API non raggiungibile"));
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
      { label: "Risparmio stimato", value: "-42%", icon: Activity },
      { label: "Confidenza AI", value: `${avgScore}%`, icon: Sparkles },
      { label: "Processi attivi", value: activeValue.toString(), icon: UserRoundCheck },
      { label: "Azioni aperte", value: openTasks.toString(), icon: Clock3 },
      { label: "Decisioni registrate", value: automations.toString(), icon: Webhook }
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
      setFlashTick((tick) => tick + 1);
      return;
    }

    replaceLead(applyAiClassification(selectedLead, message.trim()));
    setFlashTick((tick) => tick + 1);
  }

  function handlePlayDemo() {
    setSelectedLeadId(DEMO_LEAD_ID);
    setMessage(DEMO_MESSAGE);
    setActiveView("pipeline");
    if (isMobile) setMobilePipelineView("detail");

    window.requestAnimationFrame(() => {
      document.getElementById("decision-insights")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function handleLeadSelect(leadId: string, view: View = activeView) {
    setSelectedLeadId(leadId);
    setActiveView(view);
    if (isMobile && view === "pipeline") setMobilePipelineView("detail");
  }

  async function handleCreateLead() {
    const lead = apiModeEnabled ? await createApiLead() : createDemoLead(leads.length + 1);

    setLeads((currentLeads) => [lead, ...currentLeads]);
    setSelectedLeadId(lead.id);
    setActiveView("pipeline");
  }

  async function handleUpdateLead(patch: Partial<LeadDraft>) {
    const optimisticLead = { ...selectedLead, ...patch, lastActivity: "Adesso" };
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
      lastActivity: "Adesso"
    });
  }

  function handleResetDemo() {
    setLeads(initialLeads);
    setSelectedLeadId(initialLeads[0].id);
    setSearchQuery("");
    setMessage(DEMO_MESSAGE);
    setMobilePipelineView("list");
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SELECTED_LEAD_KEY);
  }

  function replaceLead(updatedLead: Lead) {
    setLeads((currentLeads) => currentLeads.map((lead) => (lead.id === updatedLead.id ? updatedLead : lead)));
  }

  function enterWorkspace() {
    localStorage.setItem(INTRO_KEY, "1");
    setShowIntro(false);
  }

  function enterWorkspaceAndPlay() {
    localStorage.setItem(INTRO_KEY, "1");
    setShowIntro(false);
    setSelectedLeadId(DEMO_LEAD_ID);
    setMessage(DEMO_MESSAGE);
    setActiveView("pipeline");
    setMobilePipelineView("detail");
    window.setTimeout(() => {
      document.getElementById("decision-insights")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 350);
  }

  if (showIntro) {
    return <IntroLanding onEnter={enterWorkspace} onPlayDemo={enterWorkspaceAndPlay} />;
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Route size={20} />
          </div>
          <div>
            <p>SIGNAL</p>
            <span>Intelligenza operativa AI</span>
          </div>
        </div>

        <div className="search-box">
          <Search size={16} />
          <input
            aria-label="Cerca casi demo"
            placeholder="Cerca un caso demo"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>

        <nav className="side-nav" aria-label="Navigazione principale">
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

        <section className="lead-list" aria-label="Elenco casi demo">
          <div className="section-heading">
            <span>Casi demo</span>
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
                <small>
                  {lead.company} · {formatIntentLabel(lead.intent)}
                </small>
              </span>
              <span className={`score score-${lead.priority.toLowerCase()}`}>{lead.score}</span>
            </button>
          ))}
        </section>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Prototipo portfolio · AI operativa per decisioni aziendali</p>
            <h1>{viewTitle(activeView)}</h1>
            <p className="view-subtitle">{viewSubtitle(activeView)}</p>
            <span className={`mode-pill ${apiModeEnabled ? "api" : "local"}`}>{apiStatus}</span>
          </div>
          <div className="topbar-actions">
            <button className="secondary-action" onClick={handlePlayDemo}>
              <Play size={16} />
              Riproduci demo
            </button>
            <button className="secondary-action" onClick={handleCreateLead}>
              <Plus size={16} />
              Nuovo segnale
            </button>
            <button className="primary-action" onClick={() => setActiveView("workflows")}>
              <Zap size={17} />
              Vedi automazioni
            </button>
          </div>
        </header>

        {activeView === "pipeline" && (
          <>
            <BlissMethodStrip />
            <DemoGuide />
          </>
        )}

        <section className="metrics-grid" aria-label="SIGNAL metrics">
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
            flashTick={flashTick}
            handleClassify={handleClassify}
            isMobile={isMobile}
            leads={filteredLeads}
            message={message}
            mobilePipelineView={mobilePipelineView}
            onBackToList={() => setMobilePipelineView("list")}
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
  flashTick,
  handleClassify,
  isMobile,
  leads,
  message,
  mobilePipelineView,
  onBackToList,
  onLeadSelect,
  onScenarioChange,
  onToggleTask,
  onUpdateLead,
  selectedLead,
  setMessage
}: {
  allLogs: Array<AutomationLog & { leadName: string; company: string }>;
  flashTick: number;
  handleClassify: () => void;
  isMobile: boolean;
  leads: Lead[];
  message: string;
  mobilePipelineView: "list" | "detail";
  onBackToList: () => void;
  onLeadSelect: (leadId: string, view?: View) => void;
  onScenarioChange: (scenario: Scenario) => void;
  onToggleTask: (taskId: string) => void;
  onUpdateLead: (patch: Partial<LeadDraft>) => void;
  selectedLead: Lead;
  setMessage: (message: string) => void;
}) {
  const mobileClass =
    isMobile && mobilePipelineView === "detail" ? "pipeline-mobile-detail" : isMobile ? "pipeline-mobile-list" : "";

  return (
    <section className={`content-grid ${mobileClass}`}>
      <div className="main-stack">
        <KanbanBoard leads={leads} onLeadSelect={onLeadSelect} selectedLeadId={selectedLead.id} />
        <LeadDetail
          flashTick={flashTick}
          onBackToList={onBackToList}
          onScenarioChange={onScenarioChange}
          onToggleTask={onToggleTask}
          onUpdateLead={onUpdateLead}
          selectedLead={selectedLead}
          showMobileBack={isMobile && mobilePipelineView === "detail"}
        />
      </div>

      <aside className="right-rail">
        <AiPanel
          flashTick={flashTick}
          handleClassify={handleClassify}
          message={message}
          selectedLead={selectedLead}
          setMessage={setMessage}
        />
        <DecisionInsights flashTick={flashTick} selectedLead={selectedLead} />
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
            <p className="eyebrow">Coda intelligence</p>
            <h2>Domande, anomalie e segnali di mercato</h2>
          </div>
          <span className="status status-qualified">{leads.length} segnali</span>
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
          flashTick={0}
          handleClassify={handleClassify}
          message={message}
          selectedLead={selectedLead}
          setMessage={setMessage}
        />
        <section className="automation-panel">
          <div className="section-heading">
            <span>Risposta suggerita</span>
            <strong>Bozza</strong>
          </div>
          <div className="reply-draft">
            <p>
              SIGNAL propone per {selectedLead.company}: isolare la causa, assegnare un owner e trasformare la
              raccomandazione in workflow operativo.
            </p>
            <button className="secondary-action full" type="button">
              <Send size={16} />
              Metti in coda risposta
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
            <p className="eyebrow">Studio automazioni</p>
            <h2>Template di automazione processi</h2>
          </div>
          <button className="secondary-action" type="button">
            <Plus size={16} />
            Nuova automazione
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
                <span
                  className={`workflow-state ${workflow.status === "Attivo" ? "live" : "review"}`}
                >
                  {workflow.status}
                </span>
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
                <Info label="Esecuzioni" value={workflow.runs.toString()} />
                <Info label="Tasso successo" value={workflow.successRate} />
              </div>
            </article>
          ))}
        </div>
      </article>

      <aside className="automation-panel workflow-preview">
        <div className="section-heading">
          <span>Modello operativo</span>
          <strong>Sistema live</strong>
        </div>
        <div className="event-map">
          {Object.entries(eventMapLabels).map(([event, label]) => (
            <div className="event-node" key={event}>
              <span />
              <p>{label}</p>
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
          <p className="eyebrow">Osservabilità</p>
          <h2>Storico decisioni AI</h2>
        </div>
        <button className="secondary-action" type="button">
          <SlidersHorizontal size={16} />
          Configura routing
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
            <span className={`log-status ${log.status}`}>{formatLogStatus(log.status)}</span>
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
          <p className="eyebrow">Integrazioni sistema</p>
          <h2>Layer di intelligence operativa</h2>
          </div>
          <span className="status status-new">Modalità demo</span>
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
                <button className="icon-button" type="button" title={`Configura ${integration.name}`}>
                  <Link2 size={17} />
                </button>
              </div>
            );
          })}
        </div>
      </article>

      <article className="automation-panel">
        <div className="section-heading">
          <span>Controlli workspace</span>
          <strong>4 attivi</strong>
        </div>
        <div className="control-list">
          <Control icon={ShieldCheck} label="Accesso decisionale per ruolo" />
          <Control icon={Bell} label="Alert anomalie critiche" />
          <Control icon={Database} label="Indicizzazione knowledge base" />
          <Control icon={Webhook} label="Policy attivazione workflow" />
        </div>
        <button className="secondary-action full reset-action" type="button" onClick={onResetDemo}>
          Ripristina dati demo locali
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
    { label: "Analisi", scenario: "Analysis" },
    { label: "Impatto", scenario: "Impact" },
    { label: "Progetto", scenario: "Project" },
    { label: "Operativo", scenario: "Operational" },
    { label: "Rischio", scenario: "Risk" }
  ];

  return (
    <article className="kanban-panel">
      <div className="panel-header compact">
        <div>
          <p className="eyebrow">Mappa operativa</p>
          <h2>Da analisi a automazione</h2>
        </div>
        <span className="status status-new">{leads.length} casi</span>
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
                    <small>{formatIntentLabel(lead.intent)}</small>
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
  flashTick,
  onBackToList,
  onScenarioChange,
  onToggleTask,
  onUpdateLead,
  selectedLead,
  showMobileBack
}: {
  flashTick: number;
  onBackToList: () => void;
  onScenarioChange: (scenario: Scenario) => void;
  onToggleTask: (taskId: string) => void;
  onUpdateLead: (patch: Partial<LeadDraft>) => void;
  selectedLead: Lead;
  showMobileBack: boolean;
}) {
  return (
    <article className="lead-panel">
      <div className="panel-header">
        <div>
          {showMobileBack && (
            <button className="mobile-back" type="button" onClick={onBackToList}>
              ← Torna alla mappa
            </button>
          )}
          <p className="eyebrow">Caso selezionato</p>
          <h2>{selectedLead.name}</h2>
        </div>
        <span className={`status status-${selectedLead.status}`}>{statusLabels[selectedLead.status]}</span>
      </div>

      <div className="profile-grid">
        <EditableInfo label="Azienda" value={selectedLead.company} onChange={(value) => onUpdateLead({ company: value })} />
        <EditableInfo label="Email" value={selectedLead.email} onChange={(value) => onUpdateLead({ email: value })} />
        <EditableInfo label="Fonte" value={selectedLead.source} onChange={(value) => onUpdateLead({ source: value })} />
        <EditableInfo label="Impatto stimato" value={selectedLead.value} onChange={(value) => onUpdateLead({ value })} />
        <Info label="Tipo segnale" value={formatIntentLabel(selectedLead.intent)} />
        <Info label="Sentiment" value={formatSentimentLabel(selectedLead.sentiment)} />
      </div>

      <div className="scenario-control">
        <label htmlFor="scenario-select">Stage del metodo</label>
        <select
          id="scenario-select"
          value={selectedLead.scenario}
          onChange={(event) => onScenarioChange(event.target.value as Scenario)}
        >
          {[...scenarioSteps, "Risk"].map((scenario) => (
            <option key={scenario} value={scenario}>
              {formatScenarioLabel(scenario as Scenario)}
            </option>
          ))}
        </select>
      </div>

      <div
        className={`scenario-strip ${flashTick > 0 ? "flash-update" : ""}`}
        aria-label="Avanzamento operativo"
        key={`strip-${flashTick}`}
      >
        {scenarioSteps.map((scenario, index) => {
          const isCurrent = selectedLead.scenario === scenario;
          const isComplete = scenarioSteps.indexOf(selectedLead.scenario) > index;

          return (
            <div className={`scenario-step ${isCurrent ? "current" : ""} ${isComplete ? "complete" : ""}`} key={scenario}>
              <span>{isComplete ? <CheckCircle2 size={15} /> : index + 1}</span>
              <p>{formatScenarioLabel(scenario)}</p>
            </div>
          );
        })}
        {selectedLead.scenario === "Risk" && (
          <div className="scenario-step risk current">
            <span>
              <CircleAlert size={15} />
            </span>
            <p>Rischio</p>
          </div>
        )}
      </div>

      <div className="notes-block editable-notes">
        <textarea
          aria-label="Note sul caso"
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
            <span>Cronologia</span>
            <strong>{selectedLead.events.length}</strong>
          </div>
          <div className={`timeline ${flashTick > 0 ? "flash-update" : ""}`} key={`timeline-${flashTick}`}>
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
            <span>Prossime azioni</span>
            <strong>{selectedLead.tasks.filter((task) => !task.done).length} aperte</strong>
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

function DecisionInsights({ flashTick, selectedLead }: { flashTick: number; selectedLead: Lead }) {
  const insight = decisionInsightsForLead(selectedLead);

  return (
    <section className="automation-panel decision-panel" id="decision-insights" key={`insights-${flashTick}`}>
      <div className="section-heading">
        <span>{insight.title}</span>
        <strong>Live</strong>
      </div>
      <div className="decision-block">
        <span>Cosa succede</span>
        <strong>{insight.anomaly}</strong>
      </div>
      <div className="decision-block">
        <span>Perché succede</span>
        <strong>{insight.cause}</strong>
      </div>
      <div className="decision-actions">
        <span>Cosa fare adesso</span>
        <ol>
          {insight.actions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function AiPanel({
  flashTick,
  handleClassify,
  message,
  selectedLead,
  setMessage
}: {
  flashTick: number;
  handleClassify: () => void;
  message: string;
  selectedLead: Lead;
  setMessage: (message: string) => void;
}) {
  return (
    <section className="ai-panel" id="ai-panel">
      <div className="panel-header compact">
        <div>
          <p className="eyebrow">Simulazione AI</p>
          <h2>Analizza e decidi</h2>
        </div>
        <Bot size={22} />
      </div>

      <p className="panel-hint">
        Scrivi un problema operativo reale. SIGNAL classifica il segnale, aggiorna lo stage e genera task + log.
      </p>

      <textarea
        aria-label="Messaggio operativo"
        placeholder="Es: Le conversioni sono calate e non sappiamo perché."
        value={message}
        onChange={(event) => setMessage(event.target.value)}
      />

      <button className="primary-action full" type="button" onClick={handleClassify}>
        <Sparkles size={17} />
        Analizza segnale
      </button>

      <div className={`ai-result ${flashTick > 0 ? "flash-update" : ""}`} key={`ai-result-${flashTick}`}>
        <div>
          <span>Tipo rilevato</span>
          <strong title={selectedLead.intent}>{formatIntentLabel(selectedLead.intent)}</strong>
        </div>
        <ArrowRight size={17} />
        <div>
          <span>Stage operativo</span>
          <strong title={selectedLead.scenario}>{formatScenarioLabel(selectedLead.scenario)}</strong>
        </div>
      </div>
    </section>
  );
}

function AutomationPanel({ logs }: { logs: AutomationLog[] }) {
  return (
    <section className="automation-panel">
      <div className="section-heading">
        <span>Log decisionali</span>
        <strong>{logs.length}</strong>
      </div>

      <div className="log-list">
        {logs.map((log) => (
          <article className="log-item" key={log.id}>
            <div className="log-topline">
              <strong>{log.workflow}</strong>
              <span className={`log-status ${log.status}`}>{formatLogStatus(log.status)}</span>
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
        <span>Segnali di sistema</span>
        <strong>Live</strong>
      </div>
      <div className="signal-grid">
        <Info label="Workflow in attesa" value={pending.toString()} />
        <Info label="Errori" value={failed.toString()} />
      </div>
    </section>
  );
}

function Control({ icon: Icon, label }: { icon: typeof ShieldCheck; label: string }) {
  return (
    <div className="control-item">
      <Icon size={18} />
      <span>{label}</span>
      <strong>Attivo</strong>
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

function DemoGuide() {
  return (
    <section className="demo-guide" aria-label="Come usare la demo">
      <div className="demo-guide-step">
        <span>1</span>
        <p>Scegli un caso a sinistra, ad esempio <strong>Conversion Drop</strong>.</p>
      </div>
      <div className="demo-guide-step">
        <span>2</span>
        <p>Leggi <strong>perché succede</strong> e le <strong>azioni consigliate</strong> nel pannello a destra.</p>
      </div>
      <div className="demo-guide-step">
        <span>3</span>
        <p>Clicca <strong>Analizza segnale</strong> per vedere l&apos;AI aggiornare stage, task e log in tempo reale.</p>
      </div>
    </section>
  );
}

function viewTitle(view: View) {
  const titles: Record<View, string> = {
    pipeline: "Cruscotto decisionale AI",
    inbox: "Segnali da smistare",
    workflows: "Automazioni collegate",
    logs: "Storico decisioni AI",
    settings: "Collegamenti sistema"
  };

  return titles[view];
}

function viewSubtitle(view: View) {
  const subtitles: Record<View, string> = {
    pipeline: "Trasforma un problema aziendale in causa, azione e automazione simulata.",
    inbox: "Domande, anomalie e segnali di mercato in attesa di interpretazione.",
    workflows: "Template che mostrano come SIGNAL attiverebbe processi reali (es. n8n).",
    logs: "Ogni decisione AI lascia traccia, come in un sistema di produzione.",
    settings: "Moduli collegabili: modello AI, knowledge base, reputazione, webhook."
  };

  return subtitles[view];
}

function formatIntentLabel(intent: string) {
  const labels: Record<string, string> = {
    performance_anomaly: "Anomalia performance",
    knowledge_query: "Domanda documenti",
    reputation_risk: "Rischio reputazione",
    process_automation: "Automazione processo",
    operational_signal: "Segnale operativo",
    pricing_signal: "Interesse prezzi",
    activation_intent: "Attivazione servizio",
    objection_signal: "Obiezione cliente",
    general_signal: "Segnale generico"
  };

  return labels[intent] ?? intent;
}

function formatSentimentLabel(sentiment: Lead["sentiment"]) {
  const labels: Record<Lead["sentiment"], string> = {
    Positive: "Positivo",
    Neutral: "Neutro",
    Concerned: "Preoccupato"
  };

  return labels[sentiment];
}

function formatLogStatus(status: AutomationLog["status"]) {
  const labels: Record<AutomationLog["status"], string> = {
    success: "Completato",
    pending: "In attesa",
    error: "Errore"
  };

  return labels[status] ?? status;
}

function formatScenarioLabel(scenario: Scenario) {
  const labels: Record<Scenario, string> = {
    Analysis: "Analisi",
    Impact: "Impatto",
    Project: "Progetto",
    Operational: "Operativo",
    Risk: "Rischio"
  };

  return labels[scenario];
}

function BlissMethodStrip() {
  return (
    <section className="bliss-method" aria-label="Metodo operativo in tre fasi">
      <article>
        <span>01</span>
        <div>
          <strong>Analizza</strong>
          <small>Legge il segnale (define)</small>
        </div>
      </article>
      <article>
        <span>02</span>
        <div>
          <strong>Interpreta</strong>
          <small>Trova causa e priorità (govern)</small>
        </div>
      </article>
      <article>
        <span>03</span>
        <div>
          <strong>Attiva</strong>
          <small>Genera task e workflow (make real)</small>
        </div>
      </article>
    </section>
  );
}

function IntroLanding({ onEnter, onPlayDemo }: { onEnter: () => void; onPlayDemo: () => void }) {
  return (
    <main className="intro-shell">
      <section className="intro-panel">
        <p className="intro-eyebrow">Demo portfolio · 60 secondi</p>
        <h1>SIGNAL</h1>
        <p className="intro-lead">
          Un sistema AI che legge segnali aziendali (numeri, documenti, reputazione, processi) e li trasforma in
          decisioni operative chiare.
        </p>

        <BlissMethodStrip />

        <div className="intro-grid">
          <article>
            <strong>Non è un CRM</strong>
            <span>È una demo di come progettare AI utile dentro i processi reali.</span>
          </article>
          <article>
            <strong>Cosa fa</strong>
            <span>Trova la causa, suggerisce l&apos;azione, simula l&apos;automazione.</span>
          </article>
          <article>
            <strong>Cosa vedrai</strong>
            <span>4 casi demo + pulsante che aggiorna tutto in tempo reale.</span>
          </article>
        </div>

        <div className="intro-actions">
          <button className="primary-action intro-cta" type="button" onClick={onEnter}>
            <Play size={17} />
            Apri la demo
          </button>
          <button className="secondary-action intro-cta" type="button" onClick={onPlayDemo}>
            <Sparkles size={17} />
            Riproduci demo
          </button>
        </div>

        <p className="intro-footnote">
          Progetto portfolio · linguaggio operativo allineato a define → govern → make real.
        </p>
      </section>
    </main>
  );
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
    name: `Segnale processo ${index}`,
    company: "Operations interne",
    email: `signal${index}@example.com`,
    status: "new",
    scenario: "Analysis",
    score: 52,
    priority: "Medium",
    tags: ["nuovo", "processo"],
    source: "Input manuale",
    value: "2,4h risparmiate/settimana",
    lastActivity: "Adesso",
    intent: "general_signal",
    sentiment: "Neutral",
    notes:
      "Nuovo segnale creato dal workspace SIGNAL. Analizzare il processo, stimare impatto e instradare allo stage corretto.",
    events: [
      {
        id: crypto.randomUUID(),
        type: "lead_created",
        title: "Segnale acquisito manualmente",
        description: "Un operatore ha aggiunto un segnale processo dalla demo.",
        timestamp: "Adesso"
      }
    ],
    tasks: [
      {
        id: crypto.randomUUID(),
        title: "Analizzare processo e confermare prossima azione",
        owner: "Sales",
        due: "Oggi",
        done: false
      }
    ],
    automationLogs: [
      {
        id: crypto.randomUUID(),
        workflow: "Intake segnale manuale",
        event: "lead_created",
        status: "success",
        timestamp: "Adesso",
        payload: "{ source: 'manual_process_input', stage: 'Analysis' }"
      }
    ]
  };
}

function scenarioToStatus(scenario: Scenario): LeadStatus {
  const map: Record<Scenario, LeadStatus> = {
    Analysis: "new",
    Impact: "qualified",
    Project: "onboarding",
    Operational: "active",
    Risk: "at_risk"
  };

  return map[scenario];
}

function decisionInsightsForLead(lead: Lead) {
  const insights: Record<
    string,
    { title: string; anomaly: string; cause: string; actions: string[] }
  > = {
    performance_anomaly: {
      title: "Cruscotto decisionale",
      anomaly: "Conversioni sotto il target mobile (-18%)",
      cause: "Pausa budget paid combinata con attrito sulla landing mobile",
      actions: [
        "Riattivare il budget acquisizione entro 24 ore",
        "Correggere il bounce della landing mobile sopra soglia critica",
        "Rivedere le performance del funnel email (settimana 3)"
      ]
    },
    knowledge_query: {
      title: "Knowledge base",
      anomaly: "Domanda cross-documento rilevata",
      cause: "La risposta dipende da contratti, procedure e policy HR",
      actions: [
        "Restituire risposta con fonte e score di confidenza",
        "Instradare query a bassa confidenza verso revisione umana",
        "Registrare domande ricorrenti per arricchire le FAQ"
      ]
    },
    reputation_risk: {
      title: "Monitor reputazione",
      anomaly: "Sentiment in calo sulle query di confronto competitor",
      cause: "Segnali deboli sui canali monitorati prima dell'escalation",
      actions: [
        "Preparare brief di risposta con proof point",
        "Confrontare narrativa competitor con posizionamento brand",
        "Pianificare alert executive se il sentiment peggiora"
      ]
    },
    process_automation: {
      title: "Automazione processo",
      anomaly: "Lavoro manuale sopra la soglia di efficienza",
      cause: "Task finance ricorrente ancora fuori dal workflow",
      actions: [
        "Mappare regole di gestione eccezioni",
        "Attivare workflow in produzione con tracking risparmio",
        "Assegnare owner per review settimanale automazione"
      ]
    }
  };

  return (
    insights[lead.intent] ?? {
      title: "Analisi operativa",
      anomaly: "Nuovo segnale aziendale da interpretare",
      cause: "Dati strutturati insufficienti per assegnare causa automatica",
      actions: [
        "Eseguire interpretazione AI sul segnale in ingresso",
        "Stimare impatto business prima di attivare workflow",
        "Assegnare owner per validazione manuale"
      ]
    }
  );
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
        title: `Stage operativo aggiornato a ${formatScenarioLabel(scenario)}`,
        description: "Operatore ha aggiornato lo stage dal workspace SIGNAL.",
        timestamp: "Adesso"
      },
      ...lead.events
    ],
    automationLogs: [
      {
        id: crypto.randomUUID(),
        workflow: "Override stage operativo",
        event: "scenario_changed",
        status: "success",
        timestamp: "Adesso",
        payload: `{ stage: '${scenario}', operator: 'demo_user' }`
      },
      ...lead.automationLogs
    ]
  };
}
