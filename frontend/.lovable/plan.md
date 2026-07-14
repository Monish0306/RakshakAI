
# Suraksha Bharat — Digital Public Safety Intelligence Platform

Government-grade UI shell (no auth, no real AI, no Cloud) with realistic mock data across all pages. Both **Citizen Fraud Shield** and **LEA Command Centre** flows built to demo polish. Judge-ready in a single scroll-through.

## Design system

- **Palette:** white surfaces, `#0B2653` navy primary, `#1B3A6B` navy-2, `#F5F7FA` canvas, `#E4E8EF` borders, semantic red/amber/green/blue for risk states. No gradients on hero, no glass.
- **Type:** Inter (UI) + IBM Plex Sans (headings, government feel). Tight tracking, generous line-height.
- **Components:** shadcn/ui customized — square-ish 6px radius, thin 1px borders, muted shadows, dense data tables, government-style top bar with tricolor accent strip.
- **Motion:** restrained — 150ms fades, no bounce, no parallax.
- **Dark mode:** navy-black canvas with the same navy accent; toggle in top bar.
- **Accessibility:** WCAG AA tokens, "Grandparent Mode" (increased type + high contrast) global toggle, language switcher stub (EN/HI/+10).

## Sitemap (routes)

Public / citizen:
```
/                       Landing (dual-audience hero, stats ticker, trust markers)
/citizen                Citizen Protection Portal (shield home)
/citizen/analyze/chat   AI Conversation Analyzer
/citizen/analyze/voice  Voice Scam Analyzer
/citizen/analyze/image  Screenshot & OCR Analyzer
/citizen/analyze/currency  Counterfeit Currency Check
/citizen/cooling-off    Cooling-Off Safety Timer
/citizen/report         Guided NCRB Report Generator
/citizen/learn          Scam library + Grandparent Mode
```

Command Centre (LEA / bank / admin — role switcher in top bar, no real auth):
```
/command                 Threat Intelligence Dashboard (SOC home)
/command/investigations  Investigation Workspace (list + detail)
/command/network         Fraud Network Graph
/command/geo             Geospatial Crime Intelligence (map)
/command/currency        FICN Seizure Intelligence
/command/evidence        Evidence Vault
/command/reports         Court-Ready Report Generator
/command/analytics       Analytics Dashboard
/command/threat-feed     Threat Intelligence Feed
/command/audit           Audit Logs
/command/ai-health       AI Health Monitor & Pipeline
/command/admin           Admin (users, roles, agencies)
```

Cross-cutting:
```
/transparency            AI Transparency Center (model cards, explainability)
/privacy                 Privacy Center (on-device processing, data flow)
/status                  System Status Dashboard
/accessibility           Accessibility Center
/help                    Help & Support
/settings                Settings
/demo                    Guided Demo Mode (scripted walkthrough)
```

## Key screen details

