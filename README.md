# Caseflow

Consistent, UX-correct case-management screens generated from a schema, plus a live map
showing exactly where cases get stuck and why.

## Why "Caseflow"

The source brief (see `product_spec_full.pdf`) is explicit that the product must not carry a
platform name — the Salesforce/FS case-management expertise behind it is the reason it knows
what to build, but it isn't the brand. The name should describe the outcome: clarity, structure,
and visible flow through a case pipeline. **Caseflow** does that — it names both halves of the
product (consistent case screens, and the flow/bottleneck map) without naming a platform. Treat
it as a working name; it's trivial to rename (one string in `client/index.html` and
`client/src/components/Layout.tsx`) if you land on something else.

## What's here

This is a working MVP scoped to the brief's Section 9 minimum viable build:

- **The rules engine** (`server/src/rulesEngine.js`) — option-count thresholds (2 → toggle,
  3–5 → radio, 6–20 → dropdown, 20+ → typeahead) plus the additional default rules (dates,
  yes/no, long text, small numeric ranges). This is enforced server-side; standard users cannot
  bypass it from the UI.
- **Schema-to-form generation** — Excel upload (`POST /api/schemas/excel`, primary path) and
  JSON import (`POST /api/schemas/json`, advanced/technical path), both producing a working,
  consistently-styled form automatically.
- **The expert override system** — gated to an `expert` role, requiring a Nielsen heuristic
  selection plus a research reference and a product justification before an override can save.
  Overridden fields show a "customised — see rationale" badge visible to everyone.
- **The triage map** — a visual case pathway with per-stage volume and wait time, a flag on the
  worst-performing stage, and a click-through panel explaining why (based on the illustrative
  example in the brief: an unassigned queue, not compliance review, is the real bottleneck).
- **Audit log** — every schema creation and every override, with who, when, and why.
- **Data & Security page** — the data-light architecture / "compliant by design now,
  certifiable later" posture from the brief, written out for users.

Beyond the MVP scope, there's also a **Phase 2 prototype: the AI Case Assistant**
(`client/src/pages/AgentWorkspacePage.tsx`) — a workspace for the frontline operational agent
(the "300+ calls/chats a day, juggling channels and guides" persona) rather than the PM/analyst
schema tool above. It summarises an incoming call/chat/email, suggests a case category, lays out
a next-best-task roadmap, flags fraud signals, and drafts replies in a chosen tone. See "Real AI"
below for wiring it to an actual model — it runs on a scripted local simulation by default.

## Architecture

- `server/` — Node.js + Express API. Data-light by design: it stores schema/form structures,
  override rationale, and audit records in a small JSON file (`server/data/store.json`,
  git-ignored, created and seeded automatically on first run) — never real customer or case
  records. The triage map's stage stats are clearly-labelled demo data, consistent with that
  same principle.
- `client/` — React + TypeScript + Tailwind CSS (Vite).
- Auth is a simple JWT login against two seeded demo accounts (standard user + expert). No SSO
  or formal certification in v1, matching the brief's scope for launch.

## Running it locally

```bash
# terminal 1 — API on :4000
cd server
npm install
npm run dev

# terminal 2 — web app on :5173 (proxies /api to :4000)
cd client
npm install
npm run dev
```

Open http://localhost:5173. Demo accounts (also shown on the login screen):

| Role     | Email                         | Password   |
|----------|--------------------------------|------------|
| Standard | `analyst@demo.caseflow.app`   | `demo1234` |
| Expert   | `expert@demo.caseflow.app`    | `demo1234` |

A demo schema ("Customer Case Intake", matching the brief's own Excel example) and a demo
triage pipeline (matching the brief's own bottleneck example) are seeded automatically the
first time the API starts.

### Uploading your own schema

**Excel** — one row per field, columns: `Field Name`, `Type` (`select` / `text` / `longtext` /
`date` / `boolean` / `number`), `Options Count`, `Required` (`Yes`/`No`), `Options List`
(comma-separated). This is exactly the table format in the brief's Section 5.

**JSON** — see the pre-filled example in the upload panel's JSON tab, or:

```json
{
  "name": "Complaint Handling",
  "fields": [
    { "fieldName": "Complaint Type", "type": "select", "optionsCount": 4, "required": true,
      "optionsList": ["Billing", "Service", "Product", "Other"] },
    { "fieldName": "Description", "type": "longtext", "required": true }
  ]
}
```

### Real AI (optional)

The AI Case Assistant's "Analyse with AI" and "Generate draft" actions call
`server/src/routes/ai.js`, which uses Claude (`claude-opus-5`) when the server has an API key,
and otherwise returns a 503 that the frontend catches automatically — falling back to
`client/src/lib/simulatedAI.ts` and showing a small notice + a "simulated" badge, so the app
always works with zero setup. To make it call a real model instead:

```bash
cd server
cp .env.example .env
# edit .env and set ANTHROPIC_API_KEY=sk-ant-... (get one at https://console.anthropic.com/settings/keys)
npm run dev   # restart if it was already running
```

No frontend changes needed — once the key is set, the same buttons call Claude and the badge
switches to "Claude Opus 5".

## Known limitations (deliberate, per the brief's v1 scope)

- No SSO, no SOC 2 / ISO 27001 certification, no formal vendor security questionnaires — the
  brief explicitly defers these until real enterprise demand justifies the cost.
- The triage map's case volume/wait-time figures are seeded demo data, not a live case-tracking
  integration — the brief's data-light architecture means Caseflow never ingests real case
  records.
- The `xlsx` (SheetJS) package used for `.xlsx` parsing has a known upstream advisory with no
  npm-published fix at the time of writing. The Excel upload endpoint is authenticated,
  size-limited (5MB), and only accessible to logged-in users; the JSON import path avoids this
  dependency entirely if you'd rather not exercise it.
