# SIGNAL — materiale candidatura

## Pitch breve

SIGNAL è un prototipo di **AI Operational Intelligence**: un sistema che legge segnali operativi (performance, documenti, reputazione, processi), li interpreta con AI, individua cause e azioni, e attiva workflow misurabili.

Non è un CRM tradizionale. È una demo prodotto che mostra come unire **frontend moderno**, **logica AI**, **automazione workflow** e **pensiero decisionale** in un unico sistema operativo.

## Video demo (registrato)

- File locale: `artifacts/signal-demo-bliss.mp4` (~45 s, senza audio)
- Rigenerare: `npm run record:demo` (build + registrazione automatica del flusso)
- Per Bliss: carica il MP4 su Loom/Google Drive e incolla il link nella mail

## Demo consigliata (45–60 secondi)

1. Apri la live demo: https://jockeys97.github.io/SIGNAL/
2. Clicca **Apri la demo** oppure **Riproduci demo** (seleziona automaticamente *Conversion Drop*).
3. Mostra la striscia **Analizza → Interpreta → Attiva** (allineata al linguaggio define / govern / make real).
4. Leggi nel pannello destro: anomalia, causa radice, azioni consigliate.
5. Clicca **Analizza segnale** e mostra aggiornamento di stage, cronologia, task e log.
6. Apri **Automazioni** e **Storico** per mostrare l’integrazione operativa (n8n-ready).

### Messaggio da incollare nel pannello AI

```text
Le conversioni sono calate e il team non capisce da quale causa partire.
```

## Perché è rilevante per Bliss / agenzie AI-driven

- Parla il linguaggio **strategia → governance → operations** (define → govern → make real)
- Mostra **interpretazione del dato**, non solo visualizzazione
- Include concetti vicini a **AI visibility**, knowledge intelligence e reputation monitoring
- Dimostra capacità di costruire **prodotti demo credibili**, non solo slide o CRUD
- UI dark ad alta leggibilità, ispirata al design system Bliss (nero, bianco, accento rosa-arancio)

## Link

- GitHub: https://github.com/Jockeys97/SIGNAL
- Live: https://jockeys97.github.io/SIGNAL/

## Stack

React, TypeScript, Vite, Express (opzionale), SQLite locale, Playwright verify.

## Note tecniche per il colloquio

- La classificazione AI è **rule-based** in demo (motore locale dichiarato in Sistema).
- Persistenza: `localStorage` su GitHub Pages; API Express+SQLite in locale con `VITE_API_URL`.
- Il badge API mostra **API collegata** solo se `/health` risponde.