- **Landing:** split panel — "For Citizens" / "For Law Enforcement", live counter of scams blocked (mocked), MHA / RBI / NCRB / CERT-In trust strip, 3 pillar cards (Detect · Disrupt · Respond), architecture teaser, footer with Govt-of-India-style signature.
- **Citizen Protection Portal:** 4 large action tiles (Chat / Voice / Screenshot / Currency), Trust Meter widget, recent checks, cooling-off timer CTA, emergency 1930 helpline banner.
- **Conversation Analyzer:** paste/upload chat → animated pipeline (Tokenize → Intent → Scam DNA → Verdict) → risk meter (0-100), Scam DNA chips (impersonation, urgency, payment demand), explainable-AI panel with highlighted evidence spans, "Why this verdict" accordion, actions (Block / Report / Save to Vault).
- **Voice Analyzer:** waveform, spoof/AI-voice probability, speaker traits, transcript with flagged phrases.
- **Screenshot & OCR:** drop zone, extracted text overlay, detected UPI IDs / phone numbers / URLs cross-checked against mocked blocklist.
- **Counterfeit Currency:** camera/upload frame with overlay guides, per-feature checks (microprint, security thread, serial pattern, UV sim) with pass/fail rows and confidence.
- **Cooling-Off Timer:** full-screen 10-minute timer with calming copy and "call a trusted contact" prompts.
- **Threat Intel Dashboard (SOC):** KPI strip, live incidents table, top scam scripts trending, campaigns heatmap, active digital-arrest sessions counter.
- **Investigation Workspace:** master-detail — case list left, tabbed detail (Overview · Timeline · Evidence · Network · Suspects · Notes · Report), Threat Timeline component.
- **Fraud Network Graph:** static SVG force-graph mock (nodes = accounts/numbers/devices/mules, edges color-coded), side panel with cluster stats.
- **Geospatial:** India map (react-simple-maps + GeoJSON) with district heat, seizure pins, hotspot ranking table.
- **Evidence Vault:** chain-of-custody table, hash column, viewer dialog, export.
- **Court-Ready Report Generator:** stepper → preview → "Download signed PDF" (mock).
- **AI Transparency Center:** model cards (name, purpose, training data summary, accuracy, false-positive rate, last audit), decision-explainer demo, bias & fairness notes.
- **Privacy Center:** "On-device processing" diagram, data-flow visualizer, data-retention matrix, DPDP Act alignment.
- **AI Health Monitor:** per-model latency/accuracy sparklines, drift indicators, pipeline DAG visualization.
- **Status Dashboard:** service uptime tiles, incident history.
- **Audit Logs:** filterable table with actor / action / resource / hash.
- **Admin:** users, role matrix (Citizen · LEA · Bank · Admin), agency onboarding.
- **Every page** has: empty, loading (skeletons), error, success states; keyboard nav; mobile layout.

## Component inventory (shared)

TopBar (with tricolor strip + role switcher + lang + Grandparent Mode + dark mode), SideNav (context-aware: citizen vs command), KpiCard, RiskMeter, TrustMeter, ScamDnaChips, PipelineVisualizer, EvidenceCard, TimelineItem, NetworkGraph, IndiaMap, DataTable, FilterBar, StatusPill, ConfidenceBar, ModelCard, AuditRow, EmptyState, ErrorState, LoadingSkeleton, ConfirmDialog, ExportDialog, CoolingOffTimer, LanguagePicker, Footer (govt signature).

## Technical

- **Stack:** existing TanStack Start + Tailwind v4 + shadcn. No backend, no auth.
- **State:** TanStack Query with local mock fetchers (in `src/lib/mock/*.ts`) returning realistic Indian data (states, districts, UPI handles, phone patterns, IFSC, scripts in EN/HI).
- **Routing:** file-based under `src/routes/`; `_citizen.tsx` and `_command.tsx` pathless layouts for the two shells; both mount under root.
- **Charts:** Recharts. **Graph:** hand-rolled SVG (avoids heavy deps). **Map:** react-simple-maps + India TopoJSON.
- **Design tokens:** defined in `src/styles.css` @theme (navy scale, risk semantics, radii, shadows). Fonts loaded via `<link>` in `__root.tsx`.
- **SEO / head:** each route sets its own title + description + og.
- **Performance:** route-level code split (automatic), skeletons on all data views.
- **A11y:** semantic landmarks, single `<main>`, focus rings, aria-labels on icon buttons, Grandparent Mode toggles a `.senior` class scaling type and contrast.
- **Demo Mode:** `/demo` drives a scripted tour with a floating "Next" pill highlighting elements across pages.

## Build phases

1. Design tokens, TopBar/SideNav shells, landing, both dashboards skeleton.
2. Citizen analyzers (chat, voice, image, currency) + cooling-off + report.
3. Command: investigations, network graph, geo map, evidence vault, court reports.
4. Cross-cutting: Transparency, Privacy, AI Health, Status, Audit, Admin, Settings, Help, Accessibility, Demo Mode.
5. Empty/loading/error polish, dark mode, mobile pass, a11y sweep.

## Out of scope for v1 (called out honestly)

Real auth / roles, real AI inference, real OCR/ASR, Cloud/DB, PDF signing, WhatsApp/IVR channels, real MHA/NCRB integration. All mocked with realistic fixtures; every mock is clearly labelled in `/transparency` and `/demo`.

Approve to start Phase 1.
