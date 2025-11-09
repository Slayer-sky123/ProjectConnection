import { useEffect, useMemo, useState } from "react";
import { collab } from "../../api/collab";
import Board from "./Board";
import ChatBox from "./ChatBox";
import KpiTable from "./KpiTable";
import { Layers, MessageSquare, Paperclip, FileText, CalendarDays } from "lucide-react";

const BRAND = { primary: "#145da0", dark: "#0c2d48", light: "#b1d4e0" };
const Card = ({ children }) => <div className="bg-white rounded-2xl border shadow-sm p-6" style={{ borderColor: BRAND.light }}>{children}</div>;

export default function CollabWorkspace() {
  const [items, setItems] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [docTitle, setDocTitle] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [addingDoc, setAddingDoc] = useState(false);

  const [c, setC] = useState(null);
  const board = useMemo(() => (c?.board || { backlog: [], discussion: [], actions: [], approvals: [] }), [c]);

  const loadList = async () => { setItems(await collab.list()); };
  const loadOne = async (id) => setC(id ? await collab.get(id) : null);

  useEffect(() => { loadList(); }, []);
  useEffect(() => { if (activeId) loadOne(activeId); }, [activeId]);
  useEffect(() => { if (!activeId && items[0]?._id) setActiveId(items[0]._id); }, [items, activeId]);

  const move = async (taskId, dest) => {
    await collab.updateTask(c._id, taskId, { toColumn: dest });
    await loadOne(c._id);
  };
  const toggle = async (taskId, done) => {
    await collab.updateTask(c._id, taskId, { done });
    await loadOne(c._id);
  };

  const addDoc = async (e) => {
    e.preventDefault();
    if (!docTitle.trim() || !docUrl.trim()) return;
    setAddingDoc(true);
    await collab.addDoc(c._id, { title: docTitle.trim(), url: docUrl.trim() });
    setDocTitle(""); setDocUrl("");
    setAddingDoc(false);
    await loadOne(c._id);
  };
  const removeDoc = async (docId) => {
    await collab.deleteDoc(c._id, docId);
    await loadOne(c._id);
  };

  return (
    <div className="grid lg:grid-cols-10 gap-6">
      {/* Sidebar */}
      <aside className="lg:col-span-3 bg-white rounded-2xl border shadow-sm p-4" style={{ borderColor: BRAND.light }}>
        <div className="text-lg font-semibold" style={{ color: BRAND.dark }}>Collaborations</div>
        <div className="mt-3 rounded-xl border overflow-hidden" style={{ borderColor: BRAND.light }}>
          {items.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No collaborations yet.</div>
          ) : (
            <ul className="divide-y" style={{ borderColor: BRAND.light }}>
              {items.map((it) => (
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
                      {(it.company?.name || "Company")} ↔ {(it.university?.name || "University")}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Main */}
      <section className="lg:col-span-7 space-y-6">
        {!c ? (
          <div className="bg-white rounded-2xl border shadow-sm p-8 grid place-items-center text-gray-600" style={{ borderColor: BRAND.light }}>
            Select a collaboration…
          </div>
        ) : (
          <>
            <Card>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold" style={{ color: BRAND.dark }}>{c.title}</h3>
                  <p className="text-sm text-gray-600">
                    {(c.company?.name || "Company")} ↔ {(c.university?.name || "University")}
                  </p>
                  <div className="text-xs text-gray-600 mt-1 flex items-center gap-2">
                    <CalendarDays className="w-3 h-3" />
                    Effective {new Date(c.effectiveDate).toLocaleDateString()} • {c.durationYears} year(s)
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={c.stage || "draft"}
                    onChange={async (e) => { const updated = await collab.patch(c._id, { stage: e.target.value }); setC(updated || c); }}
                    className="border rounded-lg px-3 py-2 text-sm"
                    style={{ borderColor: BRAND.light }}
                  >
                    {["draft", "review", "negotiation", "approved", "active", "completed", "archived"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              {c.summary ? (
                <p className="mt-3 text-sm text-gray-700">{c.summary}</p>
              ) : (
                <p className="mt-3 text-xs text-gray-500">No summary provided.</p>
              )}
            </Card>

            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="p-5 lg:col-span-2">
                <h4 className="font-semibold flex items-center gap-2 mb-3" style={{ color: BRAND.dark }}>
                  <Layers className="w-4 h-4" /> Project Board
                </h4>
                <Board board={board} onMove={move} onToggleDone={toggle} />
              </Card>

              <Card className="p-5">
                <h4 className="font-semibold flex items-center gap-2 mb-3" style={{ color: BRAND.dark }}>
                  <MessageSquare className="w-4 h-4" /> Messages
                </h4>
                <div style={{ height: 360 }}>
                  <ChatBox collabId={c._id} />
                </div>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <h4 className="font-semibold flex items-center gap-2 mb-3" style={{ color: BRAND.dark }}>
                  <FileText className="w-4 h-4" /> KPIs & Deliverables
                </h4>
                <KpiTable kpis={c.kpis} />
              </Card>

              <Card>
                <h4 className="font-semibold flex items-center gap-2 mb-3" style={{ color: BRAND.dark }}>
                  <Paperclip className="w-4 h-4" /> Documents
                </h4>
                <form onSubmit={addDoc} className="grid sm:grid-cols-3 gap-2 mb-3">
                  <input className="border rounded-lg px-3 py-2 sm:col-span-1" style={{ borderColor: BRAND.light }}
                         placeholder="Title" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} />
                  <input className="border rounded-lg px-3 py-2 sm:col-span-2" style={{ borderColor: BRAND.light }}
                         placeholder="URL (drive/link)" value={docUrl} onChange={(e) => setDocUrl(e.target.value)} />
                  <button className="px-3 py-2 rounded-lg text-white sm:col-span-3"
                          style={{ backgroundColor: BRAND.primary }} disabled={addingDoc}>
                    {addingDoc ? "Adding…" : "Add Document"}
                  </button>
                </form>
                <ul className="space-y-2">
                  {(c.docs || []).map((d) => (
                    <li key={d._id || d.id} className="rounded border p-2 flex items-center justify-between"
                        style={{ borderColor: BRAND.light }}>
                      <a href={d.url} target="_blank" rel="noreferrer" className="text-sm text-blue-700 underline">{d.title}</a>
                      <button className="text-xs px-2 py-1 rounded border hover:bg-slate-50"
                              style={{ borderColor: BRAND.light }}
                              onClick={() => removeDoc(d._id || d.id)}>
                        Remove
                      </button>
                    </li>
                  ))}
                  {(c.docs || []).length === 0 && <li className="text-sm text-gray-500">No documents yet.</li>}
                </ul>
              </Card>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
