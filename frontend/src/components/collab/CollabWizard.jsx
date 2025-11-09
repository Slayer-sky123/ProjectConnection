import { useMemo, useState } from "react";
import { collab } from "../../api/collab";
import { Building2, GraduationCap, FileText, ShieldCheck } from "lucide-react";

const BRAND = { primary: "#145da0", dark: "#0c2d48", light: "#b1d4e0" };
const Card = ({ children }) => <div className="bg-white rounded-2xl border shadow-sm p-6" style={{ borderColor: BRAND.light }}>{children}</div>;

export default function CollabWizard({ onCreated }) {
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: "",
    counterpart: "", // username or email of the other side
    effectiveDate: new Date().toISOString().slice(0, 10),
    durationYears: 3,
    representatives: { company: "", university: "" },
    objectives: [
      "Bridge the industry–academia gap",
      "Offer internships, live projects, and placement opportunities",
      "Jointly develop curriculum modules aligned to industry needs",
      "Run AI-driven skill validation & career mapping",
      "Promote research, innovation projects, hackathons",
      "Enable FDPs and guest lectures",
    ],
    scope: {
      company: [
        "Provide internship & placement opportunities",
        "Conduct workshops, seminars, webinars",
        "Mentor real-world projects",
        "Share industry skill trends via StudentConnect",
        "Access verified university talent for hiring",
      ],
      university: [
        "Drive student participation on StudentConnect",
        "Nominate a University Coordinator",
        "Integrate soft & technical skills modules",
        "Provide infrastructure for training sessions",
      ],
      joint: [
        "Create annual collaboration calendar",
        "Organize Industry-Connect events & Placement Drives",
        "Share periodic job-readiness reports",
      ],
    },
    kpis: {
      internships: { planned: 20, actual: 0 },
      skillValidations: { planned: 200, actual: 0 },
      webinars: { planned: 10, actual: 0 },
      research: { planned: 2, actual: 0 },
    },
    officers: { company: { name: "", email: "" }, university: { name: "", email: "" } },
    legal: {
      nda: true, noLiability: true, termYears: 3, renewal: "Mutual consent",
      termination: "30-day notice by either party", jurisdiction: "",
    },
  });

  const canNext = useMemo(() => {
    if (step === 1) return form.title.trim() && form.counterpart.trim();
    if (step === 2) return form.representatives.company.trim() && form.representatives.university.trim();
    return true;
  }, [step, form]);

  const next = () => setStep((s) => Math.min(4, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  const submit = async () => {
    setBusy(true);
    const payload = {
      title: form.title.trim(),
      counterpart: form.counterpart.trim(),
      effectiveDate: form.effectiveDate,
      durationYears: Number(form.durationYears) || 3,
      representatives: form.representatives,
      objectives: form.objectives,
      scope: form.scope,
      kpis: form.kpis,
      officers: form.officers,
      legal: form.legal,
      summary: `${form.title} between company and university to drive internships, skill validation and research.`,
    };
    const created = await collab.start(payload);
    setBusy(false);
    if (created && created._id) onCreated?.(created);
  };

  return (
    <Card>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs px-2 py-1 rounded-full border" style={{ borderColor: BRAND.light, color: BRAND.dark }}>MoU Wizard</span>
        <h2 className="text-lg font-semibold" style={{ color: BRAND.dark }}>Create Collaboration / MoU</h2>
      </div>

      {step === 1 && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <label className="text-xs text-gray-600">Title</label>
            <input className="border rounded-lg px-3 py-2 w-full" style={{ borderColor: BRAND.light }}
                   placeholder="Industry-Academia Collaboration – 2025"
                   value={form.title}
                   onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-gray-600">Counterpart (University username or email)</label>
            <input className="border rounded-lg px-3 py-2 w-full" style={{ borderColor: BRAND.light }}
                   placeholder="xyz-university or dean@xyz.edu"
                   value={form.counterpart}
                   onChange={(e) => setForm({ ...form, counterpart: e.target.value })} />
          </div>

          <div>
            <label className="text-xs text-gray-600">Effective Date</label>
            <input type="date" className="border rounded-lg px-3 py-2 w-full" style={{ borderColor: BRAND.light }}
                   value={form.effectiveDate}
                   onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-gray-600">Duration (years)</label>
            <input type="number" min="1" className="border rounded-lg px-3 py-2 w-full" style={{ borderColor: BRAND.light }}
                   value={form.durationYears}
                   onChange={(e) => setForm({ ...form, durationYears: e.target.value })} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Section title="Representatives">
            <div className="grid sm:grid-cols-2 gap-3">
              <Input label="Company Signatory" value={form.representatives.company}
                     onChange={(v) => setForm({ ...form, representatives: { ...form.representatives, company: v } })} />
              <Input label="University Signatory" value={form.representatives.university}
                     onChange={(v) => setForm({ ...form, representatives: { ...form.representatives, university: v } })} />
            </div>
          </Section>

          <Section title="Nodal Officers">
            <div className="grid sm:grid-cols-2 gap-3">
              <Input label="Company Officer Name" value={form.officers.company.name}
                     onChange={(v) => setForm({ ...form, officers: { ...form.officers, company: { ...form.officers.company, name: v } } })} />
              <Input label="Company Officer Email" value={form.officers.company.email}
                     onChange={(v) => setForm({ ...form, officers: { ...form.officers, company: { ...form.officers.company, email: v } } })} />
              <Input label="University Officer Name" value={form.officers.university.name}
                     onChange={(v) => setForm({ ...form, officers: { ...form.officers, university: { ...form.officers.university, name: v } } })} />
              <Input label="University Officer Email" value={form.officers.university.email}
                     onChange={(v) => setForm({ ...form, officers: { ...form.officers, university: { ...form.officers.university, email: v } } })} />
            </div>
          </Section>
        </div>
      )}

      {step === 3 && (
        <div className="grid lg:grid-cols-3 gap-6">
          <Section title="Objectives">
            <Tags value={form.objectives} onChange={(arr) => setForm({ ...form, objectives: arr })} />
          </Section>
          <Section title="Scope – Company">
            <Tags value={form.scope.company} onChange={(arr) => setForm({ ...form, scope: { ...form.scope, company: arr } })} />
          </Section>
          <Section title="Scope – University">
            <Tags value={form.scope.university} onChange={(arr) => setForm({ ...form, scope: { ...form.scope, university: arr } })} />
          </Section>
          <Section title="Joint Responsibilities" className="lg:col-span-3">
            <Tags value={form.scope.joint} onChange={(arr) => setForm({ ...form, scope: { ...form.scope, joint: arr } })} />
          </Section>
        </div>
      )}

      {step === 4 && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Section title="KPIs & Deliverables">
            <div className="grid sm:grid-cols-2 gap-3">
              {["internships","skillValidations","webinars","research"].map((k) => (
                <div key={k} className="rounded-lg border p-3" style={{ borderColor: BRAND.light }}>
                  <div className="text-sm font-medium capitalize">{k}</div>
                  <div className="text-xs text-gray-600">Planned</div>
                  <input className="border rounded px-2 py-1 text-sm w-full mb-2"
                         style={{ borderColor: BRAND.light }}
                         type="number"
                         value={form.kpis[k].planned}
                         onChange={(e) => setForm({ ...form, kpis: { ...form.kpis, [k]: { ...form.kpis[k], planned: Number(e.target.value||0) } } })} />
                  <div className="text-xs text-gray-600">Actual (initially 0)</div>
                  <input disabled className="border rounded px-2 py-1 text-sm w-full opacity-60 bg-slate-50"
                         style={{ borderColor: BRAND.light }}
                         value={form.kpis[k].actual} readOnly />
                </div>
              ))}
            </div>
          </Section>

          <Section title="Legal / Clauses">
            <div className="space-y-2 text-sm">
              <Toggle label="Non-disclosure & confidentiality" checked={form.legal.nda}
                      onChange={(v) => setForm({ ...form, legal: { ...form.legal, nda: v } })} />
              <Toggle label="No financial liability unless mutually agreed" checked={form.legal.noLiability}
                      onChange={(v) => setForm({ ...form, legal: { ...form.legal, noLiability: v } })} />
              <div className="grid grid-cols-2 gap-2">
                <Input label="Term (years)" type="number" value={form.legal.termYears}
                       onChange={(v) => setForm({ ...form, legal: { ...form.legal, termYears: Number(v||0) } })} />
                <Input label="Renewal" value={form.legal.renewal}
                       onChange={(v) => setForm({ ...form, legal: { ...form.legal, renewal: v } })} />
              </div>
              <Input label="Termination clause" value={form.legal.termination}
                     onChange={(v) => setForm({ ...form, legal: { ...form.legal, termination: v } })} />
              <Input label="Jurisdiction" value={form.legal.jurisdiction}
                     onChange={(v) => setForm({ ...form, legal: { ...form.legal, jurisdiction: v } })} />
            </div>
          </Section>
        </div>
      )}

      {/* Nav */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-600">
          <FileText className="w-4 h-4" />
          <span className="text-sm">Step {step} of 4</span>
        </div>
        <div className="flex gap-2">
          {step > 1 && (
            <button className="px-4 py-2 rounded-lg border hover:bg-slate-50" onClick={back} style={{ borderColor: BRAND.light }}>
              Back
            </button>
          )}
          {step < 4 ? (
            <button disabled={!canNext} className="px-4 py-2 rounded-lg text-white disabled:opacity-60"
                    style={{ backgroundColor: BRAND.primary }}
                    onClick={next}>
              Continue
            </button>
          ) : (
            <button disabled={busy} className="px-4 py-2 rounded-lg text-white"
                    style={{ backgroundColor: BRAND.primary }}
                    onClick={submit}>
              {busy ? "Creating…" : "Create Collaboration"}
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

function Section({ title, children, className="" }) {
  const icon = title.toLowerCase().includes("legal") ? <ShieldCheck className="w-4 h-4" /> :
               title.toLowerCase().includes("representatives") ? <Building2 className="w-4 h-4" /> :
               title.toLowerCase().includes("officers") ? <GraduationCap className="w-4 h-4" /> :
               <FileText className="w-4 h-4" />;
  return (
    <div className={`rounded-xl border p-4 ${className}`} style={{ borderColor: "#b1d4e0" }}>
      <h4 className="font-semibold mb-3 flex items-center gap-2">{icon} {title}</h4>
      {children}
    </div>
  );
}
function Input({ label, value, onChange, type="text" }) {
  return (
    <div>
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <input type={type} className="border rounded-lg px-3 py-2 w-full" value={value}
             onChange={(e) => onChange?.(e.target.value)} style={{ borderColor: "#b1d4e0" }} />
    </div>
  );
}
function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange?.(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
function Tags({ value = [], onChange }) {
  const add = (e) => {
    e.preventDefault();
    const v = e.currentTarget.elements.namedItem("tag").value.trim();
    if (!v) return;
    onChange?.([...(value || []), v]);
    e.currentTarget.reset();
  };
  const remove = (x) => onChange?.((value || []).filter((t) => t !== x));
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {(value || []).map((t) => (
          <span key={t} className="text-xs px-2 py-1 rounded-full border" style={{ borderColor: "#b1d4e0", color: "#0c2d48" }}>
            {t} <button className="ml-1 text-gray-500" onClick={() => remove(t)}>×</button>
          </span>
        ))}
        {(!value || value.length === 0) && <span className="text-xs text-gray-500">Add items…</span>}
      </div>
      <form onSubmit={add} className="mt-2 flex gap-2">
        <input name="tag" className="border rounded-lg px-3 py-2 flex-1" style={{ borderColor: "#b1d4e0" }} placeholder="Type & press Enter" />
        <button className="px-3 py-2 rounded-lg border" style={{ borderColor: "#b1d4e0" }}>Add</button>
      </form>
    </div>
  );
}
