// src/pages/admin/AssessmentsSkill.jsx
import { useEffect, useMemo, useState } from "react";
import API from "../../api/axios";

/* ---- brand colors (matches palette) ---- */
const COLORS = {
  brand: "#F29F67",
  ink: "#1E1E2C",
  info: "#3B8FF3",
  teal: "#34B1AA",
  gold: "#E0B50F",
};

const I = {
  Plus: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...p}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Edit: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...p}>
      <path d="M4 21h4l11-11a2.5 2.5 0 10-3.5-3.5L4.5 17.5V21z" fill="none" stroke="currentColor" strokeWidth="2" />
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
  Download: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...p}>
      <path d="M12 4v12M8 12l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <rect x="4" y="18" width="16" height="2" rx="1" fill="currentColor"/>
    </svg>
  ),
  Upload: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...p}>
      <path d="M12 16V4M8 8l4-4 4 4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <rect x="4" y="16" width="16" height="4" rx="1.5" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  ),
  Close: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...p}>
      <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
};

/* ---------------------------- UI helpers ---------------------------- */
const Card = ({ children, className = "" }) => (
  <div
    className={
      "rounded-2xl border bg-white/80 shadow-sm hover:shadow-md transition-shadow " + className
    }
    style={{ borderColor: "#E6E6E9" }}
  >
    {children}
  </div>
);

const SectionTitle = ({ title, hint, right }) => (
  <div className="flex items-center justify-between mb-4">
    <div>
      <div className="text-[13px] uppercase tracking-wide" style={{ color: COLORS.ink, opacity: 0.5 }}>
        {hint}
      </div>
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
  <input
    {...props}
    className="w-full rounded-xl border bg-white px-3 py-2 text-[14px] placeholder:text-slate-400 focus:outline-none focus:ring-2"
    style={{ borderColor: "#E6E6E9", boxShadow: "0 0 0 0 rgba(0,0,0,0)" }}
  />
);
const Select = (props) => (
  <select
    {...props}
    className="w-full rounded-xl border bg-white px-3 py-2 text-[14px] focus:outline-none focus:ring-2"
    style={{ borderColor: "#E6E6E9" }}
  />
);
const Chip = ({ active, children, onClick }) => (
  <button
    onClick={onClick}
    className={
      "px-3 py-1.5 rounded-xl text-[13px] border transition " +
      (active
        ? "text-white"
        : "bg-white hover:bg-slate-50")
    }
    style={
      active
        ? { background: COLORS.brand, borderColor: COLORS.brand }
        : { color: COLORS.ink, borderColor: "#E6E6E9" }
    }
  >
    {children}
  </button>
);
const Empty = ({ children }) => (
  <div
    className="text-sm rounded-xl px-4 py-3"
    style={{ background: "#F7F7FA", border: "1px solid #E6E6E9", color: COLORS.ink, opacity: 0.7 }}
  >
    {children}
  </div>
);

/* =============================== CSV helper =============================== */
// Robust CSV parser: handles quotes, embedded commas, CRLF, trailing commas.
// Returns rows as array of arrays (no header stripping).
function parseCSVText(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  const pushCell = () => {
    // Trim outer quotes and unescape double quotes
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
        cell += '"'; // escaped quote
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
        // handle CRLF or bare LF
        if (row.length && row.some(c => c.length)) rows.push(row);
        row = [];
      } else if (ch === "\r") {
        // ignore, CR will be followed by \n usually
      } else {
        cell += ch;
      }
    }
  }
  // last cell
  pushCell();
  if (row.length && row.some(c => c.length)) rows.push(row);
  return rows;
}

/* =============================== Component =============================== */
/**
 * Test Skill admin:
 * - Step 1: Skills (add/edit/delete)
 * - Step 2: Questions (auto-uses the latest/created set under the hood)
 * - Bulk Import/Export for Skill Questions (per skill)
 */
