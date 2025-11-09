// src/pages/collab/index.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import API from "../../api/axios";
import {
  Plus, Users, Building2, Layers, MessageSquare, Paperclip, Loader2, Send,
  FileText, Clock, BarChart2, Shield, ChevronRight, CheckCircle2, XCircle
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

/* Brand */
const BRAND = { primary: "#145da0", dark: "#0c2d48", light: "#b1d4e0" };

/* ---------- Safe helpers ---------- */
const arr = (v) => (Array.isArray(v) ? v : []);
const cols = ["backlog", "discussion", "actions", "approvals"];
const stages = ["draft", "review", "negotiation", "approved", "active", "completed", "archived"];

/* ---------- Mini Card ---------- */
const Card = ({ className = "", children }) => (
  <div className={`bg-white rounded-2xl border shadow-sm ${className}`} style={{ borderColor: BRAND.light }}>
    {children}
  </div>
);

export default function CollabPage() {
  const { id: routeId } = useParams(); // optional: /collab/:id
  const navigate = useNavigate();

  const [loadingList, setLoadingList] = useState(true);
  const [list, setList] = useState([]);
  const [activeId, setActiveId] = useState(routeId || null);

  const [busyOne, setBusyOne] = useState(false);
  const [c, setC] = useState(null);

  const [showNew, setShowNew] = useState(false);
  const [startForm, setStartForm] = useState({
    title: "",
    counterpart: "",
    summary: "",
    effectiveDate: "",
    durationYears: 3,
  });

  const [kpis, setKpis] = useState(null);

  // Chat
  const [draftMsg, setDraftMsg] = useState("");
  const [msgBusy, setMsgBusy] = useState(false);
  const lastMsgRef = useRef(null);
  const pollRef = useRef(null);

  // New task
  const [taskBusy, setTaskBusy] = useState(false);
  const [newTask, setNewTask] = useState({ column: "backlog", title: "", assigneeRole: "both", due: "", notes: "" });

  // Docs
  const [docForm, setDocForm] = useState({ title: "", url: "" });
  const [docBusy, setDocBusy] = useState(false);

  /* ----------- Load list ----------- */
  const loadList = async () => {
    setLoadingList(true);
    try {
      const res = await API.get("/collab/list");
      setList(arr(res.data));
      // set first if none selected
      if (!activeId && res.data?.[0]?._id) {
        setActiveId(res.data[0]._id);
        navigate(`/collab/${res.data[0]._id}`, { replace: true });
      }
    } catch (e) {
      console.error("collab/list failed:", e?.response?.data || e.message);
      setList([]);
    } finally {
      setLoadingList(false);
    }
  };

  const loadOne = async (id) => {
    if (!id) return;
    setBusyOne(true);
    try {
      const res = await API.get(`/collab/${id}`);
      setC(res.data || null);
      // also pull KPIs
      const k = await API.get(`/collab/${id}/kpis`).then((r) => r.data).catch(() => null);
      setKpis(k);
      // reset chat poll anchor
      lastMsgRef.current = null;
    } catch (e) {
      console.error("open collab failed:", e?.response?.data || e.message);
      setC(null);
    } finally {
      setBusyOne(false);
    }
  };

  useEffect(() => { loadList(); }, []);
  useEffect(() => { if (activeId) loadOne(activeId); }, [activeId]);
  useEffect(() => { if (routeId && routeId !== activeId) setActiveId(routeId); }, [routeId]); // sync URL -> state

  /* ----------- Start collab (company role) ----------- */
  const start = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: startForm.title.trim(),
        counterpart: startForm.counterpart.trim(), // university username or email
        summary: startForm.summary.trim(),
        effectiveDate: startForm.effectiveDate || undefined,
        durationYears: Number(startForm.durationYears || 3),
      };
      if (!payload.title || !payload.counterpart) return;

      const res = await API.post("/collab/start", payload);
      setShowNew(false);
      setStartForm({ title: "", counterpart: "", summary: "", effectiveDate: "", durationYears: 3 });
      await loadList();
      if (res?.data?._id) {
        setActiveId(res.data._id);
        navigate(`/collab/${res.data._id}`, { replace: true });
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to start collaboration");
    }
  };

  /* ----------- Update stage/title/summary ----------- */
  const updateMeta = async (patch) => {
    if (!c?._id) return;
    try {
      const res = await API.patch(`/collab/${c._id}`, patch);
      setC(res.data || c);
      // also reflect in list
      setList((prev) => prev.map((x) => (x._id === c._id ? { ...x, title: res.data?.title || x.title, stage: res.data?.stage || x.stage } : x)));
    } catch (e) {
      alert(e?.response?.data?.message || "Update failed");
    }
  };

  /* ----------- Tasks ----------- */
  const addTask = async (e) => {
    e.preventDefault();
    if (!c?._id || !newTask.title.trim()) return;
    setTaskBusy(true);
    try {
      await API.post(`/collab/${c._id}/tasks`, {
        column: newTask.column,
        title: newTask.title.trim(),
        assigneeRole: newTask.assigneeRole,
        due: newTask.due || undefined,
        notes: newTask.notes || "",
      });
      setNewTask({ column: "backlog", title: "", assigneeRole: "both", due: "", notes: "" });
      await loadOne(c._id);
    } catch (e) {
      alert(e?.response?.data?.message || "Add task failed");
    } finally {
      setTaskBusy(false);
    }
  };
  const moveTask = async (taskId, toColumn) => {
    if (!c?._id || !taskId) return;
    try {
      await API.patch(`/collab/${c._id}/tasks/${taskId}`, { toColumn });
      await loadOne(c._id);
    } catch (e) {
      alert(e?.response?.data?.message || "Move task failed");
    }
  };
  const toggleTask = async (taskId, done) => {
    try {
      await API.patch(`/collab/${c._id}/tasks/${taskId}`, { done });
      await loadOne(c._id);
    } catch (e) {
      alert(e?.response?.data?.message || "Toggle task failed");
    }
  };

  /* ----------- Messages (poll) ----------- */
  const sendMsg = async () => {
    if (!c?._id || !draftMsg.trim()) return;
    setMsgBusy(true);
    try {
      await API.post(`/collab/${c._id}/messages`, { text: draftMsg.trim(), attachments: [] });
      setDraftMsg("");
      await loadOne(c._id);
    } catch (e) {
      alert(e?.response?.data?.message || "Message failed");
    } finally {
      setMsgBusy(false);
    }
  };

  const pollMessages = async () => {
    if (!c?._id) return;
    try {
      const qs = lastMsgRef.current ? `?since=${encodeURIComponent(lastMsgRef.current)}` : "";
      const res = await API.get(`/collab/${c._id}/messages${qs}`);
      const inc = arr(res.data);
      if (!inc.length) return;
      setC((prev) => ({ ...prev, messages: arr(prev?.messages).concat(inc) }));
      // anchor
      const last = inc[inc.length - 1];
      lastMsgRef.current = last?.createdAt || new Date().toISOString();
    } catch {
      // swallow
    }
  };

  useEffect(() => {
    if (!c?._id) return;
    // prime anchor
    const last = arr(c.messages).slice(-1)[0];
    lastMsgRef.current = last?.createdAt || null;

    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(pollMessages, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c?._id]);

  /* ----------- Docs ----------- */
  const addDoc = async (e) => {
    e.preventDefault();
    if (!c?._id || !docForm.title || !docForm.url) return;
    setDocBusy(true);
    try {
      await API.post(`/collab/${c._id}/docs`, { title: docForm.title.trim(), url: docForm.url.trim() });
      setDocForm({ title: "", url: "" });
      await loadOne(c._id);
    } catch (e) {
      alert(e?.response?.data?.message || "Add document failed");
    } finally {
      setDocBusy(false);
    }
  };
  const removeDoc = async (docId) => {
    try {
      await API.delete(`/collab/${c._id}/docs/${docId}`);
      await loadOne(c._id);
    } catch (e) {
      alert(e?.response?.data?.message || "Remove document failed");
    }
  };

  const board = useMemo(
    () => c?.board || { backlog: [], discussion: [], actions: [], approvals: [] },
    [c]
  );

  /* ----------- UI ----------- */
  return (
    <div className="min-h-[calc(100vh-64px)] p-4 md:p-6"
      style={{ backgroundImage: `radial-gradient(28rem 18rem at -10% -10%, ${BRAND.primary}10, transparent 55%), radial-gradient(22rem 16rem at 110% 110%, ${BRAND.primary}10, transparent 60%)` }}>
      <div className="max-w-[1200px] mx-auto grid lg:grid-cols-10 gap-6">
        {/* LEFT: list + start */}
        <aside className="lg:col-span-3">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg" style={{ color: BRAND.dark }}>Collaborations</h2>
              <button
                onClick={() => setShowNew(true)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-white hover:opacity-95"
                style={{ backgroundColor: BRAND.primary }}
                title="Start new collaboration (company)"
              >
                <Plus className="w-4 h-4" /> New
              </button>
            </div>

            <div className="mt-3 rounded-xl border overflow-hidden" style={{ borderColor: BRAND.light }}>
              {loadingList ? (
                <div className="p-4 text-sm text-gray-600 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </div>
              ) : list.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">No collaborations yet.</div>
              ) : (
                <ul className="divide-y" style={{ borderColor: BRAND.light }}>
                  {list.map((it) => (
                    <li key={it._id}>
                      <button
                        onClick={() => {
                          setActiveId(it._id);
                          navigate(`/collab/${it._id}`);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-slate-50 ${activeId === it._id ? "bg-[#b1d4e033]" : ""}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium" style={{ color: BRAND.dark }}>{it.title}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full border"
                                style={{ borderColor: BRAND.light, color: BRAND.dark }}>
                            {it.stage || "draft"}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1 flex items-center gap-2">
                          <Users className="w-3 h-3" />
                          {(it.university && it.university.name) || "University"}
                          <ChevronRight className="w-3 h-3 opacity-60" />
                          <Building2 className="w-3 h-3" />
                          {(it.company && it.company.name) || "Company"}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          {/* KPIs quick glance */}
          <Card className="mt-6 p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: BRAND.dark }}>
              <BarChart2 className="w-4 h-4" /> KPIs
            </h4>
            {!kpis ? (
              <div className="text-sm text-gray-500">—</div>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Kpi label="Internships (planned)" val={kpis.internships?.planned ?? 20} />
                <Kpi label="Internships (actual)" val={kpis.internships?.actual ?? 0} />
                <Kpi label="Skill Validations (planned)" val={kpis.skillValidations?.planned ?? 200} />
                <Kpi label="Skill Validations (actual)" val={kpis.skillValidations?.actual ?? 0} />
                <Kpi label="Webinars (planned)" val={kpis.webinars?.planned ?? 5} />
                <Kpi label="Webinars (actual)" val={kpis.webinars?.actual ?? 0} />
                <Kpi label="Research (planned)" val={kpis.research?.planned ?? 2} />
                <Kpi label="Research (actual)" val={kpis.research?.actual ?? 0} />
              </div>
            )}
          </Card>

          {/* Legal snapshot */}
          <Card className="mt-6 p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: BRAND.dark }}>
              <Shield className="w-4 h-4" /> Legal Snapshot
            </h4>
            {c?.legal ? (
              <ul className="text-sm text-gray-700 space-y-1">
                <li>Term: {c.legal.termYears} years</li>
                <li>NDA: {c.legal.nda ? "Yes" : "No"}</li>
                <li>Renewal: {c.legal.renewal || "—"}</li>
                <li>Termination: {c.legal.termination || "—"}</li>
                <li>Jurisdiction: {c.legal.jurisdiction || "—"}</li>
              </ul>
            ) : (
              <div className="text-sm text-gray-500">—</div>
            )}
          </Card>
        </aside>

        {/* RIGHT: Workspace */}
        <section className="lg:col-span-7">
          {!c ? (
            <Card className="p-10 grid place-items-center text-gray-600">
              {busyOne ? "Opening…" : "Select a collaboration…"}
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <Card className="p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold" style={{ color: BRAND.dark }}>{c.title}</h3>
                    <p className="text-sm text-gray-600">
                      {(c.company?.name || "Company")} ↔ {(c.university?.name || "University")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={c.stage || "draft"}
                      onChange={(e) => updateMeta({ stage: e.target.value })}
                      className="border rounded-lg px-3 py-2 text-sm"
                      style={{ borderColor: BRAND.light }}
                    >
                      {stages.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button
                      onClick={() => {
                        const t = prompt("Update title", c.title || "");
                        if (t != null) updateMeta({ title: t });
                      }}
                      className="px-3 py-2 rounded-lg border text-sm hover:bg-slate-50"
                      style={{ borderColor: BRAND.light }}
                    >
                      Rename
                    </button>
                  </div>
                </div>
                {c.summary ? (
                  <p className="mt-3 text-sm text-gray-700">{c.summary}</p>
                ) : (
                  <p className="mt-3 text-xs text-gray-500">Add a summary to share context with the counterpart.</p>
                )}
              </Card>

              {/* Board + Messages */}
              <div className="grid lg:grid-cols-3 gap-6">
                <Card className="p-5 lg:col-span-2">
                  <h4 className="font-semibold flex items-center gap-2 mb-3" style={{ color: BRAND.dark }}>
                    <Layers className="w-4 h-4" /> Collaboration Board
                  </h4>
                  <Board board={board} onMove={moveTask} onToggleDone={toggleTask} />
                  <form onSubmit={addTask} className="mt-4 grid md:grid-cols-5 gap-2 bg-[#b1d4e01a] rounded-lg p-3">
                    <input
                      className="border rounded-lg px-3 py-2 md:col-span-2"
                      style={{ borderColor: BRAND.light }}
                      placeholder="Task title"
                      value={newTask.title}
                      onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))}
                    />
                    <select
                      className="border rounded-lg px-3 py-2"
                      style={{ borderColor: BRAND.light }}
                      value={newTask.column}
                      onChange={(e) => setNewTask((p) => ({ ...p, column: e.target.value }))}
                    >
                      {cols.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select
                      className="border rounded-lg px-3 py-2"
                      style={{ borderColor: BRAND.light }}
                      value={newTask.assigneeRole}
                      onChange={(e) => setNewTask((p) => ({ ...p, assigneeRole: e.target.value }))}
                    >
                      <option value="both">Both</option>
                      <option value="company">Company</option>
                      <option value="university">University</option>
                    </select>
                    <button disabled={taskBusy || !newTask.title.trim()} className="rounded-lg px-3 py-2 text-white"
                      style={{ backgroundColor: BRAND.primary }}>
                      {taskBusy ? "Adding…" : "Add Task"}
                    </button>
                  </form>
                </Card>

                <Card className="p-5">
                  <h4 className="font-semibold flex items-center gap-2 mb-3" style={{ color: BRAND.dark }}>
                    <MessageSquare className="w-4 h-4" /> Messages
                  </h4>
                  <div className="space-y-3 max-h-80 overflow-auto pr-2">
                    {arr(c.messages).length === 0 && (
                      <div className="text-sm text-gray-500">No messages yet.</div>
                    )}
                    {arr(c.messages).slice().reverse().map((m) => (
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
                  </div>

                  <div className="mt-3 flex gap-2">
                    <input
                      className="border rounded-lg px-3 py-2 flex-1"
                      style={{ borderColor: BRAND.light }}
                      placeholder="Write a message…"
                      value={draftMsg}
                      onChange={(e) => setDraftMsg(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                    />
                    <button onClick={sendMsg} disabled={msgBusy || !draftMsg.trim()}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-white"
                      style={{ backgroundColor: BRAND.primary }}>
                      <Send className="w-4 h-4" /> Send
                    </button>
                  </div>
                </Card>
              </div>

              {/* Docs + Timeline */}
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="p-5">
                  <h4 className="font-semibold flex items-center gap-2 mb-3" style={{ color: BRAND.dark }}>
                    <FileText className="w-4 h-4" /> Documents
                  </h4>
                  <form onSubmit={addDoc} className="grid md:grid-cols-3 gap-2 mb-3">
                    <input
                      className="border rounded-lg px-3 py-2 md:col-span-1"
                      style={{ borderColor: BRAND.light }}
                      placeholder="Title"
                      value={docForm.title}
                      onChange={(e) => setDocForm((p) => ({ ...p, title: e.target.value }))}
                    />
                    <input
                      className="border rounded-lg px-3 py-2 md:col-span-1"
                      style={{ borderColor: BRAND.light }}
                      placeholder="URL (PDF/Doc link)"
                      value={docForm.url}
                      onChange={(e) => setDocForm((p) => ({ ...p, url: e.target.value }))}
                    />
                    <button disabled={docBusy || !docForm.title || !docForm.url}
                      className="rounded-lg px-3 py-2 text-white"
                      style={{ backgroundColor: BRAND.primary }}>
                      {docBusy ? "Adding…" : "Add"}
                    </button>
                  </form>

                  {arr(c.docs).length === 0 ? (
                    <div className="text-sm text-gray-500">No documents yet.</div>
                  ) : (
                    <ul className="space-y-2">
                      {c.docs.map((d) => (
                        <li key={d._id} className="rounded-lg border p-3 flex items-center justify-between"
                            style={{ borderColor: BRAND.light }}>
                          <div>
                            <div className="font-medium text-sm">{d.title}</div>
                            <a href={d.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 break-all">
                              {d.url}
                            </a>
                            <div className="text-[11px] text-gray-500 mt-1">
                              Added by {d.addedBy} • {new Date(d.addedAt || d.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <button
                            onClick={() => removeDoc(d._id)}
                            className="text-sm px-2 py-1 rounded border hover:bg-slate-50"
                            style={{ borderColor: BRAND.light }}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>

                <Card className="p-5">
                  <h4 className="font-semibold flex items-center gap-2 mb-3" style={{ color: BRAND.dark }}>
                    <Clock className="w-4 h-4" /> Timeline
                  </h4>
                  <div className="space-y-2 max-h-72 overflow-auto pr-2">
                    {arr(c.timeline).length === 0 && <div className="text-sm text-gray-500">No events yet.</div>}
                    {arr(c.timeline).slice().reverse().map((t, idx) => (
                      <div key={idx} className="text-sm">
                        <span className="text-gray-700 font-medium">{t.type}</span>
                        <span className="text-gray-500"> • {new Date(t.at).toLocaleString()}</span>
                        {t.by ? <span className="text-gray-500"> • by {t.by}</span> : null}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Start Collaboration (company) */}
      {showNew && (
        <div className="fixed inset-0 z-50 bg-black/30 grid place-items-center p-4">
          <form onSubmit={start} className="w-full max-w-xl bg-white rounded-2xl p-6 shadow-xl border"
                style={{ borderColor: BRAND.light }}>
            <h3 className="text-lg font-semibold" style={{ color: BRAND.dark }}>Start a Collaboration</h3>
            <p className="text-xs text-gray-600 mt-1">Use <b>University username</b> or registered <b>email</b> as counterpart.</p>

            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              <input
                className="border rounded-lg px-3 py-2 sm:col-span-2"
                style={{ borderColor: BRAND.light }}
                placeholder="Title (e.g., Campus Hiring 2026 – Software Engineering)"
                value={startForm.title}
                onChange={(e) => setStartForm((p) => ({ ...p, title: e.target.value }))}
                required
              />
              <input
                className="border rounded-lg px-3 py-2 sm:col-span-2"
                style={{ borderColor: BRAND.light }}
                placeholder="Counterpart (University username or Email)"
                value={startForm.counterpart}
                onChange={(e) => setStartForm((p) => ({ ...p, counterpart: e.target.value }))}
                required
              />
              <input
                className="border rounded-lg px-3 py-2"
                style={{ borderColor: BRAND.light }}
                type="date"
                value={startForm.effectiveDate}
                onChange={(e) => setStartForm((p) => ({ ...p, effectiveDate: e.target.value }))}
              />
              <input
                className="border rounded-lg px-3 py-2"
                style={{ borderColor: BRAND.light }}
                type="number"
                min={1}
                max={10}
                placeholder="Duration (years)"
                value={startForm.durationYears}
                onChange={(e) => setStartForm((p) => ({ ...p, durationYears: e.target.value }))}
              />
              <textarea
                rows={3}
                className="border rounded-lg px-3 py-2 sm:col-span-2"
                style={{ borderColor: BRAND.light }}
                placeholder="Short summary (optional)"
                value={startForm.summary}
                onChange={(e) => setStartForm((p) => ({ ...p, summary: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2 rounded-lg border"
                      style={{ borderColor: BRAND.light }}>
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

/* ---------- Small bits ---------- */
function Kpi({ label, val }) {
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: BRAND.light }}>
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className="text-base font-semibold" style={{ color: BRAND.dark }}>{val}</div>
    </div>
  );
}

function Board({ board, onMove, onToggleDone }) {
  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
      {cols.map((cKey) => {
        const tasks = arr(board?.[cKey]);
        return (
          <div key={cKey} className="rounded-xl border p-3 bg-white" style={{ borderColor: BRAND.light }}>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-sm font-semibold" style={{ color: BRAND.dark }}>{cKey}</h5>
              <span className="text-[11px] text-gray-500">{tasks.length}</span>
            </div>
            <div className="space-y-2">
              {tasks.length === 0 && <div className="text-xs text-gray-500">Empty</div>}
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
                      title={t.done ? "Mark as not done" : "Mark as done"}
                    >
                      {t.done ? <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Done</span> : "Mark Done"}
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {cols.map((dest) => (dest !== cKey) && (
                      <button key={dest}
                        onClick={() => onMove?.(t._id, dest)}
                        className="text-[11px] px-2 py-1 rounded border hover:bg-slate-50"
                        style={{ borderColor: BRAND.light }}>
                        → {dest}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
