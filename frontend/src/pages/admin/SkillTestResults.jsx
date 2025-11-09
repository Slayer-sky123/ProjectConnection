// src/pages/admin/SkillTestResults.jsx
import { useEffect, useMemo, useState } from "react";
import API from "../../api/axios";

/* ---------------------------- inline icons (no deps) ---------------------------- */
const I = {
  Search: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...p}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Download: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...p}>
      <path d="M12 4v12M8 12l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      <rect x="4" y="18" width="16" height="2" rx="1" fill="currentColor" />
    </svg>
  ),
  Refresh: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...p}>
      <path d="M20 12a8 8 0 10-2.34 5.66" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M20 8v4h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  ArrowUp: (p) => (
    <svg viewBox="0 0 24 24" width="14" height="14" {...p}>
      <path d="M12 5l6 6H6l6-6z" fill="currentColor" />
    </svg>
  ),
  ArrowDown: (p) => (
    <svg viewBox="0 0 24 24" width="14" height="14" {...p}>
      <path d="M12 19l-6-6h12l-6 6z" fill="currentColor" />
    </svg>
  ),
  Spinner: (p) => (
    <svg viewBox="0 0 50 50" width="28" height="28" className="animate-spin" {...p}>
      <circle cx="25" cy="25" r="20" stroke="currentColor" strokeWidth="6" fill="none" opacity="0.2" />
      <path d="M45 25a20 20 0 00-20-20" stroke="currentColor" strokeWidth="6" fill="none" />
    </svg>
  ),
};

/* --------------------------------- tiny ui --------------------------------- */
const Card = ({ children, className = "" }) => (
  <div className={`rounded-2xl border border-slate-200 bg-white/75 backdrop-blur shadow-sm ${className}`}>{children}</div>
);

const Stat = ({ label, value, hint, tone = "indigo" }) => {
  const bg = {
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    sky: "bg-sky-50 text-sky-700 border-sky-100",
  }[tone];
  return (
    <Card className={`p-4 ${bg}`}>
      <div className="text-xs uppercase tracking-wide opacity-80">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {hint && <div className="text-xs opacity-80 mt-1">{hint}</div>}
    </Card>
  );
};

const BadgePct = ({ p }) => {
  const tone = p >= 80 ? "bg-emerald-100 text-emerald-700" : p >= 50 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700";
  return <span className={`ml-2 px-2 py-0.5 rounded-full text-[11px] font-medium ${tone}`}>{p}%</span>;
};

const Th = ({ children, onSort, active, dir }) => (
  <th
    onClick={onSort}
    className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-600 cursor-pointer select-none"
  >
    <div className="inline-flex items-center gap-1">
      {children}
      {active ? dir === "asc" ? <I.ArrowUp className="text-slate-500" /> : <I.ArrowDown className="text-slate-500" /> : null}
    </div>
  </th>
);