export default function AssessmentsSkill() {
  /* -------- Skills -------- */
  const [skills, setSkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState("");
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
        const res = await API.post("/admin/skills", { name });
        const created = res.data;
        setSelectedSkill(created?._id || "");
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
      if (selectedSkill === id) setSelectedSkill("");
      if (skillDraft._id === id) cancelSkill();
    } catch (e) {
      alert(e?.response?.data?.message || "Delete skill failed");
    }
  };

  /* -------- Questions (mapped to skill’s latest set) -------- */
  const [sets, setSets] = useState([]);
  const [activeSetId, setActiveSetId] = useState("");
  const [questions, setQuestions] = useState([]);
  const [loadingQ, setLoadingQ] = useState(false);
  const [qSearch, setQSearch] = useState("");

  const [qDraft, setQDraft] = useState({
    _id: "",
    question: "",
    options: ["", "", "", ""],
    answer: "",
  });

  const loadSets = async (skillId) => {
    if (!skillId) {
      setSets([]); setActiveSetId(""); return;
    }
    try {
      const res = await API.get("/admin/question-sets");
      const all = res.data || [];
      const filtered = all.filter((s) => s.skill && (s.skill._id === skillId || s.skill === skillId));
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setSets(filtered);
      setActiveSetId(filtered[0]?._id || "");
    } catch (e) {
      console.error("Sets load failed:", e?.response?.data || e.message);
      setSets([]); setActiveSetId("");
    }
  };

  useEffect(() => {
    setQuestions([]); setActiveSetId("");
    if (selectedSkill) loadSets(selectedSkill);
  }, [selectedSkill]);

  const loadQuestions = async (setId) => {
    if (!setId) return setQuestions([]);
    setLoadingQ(true);
    try {
      const res = await API.get(`/admin/questions/set/${setId}`);
      setQuestions(res.data || []);
    } catch (e) {
      console.error("Questions load failed:", e?.response?.data || e.message);
      setQuestions([]);
    } finally {
      setLoadingQ(false);
    }
  };
  useEffect(() => { if (activeSetId) loadQuestions(activeSetId); }, [activeSetId]);

  const filteredQuestions = useMemo(() => {
    const q = qSearch.trim().toLowerCase();
    if (!q) return questions;
    return questions.filter((x) => `${x.question} ${x.answer}`.toLowerCase().includes(q));
  }, [qSearch, questions]);

  /* --- Question CRUD --- */
  const newQuestion = () => setQDraft({ _id: "", question: "", options: ["", "", "", ""], answer: "" });
  const editQuestion = (q) => setQDraft({
    _id: q._id,
    question: q.question || "",
    options: q.options?.length ? [...q.options] : ["", "", "", ""],
    answer: q.answer || "",
  });
  const cancelQ = () => setQDraft({ _id: "", question: "", options: ["", "", "", ""], answer: "" });

  const ensureSetForSkill = async () => {
    if (activeSetId) return activeSetId;
    const r = await API.post("/admin/question-sets", {
      title: `Default ${new Date().toLocaleDateString()}`,
      description: "",
      skill: selectedSkill,
    });
    const set = r.data;
    setSets((s) => [set, ...s]);
    setActiveSetId(set._id);
    return set._id;
  };

  const saveQ = async () => {
    if (!selectedSkill) return alert("Pick a skill first.");
    const { question, options, answer, _id } = qDraft;
    if (!question.trim() || options.some((o) => !o.trim()) || !answer.trim()) {
      return alert("Fill question, 4 options and correct answer.");
    }
    try {
      const sid = await ensureSetForSkill();
      if (_id) {
        await API.put(`/admin/questions/${_id}`, {
          question: question.trim(),
          options: options.map((o) => o.trim()),
          answer: answer.trim(),
        });
      } else {
        await API.post("/admin/questions", {
          set: sid,
          question: question.trim(),
          options: options.map((o) => o.trim()),
          answer: answer.trim(),
        });
      }
      await loadQuestions(sid);
      cancelQ();
    } catch (e) {
      alert(e?.response?.data?.message || "Saving question failed");
    }
  };

  const removeQ = async (id) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await API.delete(`/admin/questions/${id}`);
      setQuestions((qs) => qs.filter((q) => q._id !== id));
    } catch (e) {
      alert(e?.response?.data?.message || "Delete question failed");
    }
  };

  /* ---------------------------- Bulk Import / Export ---------------------------- */
  const [csvFile, setCsvFile] = useState(null);
  const [bulkLog, setBulkLog] = useState([]);
  const [busy, setBusy] = useState(false);
  const [exportScope, setExportScope] = useState("latest"); // 'latest' | 'allSets'
  const appendLog = (s) => setBulkLog((l) => [...l, s]);

  const importCSV = async () => {
    if (!csvFile) return alert("Choose a CSV file");
    if (!selectedSkill) return alert("Pick a skill first");
    setBusy(true);
    setBulkLog([]);
    try {
      const text = await csvFile.text();
      let rows = parseCSVText(text);

      // Drop header row if it looks like one
      if (rows.length && rows[0].some((c) => /set|question|opt1|option|answer/i.test(c))) rows.shift();

      appendLog(`Parsed ${rows.length} rows`);
      let ok = 0, fail = 0;

      const sid = await ensureSetForSkill();

      rows.forEach((row, idx) => {
        // Accept 6 columns or 7 columns (first is setId we ignore)
        if (row.length < 6) {
          fail++;
          appendLog(`× Row ${idx + 1}: Bad row length (${row.length})`);
          return;
        }
        // Normalize into [question,o1,o2,o3,o4,answer]
        let question, o1, o2, o3, o4, answer;
        if (row.length >= 7) {
          // [setId, question, o1, o2, o3, o4, answer, ...extra]
          [, question, o1, o2, o3, o4, answer] = row;
        } else {
          // [question, o1, o2, o3, o4, answer]
          [question, o1, o2, o3, o4, answer] = row;
        }

        if (!question || !o1 || !o2 || !o3 || !o4 || !answer) {
          fail++;
          appendLog(`× Row ${idx + 1}: Missing required fields`);
          return;
        }

        // Queue API calls but sequential to keep logs ordered
        // (could be batched if you add a bulk endpoint later)
      });

      // Sequential import with await to preserve order in logs
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 6) continue;

        let question, o1, o2, o3, o4, answer;
        if (row.length >= 7) [, question, o1, o2, o3, o4, answer] = row;
        else [question, o1, o2, o3, o4, answer] = row;

        if (!question || !o1 || !o2 || !o3 || !o4 || !answer) continue;

        try {
          await API.post("/admin/questions", {
            set: sid,
            question,
            options: [o1, o2, o3, o4],
            answer,
          });
          ok++;
          appendLog(`✓ Row ${i + 1}: ${String(question).slice(0, 70)}`);
        } catch (e) {
          fail++;
          appendLog(`× Row ${i + 1}: ${String(question).slice(0, 70)} — ${e?.response?.data?.message || e.message}`);
        }
      }

      appendLog(`Done. OK=${ok}, Failed=${fail}`);
      await loadQuestions(sid);
    } catch (e) {
      appendLog(`× Import error: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const exportCSV = async () => {
    try {
      if (!selectedSkill) return alert("Pick a skill first");
      let rows = [];
      if (exportScope === "latest") {
        if (!activeSetId) return alert("No set for this skill yet.");
        const res = await API.get(`/admin/questions/set/${activeSetId}`);
        rows = (res.data || []).map((q) => [
          activeSetId,
          q.question,
          q.options?.[0] || "",
          q.options?.[1] || "",
          q.options?.[2] || "",
          q.options?.[3] || "",
          q.answer || "",
        ]);
      } else {
        // all sets for this skill
        const resSets = await API.get("/admin/question-sets");
        const all = (resSets.data || []).filter((s) => s.skill && (s.skill._id === selectedSkill || s.skill === selectedSkill));
        for (const s of all) {
          const resQ = await API.get(`/admin/questions/set/${s._id}`);
          (resQ.data || []).forEach((q) =>
            rows.push([
              s._id,
              q.question,
              q.options?.[0] || "",
              q.options?.[1] || "",
              q.options?.[2] || "",
              q.options?.[3] || "",
              q.answer || "",
            ])
          );
        }
      }

      const header = ["setId", "question", "opt1", "opt2", "opt3", "opt4", "answer"];
      const safe = (v) => {
        const s = String(v ?? "");
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        };
      const csv = [header, ...rows].map((r) => r.map(safe).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = exportScope === "latest" ? `skill_${selectedSkill}_latest.csv` : `skill_${selectedSkill}_allsets.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Export failed");
    }
  };

  const downloadTemplate = () => {
    const header = "question,opt1,opt2,opt3,opt4,answer\n";
    const demo =
      '"What is 2, plus 2?",1,2,3,4,4\n' +
      '"Capital of France (EU)","Paris","Rome","Berlin","Madrid","Paris"\n';
    const blob = new Blob([header + demo], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "skill_questions_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  /* --------------------------------- UI --------------------------------- */
  return (
    <div className="space-y-6">
      {/* Skills */}
      <Card className="p-5" >
        <SectionTitle
          hint="Step 1"
          title="Skills (for Skill Tests)"
          right={
            <>
              <IconBtn title="Add skill" variant="primary" onClick={startNewSkill}><I.Plus /></IconBtn>
              <IconBtn title="Reload" onClick={loadSkills}><I.Refresh /></IconBtn>
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
                <Chip active={selectedSkill === s._id} onClick={() => setSelectedSkill(s._id)}>{s.name}</Chip>
                <IconBtn title="Edit" onClick={() => editSkill(s)}><I.Edit /></IconBtn>
                <IconBtn title="Delete" variant="danger" onClick={() => removeSkill(s._id)}><I.Trash /></IconBtn>
              </div>
            ))}
          </div>
        )}

        {(skillDraft._id || skillDraft.name) && (
          <div className="mt-4 grid grid-cols-[1fr_auto_auto] gap-2 items-end">
            <div>
              <div className="text-xs" style={{ color: COLORS.ink, opacity: 0.55 }}>
                {skillDraft._id ? "Edit Skill" : "New Skill"}
              </div>
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

      {/* Questions for selected skill (auto-uses latest set) */}
      <Card className="p-5">
        <SectionTitle
          hint="Step 2"
          title="Questions"
          right={
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
              <IconBtn title="Reload" onClick={() => activeSetId && loadQuestions(activeSetId)}><I.Refresh /></IconBtn>
            </div>
          }
        />

        {!selectedSkill ? (
          <Empty>Pick a skill to see its questions.</Empty>
        ) : loadingQ ? (
          <Empty>Loading questions…</Empty>
        ) : filteredQuestions.length === 0 ? (
          <Empty>No questions yet. Add below.</Empty>
        ) : (
          <div className="overflow-x-auto border rounded-xl" style={{ borderColor: "#E6E6E9" }}>
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
                {filteredQuestions.map((q, i) => (
                  <tr key={q._id} className="border-t hover:bg-slate-50" style={{ borderColor: "#E6E6E9" }}>
                    <td className="px-4 py-2">{i + 1}</td>
                    <td className="px-4 py-2">{q.question}</td>
                    <td className="px-4 py-2">{q.answer}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <IconBtn title="Edit" onClick={() => editQuestion(q)}><I.Edit /></IconBtn>
                        <IconBtn title="Delete" variant="danger" onClick={() => removeQ(q._id)}><I.Trash /></IconBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Composer */}
      <Card className="p-5">
        <SectionTitle
          hint={qDraft._id ? "Update" : "Create"}
          title={qDraft._id ? "Edit Question" : "Add Question"}
          right={<IconBtn title="New" onClick={newQuestion}><I.Plus /></IconBtn>}
        />
        {!selectedSkill ? (
          <Empty>Pick a skill first.</Empty>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
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
                    value={qDraft.options[i]}
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
      </Card>

      {/* Bulk Import / Export — Skill Questions */}
      <Card className="p-5">
        <SectionTitle
          hint="Tools"
          title="Bulk Import / Export — Skill Questions"
          right={
            <>
              <IconBtn title="Template" onClick={downloadTemplate}><I.Download /></IconBtn>
            </>
          }
        />

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <label className="text-sm bg-white border rounded-xl px-3 py-2 cursor-pointer" style={{ borderColor: "#E6E6E9" }}>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            {csvFile?.name ? (
              <span className="text-slate-700">{csvFile.name}</span>
            ) : (
              <span className="text-slate-500">Choose CSV…</span>
            )}
          </label>
          <IconBtn title="Import CSV" variant="primary" disabled={busy} onClick={importCSV}>
            {busy ? <I.Refresh /> : <I.Upload />}
          </IconBtn>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600">Export scope</span>
            <Select
              value={exportScope}
              onChange={(e) => setExportScope(e.target.value)}
              style={{ width: 180 }}
            >
              <option value="latest">Latest set only</option>
              <option value="allSets">All sets (selected skill)</option>
            </Select>
            <IconBtn title="Export CSV" onClick={exportCSV}><I.Download /></IconBtn>
          </div>
          <div className="text-xs text-slate-500">
            Import CSV columns: <code>question, opt1, opt2, opt3, opt4, answer</code> (or with leading <code>setId</code>—ignored).
          </div>
        </div>

        <div className="mt-3 border rounded-xl bg-slate-50 p-3 text-xs max-h-44 overflow-auto space-y-1" style={{ borderColor: "#E6E6E9" }}>
          {bulkLog.length === 0 ? (
            <div className="text-slate-500">No logs yet.</div>
          ) : (
            bulkLog.map((l, i) => <div key={i}>{l}</div>)
          )}
        </div>
      </Card>
    </div>
  );
}
