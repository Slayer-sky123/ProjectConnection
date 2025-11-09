import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Trash2, FileCheck2, ListChecks, LayoutList } from "lucide-react";
import API from "../../../api/axios";

export default function AssignTestModal({ open, onClose, application, onAssigned }) {
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState("assign"); // assign | templates | create

  // Assign
  const [basic, setBasic] = useState({
    type: "skill",
    title: "",
    skillId: "",
    durationMins: 30,
    startAt: "",
    endAt: "",
    batch: ""
  });
  const [skills, setSkills] = useState([]);

  // Templates
  const [templates, setTemplates] = useState([]);
  const [assign, setAssign] = useState({ templateId: "", dueAt: "" });

  // Create template
  const [form, setForm] = useState({
    title: "",
    durationMins: 20,
    negative: 0,
    shuffle: true,
    questions: [{ q: "", opts: ["", "", "", ""], ans: 0 }]
  });

  useEffect(() => {
    if (!open) return;
    setActiveTab("assign");
    setBusy(false);
    setBasic({ type: "skill", title: "", skillId: "", durationMins: 30, startAt: "", endAt: "", batch: "" });
    setAssign({ templateId: "", dueAt: "" });
    setForm({ title: "", durationMins: 20, negative: 0, shuffle: true, questions: [{ q: "", opts: ["", "", "", ""], ans: 0 }] });

    (async () => {
      try {
        const [t, s] = await Promise.all([API.get("/company/recruiter-tests/templates"), API.get("/admin/skills")]);
        setTemplates(t.data || []);
        setSkills(s.data || []);
      } catch {}
    })();
  }, [open]);

  const addQ = () => setForm((f) => ({ ...f, questions: [...f.questions, { q: "", opts: ["", "", "", ""], ans: 0 }] }));
  const delQ = (i) => setForm((f) => ({ ...f, questions: f.questions.filter((_, idx) => idx !== i) }));
  const setQ = (i, patch) => setForm((f) => { const qs = [...f.questions]; qs[i] = { ...qs[i], ...patch }; return { ...f, questions: qs }; });
  const setOpt = (i, j, val) => setForm((f) => { const qs = [...f.questions]; const o = [...qs[i].opts]; o[j] = val; qs[i] = { ...qs[i], opts: o }; return { ...f, questions: qs }; });

  const assignBasic = async () => {
    if (basic.type === "skill" && !basic.skillId) return alert("Pick a skill");
    if (!basic.durationMins) return alert("Duration required");
    setBusy(true);
    try {
      await API.post(`/company/applications/${application._id}/assign-test`, {
        type: basic.type,
        skillId: basic.type === "skill" ? basic.skillId : undefined,
        title: basic.title || undefined,
        durationMins: Number(basic.durationMins || 30),
        startAt: basic.startAt || null,
        endAt: basic.endAt || null,
        batch: basic.batch || null
      });
      onAssigned?.();
      onClose?.();
    } catch (e) {
      alert(e?.response?.data?.message || "Assign failed");
    } finally {
      setBusy(false);
    }
  };

  const createTemplate = async () => {
    if (!form.title.trim() || form.questions.some((q) => !q.q.trim() || q.opts.some((o) => !o.trim()))) {
      return alert("Fill title and all questions/options.");
    }
    setBusy(true);
    try {
      const payload = {
        title: form.title.trim(),
        durationMins: Number(form.durationMins || 20),
        negative: Number(form.negative || 0),
        shuffle: !!form.shuffle,
        questions: form.questions.map((q) => ({ text: q.q, options: q.opts, answerIndex: Number(q.ans || 0) }))
      };
      const res = await API.post("/company/recruiter-tests/templates", payload);
      setTemplates((t) => [res.data, ...t]);
      setAssign((a) => ({ ...a, templateId: res.data._id }));
      setActiveTab("templates");
    } catch (e) {
      alert(e?.response?.data?.message || "Create failed");
    } finally {
      setBusy(false);
    }
  };

  const assignTemplate = async () => {
    if (!assign.templateId) return alert("Choose a test template");
    setBusy(true);
    try {
      await API.post("/company/recruiter-tests/assign", {
        applicationId: application._id,
        templateId: assign.templateId,
        dueAt: assign.dueAt || null
      });
      onAssigned?.();
      onClose?.();
    } catch (e) {
      alert(e?.response?.data?.message || "Assign failed");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/50 grid place-items-center p-4">
      <div className="w-full max-w-5xl rounded-2xl overflow-hidden border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-2xl">
        {/* header */}
        <div className="px-5 py-4 border-b flex items-center justify-between bg-white/70 backdrop-blur">
          <div className="text-lg font-semibold">Assessment Center</div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        {/* tabs */}
        <div className="flex overflow-x-auto border-b bg-white/60">
          <TabBtn icon={<ListChecks size={14} />} label="Assign" active={activeTab === "assign"} onClick={() => setActiveTab("assign")} />
          <TabBtn icon={<FileCheck2 size={14} />} label="Templates" active={activeTab === "templates"} onClick={() => setActiveTab("templates")} />
          <TabBtn icon={<LayoutList size={14} />} label="Create Template" active={activeTab === "create"} onClick={() => setActiveTab("create")} />
        </div>

        {/* body */}
        <div className="p-6">
          {activeTab === "assign" && (
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-600">Type</label>
                <select value={basic.type} onChange={(e) => setBasic((f) => ({ ...f, type: e.target.value }))} className="w-full border rounded-xl px-3 py-2 bg-white">
                  <option value="skill">Skill</option>
                  <option value="aptitude">Aptitude</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-600">Title (optional)</label>
                <input value={basic.title} onChange={(e) => setBasic((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. DS&A (Basics)" className="w-full border rounded-xl px-3 py-2 bg-white" />
              </div>
              <div>
                <label className="text-xs text-slate-600">Batch (optional)</label>
                <input value={basic.batch} onChange={(e) => setBasic((f) => ({ ...f, batch: e.target.value }))} placeholder="Round-1 / Re-test / …" className="w-full border rounded-xl px-3 py-2 bg-white" />
              </div>

              {basic.type === "skill" && (
                <div className="md:col-span-3">
                  <label className="text-xs text-slate-600">Skill</label>
                  <select value={basic.skillId} onChange={(e) => setBasic((f) => ({ ...f, skillId: e.target.value }))} className="w-full border rounded-xl px-3 py-2 bg-white">
                    <option value="">— Select —</option>
                    {skills.map((s) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs text-slate-600">Duration (mins)</label>
                <input type="number" min={10} step={5} value={basic.durationMins} onChange={(e) => setBasic((f) => ({ ...f, durationMins: e.target.value }))} className="w-full border rounded-xl px-3 py-2 bg-white" />
              </div>
              <div>
                <label className="text-xs text-slate-600">Start At (optional)</label>
                <input type="datetime-local" value={basic.startAt} onChange={(e) => setBasic((f) => ({ ...f, startAt: e.target.value }))} className="w-full border rounded-xl px-3 py-2 bg-white" />
              </div>
              <div>
                <label className="text-xs text-slate-600">End At (optional)</label>
                <input type="datetime-local" value={basic.endAt} onChange={(e) => setBasic((f) => ({ ...f, endAt: e.target.value }))} className="w-full border rounded-xl px-3 py-2 bg-white" />
              </div>

              <div className="md:col-span-3 pt-1">
                <button onClick={assignBasic} disabled={busy} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
                  {busy ? "Assigning…" : "Assign"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "templates" && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-600">Template</label>
                <select value={assign.templateId} onChange={(e) => setAssign((a) => ({ ...a, templateId: e.target.value }))} className="w-full border rounded-xl px-3 py-2 bg-white">
                  <option value="">—</option>
                  {templates.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.title} • {t.questions?.length || 0} Qs • {t.durationMins} mins
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-600">Due (optional)</label>
                <input type="datetime-local" value={assign.dueAt} onChange={(e) => setAssign((a) => ({ ...a, dueAt: e.target.value }))} className="w-full border rounded-xl px-3 py-2 bg-white" />
              </div>
              <div className="md:col-span-2">
                <button onClick={assignTemplate} disabled={busy} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
                  {busy ? "Assigning…" : "Assign Template"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "create" && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-3">
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Template title" className="border rounded-xl px-3 py-2 bg-white" />
                <input type="number" min={5} value={form.durationMins} onChange={(e) => setForm((f) => ({ ...f, durationMins: e.target.value }))} className="border rounded-xl px-3 py-2 bg-white" placeholder="Duration (mins)" />
                <input type="number" step="0.25" value={form.negative} onChange={(e) => setForm((f) => ({ ...f, negative: e.target.value }))} className="border rounded-xl px-3 py-2 bg-white" placeholder="Negative Marking (0 = none)" />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.shuffle} onChange={(e) => setForm((f) => ({ ...f, shuffle: e.target.checked }))} />
                  Shuffle questions
                </label>
              </div>

              <div className="space-y-3">
                {form.questions.map((q, i) => (
                  <div key={i} className="border rounded-xl p-3 bg-slate-50/60">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm">Question {i + 1}</div>
                      <button onClick={() => delQ(i)} className="text-rose-600 text-xs inline-flex items-center gap-1">
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                    <textarea rows={2} value={q.q} onChange={(e) => setQ(i, { q: e.target.value })} placeholder="Question text" className="w-full mt-2 border rounded-xl px-3 py-2 bg-white" />
                    <div className="grid md:grid-cols-2 gap-2 mt-2">
                      {q.opts.map((o, j) => (
                        <input key={j} value={o} onChange={(e) => setOpt(i, j, e.target.value)} placeholder={`Option ${j + 1}`} className="border rounded-xl px-3 py-2 bg-white" />
                      ))}
                    </div>
                    <div className="mt-2">
                      <label className="text-xs text-slate-500">Correct Option</label>
                      <select value={q.ans} onChange={(e) => setQ(i, { ans: Number(e.target.value) })} className="ml-2 border rounded-lg px-2 py-1 text-sm">
                        {[0, 1, 2, 3].map((v) => (
                          <option key={v} value={v}>{v + 1}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <button onClick={addQ} className="px-3 py-2 rounded-xl border inline-flex items-center gap-2">
                  <Plus size={16} /> Add Question
                </button>
                <button onClick={createTemplate} disabled={busy} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
                  {busy ? "Creating…" : "Create Template"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function TabBtn({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm inline-flex items-center gap-2 ${active ? "border-b-2 border-blue-600 text-blue-700" : "text-slate-600 hover:text-slate-900"}`}
    >
      {icon} {label}
    </button>
  );
}
