// src/components/company/Collaboration.jsx
import { useEffect, useMemo, useState } from "react";
import API from "../../api/axios";
import { Plus, Users, Layers, MessageSquare, Paperclip, Clock, Loader2 } from "lucide-react";
import UploadInput from "../shared/UploadInput";
import KanbanBoard from "../shared/KanbanBoard";
import MoUEditor from "../shared/MoUEditor";

const BRAND = { primary: "#145da0", dark: "#0c2d48", light: "#b1d4e0" };
const Card = ({ children, className="" }) => (
  <div className={`bg-white rounded-2xl border shadow-sm ${className}`} style={{ borderColor: BRAND.light }}>{children}</div>
);

export default function CompanyCollaboration() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [collab, setCollab] = useState(null);
  const [startOpen, setStartOpen] = useState(false);
  const [start, setStart] = useState({ title: "", counterpart: "", summary: "" });
  const [msgBusy, setMsgBusy] = useState(false);

  const board = useMemo(() => (collab?.board || { backlog:[], discussion:[], actions:[], approvals:[] }), [collab]);

  const loadList = async () => {
    setLoading(true);
    try {
      const r = await API.get("/collab/list");
      const arr = Array.isArray(r.data) ? r.data : [];
      setItems(arr);
      if (!activeId && arr[0]?._id) setActiveId(arr[0]._id);
    } catch (e) {
      console.error("list fail:", e?.response?.data || e.message);
      setItems([]);
    } finally { setLoading(false); }
  };
  const loadOne = async(id) => {
    if (!id) return;
    try {
      const r = await API.get(`/collab/${id}`);
      setCollab(r.data || null);
    } catch (e) {
      console.error("open fail:", e?.response?.data || e.message);
      setCollab(null);
    }
  };
  useEffect(()=>{ loadList(); },[]);
  useEffect(()=>{ if (activeId) loadOne(activeId); },[activeId]);

  // create collab
  const onStart = async (e) => {
    e.preventDefault();
    try {
      const r = await API.post("/collab/start", start);
      setStartOpen(false); setStart({ title:"", counterpart:"", summary:"" });
      await loadList();
      setActiveId(r?.data?._id || null);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to start");
    }
  };

  // meta
  const patch = async (body) => {
    if (!collab?._id) return;
    try {
      const r = await API.patch(`/collab/${collab._id}`, body);
      setCollab(r.data);
      setItems(p => p.map(x => x._id===r.data._id ? { ...x, title:r.data.title, stage:r.data.stage } : x));
    } catch (e) { alert(e?.response?.data?.message || "Update failed"); }
  };

  // tasks
  const addTask = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = {
      title: f.get("title"),
      column: f.get("column"),
      assigneeRole: f.get("role"),
      due: f.get("due") || undefined,
      notes: f.get("notes") || ""
    };
    if (!body.title) return;
    await API.post(`/collab/${collab._id}/tasks`, body);
    e.currentTarget.reset();
    await loadOne(collab._id);
  };
  const moveTask = async (taskId, dest) => {
    await API.patch(`/collab/${collab._id}/tasks/${taskId}`, { toColumn: dest });
    await loadOne(collab._id);
  };
  const toggleTask = async (taskId, done) => {
    await API.patch(`/collab/${collab._id}/tasks/${taskId}`, { done });
    await loadOne(collab._id);
  };

  // messages
  const send = async ({ text, linkArr, fileList }) => {
    setMsgBusy(true);
    try {
      const fd = new FormData();
      if (text) fd.append("text", text);
      (linkArr || []).forEach(l => fd.append("links", l));
      if (fileList && fileList.length) {
        Array.from(fileList).forEach(f => fd.append("files", f));
      }
      await API.post(`/collab/${collab._id}/messages`, fd, { headers: { "Content-Type":"multipart/form-data" } });
      await loadOne(collab._id);
    } catch (e) { alert(e?.response?.data?.message || "Send failed"); }
    finally { setMsgBusy(false); }
  };

  // MoU
  const saveMou = async (doc) => {
    const r = await API.post(`/collab/${collab._id}/mou`, doc);
    await loadOne(collab._id);
    return r.data;
  };
  const signMou = async (role, { name, title }) => {
    await API.post(`/collab/${collab._id}/mou/sign`, { name, title });
    await loadOne(collab._id);
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-10 gap-6">
        <aside className="lg:col-span-3">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold" style={{ color: BRAND.dark }}>Collaborations</h3>
              <button onClick={()=>setStartOpen(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-white" style={{ background: BRAND.primary }}>
                <Plus className="w-4 h-4" /> New
              </button>
            </div>
            <div className="mt-3 rounded-xl border overflow-hidden" style={{ borderColor: BRAND.light }}>
              {loading ? (
                <div className="p-4 text-sm text-gray-600 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </div>
              ) : items.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">No collaborations. Create one.</div>
              ) : (
                <ul className="divide-y" style={{ borderColor: BRAND.light }}>
                  {items.map(it => (
                    <li key={it._id}>
                      <button onClick={()=>setActiveId(it._id)} className={`w-full text-left px-4 py-3 hover:bg-slate-50 ${activeId===it._id?"bg-[#b1d4e033]":""}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium" style={{ color: BRAND.dark }}>{it.title}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full border" style={{ borderColor: BRAND.light, color: BRAND.dark }}>
                            {it.stage}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          <Users className="inline w-3 h-3 mr-1" />
                          {it.university?.name || "University"}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </aside>

        <section className="lg:col-span-7">
          {!collab ? (
            <Card className="p-8 grid place-items-center text-gray-600">Select a collaboration…</Card>
          ) : (
            <div className="space-y-6">
              <Card className="p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold" style={{ color: BRAND.dark }}>{collab.title}</h3>
                    <p className="text-sm text-gray-600">{collab.company?.name || "Company"} ↔ {collab.university?.name || "University"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={collab.stage}
                      onChange={(e)=>patch({ stage:e.target.value })}
                      className="border rounded-lg px-3 py-2 text-sm"
                      style={{ borderColor: BRAND.light }}
                    >
                      {["draft","review","negotiation","approved","active","completed","archived"].map(s=>(
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      onClick={()=>{ const t = prompt("Update title", collab.title || ""); if (t!=null) patch({ title:t }); }}
                      className="px-3 py-2 rounded-lg border text-sm hover:bg-slate-50"
                      style={{ borderColor: BRAND.light }}
                    >
                      Rename
                    </button>
                  </div>
                </div>
                {collab.summary ? (
                  <p className="text-sm text-gray-700 mt-2">{collab.summary}</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-2">Add a summary to share context.</p>
                )}
              </Card>

              <div className="grid lg:grid-cols-3 gap-6">
                <Card className="p-5 lg:col-span-2">
                  <h4 className="font-semibold flex items-center gap-2 mb-3"><Layers className="w-4 h-4" /> Project Board</h4>
                  <KanbanBoard board={board} onMove={moveTask} onToggle={toggleTask} />

                  <form onSubmit={addTask} className="mt-4 grid md:grid-cols-5 gap-2 bg-[#b1d4e01a] rounded-lg p-3">
                    <input name="title" className="border rounded-lg px-3 py-2 md:col-span-2" placeholder="Task title" />
                    <select name="column" className="border rounded-lg px-3 py-2">
                      <option value="backlog">Backlog</option>
                      <option value="discussion">Discussion</option>
                      <option value="actions">Actions</option>
                      <option value="approvals">Approvals</option>
                    </select>
                    <select name="role" className="border rounded-lg px-3 py-2">
                      <option value="both">Both</option>
                      <option value="company">Company</option>
                      <option value="university">University</option>
                    </select>
                    <input type="date" name="due" className="border rounded-lg px-3 py-2" />
                    <input name="notes" placeholder="notes (optional)" className="border rounded-lg px-3 py-2 md:col-span-5" />
                    <div className="md:col-span-5">
                      <button className="rounded-lg px-3 py-2 text-white" style={{ background: BRAND.primary }}>Add Task</button>
                    </div>
                  </form>
                </Card>

                <Card className="p-5">
                  <h4 className="font-semibold flex items-center gap-2 mb-3"><MessageSquare className="w-4 h-4" /> Messages</h4>
                  <div className="space-y-3 max-h-80 overflow-auto pr-2">
                    {(collab?.messages || []).slice().reverse().map(m => (
                      <div key={m._id} className="rounded-lg border p-3" style={{ borderColor: BRAND.light }}>
                        <div className="text-xs text-gray-500">{m.authorName || m.authorRole} • {new Date(m.createdAt || m.updatedAt || Date.now()).toLocaleString()}</div>
                        {m.text && <div className="text-sm mt-1">{m.text}</div>}
                        {Array.isArray(m.attachments) && m.attachments.length > 0 && (
                          <div className="mt-2">
                            {m.attachments.map((a, i) => (
                              <div key={i} className="text-xs">
                                <a className="text-blue-600 hover:underline" href={a.url} target="_blank" rel="noreferrer">
                                  <Paperclip className="inline w-3 h-3 mr-1" /> {a.name || a.url}
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {(collab?.messages || []).length === 0 && <div className="text-sm text-gray-500">No messages yet.</div>}
                  </div>
                  <div className="mt-3">
                    <UploadInput busy={msgBusy} onSend={send} />
                  </div>
                </Card>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="p-5">
                  <h4 className="font-semibold flex items-center gap-2 mb-3"><Clock className="w-4 h-4" /> Timeline</h4>
                  <div className="space-y-2 max-h-60 overflow-auto pr-2">
                    {(collab?.timeline || []).slice().reverse().map((t, idx) => (
                      <div key={idx} className="text-sm">
                        <span className="text-gray-700 font-medium">{t.type}</span>
                        <span className="text-gray-500"> • {new Date(t.at).toLocaleString()}</span>
                        {t.by ? <span className="text-gray-500"> • by {t.by}</span> : null}
                        {t.text ? <div className="text-xs text-gray-600">{t.text}</div> : null}
                      </div>
                    ))}
                    {(collab?.timeline || []).length === 0 && <div className="text-sm text-gray-500">No events yet.</div>}
                  </div>
                </Card>
                <MoUEditor
                  mou={collab?.mou}
                  role="company"
                  onSave={saveMou}
                  onSign={signMou}
                />
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Start modal */}
      {startOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 grid place-items-center p-4">
          <form onSubmit={onStart} className="w-full max-w-xl bg-white rounded-2xl p-6 shadow-xl border" style={{ borderColor: BRAND.light }}>
            <h3 className="text-lg font-semibold" style={{ color: BRAND.dark }}>Start Collaboration</h3>
            <p className="text-xs text-gray-600 mt-1">Enter University <b>username</b> or registered <b>email</b>.</p>
            <div className="grid gap-3 mt-4">
              <input className="border rounded px-3 py-2" placeholder="Title" value={start.title} onChange={(e)=>setStart(p=>({...p,title:e.target.value}))} required />
              <input className="border rounded px-3 py-2" placeholder="Counterpart (username or email)" value={start.counterpart} onChange={(e)=>setStart(p=>({...p,counterpart:e.target.value}))} required />
              <textarea className="border rounded px-3 py-2" rows={3} placeholder="Short summary (optional)" value={start.summary} onChange={(e)=>setStart(p=>({...p,summary:e.target.value}))} />
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" onClick={()=>setStartOpen(false)} className="px-4 py-2 rounded-lg border">Cancel</button>
              <button className="px-4 py-2 rounded-lg text-white" style={{ background: BRAND.primary }}>Create</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
