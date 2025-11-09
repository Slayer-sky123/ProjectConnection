// src/components/university/CredentialsPanel.jsx
import { useEffect, useMemo, useState } from "react";
import { getStudents, listCredentials, issueCredential, verifyCredentialPublic } from "../../api/university";
import { BadgeCheck, PlusCircle, CheckCircle2, Search, Filter, Copy, ExternalLink, Loader2 } from "lucide-react";

const PRIMARY = "#145da0";
const DARK = "#0c2d48";
const LIGHT = "#b1d4e0";

export default function CredentialsPanel({ username }) {
  const [students, setStudents] = useState([]);
  const [creds, setCreds] = useState([]);
  const [form, setForm] = useState({ studentId: "", title: "", skillName: "", scorePct: "" });
  const [verifying, setVerifying] = useState({}); // certificateId -> {loading, ok}
  const [q, setQ] = useState("");
  const [net, setNet] = useState("all");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [s, c] = await Promise.all([getStudents(username), listCredentials(username)]);
        setStudents(s || []);
        setCreds(c || []);
      } catch {
        setStudents([]); setCreds([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [username]);

  const filtered = useMemo(() => {
    const t = q.toLowerCase();
    return creds.filter(c => {
      const text = [c.title, c.student?.name, c.student?.email, c.network, c.hash, c.txId, c.certificateId, c.skillName]
        .filter(Boolean).join(" ").toLowerCase();
      const netOk = net === "all" ? true : (c.network || "").toLowerCase() === net;
      return text.includes(t) && netOk;
    });
  }, [creds, q, net]);

  const onIssue = async (e) => {
    e.preventDefault();
    if (!form.studentId || !form.title) return;
    setSaving(true);
    try {
      const saved = await issueCredential(username, {
        studentId: form.studentId,
        title: form.title,
        skillName: form.skillName,
        scorePct: Number(form.scorePct || 0),
        meta: {},
      });
      setCreds((p) => [saved, ...p]);
      setForm({ studentId: "", title: "", skillName: "", scorePct: "" });
    } catch (e) {
      alert("Failed to issue credential");
    } finally {
      setSaving(false);
    }
  };

  const onVerify = async (certificateId) => {
    setVerifying((p) => ({ ...p, [certificateId]: { loading: true, ok: null } }));
    try {
      const res = await verifyCredentialPublic(certificateId);
      setVerifying((p) => ({ ...p, [certificateId]: { loading: false, ok: !!res.verified } }));
    } catch {
      setVerifying((p) => ({ ...p, [certificateId]: { loading: false, ok: false } }));
    }
  };

  const copy = (val) => navigator.clipboard.writeText(String(val || ""));

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: LIGHT }}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: DARK }}>
          <BadgeCheck className="w-5 h-5" style={{ color: PRIMARY }} />
          Digital Credentials (Blockchain)
        </h2>
      </div>

      {/* Issue form */}
      <form onSubmit={onIssue} className="grid md:grid-cols-5 gap-3 bg-[#b1d4e01a] rounded-lg p-3 mb-5">
        <select
          className="border rounded-lg px-3 py-2"
          style={{ borderColor: LIGHT }}
          value={form.studentId}
          onChange={(e) => setForm({ ...form, studentId: e.target.value })}
        >
          <option value="">Select Student…</option>
          {students.map(s => (<option key={s._id} value={s._id}>{s.name} ({s.email})</option>))}
        </select>
        <input className="border rounded-lg px-3 py-2" style={{ borderColor: LIGHT }} placeholder="Credential Title (e.g., Verified Skill: React)"
               value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input className="border rounded-lg px-3 py-2" style={{ borderColor: LIGHT }} placeholder="Skill Name (optional)"
               value={form.skillName} onChange={(e) => setForm({ ...form, skillName: e.target.value })} />
        <input className="border rounded-lg px-3 py-2" style={{ borderColor: LIGHT }} placeholder="Score % (optional)"
               value={form.scorePct} onChange={(e) => setForm({ ...form, scorePct: e.target.value })} />
        <button className="inline-flex items-center justify-center gap-2 text-white rounded-lg px-3 py-2 hover:opacity-95"
                style={{ backgroundColor: PRIMARY }} disabled={saving}>
          <PlusCircle className="w-4 h-4" /> {saving ? "Issuing…" : "Issue"}
        </button>
      </form>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex items-center gap-2 rounded-lg p-2 flex-1" style={{ background: "#b1d4e01a" }}>
          <Search className="w-4 h-4 text-gray-600" />
          <input
            className="bg-transparent flex-1 outline-none text-sm"
            placeholder="Search credentials, IDs, chains, students…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 rounded-lg p-2 ring-1" style={{ borderColor: LIGHT }}>
          <Filter className="w-4 h-4 text-gray-600" />
          <select className="bg-transparent text-sm outline-none" value={net} onChange={(e) => setNet(e.target.value)}>
            <option value="all">All Networks</option>
            <option value="polygon">polygon</option>
            <option value="ethereum">ethereum</option>
            <option value="solana">solana</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="p-6 text-sm text-gray-600 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => {
            const v = verifying[c.certificateId] || {};
            return (
              <div key={c._id} className="border rounded-xl p-4 hover:shadow-sm" style={{ borderColor: LIGHT }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold" style={{ color: DARK }}>{c.title}</h4>
                    <p className="text-sm text-gray-600">{c.student?.name} · {c.student?.email}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full border" style={{ background: "#b1d4e033", color: DARK, borderColor: LIGHT }}>
                    {c.network}
                  </span>
                </div>

                <div className="text-xs text-gray-600 mt-3 break-words space-y-1">
                  <Row label="Cert ID" value={c.certificateId} onCopy={() => copy(c.certificateId)} />
                  <Row label="txId" value={c.txId} onCopy={() => copy(c.txId)} />
                  <Row label="hash" value={c.hash} onCopy={() => copy(c.hash)} />
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => onVerify(c.certificateId)}
                    className="inline-flex items-center gap-2 text-sm text-white px-3 py-2 rounded-lg"
                    style={{ backgroundColor: PRIMARY }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {v.loading ? "Verifying…" : "Verify"}
                  </button>
                  <a
                    href={c.explorerUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border"
                    style={{ borderColor: LIGHT }}
                    title="Open in block explorer"
                  >
                    <ExternalLink className="w-3 h-3" /> Explorer
                  </a>
                </div>

                {v.ok === true && <p className="text-green-600 text-xs mt-2">✔ Verified on {c.network}</p>}
                {v.ok === false && <p className="text-red-600 text-xs mt-2">✖ Verification failed</p>}
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-sm text-gray-500">No credentials issued yet.</p>}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, onCopy }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-gray-500">{label}:</span>
      <div className="flex items-center gap-2">
        <code className="text-[11px] break-all">{String(value || "").slice(0, 16)}…</code>
        <button className="p-1 rounded hover:bg-slate-100" onClick={onCopy} title="Copy">
          <Copy className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
