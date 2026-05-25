# SIGNAL

Prototipo di **AI Operational Intelligence** che trasforma segnali aziendali sparsi in decisioni interpretate, azioni consigliate e automazioni di workflow.

- Repository: [github.com/Jockeys97/SIGNAL](https://github.com/Jockeys97/SIGNAL)
- Live demo: [jockeys97.github.io/SIGNAL](https://jockeys97.github.io/SIGNAL/)

SIGNAL è una demo portfolio: cruscotto decisionale, layer knowledge intelligence e cockpit automazioni. Mostra come le organizzazioni usano l’AI dentro le operations, non come strumento di marketing scollegato.

## Perché per agenzie AI-driven (es. Bliss)

- Narrativa **Analizza → Interpreta → Attiva**, allineata a *define → govern → make real*
- Focus su **causa radice e azione operativa**, non solo KPI
- Casi demo: anomalie performance, knowledge base, reputazione, automazione processi
- UI dark leggibile, coerente con agenzie premium (contrasto elevato, CTA bianche, accento rosa-arancio)
- Pronto a collegarsi a **n8n**, webhook e knowledge base reali (stati integrazione in Sistema)

## Cosa mostra

- Cruscotto decisionale su stage Analisi, Impatto, Progetto, Operativo, Rischio
- Interpretazione AI di segnali da dashboard, documenti, monitor mercato, audit processi
- Pannello causa/azioni per ogni tipo di segnale
- Pulsante **Riproduci demo** per walkthrough guidato
- Studio automazioni con template workflow
- Storico decisioni con log esecuzione (webhook-ready)
- Persistenza `localStorage` + API opzionale Express/SQLite

## Flusso demo

1. Apri la demo e clicca **Apri la demo** o **Riproduci demo**.
2. Seleziona un caso (es. *Conversion Drop*) o usa la riproduzione automatica.
3. Leggi anomalia, causa e azioni nel pannello decisionale.
4. Incolla un messaggio nel pannello AI e clicca **Analizza segnale**.
5. Osserva aggiornamento stage, task, cronologia e log.
6. Apri **Automazioni** e **Storico** per mostrare il layer operativo.

## Stack

- React, TypeScript, Vite, Lucide
- Express + SQLite (`node:sqlite`) opzionale
- Playwright (`npm run verify`)

## Architettura

```text
Segnale aziendale
  -> interprete AI locale (regole)
  -> aggiornamento stage operativo
  -> causa radice + azione consigliata
  -> task generato
  -> evento timeline
  -> log automazione
  -> localStorage o Express/SQLite
```

## Comandi

```bash
npm install
npm run dev
npm run build
npm run verify
```

Avvia il dev server prima di `npm run verify`. Lo script verifica intro, flusso AI, navigazione e layout desktop/mobile; salva screenshot in `artifacts/`.

## API locale

```bash
npm run setup:api
npm run dev:api
VITE_API_URL=http://127.0.0.1:8787 npm run dev
```

Endpoint: `GET /health`, `GET/POST/PATCH /api/leads`, classify, scenario, toggle task.

## Candidatura

Vedi [CANDIDATURA.md](./CANDIDATURA.md) per pitch, script demo 60 secondi e note colloquio.
