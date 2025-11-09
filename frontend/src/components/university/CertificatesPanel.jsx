// src/components/university/CertificatesPanel.jsx
import { useEffect, useMemo, useState } from "react";
import {
  issueCertificate,
  listCertificates,
  revokeCertificate,
  unrevokeCertificate,
  deleteCertificate,
  searchStudentsForCertificates,
} from "../../api/certificates";
import {
  Search, Plus, ShieldCheck, Ban, Copy, RefreshCcw, UserSearch, Undo2, Trash2, ExternalLink, Filter, Loader2
} from "lucide-react";

const LIGHT = "#b1d4e0";
const DARK = "#0c2d48";
const PRIMARY = "#145da0";

export default function CertificatesPanel({ username }) {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [studentQuery, setStudentQuery] = useState("");
  const [studentOptions, setStudentOptions] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    issueDate: new Date().toISOString().slice(0, 10),
  });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const rows = await listCertificates(username);
      setItems(rows || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (username) fetchAll(); }, [username]);

  const filtered = useMemo(() => {
    const t = q.toLowerCase();
    return items
      .filter(c => {
        if (status === "all") return true;
        const s = (c.status || "issued").toLowerCase();
        return status === "revoked" ? s === "revoked" : s !== "revoked";
      })
      .filter((c) => {
        const text = [
          c.title, c.description, c.hash, c.status, c.studentName, c.studentEmail, c.extras?.studentId
        ].filter(Boolean).join(" ").toLowerCase();
        return text.includes(t);
      });
  }, [items, q, status]);

  const onSearchStudents = async () => {
    if (!studentQuery.trim()) { setStudentOptions([]); return; }
    try {
      const list = await searchStudentsForCertificates(username, studentQuery.trim());
      setStudentOptions(Array.isArray(list) ? list : []);
    } catch {
      setStudentOptions([]);
    }
  };

  const copyPublicLink = (hash) => {
    const url = `${window.location.origin}/verify/${hash}`;
    navigator.clipboard.writeText(url);
  };

  const onIssue = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !form.title.trim()) return;
    setSaving(true);
    try {
      await issueCertificate(username, {
        studentKey: selectedStudent._id, // single studentKey
        title: form.title.trim(),
        description: form.description.trim(),
        issueDate: form.issueDate,
      });
      setOpenForm(false);
      setSelectedStudent(null);
      setForm({ title: "", description: "", issueDate: new Date().toISOString().slice(0, 10) });
      await fetchAll();
    } catch (err) {
      alert(err?.response?.data?.message || "Issue failed");
    } finally {
      setSaving(false);
    }
  };

  const onRevoke = async (id) => {
    if (!window.confirm("Revoke this certificate?")) return;
    try {
      await revokeCertificate(username, id);
      await fetchAll();
    } catch {
      alert("Revoke failed");
    }
  };

  const onUnrevoke = async (id) => {
    if (!window.confirm("Un-revoke this certificate?")) return;
    try {
      await unrevokeCertificate(username, id);
      await fetchAll();
    } catch {
      alert("Un-revoke failed");
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm("Permanently delete this certificate? This cannot be undone.")) return;
    try {
      await deleteCertificate(username, id);
      await fetchAll();
    } catch {
      alert("Delete failed");
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: LIGHT }}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: DARK }}>
          <ShieldCheck className="w-5 h-5" style={{ color: PRIMARY }} />
          Certificates (Search · Issue · Manage · Verify)
        </h2>
        <button
          className="inline-flex items-center gap-2 text-white px-3 py-2 rounded-lg self-start"
          style={{ backgroundColor: PRIMARY }}
          onClick={() => { setOpenForm(true); setSelectedStudent(null); setStudentQuery(""); setStudentOptions([]); }}
        >
          <Plus className="w-4 h-4" /> Issue Certificate
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex items-center gap-2 rounded-lg p-2 flex-1" style={{ background: "#b1d4e01a" }}>
          <Search className="w-4 h-4 text-gray-600" />
          <input
            className="bg-transparent flex-1 outline-none text-sm"
            placeholder="Search by student name/email/StudentID, title, description, hash…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <span className="text-xs text-gray-500">{filtered.length} / {items.length}</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg p-2 ring-1" style={{ borderColor: LIGHT }}>
          <Filter className="w-4 h-4 text-gray-600" />
          <select
            className="bg-transparent text-sm outline-none"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All</option>
            <option value="issued">Issued</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>
      </div>

      <div className="border rounded-xl overflow-hidden" style={{ borderColor: LIGHT }}>
        {loading ? (
          <div className="p-6 text-sm text-gray-600 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10" style={{ background: "#f8fbff", color: DARK }}>
                <tr>
                  <th className="text-left px-4 py-3">Student</th>
                  <th className="text-left px-4 py-3">Title</th>
                  <th className="text-left px-4 py-3">Issued</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Hash</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c._id} className="border-t" style={{ borderColor: LIGHT }}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{c.studentName}</div>
                      <div className="text-xs text-gray-600">{c.studentEmail}</div>
                      {c.extras?.studentId && (
                        <div className="text-[11px] text-gray-500">StudentID: {c.extras.studentId}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{c.title}</div>
                      <div className="text-xs text-gray-600">{c.description || "—"}</div>
                    </td>
                    <td className="px-4 py-3">{new Date(c.issueDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {(c.status || "").toLowerCase() === "revoked" ? (
                        <span className="text-xs px-2 py-1 rounded-full border" style={{ borderColor: "#fecaca", color: "#b91c1c", background: "#fee2e2" }}>
                          Revoked
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full border" style={{ borderColor: LIGHT, color: DARK, background: "#b1d4e033" }}>
                          Issued
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="text-xs">{c.hash.slice(0, 10)}…</code>
                        <button className="p-1 rounded hover:bg-slate-100" onClick={() => copyPublicLink(c.hash)} title="Copy verify link">
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border"
                          style={{ borderColor: LIGHT }}
                          href={`/verify/${c.hash}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Open public verify page"
                        >
                          <ExternalLink className="w-3 h-3" /> Verify
                        </a>

                        {(c.status || "").toLowerCase() !== "revoked" ? (
                          <button
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border text-red-600"
                            style={{ borderColor: "#fecaca" }}
                            onClick={() => onRevoke(c._id)}
                            title="Revoke"
                          >
                            <Ban className="w-3 h-3" /> Revoke
                          </button>
                        ) : (
                          <button
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border"
                            style={{ borderColor: LIGHT }}
                            onClick={() => onUnrevoke(c._id)}
                            title="Un-revoke"
                          >
                            <Undo2 className="w-3 h-3" /> Un-revoke
                          </button>
                        )}

                        <button
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border text-rose-700"
                          style={{ borderColor: "#fecaca" }}
                          onClick={() => onDelete(c._id)}
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500">No certificates.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {openForm && (
        <div className="fixed inset-0 z-50 bg-black/30 grid place-items-center p-4">
          <form
            onSubmit={onIssue}
            className="w-full max-w-2xl bg-white rounded-2xl p-6 shadow-xl overflow-y-auto max-h-[90vh] border"
            style={{ borderColor: LIGHT }}
          >
            <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: DARK }}>
              <RefreshCcw className="w-5 h-5" /> Issue Certificate
            </h3>

            {/* student search */}
            <div className="mt-4">
              <label className="text-xs text-gray-600">Find Student (name / email / 6-digit StudentID)</label>
              <div className="flex gap-2">
                <input
                  className="border rounded-lg px-3 py-2 flex-1"
                  style={{ borderColor: LIGHT }}
                  placeholder="e.g. Priya / priya@uni.edu / 123456"
                  value={studentQuery}
                  onChange={(e) => setStudentQuery(e.target.value)}
                />
                <button
                  type="button"
                  onClick={onSearchStudents}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-white"
                  style={{ backgroundColor: PRIMARY }}
                >
                  <UserSearch className="w-4 h-4" /> Search
                </button>
              </div>

              {studentOptions.length > 0 && (
                <div className="mt-2 max-h-48 overflow-auto border rounded-lg" style={{ borderColor: LIGHT }}>
                  {studentOptions.map((s) => (
                    <button
                      type="button"
                      key={s._id}
                      onClick={() => setSelectedStudent(s)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${
                        selectedStudent?._id === s._id ? "bg-[#b1d4e033]" : ""
                      }`}
                    >
                      <div className="font-medium">
                        {s.name} {s.studentId ? <span className="text-[11px] ml-2 text-gray-600">[{s.studentId}]</span> : null}
                      </div>
                      <div className="text-xs text-gray-600">{s.email} · {s.university}</div>
                    </button>
                  ))}
                </div>
              )}

              {selectedStudent && (
                <div className="mt-2 text-xs text-gray-700">
                  Selected: <b>{selectedStudent.name}</b> · {selectedStudent.email}
                  {selectedStudent.studentId ? ` · ID ${selectedStudent.studentId}` : ""}
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <input
                className="border rounded-lg px-3 py-2"
                style={{ borderColor: LIGHT }}
                placeholder="Title (e.g., B.Tech CSE 2025)"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <input
                className="border rounded-lg px-3 py-2"
                style={{ borderColor: LIGHT }}
                placeholder="Issue Date"
                type="date"
                value={form.issueDate}
                onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                required
              />
              <textarea
                className="border rounded-lg px-3 py-2 sm:col-span-2"
                style={{ borderColor: LIGHT }}
                rows={3}
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setOpenForm(false)} className="px-4 py-2 rounded-lg border" style={{ borderColor: LIGHT }}>
                Cancel
              </button>
              <button disabled={!selectedStudent || !form.title.trim() || saving}
                className="px-4 py-2 rounded-lg text-white" style={{ backgroundColor: PRIMARY }}>
                {saving ? "Issuing…" : "Issue"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
