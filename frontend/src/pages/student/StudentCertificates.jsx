// src/components/student/StudentCertificates.jsx
import { useEffect, useMemo, useState } from "react";
import { listMyCertificates } from "../../api/certificates";
import { Filter, Copy, ExternalLink, ShieldCheck } from "lucide-react";

export default function StudentCertificates() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const rows = await listMyCertificates();
        setItems(rows || []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const t = q.toLowerCase();
    return items.filter((c) => {
      const text = [c.title, c.description, c?.university?.name, c.hash, c.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const statusOk = status === "all" ? true : (c.status || "").toLowerCase() === status;
      return text.includes(t) && statusOk;
    });
  }, [items, q, status]);

  const copyPublicVerifyLink = (hash) => {
    if (!hash) {
      alert("This certificate doesn’t have a verification hash yet.");
      return;
    }
    const url = `${window.location.origin}/verify/${hash}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-9 w-9 rounded-xl grid place-items-center text-white bg-emerald-600">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Certificates</h1>
          <p className="text-xs text-slate-500">Only essential details are shown here. Full metadata is private to your university.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-4">
        <div className="flex items-center gap-2 rounded-xl p-2 flex-1 bg-slate-50 ring-1 ring-slate-200">
          <Filter className="w-4 h-4 text-gray-600" />
          <input
            className="bg-transparent flex-1 outline-none text-sm"
            placeholder="Search by title, description, university, or hash"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          style={{ borderColor: "#e5e7eb" }}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="issued">Issued</option>
          <option value="revoked">Revoked</option>
        </select>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <div className="md:col-span-2 xl:col-span-3 p-6 text-sm text-gray-600 bg-white rounded-xl border border-slate-200">
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="md:col-span-2 xl:col-span-3 p-6 text-sm text-gray-500 bg-white rounded-xl border border-slate-200">
            No certificates found.
          </div>
        ) : (
          filtered.map((c) => (
            <div key={c._id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm text-slate-500">Title</div>
                  <div className="font-semibold text-slate-900">{c.title}</div>
                </div>
                {(c.status || "").toLowerCase() === "revoked" ? (
                  <span className="text-[11px] px-2 py-1 rounded-full border border-rose-200 text-rose-700 bg-rose-50 h-fit">
                    Revoked
                  </span>
                ) : (
                  <span className="text-[11px] px-2 py-1 rounded-full border border-emerald-200 text-emerald-700 bg-emerald-50 h-fit">
                    Issued
                  </span>
                )}
              </div>

              {c.description ? (
                <p className="text-sm text-slate-700 mt-2 line-clamp-3">{c.description}</p>
              ) : (
                <p className="text-sm text-slate-500 mt-2">—</p>
              )}

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div>
                  <div className="text-xs text-slate-500">University</div>
                  <div className="text-sm font-medium text-slate-900">{c?.university?.name || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Issue Date</div>
                  <div className="text-sm font-medium text-slate-900">{new Date(c.issueDate).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-[11px] text-slate-500">
                  Hash: {c.hash ? <code className="select-all">{c.hash.slice(0, 10)}…</code> : "—"}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border"
                    onClick={() => copyPublicVerifyLink(c.hash)}
                    disabled={!c.hash}
                    title={!c.hash ? "No hash available" : "Copy verification link"}
                  >
                    <Copy className="w-3 h-3" /> Copy Link
                  </button>
                  {c.hash && (
                    <a
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border"
                      href={`/verify/${c.hash}`}
                      target="_blank"
                      rel="noreferrer"
                      title="Open public verification"
                    >
                      <ExternalLink className="w-3 h-3" /> Verify
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
