import { useEffect, useMemo, useRef, useState } from "react";
import API from "../../api/axios";
import {
  Building2, Plus, Layers, MessageSquare, Clock, Paperclip, Loader2,
  Send, Users, Upload, CheckCircle2, AlertTriangle
} from "lucide-react";

const BRAND = { primary: "#145da0", dark: "#0c2d48", light: "#b1d4e0" };

const Card = ({ className = "", children }) => (
  <div className={`bg-white rounded-2xl border shadow-sm ${className}`} style={{ borderColor: BRAND.light }}>{children}</div>
);

export default function PartnershipsTab({ partnerships, createPartnership }) {
  const [tab, setTab] = useState("collab");

  // --- state
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [items, setItems] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [collab, setCollab] = useState(null);

  const [openStart, setOpenStart] = useState(false);
  const [startForm, setStartForm] = useState({ title: "", counterpart: "", summary: "" });

  const [addTask, setAddTask] = useState({ column: "backlog", title: "", assigneeRole: "both", due: "", notes: "" });
  const [addingTask, setAddingTask] = useState(false);

  const [draftMsg, setDraftMsg] = useState("");
  const [msgBusy, setMsgBusy] = useState(false);

  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadInfo, setUploadInfo] = useState(null);

  const board = useMemo(
    () => (collab?.board || { backlog: [], discussion: [], actions: [], approvals: [] }),
    [collab]
  );

  const fetchList = async () => {
    setLoading(true);
    setForbidden(false);
    try {
      const res = await API.get("/collab/list");
      const rows = Array.isArray(res.data) ? res.data : [];
      setItems(rows);
      if (!activeId && rows[0]?._id) setActiveId(rows[0]._id);
    } catch (e) {
      // if auth middleware blocks this route you’ll get 401/403
      if (e?.response?.status === 403) setForbidden(true);
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
    } catch (e) {
      if (e?.response?.status === 403) setForbidden(true);
      setCollab(null);
    }
  };

  useEffect(() => { fetchList(); }, []);
  useEffect(() => { if (activeId) fetchOne(activeId); }, [activeId]);
  useEffect(() => {
    if (!activeId) return;
    const t = setInterval(() => fetchOne(activeId), 5000);
    return () => clearInterval(t);
  }, [activeId]);

  const startCollab = async (e) => {
    e.preventDefault();
    if (!startForm.title.trim() || !startForm.counterpart.trim()) return;
    try {
      const res = await API.post("/collab/start", {
        title: startForm.title.trim(),
        summary: startForm.summary.trim(),
        counterpart: startForm.counterpart.trim(),
      });
      setOpenStart(false);
      setStartForm({ title: "", counterpart: "", summary: "" });
      await fetchList();
      setActiveId(res?.data?._id || null);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to start collaboration");
    }
  };

  const updateMeta = async (patch) => {
    if (!collab?._id) return;
    try {
      const res = await API.patch(`/collab/${collab._id}`, patch);
      setCollab(res.data || collab);
      setItems((p) =>
        p.map((x) => (x._id === collab._id ? { ...x, title: res.data?.title || x.title, stage: res.data?.stage || x.stage } : x))
      );
    } catch (e) {
      alert(e?.response?.data?.message || "Update failed");
    }
  };

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
      setAddTask({ column: "backlog", title: "", assigneeRole: "both", due: "", notes: "" });
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

  const handleUpload = async (file) => {
    if (!file || !collab?._id) return null;
    const form = new FormData();
    form.append("file", file);
    setUploading(true);
    setUploadInfo(null);
    try {
      const res = await API.post(`/collab/${collab._id}/upload`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadInfo(res.data);
      return res.data;
    } catch (e) {
      alert(e?.response?.data?.message || "Upload failed");
      return null;
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const sendMessage = async (attachments = []) => {
    if (!collab?._id || !draftMsg.trim()) return;
    setMsgBusy(true);
    try {
      await API.post(`/collab/${collab._id}/messages`, { text: draftMsg.trim(), attachments });
      setDraftMsg("");
      setUploadInfo(null);
      await fetchOne(collab._id);
    } catch (e) {
      alert(e?.response?.data?.message || "Message failed");
    } finally {
      setMsgBusy(false);
    }
  };

  const boardView = useMemo(() => (collab?.board || {}), [collab]);

  return (
    <div>
      {/* Tabs */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTab("collab")}
          className={`px-3 py-2 rounded-lg border ${tab === "collab" ? "bg-[#b1d4e033]" : "hover:bg-slate-50"}`}
          style={{ borderColor: BRAND.light }}
        >
          Collaborations
        </button>
        <button
          onClick={() => setTab("partnerships")}
          className={`px-3 py-2 rounded-lg border ${tab === "partnerships" ? "bg-[#b1d4e033]" : "hover:bg-slate-50"}`}
          style={{ borderColor: BRAND.light }}
        >
          Partnerships
        </button>
      </div>

      {tab === "partnerships" ? (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: BRAND.dark }}>University Partnerships & Research</h3>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              await createPartnership({
                university: f.get("university"),
                title: f.get("title"),
                details: f.get("details"),
                status: f.get("status"),
              });
              e.currentTarget.reset();
            }}
            className="grid md:grid-cols-2 gap-4 mb-6"
          >
            <input name="university" required placeholder="University name" className="border rounded-xl px-3 py-2 bg-white/70" />
            <select name="status" className="border rounded-xl px-3 py-2 bg-white/70">
              <option value="proposal">Proposal</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
            <input name="title" required placeholder="Initiative title" className="border rounded-xl px-3 py-2 bg-white/70 md:col-span-2" />
            <textarea name="details" placeholder="Details" className="border rounded-xl px-3 py-2 bg-white/70 md:col-span-2" />
            <button className="md:justify-self-start inline-flex items-center rounded-xl px-4 py-2 text-white hover:opacity-95"
              style={{ backgroundColor: BRAND.primary }}>
              <Plus className="w-4 h-4 mr-1" /> Save
            </button>
          </form>

          {partnerships.length === 0 ? (
            <p className="text-sm text-gray-500">No collaborations yet.</p>
          ) : (
            <ul className="space-y-3">
              {partnerships.map((p) => (
                <li key={p._id} className="border rounded-xl p-3 bg-white/70" style={{ borderColor: BRAND.light }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium" style={{ color: BRAND.dark }}>{p.title}</p>
                      <p className="text-xs text-gray-500">{p.university} • {p.status}</p>
                      <p className="text-xs mt-1">{p.details}</p>
                    </div>
                    <Building2 className="text-gray-400" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : (
        <div className="grid lg:grid-cols-10 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-3 bg-white rounded-2xl border shadow-sm p-4" style={{ borderColor: BRAND.light }}>
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

            <div className="mt-3 rounded-xl border overflow-hidden" style={{ borderColor: BRAND.light }}>
              {forbidden && (
                <div className="p-4 text-sm text-red-700 bg-red-50 flex items-start gap-2 border-b" style={{ borderColor: BRAND.light }}>
                  <AlertTriangle className="w-4 h-4 mt-0.5" />
                  <div>
                    Access denied. Ensure your **Company Profile** exists and is linked to this account.<br />
                    Go to <b>/company/profile</b> and complete it, then refresh.
                  </div>
                </div>
              )}
              {loading ? (
                <div className="p-4 text-sm text-gray-600 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </div>
              ) : (items || []).length === 0 ? (
                <div className="p-4 text-sm text-gray-600">
                  No collaborations yet.
                  <div className="mt-2 text-xs text-gray-500">Click “New” to start with a university.</div>
                </div>
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
                          {(it.university && it.university.name) || "University"} ·
                          <Building2 className="inline w-3 h-3 mx-1" />
                          {(it.company && it.company.name) || "Company"}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>

          {/* Workspace */}
          <section className="lg:col-span-7">
            {!collab ? (
              <Card className="p-8 grid gap-6">
                <h3 className="text-xl font-semibold" style={{ color: BRAND.dark }}>Get started</h3>
                <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                  <li>Click <b>New</b> and enter the university username or email.</li>
                  <li>Set <b>Stage</b> to <i>review</i> to begin discussing terms.</li>
                  <li>Use <b>Project Board</b> to track tasks & approvals.</li>
                  <li>Share docs in <b>Messages</b> (use File → Upload → Send).</li>
                </ol>
              </Card>
            ) : (
              <div className="space-y-6">
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
                    <p className="mt-3 text-xs text-gray-500">Add a summary to share context with the university.</p>
                  )}
                </Card>

                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Board */}
                  <Card className="p-5 lg:col-span-2">
                    <h4 className="font-semibold flex items-center gap-2 mb-3" style={{ color: BRAND.dark }}>
                      <Layers className="w-4 h-4" /> Project Board
                    </h4>
                    <Board
                      board={boardView}
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
                        <option value="both">Both</option>
                        <option value="company">Company</option>
                        <option value="university">University</option>
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

                  {/* Messages + Upload */}
                  <Card className="p-5">
                    <h4 className="font-semibold flex items-center gap-2 mb-3" style={{ color: BRAND.dark }}>
                      <MessageSquare className="w-4 h-4" /> Messages
                    </h4>
                    <div className="space-y-3 max-h-80 overflow-auto pr-2">
                      {(collab?.messages || []).slice().reverse().map((m) => (
                        <div key={m._id} className="rounded-lg border p-3" style={{ borderColor: BRAND.light }}>
                          <div className="text-xs text-gray-500">
                            {m.authorName || m.authorRole} • {new Date(m.createdAt || m.updatedAt || Date.now()).toLocaleString()}
                          </div>
                          <div className="text-sm mt-1">{m.text}</div>
                          {Array.isArray(m.attachments) && m.attachments.length > 0 && (
                            <div className="flex flex-col gap-1 text-xs text-blue-700 mt-2">
                              {m.attachments.map((a, i) => (
                                <a key={i} className="inline-flex items-center gap-1 underline" href={a.url} target="_blank" rel="noreferrer">
                                  <Paperclip className="w-3 h-3" /> {a.name}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {(collab?.messages || []).length === 0 && (
                        <div className="text-sm text-gray-500">No messages yet.</div>
                      )}
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="flex gap-2">
                        <input
                          className="border rounded-lg px-3 py-2 flex-1"
                          style={{ borderColor: BRAND.light }}
                          placeholder="Write a message…"
                          value={draftMsg}
                          onChange={(e) => setDraftMsg(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(uploadInfo ? [uploadInfo] : []); } }}
                        />
                        <button
                          onClick={() => fileRef.current?.click()}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border"
                          style={{ borderColor: BRAND.light }}
                          title="Attach document"
                        >
                          <Upload className="w-4 h-4" /> File
                        </button>
                        <button
                          onClick={() => sendMessage(uploadInfo ? [uploadInfo] : [])}
                          disabled={msgBusy || !draftMsg.trim()}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-white"
                          style={{ backgroundColor: BRAND.primary }}
                        >
                          <Send className="w-4 h-4" /> Send
                        </button>
                      </div>
                      <input
                        ref={fileRef}
                        type="file"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          await handleUpload(file);
                        }}
                      />
                      {uploading && (
                        <div className="text-xs text-gray-600 flex items-center gap-2">
                          <Loader2 className="w-3 h-3 animate-spin" /> Uploading…
                        </div>
                      )}
                      {uploadInfo && !uploading && (
                        <div className="text-xs text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Attached: {uploadInfo.name}
                        </div>
                      )}
                    </div>
                  </Card>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <Card className="p-5">
                    <h4 className="font-semibold flex items-center gap-2 mb-3" style={{ color: BRAND.dark }}>
                      <Paperclip className="w-4 h-4" /> Documents
                    </h4>
                    <p className="text-sm text-gray-500">Attach files using the message box. They appear inline with links.</p>
                  </Card>
                  <Card className="p-5">
                    <h4 className="font-semibold flex items-center gap-2 mb-3" style={{ color: BRAND.dark }}>
                      <Clock className="w-4 h-4" /> Timeline
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-auto pr-2">
                      {(collab?.timeline || []).slice().reverse().map((t, idx) => (
                        <div key={idx} className="text-sm">
                          <span className="text-gray-700 font-medium">{t.type}</span>
                          <span className="text-gray-500"> • {new Date(t.at).toLocaleString()}</span>
                          {t.by ? <span className="text-gray-500"> • by {t.by}</span> : null}
                          {t.note ? <span className="text-gray-600"> • {t.note}</span> : null}
                        </div>
                      ))}
                      {(collab?.timeline || []).length === 0 && <div className="text-sm text-gray-500">No events yet.</div>}
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

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
              Enter the <b>University Username</b> or registered <b>email</b> in “Counterpart”.
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
                placeholder="Counterpart (University username or Email)"
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
                    {["backlog", "discussion", "actions", "approvals"].map((dest) => (
                      dest !== c.key && (
                        <button
                          key={dest}
                          onClick={() => onMove?.(t._id, dest)}
                          className="text-[11px] px-2 py-1 rounded border hover:bg-slate-50"
                          style={{ borderColor: BRAND.light }}
                        >
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
