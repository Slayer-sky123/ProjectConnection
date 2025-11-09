import { useMemo } from "react";
import { CalendarDays, Check, MoveRight } from "lucide-react";

const BRAND = { primary: "#145da0", dark: "#0c2d48", light: "#b1d4e0" };

export default function Board({ board = {}, onMove, onToggleDone }) {
  const cols = useMemo(() => ([
    { key: "backlog", label: "Backlog" },
    { key: "discussion", label: "Discussion" },
    { key: "actions", label: "Actions" },
    { key: "approvals", label: "Approvals" },
  ]), []);

  const tasksFor = (k) => (Array.isArray(board[k]) ? board[k] : []);

  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
      {cols.map((c) => (
        <div key={c.key} className="rounded-xl border p-3 bg-white" style={{ borderColor: BRAND.light }}>
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-sm font-semibold" style={{ color: BRAND.dark }}>{c.label}</h5>
            <span className="text-[11px] text-gray-500">{tasksFor(c.key).length}</span>
          </div>

          <div className="space-y-2">
            {tasksFor(c.key).map((t) => (
              <div key={t._id || t.id || t.title} className="rounded-lg border p-3" style={{ borderColor: BRAND.light }}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-sm">{t.title}</div>
                    <div className="text-[11px] text-gray-600 mt-1 flex items-center gap-2">
                      <span>{t.assigneeRole || "both"}</span>
                      {t.due ? (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          due {new Date(t.due).toLocaleDateString()}
                        </span>
                      ) : null}
                    </div>
                    {t.notes ? <div className="text-xs text-gray-700 mt-1">{t.notes}</div> : null}
                  </div>
                  <button
                    onClick={() => onToggleDone?.(t._id || t.id, !t.done)}
                    className={`px-2 py-1 rounded text-xs border inline-flex items-center gap-1 ${t.done ? "text-emerald-700 border-emerald-200" : "text-gray-700"}`}
                  >
                    <Check className="w-3 h-3" /> {t.done ? "Done" : "Mark Done"}
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {["backlog", "discussion", "actions", "approvals"].map((dest) => (
                    dest !== c.key && (
                      <button
                        key={dest}
                        onClick={() => onMove?.((t._id || t.id), dest)}
                        className="text-[11px] px-2 py-1 rounded border hover:bg-slate-50 inline-flex items-center gap-1"
                        style={{ borderColor: BRAND.light }}
                      >
                        <MoveRight className="w-3 h-3" /> {dest}
                      </button>
                    )
                  ))}
                </div>
              </div>
            ))}
            {tasksFor(c.key).length === 0 && <div className="text-xs text-gray-500">Empty</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
