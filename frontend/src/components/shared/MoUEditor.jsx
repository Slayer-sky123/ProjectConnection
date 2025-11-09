// src/components/shared/MoUEditor.jsx
import { useEffect, useState } from "react";
import { Save, FileText, Signature } from "lucide-react";

const LBL = (t) => <div className="text-xs text-gray-600 mb-1">{t}</div>;

export default function MoUEditor({ mou, onSave, onSign, role }) {
  const [form, setForm] = useState(mou || {});
  useEffect(() => { setForm(mou || {}); }, [mou]);

  const change = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const save = () => onSave?.(form);

  return (
    <div className="rounded-2xl border p-5 bg-white">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold flex items-center gap-2"><FileText className="w-4 h-4" /> MoU</h4>
        <button onClick={save} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-white"
          style={{ background:"#145da0" }}>
          <Save className="w-4 h-4" /> Save Version
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <div>
          {LBL("Title")}
          <input className="border rounded px-3 py-2 w-full" value={form.title || ""} onChange={(e)=>change("title",e.target.value)} />
        </div>
        <div>
          {LBL("Effective From")}
          <input type="date" className="border rounded px-3 py-2 w-full"
            value={form.effectiveFrom ? new Date(form.effectiveFrom).toISOString().slice(0,10) : ""}
            onChange={(e)=>change("effectiveFrom", e.target.value ? new Date(e.target.value).toISOString() : null)} />
        </div>
        <div>
          {LBL("Duration (months)")}
          <input type="number" className="border rounded px-3 py-2 w-full" value={form.durationMonths || 36}
            onChange={(e)=>change("durationMonths", Number(e.target.value || 36))}/>
        </div>
        <div>
          {LBL("Representatives (Company)")}
          <input className="border rounded px-3 py-2 w-full"
            value={form.representatives?.company || ""}
            onChange={(e)=>change("representatives",{ ...(form.representatives || {}), company: e.target.value })}/>
        </div>
        <div>
          {LBL("Representatives (University)")}
          <input className="border rounded px-3 py-2 w-full"
            value={form.representatives?.university || ""}
            onChange={(e)=>change("representatives",{ ...(form.representatives || {}), university: e.target.value })}/>
        </div>

        <Textarea label="Objective" value={form.objective} onChange={(v)=>change("objective",v)} />
        <Textarea label="Scope (Company)" value={form.scopeCompany} onChange={(v)=>change("scopeCompany",v)} />
        <Textarea label="Scope (University)" value={form.scopeUniversity} onChange={(v)=>change("scopeUniversity",v)} />
        <Textarea label="Scope (Joint)" value={form.scopeJoint} onChange={(v)=>change("scopeJoint",v)} />
        <Textarea label="Benefits for Students" value={form.studentBenefits} onChange={(v)=>change("studentBenefits",v)} />
        <Textarea label="Operational Framework" value={form.framework} onChange={(v)=>change("framework",v)} />
        <Textarea label="Deliverables & KPIs" value={form.kpis} onChange={(v)=>change("kpis",v)} />
        <Textarea label="Legal / Administrative" value={form.legal} onChange={(v)=>change("legal",v)} />
      </div>

      <div className="mt-4 p-3 rounded-lg border bg-white/70">
        <div className="text-xs text-gray-600">Signatures</div>
        <div className="grid md:grid-cols-2 gap-4 mt-2">
          <SignatureBlock role="company" signed={mou?.signatures?.company} onSign={onSign} me={role==="company"} />
          <SignatureBlock role="university" signed={mou?.signatures?.university} onSign={onSign} me={role==="university"} />
        </div>
      </div>
    </div>
  );
}

function Textarea({ label, value, onChange }) {
  return (
    <div className="md:col-span-2">
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <textarea className="border rounded px-3 py-2 w-full" rows={3} value={value || ""} onChange={(e)=>onChange(e.target.value)} />
    </div>
  );
}

function SignatureBlock({ role, signed, onSign, me }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-sm font-semibold capitalize">{role}</div>
      {signed?.at ? (
        <div className="text-xs text-emerald-700 mt-1">
          Signed by {signed.name} ({signed.title}) on {new Date(signed.at).toLocaleString()}
        </div>
      ) : me ? (
        <SignForm role={role} onSign={onSign} />
      ) : (
        <div className="text-xs text-gray-500 mt-1">Pending</div>
      )}
    </div>
  );
}

function SignForm({ role, onSign }) {
  const [name,setName]=useState(""); const [title,setTitle]=useState("");
  return (
    <div className="mt-2 flex gap-2">
      <input className="border rounded px-2 py-1 text-sm flex-1" placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} />
      <input className="border rounded px-2 py-1 text-sm flex-1" placeholder="Title" value={title} onChange={(e)=>setTitle(e.target.value)} />
      <button onClick={()=>onSign?.(role,{name,title})} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded text-white" style={{ background:"#145da0" }}>
        <Signature className="w-3 h-3" /> Sign
      </button>
    </div>
  );
}
