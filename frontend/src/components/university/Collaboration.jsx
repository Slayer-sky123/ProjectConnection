// src/components/university/Collaboration.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import API from "../../api/axios";
import {
  Plus, Users, Layers, MessageSquare, FileText, CheckCircle2, Clock,
  Paperclip, UploadCloud, Send, Loader2, Edit3
} from "lucide-react";

const BRAND = { primary: "#145da0", dark: "#0c2d48", light: "#b1d4e0" };

const Card = ({ className = "", children }) => (
  <div className={`bg-white rounded-2xl border shadow-sm ${className}`} style={{ borderColor: BRAND.light }}>
    {children}
  </div>
);

export default function Collaboration() {
  // list & selected
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [collab, setCollab] = useState(null);

  // start modal
  const [openStart, setOpenStart] = useState(false);
  const [startForm, setStartForm] = useState({ title: "", counterpart: "", summary: "" });

  // MoU edit
  const [editMou, setEditMou] = useState(false);
  const [mouDraft, setMouDraft] = useState(null);
  const [savingMou, setSavingMou] = useState(false);
  const [signBusy, setSignBusy] = useState(false);

  // board & chat
  const [addTask, setAddTask] = useState({ column: "backlog", title: "", assigneeRole: "university", due: "", notes: "" });
  const [addingTask, setAddingTask] = useState(false);
  const [draftMsg, setDraftMsg] = useState("");
  const [msgBusy, setMsgBusy] = useState(false);
  const chatEndRef = useRef(null);

  const safeBoard = collab?.board && typeof collab.board === "object" ? collab.board : {};
  const board = useMemo(
    () => ({
      backlog: Array.isArray(safeBoard.backlog) ? safeBoard.backlog : [],
      discussion: Array.isArray(safeBoard.discussion) ? safeBoard.discussion : [],
      actions: Array.isArray(safeBoard.actions) ? safeBoard.actions : [],
      approvals: Array.isArray(safeBoard.approvals) ? safeBoard.approvals : [],
    }),
    [safeBoard]
  );

  const messages = Array.isArray(collab?.messages) ? collab.messages : [];
  const rawTimeline = Array.isArray(collab?.timeline) ? collab.timeline : [];
  const timeline = rawTimeline.map(t => ({
    type: t?.type || "event",
    at: t?.at ? t.at : Date.now(),
    by: t?.by || "",
    note: t?.note || "",
  }));

  const mou = collab?.mou && typeof collab.mou === "object" ? collab.mou : {};
  const signatures = mou?.signatures && typeof mou.signatures === "object"
    ? mou.signatures
    : { company: {}, university: {} };

  // -------- data --------
  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await API.get("/collab/list");
      const rows = Array.isArray(res.data) ? res.data : [];
      setItems(rows);
      if (!activeId && rows[0]?._id) setActiveId(rows[0]._id);
    } catch (e) {
      console.error("collab/list failed:", e?.response?.data || e.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOne = async (id) => {
    if (!id) return;
    try {
      const res = await API.get(`/collab/${id}`);
      setCollab(res.data || null);
      setEditMou(false);
      setMouDraft(null);
    } catch (e) {
      console.error("open collab failed:", e?.response?.data || e.message);
      setCollab(null);
    }
  };

  useEffect(() => { fetchList(); }, []);
  useEffect(() => { if (activeId) fetchOne(activeId); }, [activeId]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  // -------- start collab --------
  const startCollab = async (e) => {
    e.preventDefault();
    const title = startForm.title.trim();
    const counterpart = startForm.counterpart.trim();
    const summary = (startForm.summary || "").trim();
    if (!title || !counterpart) return;
    try {
      const res = await API.post("/collab/start", { title, counterpart, summary });
      setOpenStart(false);
      setStartForm({ title: "", counterpart: "", summary: "" });
      await fetchList();
      setActiveId(res?.data?._id || null);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to start collaboration");
    }
  };

  // -------- meta / stage / MoU --------
  const updateMeta = async (patch) => {
    if (!collab?._id) return;
    try {
      const res = await API.patch(`/collab/${collab._id}`, patch);
      const next = res.data || collab;
      setCollab(next);
      setItems((p) =>
        p.map((x) =>
          x._id === collab._id ? { ...x, title: next?.title || x.title, stage: next?.stage || x.stage } : x
        )
      );
    } catch (e) {
      alert(e?.response?.data?.message || "Update failed");
    }
  };

  const onEditMou = () => {
    const ov = mou?.overview || {};
    const rep = ov?.representatives || {};
    const ops = mou?.operations || {};
    const nodals = ops?.nodalOfficers || {};
    const d = {
      overview: {
        title: ov?.title || collab?.title || "",
        companyName: ov?.companyName || collab?.company?.name || "",
        universityName: ov?.universityName || collab?.university?.name || "",
        representatives: {
          company: rep?.company || "",
          university: rep?.university || "",
        },
        effectiveDate: ov?.effectiveDate ? new Date(ov.effectiveDate).toISOString().slice(0, 10) : "",
        durationMonths: Number.isFinite(ov?.durationMonths) ? ov.durationMonths : 36,
      },
      objectives: Array.isArray(mou?.objectives) ? mou.objectives : [],
      scope: {
        company: Array.isArray(mou?.scope?.company) ? mou.scope.company : [],
        university: Array.isArray(mou?.scope?.university) ? mou.scope.university : [],
        joint: Array.isArray(mou?.scope?.joint) ? mou.scope.joint : [],
      },
      benefits: Array.isArray(mou?.benefits) ? mou.benefits : [],
      operations: {
        nodalOfficers: {
          company: nodals?.company || "",
          university: nodals?.university || "",
        },
        implementationMode: ops?.implementationMode || "StudentConnect Portal",
        meetingSchedule: ops?.meetingSchedule || "Quarterly review",
        reporting: ops?.reporting || "Monthly analytics",
      },
      kpis: Array.isArray(mou?.kpis) ? mou.kpis : [],
      legal: {
        confidentiality: mou?.legal?.confidentiality || "",
        financialLiability: mou?.legal?.financialLiability || "",
        termRenewal: mou?.legal?.termRenewal || "",
        termination: mou?.legal?.termination || "",
        jurisdiction: mou?.legal?.jurisdiction || "",
      },
    };
    setMouDraft(d);
    setEditMou(true);
  };

  const saveMou = async (e) => {
    e?.preventDefault();
    if (!collab?._id || !mouDraft) return;
    setSavingMou(true);
    try {
      const draft = { ...mouDraft };
      if (draft.overview?.effectiveDate) {
        // send as Date
        draft.overview.effectiveDate = new Date(draft.overview.effectiveDate);
      }
      const res = await API.patch(`/collab/${collab._id}`, { mou: draft });
      setCollab(res.data || collab);
      setEditMou(false);
      setMouDraft(null);
    } catch (e) {
      alert(e?.response?.data?.message || "Save failed");
    } finally {
      setSavingMou(false);
    }
  };

  const signMou = async () => {
    if (!collab?._id) return;
    const name = prompt("Please confirm authorized signatory name (University):", signatures?.university?.name || "");
    if (name == null) return;
    setSignBusy(true);
    try {
      const res = await API.post(`/collab/${collab._id}/sign`, { name });
      setCollab(res.data || collab);
    } catch (e) {
      alert(e?.response?.data?.message || "Sign failed");
    } finally {
      setSignBusy(false);
    }
  };

  // -------- board / tasks --------
  const addNewTask = async (e) => {
    e.preventDefault();
    if (!collab?._id || !addTask.title.trim()) return;
    setAddingTask(true);
    try {
      await API.post(`/collab/${collab._id}/tasks`, {
        column: addTask.column,
        title: addTask.title.trim(),
        assigneeRole: addTask.assigneeRole,
        due: addTask.due || undefined,
        notes: addTask.notes || "",
      });
      setAddTask({ column: "backlog", title: "", assigneeRole: "university", due: "", notes: "" });
      await fetchOne(collab._id);
    } catch (e) {
      alert(e?.response?.data?.message || "Add task failed");
    } finally {
      setAddingTask(false);
    }
  };

  const updateTask = async (taskId, body) => {
    if (!collab?._id || !taskId) return;
    try {
      await API.patch(`/collab/${collab._id}/tasks/${taskId}`, body);
      await fetchOne(collab._id);
    } catch (e) {
      alert(e?.response?.data?.message || "Update task failed");
    }
  };

  // -------- chat / docs --------
  const sendMessage = async () => {
    if (!collab?._id || !draftMsg.trim()) return;
    setMsgBusy(true);
    try {
      await API.post(`/collab/${collab._id}/messages`, { text: draftMsg.trim(), attachments: [] });
      setDraftMsg("");
      await fetchOne(collab._id);
    } catch (e) {
      alert(e?.response?.data?.message || "Message failed");
    } finally {
      setMsgBusy(false);
    }
  };

  const attachLink = async () => {
    if (!collab?._id) return;
    const link = prompt("Paste a document link (Google Drive, OneDrive, any URL):");
    if (!link) return;
    try {
      await API.post(`/collab/${collab._id}/messages`, {
        text: "",
        attachments: [{ name: link.split("/").pop() || "link", url: link }],
      });
      await fetchOne(collab._id);
    } catch (e) {
      alert(e?.response?.data?.message || "Attach failed");
    }
  };

  // -------- UI --------
  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-10 gap-6">
        {/* Sidebar / list */}
        <aside className="lg:col-span-3">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg" style={{ color: BRAND.dark }}>
                Collaborations
              </h2>
              <button
                onClick={() => setOpenStart(true)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-white"
                style={{ backgroundColor: BRAND.primary }}
              >
                <Plus className="w-4 h-4" /> New
              </button>
            </div>

            <div className="mt-3 rounded-xl border overflow-hidden" style={{ borderColor: BRAND.light }}>
              {loading ? (
                <div className="p-4 text-sm text-gray-600 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </div>
              ) : (items || []).length === 0 ? (
                <div className="p-4 text-sm text-gray-500">No collaborations yet. Start one.</div>
              ) : (
                <ul className="divide-y" style={{ borderColor: BRAND.light }}>
                  {(items || []).map((it) => (
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
                          {(it.company && it.company.name) || "Company"} ↔ {(it.university && it.university.name) || "University"}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </aside>

        {/* Workspace */}
        <section className="lg:col-span-7 space-y-6">
          {!collab ? (
            <Card className="p-10 grid place-items-center text-gray-600">Select a collaboration…</Card>
          ) : (
            <>
              {/* HEADER */}
              <Card className="p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold" style={{ color: BRAND.dark }}>{collab.title || "—"}</h3>
                    <p className="text-sm text-gray-600">
                      {(collab.company?.name || "Company")} ↔ {(collab.university?.name || "University")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={collab.stage || "draft"}
                      onChange={(e) => updateMeta({ stage: e.target.value })}
                      className="border rounded-lg px-3 py-2 text-sm"
                      style={{ borderColor: BRAND.light }}
                    >
                      {["draft", "review", "negotiation", "approved", "active", "completed", "archived"].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const t = prompt("Update title", collab.title || "");
                        if (t != null) updateMeta({ title: t });
                      }}
                      className="px-3 py-2 rounded-lg border text-sm hover:bg-slate-50"
                      style={{ borderColor: BRAND.light }}
                    >
                      Rename
                    </button>
                  </div>
                </div>
                {collab.summary ? (
                  <p className="mt-3 text-sm text-gray-700">{collab.summary}</p>
                ) : (
                  <p className="mt-3 text-xs text-gray-500">Add a summary to share context with the company.</p>
                )}
              </Card>

              {/* MOU + BOARD + CHAT */}
              <div className="grid xl:grid-cols-3 gap-6">
                {/* MOU */}
                <Card className="p-5 xl:col-span-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold flex items-center gap-2" style={{ color: BRAND.dark }}>
                      <FileText className="w-4 h-4" /> MoU
                    </h4>
                    <button
                      onClick={onEditMou}
                      className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border hover:bg-slate-50"
                      style={{ borderColor: BRAND.light }}
                    >
                      <Edit3 className="w-4 h-4" /> Edit
                    </button>
                  </div>
                  <div className="mt-3 space-y-3 text-sm">
                    <Row label="Title" value={(mou?.overview?.title || collab.title || "").trim()} />
                    <Row
                      label="Parties"
                      value={`${mou?.overview?.companyName || collab?.company?.name || "Company"} ↔ ${mou?.overview?.universityName || collab?.university?.name || "University"}`}
                    />
                    <Row
                      label="Representatives"
                      value={`Company: ${mou?.overview?.representatives?.company || "—"} • University: ${mou?.overview?.representatives?.university || "—"}`}
                    />
                    <Row
                      label="Effective"
                      value={
                        mou?.overview?.effectiveDate
                          ? new Date(mou.overview.effectiveDate).toLocaleDateString()
                          : "—"
                      }
                    />
                    <Row label="Duration" value={`${Number.isFinite(mou?.overview?.durationMonths) ? mou.overview.durationMonths : 36} months`} />

                    <div className="pt-3 border-t" style={{ borderColor: BRAND.light }}>
                      <p className="text-xs text-gray-500 mb-2">Signatures</p>
                      <Sig label="Company" s={signatures?.company} />
                      <Sig label="University" s={signatures?.university} mine>
                        <button
                          disabled={!!signatures?.university?.signed || signBusy}
                          onClick={signMou}
                          className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-white"
                          style={{ backgroundColor: BRAND.primary }}
                        >
                          {signBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          {signatures?.university?.signed ? "Signed" : "Sign"}
                        </button>
                      </Sig>
                    </div>
                  </div>
                </Card>

                {/* BOARD */}
                <Card className="p-5 xl:col-span-2">
                  <h4 className="font-semibold flex items-center gap-2 mb-3" style={{ color: BRAND.dark }}>
                    <Layers className="w-4 h-4" /> Project Board
                  </h4>
                  <Board
                    board={board}
                    onMove={(taskId, toCol) => updateTask(taskId, { toColumn: toCol })}
                    onToggleDone={(taskId, done) => updateTask(taskId, { done })}
                  />
                  <form onSubmit={addNewTask} className="mt-4 grid md:grid-cols-5 gap-2 bg-[#b1d4e01a] rounded-lg p-3">
                    <input
                      className="border rounded-lg px-3 py-2 md:col-span-2"
                      style={{ borderColor: BRAND.light }}
                      placeholder="Task title"
                      value={addTask.title}
                      onChange={(e) => setAddTask((p) => ({ ...p, title: e.target.value }))}
                    />
                    <select
                      className="border rounded-lg px-3 py-2"
                      style={{ borderColor: BRAND.light }}
                      value={addTask.column}
                      onChange={(e) => setAddTask((p) => ({ ...p, column: e.target.value }))}
                    >
                      <option value="backlog">Backlog</option>
                      <option value="discussion">Discussion</option>
                      <option value="actions">Actions</option>
                      <option value="approvals">Approvals</option>
                    </select>
                    <select
                      className="border rounded-lg px-3 py-2"
                      style={{ borderColor: BRAND.light }}
                      value={addTask.assigneeRole}
                      onChange={(e) => setAddTask((p) => ({ ...p, assigneeRole: e.target.value }))}
                    >
                      <option value="university">University</option>
                      <option value="company">Company</option>
                      <option value="both">Both</option>
                    </select>
                    <button
                      disabled={addingTask || !addTask.title.trim()}
                      className="rounded-lg px-3 py-2 text-white"
                      style={{ backgroundColor: BRAND.primary }}
                    >
                      {addingTask ? "Adding…" : "Add Task"}
                    </button>
                  </form>
                </Card>

                {/* CHAT + DOCS */}
                <Card className="p-5 xl:col-span-3">
                  <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <h4 className="font-semibold flex items-center gap-2 mb-3" style={{ color: BRAND.dark }}>
                        <MessageSquare className="w-4 h-4" /> Messages
                      </h4>
                      <div className="space-y-3 max-h-80 overflow-auto pr-2 border rounded-xl p-3" style={{ borderColor: BRAND.light }}>
                        {messages.slice().reverse().map((m) => (
                          <div key={m._id || Math.random()} className="rounded-lg border p-3" style={{ borderColor: BRAND.light }}>
                            <div className="text-xs text-gray-500">
                              {(m.authorName || m.authorRole || "—")} • {new Date(m.createdAt || m.updatedAt || Date.now()).toLocaleString()}
                            </div>
                            {m.text ? <div className="text-sm mt-1">{m.text}</div> : null}
                            {Array.isArray(m.attachments) && m.attachments.length > 0 && (
                              <div className="flex flex-wrap gap-2 text-xs text-blue-600 mt-2">
                                {m.attachments.map((a, i) => (
                                  <a key={i} className="inline-flex items-center gap-1 underline" href={a.url} target="_blank" rel="noreferrer">
                                    <Paperclip className="w-3 h-3" /> {a.name || "attachment"}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                        <div ref={chatEndRef} />
                        {messages.length === 0 && <div className="text-sm text-gray-500">No messages yet.</div>}
                      </div>

                      <div className="mt-3 flex gap-2">
                        <input
                          className="border rounded-lg px-3 py-2 flex-1"
                          style={{ borderColor: BRAND.light }}
                          placeholder="Write a message…"
                          value={draftMsg}
                          onChange={(e) => setDraftMsg(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                        />
                        <button
                          onClick={sendMessage}
                          disabled={msgBusy || !draftMsg.trim()}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-white"
                          style={{ backgroundColor: BRAND.primary }}
                        >
                          <Send className="w-4 h-4" /> Send
                        </button>
                      </div>
                    </div>

                    {/* Documents */}
                    <div className="lg:col-span-1">
                      <h4 className="font-semibold flex items-center gap-2 mb-3" style={{ color: BRAND.dark }}>
                        <UploadCloud className="w-4 h-4" /> Documents
                      </h4>
                      <div className="rounded-xl border p-3 text-sm" style={{ borderColor: BRAND.light }}>
                        <p className="text-gray-600">Add file links (Drive/OneDrive/public URL) or paste any document URL.</p>
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={attachLink}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-white"
                            style={{ backgroundColor: BRAND.primary }}
                          >
                            <Paperclip className="w-4 h-4" /> Attach Link
                          </button>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-2">
                          * If you add a file-upload endpoint later, upload the file and attach the returned URL here.
                        </p>
                      </div>

                      <div className="mt-4">
                        <h5 className="text-xs text-gray-500 mb-2">Timeline</h5>
                        <div className="space-y-2 max-h-48 overflow-auto pr-1">
                          {timeline.slice().reverse().map((t, i) => (
                            <div key={`${t.type}-${i}`} className="flex items-start gap-2 text-xs">
                              <Clock className="w-3 h-3 mt-0.5 text-gray-500" />
                              <div>
                                <span className="text-gray-700 font-medium">{t.type}</span>
                                <span className="text-gray-500"> • {new Date(t.at || Date.now()).toLocaleString()}</span>
                                {t.by ? <span className="text-gray-500"> • {t.by}</span> : null}
                                {t.note ? <div className="text-[11px] text-gray-600">{t.note}</div> : null}
                              </div>
                            </div>
                          ))}
                          {timeline.length === 0 && <div className="text-xs text-gray-500">No events yet.</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </>
          )}
        </section>
      </div>

      {/* Start modal */}
      {openStart && (
        <div className="fixed inset-0 z-50 bg-black/30 grid place-items-center p-4">
          <form
            onSubmit={startCollab}
            className="w-full max-w-xl bg-white rounded-2xl p-6 shadow-xl border"
            style={{ borderColor: BRAND.light }}
          >
            <h3 className="text-lg font-semibold" style={{ color: BRAND.dark }}>Start a Collaboration</h3>
            <p className="text-xs text-gray-600 mt-1">
              Enter the <b>Company name</b> or registered <b>id</b> in “Counterpart”.
            </p>
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
                placeholder="Counterpart (Company name or id)"
                value={startForm.counterpart}
                onChange={(e) => setStartForm((p) => ({ ...p, counterpart: e.target.value }))}
                required
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

      {/* MoU editor */}
      {editMou && mouDraft && (
        <MouEditor
          draft={mouDraft}
          onChange={setMouDraft}
          onClose={() => { setEditMou(false); setMouDraft(null); }}
          onSave={saveMou}
          saving={savingMou}
        />
      )}
    </div>
  );
}

/* ---------- helpers & subcomponents ---------- */

function Row({ label, value }) {
  return (
    <div className="text-sm">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium" style={{ color: BRAND.dark }}>{value || "—"}</p>
    </div>
  );
}

function Sig({ label, s, mine, children }) {
  const ok = !!(s && s.signed);
  return (
    <div className="mt-2 rounded-lg border p-2" style={{ borderColor: BRAND.light }}>
      <div className="flex items-center justify-between">
        <div className="text-sm">
          <div className="font-medium" style={{ color: BRAND.dark }}>{label}</div>
          <div className="text-xs text-gray-600">{ok ? `Signed by ${s?.name || "—"}` : "Pending signature"}</div>
          {ok && <div className="text-[11px] text-gray-500">{s?.at ? new Date(s.at).toLocaleString() : ""}</div>}
        </div>
        {ok ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : null}
      </div>
      {mine ? children : null}
    </div>
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
                <div key={t._id || `${t.title}-${Math.random()}`} className="rounded-lg border p-3" style={{ borderColor: BRAND.light }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-sm">{t.title}</div>
                      <div className="text-[11px] text-gray-600 mt-1">
                        {(t.assigneeRole || "both")}{t.due ? ` • due ${new Date(t.due).toLocaleDateString()}` : ""}
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
                    {["backlog", "discussion", "actions", "approvals"].map((dest) =>
                      dest !== c.key ? (
                        <button
                          key={dest}
                          onClick={() => onMove?.(t._id, dest)}
                          className="text-[11px] px-2 py-1 rounded border hover:bg-slate-50"
                          style={{ borderColor: BRAND.light }}
                        >
                          → {dest}
                        </button>
                      ) : null
                    )}
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

function TextList({ value = [], onChange, placeholder }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...(value || []), v]);
    setDraft("");
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {(value || []).map((v, i) => (
          <span key={`${v}-${i}`} className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full border" style={{ borderColor: BRAND.light }}>
            {v}
            <button
              type="button"
              className="text-gray-500 hover:text-red-600"
              onClick={() => onChange((value || []).filter((_, idx) => idx !== i))}
              aria-label="Remove item"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          className="border rounded-lg px-3 py-2 flex-1 text-sm"
          style={{ borderColor: BRAND.light }}
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
        />
        <button
          type="button"
          disabled={!draft.trim()}
          onClick={add}
          className="px-3 py-2 rounded-lg text-white text-sm"
          style={{ backgroundColor: BRAND.primary }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

function MouEditor({ draft, onChange, onSave, onClose, saving }) {
  const d = draft;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 grid place-items-center p-4">
      <form
        onSubmit={onSave}
        className="w-full max-w-5xl bg-white rounded-2xl p-6 shadow-xl border overflow-y-auto max-h-[90vh]"
        style={{ borderColor: BRAND.light }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold" style={{ color: BRAND.dark }}>Edit MoU</h3>
          <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg border" style={{ borderColor: BRAND.light }}>
            Close
          </button>
        </div>

        {/* Overview */}
        <div className="mt-4">
          <h4 className="font-semibold mb-2" style={{ color: BRAND.dark }}>1) Basic Overview</h4>
          <div className="grid md:grid-cols-2 gap-3">
            <input
              className="border rounded-lg px-3 py-2 md:col-span-2"
              style={{ borderColor: BRAND.light }}
              value={d.overview.title}
              onChange={(e) => onChange({ ...d, overview: { ...d.overview, title: e.target.value } })}
              placeholder="Title"
              required
            />
            <input
              className="border rounded-lg px-3 py-2"
              style={{ borderColor: BRAND.light }}
              value={d.overview.companyName}
              onChange={(e) => onChange({ ...d, overview: { ...d.overview, companyName: e.target.value } })}
              placeholder="Company Name"
            />
            <input
              className="border rounded-lg px-3 py-2"
              style={{ borderColor: BRAND.light }}
              value={d.overview.universityName}
              onChange={(e) => onChange({ ...d, overview: { ...d.overview, universityName: e.target.value } })}
              placeholder="University Name"
            />
            <input
              className="border rounded-lg px-3 py-2"
              style={{ borderColor: BRAND.light }}
              value={d.overview.representatives.company}
              onChange={(e) =>
                onChange({
                  ...d,
                  overview: {
                    ...d.overview,
                    representatives: { ...d.overview.representatives, company: e.target.value },
                  },
                })
              }
              placeholder="Company Representative"
            />
            <input
              className="border rounded-lg px-3 py-2"
              style={{ borderColor: BRAND.light }}
              value={d.overview.representatives.university}
              onChange={(e) =>
                onChange({
                  ...d,
                  overview: {
                    ...d.overview,
                    representatives: { ...d.overview.representatives, university: e.target.value },
                  },
                })
              }
              placeholder="University Representative"
            />
            <input
              type="date"
              className="border rounded-lg px-3 py-2"
              style={{ borderColor: BRAND.light }}
              value={d.overview.effectiveDate || ""}
              onChange={(e) => onChange({ ...d, overview: { ...d.overview, effectiveDate: e.target.value } })}
            />
            <input
              type="number"
              min={1}
              className="border rounded-lg px-3 py-2"
              style={{ borderColor: BRAND.light }}
              value={d.overview.durationMonths}
              onChange={(e) =>
                onChange({
                  ...d,
                  overview: { ...d.overview, durationMonths: Number(e.target.value || 0) },
                })
              }
              placeholder="Duration (months)"
            />
          </div>
        </div>

        {/* Objectives */}
        <div className="mt-6">
          <h4 className="font-semibold mb-2" style={{ color: BRAND.dark }}>2) Objectives</h4>
          <TextList
            value={d.objectives}
            onChange={(v) => onChange({ ...d, objectives: v })}
            placeholder="Add objective and press Enter"
          />
        </div>

        {/* Scope */}
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-semibold mb-2" style={{ color: BRAND.dark }}>3) Scope – Company</h4>
            <TextList
              value={d.scope.company}
              onChange={(v) => onChange({ ...d, scope: { ...d.scope, company: v } })}
              placeholder="Add company scope…"
            />
          </div>
          <div>
            <h4 className="font-semibold mb-2" style={{ color: BRAND.dark }}>Scope – University</h4>
            <TextList
              value={d.scope.university}
              onChange={(v) => onChange({ ...d, scope: { ...d.scope, university: v } })}
              placeholder="Add university scope…"
            />
          </div>
          <div>
            <h4 className="font-semibold mb-2" style={{ color: BRAND.dark }}>Scope – Joint</h4>
            <TextList
              value={d.scope.joint}
              onChange={(v) => onChange({ ...d, scope: { ...d.scope, joint: v } })}
              placeholder="Add joint scope…"
            />
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-6">
          <h4 className="font-semibold mb-2" style={{ color: BRAND.dark }}>4) Student Benefits</h4>
          <TextList
            value={d.benefits}
            onChange={(v) => onChange({ ...d, benefits: v })}
            placeholder="Add a student benefit…"
          />
        </div>

        {/* Operations */}
        <div className="mt-6">
          <h4 className="font-semibold mb-2" style={{ color: BRAND.dark }}>5) Operational Framework</h4>
          <div className="grid md:grid-cols-2 gap-3">
            <input
              className="border rounded-lg px-3 py-2"
              style={{ borderColor: BRAND.light }}
              value={d.operations.nodalOfficers.company}
              onChange={(e) =>
                onChange({
                  ...d,
                  operations: {
                    ...d.operations,
                    nodalOfficers: { ...d.operations.nodalOfficers, company: e.target.value },
                  },
                })
              }
              placeholder="Company Nodal Officer"
            />
            <input
              className="border rounded-lg px-3 py-2"
              style={{ borderColor: BRAND.light }}
              value={d.operations.nodalOfficers.university}
              onChange={(e) =>
                onChange({
                  ...d,
                  operations: {
                    ...d.operations,
                    nodalOfficers: { ...d.operations.nodalOfficers, university: e.target.value },
                  },
                })
              }
              placeholder="University Nodal Officer"
            />
            <input
              className="border rounded-lg px-3 py-2 md:col-span-2"
              style={{ borderColor: BRAND.light }}
              value={d.operations.implementationMode}
              onChange={(e) => onChange({ ...d, operations: { ...d.operations, implementationMode: e.target.value } })}
              placeholder="Implementation Mode"
            />
            <input
              className="border rounded-lg px-3 py-2"
              style={{ borderColor: BRAND.light }}
              value={d.operations.meetingSchedule}
              onChange={(e) => onChange({ ...d, operations: { ...d.operations, meetingSchedule: e.target.value } })}
              placeholder="Meeting Schedule"
            />
            <input
              className="border rounded-lg px-3 py-2"
              style={{ borderColor: BRAND.light }}
              value={d.operations.reporting}
              onChange={(e) => onChange({ ...d, operations: { ...d.operations, reporting: e.target.value } })}
              placeholder="Performance Reports"
            />
          </div>
        </div>

        {/* KPIs */}
        <div className="mt-6">
          <h4 className="font-semibold mb-2" style={{ color: BRAND.dark }}>6) Deliverables & KPIs</h4>
          <KpiTable rows={d.kpis} onChange={(rows) => onChange({ ...d, kpis: rows })} />
        </div>

        {/* Legal */}
        <div className="mt-6">
          <h4 className="font-semibold mb-2" style={{ color: BRAND.dark }}>7) Legal / Administrative</h4>
          <div className="grid md:grid-cols-2 gap-3">
            <input
              className="border rounded-lg px-3 py-2"
              style={{ borderColor: BRAND.light }}
              value={d.legal.confidentiality}
              onChange={(e) => onChange({ ...d, legal: { ...d.legal, confidentiality: e.target.value } })}
              placeholder="Confidentiality"
            />
            <input
              className="border rounded-lg px-3 py-2"
              style={{ borderColor: BRAND.light }}
              value={d.legal.financialLiability}
              onChange={(e) => onChange({ ...d, legal: { ...d.legal, financialLiability: e.target.value } })}
              placeholder="Financial Liability"
            />
            <input
              className="border rounded-lg px-3 py-2"
              style={{ borderColor: BRAND.light }}
              value={d.legal.termRenewal}
              onChange={(e) => onChange({ ...d, legal: { ...d.legal, termRenewal: e.target.value } })}
              placeholder="Term & Renewal"
            />
            <input
              className="border rounded-lg px-3 py-2"
              style={{ borderColor: BRAND.light }}
              value={d.legal.termination}
              onChange={(e) => onChange({ ...d, legal: { ...d.legal, termination: e.target.value } })}
              placeholder="Termination clause"
            />
            <input
              className="border rounded-lg px-3 py-2 md:col-span-2"
              style={{ borderColor: BRAND.light }}
              value={d.legal.jurisdiction}
              onChange={(e) => onChange({ ...d, legal: { ...d.legal, jurisdiction: e.target.value } })}
              placeholder="Jurisdiction & Dispute Resolution"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border" style={{ borderColor: BRAND.light }}>
            Cancel
          </button>
          <button disabled={saving} className="px-4 py-2 rounded-lg text-white" style={{ backgroundColor: BRAND.primary }}>
            {saving ? "Saving…" : "Save MoU"}
          </button>
        </div>
      </form>
    </div>
  );
}

function KpiTable({ rows, onChange }) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const add = () => onChange([...safeRows, { area: "", deliverable: "", outcome: "" }]);
  const edit = (i, key, val) => {
    const next = [...safeRows];
    next[i] = { ...(next[i] || {}), [key]: val };
    onChange(next);
  };
  const remove = (i) => {
    const next = [...safeRows];
    next.splice(i, 1);
    onChange(next);
  };
  return (
    <div className="rounded-xl border" style={{ borderColor: BRAND.light }}>
      <div
        className="grid grid-cols-12 gap-0 text-xs font-medium px-3 py-2 bg-[#f8fafc] rounded-t-xl"
        style={{ borderBottom: `1px solid ${BRAND.light}` }}
      >
        <div className="col-span-3">Area</div>
        <div className="col-span-5">Deliverable</div>
        <div className="col-span-3">KPI / Outcome</div>
        <div className="col-span-1 text-right">—</div>
      </div>

      {safeRows.map((r, i) => (
        <div key={`kpi-${i}`} className="grid grid-cols-12 gap-2 px-3 py-2 border-t" style={{ borderColor: BRAND.light }}>
          <input
            className="col-span-3 border rounded-lg px-2 py-1"
            style={{ borderColor: BRAND.light }}
            value={r.area || ""}
            onChange={(e) => edit(i, "area", e.target.value)}
            placeholder="Internship"
          />
          <input
            className="col-span-5 border rounded-lg px-2 py-1"
            style={{ borderColor: BRAND.light }}
            value={r.deliverable || ""}
            onChange={(e) => edit(i, "deliverable", e.target.value)}
            placeholder="No. of students trained"
          />
          <input
            className="col-span-3 border rounded-lg px-2 py-1"
            style={{ borderColor: BRAND.light }}
            value={r.outcome || ""}
            onChange={(e) => edit(i, "outcome", e.target.value)}
            placeholder="20/year"
          />
          <div className="col-span-1 text-right">
            <button
              type="button"
              className="px-2 py-1 text-xs rounded border hover:bg-slate-50"
              style={{ borderColor: BRAND.light }}
              onClick={() => remove(i)}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <div className="px-3 py-2">
        <button
          type="button"
          className="px-3 py-1.5 rounded-lg text-white text-sm"
          onClick={add}
          style={{ backgroundColor: BRAND.primary }}
        >
          Add Row
        </button>
      </div>
    </div>
  );
}
