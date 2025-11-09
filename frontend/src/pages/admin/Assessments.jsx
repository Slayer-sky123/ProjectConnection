import { useEffect, useMemo, useState } from "react";
import API from "../../api/axios";

/* ---------------------------- Inline Icon Set ---------------------------- */
const I = {
  Plus: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...p}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Edit: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...p}>
      <path d="M4 21h4l11-11a2.5 2.5 0 10-3.5-3.5L4.5 17.5V21z" fill="none" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  Save: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...p}>
      <path d="M7 3h10l4 4v14H3V3h4z" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M7 3v6h10V3" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  ),
  Trash: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...p}>
      <path d="M3 6h18M8 6v14h8V6M10 6V4h4v2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  ),
  Refresh: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...p}>
      <path d="M20 12a8 8 0 10-2.34 5.66" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M20 8v4h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Search: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...p}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Upload: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...p}>
      <path d="M12 16V4M8 8l4-4 4 4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <rect x="4" y="16" width="16" height="4" rx="1.5" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  ),
  Download: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...p}>
      <path d="M12 4v12M8 12l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <rect x="4" y="18" width="16" height="2" rx="1" fill="currentColor"/>
    </svg>
  ),
  Check: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  ),
  Close: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...p}>
      <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
};

/* --------------------------------- Tiny UI bits --------------------------------- */
const Card = ({ children, className = "" }) => (
  <div className={"rounded-2xl border border-slate-200 bg-white/75 backdrop-blur shadow-sm hover:shadow-md transition-shadow " + className}>
    {children}
  </div>
);

const SectionTitle = ({ title, hint, right }) => (
  <div className="flex items-center justify-between mb-4">
    <div>
      <div className="text-[13px] uppercase tracking-wide text-slate-500">{hint}</div>
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
    </div>
    <div className="flex gap-2">{right}</div>
  </div>
);

