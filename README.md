# Rakshak AI

**Real-time scam and fraud detection for citizens, with a live command-center dashboard for law enforcement.**

Rakshak AI intervenes *during* an ongoing scam call or message — not after money has already moved. A citizen pastes or streams a suspicious call/text, the system classifies it in real time, and if it's high-risk, the case is instantly synced to an officer's dashboard for investigation — no manual reporting delay.

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [What Rakshak AI Does](#what-rakshak-ai-does)
- [System Architecture](#system-architecture)
- [Two Portals](#two-portals)
  - [1. Citizen Portal](#1-citizen-portal-user-facing)
  - [2. Admin / Officer Portal](#2-admin--officer-portal-command-center)
- [Tech Stack](#tech-stack)
- [Design System](#design-system)
- [Business Model](#business-model)
- [Known Limitations / Legal Guardrails](#known-limitations--legal-guardrails)
- [Setup & Deployment](#setup--deployment)

---

## Problem Statement

- ₹22,495 crore lost to cyber fraud in India in 2025 (24% YoY rise in cases)
- ₹19,000+ crore of that from digital arrest scams alone
- Only **6%** of stolen funds are ever recovered
- **51%** of victims never report the crime at all

Existing tools are reactive: bank fraud engines trigger *after* a transfer happens, and telecom caller-ID blockers only flag known numbers — neither can analyze what's actually being said on an active call to identify a coercion/impersonation scam in progress.

---

## What Rakshak AI Does

A four-stage real-time defense pipeline:

1. **Live Audio/Text Stream** — captures the call audio or screen text as it happens (OCR + audio capture)
2. **On-Device Edge Scan** — local, rule-based keyword matching for known scam phrases (e.g. "digital arrest," "CBI headquarters") — fast, private, works before anything hits the cloud
3. **Dual LLM Safety Net** — when local rules aren't conclusive, cloud-based contextual verification runs (classification + confidence scoring + category/pretext identification, e.g. "Digital Arrest — Law Enforcement Impersonation")
4. **Real-Time Block & Sync** — high-risk verdicts immediately sync to the officer/HQ dashboard as an active case, with alert status

This is visualized on the landing page as an **Adaptive Detection Pipeline**: Citizen Input → Edge Check (local embeddings, zero-latency block) → branches to Cloud LLM (deep audit) and HQ Registry (action plan).

---

## System Architecture

Four layers, following the flow of a single scam check from device to investigator:

```
CLIENT (BROWSER)          SERVERLESS API           DATA LAYER                INVESTIGATOR TOOLS
─────────────────         ───────────────           ──────────                ──────────────────
Rule-Based Red Flags       /api/classify             Firestore: citizenReports  Campaign Queue
Firebase Auth (SDK)        /api/advisory             Firestore: users           Evidence Verification
PDF Report Generator       /api/campaign-match       Firestore: evaluationResults  Priority Flagging
                           /api/campaign-list         Firestore: dailyStats      CSV Export
                           /api/username-lookup       Security Rules
                           /api/pulse-stats            (owner-scoped)
                           /api/telemetry
```

**Flow:** Client submits a suspicious transcript → Serverless API classifies it → result is written to Firestore → Investigator Tools (officer dashboard) read from Firestore in real time via `onSnapshot` listeners, powering the live Case Management and Threat Monitoring views.

**Security:** Firestore Security Rules gate access by custom auth claim (`request.auth.token.role == 'admin'`) — read access to `citizenReports` and related collections is restricted to authenticated admin roles, not just client-side checks.

---

## Two Portals

### 1. Citizen Portal (User-Facing)

The public-facing app any user can access:

- **Landing Page** — hero section with real fraud-loss statistics, a scroll-triggered animated walkthrough of how the detection pipeline works (step-by-step visual flow from call capture → verdict → dashboard sync), a short "How to use it" section (Sign up → Paste/record a suspicious call → Get instant verdict → Report if needed), and a minimal Terms & Conditions note linking to a full T&C page.
- **Live Check** — the core feature: paste or stream a transcript, get an instant AI verdict (risk level, category, reasoning) — this is the "explainable AI" differentiator, not a black-box score.
- **Account / Profile** — accessible via the username in the bottom navigation bar. Shows the details entered at signup (name, email, etc.) with a simple read-only profile view and a logout action.
- **Theme toggle** — light/dark mode, applied app-wide (nav bar, all pages), persisted across reloads, defaults to system preference if unset.
- **Report Generation** — hash-verified PDF report generation for a citizen's own submitted case.

### 2. Admin / Officer Portal (Command Center)

A single command-center dashboard with 10 sections in the sidebar, each pulling from real Firestore data (no hardcoded/placeholder numbers in the finished version):

| # | Section | Purpose |
|---|---------|---------|
| 1 | **Dashboard** | Aggregate overview — total cases (pending/active/closed breakdown), total registered users, high-risk cases today/this week, total financial recovery %, recent activity feed |
| 2 | **Case Management** | Full case list with a status-change workflow (Pending → Active → Closed/Completed) via the Manage modal; updates the real Firestore document via `/api/admin-update-case`; case moves to the correct filtered tab; syncs in real time to other admins viewing the same dashboard |
| 3 | **Officer Management** | Officer roster: name, designation/rank (Head Officer, Inspector, Officer), current status (On Duty / On Leave / Off Duty), assigned/closed case counts, average resolution time, recovery rate. Admins can update an officer's duty status from here. Backed by a dedicated `officers` Firestore collection. |
| 4 | **Criminal Network** | Tracks **scam campaigns/operators**, not citizen/victim data. Shows linked phone numbers/handles used in scam calls, campaign clusters, number of linked cases, and investigation status. |
| 5 | **AI Intelligence Center** | Real classifier output aggregated across all processed reports: verdict distribution (HIGH/MEDIUM/SAFE), most common red flags/patterns, model confidence score distribution |
| 6 | **Live Threat Monitoring** | Real-time (`onSnapshot`, not polling) stream of incoming reports the moment a citizen submits one — timestamp, threat level, session ID |
| 7 | **National Heatmap** | Aggregate report density/risk level by region or city only — never exact coordinates or per-user location, by design |
| 8 | **Evidence Management** | Redacted transcript snippets (phone/account/email/UPI redacted server-side), verdict, threat level, red flags, linked case ID |
| 9 | **Reports & Analytics** | Time-series charts: cases over time, resolution velocity, recovery totals, category breakdowns |
| 10 | **System Administration** | Registered users list (safe fields only — no credentials), system-level configuration |

**Real-time requirement:** the entire admin portal is designed to update live as citizens submit new transcripts on the user side — this depends on the Firestore permission rules being correctly scoped (see Architecture above); once fixed, `onSnapshot` propagates new/updated cases to the dashboard without manual refresh.

---

## Tech Stack

- **Frontend:** React, Tailwind CSS, Recharts (charts/graphs), Lucide (icons — no emojis anywhere in the UI)
- **Backend:** Vercel Serverless Functions (`/api/*`)
- **Database/Auth:** Firebase (Firestore + Firebase Auth SDK), custom claims for role-based access (`admin` role)
- **Hosting/Deploy:** Vercel
- **Typography:** Playfair Display (Google Font) applied globally across the entire app

**Local dev note:** use `vercel dev` (not plain `npm run dev`) when testing — `npm run dev` alone does not execute `/api` serverless functions, which causes a "(200) non-JSON response" error on any page that depends on API data.

---

## Design System

- **Font:** Playfair Display, applied to every heading, body text, button, nav item, and label — no mixed fonts
- **Icons:** Lucide only
- **Theme:** Full light/dark mode support, toggled app-wide (not just individual components), persisted across sessions, system-preference default
- **Visual style:** clean, data-dashboard aesthetic; charts/diagrams use straight-line connectors with clearly labeled, non-overlapping flow arrows (architecture diagrams follow strict anchor-point rules to avoid clutter); scroll-triggered animations on the landing page for the product-flow walkthrough and pipeline diagrams

---

## Business Model

Presented in-app under a **Business Impact** tab (not just a pitch deck slide — a live, working section of the actual product):

- **B2C (acquisition layer):** free citizen app — drives report volume
- **Network effect:** every citizen report strengthens Criminal Network / campaign detection for everyone
- **B2G (primary revenue layer):** the Officer/Command Center dashboard, licensed to state cybercrime cells — already built and demoable today, not a roadmap item
- **B2B (secondary/future):** potential fraud-pattern intelligence licensing to banks/fintechs

The Business Impact tab includes:
- A real, cited market-data hero section (loss/recovery statistics)
- A feature-to-business-outcome mapping (e.g. real-time sync → reduced investigation time)
- A TAM/SAM/SOM market-sizing visualization
- A 2×2 competitive positioning matrix (Reactive vs. Real-Time, Black-Box vs. Explainable AI) positioning Rakshak AI against legacy bank fraud engines, manual legal audits, and telecom caller-ID blockers
- A clearly-labeled **"Business Model & Financial Projections"** section for terms like CAC, LTV, Gross Margin — explicitly marked as projected/modeled figures, not live traction data, since the product is pre-launch

---

## Known Limitations / Legal Guardrails

- **No confirmed-criminal labeling.** Individuals are never displayed as "caught" or named "criminals" — the system tracks phone numbers/UPI handles/campaign identifiers with statuses like "Under Investigation" or "Reported to Cybercrime Cell." This avoids defamation risk, since case data comes from an AI classifier's confidence score, not judicial proof.
- **Citizen PII stays protected.** Criminal Network tracking is scoped to scam operators/campaigns only — never victim/citizen personal details (enforced via a `toSafeAdminCase` allowlist server-side).
- **No fabricated business metrics.** Live-sounding SaaS metrics (Churn, CAC, ARR, Burn Rate) are never presented as real traction pre-launch — they're explicitly labeled as projections. Runway/Burn Rate are omitted entirely rather than invented.
- **Location privacy.** The National Heatmap shows only regional/city-level aggregates, never exact coordinates or per-user location.

---

## Setup & Deployment

```bash
# Install dependencies
npm install

# Local development (required for /api routes to work)
vercel dev

# Deploy Firestore security rules
firebase login
firebase use <your-project-id>
firebase deploy --only firestore:rules

# Deploy to Vercel
vercel          # preview deploy
vercel --prod   # production deploy

# Push to GitHub (triggers auto-deploy if connected)
git add .
git commit -m "your message"
git push origin main
```

Environment variables (Firebase config, API keys) must be set directly in the Vercel project dashboard — they are not included in `git push`.

---

*Built for a hackathon submission — Rakshak AI is a citizen-reporting and triage tool designed to plug into existing state cybercrime cell workflows, not a system with independent law-enforcement authority.*