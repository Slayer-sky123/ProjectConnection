// src/components/shared/KanbanBoard.jsx
import { useMemo } from "react";
import { Calendar, Check } from "lucide-react";

const BRAND = { border: "#b1d4e0", primary: "#145da0", dark:"#0c2d48" };

export default function KanbanBoard({ board, onMove, onToggle }) {
  const cols = useMemo(() => ([
    { key:"backlog", label:"Backlog" },
    { key:"discussion", label:"Discussion" },
    { key:"actions", label:"Actions" },
    { key:"approvals", label:"Approvals" },
  ]), []);

  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
      {cols.map(c => {
        const tasks = Array.isArray(board?.[c.key]) ? board[c.key] : [];
        return (
          <div key={c.key} className="rounded-xl border p-3 bg-white" style={{ borderColor: BRAND.border }}>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-sm font-semibold" style={{ color: BRAND.dark }}>{c.label}</h5>
              <span className="text-[11px] text-gray-500">{tasks.length}</span>
            </div>
            <div className="space-y-2">
              {tasks.map(t => (
                <div key={t._id} className="rounded-lg border p-3" style={{ borderColor: BRAND.border }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-sm">{t.title}</div>
                      <div className="text-[11px] text-gray-600 mt-1 flex items-center gap-2">
                        <span>{t.assigneeRole || "both"}</span>
                        {t.due && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            due {new Date(t.due).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {t.notes ? <div className="text-xs text-gray-700 mt-1">{t.notes}</div> : null}
                    </div>
                    <button
                      onClick={() => onToggle?.(t._id, !t.done)}
                      className={`px-2 py-1 rounded text-xs border ${t.done ? "text-emerald-700 border-emerald-200" : "text-gray-700"}`}
                    >
                      <Check className="inline w-3 h-3 mr-1" /> {t.done ? "Done" : "Mark Done"}
                    </button>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {["backlog","discussion","actions","approvals"].map(dest => (
                      dest !== c.key && (
                        <button
                          key={dest}
                          onClick={() => onMove?.(t._id, dest)}
                          className="text-[11px] px-2 py-1 rounded border hover:bg-slate-50"
                          style={{ borderColor: BRAND.border }}
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
