import { useState, useEffect, useRef } from "react";
import {
  User, FileText, Cog, Shield, Landmark, Check, ChevronRight, RotateCcw,
  Bot, Send, Upload, ClipboardList, HelpCircle, UserPlus, IdCard, MapPin,
  FileSpreadsheet, Building2, AlertTriangle, X, CheckCircle2, Circle,
  Network, MessageSquare, Trophy, CreditCard, PiggyBank, Wallet,
  Banknote, BadgeCheck, Scale, Search, TrendingUp, Receipt, Fingerprint,
} from "lucide-react";

/* ──────────────────────────────────────────────────────────────────────────
   LOS-to-Disbursement Agentic Platform — Interactive Demo
   Scenario PL-001: Salaried Employee · Approved Company (Rajesh Kumar)
   Reproduces the 5-stage workflow, 10-agent network, streaming reasoning
   log, deterministic underwriting math (rule-engine wrm-v1) and the
   rate-of-record fix (10.5% everywhere — legacy system showed 12% at
   disbursement, flagged REQ-FIX-001).
   ────────────────────────────────────────────────────────────────────────── */

// ───────────────────────────── Domain: rule engine (mirrors backend) ──────
const emi = (P, annualRate, months) => {
  const r = annualRate / 12 / 100;
  return Math.round((P * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
};
const TERMS = (() => {
  const loan = 500000, tenure = 36, rate = 10.5, income = 85000, obligations = 15000;
  const m = emi(loan, rate, tenure);
  const foir = Math.round(((m) / income) * 100);
  const dti = Math.round(((m + obligations) / income) * 100);
  return {
    loan, tenure, rate, income, obligations, emi: m,
    eligible: 600000, foir, dti, feePct: 1.5, fee: Math.round(loan * 0.015),
  };
})();

// ───────────────────────────── Workflow metadata ──────────────────────────
const STAGES = [
  { id: "RM_INTAKE", label: "RM Intake", icon: User, role: "Relationship Manager" },
  { id: "DOC_VERIFICATION", label: "Doc Verification", icon: FileText, role: "Relationship Manager" },
  { id: "LOAN_PROCESSING", label: "Loan Processing", icon: Cog, role: "Loan Officer" },
  { id: "UNDERWRITING", label: "Underwriting", icon: Shield, role: "Underwriter" },
  { id: "DISBURSEMENT", label: "Disbursement", icon: Landmark, role: "Disbursement Officer" },
];
const ROLES = ["Relationship Manager", "Loan Officer", "Underwriter", "Disbursement Officer"];
const ROLE_EMOJI = { "Relationship Manager": "🧡", "Loan Officer": "📘", "Underwriter": "🔵", "Disbursement Officer": "🟠" };

// ───────────────────────────── Agent network definition ───────────────────
const AGENTS = [
  { key: "KYC", name: "KYC Verification", desc: "Identity documents & details", icon: IdCard, tint: "bg-amber-50 text-amber-600", done: "✓ Verified" },
  { key: "INCOME", name: "Income Assessment", desc: "Income sources & stability", icon: Banknote, tint: "bg-emerald-50 text-emerald-600", done: "✓ Verified" },
  { key: "EXPENSE", name: "Expense Analysis", desc: "Spending patterns & DTI", icon: Receipt, tint: "bg-pink-50 text-pink-600", done: "✓ Verified" },
  { key: "CREDIT", name: "Credit Bureau", desc: "Credit history & score", icon: TrendingUp, tint: "bg-blue-50 text-blue-600", done: "✓ Verified" },
  { key: "DOC VERIFY", name: "Doc Verification", desc: "Document authenticity", icon: FileText, tint: "bg-cyan-50 text-cyan-600", done: "✓ Authentic" },
  { key: "RISK", name: "Risk Assessment", desc: "Risk score & red flags", icon: Shield, tint: "bg-rose-50 text-rose-600", done: "✓ Low Risk" },
  { key: "ELIGIBILITY", name: "Eligibility Calc", desc: "Loan eligibility & terms", icon: Scale, tint: "bg-purple-50 text-purple-600", done: "✓ Eligible" },
  { key: "EMPLOYMENT", name: "Employment Verify", desc: "Employer, tenure & stability", icon: Building2, tint: "bg-yellow-50 text-yellow-700", done: "✓ Verified" },
  { key: "FRAUD", name: "Fraud Detection", desc: "Identity fraud & patterns", icon: Fingerprint, tint: "bg-red-50 text-red-600", done: "✓ Clear" },
];
const CHECKPOINTS = ["Applicant", "Docs", "KYC", "Employment", "Income", "Expense", "Credit", "Risk", "Eligibility", "Final"];

// Scripted reasoning log (tag, text, kind) — mirrors screenshot transcripts
const LOG_SCRIPT = [
  ["SUPERVISOR", "Delegating to 9 specialist agents…", "info"],
  ["KYC", "KYC Agent initialized. Loading model context…", "info"],
  ["INCOME", "Income Agent initialized. Loading model context…", "info"],
  ["EMPLOYMENT", "Employment Verification Agent initialized…", "info"],
  ["KYC", "→ tool_call: get_loan_application()", "tool"],
  ["EXPENSE", "Expense Agent initialized. Loading model context…", "info"],
  ["EMPLOYMENT", "→ tool_call: get_loan_application()", "tool"],
  ["INCOME", "→ tool_call: get_loan_application()", "tool"],
  ["CREDIT", "Credit Agent initialized. Loading model context…", "info"],
  ["KYC", "✓ Aadhaar ****-****-7834 verified against UIDAI registry", "ok"],
  ["EMPLOYMENT", "✓ Infosys Limited — approved employer list, tenure stable", "ok"],
  ["DOC VERIFY", "✓ All documents verified as authentic", "ok"],
  ["INCOME", "Income assessment complete. Confidence: 95%", "ok"],
  ["RISK", "✓ Risk score within acceptable range", "ok"],
  ["CREDIT", "Credit assessment complete. Confidence: 93%", "ok"],
  ["FRAUD", "→ Running device fingerprint and IP geolocation analysis…", "tool"],
  ["ELIGIBILITY", "✓ Applicant eligible for requested amount", "ok"],
  ["FRAUD", "✓ No fraud indicators detected", "ok"],
  ["EXPENSE", "→ tool_call: save_expense_assessment()", "tool"],
  ["EXPENSE", "Expense assessment complete. Confidence: 92%", "ok"],
  ["SUPERVISOR", "All specialist agents complete. Synthesizing findings…", "info"],
  ["SUPERVISOR", "→ Aggregating confidence scores across 9 assessments…", "info"],
  ["SUPERVISOR", "→ Applying weighted risk model to combined findings…", "info"],
  ["SUPERVISOR", "→ tool_call: generate_lending_recommendation()", "tool"],
  ["SUPERVISOR", "Final recommendation: APPROVE", "final"],
];

// ───────────────────────────── Small UI atoms ─────────────────────────────
const Chip = ({ children, tone = "slate" }) => {
  const tones = {
    slate: "bg-slate-700/60 text-slate-100", green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700", blue: "bg-blue-100 text-blue-700",
  };
  return <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${tones[tone]}`}>{children}</span>;
};

const Field = ({ label, value, required, waiting }) => (
  <div>
    <div className="text-[11px] font-medium text-slate-500 mb-1">
      {label}{required && <span className="text-rose-500"> *</span>}
    </div>
    <div className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${
      waiting ? "border-amber-300 border-dashed bg-amber-50/40 text-slate-400 italic"
              : "border-emerald-300 bg-white text-slate-800"}`}>
      <span className="truncate">{waiting ? "Waiting for input…" : value}</span>
      {waiting
        ? <span className="text-amber-400 text-xs">⏳</span>
        : <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />}
    </div>
  </div>
);

const KV = ({ k, v, strong }) => (
  <div className="flex items-center justify-between py-1.5 text-sm">
    <span className="text-slate-500">{k}</span>
    <span className={`text-slate-800 ${strong ? "font-semibold" : ""}`}>{v}</span>
  </div>
);

// ───────────────────────────── Main app ───────────────────────────────────
export default function LosWorkflowDemo() {
  // workflow state
  const [stageIdx, setStageIdx] = useState(0);
  const [done, setDone] = useState([]); // ids of completed stages
  const [role, setRole] = useState("Relationship Manager");
  // stage 1
  const [chat, setChat] = useState([{ from: "agent", text: "Hello! I'm your AI intake assistant. I've loaded scenario PL-001: Salaried Employee – Approved Company and pre-filled the form with available data. You can tell me naturally, paste from a CRM, or upload documents — I'll extract everything automatically." }]);
  const [draft, setDraft] = useState("");
  // stage 3
  const [run, setRun] = useState("idle"); // idle | running | complete
  const [agentStates, setAgentStates] = useState({}); // key -> waiting|working|done
  const [log, setLog] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [findings, setFindings] = useState(0);
  const [checkpoint, setCheckpoint] = useState(1);
  const timers = useRef([]);
  const logEnd = useRef(null);
  // stage 4
  const [decision, setDecision] = useState(null);
  const [notes, setNotes] = useState("");
  // stage 5
  const [disbursed, setDisbursed] = useState(false);

  const stage = STAGES[stageIdx];
  const roleOk = role === stage.role;

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => () => clearTimers(), []);
  useEffect(() => { logEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [log]);

  const reset = () => {
    clearTimers();
    setStageIdx(0); setDone([]); setRole("Relationship Manager");
    setChat(chat.slice(0, 1)); setDraft("");
    setRun("idle"); setAgentStates({}); setLog([]); setElapsed(0);
    setActiveCount(0); setFindings(0); setCheckpoint(1);
    setDecision(null); setNotes(""); setDisbursed(false);
  };

  const advance = () => {
    const cur = STAGES[stageIdx];
    setDone((d) => [...d, cur.id]);
    const next = STAGES[stageIdx + 1];
    if (next) { setStageIdx(stageIdx + 1); setRole(next.role); } // demo auto-assumes next actor
  };

  // ── Stage-3 orchestration simulation ──
  const startAnalysis = () => {
    if (run !== "idle") return;
    setRun("running");
    const states = {}; AGENTS.forEach((a) => (states[a.key] = "waiting"));
    setAgentStates(states);
    // elapsed clock
    let t = 0;
    const tick = setInterval(() => { t += 1; setElapsed(t); if (t > 30) clearInterval(tick); }, 1000);
    timers.current.push(tick);
    // wave 1: all except eligibility (depends on income+expense+credit)
    const wave1 = AGENTS.filter((a) => a.key !== "ELIGIBILITY").map((a) => a.key);
    wave1.forEach((k, i) => timers.current.push(setTimeout(() => {
      setAgentStates((s) => ({ ...s, [k]: "working" }));
      setActiveCount((c) => Math.min(c + 1, 9));
    }, 400 + i * 250)));
    // stream log
    LOG_SCRIPT.forEach(([tag, text, kind], i) => timers.current.push(setTimeout(() => {
      setLog((l) => [...l, { tag, text, kind, ts: new Date().toLocaleTimeString("en-IN", { hour12: false }) }]);
      if (kind === "ok") setFindings((f) => f + 1);
      setCheckpoint((c) => Math.min(c + 0.4, CHECKPOINTS.length));
    }, 1200 + i * 650)));
    // agents complete progressively
    const completionOrder = ["KYC", "DOC VERIFY", "EMPLOYMENT", "INCOME", "RISK", "CREDIT", "FRAUD", "EXPENSE"];
    completionOrder.forEach((k, i) => timers.current.push(setTimeout(() => {
      setAgentStates((s) => ({ ...s, [k]: "done" }));
      setActiveCount((c) => Math.max(c - 1, 0));
    }, 6000 + i * 1100)));
    // eligibility runs after income+expense+credit
    timers.current.push(setTimeout(() => {
      setAgentStates((s) => ({ ...s, ELIGIBILITY: "working" })); setActiveCount((c) => c + 1);
    }, 10500));
    timers.current.push(setTimeout(() => {
      setAgentStates((s) => ({ ...s, ELIGIBILITY: "done" })); setActiveCount(0);
    }, 14500));
    // final
    timers.current.push(setTimeout(() => { setRun("complete"); setCheckpoint(CHECKPOINTS.length); }, 1200 + LOG_SCRIPT.length * 650 + 400));
  };

  const sendChat = () => {
    if (!draft.trim()) return;
    const q = draft.trim(); setDraft("");
    setChat((c) => [...c, { from: "user", text: q },
      { from: "agent", text: "Noted. I've parsed your message — remaining fields are Date of Birth, Email, Phone and Address (4 of 16). You can paste them here or proceed; Doc Verification can run with exceptions." }]);
  };

  // ───────────────────────────── Render helpers ───────────────────────────
  const Stepper = () => (
    <div className="flex items-center justify-center gap-1 py-3 px-4 bg-white border-b border-slate-200 overflow-x-auto">
      {STAGES.map((s, i) => {
        const isDone = done.includes(s.id);
        const isCur = i === stageIdx;
        const Icon = s.icon;
        return (
          <div key={s.id} className="flex items-center shrink-0">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
              isCur ? "bg-[#16325c] text-white shadow"
                    : isDone ? "bg-emerald-50 text-slate-700" : "text-slate-500"}`}>
              <Icon size={14} className={isDone && !isCur ? "text-emerald-600" : ""} />
              <span>{s.label}</span>
              <span className={`text-[10px] font-medium ${
                isCur ? "text-blue-200" : isDone ? "text-emerald-600" : "text-slate-400"}`}>
                {isCur ? "In Progress" : isDone ? "✓ Done" : "Pending"}
              </span>
            </div>
            {i < STAGES.length - 1 && <ChevronRight size={14} className="text-slate-300 mx-0.5" />}
          </div>
        );
      })}
    </div>
  );

  const RoleGate = () => roleOk ? null : (
    <div className="mx-6 mt-4 flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <span className="flex items-center gap-2"><AlertTriangle size={16} />
        This stage is actioned by the <b>{stage.role}</b>. You are viewing as {role} (read-only).</span>
      <button onClick={() => setRole(stage.role)}
        className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700">
        Switch to {stage.role}
      </button>
    </div>
  );

  // ───────────────────────────── Stage screens ────────────────────────────
  const StageIntake = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[540px]">
      {/* chat pane */}
      <div className="flex flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-blue-600 text-white grid place-items-center"><Bot size={18} /></div>
            <div>
              <div className="text-sm font-semibold text-slate-800">AI Intake Agent</div>
              <div className="text-xs text-slate-500">Conversational loan application assistant</div>
            </div>
          </div>
          <span className="flex items-center gap-1 text-xs text-emerald-600"><Circle size={8} className="fill-emerald-500 text-emerald-500" /> Active</span>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {chat.map((m, i) => (
            <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "gap-2"}`}>
              {m.from === "agent" && <div className="h-7 w-7 rounded-full bg-blue-600 text-white grid place-items-center shrink-0"><Bot size={14} /></div>}
              <div className={`max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
                m.from === "user" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}>{m.text}</div>
            </div>
          ))}
          <div className="flex flex-wrap gap-2 pt-1">
            {[["New applicant", UserPlus], ["Upload documents", Upload], ["Paste from CRM", ClipboardList], ["What's missing?", HelpCircle]].map(([t, I]) => (
              <button key={t} onClick={() => { setDraft(t); }}
                className="flex items-center gap-1.5 rounded-full border border-blue-200 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50">
                <I size={12} />{t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 border-t border-slate-100 p-3">
          <input value={draft} onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendChat()}
            placeholder="Tell me about the applicant, paste details, or ask a question…"
            className="flex-1 rounded-full border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400" />
          <button onClick={sendChat} className="h-9 w-9 rounded-full bg-blue-600 text-white grid place-items-center hover:bg-blue-700"><Send size={15} /></button>
        </div>
      </div>
      {/* form pane */}
      <div className="bg-slate-50">
        <div className="bg-[#16325c] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/15 grid place-items-center"><User size={18} /></div>
            <div>
              <div className="font-semibold">Rajesh Kumar</div>
              <div className="text-xs text-blue-200">Senior Software Engineer · Infosys Limited · Full-time</div>
              <div className="mt-1.5 flex gap-1.5">
                <Chip>₹10L income</Chip><Chip>₹5L loan</Chip><Chip>Salaried</Chip>
              </div>
            </div>
          </div>
          <div className="grid place-items-center h-12 w-12 rounded-full border-4 border-amber-400 bg-white text-[#16325c]">
            <div className="text-center leading-none"><div className="text-xs font-bold">75%</div><div className="text-[7px]">Complete</div></div>
          </div>
        </div>
        <div className="px-6 py-2 bg-white border-b border-slate-200 flex items-center gap-4 text-sm">
          <span className="text-blue-600 font-medium border-b-2 border-blue-600 pb-1.5 pt-1">Application <Chip tone="blue">12/16 fields</Chip></span>
          <span className="text-slate-400 pb-1.5 pt-1">Insights</span>
        </div>
        <div className="h-1 bg-emerald-500 w-3/4" />
        <div className="p-6 space-y-6 overflow-y-auto max-h-[420px]">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3"><User size={14} /> Applicant Information</div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Full Name" required value="Rajesh Kumar" />
              <Field label="Date of Birth" waiting />
              <Field label="Email" waiting />
              <Field label="Phone" waiting />
              <div className="col-span-2"><Field label="Address" waiting /></div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3"><Building2 size={14} /> Employment Details</div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Employer" required value="Infosys Limited" />
              <Field label="Job Title" value="Senior Software Engineer" />
              <Field label="Status" value="Full-time" />
              <Field label="Annual Income" required value="₹1,020,000" />
              <Field label="Applicant Category" required value="Salaried" />
              <Field label="NRI Status" value="No" />
              <Field label="Senior Citizen" value="No" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 bg-white px-6 py-3">
          <button className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">✎ Edit Manually</button>
          <button disabled={!roleOk} onClick={advance}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40">
            ⊕ Submit &amp; Proceed
          </button>
        </div>
      </div>
    </div>
  );

  const DOCS = [
    { name: "ID Proof", cat: "identity", icon: IdCard },
    { name: "Address Proof", cat: "address", icon: MapPin },
    { name: "Salary Slips", cat: "income", icon: FileSpreadsheet },
    { name: "Bank Statements", cat: "financial", icon: Landmark },
  ];
  const StageDocs = () => (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-0 min-h-[540px]">
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-700">Application Readiness</span>
          <div className="flex-1 h-2 rounded-full bg-slate-200"><div className="h-2 w-[2%] rounded-full bg-rose-500" /></div>
          <span className="text-sm font-bold text-rose-500">0%</span>
          <span className="text-[11px] text-slate-400">Identity: 0% · Income: 0% · Address: 0% · Financial: 0%</span>
        </div>
        <div className="space-y-2">
          {DOCS.map((d) => (
            <div key={d.name} className="flex items-center justify-between rounded-lg border border-dashed border-slate-300 bg-white px-4 py-3">
              <div className="flex items-center gap-3">
                <d.icon size={18} className="text-slate-400" />
                <div>
                  <div className="text-sm font-medium text-slate-700">{d.name}</div>
                  <div className="text-xs text-slate-400">{d.cat} · Not uploaded</div>
                </div>
              </div>
              <Chip tone="amber">Missing</Chip>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 mb-2"><Search size={14} /> Agent Recommendations</div>
          <ul className="space-y-1.5 text-[13px] text-slate-600">
            <li>⚠️ Expedite document collection to proceed with loan application processing.</li>
            <li>🏢 Verify employment details with Infosys Limited HR department.</li>
            <li>📈 Consider applicant's high credit score (780) during evaluation.</li>
            <li>🧮 Assess loan affordability based on declared monthly income of ₹85,000 and expenses of ₹15,000.</li>
          </ul>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">⟳ Re-run Verification</button>
          <button disabled={!roleOk} onClick={advance}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40">
            → Push to Loan Officer
          </button>
        </div>
        <p className="text-[11px] text-slate-400 text-right">Demo note: pushing with missing documents records an exception reason on the audit trail (BR-07).</p>
      </div>
      {/* verification results rail */}
      <div className="border-l border-slate-200 bg-white p-4 space-y-3 overflow-y-auto max-h-[600px]">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-700">🛡 Verification Agent Results</div>
          <Chip tone="green">Completed in 18.6s</Chip>
        </div>
        <div className="grid grid-cols-4 text-center text-xs">
          {[["All Checks", 8, "text-slate-700"], ["Issues", 7, "text-rose-600"], ["Passed", 0, "text-emerald-600"], ["Suggestions", 1, "text-amber-600"]].map(([k, v, c]) => (
            <div key={k} className="py-1"><div className={`font-bold text-base ${c}`}>{v}</div><div className="text-slate-400">{k}</div></div>
          ))}
        </div>
        <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 flex items-center justify-between text-xs">
          <span className="font-medium text-slate-700">Document Quality &amp; Clarity</span><Chip tone="amber">4 issues</Chip>
        </div>
        {DOCS.map((d) => (
          <div key={d.name} className="rounded-md border border-rose-200 bg-rose-50/70 p-3">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-700"><X size={13} className="text-rose-500" /> {d.name} Missing</div>
            <div className="text-xs text-slate-500 mt-1">The required {d.name} document has not been uploaded.</div>
            <button className="mt-2 rounded border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-600">Request Upload</button>
          </div>
        ))}
        <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2 flex items-center justify-between text-xs">
          <span className="font-medium text-slate-700">Identity &amp; Name Matching</span><Chip tone="amber">1 warning</Chip>
        </div>
        <div className="rounded-md border border-amber-200 bg-amber-50/70 p-3">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-700"><AlertTriangle size={13} className="text-amber-500" /> Identity Verification Pending</div>
          <div className="text-xs text-slate-500 mt-1">Unable to verify applicant's identity due to missing ID Proof.</div>
        </div>
      </div>
    </div>
  );

  const StageProcessing = () => (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-blue-600/20 pb-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800"><Cog size={18} /> Loan Processing — AI Agent Analysis</h2>
        <Chip tone="amber">📘 Loan Officer</Chip>
      </div>
      {/* KPI strip */}
      <div className="flex items-center gap-10 rounded-lg border border-slate-200 bg-white px-6 py-3">
        {[["AGENTS ACTIVE", <span key="a"><span className="text-blue-600">{activeCount}</span> / 9</span>],
          ["TIME ELAPSED", `00:${String(elapsed).padStart(2, "0")}`],
          ["FINDINGS", <span key="f"><span className="text-emerald-600">{findings} ✓</span> <span className="text-amber-500">0 ⚠</span></span>]].map(([k, v]) => (
          <div key={k}><div className="text-[10px] tracking-wide text-slate-400 font-semibold">{k}</div><div className="text-lg font-bold text-slate-800">{v}</div></div>
        ))}
        <div className="ml-auto text-xs text-slate-400">
          {run === "idle" ? "🕐 Waiting to start" : run === "running" ? "⟳ Processing…" : "✓ Analysis complete"}
        </div>
      </div>
      {/* checkpoint rail */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs">
        {CHECKPOINTS.map((c, i) => {
          const reached = i < Math.floor(checkpoint) || run === "complete";
          const active = i === Math.floor(checkpoint) && run === "running";
          return (
            <div key={c} className="flex items-center shrink-0">
              <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${
                reached ? "bg-emerald-50 text-emerald-700" : active ? "bg-blue-50 text-blue-600" : "text-slate-400"}`}>
                {reached ? <Check size={11} /> : <Circle size={9} />} {c}
              </span>
              {i < CHECKPOINTS.length - 1 && <span className="mx-1 text-slate-300">—</span>}
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_330px] gap-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800"><Network size={15} /> AI Agent Network (10 Agents)</div>
            {run === "idle" && (
              <button disabled={!roleOk} onClick={startAnalysis}
                className="rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-40">
                ▶ Start AI Agent Analysis
              </button>
            )}
            {run === "running" && <Chip tone="blue">⟳ Processing…</Chip>}
          </div>
          {/* supervisor */}
          <div className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
            run === "running" ? "border-blue-400 bg-blue-50/40" : run === "complete" ? "border-emerald-300 bg-emerald-50/40" : "border-slate-200 bg-slate-50"}`}>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-slate-200 grid place-items-center"><Network size={16} className="text-slate-600" /></div>
              <div>
                <div className="text-sm font-semibold text-slate-800">Supervisor Agent</div>
                <div className="text-xs text-slate-500">Orchestrates workflow, delegates to 9 specialists, synthesizes recommendation</div>
              </div>
            </div>
            <span className={`text-xs font-semibold ${run === "complete" ? "text-emerald-600" : run === "running" ? "text-blue-600" : "text-slate-400"}`}>
              {run === "complete" ? "Recommendation: APPROVE" : run === "running" ? "Orchestrating…" : "Waiting"}
            </span>
          </div>
          <div className="text-center text-[10px] tracking-wide text-slate-400">↓ DELEGATES TO SPECIALISTS</div>
          {/* specialist grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {AGENTS.map((a) => {
              const st = agentStates[a.key] || "waiting";
              return (
                <div key={a.key} className={`rounded-lg border p-4 text-center transition-all ${
                  st === "done" ? "border-emerald-300 bg-emerald-50/30"
                  : st === "working" ? "border-blue-400 bg-white shadow-sm animate-pulse"
                  : "border-slate-200 bg-white"}`}>
                  <div className={`mx-auto h-9 w-9 rounded-full grid place-items-center ${a.tint}`}><a.icon size={16} /></div>
                  <div className="mt-2 text-[13px] font-semibold text-slate-800">{a.name}</div>
                  <div className="text-[11px] text-slate-400">{a.desc}</div>
                  <div className={`mt-2 text-[11px] font-semibold ${
                    st === "done" ? "text-emerald-600" : st === "working" ? "text-blue-600" : "text-slate-400"}`}>
                    {st === "done" ? a.done : st === "working" ? "Analyzing…" : "Waiting"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* reasoning log */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 flex flex-col max-h-[620px]">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3"><MessageSquare size={14} className="text-amber-500" /> Real-time Reasoning Log</div>
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {log.length === 0 && (
              <div className="rounded border-l-4 border-blue-400 bg-blue-50/50 px-3 py-2 text-xs text-slate-500 italic">
                Waiting for Loan Officer to start AI analysis…
              </div>
            )}
            {log.map((e, i) => (
              <div key={i} className={`rounded border-l-4 px-3 py-1.5 text-[11px] leading-snug ${
                e.kind === "final" ? "border-emerald-500 bg-emerald-50 font-semibold"
                : e.kind === "ok" ? "border-emerald-300 bg-emerald-50/50"
                : e.kind === "tool" ? "border-blue-300 bg-blue-50/50" : "border-slate-200 bg-slate-50"}`}>
                <span className="text-slate-400">{e.ts}</span>{" "}
                <span className="font-bold text-blue-700">[{e.tag}]</span>{" "}
                <span className="text-slate-700">{e.text}</span>
              </div>
            ))}
            <div ref={logEnd} />
          </div>
        </div>
      </div>
      {/* footer actions */}
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
        <span className="text-xs text-slate-500">
          {run === "complete" ? "ℹ AI recommends: APPROVE. Review and proceed." : "ℹ AI recommendation will appear here once all agents complete analysis"}
        </span>
        <div className="flex gap-2">
          <button disabled={run !== "complete"} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 disabled:opacity-40 hover:bg-slate-50">⟳ Request Re-analysis</button>
          <button disabled={run !== "complete"} className="rounded-md border border-amber-400 px-3 py-2 text-xs font-medium text-amber-600 disabled:opacity-40 hover:bg-amber-50">⤴ Override &amp; Escalate</button>
          <button disabled={run !== "complete" || !roleOk} onClick={advance}
            className="rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-40">
            → Push to Underwriter
          </button>
        </div>
      </div>
    </div>
  );

  const StageUnderwriting = () => (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-blue-600/20 pb-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800"><Shield size={18} /> Underwriting Review</h2>
        <Chip tone="blue">🔵 Underwriter</Chip>
      </div>
      <div className="flex gap-5 text-sm border-b border-slate-200">
        {["Overview", "Assessment", "Documents", "Audit Logs"].map((t, i) => (
          <span key={t} className={`pb-2 ${i === 0 ? "text-blue-600 font-semibold border-b-2 border-blue-600" : "text-slate-400"}`}>{t}</span>
        ))}
        <span className="ml-auto text-xs text-emerald-600 pb-2">● Complete</span>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[200px_1fr_1fr_180px] gap-4">
        {/* applicant rail */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-center h-fit">
          <div className="mx-auto h-12 w-12 rounded-full bg-blue-600 text-white grid place-items-center font-bold">RK</div>
          <div className="mt-2 font-semibold text-slate-800">Rajesh Kumar</div>
          <div className="text-[11px] text-slate-400 mb-3">Personal Loan</div>
          {[["Loan Amount", "₹500,000"], ["Credit Score", "780"], ["Tenure", "36 months"], ["Monthly Income", "₹85,000"], ["Interest Rate", "10.5%"]].map(([k, v]) => (
            <div key={k} className="flex justify-between text-xs py-1 border-t border-slate-100"><span className="text-slate-400">{k}</span><span className="font-medium text-slate-700">{v}</span></div>
          ))}
        </div>
        {/* personal + bank relationship */}
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-700 mb-2">👤 Personal Information</div>
            <KV k="Full Name" v="Rajesh Kumar" /><KV k="PAN Number" v="ABCPK1234F" />
            <KV k="Aadhaar" v="****-****-7834" /><KV k="Date of Birth" v="N/A" />
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-700 mb-2">🏦 Bank Relationship <Chip tone="green">★ Existing Customer</Chip></div>
            <KV k="Customer Since" v="2018" /><KV k="Relationship Value" v="₹12,50,000" />
            <KV k="Customer Segment" v="Premium" /><KV k="NPS Score" v="72" />
          </div>
        </div>
        {/* employment + loan + products */}
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-700 mb-2">💼 Employment &amp; Loan</div>
            <KV k="Employer" v="Infosys Limited" /><KV k="Designation" v="Senior Software Engineer" />
            <KV k="Monthly Income" v="₹85,000" /><KV k="Product Type" v="Personal Loan" />
            <KV k="Loan Amount" v="₹500,000" strong /><KV k="Tenure" v="36 months" />
            <KV k="Credit Score" v="780" /><KV k="Existing Obligations" v="₹15,000/mo" />
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-700 mb-2">📦 Existing Products with Bank</div>
            {[[PiggyBank, "Savings Account", "Since 2018 · ₹3,25,000"], [Wallet, "Fixed Deposit", "Since 2020 · ₹5,00,000"], [CreditCard, "Credit Card", "Since 2019 · ₹42,000"]].map(([I, n, d]) => (
              <div key={n} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 mb-1.5">
                <div className="flex items-center gap-2"><I size={15} className="text-slate-500" /><div><div className="text-[13px] font-medium text-slate-700">{n}</div><div className="text-[11px] text-slate-400">{d}</div></div></div>
                <Chip tone="green">Active</Chip>
              </div>
            ))}
          </div>
        </div>
        {/* metrics rail */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 h-fit space-y-3 text-center">
          {[["ELIGIBLE AMOUNT", "₹6,00,000", "✓ Matches request", "text-emerald-600"],
            ["INTEREST RATE", "10.5%", "Standard rate", "text-emerald-600"],
            ["FOIR", `${TERMS.foir}%`, "Within limit", "text-emerald-600"],
            ["PROCESSING FEE", "1.5%", `₹${TERMS.fee.toLocaleString("en-IN")}`, "text-emerald-600"],
            ["DTI RATIO", `${TERMS.dti}%`, "Normal", "text-emerald-600"]].map(([k, v, s, c]) => (
            <div key={k}><div className="text-[10px] tracking-wide text-slate-400 font-semibold">{k}</div>
              <div className="text-xl font-bold text-slate-800">{v}</div><div className={`text-[11px] ${c}`}>{s}</div></div>
          ))}
        </div>
      </div>
      {/* decision */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="text-sm font-semibold text-slate-700 mb-3">📋 Underwriting Decision</div>
        <div className="flex gap-2 mb-4">
          {[["APPROVE", "Approve", BadgeCheck, "border-emerald-500 text-emerald-600 bg-emerald-50"],
            ["CONDITIONAL", "Conditional Approve", AlertTriangle, "border-amber-500 text-amber-600 bg-amber-50"],
            ["REJECT", "Reject", X, "border-rose-500 text-rose-600 bg-rose-50"]].map(([val, label, I, sel]) => (
            <button key={val} onClick={() => setDecision(val)} disabled={!roleOk}
              className={`flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
                decision === val ? sel : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
              <I size={15} /> {label}
            </button>
          ))}
        </div>
        <div className="text-xs font-medium text-slate-500 mb-1">Underwriter Notes{decision === "CONDITIONAL" && <span className="text-rose-500"> * required for conditional approval (BR-14)</span>}</div>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} disabled={!roleOk}
          placeholder="Add underwriting notes or conditions…"
          className="w-full rounded-md border border-slate-200 p-3 text-sm outline-none focus:border-blue-400 disabled:bg-slate-50" />
        <div className="flex justify-end pt-3">
          <button
            disabled={!roleOk || !decision || (decision === "CONDITIONAL" && !notes.trim())}
            onClick={() => { if (decision === "REJECT") { alert("Application moved to CLOSED_DECLINED (terminal state). Resetting demo."); reset(); } else advance(); }}
            className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40">
            → Submit Decision &amp; Move to Disbursement
          </button>
        </div>
      </div>
    </div>
  );

  const StageDisbursement = () => (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-blue-600/20 pb-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800"><Landmark size={18} /> Loan Disbursement</h2>
        <Chip tone="amber">🟠 Disbursement Officer</Chip>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="text-sm font-semibold text-slate-700 mb-4">📄 Disbursement Summary</div>
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4">
          {[["APPLICANT", "Rajesh Kumar"], ["LOAN AMOUNT", "₹500,000"], ["LOAN PURPOSE", "Personal Loan"], ["TERM", "36 months"],
            ["EST. MONTHLY EMI", `₹${TERMS.emi.toLocaleString("en-IN")}`], ["INTEREST RATE", `${TERMS.rate.toFixed(2)}%`],
            ["UNDERWRITING DECISION", decision === "CONDITIONAL" ? "Conditional" : "Approved"],
            ["UNDERWRITER NOTES", notes.trim() || "No additional notes."]].map(([k, v]) => (
            <div key={k}><div className="text-[10px] tracking-wide text-slate-400 font-semibold">{k}</div>
              <div className="text-sm font-bold text-slate-800 mt-1">{v}</div></div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-1.5 inline-block">
          ✓ Rate-of-record: EMI computed from the sanctioned 10.5% (REQ-FIX-001 — legacy system showed a mismatched 12.00% here).
        </p>
      </div>
      {!disbursed ? (
        <div className="flex justify-end">
          <button disabled={!roleOk} onClick={() => { setDisbursed(true); setDone((d) => [...d, "DISBURSEMENT"]); }}
            className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40">
            ☑ Confirm Disbursement
          </button>
        </div>
      ) : (
        <div className="rounded-xl bg-gradient-to-b from-[#1d3f6e] to-[#16325c] py-14 text-center text-white border-t-4 border-blue-400">
          <Trophy size={44} className="mx-auto text-blue-300" />
          <div className="mt-4 text-2xl font-bold">Loan Successfully Disbursed!</div>
          <div className="mt-1 text-sm text-blue-200">The loan has been processed through all stages of the origination workflow.</div>
          <div className="mt-4 text-xs text-blue-300">NEFT initiated · idempotency key recorded · audit event chained (BR-19)</div>
        </div>
      )}
    </div>
  );

  const SCREENS = [StageIntake, StageDocs, StageProcessing, StageUnderwriting, StageDisbursement];
  const screen = SCREENS[stageIdx]();

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      {/* top bar */}
      <div className="flex items-center justify-between bg-[#16325c] px-4 py-2.5 text-white">
        <div className="flex items-center gap-2">
          <span className="rounded bg-blue-500 px-2 py-0.5 text-xs font-bold">✳ LOS</span>
          <span className="text-sm font-semibold">Loan Origination System</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-blue-200">Role:</span>
          <select value={role} onChange={(e) => setRole(e.target.value)}
            className="rounded bg-[#24477e] px-2 py-1.5 text-xs outline-none border border-blue-700">
            {ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_EMOJI[r]} {r}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-blue-200">Scenario:</span>
          <span className="rounded bg-[#24477e] border border-blue-700 px-2 py-1.5">🟢 PL-001: Salaried Employee – Approved Company</span>
          <button onClick={reset} className="flex items-center gap-1 rounded border border-blue-400 px-2.5 py-1.5 hover:bg-blue-800">
            <RotateCcw size={11} /> Reset
          </button>
        </div>
      </div>
      {Stepper()}
      {RoleGate()}
      {screen}
      <div className="px-6 pb-6 pt-2 text-center text-[11px] text-slate-400">
        Demo build · deterministic rule engine wrm-v1 · EMI(₹5,00,000 @ {TERMS.rate}% / 36m) = ₹{TERMS.emi.toLocaleString("en-IN")} · FOIR {TERMS.foir}% · DTI {TERMS.dti}%
      </div>
    </div>
  );
}
