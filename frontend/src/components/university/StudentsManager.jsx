// src/components/university/StudentsManager.jsx
import { useEffect, useMemo, useState } from "react";
import API from "../../api/axios";
import {
  Search, Filter, Tag, FileDown, User2, NotebookPen, Award, ChevronDown, ChevronUp
} from "lucide-react";

const COLOR = { PRIMARY: "#145da0", DARK: "#0c2d48", LIGHT: "#b1d4e0" };

export default function StudentsManager({ username }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [edu, setEdu] = useState("all");
  const [openMeta, setOpenMeta] = useState(null);
  const [saving, setSaving] = useState(false);
  const [metaCache, setMetaCache] = useState({}); // {studentId: { labels:[], notes:[], status:"active", __draftNote:"" }}

  const fetchRows = async () => {
    setLoading(true);
    try {
      const rows = await API.get(`/university/${username}/students`).then((r) => r.data);
      setItems(rows || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMeta = async (studentId) => {
    try {
      const data = await API.get(`/university/${username}/students/${studentId}/meta`).then((r) => r.data);
      setMetaCache((prev) => ({ ...prev, [studentId]: data || { labels: [], notes: [], status: "active" } }));
    } catch {
      setMetaCache((prev) => ({ ...prev, [studentId]: { labels: [], notes: [], status: "active" } }));
    }
  };

  useEffect(() => { if (username) fetchRows(); }, [username]);

  const filtered = useMemo(() => {
    const t = q.toLowerCase();
    return items.filter((s) => {
      const text = [s.name, s.email, s.username, s.university, s.primarySkillName, s.studentId]
        .filter(Boolean).join(" ").toLowerCase();
      const eduOk = edu === "all" ? true : (s.education || "").toLowerCase() === edu;
      return text.includes(t) && eduOk;
    });
  }, [items, q, edu]);

  const exportCSV = () => {
    const cols = ["Name", "Email", "StudentID", "University", "Education", "PrimarySkill", "Phone", "CreatedAt"];
    const rows = filtered.map((s) =>
      [
        s.name,
        s.email,
        s.studentId || "",
        s.university,
        s.education,
        s.primarySkillName || "",
        s.phone || "",
        new Date(s.createdAt).toISOString(),
      ]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [cols.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students_${username}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleMeta = async (s) => {
    const id = s._id;
    setOpenMeta(openMeta === id ? null : id);
    if (!metaCache[id]) await loadMeta(id);
  };

  const saveMeta = async (studentId) => {
    const data = metaCache[studentId] || { labels: [], notes: [], status: "active" };
    setSaving(true);
    try {
      const body = { labels: data.labels || [], status: data.status || "active", note: data.__draftNote || "" };
      const saved = await API.post(`/university/${username}/students/${studentId}/meta`, body).then((r) => r.data);
      setMetaCache((prev) => ({ ...prev, [studentId]: { ...saved, __draftNote: "" } }));
    } catch (e) {
      alert(e?.response?.data?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const addLabel = (studentId, label) => {
    if (!label.trim()) return;
    setMetaCache((prev) => {
      const cur = prev[studentId] || { labels: [], notes: [], status: "active" };
      const next = new Set([...(cur.labels || []), label.trim()]);
      return { ...prev, [studentId]: { ...cur, labels: Array.from(next) } };
    });
  };
  const removeLabel = (studentId, l) => {
    setMetaCache((prev) => {
      const cur = prev[studentId] || { labels: [], notes: [], status: "active" };
      return { ...prev, [studentId]: { ...cur, labels: (cur.labels || []).filter((x) => x !== l) } };
    });
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: COLOR.LIGHT }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: COLOR.DARK }}>
          <User2 className="w-5 h-5" style={{ color: COLOR.PRIMARY }} />
          Students Manager
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-slate-50"
            style={{ borderColor: COLOR.LIGHT }}
          >
            <FileDown className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-col sm:flex-row gap-3">
        <div
          className="flex items-center gap-2 rounded-lg p-2 flex-1 bg-slate-50 ring-1"
          style={{ borderColor: COLOR.LIGHT }}
        >
          <Search className="w-4 h-4 text-gray-600" />
          <input
            className="bg-transparent flex-1 outline-none text-sm"
            placeholder="Search by name, email, StudentID, skill, university…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search students"
          />
        </div>
        <div className="flex items-center gap-2 rounded-lg p-2 bg-slate-50 ring-1" style={{ borderColor: COLOR.LIGHT }}>
          <Filter className="w-4 h-4 text-gray-600" />
          <select
            className="bg-transparent text-sm outline-none"
            value={edu}
            onChange={(e) => setEdu(e.target.value)}
            aria-label="Filter by education"
          >
            <option value="all">All Education</option>
            <option value="ug">UG</option>
            <option value="pg">PG</option>
            <option value="diploma">Diploma</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 border rounded-xl overflow-auto" style={{ borderColor: COLOR.LIGHT }}>
        {loading ? (
          <div className="p-6 text-sm text-gray-600">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No students found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10" style={{ background: "#f8fbff", color: COLOR.DARK }}>
              <tr>
                <th className="text-left px-4 py-3">Student</th>
                <th className="text-left px-4 py-3">Education</th>
                <th className="text-left px-4 py-3">Primary Skill</th>
                <th className="text-left px-4 py-3">University</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const m = metaCache[s._id];
                const expanded = openMeta === s._id;
                return (
                  <tr key={s._id} className="border-t align-top" style={{ borderColor: COLOR.LIGHT }}>
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {s.name}{" "}
                        {s.studentId ? <span className="text-[11px] text-gray-600 ml-1">[{s.studentId}]</span> : null}
                      </div>
                      <div className="text-xs text-gray-600">{s.email}</div>
                      <div className="text-[11px] text-gray-500">{new Date(s.createdAt).toLocaleString()}</div>
                    </td>
                    <td className="px-4 py-3">{s.education || "—"}</td>
                    <td className="px-4 py-3">{s.primarySkillName || "—"}</td>
                    <td className="px-4 py-3">{s.university || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={`/university/${username}/certs?student=${encodeURIComponent(s._id)}`}
                          className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border hover:bg-slate-50"
                          style={{ borderColor: COLOR.LIGHT }}
                          title="View this student's certificates"
                        >
                          <Award className="w-3 h-3" /> Certificates
                        </a>
                        <button
                          className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border hover:bg-slate-50"
                          style={{ borderColor: COLOR.LIGHT }}
                          onClick={() => toggleMeta(s)}
                          aria-expanded={expanded}
                          aria-controls={`meta-${s._id}`}
                        >
                          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />} Manage
                        </button>
                      </div>

                      {expanded && (
                        <div
                          id={`meta-${s._id}`}
                          className="mt-3 rounded-lg border p-3 space-y-3"
                          style={{ borderColor: COLOR.LIGHT }}
                        >
                          {/* STATUS */}
                          <div>
                            <div className="text-xs text-gray-600 mb-1">Status</div>
                            <select
                              value={m?.status || "active"}
                              onChange={(e) =>
                                setMetaCache((prev) => ({
                                  ...prev,
                                  [s._id]: { ...(prev[s._id] || {}), status: e.target.value },
                                }))
                              }
                              className="border rounded-lg px-2 py-1 text-sm"
                              style={{ borderColor: COLOR.LIGHT }}
                            >
                              <option value="active">active</option>
                              <option value="blocked">blocked</option>
                              <option value="alumni">alumni</option>
                            </select>
                          </div>

                          {/* LABELS */}
                          <div>
                            <div className="text-xs text-gray-600 mb-1">Labels</div>
                            <div className="flex flex-wrap gap-2">
                              {(m?.labels || []).map((l) => (
                                <span
                                  key={l}
                                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border"
                                  style={{ borderColor: COLOR.LIGHT }}
                                >
                                  <Tag className="w-3 h-3" /> {l}
                                  <button
                                    className="text-gray-500 hover:text-red-600"
                                    onClick={() => removeLabel(s._id, l)}
                                    aria-label={`Remove label ${l}`}
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                            <div className="mt-2 flex gap-2">
                              <input
                                className="border rounded-lg px-2 py-1 text-sm flex-1"
                                style={{ borderColor: COLOR.LIGHT }}
                                placeholder="Add label and press Enter"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    addLabel(s._id, e.currentTarget.value);
                                    e.currentTarget.value = "";
                                  }
                                }}
                                aria-label="Add label"
                              />
                            </div>
                          </div>

                          {/* NOTES */}
                          <div>
                            <div className="text-xs text-gray-600 mb-1">Add Note</div>
                            <textarea
                              className="border rounded-lg px-2 py-1 text-sm w-full"
                              rows={2}
                              style={{ borderColor: COLOR.LIGHT }}
                              placeholder="Write a note…"
                              value={m?.__draftNote || ""}
                              onChange={(e) =>
                                setMetaCache((prev) => ({
                                  ...prev,
                                  [s._id]: {
                                    ...(prev[s._id] || { labels: [], notes: [], status: "active" }),
                                    __draftNote: e.target.value,
                                  },
                                }))
                              }
                            />
                            {Array.isArray(m?.notes) && m.notes.length > 0 && (
                              <div className="mt-2 text-xs text-gray-600">
                                <div className="font-medium mb-1">Previous Notes</div>
                                <div className="space-y-1 max-h-24 overflow-auto">
                                  {m.notes
                                    .slice()
                                    .reverse()
                                    .map((n, idx) => (
                                      <div key={idx} className="rounded border px-2 py-1" style={{ borderColor: COLOR.LIGHT }}>
                                        <div className="text-[11px] text-gray-500">{new Date(n.at).toLocaleString()}</div>
                                        <div>{n.text}</div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* SAVE */}
                          <div className="text-right">
                            <button
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-white"
                              style={{ backgroundColor: COLOR.PRIMARY }}
                              onClick={() => saveMeta(s._id)}
                              disabled={saving}
                            >
                              <NotebookPen className="w-4 h-4" /> {saving ? "Saving…" : "Save"}
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
