// src/pages/student/JobsBoard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import API from "../../api/axios";
import useSmartState from "../../hooks/useSmartState";
import { useSkill } from "../../context/SkillContext.jsx";
import {
  Briefcase,
  MapPin,
  Search,
  Building2,
  Sparkles,
  Layers,
  CalendarDays,
  Users,
  Filter,
  X,
} from "lucide-react";

/* ------------------------------ Motion helper ------------------------------ */
const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.32, ease: "easeOut", delay } },
});

/* -------------------------------- UI atoms -------------------------------- */
function Card({ as: Comp = "div", className = "", ...props }) {
  return (
    <Comp
      className={
        "rounded-2xl border border-[#E5EAF0] bg-white/90 backdrop-blur shadow-[0_6px_18px_rgba(10,38,71,0.06)] " +
        "transition-shadow hover:shadow-[0_12px_30px_rgba(10,38,71,0.12)] " +
        className
      }
      {...props}
    />
  );
}

function Pill({ children, className = "" }) {
  return (
    <span
      className={
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold " +
        "border border-[#E5EAF0] " +
        className
      }
    >
      {children}
    </span>
  );
}

/* ------------------------------ Format helpers ----------------------------- */
function formatPackage(pkg) {
  if (!pkg) return "—";
  const min = pkg.min || 0;
  const max = pkg.max || 0;
  const cur = pkg.currency || "INR";
  const unit = pkg.unit || "year";
  if (!min && !max) return "—";
  if (max && max !== min) return `${cur} ${min}–${max}/${unit}`;
  return `${cur} ${min}/${unit}`;
}

