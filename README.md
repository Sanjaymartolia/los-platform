# 🏦 Agentic LOS — Loan Origination to Disbursement Platform

> Production-grade, AI-agent-driven Loan Origination System (LOS) for personal loans —
> 5-stage workflow (RM Intake → Doc Verification → Loan Processing → Underwriting → Disbursement),
> a Supervisor + 9-specialist agent network with a live reasoning log, deterministic underwriting
> math, and bank-grade auditability. Reverse-engineered from a real LOS and re-specified to
> Tier-1-bank standards.

![tests](https://img.shields.io/badge/tests-11%2F11%20passing-brightgreen)
![typescript](https://img.shields.io/badge/TypeScript-5.x-blue)
![node](https://img.shields.io/badge/node-%E2%89%A520-339933)
![license](https://img.shields.io/badge/license-MIT-lightgrey)

---

## ✨ What this is

```
RM Intake ──▶ Doc Verification ──▶ Loan Processing ──▶ Underwriting ──▶ Disbursement
(AI intake     (Verification        (Supervisor + 9      (Human decision:   (Idempotent
 chat fills     agent: 8 checks      specialist agents,    Approve /          NEFT/RTGS
 a live form)   in ~18.6s)           streaming log)        Conditional /      payout)
                                                           Reject)
```

- 🤖 **10-agent network** — KYC, Income, Expense, Credit Bureau, Doc Verification, Risk,
  Eligibility, Employment, Fraud — orchestrated in dependency-aware waves by a Supervisor agent.
- 🧮 **Deterministic money math** — LLMs never do arithmetic. EMI/FOIR/DTI/eligibility/fees come
  from a versioned rule engine (`re-v1`); recommendations from a weighted risk model (`wrm-v1`)
  with hard overrides (fraud ⇒ ≤REFER, KYC fail ⇒ REJECT).
- 🧑‍⚖️ **Human-in-the-loop everywhere** — every stage transition is a human action with role gates
  (Relationship Manager → Loan Officer → Underwriter → Disbursement Officer).
- 🔐 **Bank-grade controls** — hash-chained append-only audit, Aadhaar tokenization (last-4 only),
  idempotent disbursement, maker-checker above ₹10L, single rate-of-record.
- ⚡ **Crash-safe by construction** — a dead agent yields a FAILED finding and the synthesis
  degrades to REFER. The system can never silently approve.

## 🚀 Quick start

```bash
git clone https://github.com/Sanjaymartolia/los-platform.git
cd los-platform

npm install
npm test                # 11/11 domain tests (vitest)
npm run typecheck       # strict TS

# Full dev stack: Postgres 16, Redis, Kafka, Temporal, Keycloak, ES, Grafana
docker compose -f infra/docker-compose.yml up
# web :3000 · api :4000 · temporal-ui :8080 · grafana :3001
```

Try the UI without any infra: open `frontend/src/app/workflow-demo.jsx` — a single-file React
replica of all five screens (role switcher, animated agent grid, streaming reasoning log).

## 📁 Repository layout

```
los-platform/
├── docs/                          # 15-doc design suite (start at 00)
│   ├── 00-system-design.md        #   master HLD: C4, decisions D-01…D-07, capacity model
│   ├── 01-reverse-engineering.md  #   screen-by-screen spec, BR-01…BR-20, state machine
│   ├── 02-brd.md · 03-frd.md · 04-nfr.md
│   ├── 05-architecture.md · 06-agents.md
│   ├── 07-data-model.md           #   ERD, 26-table dictionary, lifecycles
│   ├── 08-api-design.md           #   REST/GraphQL/WebSocket contracts
│   ├── 09-security-compliance.md  #   RBAC matrix, RBI/DPDP/PCI mapping, STRIDE
│   ├── 10-ui-design-system.md · 11-observability.md
│   └── 12-roadmap · 13-testing · 14-deployment
├── db/
│   └── schema.sql                 # PostgreSQL 16: triggers, CHECKs, hash-chained audit, seeds
├── backend/src/modules/
│   ├── underwriting/rule-engine.ts          # EMI/FOIR/DTI/eligibility/rate-card (re-v1)
│   ├── workflow/state-machine.ts            # command reducer + role gates
│   └── disbursement/disbursement.service.ts # idempotent confirm, rails, maker-checker
├── agents/graph/orchestrator.ts   # wave fan-out, dependencies, wrm-v1 synthesis
├── agents/prompts/                # versioned system prompts: intake, verification,
│                                  # supervisor, 9 specialists, disbursement/monitoring/compliance
├── api/openapi.yaml               # machine-readable command surface (OpenAPI 3.1)
├── frontend/src/app/workflow-demo.jsx       # interactive 5-stage UI replica
├── tests/domain.spec.ts           # golden numbers + safety invariants
├── infra/                         # docker-compose · Terraform (ap-south-1/EKS/RDS) · K8s+HPA
├── .github/workflows/ci.yml       # typecheck → tests (90% gate) → docker matrix → deploy
└── ops/runbooks.md                # RB-01…RB-05 incident runbooks
```

## 🧮 Golden numbers (scenario PL-001)

Verified by tests in `tests/domain.spec.ts`:

| Quantity | Value |
|---|---|
| Loan / tenure / credit score | ₹5,00,000 · 36 months · 780 |
| Rate (rate card) | **10.5%** "Standard" |
| EMI | **₹16,251** |
| FOIR | **18%** (limit 55%) |
| DTI | **35%** "Normal" |
| Eligible amount | **₹6,00,000** ✓ matches request |
| Processing fee | 1.5% = **₹7,500** |

> 🐛 The original system showed 12.00%/₹16,607 at disbursement vs 10.5% at underwriting.
> This rebuild enforces a single **rate-of-record** (REQ-FIX-001) with a guard metric that
> must stay at zero.

## 🛠 Tech stack

**Frontend** Next.js 15 · React 19 · TypeScript · Tailwind · shadcn/ui · TanStack Query · Zustand
**Backend** NestJS · REST (commands) + GraphQL (reads) + WebSocket (streams) · PostgreSQL 16 · Redis · Kafka · Elasticsearch
**Workflow & agents** Temporal (macro-workflow) · LangGraph (agent graph, inside Temporal activities) · Claude / OpenAI APIs
**Platform** Keycloak (OIDC+MFA) · Vault (tokenization) · S3 · OpenTelemetry · Prometheus · Grafana · Terraform · EKS

## 🧪 Tests

```bash
npm test
```

Covers: EMI math (both legacy 12% and rate-of-record 10.5%), full PL-001 term computation,
decision gating (conditional ⇒ notes required), the complete happy-path command sequence,
exception-reason enforcement, role enforcement, rejection terminality, wrm-v1 synthesis
(APPROVE @0.93 / KYC-fail ⇒ REJECT / fraud ⇒ REFER), and orchestrator crash-safety.

## 🗺 Where to start reading

1. `docs/00-system-design.md` — the 10-minute overview.
2. `docs/01-reverse-engineering.md` — what the original system does, rule by rule.
3. `backend/src/modules/underwriting/rule-engine.ts` + `tests/domain.spec.ts` — the money math.
4. `agents/graph/orchestrator.ts` + `docs/06-agents.md` — the agent network.
5. `db/schema.sql` — invariants live in the database, not just the code.

## 🤝 Contributing

- Branch from `main`, conventional commits (`feat:`, `fix:`, `docs:`).
- `npm run typecheck && npm test` must pass; CI gates coverage at 90% on domain packages.
- Rule/prompt changes require updating golden tests and the relevant doc in `docs/`.

## 📄 License

MIT — see `LICENSE`.