const IconBtn = ({ title, onClick, children, variant = "ghost", disabled }) => {
  const map = {
    ghost: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200",
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-600",
  };
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`h-9 px-3 rounded-xl text-sm inline-flex items-center gap-2 ${map[variant]} ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
};

/* ============================== main component ============================== */
export default function SkillTestResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [query, setQuery] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [from, setFrom] = useState(""); // yyyy-mm-dd
  const [to, setTo] = useState("");
  const [minPct, setMinPct] = useState("");
  const [maxPct, setMaxPct] = useState("");

  // sort + pagination
  const [sortKey, setSortKey] = useState("date"); // 'date' | 'score' | 'name' | 'skill'
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    (async () => {
      try {
        const res = await API.get("/admin/skill-test-results");
        setResults(res.data || []);
      } catch (err) {
        console.error("Failed to load results:", err?.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // unique skills for filter
  const skills = useMemo(() => {
    const s = new Map();
    results.forEach((r) => {
      const key = r.skill?._id || r.skill;
      if (!key) return;
      s.set(key, r.skill?.name || r.skill || "Unknown");
    });
    return [...s.entries()].map(([id, name]) => ({ id, name })).sort((a,b)=>a.name.localeCompare(b.name));
  }, [results]);

  // filtered dataset
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const start = from ? new Date(from) : null;
    const end = to ? new Date(to + "T23:59:59") : null;
    const min = minPct ? Number(minPct) : null;
    const max = maxPct ? Number(maxPct) : null;

    return results.filter((r) => {
      const name = (r.user?.name || "").toLowerCase();
      const email = (r.user?.email || "").toLowerCase();
      const skillName = (r.skill?.name || "").toLowerCase();
      const date = new Date(r.createdAt);
      const pct = Math.round(((r.score || 0) / (r.total || 1)) * 100);

      if (q && !(name.includes(q) || email.includes(q) || skillName.includes(q))) return false;
      if (skillFilter && (r.skill?._id || r.skill) !== skillFilter) return false;
      if (start && date < start) return false;
      if (end && date > end) return false;
      if (min != null && pct < min) return false;
      if (max != null && pct > max) return false;
      return true;
    });
  }, [results, query, skillFilter, from, to, minPct, maxPct]);

  // sort
  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      if (sortKey === "date") {
        const da = new Date(a.createdAt).getTime();
        const db = new Date(b.createdAt).getTime();
        return sortOrder === "asc" ? da - db : db - da;
      }
      if (sortKey === "score") {
        const pa = (a.score || 0) / (a.total || 1);
        const pb = (b.score || 0) / (b.total || 1);
        return sortOrder === "asc" ? pa - pb : pb - pa;
      }
      if (sortKey === "name") {
        const na = (a.user?.name || "").toLowerCase();
        const nb = (b.user?.name || "").toLowerCase();
        return sortOrder === "asc" ? na.localeCompare(nb) : nb.localeCompare(na);
      }
      if (sortKey === "skill") {
        const sa = (a.skill?.name || "").toLowerCase();
        const sb = (b.skill?.name || "").toLowerCase();
        return sortOrder === "asc" ? sa.localeCompare(sb) : sb.localeCompare(sa);
      }
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortOrder]);

  // pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageClamped = Math.min(page, totalPages);
  const current = sorted.slice((pageClamped - 1) * pageSize, pageClamped * pageSize);

  // stats
  const stats = useMemo(() => {
    const total = filtered.length;
    const users = new Set(filtered.map((r) => r.user?._id || r.user)).size;
    const avgPct = total
      ? Math.round(
          (filtered.reduce((s, r) => s + ((r.score || 0) / (r.total || 1)) * 100, 0) / total) * 10
        ) / 10
      : 0;

    // top skill by attempts
    const bySkill = new Map();
    filtered.forEach((r) => {
      const name = r.skill?.name || "Unknown";
      bySkill.set(name, (bySkill.get(name) || 0) + 1);
    });
    let topSkill = "—";
    let topCount = 0;
    bySkill.forEach((cnt, name) => {
      if (cnt > topCount) {
        topCount = cnt;
        topSkill = name;
      }
    });

    return { total, users, avgPct, topSkill };
  }, [filtered]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  const resetFilters = () => {
    setQuery("");
    setSkillFilter("");
    setFrom("");
    setTo("");
    setMinPct("");
    setMaxPct("");
    setPage(1);
  };

  const exportCSV = () => {
    const header = ["Name", "Email", "Skill", "Score", "Total", "Percent", "Date"];
    const rows = sorted.map((r) => [
      r.user?.name || "N/A",
      r.user?.email || "N/A",
      r.skill?.name || "N/A",
      r.score ?? "",
      r.total ?? "",
      Math.round(((r.score || 0) / (r.total || 1)) * 100),
      new Date(r.createdAt).toLocaleString(),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => String(c).replace(/,/g, " ")).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "skill-test-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-[12px] uppercase tracking-widest text-indigo-500">Analytics</div>
          <h2 className="text-2xl font-semibold text-slate-800">Skill Test Results</h2>
          <p className="text-sm text-slate-500">Search, filter, sort and export your assessment data.</p>
        </div>
        <div className="flex gap-2">
          <IconBtn title="Refresh" onClick={() => window.location.reload()}>
            <I.Refresh />
            Refresh
          </IconBtn>
          <IconBtn title="Export CSV" variant="primary" onClick={exportCSV}>
            <I.Download />
            Export
          </IconBtn>
        </div>
      </div>

      {/* stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Total Attempts" value={stats.total} hint="after filters" tone="indigo" />
        <Stat label="Unique Learners" value={stats.users} tone="sky" />
        <Stat label="Average Score" value={`${stats.avgPct}%`} hint="after filters" tone="emerald" />
        <Stat label="Top Skill" value={stats.topSkill} tone="amber" />
      </div>

      {/* filters */}
      <Card className="p-4 bg-gradient-to-b from-indigo-50/60 to-white">
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search name, email, skill…"
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <div className="absolute left-3 top-2.5 text-slate-500">
              <I.Search />
            </div>
          </div>

          <select
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
            value={skillFilter}
            onChange={(e) => {
              setSkillFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All skills</option>
            {skills.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200"
            />
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              max="100"
              placeholder="Min %"
              value={minPct}
              onChange={(e) => {
                setMinPct(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200"
            />
            <input
              type="number"
              min="0"
              max="100"
              placeholder="Max %"
              value={maxPct}
              onChange={(e) => {
                setMaxPct(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200"
            />
          </div>
        </div>

        <div className="mt-3 flex justify-between items-center">
          <div className="text-xs text-slate-500">
            Showing <b>{current.length}</b> of <b>{filtered.length}</b> filtered results
          </div>
          <button onClick={resetFilters} className="text-xs underline text-slate-600">
            Reset filters
          </button>
        </div>
      </Card>

      {/* table */}
      {loading ? (
        <div className="py-16 text-center text-slate-500">
          <I.Spinner />
          <div className="mt-2 text-sm">Loading results…</div>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-slate-600 bg-slate-50">
          No results match your filters.
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 sticky top-0 z-10">
                <tr>
                  <Th onSort={() => toggleSort("name")} active={sortKey === "name"} dir={sortOrder}>
                    Name
                  </Th>
                  <Th>Email</Th>
                  <Th onSort={() => toggleSort("skill")} active={sortKey === "skill"} dir={sortOrder}>
                    Skill
                  </Th>
                  <Th onSort={() => toggleSort("score")} active={sortKey === "score"} dir={sortOrder}>
                    Score
                  </Th>
                  <Th>Total</Th>
                  <Th onSort={() => toggleSort("date")} active={sortKey === "date"} dir={sortOrder}>
                    Date
                  </Th>
                </tr>
              </thead>
              <tbody>
                {current.map((r, idx) => {
                  const pct = Math.round(((r.score || 0) / (r.total || 1)) * 100);
                  return (
                    <tr key={r._id || idx} className={idx % 2 ? "bg-white" : "bg-slate-50/50"}>
                      <td className="px-4 py-3">{r.user?.name || "N/A"}</td>
                      <td className="px-4 py-3">{r.user?.email || "N/A"}</td>
                      <td className="px-4 py-3">{r.skill?.name || "N/A"}</td>
                      <td className="px-4 py-3 font-semibold">
                        {r.score}
                        <BadgePct p={pct} />
                      </td>
                      <td className="px-4 py-3">{r.total}</td>
                      <td className="px-4 py-3">{new Date(r.createdAt).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* pagination */}
          <div className="p-4 flex flex-wrap items-center justify-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => {
              const isActive = pageClamped === i + 1;
              return (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`h-8 min-w-[2rem] px-2 rounded-full border text-sm ${
                    isActive ? "bg-indigo-600 text-white border-indigo-600" : "bg-white hover:bg-slate-50"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