/* -------------------------------- Component -------------------------------- */
export default function JobsBoard() {
  const navigate = useNavigate();
  const { selected: currentSkill } = useSkill();

  const [jobs, setJobs] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useSmartState("student.jobs.filter.v6", {
    q: "",
    skillId: "",
    location: "",
    exp: "",
    type: "",
    company: "",
  });
  const [sortBy, setSortBy] = useSmartState("student.jobs.sort.v5", "newest");

  // mobile filter drawer
  const [showFilters, setShowFilters] = useState(false);

  // Sync selected skill into filter when available
  useEffect(() => {
    if (currentSkill?._id && filter.skillId !== currentSkill._id) {
      setFilter({ ...filter, skillId: currentSkill._id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSkill?._id]);

  // Load data
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [j, s] = await Promise.all([API.get("/student/jobs"), API.get("/admin/skills")]);
        setJobs(Array.isArray(j.data) ? j.data : []);
        setSkills(Array.isArray(s.data) ? s.data : []);
      } catch (e) {
        console.error("Load jobs failed:", e?.response?.data || e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ------------------------------- Derivatives ------------------------------ */
  const companies = useMemo(() => {
    const set = new Set();
    (jobs || []).forEach((j) => {
      if (j.company?.name) set.add(j.company.name);
    });
    return Array.from(set).sort();
  }, [jobs]);

  const visible = useMemo(() => {
    const q = filter.q.trim().toLowerCase();

    let out = (jobs || []).filter((j) => {
      const cName = (j.company?.name || "").toLowerCase();

      const matchQ = q
        ? (j.title || "").toLowerCase().includes(q) ||
          (j.description || "").toLowerCase().includes(q) ||
          cName.includes(q) ||
          (j.location || "").toLowerCase().includes(q)
        : true;

      const matchSkill = filter.skillId
        ? (j.skills || []).some((s) =>
            typeof s === "string"
              ? s === filter.skillId
              : s?._id === filter.skillId || s === filter.skillId
          )
        : true;

      const matchLoc = filter.location
        ? (j.location || "").toLowerCase().includes(filter.location.toLowerCase())
        : true;

      const matchExp = filter.exp
        ? (j.experience || "").toLowerCase().includes(filter.exp.toLowerCase())
        : true;

      const matchType = filter.type ? j.type === filter.type : true;

      const matchCompany = filter.company ? (j.company?.name || "") === filter.company : true;

      return matchQ && matchSkill && matchLoc && matchExp && matchType && matchCompany;
    });

    out.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "company")
        return (a.company?.name || "").localeCompare(b.company?.name || "");
      if (sortBy === "title") return (a.title || "").localeCompare(b.title || "");
      if (sortBy === "packageHigh") {
        const ax = a.package?.max || a.package?.min || 0;
        const bx = b.package?.max || b.package?.min || 0;
        return bx - ax;
      }
      if (sortBy === "experience")
        return (a.experience || "").localeCompare(b.experience || "");
      return 0;
    });

    return out;
  }, [jobs, filter, sortBy]);

  /* ------------------------------ Subcomponents ----------------------------- */
  function FilterPanel({ compact = false, onApplied }) {
    return (
      <Card
        className={
          "p-4 " +
          (compact
            ? ""
            : "bg-gradient-to-b from-[#E9F1FA] via-white to-white border-[#E5EAF0]")
        }
      >
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-[#0A2647]">Filters & Sorting</div>
          {compact && (
            <button
              className="p-1.5 rounded-lg hover:bg-[#E9F1FA] text-[#0A2647]"
              onClick={() => setShowFilters(false)}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mt-3">
          <Search size={16} className="absolute left-3 top-2.5 text-[#14427299]" />
          <input
            className="pl-9 pr-3 py-2 w-full rounded-xl border border-[#E5EAF0] bg-white"
            placeholder="Search role, company…"
            value={filter.q}
            onChange={(e) => setFilter({ ...filter, q: e.target.value })}
          />
        </div>

        {/* Company */}
        <div className="mt-3">
          <label className="text-xs text-[#144272]">Company</label>
          <select
            className="mt-1 w-full pr-9 pl-3 py-2 rounded-xl border border-[#E5EAF0] bg-white"
            value={filter.company}
            onChange={(e) => setFilter({ ...filter, company: e.target.value })}
          >
            <option value="">All</option>
            {companies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Type & Skill */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-[#144272]">Type</label>
            <select
              className="mt-1 w-full pr-9 pl-3 py-2 rounded-xl border border-[#E5EAF0] bg-white"
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            >
              <option value="">All</option>
              <option value="job">Job</option>
              <option value="internship">Internship</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-[#144272]">Skill</label>
            <div className="mt-1">
              {currentSkill?._id ? (
                <div className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-lg bg-[#E9F1FA] text-[#205295] border border-[#E5EAF0]">
                  <Sparkles size={14} />
                  <span>{currentSkill.name}</span>
                  <button
                    className="ml-1 text-[11px] underline"
                    onClick={() => setFilter({ ...filter, skillId: currentSkill._id })}
                    title="Re-apply focus"
                  >
                    apply
                  </button>
                </div>
              ) : (
                <select
                  className="w-full pr-9 pl-3 py-2 rounded-xl border border-[#E5EAF0] bg-white"
                  value={filter.skillId}
                  onChange={(e) => setFilter({ ...filter, skillId: e.target.value })}
                >
                  <option value="">All</option>
                  {skills.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="mt-3">
          <label className="text-xs text-[#144272]">Location</label>
          <input
            className="mt-1 w-full rounded-xl border border-[#E5EAF0] bg-white px-3 py-2"
            value={filter.location}
            onChange={(e) => setFilter({ ...filter, location: e.target.value })}
            placeholder="e.g., Remote / Bengaluru"
          />
        </div>

        {/* Experience */}
        <div className="mt-3">
          <label className="text-xs text-[#144272]">Experience</label>
          <input
            className="mt-1 w-full rounded-xl border border-[#E5EAF0] bg-white px-3 py-2"
            value={filter.exp}
            onChange={(e) => setFilter({ ...filter, exp: e.target.value })}
            placeholder="e.g., 0-2 years / Fresher"
          />
        </div>

        {/* Sort */}
        <div className="mt-3">
          <label className="text-xs text-[#144272]">Sort by</label>
          <select
            className="mt-1 w-full pr-9 pl-3 py-2 rounded-xl border border-[#E5EAF0] bg-white"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="company">Company</option>
            <option value="title">Role Title</option>
            <option value="packageHigh">Package (High → Low)</option>
            <option value="experience">Experience (A → Z)</option>
          </select>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <button
            className="flex-1 px-3 py-2 rounded-xl border border-[#E5EAF0] bg-white hover:bg-[#E9F1FA] text-sm"
            onClick={() =>
              setFilter({
                q: "",
                skillId: currentSkill?._id || "",
                location: "",
                exp: "",
                type: "",
                company: "",
              })
            }
          >
            Reset
          </button>
          {compact && (
            <button
              className="flex-1 px-3 py-2 rounded-xl bg-[#205295] text-white text-sm hover:opacity-90"
              onClick={() => {
                setShowFilters(false);
                if (onApplied) onApplied();
              }}
            >
              Apply
            </button>
          )}
        </div>
      </Card>
    );
  }

  function JobRow({ j, idx }) {
    const logo = j.company?.logoUrl;
    const name = j.company?.name || "—";
    const pkgTxt = formatPackage(j.package);
    const startTxt = j.startDate ? new Date(j.startDate).toLocaleDateString() : "—";

    const badge =
      j.type === "internship"
        ? "bg-emerald-50 text-emerald-700"
        : "bg-[#E9F1FA] text-[#205295]";

    return (
      <motion.div key={j._id} {...fade(0.02 + idx * 0.01)}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate(`/student/jobs/${j._id}`, { state: { job: j } })}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              navigate(`/student/jobs/${j._id}`, { state: { job: j } });
            }
          }}
          className="group rounded-2xl border border-[#E5EAF0] bg-white/95 p-5 hover:border-[#20529533] hover:shadow-[0_12px_30px_rgba(32,82,149,0.14)] transition cursor-pointer"
          title="View details"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {logo ? (
                <img
                  src={logo}
                  alt={`${name} logo`}
                  className="h-12 w-12 rounded-xl object-cover border border-[#E5EAF0]"
                />
              ) : (
                <div className="h-12 w-12 rounded-xl bg-[#E9F1FA] text-[#205295] grid place-items-center border border-[#E5EAF0]">
                  <Building2 size={18} />
                </div>
              )}
              <div>
                <div className="font-semibold leading-tight text-[#0A2647] group-hover:underline">
                  {j.title}
                </div>
                <p className="text-xs text-[#144272B3]">{name}</p>
              </div>
            </div>
            <Pill className={badge}>
              {j.type === "internship" ? "Internship" : "Job"}
            </Pill>
          </div>

          <div className="mt-3 grid lg:grid-cols-5 sm:grid-cols-2 gap-3 text-sm text-[#0A2647]">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-[#14427299]" /> {j.location || "Remote"}
            </div>
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-[#14427299]" /> {j.experience || "—"}
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays size={14} className="text-[#14427299]" /> Start: {startTxt}
            </div>
            <div className="flex items-center gap-2">
              <Users size={14} className="text-[#14427299]" /> Openings: {j.openings ?? 1}
            </div>
            <div className="flex items-center gap-2">
              <Briefcase size={14} className="text-[#14427299]" /> {pkgTxt}
            </div>
          </div>

          {Array.isArray(j.skills) && j.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {j.skills.slice(0, 8).map((s, i) => (
                <Pill
                  key={`${j._id}-${i}`}
                  className="bg-white text-[#144272] border-[#E5EAF0] shadow-[0_2px_8px_rgba(10,38,71,0.04)]"
                >
                  {typeof s === "string" ? s : s.name}
                </Pill>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  /* --------------------------------- Render -------------------------------- */
  return (
    <div className="w-full">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <motion.div {...fade(0)}>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#0A2647]">
                Opportunities
              </h1>
              <p className="text-sm text-[#144272] mt-1">
                Explore roles matched to your skills. Click a card to see details and apply.
              </p>
              {currentSkill?.name && (
                <div className="mt-2 inline-flex items-center gap-2 text-xs px-2 py-1 rounded-lg bg-[#E9F1FA] text-[#205295] border border-[#E5EAF0]">
                  <Sparkles size={14} />
                  <span>Focused Skill:</span>
                  <b>{currentSkill.name}</b>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[#E5EAF0] bg-gradient-to-tr from-[#E9F1FA] via-white to-white px-4 py-3">
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="text-[#205295]" size={16} />
                <span className="font-medium text-[#0A2647]">Tip:</span>
                <span className="text-[#144272]">
                  Use filters to quickly find internships or fresher roles.
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mobile filter bar */}
        <div className="md:hidden -mt-2">
          <button
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E5EAF0] bg-white shadow-sm text-[#0A2647]"
            onClick={() => setShowFilters(true)}
          >
            <Filter size={16} />
            Filters
          </button>
        </div>

        {/* Layout: list + right sidebar */}
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_320px]">
          {/* Main list */}
          <section>
            {/* Mobile search (always visible) */}
            <motion.div {...fade(0.03)} className="md:hidden mb-3">
              <Card className="p-3 bg-gradient-to-r from-[#E9F1FA] to-white">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-2.5 text-[#14427299]" />
                  <input
                    className="pl-9 pr-3 py-2 w-full rounded-xl border border-[#E5EAF0] bg-white"
                    placeholder="Search role, company…"
                    value={filter.q}
                    onChange={(e) => setFilter({ ...filter, q: e.target.value })}
                  />
                </div>
              </Card>
            </motion.div>

            {/* Results */}
            {loading ? (
              <Card className="p-6">
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-24 rounded-xl bg-[#E9F1FA]" />
                    </div>
                  ))}
                </div>
              </Card>
            ) : visible.length === 0 ? (
              <Card className="p-10 text-center">
                <div className="mx-auto h-10 w-10 rounded-xl bg-[#E9F1FA] text-[#205295] grid place-items-center">
                  <Sparkles size={18} />
                </div>
                <h2 className="mt-3 font-semibold text-[#0A2647]">No matching roles</h2>
                <p className="text-sm text-[#144272] mt-1">Try adjusting filters or search.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {visible.map((j, idx) => (
                  <JobRow key={j._id} j={j} idx={idx} />
                ))}
              </div>
            )}
          </section>

          {/* Sidebar filters (desktop) */}
          <aside className="hidden md:block space-y-4">
            <motion.div {...fade(0.05)}>
              <FilterPanel />
            </motion.div>
          </aside>
        </div>
      </div>

      {/* Mobile filters drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowFilters(false)}
          />
          <div className="absolute right-0 top-0 h-full w-[88%] max-w-sm bg-white shadow-2xl p-4">
            <FilterPanel compact onApplied={() => {}} />
          </div>
        </div>
      )}
    </div>
  );
}
