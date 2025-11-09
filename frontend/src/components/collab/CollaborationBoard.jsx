// src/components/collab/CollaborationBoard.jsx
import { useEffect, useState, useMemo } from "react";
import {
  getCollab, patchCollab, addNote,
  addTask, updateTask, deleteTask,
  addMilestone, updateMilestone, deleteMilestone,
  addLink, deleteLink
} from "../../api/collab";
import { X, Check, Plus, CalendarDays, Link as LinkIcon, ListChecks, Flag, MessageSquare } from "lucide-react";

const COLOR = { PRIMARY: "#145da0", DARK: "#0c2d48", LIGHT: "#b1d4e0" };

export default function CollaborationBoard({ id, open, onClose }) {
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const [taskForm, setTaskForm] = useState({ title: "", assignee: "", due: "", notes: "" });
  const [mileForm, setMileForm] = useState({ title: "", targetDate: "", status: "planned", notes: "" });
  const [linkForm, setLinkForm] = useState({ label: "", url: "" });

  const load = async () => {
    if (!id || !open) return;
    try { setData(await getCollab(id)); } catch { setData(null); }
  };
  useEffect(() => { load(); /* eslint-disable */ }, [id, open]);

  const statusOptions = ["Proposal", "Active", "Completed", "Declined"];

  const tasksByStatus = useMemo(() => {
    const g = { todo: [], in_progress: [], done: [], blocked: [] };
    (data?.tasks || []).forEach((t) => g[t.status || "todo"].push(t));
    return g;
  }, [data]);

  const saveHeader = async (fields) => {
    setSaving(true);
    try { setData(await patchCollab(id, fields)); } catch (e) { alert(e?.response?.data?.message || "Update failed"); }
    finally { setSaving(false); }
  };

  const addTimelineNote = async () => {
    if (!note.trim()) return;
    try { await addNote(id, note.trim()); setNote(""); await load(); } catch { alert("Could not add note"); }
  };

  const addTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;
    try {
      await addTask(id, { ...taskForm, due: taskForm.due || null });
      setTaskForm({ title: "", assignee: "", due: "", notes: "" });
      await load();
    } catch { alert("Add task failed"); }
  };

  const updateTaskInline = async (taskId, patch) => {
    try { await updateTask(id, taskId, patch); await load(); } catch { alert("Update task failed"); }
  };

  const addMilestoneSubmit = async (e) => {
    e.preventDefault();
    if (!mileForm.title.trim()) return;
    try {
      await addMilestone(id, { ...mileForm, targetDate: mileForm.targetDate || null });
      setMileForm({ title: "", targetDate: "", status: "planned", notes: "" });
      await load();
    } catch { alert("Add milestone failed"); }
  };

  const addLinkSubmit = async (e) => {
    e.preventDefault();
    if (!linkForm.url.trim()) return;
    try {
      await addLink(id, linkForm);
      setLinkForm({ label: "", url: "" });
      await load();
    } catch { alert("Add link failed"); }
  };

  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}>
      <div className={`absolute inset-0 bg-black/40 transition ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <div className={`absolute top-0 right-0 h-full w-full md:w-[980px] bg-white shadow-2xl transition-transform duration-300
        ${open ? "translate-x-0" : "translate-x-full"}`}>
        {/* Header */}
        <div className="p-5 border-b sticky top-0 bg-white z-10" style={{ borderColor: COLOR.LIGHT }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <input
                className="text-xl font-semibold w-full outline-none"
                style={{ color: COLOR.DARK }}
                value={data?.title || ""}
                onChange={(e) => setData((d) => ({ ...d, title: e.target.value }))}
                onBlur={() => saveHeader({ title: data?.title || "" })}
              />
              <div className="text-sm text-gray-600 mt-1">
                {data?.universityName || "—"} ↔ {data?.companyName || "—"}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <select
                  className="border rounded-lg px-2 py-1 text-sm"
                  style={{ borderColor: COLOR.LIGHT }}
                  value={data?.status || "Proposal"}
                  onChange={(e) => saveHeader({ status: e.target.value })}
                >
                  {statusOptions.map((s) => <option key={s}>{s}</option>)}
                </select>
                <input
                  className="border rounded-lg px-2 py-1 text-sm"
                  style={{ borderColor: COLOR.LIGHT }}
                  placeholder="Labels (comma separated)"
                  value={(data?.labels || []).join(", ")}
                  onChange={(e) => setData((d) => ({ ...d, labels: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))}
                  onBlur={() => saveHeader({ labels: data?.labels || [] })}
                />
                <div className="text-sm text-gray-600 ml-auto">
                  Funding: ₹{" "}
                  <input
                    className="border rounded px-2 py-0.5 w-28"
                    style={{ borderColor: COLOR.LIGHT }}
                    value={data?.funding ?? 0}
                    onChange={(e) => setData((d) => ({ ...d, funding: e.target.value }))}
                    onBlur={() => saveHeader({ funding: Number(data?.funding || 0) })}
                  />
                </div>
              </div>
            </div>
            <button className="rounded-lg p-2 border" style={{ borderColor: COLOR.LIGHT }} onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-6 overflow-y-auto h-[calc(100%-74px)]">
          {/* Description + Links */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-xl border p-4" style={{ borderColor: COLOR.LIGHT }}>
              <h4 className="font-semibold mb-2" style={{ color: COLOR.DARK }}>Overview</h4>
              <textarea
                className="w-full text-sm border rounded-xl p-3 min-h-[100px]"
                style={{ borderColor: COLOR.LIGHT }}
                placeholder="Describe scope, objectives, expectations…"
                value={data?.details || ""}
                onChange={(e) => setData((d) => ({ ...d, details: e.target.value }))}
                onBlur={() => saveHeader({ details: data?.details || "" })}
              />
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor: COLOR.LIGHT }}>
              <h4 className="font-semibold mb-2 flex items-center gap-2" style={{ color: COLOR.DARK }}>
                <LinkIcon className="w-4 h-4" style={{ color: COLOR.PRIMARY }} /> Shared Links
              </h4>
              <form onSubmit={addLinkSubmit} className="flex gap-2">
                <input className="border rounded-lg px-3 py-2 text-sm flex-1" style={{ borderColor: COLOR.LIGHT }}
                  placeholder="Label (optional)" value={linkForm.label} onChange={(e) => setLinkForm({ ...linkForm, label: e.target.value })} />
                <input className="border rounded-lg px-3 py-2 text-sm flex-1" style={{ borderColor: COLOR.LIGHT }}
                  placeholder="https://…" value={linkForm.url} onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })} />
                <button className="rounded-lg px-3 py-2 text-white" style={{ backgroundColor: COLOR.PRIMARY }}>
                  <Plus className="w-4 h-4" />
                </button>
              </form>
              <ul className="mt-3 space-y-2">
                {(data?.links || []).map(l => (
                  <li key={l._id} className="flex items-center justify-between text-sm">
                    <a className="text-blue-600 hover:underline break-all" href={l.url} target="_blank" rel="noreferrer">
                      {l.label || l.url}
                    </a>
                    <button className="text-gray-500 hover:text-red-600" onClick={async () => { await deleteLink(id, l._id); await load(); }}>×</button>
                  </li>
                ))}
                {(!data?.links || data.links.length === 0) && <li className="text-xs text-gray-500">No links yet.</li>}
              </ul>
            </div>
          </div>

          {/* Tasks Kanban */}
          <div className="rounded-xl border p-4" style={{ borderColor: COLOR.LIGHT }}>
            <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: COLOR.DARK }}>
              <ListChecks className="w-4 h-4" style={{ color: COLOR.PRIMARY }} /> Tasks
            </h4>
            <form onSubmit={addTaskSubmit} className="grid md:grid-cols-4 gap-2 mb-4">
              <input className="border rounded-lg px-3 py-2 text-sm" style={{ borderColor: COLOR.LIGHT }}
                placeholder="Task title" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} />
              <input className="border rounded-lg px-3 py-2 text-sm" style={{ borderColor: COLOR.LIGHT }}
                placeholder="Assignee (name/email)" value={taskForm.assignee} onChange={(e) => setTaskForm({ ...taskForm, assignee: e.target.value })} />
              <input className="border rounded-lg px-3 py-2 text-sm" style={{ borderColor: COLOR.LIGHT }}
                type="date" value={taskForm.due} onChange={(e) => setTaskForm({ ...taskForm, due: e.target.value })} />
              <button className="rounded-lg px-3 py-2 text-white" style={{ backgroundColor: COLOR.PRIMARY }}>
                <Plus className="w-4 h-4" /> Add
              </button>
              <textarea className="border rounded-lg px-3 py-2 text-sm md:col-span-4" rows={2}
                style={{ borderColor: COLOR.LIGHT }} placeholder="Notes (optional)"
                value={taskForm.notes} onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })} />
            </form>

            <div className="grid md:grid-cols-4 gap-3">
              {["todo", "in_progress", "blocked", "done"].map((col) => (
                <div key={col} className="rounded-lg border p-3" style={{ borderColor: COLOR.LIGHT }}>
                  <div className="text-xs font-semibold mb-2" style={{ color: COLOR.DARK, textTransform: "capitalize" }}>{col.replace("_", " ")}</div>
                  <div className="space-y-2">
                    {(tasksByStatus[col] || []).map(t => (
                      <div key={t._id} className="rounded border p-2" style={{ borderColor: COLOR.LIGHT }}>
                        <div className="text-sm font-medium" style={{ color: COLOR.DARK }}>{t.title}</div>
                        <div className="text-[11px] text-gray-500">
                          {t.assignee ? `@${t.assignee}` : ""} {t.due ? "• due " + new Date(t.due).toLocaleDateString() : ""}
                        </div>
                        {t.notes ? <div className="text-xs text-gray-700 mt-1">{t.notes}</div> : null}
                        <div className="mt-2 flex items-center gap-2">
                          <select
                            className="border rounded px-2 py-1 text-xs"
                            style={{ borderColor: COLOR.LIGHT }}
                            value={t.status}
                            onChange={(e) => updateTaskInline(t._id, { status: e.target.value })}
                          >
                            <option value="todo">todo</option>
                            <option value="in_progress">in_progress</option>
                            <option value="blocked">blocked</option>
                            <option value="done">done</option>
                          </select>
                          <button className="text-xs text-red-600" onClick={async () => { await deleteTask(id, t._id); await load(); }}>Delete</button>
                        </div>
                      </div>
                    ))}
                    {(tasksByStatus[col] || []).length === 0 && <div className="text-xs text-gray-500">No tasks</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

            {/* Milestones */}
          <div className="rounded-xl border p-4" style={{ borderColor: COLOR.LIGHT }}>
            <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: COLOR.DARK }}>
              <Flag className="w-4 h-4" style={{ color: COLOR.PRIMARY }} /> Milestones
            </h4>
            <form onSubmit={addMilestoneSubmit} className="grid md:grid-cols-4 gap-2 mb-4">
              <input className="border rounded-lg px-3 py-2 text-sm" style={{ borderColor: COLOR.LIGHT }}
                placeholder="Milestone title" value={mileForm.title} onChange={(e) => setMileForm({ ...mileForm, title: e.target.value })} />
              <input className="border rounded-lg px-3 py-2 text-sm" style={{ borderColor: COLOR.LIGHT }}
                type="date" value={mileForm.targetDate} onChange={(e) => setMileForm({ ...mileForm, targetDate: e.target.value })} />
              <select className="border rounded-lg px-3 py-2 text-sm" style={{ borderColor: COLOR.LIGHT }}
                value={mileForm.status} onChange={(e) => setMileForm({ ...mileForm, status: e.target.value })}>
                <option value="planned">planned</option>
                <option value="on_track">on_track</option>
                <option value="at_risk">at_risk</option>
                <option value="done">done</option>
              </select>
              <button className="rounded-lg px-3 py-2 text-white" style={{ backgroundColor: COLOR.PRIMARY }}>
                <Plus className="w-4 h-4" /> Add
              </button>
              <textarea className="border rounded-lg px-3 py-2 text-sm md:col-span-4" rows={2}
                style={{ borderColor: COLOR.LIGHT }} placeholder="Notes (optional)"
                value={mileForm.notes} onChange={(e) => setMileForm({ ...mileForm, notes: e.target.value })} />
            </form>

            <div className="grid md:grid-cols-2 gap-3">
              {(data?.milestones || []).map(m => (
                <div key={m._id} className="rounded border p-3" style={{ borderColor: COLOR.LIGHT }}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium" style={{ color: COLOR.DARK }}>{m.title}</div>
                    <select className="border rounded px-2 py-1 text-xs" style={{ borderColor: COLOR.LIGHT }}
                      value={m.status} onChange={(e) => updateMilestone(id, m._id, { status: e.target.value })}>
                      <option value="planned">planned</option>
                      <option value="on_track">on_track</option>
                      <option value="at_risk">at_risk</option>
                      <option value="done">done</option>
                    </select>
                  </div>
                  <div className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" /> {m.targetDate ? new Date(m.targetDate).toLocaleDateString() : "No date"}
                  </div>
                  {m.notes ? <div className="text-xs text-gray-700 mt-1">{m.notes}</div> : null}
                  <div className="text-right mt-2">
                    <button className="text-xs text-red-600" onClick={async () => { await deleteMilestone(id, m._id); await load(); }}>Delete</button>
                  </div>
                </div>
              ))}
              {(!data?.milestones || data.milestones.length === 0) && <div className="text-sm text-gray-500">No milestones yet.</div>}
            </div>
          </div>

          {/* Timeline / Notes */}
          <div className="rounded-xl border p-4" style={{ borderColor: COLOR.LIGHT }}>
            <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: COLOR.DARK }}>
              <MessageSquare className="w-4 h-4" style={{ color: COLOR.PRIMARY }} /> Timeline & Notes
            </h4>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); addTimelineNote(); }}>
              <input className="border rounded-lg px-3 py-2 text-sm flex-1" style={{ borderColor: COLOR.LIGHT }}
                placeholder="Add a note for both parties…" value={note} onChange={(e) => setNote(e.target.value)} />
              <button className="rounded-lg px-3 py-2 text-white" style={{ backgroundColor: COLOR.PRIMARY }}>
                <Check className="w-4 h-4" />
              </button>
            </form>
            <div className="mt-3 space-y-2 max-h-64 overflow-auto">
              {(data?.timeline || []).slice().reverse().map(ev => (
                <div key={ev._id} className="rounded border p-2 text-sm" style={{ borderColor: COLOR.LIGHT }}>
                  <div className="text-xs text-gray-500 mb-1">
                    {new Date(ev.at).toLocaleString()} • {ev.type} • {ev.meta?.name || ev.author}
                  </div>
                  <div>{ev.text}</div>
                </div>
              ))}
              {(!data?.timeline || data.timeline.length === 0) && <div className="text-sm text-gray-500">No notes yet.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
