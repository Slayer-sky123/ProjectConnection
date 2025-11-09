// src/pages/admin/AssessmentsAptitude.jsx
import { useEffect, useMemo, useState } from "react";
import API from "../../api/axios";

/* palette */
const COLORS = {
  brand: "#F29F67",
  ink: "#1E1E2C",
  info: "#3B8FF3",
  teal: "#34B1AA",
  gold: "#E0B50F",
};

const I = {
  Plus: (p) => (<svg viewBox="0 0 24 24" width="18" height="18" {...p}><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>),
  Edit: (p) => (<svg viewBox="0 0 24 24" width="18" height="18" {...p}><path d="M4 21h4l11-11a2.5 2.5 0 10-3.5-3.5L4.5 17.5V21z" fill="none" stroke="currentColor" strokeWidth="2"/></svg>),
  Save: (p) => (<svg viewBox="0 0 24 24" width="18" height="18" {...p}><path d="M7 3h10l4 4v14H3V3h4z" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M7 3v6h10V3" stroke="currentColor" strokeWidth="2" fill="none"/></svg>),
  Trash: (p) => (<svg viewBox="0 0 24 24" width="18" height="18" {...p}><path d="M3 6h18M8 6v14h8V6M10 6V4h4v2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>),
  Refresh: (p) => (<svg viewBox="0 0 24 24" width="18" height="18" {...p}><path d="M20 12a8 8 0 10-2.34 5.66" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M20 8v4h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>),
  Search: (p) => (<svg viewBox="0 0 24 24" width="18" height="18" {...p}><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>),
  Download: (p) => (<svg viewBox="0 0 24 24" width="18" height="18" {...p}><path d="M12 4v12M8 12l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none"/><rect x="4" y="18" width="16" height="2" rx="1" fill="currentColor"/></svg>),
  Upload: (p) => (<svg viewBox="0 0 24 24" width="18" height="18" {...p}><path d="M12 16V4M8 8l4-4 4 4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/><rect x="4" y="16" width="16" height="4" rx="1.5" stroke="currentColor" strokeWidth="2" fill="none"/></svg>),
  Close: (p) => (<svg viewBox="0 0 24 24" width="18" height="18" {...p}><path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>),
};

const Card = ({ children, className = "" }) => (
  <div className={"rounded-2xl border bg-white/80 shadow-sm hover:shadow-md transition-shadow " + className} style={{ borderColor: "#E6E6E9" }}>
    {children}
  </div>
);
const SectionTitle = ({ title, hint, right }) => (
  <div className="flex items-center justify-between mb-4">
    <div>
      <div className="text-[13px] uppercase tracking-wide" style={{ color: COLORS.ink, opacity: 0.5 }}>{hint}</div>
      <h3 className="text-lg font-semibold" style={{ color: COLORS.ink }}>{title}</h3>
    </div>
    <div className="flex gap-2">{right}</div>
  </div>
);
const IconBtn = ({ title, onClick, variant = "ghost", disabled, children }) => {
  const map = {
    ghost:  { classes: "bg-white border", style: { color: COLORS.ink, borderColor: "#E6E6E9" } },
    primary:{ classes: "text-white border", style: { background: COLORS.brand, borderColor: COLORS.brand } },
    danger: { classes: "border", style: { color: "#B42318", borderColor: "#FEE4E2", background: "#FEF3F2" } },
    success:{ classes: "text-white border", style: { background: COLORS.teal, borderColor: COLORS.teal } },
  };
  const m = map[variant] || map.ghost;
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`h-9 w-9 grid place-items-center rounded-xl text-sm transition ${m.classes} ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      style={m.style}
    >
      {children}
    </button>
  );
};
const Input = (props) => (
  <input {...props} className="w-full rounded-xl border bg-white px-3 py-2 text-[14px] focus:outline-none focus:ring-2" style={{ borderColor: "#E6E6E9" }}/>
);
const Select = (props) => (
  <select {...props} className="w-full rounded-xl border bg-white px-3 py-2 text-[14px] focus:outline-none focus:ring-2" style={{ borderColor: "#E6E6E9" }}/>
);
const Empty = ({ children }) => (
  <div className="text-sm rounded-xl px-4 py-3" style={{ background: "#F7F7FA", border: "1px solid #E6E6E9", color: COLORS.ink, opacity: 0.7 }}>
    {children}
  </div>
);

/* =============================== CSV helper =============================== */
function parseCSVText(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  const pushCell = () => {
    let v = cell;
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    v = v.replace(/""/g, '"').trim();
    row.push(v);
    cell = "";
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        pushCell();
      } else if (ch === "\n") {
        pushCell();
        if (row.length && row.some(c => c.length)) rows.push(row);
        row = [];
      } else if (ch === "\r") {
        // ignore
      } else {
        cell += ch;
      }
    }
  }
  pushCell();
  if (row.length && row.some(c => c.length)) rows.push(row);
  return rows;
}

/* =============================== Component =============================== */
export default function AssessmentsAptitude() {
  const [aptConfig, setAptConfig] = useState({ durationMinutes: 20, updatedAt: null });
  const [aptQuestions, setAptQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qSearch, setQSearch] = useState("");
  const [qDraft, setQDraft] = useState({ _id: "", question: "", options: ["", "", "", ""], answer: "" });

  const [csvFile, setCsvFile] = useState(null);
  const [bulkLog, setBulkLog] = useState([]);
  const [busy, setBusy] = useState(false);
  const appendLog = (s) => setBulkLog((l) => [...l, s]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const cfg = await API.get("/admin/aptitude/config");
      setAptConfig(cfg.data || { durationMinutes: 20, updatedAt: null });
      const qs = await API.get("/admin/aptitude/questions");
      setAptQuestions(qs.data || []);
    } catch (e) {
      console.error("Aptitude load failed:", e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadAll(); }, []);

  const saveTime = async () => {
    const mins = Number(aptConfig.durationMinutes);
    if (!Number.isFinite(mins) || mins <= 0) return alert("Enter a positive number");
    try {
      const res = await API.put("/admin/aptitude/config", { durationMinutes: mins });
      setAptConfig(res.data || { durationMinutes: mins });
      alert("Timer updated");
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to update timer");
    }
  };

  const filtered = useMemo(() => {
    const q = qSearch.trim().toLowerCase();
    if (!q) return aptQuestions;
    return aptQuestions.filter((x) => `${x.question} ${x.answer}`.toLowerCase().includes(q));
  }, [qSearch, aptQuestions]);

  const newQ = () => setQDraft({ _id: "", question: "", options: ["", "", "", ""], answer: "" });
  const editQ = (q) => setQDraft({ _id: q._id, question: q.question || "", options: q.options || ["", "", "", ""], answer: q.answer || "" });
  const cancelQ = () => setQDraft({ _id: "", question: "", options: ["", "", "", ""], answer: "" });

  const saveQ = async () => {
    const { _id, question, options, answer } = qDraft;
    if (!question.trim() || options.some((o) => !o.trim()) || !answer.trim()) {
      return alert("Fill question, 4 options and correct answer.");
    }
    try {
      if (_id) {
        await API.put(`/admin/aptitude/questions/${_id}`, { question: question.trim(), options: options.map((o) => o.trim()), answer: answer.trim() });
      } else {
        await API.post(`/admin/aptitude/questions`, { question: question.trim(), options: options.map((o) => o.trim()), answer: answer.trim() });
      }
      await loadAll();
      cancelQ();
    } catch (e) {
      alert(e?.response?.data?.message || "Saving question failed");
    }
  };

  const removeQ = async (id) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await API.delete(`/admin/aptitude/questions/${id}`);
      setAptQuestions((qs) => qs.filter((q) => q._id !== id));
    } catch (e) {
      alert(e?.response?.data?.message || "Delete failed");
    }
  };

  const importCSV = async () => {
    if (!csvFile) return alert("Choose a CSV file");
    setBusy(true);
    setBulkLog([]);
    try {
      const text = await csvFile.text();
      let rows = parseCSVText(text);
      if (rows.length && /question|opt1|option|answer/i.test(rows[0].join(","))) rows.shift();

      appendLog(`Parsed ${rows.length} rows`);
      let ok = 0, fail = 0;

      // Validate quickly to give early feedback
      rows.forEach((row, idx) => {
        if (row.length < 6) {
          fail++; appendLog(`× Row ${idx + 1}: Bad row length (${row.length})`);
        }
      });

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 6) continue;
        let [question, o1, o2, o3, o4, answer] = row;
        if (!question || !o1 || !o2 || !o3 || !o4 || !answer) {
          fail++; appendLog(`× Row ${i + 1}: Missing required fields`);
          continue;
        }
        try {
          await API.post("/admin/aptitude/questions", { question, options: [o1, o2, o3, o4], answer });
          ok++; appendLog(`✓ Row ${i + 1}: ${String(question).slice(0, 70)}`);
        } catch (e) {
          fail++; appendLog(`× Row ${i + 1}: ${String(question).slice(0, 70)} — ${e?.response?.data?.message || e.message}`);
        }
      }

      appendLog(`Done. OK=${ok}, Failed=${fail}`);
      await loadAll();
    } catch (e) {
      appendLog(`× Import error: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const exportCSV = async () => {
    try {
      const res = await API.get("/admin/aptitude/questions");
      const rows = (res.data || []).map((q) => [
        q.question,
        q.options?.[0] || "",
        q.options?.[1] || "",
        q.options?.[2] || "",
        q.options?.[3] || "",
        q.answer || "",
      ]);
      const header = ["question", "opt1", "opt2", "opt3", "opt4", "answer"];
      const safe = (v) => {
        const s = String(v ?? "");
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const csv = [header, ...rows].map((r) => r.map(safe).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "aptitude_questions.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Export failed");
    }
  };

  const downloadTemplate = () => {
    const header = "question,opt1,opt2,opt3,opt4,answer\n";
    const demo = '"Find next: 2,4,8,16,32,64",2,4,8,16,64\n"Odd one out?","Dog","Cat","Car","Mouse","Car"\n';
    const blob = new Blob([header + demo], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "aptitude_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  /* --------------------------------- UI --------------------------------- */
  return (
    <div className="space-y-6">
      <Card className="p-5">
        <SectionTitle
          hint="Global"
          title="Aptitude Test — Time & Questions"
          right={<IconBtn title="Reload" onClick={loadAll}><I.Refresh /></IconBtn>}
        />

        {/* Timer */}
        <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
          <div>
            <div className="text-xs" style={{ color: COLORS.ink, opacity: 0.55 }}>Timer (minutes)</div>
            <Input
              type="number"
              min="1"
              value={aptConfig.durationMinutes}
              onChange={(e) => setAptConfig((c) => ({ ...c, durationMinutes: e.target.value }))}
            />
            {aptConfig.updatedAt && (
              <div className="text-xs mt-1" style={{ color: COLORS.ink, opacity: 0.55 }}>
                Last updated: {new Date(aptConfig.updatedAt).toLocaleString()}
              </div>
            )}
          </div>
          <IconBtn title="Save timer" variant="success" onClick={saveTime}><I.Save /></IconBtn>
        </div>

        {/* Questions header */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-[13px] uppercase tracking-wide" style={{ color: COLORS.ink, opacity: 0.55 }}>
            Aptitude Questions
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Input
                placeholder="Search…"
                value={qSearch}
                onChange={(e) => setQSearch(e.target.value)}
                style={{ paddingLeft: 36, width: 220 }}
              />
              <div className="absolute left-2 top-1.5" style={{ color: COLORS.ink, opacity: 0.5 }}>
                <I.Search />
              </div>
            </div>
            <IconBtn title="New Question" variant="primary" onClick={newQ}><I.Plus /></IconBtn>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="mt-3"><Empty>Loading…</Empty></div>
        ) : filtered.length === 0 ? (
          <div className="mt-3"><Empty>No questions yet.</Empty></div>
        ) : (
          <div className="mt-3 overflow-x-auto border rounded-xl" style={{ borderColor: "#E6E6E9" }}>
            <table className="w-full text-sm">
              <thead style={{ background: "#F7F7FA", color: COLORS.ink }}>
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Question</th>
                  <th className="px-4 py-3 text-left">Answer</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((q, i) => (
                  <tr key={q._id} className="border-t hover:bg-slate-50" style={{ borderColor: "#E6E6E9" }}>
                    <td className="px-4 py-2">{i + 1}</td>
                    <td className="px-4 py-2">{q.question}</td>
                    <td className="px-4 py-2">{q.answer}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <IconBtn title="Edit" onClick={() => editQ(q)}><I.Edit /></IconBtn>
                        <IconBtn title="Delete" variant="danger" onClick={() => removeQ(q._id)}><I.Trash /></IconBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Composer */}
        {(qDraft._id || qDraft.question || qDraft.options.some(Boolean) || qDraft.answer) && (
          <div className="mt-5 grid lg:grid-cols-[1fr_1fr] gap-4">
            <div className="space-y-3">
              <div>
                <div className="text-xs" style={{ color: COLORS.ink, opacity: 0.55 }}>Question</div>
                <Input
                  value={qDraft.question}
                  onChange={(e) => setQDraft((d) => ({ ...d, question: e.target.value }))}
                  placeholder="Type the question"
                />
              </div>
              {[0,1,2,3].map((i) => (
                <div key={i}>
                  <div className="text-xs" style={{ color: COLORS.ink, opacity: 0.55 }}>Option {i+1}</div>
                  <Input
                    value={qDraft.options[i] || ""}
                    onChange={(e) =>
                      setQDraft((d) => {
                        const next = [...d.options];
                        next[i] = e.target.value;
                        return { ...d, options: next };
                      })
                    }
                    placeholder={`Option ${i+1}`}
                  />
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-xs" style={{ color: COLORS.ink, opacity: 0.55 }}>Correct Answer</div>
                <Select
                  value={qDraft.answer}
                  onChange={(e) => setQDraft((d) => ({ ...d, answer: e.target.value }))}
                >
                  <option value="">-- choose --</option>
                  {qDraft.options.map((o, i) => (
                    <option key={i} value={o}>{o || `Option ${i+1}`}</option>
                  ))}
                </Select>
              </div>
              <div className="flex gap-2">
                <IconBtn title="Save" variant="success" onClick={saveQ}><I.Save /></IconBtn>
                <IconBtn title="Cancel" onClick={cancelQ}><I.Close /></IconBtn>
              </div>
            </div>
          </div>
        )}

        {/* Bulk */}
        <div className="mt-6">
          <div className="text-[13px] uppercase tracking-wide mb-2" style={{ color: COLORS.ink, opacity: 0.55 }}>
            Bulk Import / Export
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <label className="text-sm bg-white border rounded-xl px-3 py-2 cursor-pointer" style={{ borderColor: "#E6E6E9" }}>
              <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} className="hidden" />
              {csvFile?.name ? <span className="text-slate-700">{csvFile.name}</span> : <span className="text-slate-500">Choose CSV…</span>}
            </label>
            <IconBtn title="Import CSV" variant="primary" disabled={busy} onClick={importCSV}>
              {busy ? <I.Refresh /> : <I.Upload />}
            </IconBtn>
            <IconBtn title="Export all" onClick={exportCSV}><I.Download /></IconBtn>
            <IconBtn title="Template" onClick={downloadTemplate}><I.Download /></IconBtn>
            <div className="text-xs text-slate-500">
              CSV: <code>question, opt1, opt2, opt3, opt4, answer</code>
            </div>
          </div>

          <div className="mt-3 border rounded-xl bg-slate-50 p-3 text-xs max-h-44 overflow-auto space-y-1" style={{ borderColor: "#E6E6E9" }}>
            {bulkLog.length === 0 ? (
              <div className="text-slate-500">No logs yet.</div>
            ) : (
              bulkLog.map((l, i) => <div key={i}>{l}</div>)
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