const IconBtn = ({ title, onClick, variant = "ghost", disabled, children }) => {
  const map = {
    ghost:  "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200",
    primary:"bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-600",
    danger: "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200",
    success:"bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600",
  };
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`h-9 w-9 grid place-items-center rounded-xl text-sm transition ${map[variant]} ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
};

const Input = (props) => (
  <input
    {...props}
    className={"w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[14px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"}
  />
);

const Select = (props) => (
  <select
    {...props}
    className={"w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-200"}
  />
);

const Chip = ({ active, children, onClick }) => (
  <button
    onClick={onClick}
    className={"px-3 py-1.5 rounded-xl text-[13px] border transition " + (active
      ? "bg-indigo-600 text-white border-indigo-600"
      : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200")}
  >
    {children}
  </button>
);

const Empty = ({ children }) => (
  <div className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
    {children}
  </div>
);

/* =============================== Main Component =============================== */
export default function Assessments() {
  /* ------------------------- Skills (Step 1) ------------------------- */
  const [skills, setSkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [skillDraft, setSkillDraft] = useState({ _id: "", name: "" });

  const loadSkills = async () => {
    setLoadingSkills(true);
    try {
      const res = await API.get("/admin/skills");
      setSkills(res.data || []);
    } catch (e) {
      console.error("Skills load failed:", e?.response?.data || e.message);
    } finally {
      setLoadingSkills(false);
    }
  };

  useEffect(() => { loadSkills(); }, []);

  const startNewSkill = () => setSkillDraft({ _id: "", name: "" });
  const editSkill = (s) => setSkillDraft({ _id: s._id, name: s.name || "" });
  const cancelSkill = () => setSkillDraft({ _id: "", name: "" });

  const saveSkill = async () => {
    const name = (skillDraft.name || "").trim();
    if (!name) return;
    try {
      if (skillDraft._id) {
        await API.put(`/admin/skills/${skillDraft._id}`, { name });
      } else {
        await API.post("/admin/skills", { name });
      }
      await loadSkills();
      cancelSkill();
    } catch (e) {
      alert(e?.response?.data?.message || "Saving skill failed");
    }
  };

  const removeSkill = async (id) => {
    if (!window.confirm("Delete this skill?")) return;
    try {
      await API.delete(`/admin/skills/${id}`);
      await loadSkills();
      if (skillDraft._id === id) cancelSkill();
    } catch (e) {
      alert(e?.response?.data?.message || "Delete skill failed");
    }
  };

  /* ------------------------- Aptitude Admin ------------------------- */
  const [aptConfig, setAptConfig] = useState({ durationMinutes: 20, updatedAt: null });
  const [aptQuestions, setAptQuestions] = useState([]);
  const [loadingApt, setLoadingApt] = useState(true);
  const [qSearch, setQSearch] = useState("");
  const [qDraft, setQDraft] = useState({ _id: "", question: "", options: ["", "", "", ""], answer: "" });

  const [csvFile, setCsvFile] = useState(null);
  const [bulkLog, setBulkLog] = useState([]);
  const [busy, setBusy] = useState(false);
  const appendLog = (s) => setBulkLog((l) => [...l, s]);

  const loadAptitude = async () => {
    setLoadingApt(true);
    try {
      const cfg = await API.get("/admin/aptitude/config");
      setAptConfig(cfg.data || { durationMinutes: 20, updatedAt: null });
      const qs = await API.get("/admin/aptitude/questions");
      setAptQuestions(qs.data || []);
    } catch (e) {
      console.error("Aptitude load failed:", e?.response?.data || e.message);
    } finally {
      setLoadingApt(false);
    }
  };

  useEffect(() => { loadAptitude(); }, []);

  const saveAptTime = async () => {
    const mins = Number(aptConfig.durationMinutes);
    if (!Number.isFinite(mins) || mins <= 0) return alert("Enter a valid positive number of minutes");
    try {
      const res = await API.put("/admin/aptitude/config", { durationMinutes: mins });
      setAptConfig(res.data || { durationMinutes: mins });
      alert("Aptitude timer updated");
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to update timer");
    }
  };

  const filteredApt = useMemo(() => {
    const q = qSearch.trim().toLowerCase();
    if (!q) return aptQuestions;
    return aptQuestions.filter((x) => `${x.question} ${(x.answer || "")}`.toLowerCase().includes(q));
  }, [qSearch, aptQuestions]);

  const newAptQ = () => setQDraft({ _id: "", question: "", options: ["", "", "", ""], answer: "" });
  const editAptQ = (q) =>
    setQDraft({
      _id: q._id,
      question: q.question || "",
      options: q.options?.length ? [...q.options] : ["", "", "", ""],
      answer: q.answer || "",
    });
  const cancelAptQ = () => setQDraft({ _id: "", question: "", options: ["", "", "", ""], answer: "" });

  const saveAptQ = async () => {
    const { _id, question, options, answer } = qDraft;
    if (!question.trim() || options.some((o) => !o.trim()) || !answer.trim()) {
      return alert("Fill question, 4 options and correct answer.");
    }
    try {
      if (_id) {
        await API.put(`/admin/aptitude/questions/${_id}`, {
          question: question.trim(),
          options: options.map((o) => o.trim()),
          answer: answer.trim(),
        });
      } else {
        await API.post(`/admin/aptitude/questions`, {
          question: question.trim(),
          options: options.map((o) => o.trim()),
          answer: answer.trim(),
        });
      }
      await loadAptitude();
      cancelAptQ();
    } catch (e) {
      alert(e?.response?.data?.message || "Saving question failed");
    }
  };

  const removeAptQ = async (id) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await API.delete(`/admin/aptitude/questions/${id}`);
      setAptQuestions((qs) => qs.filter((q) => q._id !== id));
    } catch (e) {
      alert(e?.response?.data?.message || "Delete failed");
    }
  };

  const parseCSV = async (f) => {
    const text = await f.text();
    const rows = text
      .split(/\r?\n/)
      .map((r) => r.trim())
      .filter(Boolean)
      .map((r) => r.split(",").map((c) => c.trim()));
    if (rows.length && /question|opt1|option|answer/i.test(rows[0].join(","))) rows.shift();
    return rows;
  };

  const importAptCSV = async () => {
    if (!csvFile) return alert("Choose a CSV file");
    setBusy(true);
    setBulkLog([]);
    try {
      const rows = await parseCSV(csvFile);
      appendLog(`Parsed ${rows.length} rows`);
      let ok = 0, fail = 0;
      for (const row of rows) {
        let question, o1, o2, o3, o4, answer;
        if (row.length === 6) [question, o1, o2, o3, o4, answer] = row;
        else { fail++; appendLog("× Bad row length"); continue; }
        if (!question || !o1 || !o2 || !o3 || !o4 || !answer) { fail++; appendLog("× Missing fields"); continue; }

        try {
          await API.post("/admin/aptitude/questions", {
            question, options: [o1, o2, o3, o4], answer
          });
          ok++; appendLog(`✓ ${question.slice(0, 70)}`);
        } catch (e) {
          fail++; appendLog(`× ${question.slice(0, 70)} — ${e?.response?.data?.message || e.message}`);
        }
      }
      appendLog(`Done. OK=${ok}, Failed=${fail}`);
      await loadAptitude();
    } catch (e) {
      appendLog(`× Import error: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const exportAptCSV = async () => {
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
      const csv = [header, ...rows]
        .map((r) => r.map((c) => String(c).replace(/,/g, " ")).join(","))
        .join("\n");
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

  const downloadAptTemplate = () => {
    const header = "question,opt1,opt2,opt3,opt4,answer\n";
    const demo =
      "Find next: 2,4,8,16,?,64,32,128,256,512,1024,2048,4096,?,8192,16384,32768,65536,131072,262144,524288,1048576,2097152,4194304,8388608,16777216,33554432,67108864\n" +
      "Odd one out?,Dog,Cat,Car,Mouse,Car\n";
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
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-[12px] uppercase tracking-widest text-indigo-500">Assessment Studio</div>
          <h1 className="text-2xl font-semibold text-slate-800">Skills • Aptitude • Questions</h1>
          <p className="text-sm text-slate-500 mt-1">Manage skills (for skill tests) and global Aptitude test here.</p>
        </div>
        <div className="flex gap-2">
          <IconBtn title="Reload everything" onClick={() => { loadSkills(); loadAptitude(); }}>
            <I.Refresh />
          </IconBtn>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Skills (Step 1) */}
        <Card className="p-5 bg-gradient-to-b from-indigo-50/70 to-white">
          <SectionTitle
            hint="Step 1"
            title="Skills"
            right={
              <>
                <IconBtn title="Add skill" variant="primary" onClick={startNewSkill}>
                  <I.Plus />
                </IconBtn>
                <IconBtn title="Reload" onClick={loadSkills}>
                  <I.Refresh />
                </IconBtn>
              </>
            }
          />

          {loadingSkills ? (
            <Empty>Loading skills…</Empty>
          ) : skills.length === 0 ? (
            <Empty>No skills yet. Add your first skill.</Empty>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <div key={s._id} className="flex items-center gap-1">
                  <Chip active={false} onClick={() => editSkill(s)}>{s.name}</Chip>
                  <IconBtn title="Edit" onClick={() => editSkill(s)}><I.Edit /></IconBtn>
                  <IconBtn title="Delete" variant="danger" onClick={() => removeSkill(s._id)}><I.Trash /></IconBtn>
                </div>
              ))}
            </div>
          )}

          {(skillDraft._id || skillDraft.name) && (
            <div className="mt-4 grid grid-cols-[1fr_auto_auto] gap-2 items-end">
              <div>
                <div className="text-xs text-slate-500 mb-1">{skillDraft._id ? "Edit Skill" : "New Skill"}</div>
                <Input
                  placeholder="Skill name"
                  value={skillDraft.name}
                  onChange={(e) => setSkillDraft((d) => ({ ...d, name: e.target.value }))}
                />
              </div>
              <IconBtn title="Save" variant="success" onClick={saveSkill}><I.Save /></IconBtn>
              <IconBtn title="Cancel" onClick={cancelSkill}><I.Close /></IconBtn>
            </div>
          )}
        </Card>

        {/* Aptitude (Timer + Questions) */}
        <Card className="p-5 bg-gradient-to-b from-violet-50/70 to-white">
          <SectionTitle
            hint="Global"
            title="Aptitude Test — Time & Questions"
            right={
              <>
                <IconBtn title="Reload" onClick={loadAptitude}><I.Refresh /></IconBtn>
              </>
            }
          />

          {/* Time control */}
          <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
            <div>
              <div className="text-xs text-slate-500 mb-1">Timer (minutes)</div>
              <Input
                type="number"
                min="1"
                value={aptConfig.durationMinutes}
                onChange={(e) => setAptConfig((c) => ({ ...c, durationMinutes: e.target.value }))}
              />
              {aptConfig.updatedAt && (
                <div className="text-xs text-slate-500 mt-1">
                  Last updated: {new Date(aptConfig.updatedAt).toLocaleString()}
                </div>
              )}
            </div>
            <IconBtn title="Save timer" variant="success" onClick={saveAptTime}><I.Save /></IconBtn>
          </div>

          {/* Question list header */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-[13px] uppercase tracking-wide text-slate-500">Aptitude Questions</div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Input
                  placeholder="Search…"
                  value={qSearch}
                  onChange={(e) => setQSearch(e.target.value)}
                  style={{ paddingLeft: 36, width: 220 }}
                />
                <div className="absolute left-2 top-1.5 text-slate-500">
                  <I.Search />
                </div>
              </div>
              <IconBtn title="New Question" variant="primary" onClick={newAptQ}><I.Plus /></IconBtn>
            </div>
          </div>

          {/* Questions list */}
          {loadingApt ? (
            <div className="mt-3"><Empty>Loading…</Empty></div>
          ) : filteredApt.length === 0 ? (
            <div className="mt-3"><Empty>No questions yet.</Empty></div>
          ) : (
            <div className="mt-3 overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Question</th>
                    <th className="px-4 py-3 text-left">Answer</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApt.map((q, i) => (
                    <tr key={q._id} className="border-t hover:bg-slate-50">
                      <td className="px-4 py-2">{i + 1}</td>
                      <td className="px-4 py-2">{q.question}</td>
                      <td className="px-4 py-2">{q.answer}</td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <IconBtn title="Edit" onClick={() => editAptQ(q)}><I.Edit /></IconBtn>
                          <IconBtn title="Delete" variant="danger" onClick={() => removeAptQ(q._id)}><I.Trash /></IconBtn>
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
                  <div className="text-xs text-slate-500 mb-1">Question</div>
                  <Input
                    value={qDraft.question}
                    onChange={(e) => setQDraft((d) => ({ ...d, question: e.target.value }))}
                    placeholder="Type the question"
                  />
                </div>
                {[0,1,2,3].map((i) => (
                  <div key={i}>
                    <div className="text-xs text-slate-500 mb-1">Option {i+1}</div>
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
                  <div className="text-xs text-slate-500 mb-1">Correct Answer</div>
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
                  <IconBtn title="Save" variant="success" onClick={saveAptQ}><I.Save /></IconBtn>
                  <IconBtn title="Cancel" onClick={cancelAptQ}><I.Close /></IconBtn>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Tools */}
          <div className="mt-6">
            <div className="text-[13px] uppercase tracking-wide text-slate-500 mb-2">Bulk Import / Export</div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <label className="text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 cursor-pointer">
                <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} className="hidden" />
                {csvFile?.name ? <span className="text-slate-700">{csvFile.name}</span> : <span className="text-slate-500">Choose CSV…</span>}
              </label>
              <IconBtn title="Import CSV" variant="primary" disabled={busy} onClick={importAptCSV}>
                {busy ? <I.Refresh /> : <I.Upload />}
              </IconBtn>
              <IconBtn title="Export all" onClick={exportAptCSV}><I.Download /></IconBtn>
              <IconBtn title="Template" onClick={downloadAptTemplate}><I.Download /></IconBtn>
              <div className="text-xs text-slate-500">
                CSV: <code>question, opt1, opt2, opt3, opt4, answer</code>
              </div>
            </div>

            <div className="mt-3 border border-slate-200 rounded-xl bg-slate-50 p-3 text-xs max-h-44 overflow-auto space-y-1">
              {bulkLog.length === 0 ? (
                <div className="text-slate-500">No logs yet.</div>
              ) : (
                bulkLog.map((l, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {/^✓/.test(l) ? (
                      <span className="text-emerald-600"><I.Check /></span>
                    ) : /^×/.test(l) ? (
                      <span className="text-rose-600"><I.Close /></span>
                    ) : (
                      <span className="text-indigo-600"><I.Refresh /></span>
                    )}
                    <span className="text-slate-700">{l}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
