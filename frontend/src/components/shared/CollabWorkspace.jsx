// src/components/shared/CollabWorkspace.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Plus, Users, Building2, Layers, MessageSquare, Paperclip, Loader2, Search, ChevronLeft, ChevronRight,
  Clock, FileText, CheckCircle2, Shield, CalendarDays, Scale, Target, ClipboardList, Sparkles, Send,
} from "lucide-react";
import {
  listCollabs, startCollab, getCollab, patchCollab,
  addTask as apiAddTask, updateTask as apiUpdateTask, sendMessage as apiSendMessage,
} from "../../api/collab";

const BRAND = { primary: "#145da0", dark: "#0c2d48", light: "#b1d4e0" };

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl border shadow-sm ${className}`} style={{ borderColor: BRAND.light }}>
    {children}
  </div>
);

const SectionTitle = ({ icon: Icon, title }) => (
  <h4 className="font-semibold flex items-center gap-2 mb-3" style={{ color: BRAND.dark }}>
    <Icon className="w-4 h-4" /> {title}
  </h4>
);

export default function CollabWorkspace({ mode = "university", collabId: collabIdProp = null }) {
  // Sidebar list state (pagination)
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  // Active collab
  const [activeId, setActiveId] = useState(collabIdProp);
  const [collab, setCollab] = useState(null);
  const [loadingOne, setLoadingOne] = useState(false);

  // Modals & forms
  const [openStart, setOpenStart] = useState(false);
  const [startForm, setStartForm] = useState({ title: "", counterpart: "", summary: "" });

  // Board
  const board = useMemo(
    () => (collab?.board || { backlog: [], discussion: [], actions: [], approvals: [] }),
    [collab]
  );
  const [addingTask, setAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({ column: "backlog", title: "", assigneeRole: "both", due: "", notes: "" });

  // Chat (polling)
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const chatTimer = useRef(null);

  // MoU tabs
  const [mouTab, setMouTab] = useState("overview");
  const mou = collab?.mou || {};
  const setMouField = (path, value) => {
    // Update local immediately for responsiveness
    setCollab((p) => {
      const next = { ...(p || {}), mou: { ...(p?.mou || {}) } };
      // dot path setter
      const segs = path.split(".");
      let t = next.mou;
      for (let i = 0; i < segs.length - 1; i++) {
        t[segs[i]] = t[segs[i]] || {};
        t = t[segs[i]];
      }
      t[segs[segs.length - 1]] = value;
      return next;
    });
  };

  const fetchList = useCallback(async () => {
    setLoadingList(true);
    try {
      const { items, total, page: pg } = await listCollabs({ page, pageSize, q });
      setRows(items);
      setTotal(total);
      // default select first only if none selected
      if (!activeId && items[0]?._id) setActiveId(items[0]._id);
    } catch (e) {
      console.error("collab/list failed:", e?.response?.data || e.message);
      setRows([]); setTotal(0);
    } finally {
      setLoadingList(false);
    }
  }, [page, pageSize, q, activeId]);

  const fetchOne = useCallback(async (id) => {
    if (!id) { setCollab(null); return; }
    setLoadingOne(true);
    try {
      const data = await getCollab(id);
      setCollab(data || null);
    } catch (e) {
      console.error("collab open failed:", e?.response?.data || e.message);
      setCollab(null);
    } finally {
      setLoadingOne(false);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);
  useEffect(() => { if (activeId) fetchOne(activeId); }, [activeId, fetchOne]);

  // Poll chat every 6s when a collab is open
  useEffect(() => {
    if (!activeId) return;
    chatTimer.current && clearInterval(chatTimer.current);
    chatTimer.current = setInterval(() => fetchOne(activeId), 6000);
    return () => { chatTimer.current && clearInterval(chatTimer.current); };
  }, [activeId, fetchOne]);

  // Start collab
  const onStart = async (e) => {
    e.preventDefault();
    if (!startForm.title.trim() || !startForm.counterpart.trim()) return;
    try {
      const created = await startCollab({
        title: startForm.title.trim(),
        counterpart: startForm.counterpart.trim(),
        summary: startForm.summary.trim(),
      });
      setOpenStart(false);
      setStartForm({ title: "", counterpart: "", summary: "" });
      setPage(1);
      await fetchList();
      setActiveId(created?._id || null);
    } catch (e2) {
      alert(e2?.response?.data?.message || "Failed to start");
    }
  };

  // Stage update
  const setStage = async (stage) => {
    if (!collab?._id) return;
    try {
      const fresh = await patchCollab(collab._id, { stage });
      setCollab(fresh);
      // update list row stage
      setRows((prev) => prev.map((r) => (r._id === fresh._id ? { ...r, stage: fresh.stage } : r)));
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to update stage");
    }
  };

  // Save MoU
  const saveMou = async () => {
    if (!collab?._id) return;
    try {
      const fresh = await patchCollab(collab._id, { mou: collab.mou || {} });
      setCollab(fresh);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to save MoU");
    }
  };

  // Tasks
  const addTask = async (e) => {
    e.preventDefault();
    if (!collab?._id || !newTask.title.trim()) return;
    setAddingTask(true);
    try {
      await apiAddTask(collab._id, {
        column: newTask.column,
        title: newTask.title.trim(),
        assigneeRole: newTask.assigneeRole,
        due: newTask.due || undefined,
        notes: newTask.notes || "",
      });
      setNewTask({ column: "backlog", title: "", assigneeRole: "both", due: "", notes: "" });
      await fetchOne(collab._id);
    } catch (e2) {
      alert(e2?.response?.data?.message || "Add task failed");
    } finally { setAddingTask(false); }
  };
  const moveTask = async (taskId, toColumn) => {
    try {
      await apiUpdateTask(collab._id, taskId, { toColumn });
      await fetchOne(collab._id);
    } catch (e) {
      alert(e?.response?.data?.message || "Move task failed");
    }
  };
  const toggleDone = async (taskId, done) => {
    try {
      await apiUpdateTask(collab._id, taskId, { done });
      await fetchOne(collab._id);
    } catch (e) {
      alert(e?.response?.data?.message || "Update task failed");
    }
  };

  // Messages
  const onSend = async () => {
    if (!collab?._id || !draft.trim()) return;
    setSending(true);
    try {
      await apiSendMessage(collab._id, { text: draft.trim(), attachments: [] });
      setDraft("");
      await fetchOne(collab._id);
    } catch (e) {
      alert(e?.response?.data?.message || "Message failed");
    } finally { setSending(false); }
  };

  // Pagination helpers
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="grid lg:grid-cols-10 gap-6">
      {/* SIDELIST */}
      <aside className="lg:col-span-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg" style={{ color: BRAND.dark }}>Collaborations</h2>
            <button
              onClick={() => setOpenStart(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-white"
              style={{ backgroundColor: BRAND.primary }}
            >
              <Plus className="w-4 h-4" /> New
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-lg p-2 border bg-white" style={{ borderColor: BRAND.light }}>
            <Search className="w-4 h-4 text-gray-600" />
            <input
              className="bg-transparent flex-1 outline-none text-sm"
              placeholder="Search by title, party…"
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
            />
          </div>

          <div className="mt-3 rounded-xl border overflow-hidden" style={{ borderColor: BRAND.light }}>
            {loadingList ? (
              <div className="p-4 text-sm text-gray-600 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            ) : rows.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No collaborations found.</div>
            ) : (
              <ul className="divide-y" style={{ borderColor: BRAND.light }}>
                {rows.map((it) => (
                  <li key={it._id}>
                    <button
                      onClick={() => setActiveId(it._id)}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-50 ${activeId === it._id ? "bg-[#b1d4e033]" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium" style={{ color: BRAND.dark }}>{it.title}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full border"
                              style={{ borderColor: BRAND.light, color: BRAND.dark }}>
                          {it.stage || "draft"}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        <Users className="inline w-3 h-3 mr-1" />
                        {it.university?.name || "University"} ·
                        <Building2 className="inline w-3 h-3 mx-1" />
                        {it.company?.name || "Company"}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Pagination */}
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-gray-600">
              Page {page} / {totalPages} · {total} total
            </div>
            <div className="flex gap-2">
              <button
                className="px-2 py-1 rounded border disabled:opacity-40"
                style={{ borderColor: BRAND.light }}
                disabled={!canPrev}
                onClick={() => canPrev && setPage((p) => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                className="px-2 py-1 rounded border disabled:opacity-40"
                style={{ borderColor: BRAND.light }}
                disabled={!canNext}
                onClick={() => canNext && setPage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Card>
      </aside>

      {/* WORKSPACE */}
      <section className="lg:col-span-7 space-y-6">
        {!activeId ? (
          <Card className="p-10 grid place-items-center text-gray-600">Select or create a collaboration…</Card>
        ) : loadingOne ? (
          <Card className="p-10 grid place-items-center text-gray-600">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Opening…
          </Card>
        ) : !collab ? (
          <Card className="p-10 grid place-items-center text-red-600">Unable to open collaboration.</Card>
        ) : (
          <>
            {/* Header */}
            <Card className="p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold" style={{ color: BRAND.dark }}>{collab.title}</h3>
                  <p className="text-sm text-gray-600">
                    {(collab.company?.name || "Company")} ↔ {(collab.university?.name || "University")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={collab.stage || "draft"}
                    onChange={(e) => setStage(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm"
                    style={{ borderColor: BRAND.light }}
                  >
                    {["draft","review","negotiation","approved","active","completed","archived"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    onClick={saveMou}
                    className="px-3 py-2 rounded-lg text-white text-sm"
                    style={{ backgroundColor: BRAND.primary }}
                  >
                    Save MoU
                  </button>
                </div>
              </div>
              {collab.summary ? (
                <p className="mt-3 text-sm text-gray-700">{collab.summary}</p>
              ) : (
                <p className="mt-3 text-xs text-gray-500">Add a summary to share context with your counterpart.</p>
              )}
            </Card>

            {/* MoU Builder */}
            <Card className="p-5">
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  {key:"overview",label:"1) Overview",icon:FileText},
                  {key:"objective",label:"2) Objectives",icon:Target},
                  {key:"scope",label:"3) Scope",icon:ClipboardList},
                  {key:"benefits",label:"4) Student Benefits",icon:Sparkles},
                  {key:"operations",label:"5) Operational Framework",icon:CalendarDays},
                  {key:"kpis",label:"6) Deliverables & KPIs",icon:CheckCircle2},
                  {key:"legal",label:"7) Legal Clauses",icon:Shield},
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setMouTab(t.key)}
                    className={`text-sm px-3 py-2 rounded-lg border ${mouTab===t.key?"bg-[#b1d4e033]":""}`}
                    style={{ borderColor: BRAND.light }}
                  >
                    <t.icon className="inline w-4 h-4 mr-2" /> {t.label}
                  </button>
                ))}
              </div>

              {mouTab === "overview" && (
                <div className="grid md:grid-cols-2 gap-3">
                  <input className="border rounded-lg px-3 py-2" style={{ borderColor: BRAND.light }}
                         placeholder="MoU Title (e.g., Industry–Academia Collaboration / MoU...)"
                         value={mou.title || ""}
                         onChange={(e) => setMouField("title", e.target.value)} />
                  <input className="border rounded-lg px-3 py-2" style={{ borderColor: BRAND.light }}
                         placeholder="Effective Date (YYYY-MM-DD)"
                         value={mou.effectiveDate || ""}
                         onChange={(e) => setMouField("effectiveDate", e.target.value)} />
                  <input className="border rounded-lg px-3 py-2" style={{ borderColor: BRAND.light }}
                         placeholder="Duration (e.g., 3 years, renewable)"
                         value={mou.duration || ""}
                         onChange={(e) => setMouField("duration", e.target.value)} />
                  <input className="border rounded-lg px-3 py-2" style={{ borderColor: BRAND.light }}
                         placeholder="Company Representative"
                         value={mou.companyRep || ""}
                         onChange={(e) => setMouField("companyRep", e.target.value)} />
                  <input className="border rounded-lg px-3 py-2" style={{ borderColor: BRAND.light }}
                         placeholder="University Representative"
                         value={mou.universityRep || ""}
                         onChange={(e) => setMouField("universityRep", e.target.value)} />
                </div>
              )}

              {mouTab === "objective" && (
                <div className="space-y-2">
                  <textarea className="border rounded-lg px-3 py-2 w-full min-h-[120px]" style={{ borderColor: BRAND.light }}
                            placeholder="Objectives (bridge industry–academia gap, internships, live projects, AI-driven skill validation, research & hackathons, FDPs & guest lectures, curriculum development…) "
                            value={mou.objectives || ""}
                            onChange={(e) => setMouField("objectives", e.target.value)} />
                </div>
              )}

              {mouTab === "scope" && (
                <div className="grid md:grid-cols-3 gap-3">
                  <textarea className="border rounded-lg px-3 py-2 min-h-[120px]" style={{ borderColor: BRAND.light }}
                            placeholder="Company scope: internships/placements, workshops, mentoring, industry trends, access to verified talent…"
                            value={mou.scopeCompany || ""}
                            onChange={(e) => setMouField("scopeCompany", e.target.value)} />
                  <textarea className="border rounded-lg px-3 py-2 min-h-[120px]" style={{ borderColor: BRAND.light }}
                            placeholder="University scope: student participation, coordinator nomination, integrate skill courses, infra support…"
                            value={mou.scopeUniversity || ""}
                            onChange={(e) => setMouField("scopeUniversity", e.target.value)} />
                  <textarea className="border rounded-lg px-3 py-2 min-h-[120px]" style={{ borderColor: BRAND.light }}
                            placeholder="Joint responsibilities: annual calendars, events & drives, periodic reports…"
                            value={mou.scopeJoint || ""}
                            onChange={(e) => setMouField("scopeJoint", e.target.value)} />
                </div>
              )}

              {mouTab === "benefits" && (
                <div className="space-y-2">
                  <textarea className="border rounded-lg px-3 py-2 w-full min-h-[120px]" style={{ borderColor: BRAND.light }}
                            placeholder="Student benefits: verified digital credentials, internships/placements, AI career roadmap & skill tests, live projects, guidance sessions & webinars…"
                            value={mou.benefits || ""}
                            onChange={(e) => setMouField("benefits", e.target.value)} />
                </div>
              )}

              {mouTab === "operations" && (
                <div className="grid md:grid-cols-3 gap-3">
                  <input className="border rounded-lg px-3 py-2" style={{ borderColor: BRAND.light }}
                         placeholder="Nodal officer (Company)"
                         value={mou.nodalCompany || ""}
                         onChange={(e) => setMouField("nodalCompany", e.target.value)} />
                  <input className="border rounded-lg px-3 py-2" style={{ borderColor: BRAND.light }}
                         placeholder="Nodal officer (University)"
                         value={mou.nodalUniversity || ""}
                         onChange={(e) => setMouField("nodalUniversity", e.target.value)} />
                  <input className="border rounded-lg px-3 py-2" style={{ borderColor: BRAND.light }}
                         placeholder="Implementation mode (e.g., StudentConnect dashboards)"
                         value={mou.implementation || ""}
                         onChange={(e) => setMouField("implementation", e.target.value)} />
                  <input className="border rounded-lg px-3 py-2 md:col-span-3" style={{ borderColor: BRAND.light }}
                         placeholder="Review schedule (e.g., quarterly) & performance reports (e.g., monthly analytics)"
                         value={mou.review || ""}
                         onChange={(e) => setMouField("review", e.target.value)} />
                </div>
              )}

              {mouTab === "kpis" && (
                <div className="grid md:grid-cols-4 gap-3">
                  <KpiInput label="Internship (min/year)" value={mou.kpiInternship || ""} onChange={(v)=>setMouField("kpiInternship", v)} />
                  <KpiInput label="Skill Validation (students/year)" value={mou.kpiSkillValidation || ""} onChange={(v)=>setMouField("kpiSkillValidation", v)} />
                  <KpiInput label="Webinars (per semester)" value={mou.kpiWebinars || ""} onChange={(v)=>setMouField("kpiWebinars", v)} />
                  <KpiInput label="Research (projects/year)" value={mou.kpiResearch || ""} onChange={(v)=>setMouField("kpiResearch", v)} />
                </div>
              )}

              {mouTab === "legal" && (
                <div className="space-y-2">
                  <textarea className="border rounded-lg px-3 py-2 w-full min-h-[140px]" style={{ borderColor: BRAND.light }}
                            placeholder="Legal / Administrative: confidentiality, no financial liability unless agreed, term & renewal, termination (30 days), jurisdiction & dispute resolution…"
                            value={mou.legal || ""}
                            onChange={(e) => setMouField("legal", e.target.value)} />
                </div>
              )}
            </Card>

            {/* Board + Messages */}
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="p-5 lg:col-span-2">
                <SectionTitle icon={Layers} title="Project Board" />
                <Board board={board} onMove={moveTask} onToggleDone={toggleDone} />
                <form onSubmit={addTask} className="mt-4 grid md:grid-cols-5 gap-2 bg-[#b1d4e01a] rounded-lg p-3">
                  <input className="border rounded-lg px-3 py-2 md:col-span-2" style={{ borderColor: BRAND.light }}
                         placeholder="Task title"
                         value={newTask.title}
                         onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))} />
                  <select className="border rounded-lg px-3 py-2" style={{ borderColor: BRAND.light }}
                          value={newTask.column}
                          onChange={(e) => setNewTask((p) => ({ ...p, column: e.target.value }))}>
                    <option value="backlog">Backlog</option>
                    <option value="discussion">Discussion</option>
                    <option value="actions">Actions</option>
                    <option value="approvals">Approvals</option>
                  </select>
                  <select className="border rounded-lg px-3 py-2" style={{ borderColor: BRAND.light }}
                          value={newTask.assigneeRole}
                          onChange={(e) => setNewTask((p) => ({ ...p, assigneeRole: e.target.value }))}>
                    <option value="both">Both</option>
                    <option value="company">Company</option>
                    <option value="university">University</option>
                  </select>
                  <button disabled={addingTask || !newTask.title.trim()}
                          className="rounded-lg px-3 py-2 text-white"
                          style={{ backgroundColor: BRAND.primary }}>
                    {addingTask ? "Adding…" : "Add Task"}
                  </button>
                </form>
              </Card>

              <Card className="p-5">
                <SectionTitle icon={MessageSquare} title="Messages" />
                <div className="space-y-3 max-h-80 overflow-auto pr-2">
                  {(collab?.messages || []).slice().reverse().map((m) => (
                    <div key={m._id} className="rounded-lg border p-3" style={{ borderColor: BRAND.light }}>
                      <div className="text-xs text-gray-500">
                        {m.authorName || m.authorRole} • {new Date(m.createdAt || m.updatedAt || Date.now()).toLocaleString()}
                      </div>
                      <div className="text-sm mt-1">{m.text}</div>
                      {Array.isArray(m.attachments) && m.attachments.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-blue-600 mt-2">
                          <Paperclip className="w-3 h-3" /> {m.attachments.length} attachment(s)
                        </div>
                      )}
                    </div>
                  ))}
                  {(collab?.messages || []).length === 0 && (
                    <div className="text-sm text-gray-500">No messages yet.</div>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <input
                    className="border rounded-lg px-3 py-2 flex-1"
                    style={{ borderColor: BRAND.light }}
                    placeholder="Write a message…"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
                  />
                  <button
                    onClick={onSend}
                    disabled={sending || !draft.trim()}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-white"
                    style={{ backgroundColor: BRAND.primary }}
                  >
                    <Send className="w-4 h-4" /> Send
                  </button>
                </div>
              </Card>
            </div>

            {/* Timeline / Docs place-holders (safe & simple) */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="p-5">
                <SectionTitle icon={Clock} title="Timeline" />
                <div className="space-y-2 max-h-60 overflow-auto pr-2">
                  {(collab?.timeline || []).slice().reverse().map((t, idx) => (
                    <div key={idx} className="text-sm">
                      <span className="text-gray-700 font-medium">{t.type}</span>
                      <span className="text-gray-500"> • {new Date(t.at).toLocaleString()}</span>
                      {t.by ? <span className="text-gray-500"> • by {t.by}</span> : null}
                    </div>
                  ))}
                  {(collab?.timeline || []).length === 0 && <div className="text-sm text-gray-500">No events yet.</div>}
                </div>
              </Card>

              <Card className="p-5">
                <SectionTitle icon={FileText} title="Documents" />
                <p className="text-sm text-gray-500">
                  For now, paste secure links in Messages (Drive/SharePoint/etc.). If you have a signed upload URL API,
                  we can hook native uploads in minutes.
                </p>
              </Card>
            </div>
          </>
        )}
      </section>

      {/* Start modal */}
      {openStart && (
        <div className="fixed inset-0 z-50 bg-black/30 grid place-items-center p-4">
          <form onSubmit={onStart} className="w-full max-w-xl bg-white rounded-2xl p-6 shadow-xl border" style={{ borderColor: BRAND.light }}>
            <h3 className="text-lg font-semibold" style={{ color: BRAND.dark }}>Start a Collaboration</h3>
            <p className="text-xs text-gray-600 mt-1">
              Enter the <b>University Username</b> or registered <b>email</b> in “Counterpart”.
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              <input className="border rounded-lg px-3 py-2 sm:col-span-2" style={{ borderColor: BRAND.light }}
                     placeholder="Title (e.g., Campus Hiring 2026 – Software Engineering)"
                     value={startForm.title}
                     onChange={(e) => setStartForm((p) => ({ ...p, title: e.target.value }))} required />
              <input className="border rounded-lg px-3 py-2 sm:col-span-2" style={{ borderColor: BRAND.light }}
                     placeholder="Counterpart (University username or Email)"
                     value={startForm.counterpart}
                     onChange={(e) => setStartForm((p) => ({ ...p, counterpart: e.target.value }))} required />
              <textarea rows={3} className="border rounded-lg px-3 py-2 sm:col-span-2" style={{ borderColor: BRAND.light }}
                        placeholder="Short summary (optional)"
                        value={startForm.summary}
                        onChange={(e) => setStartForm((p) => ({ ...p, summary: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" onClick={() => setOpenStart(false)} className="px-4 py-2 rounded-lg border" style={{ borderColor: BRAND.light }}>
                Cancel
              </button>
              <button className="px-4 py-2 rounded-lg text-white" style={{ backgroundColor: BRAND.primary }}>
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function KpiInput({ label, value, onChange }) {
  return (
    <label className="text-sm">
      <span className="block text-xs text-gray-600 mb-1">{label}</span>
      <input className="border rounded-lg px-3 py-2 w-full" style={{ borderColor: BRAND.light }}
             value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Board({ board, onMove, onToggleDone }) {
  const cols = [
    { key: "backlog", label: "Backlog" },
    { key: "discussion", label: "Discussion" },
    { key: "actions", label: "Actions" },
    { key: "approvals", label: "Approvals" },
  ];
  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
      {cols.map((c) => {
        const tasks = Array.isArray(board?.[c.key]) ? board[c.key] : [];
        return (
          <div key={c.key} className="rounded-xl border p-3 bg-white" style={{ borderColor: BRAND.light }}>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-sm font-semibold" style={{ color: BRAND.dark }}>{c.label}</h5>
              <span className="text-[11px] text-gray-500">{tasks.length}</span>
            </div>
            <div className="space-y-2">
              {tasks.map((t) => (
                <div key={t._id} className="rounded-lg border p-3" style={{ borderColor: BRAND.light }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-sm">{t.title}</div>
                      <div className="text-[11px] text-gray-600 mt-1">
                        {t.assigneeRole || "both"} {t.due ? `• due ${new Date(t.due).toLocaleDateString()}` : ""}
                      </div>
                      {t.notes ? <div className="text-xs text-gray-700 mt-1">{t.notes}</div> : null}
                    </div>
                    <button
                      onClick={() => onToggleDone?.(t._id, !t.done)}
                      className={`px-2 py-1 rounded text-xs border ${t.done ? "text-emerald-700 border-emerald-200" : "text-gray-700"}`}
                    >
                      {t.done ? "Done" : "Mark Done"}
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {["backlog","discussion","actions","approvals"].map((dest) => (
                      dest !== c.key && (
                        <button key={dest}
                                onClick={() => onMove?.(t._id, dest)}
                                className="text-[11px] px-2 py-1 rounded border hover:bg-slate-50"
                                style={{ borderColor: BRAND.light }}>
                          → {dest}
                        </button>
                      )
                    ))}
                  </div>
                </div>
              ))}
              {tasks.length === 0 && <div className="text-xs text-gray-500">Empty</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
