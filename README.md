# Rakshak AI — Digital Safety Shield

**A citizen fraud-detection platform combating India's digital arrest scam epidemic**

Built for ET AI Hackathon 2026

---

## Table of Contents

1. [Overview](#overview)
2. [The Problem](#the-problem)
3. [System Architecture](#system-architecture)
4. [Tech Stack](#tech-stack)
5. [Citizen Portal — Complete Feature List](#citizen-portal--complete-feature-list)
6. [Admin Portal — Complete Feature List](#admin-portal--complete-feature-list)
7. [End-to-End Workflow](#end-to-end-workflow)
8. [Classification Pipeline — Deep Dive](#classification-pipeline--deep-dive)
9. [Security & Privacy Design](#security--privacy-design)
10. [Business Model & Impact](#business-model--impact)
11. [Deployment](#deployment)
12. [Known Limitations & Next Steps](#known-limitations--next-steps)

---

## Overview

Rakshak AI is a full-stack, real-time fraud detection and cybercrime investigation
platform. It has two connected halves:

- A **citizen-facing app** where anyone can paste a suspicious call transcript, upload
  a screenshot, or describe an interaction, and get an instant, explainable risk
  verdict — before they lose money, not after.
- An **admin/officer command portal** where cybercrime cell investigators monitor
  incoming reports in real time, manage cases, track officer performance, and
  visualize how individual reports connect into organized scam campaigns.

The two halves are wired together live: the moment a citizen submits a report, it
appears on the admin dashboard — no refresh, no manual sync, no delay.

---

## The Problem

- India lost **₹22,495 crore** to cyber fraud in 2025 — a 24% year-on-year rise in
  reported cases (28.15 lakh incidents).
- **Digital arrest scams** alone drained over **₹19,000 crore** in 2025, making it
  one of the country's largest fraud categories by financial damage.
- Victims recover, on average, only **6%** of stolen funds.
- An estimated **51%** of victims never report the crime at all.
- Victims skew toward the elderly, retired professionals, and first-time digital
  users in Tier-2/3 cities — exactly the demographic least likely to recognize
  psychological manipulation tactics in real time.

Rakshak AI's core thesis: **intervene at the moment of contact**, when the
manipulation is happening, not after the money has already moved.

---

## System Architecture

```
                      ┌─────────────────────────────┐
                      │        CITIZEN PORTAL        │
                      │                              │
  Transcript / Voice / │  1. On-device MiniLM filter │
  Screenshot input ───▶│  2. Escalate if ambiguous   │
                      │  3. Cloud LLM classification │
                      │  4. Verdict + Category +     │
                      │     Reasoning + PDF Report    │
                      └───────────────┬──────────────┘
                                      │
                         Firestore (citizenReports)
                                      │
                         onSnapshot real-time sync
                                      │
                      ┌───────────────▼──────────────┐
                      │         ADMIN PORTAL          │
                      │      (RAKSHAK HQ Command)     │
                      │                              │
                      │  Dashboard · Case Management  │
                      │  Officer Management           │
                      │  Criminal Network (+ Graph)    │
                      │  AI Intelligence Center        │
                      │  Live Threat Monitoring         │
                      │  National Heatmap                │
                      │  Evidence Management               │
                      │  Reports & Analytics                │
                      │  System Administration                │
                      └──────────────────────────────────────┘
```

**Two-stage classification pipeline** (the core technical differentiator):

1. **Stage 1 — On-device pre-filter (MiniLM / Xenova all-MiniLM-L6-v2):**
   Runs entirely in the browser. Compares the transcript against reference scam
   phrase embeddings via cosine similarity, combined with red-flag keyword
   detection. Resolves clear-cut cases (obviously safe or obviously high-risk)
   instantly, with zero network round-trip and zero cost.

2. **Stage 2 — Cloud LLM escalation (Hugging Face, `openai/gpt-oss-120b:cerebras`):**
   Only triggered when Stage 1's confidence is genuinely ambiguous. Returns a
   structured verdict, a category from a fixed 14-item taxonomy, a plain-language
   explanation citing specific evidence from the transcript, and a calibrated
   confidence score.

3. **Async safety-net verification:** Even "instant" on-device verdicts (both
   SAFE and HIGH_RISK) are silently double-checked by the cloud LLM in the
   background. If the LLM disagrees, the UI updates seamlessly with the
   corrected verdict — giving users speed *and* a safety net against false
   negatives/positives.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | Vite + React 18 + TypeScript |
| Styling | Tailwind CSS v4 |
| Backend | Vercel Serverless Functions (Node.js) |
| Database | Firebase Firestore |
| Auth | Firebase Authentication (custom claims for admin role) |
| On-device ML | `@xenova/transformers` — `Xenova/all-MiniLM-L6-v2` |
| Cloud LLM (text) | Hugging Face Router — `openai/gpt-oss-120b:cerebras` |
| Cloud vision (image) | Google Gemini 2.5 Flash (`@google/genai`) |
| Graph visualization | `d3-force` + custom SVG rendering |
| Charts | Recharts |
| PDF generation | jsPDF |
| Icons | Lucide React (no emojis anywhere in the product) |

---

## Citizen Portal — Complete Feature List

### Authentication
- Email/username + password login and signup (Firebase Auth)
- Persistent user profile storage
- Profile section (via bottom-nav username) with account details and logout

### Live Check — Core Detection Flow
- Paste a suspicious call transcript, or describe what happened in free text
- **Live Simulated Call** — guided demo/practice mode
- **Record Voice** — voice input for hands-free reporting
- **Upload Screenshot** — drag-and-drop or file picker
  - **Image relevance detection (Gemini vision):** before any classification
    runs, the system checks whether the uploaded image is actually a relevant
    screenshot (chat app, bank app, call screen, payment request). If not, it
    tells the user plainly what it detected instead (e.g. "This looks like a
    photo of a tree, not a scam-related screenshot") instead of running a
    pointless analysis.
  - Relevant screenshots are auto-OCR'd/text-extracted and fed into the same
    classification pipeline as typed transcripts.

### Classification Output
- **Verdict:** HIGH_RISK / SAFE / UNCERTAIN
- **Confidence score:** dynamically calculated by the LLM (not fixed), reflecting
  genuine certainty — ambiguous cases score lower than blatant ones
- **Category:** one of a fixed 14-item taxonomy —
  - *Risk:* Digital Arrest / Law Enforcement Impersonation, Banking/OTP Fraud,
    Lottery/Prize Scam, Job Offer Scam, Investment/Crypto Fraud, Romance Scam,
    Tech Support Scam, Emergency/Medical Lure, Phishing/Malware, Other
    Financial Fraud
  - *Non-risk:* Legitimate Business Communication, Personal/Social
    Conversation, General Information Request, Unclear/Insufficient
    Information
- **Reasoning:** a 2–3 sentence plain-language explanation citing specific
  phrases/patterns from the transcript — never a bare score with no
  justification
- **Matched red-flag indicators:** each with the exact evidence quote, why it
  matters, and a severity rating (Low/Medium/High/Critical)
- **Degraded-mode banner:** if the cloud LLM times out (6-second cutoff), the
  UI clearly shows the verdict is a "quick check only" and advises independent
  verification, rather than silently presenting a lower-confidence result as
  if it were fully verified

### Reporting
- **Auto-generated PDF fraud report**, including:
  - Complaint reference ID and timestamp
  - Crime category and AI risk verdict with confidence %
  - Full incident transcript excerpt
  - Matched scam patterns with evidence, reasoning, and severity scores
  - Detected red-flag terms
  - An evidence checklist (screenshot saved, caller number saved, exact
    time/date noted, transaction ID saved, conversation preserved, caller not
    alerted)
  - **SHA-256 integrity hash** — deterministically generated from session
    data, so any tampering with the document is detectable
  - Recommended next steps: file at cybercrime.gov.in or call the national
    helpline 1930

### Other Sections (Left Sidebar)
- **How It Works** — plain-language explainer with animated architecture
  walkthrough
- **Trust & Transparency** — privacy and methodology disclosure
- **Business Impact** — a live, in-app data page (not a static slide) covering:
  - Real, cited market statistics (loss figures, recovery rates, underreporting)
  - Feature-to-business-outcome mapping
  - B2C → B2G → B2B go-to-market funnel with network-effect framing
  - TAM/SAM/SOM nested visualization
  - 2×2 competitive positioning matrix (Reactive vs. Real-time / Black-box vs.
    Explainable)
  - Financial model section explicitly labeled "Projected/Modeled" for
    CAC/LTV-style metrics — never presented as live traction data
- **About / Architecture** — system design diagram
- **Command Center** — investigator control panel (auth-gated)
- **Family Guardian** — manage trusted contacts for emergency alerts

### UI / UX
- **Five-language localization:** English, Hindi, Tamil, Kannada, Telugu
- **Dark mode / light mode toggle** — applies app-wide, persists across reloads
- **Collapsible sidebar** — expand/collapse toggle, independent of the admin
  portal's sidebar state
- **Scrolling announcement bar** at the top of the screen with rotating safety
  messaging and live telemetry-style captions
- **Scroll-triggered animated landing page** — a 4-step "How Rakshak AI
  Protects Citizens" walkthrough with animated flow connectors
- Consistent typography (Playfair Display) and Lucide iconography throughout —
  no emojis anywhere in the product
- Fully responsive layout

---

## Admin Portal — Complete Feature List

### Access & Security
- Dedicated entry point at **`/admin`** — not linked anywhere in the citizen
  navigation, so regular users never see or stumble into it
- Same Firebase `signInWithEmailAndPassword` flow as citizens, but gated by a
  **custom claim check** (`role === 'admin'`) verified via
  `getIdTokenResult(true)` (force-refreshed, never a stale cached token)
- Non-admin accounts attempting this login are immediately signed out with a
  clear rejection message — never left in a partially-authenticated state
- Fully separate **"RAKSHAK HQ Command Portal"** layout and sidebar, visually
  and structurally distinct from the citizen app
- Independently collapsible sidebar

### 1. Dashboard
Aggregate overview: total cases (pending/active/closed breakdown), registered
user count, high-risk cases this week, total financial recovery, and a recent
activity feed — all pulled from real Firestore data, no placeholder numbers.

### 2. Case Management
- Real case listing with search and status/threat-level filters
- **Manage modal:** change case status (Pending / Active / Closed), assign an
  officer, log a financial recovery percentage, record closure timestamp
- **Real-time sync** via Firestore `onSnapshot` — any admin viewing the
  dashboard sees status changes made by another admin instantly

### 3. Officer Management
- Officer roster: name, rank/designation, on-duty/leave status
- Performance metrics: active officers, total assigned cases, average
  resolution time, average recovery rate
- Backed by a dedicated `officers` Firestore collection

### 4. Criminal Network
- Tracks **scam campaigns and operators** — by phone number, UPI handle, and
  campaign/cluster ID — **never by asserted real name or "criminal" label**,
  to avoid defamation risk (the app has no arrest or judicial authority) and
  to keep victim identities completely out of this view
- Investigation status options: *Under Investigation*, *Reported to
  Cybercrime Cell*, *Case Closed* (deliberately avoids terms like "caught" or
  "at large," which would imply confirmed guilt)
- Officer case notes per campaign cluster
- **Toggle: List View / Interactive Graph View** (see below)

#### Fraud Network Graph Intelligence
An interactive, force-directed graph (built with `d3-force`) visualizing how
individual fraud reports connect through shared identifiers:

- **Node types:** Campaign, Report (victim case), Phone Number, UPI Handle,
  Bank Account, Device ID — each visually distinct by color and icon
- **Edges** connect reports to the identifiers they share, and identifiers to
  the campaigns they cluster into — revealing organized scam rings that a flat
  list view would hide
- **Every identifier is masked/redacted** before reaching the browser (e.g.
  `9876****21`, `pay***@okaxis`, `XXXX ****9012`) — raw PII is never
  transmitted or rendered, and node identity is additionally SHA-256 hashed
  server-side to prevent scraping
- **Click any node** to open a detail panel: risk score, first/last seen dates,
  linked identifier counts, an AI-generated plain-language campaign summary,
  assigned officer, and a direct link into the full Case Management view for
  that campaign's linked reports
- **Search bar** to filter/highlight nodes by phone, UPI, account, or campaign
  reference (matches only against masked representations, never raw values)
- Top stat bar: Total Nodes, Total Connections, Active Campaigns, Victim
  Reports, High-Risk Clusters — with real percentage-change tracking (shows
  no fabricated percentage when there's no historical baseline to compare
  against)

### 5. AI Intelligence Center
- Verdict distribution (HIGH_RISK / UNCERTAIN / SAFE) as live counts and
  percentages
- Top red-flag/pattern frequency ranking across all processed reports
- Confidence score distribution (bucketed histogram)
- On-device vs. cloud execution ratio (telemetry on how often Stage 1 alone
  resolves a case vs. escalating to Stage 2)

### 6. Live Threat Monitoring
Real-time (`onSnapshot`-based, not polling) streaming feed of incoming
citizen reports as they arrive, with timestamp, threat level, and session
reference.

### 7. National Heatmap
Aggregated report density and risk level **by region/city only** — exact
coordinates or per-user location data are never collected or displayed, by
design.

### 8. Evidence Management
Redacted transcript snippets for each report: phone numbers, bank/account
numbers, email addresses, and UPI IDs are automatically redacted server-side
(`[REDACTED_PHONE]`, `[REDACTED_ACCOUNT]`, etc.) before any officer views them,
alongside verdict, threat level, red flags detected, and the linked case ID.

### 9. Reports & Analytics
Time-series case trends, resolution velocity (average time from report to
closure), total financial recovery, and category/pattern breakdowns — all
computed from real aggregate data.

### 10. System Administration
- Registered user directory — name, email, registration date **only**; no
  passwords, auth tokens, or credential fields are ever exposed through any
  admin endpoint
- Platform system settings

---

## End-to-End Workflow

**A typical citizen journey:**

1. A citizen receives a suspicious call ("This is Officer Sharma from Cyber
   Crime Cell...") and opens Rakshak AI.
2. They paste the transcript (or describe it, or upload a screenshot) into
   Live Check.
3. If an image was uploaded, Gemini vision first confirms it's a relevant
   screenshot type before proceeding.
4. The on-device MiniLM filter runs instantly in the browser:
   - If clearly safe or clearly high-risk (based on calibrated thresholds and
     red-flag keyword matches), an instant verdict displays immediately.
   - If ambiguous, the transcript is sent to the cloud LLM for full analysis.
5. Regardless of path, an async background verification call to the LLM
   double-checks the verdict; if it disagrees, the card updates seamlessly.
6. The final verdict displays with: risk level, category, plain-language
   reasoning citing specific evidence, and a confidence score.
7. The citizen can generate a PDF report with a tamper-evident integrity hash,
   ready to file at cybercrime.gov.in or reference when calling 1930.
8. The report is written to Firestore (`citizenReports`).

**Simultaneously, on the admin side:**

9. The moment that report is written, a Firestore `onSnapshot` listener
   already active on the admin's **Live Threat Monitoring** and **Case
   Management** views fires — the new case appears instantly, with no manual
   refresh, no polling delay.
10. If the report shares a phone number, UPI handle, or bank account with any
    other report already in the system, it's automatically clustered into a
    campaign — visible immediately in **Criminal Network**'s graph view as a
    new connected node.
11. An assigned officer opens the case in **Case Management**, reviews the
    redacted evidence in **Evidence Management**, and updates the case status
    (Pending → Active → Closed) along with a recovery percentage once
    resolved.
12. That status change is itself synced in real time to any other admin
    viewing the dashboard.
13. Aggregate views (**Dashboard**, **AI Intelligence Center**, **Reports &
    Analytics**) update to reflect the new case in their running totals.

This closed loop — citizen reports in, officer acts, both sides see the same
live state — is the core "communication," not just detection, that the
platform is built around.

---

## Classification Pipeline — Deep Dive

### Calibrated dual-threshold logic (on-device)
- `MaxSimilarity < 0.25` **and** zero red-flag keyword matches → **Instant
  SAFE**
- `MaxSimilarity >= 0.50` **or** 2+ red-flag keyword matches → **Instant
  HIGH_RISK**
- Everything in between → **escalate to cloud LLM** for full analysis

These thresholds were empirically validated against a labeled transcript test
set spanning digital arrest scams, prize/lottery lures, banking phishing,
multilingual (Hindi/Hinglish) scam scripts, emergency/medical lures, and
legitimate/safe messages — and were revised at least once after testing
revealed a real coverage gap (emergency/medical-lure scams were initially
under-detected due to insufficient reference phrases for that pattern).

### Server-side category validation
The LLM is instructed to return exactly one of the 14 fixed taxonomy strings.
If it ever returns something outside that list (model drift), the backend
falls back to a safe default ("Other Financial Fraud" for risk verdicts,
"Unclear/Insufficient Information" for non-risk verdicts) rather than
displaying an unexpected raw string to the user.

### Resilience
- 6-second timeout on the cloud LLM call, with a graceful degraded-mode
  fallback (clearly flagged in the UI) rather than an indefinite hang or a
  silent, misleadingly confident result
- SHA-256 transcript-hash caching to avoid re-running full LLM analysis on
  identical or repeated submissions
- Gemini vision calls similarly wrapped with a timeout and fallback (local
  OCR text extraction) if the vision API is unavailable

---

## Security & Privacy Design

- **No password or credential fields are ever returned by any admin API
  endpoint** — every admin-facing response uses an explicit field allowlist,
  not a raw database dump
- **Firestore Security Rules** gate all admin-only collection reads behind
  `request.auth.token.role == 'admin'`, enforced server-side — not just a
  client-side UI check
- **PII redaction** is applied server-side wherever transcripts or identifiers
  reach an officer's screen — phone numbers, bank accounts, emails, and UPI
  handles are masked before transmission, never redacted only in the browser
- **Geographic data is aggregated**, never shown as exact per-user coordinates
- **Criminal Network avoids defamation risk** by tracking operators via
  identifiers and investigation status, never asserting confirmed guilt or
  publishing real names
- **Node identifiers in the Fraud Network Graph are SHA-256 hashed
  server-side**, in addition to visual masking, so raw values can't be
  scraped from the rendered graph
- **Test/seed data is explicitly tagged** (`isTestData: true`) and excluded
  from every aggregate query across the platform, so development/testing
  artifacts can never silently inflate real statistics shown to
  investigators or judges

---

## Business Model & Impact

- **B2C (citizen app):** free, functions as the acquisition layer — every
  report strengthens the Criminal Network detection for everyone (a genuine
  network effect: more reports in, smarter campaign clustering out)
- **B2G (primary revenue layer):** the Admin/Command Center — Case
  Management, Officer Performance tracking, Live Threat Monitoring, Criminal
  Network intelligence — is designed to plug into an existing state
  cybercrime cell's workflow. This is not a roadmap item; it is functional
  today.
- **B2B (secondary/future opportunity):** potential licensing of fraud-pattern
  intelligence to banks and fintechs

Financial projections (CAC, LTV, gross margin, etc.) are presented in-app
strictly as a **modeled framework**, explicitly labeled as such — not
disguised as live traction, since the product is pre-launch. This is a
deliberate credibility choice: an honest "we don't have live metrics yet, but
here's our thesis" holds up better under judge questioning than a fabricated
number would.

---

## Deployment

- **Frontend + serverless functions:** Vercel
- **Database:** Firebase Firestore
- **Auth:** Firebase Authentication
- Standard deployment flow:
  ```bash
  git add .
  git commit -m "..."
  git push origin main
  vercel --prod
  ```
- **Local development requires `vercel dev`**, not plain `vite`/`npm run dev`
  — the latter does not execute `/api/*` serverless functions, which will
  cause every admin data endpoint to fail locally with a non-JSON response
  error.
- Vercel's serverless function count is actively managed to stay within the
  Hobby plan's 12-function limit; several admin data endpoints are
  consolidated behind a single dispatcher function (`admin-insights.js`,
  selected via a `type` query parameter) rather than deployed as separate
  functions.

---

## Known Limitations & Next Steps

- **Bundle size:** the production JS bundle is large (~3.2 MB uncompressed)
  because admin and citizen code currently ship together. Code-splitting the
  admin bundle (e.g. `React.lazy()`) is a planned optimization, not yet done.
- **Serverless function budget:** currently near the Hobby-tier limit;
  scaling further will require either Vercel plan upgrades or continued
  endpoint consolidation.
- **No live user-traction metrics yet** — the product is pre-launch;
  financial/retention projections are explicitly modeled, not measured.
- **Officer/case data is currently demo-scale** — a real deployment would
  need integration with an actual state cybercrime cell's case management
  system rather than a standalone Firestore collection.

---

*This document reflects the full scope of Rakshak AI as built for ET AI
Hackathon 2026 — covering the citizen detection app, the admin/officer
command portal, the real-time synchronization between them, and the
underlying classification, security, and business architecture.*