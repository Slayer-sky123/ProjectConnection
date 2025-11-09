import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pencil,
  Trash2,
  Search,
  Building2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

/* ----------------------------- UI atoms ----------------------------- */
const SectionLabel = React.memo(({ children }) => (
  <p className="text-xs text-slate-600 mb-1">{children}</p>
));

const Pill = React.memo(({ className = "", children }) => (
  <span
    className={
      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium border " +
      className
    }
  >
    {children}
  </span>
));

/* ------------------------------- helpers ------------------------------ */
const currencies = ["INR", "USD", "EUR"];
const units = ["year", "month"];

const fmtPkg = (pkg = {}) => {
  const min = pkg.min ?? "";
  const max = pkg.max ?? "";
  const cur = pkg.currency || "INR";
  const unit = pkg.unit || "year";
  if (!min && !max) return "—";
  if (max && max !== min) return `${cur} ${min} – ${max}/${unit}`;
  return `${cur} ${min || max}/${unit}`;
};

const splitLines = (str = "") =>
  String(str)
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

/* -------------------------- Skill multi-select ------------------------- */
const SkillPicker = React.memo(function SkillPicker({
  skills,
  value = [],
  onChange,
  placeholder = "Search skills…",
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return skills;
    return skills.filter((s) => s.name?.toLowerCase().includes(qq));
  }, [q, skills]);

  const toggle = useCallback(
    (id) => {
      const set = new Set(value);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      onChange(Array.from(set));
    },
    [value, onChange]
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
        <input
          className="w-full pl-8 pr-3 py-2 text-sm rounded-t-2xl border-b bg-transparent focus:outline-none focus:ring-0"
          placeholder={placeholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="max-h-40 overflow-auto p-2 flex flex-wrap gap-2">
        {filtered.length === 0 ? (
          <div className="text-xs text-slate-500 px-2 py-1.5">No matches</div>
        ) : (
          filtered.map((sk) => {
            const checked = value.includes(sk._id);
            return (
              <button
                key={sk._id}
                type="button"
                onClick={() => toggle(sk._id)}
                className={[
                  "px-3 py-1.5 rounded-full border text-sm transition cursor-pointer",
                  checked
                    ? "bg-[#1A55E3] text-white border-[#1A55E3]"
                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200",
                ].join(" ")}
                title={checked ? "Remove" : "Add"}
              >
                {sk.name}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
});

/* ------------------------------ Stepper UI ----------------------------- */
const Stepper = React.memo(function Stepper({ step }) {
  const items = useMemo(
    () => [
      { id: 1, label: "Basics" },
      { id: 2, label: "Comp & Skills" },
      { id: 3, label: "Review & Post" },
    ],
    []
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2">
        {items.map((s, i) => {
          const active = step === s.id;
          const done = step > s.id;
          return (
            <div key={s.id} className="flex-1">
              <div className="flex items-center gap-2">
                <div
                  className={[
                    "h-8 w-8 rounded-full grid place-items-center border text-sm",
                    active
                      ? "bg-[#1A55E3] text-white border-[#1A55E3]"
                      : done
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-white text-slate-600 border-slate-200",
                  ].join(" ")}
                >
                  {done ? <CheckCircle2 size={16} /> : s.id}
                </div>
                <div
                  className={[
                    "text-sm font-medium",
                    active ? "text-slate-900" : "text-slate-600",
                  ].join(" ")}
                >
                  {s.label}
                </div>
              </div>
              {i < items.length - 1 && (
                <div className="h-1 w-full mt-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={[
                      "h-full transition-all",
                      step > s.id ? "w-full bg-[#1A55E3]" : "w-0",
                    ].join(" ")}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

/* ------------------------------ Panels ------------------------------ */
const BasicsStep = React.memo(function BasicsStep({
  values,
  errors,
  onChange,
  onNext,
  onReset,
}) {
  const { title, type, location, experience, startDate, openings } = values;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 grid md:grid-cols-2 gap-4">
      <div className="relative">
        <input
          placeholder="Job title (e.g., Frontend Engineer)"
          className={`border rounded-xl px-3 py-2 bg-white/70 w-full focus:outline-none focus:ring-2 focus:ring-[#1A55E3]/20 ${
            errors.title ? "border-rose-300" : "border-slate-200"
          }`}
          value={title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
        {errors.title && (
          <div className="text-[11px] text-rose-600 mt-1">{errors.title}</div>
        )}
      </div>

      <select
        value={type}
        onChange={(e) => onChange({ type: e.target.value })}
        className="border rounded-xl px-3 py-2 bg-white/70 border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A55E3]/20"
        title="Type"
      >
        <option value="job">Job (Full-time)</option>
        <option value="internship">Internship</option>
        <option value="part-time">Part-time</option>
        <option value="contract">Contract</option>
      </select>

      <div className="relative">
        <input
          placeholder="Location (Remote / City)"
          className={`border rounded-xl px-3 py-2 bg-white/70 w-full focus:outline-none focus:ring-2 focus:ring-[#1A55E3]/20 ${
            errors.location ? "border-amber-300" : "border-slate-200"
          }`}
          value={location}
          onChange={(e) => onChange({ location: e.target.value })}
        />
        {errors.location && (
          <div className="text-[11px] text-amber-700 mt-1">{errors.location}</div>
        )}
      </div>

      <input
        placeholder="Experience (e.g., 0-2 years)"
        className="border rounded-xl px-3 py-2 bg-white/70 border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A55E3]/20"
        value={experience}
        onChange={(e) => onChange({ experience: e.target.value })}
      />

      <input
        type="date"
        className="border rounded-xl px-3 py-2 bg-white/70 border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A55E3]/20"
        value={startDate}
        onChange={(e) => onChange({ startDate: e.target.value })}
      />

      {/* openings as text + inputMode numeric */}
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="Openings"
        className={`border rounded-xl px-3 py-2 bg-white/70 border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A55E3]/20 ${
          errors.openings ? "border-rose-300" : "border-slate-200"
        }`}
        value={openings}
        onChange={(e) =>
          onChange({ openings: e.target.value.replace(/[^\d]/g, "") })
        }
      />
      {errors.openings && (
        <div className="text-[11px] text-rose-600 -mt-3">{errors.openings}</div>
      )}

      <div className="md:col-span-2 flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center rounded-xl px-4 py-2 text-white"
          style={{ backgroundColor: "#1A55E3" }}
        >
          Continue
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center rounded-xl px-3 py-2 border bg-white hover:bg-slate-50"
        >
          Reset
        </button>
      </div>
    </div>
  );
});

const CompAndSkillsStep = React.memo(function CompAndSkillsStep({
  values,
  errors,
  onChange,
  onPrev,
  onNext,
  skills,
}) {
  const { pkg, minScore, desc, resp, reqSkillSel, prefSkillSel, isFeatured } =
    values;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 space-y-5">
      <div className="grid md:grid-cols-4 gap-3">
        <div>
          <SectionLabel>Package Min</SectionLabel>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pkg.min}
            onChange={(e) =>
              onChange({ pkg: { ...pkg, min: e.target.value.replace(/[^\d]/g, "") } })
            }
            className="border rounded-xl px-3 py-2 bg-white/70 w-full border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A55E3]/20"
            placeholder="e.g., 150000"
          />
        </div>
        <div>
          <SectionLabel>Package Max</SectionLabel>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pkg.max}
            onChange={(e) =>
              onChange({ pkg: { ...pkg, max: e.target.value.replace(/[^\d]/g, "") } })
            }
            className="border rounded-xl px-3 py-2 bg-white/70 w-full border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A55E3]/20"
            placeholder="e.g., 250000"
          />
        </div>
        <div>
          <SectionLabel>Currency</SectionLabel>
          <select
            value={pkg.currency}
            onChange={(e) => onChange({ pkg: { ...pkg, currency: e.target.value } })}
            className="border rounded-xl px-3 py-2 bg-white/70 w-full border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A55E3]/20"
          >
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <SectionLabel>Unit</SectionLabel>
          <select
            value={pkg.unit}
            onChange={(e) => onChange({ pkg: { ...pkg, unit: e.target.value } })}
            className="border rounded-xl px-3 py-2 bg-white/70 w-full border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A55E3]/20"
          >
            {units.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>

      {errors.package && (
        <div className="text-[11px] text-rose-600">{errors.package}</div>
      )}

      <div>
        <SectionLabel>Min skill test score (0–10)</SectionLabel>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="10"
            step="0.1"
            value={minScore}
            onInput={(e) => onChange({ minScore: Number(e.target.value) })}
            onChange={(e) => onChange({ minScore: Number(e.target.value) })}
            className="w-full accent-[#1A55E3]"
          />
          <Pill className="bg-[#5E6EED]/10 text-[#1A55E3] border-[#5E6EED]/30">
            {Number(minScore).toFixed(1)}/10
          </Pill>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <SectionLabel>Role Description</SectionLabel>
        </div>
        <textarea
          value={desc}
          onChange={(e) => onChange({ desc: e.target.value })}
          placeholder="Describe the role, team, and impact"
          className="border rounded-2xl px-3 py-2 bg-white/70 w-full h-28 border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A55E3]/20"
        />
      </div>

      <div>
        <SectionLabel>Responsibilities (one per line)</SectionLabel>
        <textarea
          value={resp}
          onChange={(e) => onChange({ resp: e.target.value })}
          className="border rounded-2xl px-3 py-2 bg-white/70 w-full h-24 border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A55E3]/20"
          placeholder={`e.g.\nBuild frontend features\nCollaborate with backend\nWrite tests`}
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <SectionLabel>Required skills</SectionLabel>
          {errors.skills && (
            <div className="text-[11px] text-rose-600">{errors.skills}</div>
          )}
        </div>
        <SkillPicker
          skills={skills}
          value={reqSkillSel}
          onChange={(v) => onChange({ reqSkillSel: v })}
          placeholder="Search required skills…"
        />
      </div>

      <div>
        <SectionLabel>Preferred skills (optional)</SectionLabel>
        <SkillPicker
          skills={skills}
          value={prefSkillSel}
          onChange={(v) => onChange({ prefSkillSel: v })}
          placeholder="Search preferred skills…"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="cursor-pointer"
          checked={isFeatured}
          onChange={(e) => onChange({ isFeatured: e.target.checked })}
        />{" "}
        Featured listing
      </label>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex items-center rounded-xl px-4 py-2 border bg-white hover:bg-slate-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center rounded-xl px-4 py-2 text-white"
          style={{ backgroundColor: "#1A55E3" }}
        >
          Continue
        </button>
        <div className="ml-auto text-xs text-slate-500">
          Preview:&nbsp;
          <span className="font-medium text-slate-700">
            {fmtPkg({
              min: pkg.min,
              max: pkg.max,
              currency: pkg.currency,
              unit: pkg.unit,
            })}
          </span>
        </div>
      </div>
    </div>
  );
});

const ReviewStep = React.memo(function ReviewStep({
  values,
  onPrev,
  onSubmit,
  skills,
}) {
  const { title, type, location, experience, startDate, openings, pkg, minScore, isFeatured, desc, resp, reqSkillSel, prefSkillSel } =
    values;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 space-y-4">
      <div className="text-sm text-slate-600">Review your posting before publishing.</div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white/70 p-4">
          <h4 className="font-semibold text-slate-900 mb-2">Basics</h4>
          <ul className="text-sm text-slate-700 space-y-1">
            <li>
              <span className="text-slate-500">Title:</span> <b>{title || "—"}</b>
            </li>
            <li>
              <span className="text-slate-500">Type:</span> <b>{type}</b>
            </li>
            <li>
              <span className="text-slate-500">Location:</span> <b>{location || "—"}</b>
            </li>
            <li>
              <span className="text-slate-500">Experience:</span> <b>{experience || "—"}</b>
            </li>
            <li>
              <span className="text-slate-500">Start:</span> <b>{startDate || "—"}</b>
            </li>
            <li>
              <span className="text-slate-500">Openings:</span> <b>{openings || "1"}</b>
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white/70 p-4">
          <h4 className="font-semibold text-slate-900 mb-2">Compensation</h4>
          <ul className="text-sm text-slate-700 space-y-1">
            <li>
              <span className="text-slate-500">Package:</span>{" "}
              <b>
                {fmtPkg({
                  min: pkg.min,
                  max: pkg.max,
                  currency: pkg.currency,
                  unit: pkg.unit,
                })}
              </b>
            </li>
            <li>
              <span className="text-slate-500">Min score:</span>{" "}
              <b>{Number(minScore).toFixed(1)}/10</b>
            </li>
            <li>
              <span className="text-slate-500">Featured:</span>{" "}
              <b>{isFeatured ? "Yes" : "No"}</b>
            </li>
          </ul>
        </div>

        <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white/70 p-4">
          <h4 className="font-semibold text-slate-900 mb-2">Description</h4>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{desc || "—"}</p>
        </div>

        <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white/70 p-4">
          <h4 className="font-semibold text-slate-900 mb-2">Responsibilities</h4>
          <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
            {splitLines(resp).length
              ? splitLines(resp).map((r, i) => <li key={i}>{r}</li>)
              : "—"}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white/70 p-4">
          <h4 className="font-semibold text-slate-900 mb-2">Required Skills</h4>
          <div className="flex flex-wrap gap-2">
            {reqSkillSel.length
              ? reqSkillSel.map((id) => {
                  const sk = skills.find((s) => s._id === id);
                  return (
                    <span
                      key={id}
                      className="text-xs px-2.5 py-1 rounded-full border bg-slate-50 text-slate-700 border-slate-200"
                    >
                      {sk?.name || id}
                    </span>
                  );
                })
              : "—"}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white/70 p-4">
          <h4 className="font-semibold text-slate-900 mb-2">Preferred Skills</h4>
          <div className="flex flex-wrap gap-2">
            {prefSkillSel.length
              ? prefSkillSel.map((id) => {
                  const sk = skills.find((s) => s._id === id);
                  return (
                    <span
                      key={id}
                      className="text-xs px-2.5 py-1 rounded-full border bg-slate-50 text-slate-700 border-slate-200"
                    >
                      {sk?.name || id}
                    </span>
                  );
                })
              : "—"}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex items-center rounded-xl px-4 py-2 border bg-white hover:bg-slate-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="inline-flex items-center rounded-xl px-4 py-2 text-white"
          style={{ backgroundColor: "#1A55E3" }}
        >
          Post Job
        </button>
      </div>
    </div>
  );
});

/* --------------------------------- main --------------------------------- */
export default function JobsTab({
  skills = [],
  jobs = [],
  createJob,
  updateJob,
  deleteJob,
  toggleJob,
}) {
  /* ------------------------------ Tabs ------------------------------ */
  const [tab, setTab] = useState("post"); // 'post' | 'apps'

  /* --------------------------- Create form state --------------------------- */
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    // step 1
    title: "",
    type: "job",
    location: "",
    experience: "",
    startDate: "",
    openings: "1",
    // step 2
    pkg: { min: "", max: "", currency: "INR", unit: "year" },
    minScore: 0,
    desc: "",
    resp: "",
    reqSkillSel: [],
    prefSkillSel: [],
    isFeatured: false,
  });

  const updateForm = useCallback((patch) => {
    // functional update to avoid stale closures
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const validate = useCallback(
    (forStep) => {
      const e = {};
      if (!forStep || forStep === 1) {
        if (!form.title.trim()) e.title = "Title is required";
        if (!form.location.trim()) e.location = "Location recommended";
        const o = Number(form.openings);
        if (isNaN(o) || o < 1) e.openings = "Openings must be ≥ 1";
      }
      if (!forStep || forStep === 2) {
        if (!form.reqSkillSel.length) e.skills = "Select at least one required skill";
        const min = Number(form.pkg.min || 0);
        const max = Number(form.pkg.max || 0);
        if (form.pkg.min && form.pkg.max && min > max) {
          e.package = "Min package cannot exceed Max";
        }
      }
      setErrors(e);
      return Object.keys(e).length === 0;
    },
    [form]
  );

  const resetCreate = useCallback(() => {
    setForm({
      title: "",
      type: "job",
      location: "",
      experience: "",
      startDate: "",
      openings: "1",
      pkg: { min: "", max: "", currency: "INR", unit: "year" },
      minScore: 0,
      desc: "",
      resp: "",
      reqSkillSel: [],
      prefSkillSel: [],
      isFeatured: false,
    });
    setErrors({});
    setStep(1);
  }, []);

  const onNext = useCallback(() => {
    const ok = validate(step);
    if (ok) setStep((s) => Math.min(3, s + 1));
  }, [step, validate]);

  const onPrev = useCallback(() => setStep((s) => Math.max(1, s - 1)), []);

  const onSubmitCreate = useCallback(async () => {
    // full validation
    const ok = validate(); // all steps
    if (!ok) {
      setStep(1);
      return;
    }
    const payload = {
      title: form.title.trim(),
      type: form.type,
      location: form.location.trim(),
      experience: form.experience.trim(),
      startDate: form.startDate.trim(),
      openings: Number(form.openings || 1),
      packageMin: Number(form.pkg.min || 0),
      packageMax: Number(form.pkg.max || 0),
      packageCurrency: form.pkg.currency,
      packageUnit: form.pkg.unit,
      minScore: Number(form.minScore || 0),
      description: form.desc.trim(),
      responsibilities: form.resp,
      skills: form.reqSkillSel,
      preferredSkills: form.prefSkillSel,
      isFeatured: !!form.isFeatured,
    };
    await createJob(payload);
    resetCreate();
    setTab("apps");
  }, [form, createJob, resetCreate, validate]);

  /* ------------------------------ Edit modal ------------------------------ */
  const [editing, setEditing] = useState(null);

  const openEdit = useCallback((j) => {
    const reqIds = (j.skills || []).map((s) => (typeof s === "string" ? s : s._id));
    const prefIds = (j.preferredSkills || []).map((s) =>
      typeof s === "string" ? s : s._id
    );
    setEditing({
      _id: j._id,
      title: j.title || "",
      type: j.type || "job",
      location: j.location || "",
      experience: j.experience || "",
      startDate: j.startDate ? new Date(j.startDate).toISOString().slice(0, 10) : "",
      openings: String(j.openings ?? 1),
      packageMin: String(j.package?.min ?? 0),
      packageMax: String(j.package?.max ?? 0),
      packageCurrency: j.package?.currency || "INR",
      packageUnit: j.package?.unit || "year",
      minScore: Number(j.minScore ?? 0),
      description: j.description || "",
      responsibilities: (j.responsibilities || []).join("\n"),
      isFeatured: !!j.isFeatured,
      status: j.status || "open",
      skills: reqIds,
      preferredSkills: prefIds,
    });
  }, []);

  const toggleSkill = useCallback((key, id) => {
    setEditing((prev) => {
      if (!prev) return prev;
      const set = new Set(prev[key] || []);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { ...prev, [key]: Array.from(set) };
    });
  }, []);

  const saveEdit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!editing?._id) return;
      const payload = {
        ...editing,
        openings: Number(editing.openings || 1),
        packageMin: Number(editing.packageMin || 0),
        packageMax: Number(editing.packageMax || 0),
        minScore: Number(editing.minScore || 0),
      };
      await updateJob(editing._id, payload);
      setEditing(null);
    },
    [editing, updateJob]
  );

  /* ------------------------------- paging ------------------------------- */
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(jobs.length / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [jobs.length, totalPages, page]);
  const pagedJobs = useMemo(
    () => jobs.slice((page - 1) * pageSize, page * pageSize),
    [jobs, page]
  );

  /* ------------------------------ Subviews ------------------------------ */
  const TabsBar = React.memo(() => (
    <div className="sticky top-0 z-10 -mx-2 md:mx-0">
      <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur p-1 flex items-center gap-1">
        {[
          { key: "post", label: "Post Job" },
          { key: "apps", label: "Applications" },
        ].map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={[
                "flex-1 px-4 py-2 rounded-xl text-sm font-medium transition",
                active
                  ? "bg-[#1A55E3] text-white shadow"
                  : "text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  ));

  const ApplicationsPanel = React.memo(() => (
    <>
      {/* Header */}
      <div className="mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
              Applications & Listings
            </h1>
            <p className="text-xs text-slate-500">
              Manage postings, toggle status, and edit details.
            </p>
          </div>
          <div className="text-xs text-slate-600">
            <span className="hidden sm:inline">You have </span>
            <b>{jobs.length}</b> postings
          </div>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 bg-white/80">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/80">
            <tr>
              <th className="p-3 text-left">Title</th>
              <th className="p-3">Type</th>
              <th className="p-3">Location</th>
              <th className="p-3">Experience</th>
              <th className="p-3">Start</th>
              <th className="p-3">Openings</th>
              <th className="p-3">Package</th>
              <th className="p-3">MinScore</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedJobs.map((j) => {
              const startTxt = j.startDate
                ? new Date(j.startDate).toLocaleDateString()
                : "—";
              const minPct = Math.min(
                100,
                Math.max(0, (Number(j.minScore || 0) / 10) * 100)
              );
              return (
                <tr key={j._id} className="border-t">
                  <td className="p-3">
                    <div className="flex items-start gap-2">
                      {j.company?.logoUrl ? (
                        <img
                          src={j.company.logoUrl}
                          alt="logo"
                          className="h-8 w-8 rounded-lg object-cover border"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-500 grid place-items-center border">
                          <Building2 size={14} />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{j.title}</div>
                        <div className="text-[11px] text-gray-500 line-clamp-1">
                          {j.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <Pill
                      className={
                        j.type === "internship"
                          ? "bg-[#00D284]/10 text-[#00D284] border-[#00D284]/30"
                          : "bg-[#1A55E3]/10 text-[#1A55E3] border-[#1A55E3]/30"
                      }
                    >
                      {j.type}
                    </Pill>
                  </td>
                  <td className="p-3 text-center">{j.location || "—"}</td>
                  <td className="p-3 text-center">{j.experience || "—"}</td>
                  <td className="p-3 text-center">{startTxt}</td>
                  <td className="p-3 text-center">{j.openings ?? 1}</td>
                  <td className="p-3 text-center">
                    {fmtPkg(j.package || { min: "", max: "", currency: "INR", unit: "year" })}
                  </td>
                  <td className="p-3">
                    <div className="min-w-[120px] mx-auto">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600">Min</span>
                        <b className="text-gray-800">{j.minScore ?? 0}/10</b>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${minPct}%`,
                            background: "linear-gradient(90deg,#1A55E3,#5E6EED)",
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full border text-xs ${
                        j.status === "open"
                          ? "bg-[#0DCAF0]/10 text-[#0DCAF0] border-[#0DCAF0]/30"
                          : j.status === "paused"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-[#FF0854]/10 text-[#FF0854] border-[#FF0854]/30"
                      }`}
                    >
                      {j.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3 justify-center">
                      <button
                        onClick={() => openEdit(j)}
                        className="text-[#5E6EED] hover:underline flex items-center gap-1 cursor-pointer"
                        title="Edit job"
                      >
                        <Pencil size={16} /> Edit
                      </button>
                      <button
                        onClick={() => toggleJob(j._id)}
                        className="text-[#1A55E3] hover:underline cursor-pointer"
                        title={j.status === "open" ? "Close" : "Open"}
                      >
                        {j.status === "open" ? "Close" : "Open"}
                      </button>
                      <button
                        onClick={() => deleteJob(j._id)}
                        className="text-[#FF0854] hover:underline flex items-center gap-1 cursor-pointer"
                        title="Delete job"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {totalPages > 1 && (
            <tfoot>
              <tr>
                <td colSpan={10} className="p-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-2 py-1 rounded-lg border bg-white hover:bg-slate-50 text-sm inline-flex items-center gap-1 cursor-pointer"
                      disabled={page === 1}
                      title="Previous page"
                    >
                      <ChevronLeft size={14} /> Prev
                    </button>
                    <div className="text-xs text-slate-600">
                      Page <b>{page}</b> / {totalPages}
                    </div>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="px-2 py-1 rounded-lg border bg-white hover:bg-slate-50 text-sm inline-flex items-center gap-1 cursor-pointer"
                      disabled={page === totalPages}
                      title="Next page"
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3 mt-4">
        {pagedJobs.map((j) => {
          const startTxt = j.startDate
            ? new Date(j.startDate).toLocaleDateString()
            : "—";
          const minPct = Math.min(
            100,
            Math.max(0, (Number(j.minScore || 0) / 10) * 100)
          );
          return (
            <div
              key={j._id}
              className="rounded-2xl border border-slate-200 bg-white/80 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{j.title}</h4>
                  <div className="text-xs text-gray-500">{j.location || "—"}</div>
                  <div className="text-xs text-gray-500">
                    Exp: {j.experience || "—"} • Start: {startTxt} • Openings:{" "}
                    {j.openings ?? 1}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Pill
                    className={
                      j.type === "internship"
                        ? "bg-[#00D284]/10 text-[#00D284] border-[#00D284]/30"
                        : "bg-[#1A55E3]/10 text-[#1A55E3] border-[#1A55E3]/30"
                    }
                  >
                    {j.type}
                  </Pill>
                  <Pill
                    className={
                      j.status === "open"
                        ? "bg-[#0DCAF0]/10 text-[#0DCAF0] border-[#0DCAF0]/30"
                        : j.status === "paused"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-[#FF0854]/10 text-[#FF0854] border-[#FF0854]/30"
                    }
                  >
                    {j.status}
                  </Pill>
                </div>
              </div>

              <p className="mt-3 text-sm text-gray-700 line-clamp-3">
                {j.description}
              </p>

              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">Min Test Score</span>
                  <b className="text-gray-800">{j.minScore ?? 0}/10</b>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${minPct}%`,
                      background: "linear-gradient(90deg,#1A55E3,#5E6EED)",
                    }}
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {(j.skills || []).map((s, i) => (
                  <span
                    key={`${j._id}-${i}`}
                    className="text-xs px-2.5 py-1 rounded-full border bg-slate-50 text-slate-700 border-slate-200"
                  >
                    {typeof s === "string" ? s : s.name}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => openEdit(j)}
                  className="px-3 py-1.5 rounded-xl border bg-white hover:bg-slate-50 text-sm text-[#5E6EED] cursor-pointer"
                  title="Edit"
                >
                  <span className="inline-flex items-center gap-1">
                    <Pencil size={14} /> Edit
                  </span>
                </button>
                <button
                  onClick={() => toggleJob(j._id)}
                  className="px-3 py-1.5 rounded-xl border bg-white hover:bg-slate-50 text-sm text-[#1A55E3] cursor-pointer"
                  title={j.status === "open" ? "Close" : "Open"}
                >
                  {j.status === "open" ? "Close" : "Open"}
                </button>
                <button
                  onClick={() => deleteJob(j._id)}
                  className="px-3 py-1.5 rounded-xl text-white text-sm cursor-pointer"
                  style={{ backgroundColor: "#FF0854" }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = "#e1064b")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "#FF0854")
                  }
                  title="Delete"
                >
                  <span className="inline-flex items-center gap-1">
                    <Trash2 size={14} /> Delete
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  ));

  /* -------------------------------- Render -------------------------------- */
  return (
    <>
      {/* Page header */}
      <div className="mb-4">
        <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
          Hiring Center
        </h1>
        <p className="text-xs text-slate-500">
          Post premium roles and manage all applications in one place.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-5">
        <TabsBar />
      </div>

      {/* Panels */}
      <div className="space-y-6">
        {tab === "post" ? (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
              <Stepper step={step} />
            </div>

            {step === 1 && (
              <BasicsStep
                values={form}
                errors={errors}
                onChange={(patch) =>
                  setForm((prev) => ({ ...prev, ...patch }))
                }
                onNext={onNext}
                onReset={resetCreate}
              />
            )}

            {step === 2 && (
              <CompAndSkillsStep
                values={form}
                errors={errors}
                skills={skills}
                onChange={(patch) => {
                  // nested safety merge
                  setForm((prev) => {
                    const next = { ...prev };
                    for (const [k, v] of Object.entries(patch)) {
                      if (k === "pkg") next.pkg = v;
                      else next[k] = v;
                    }
                    return next;
                  });
                }}
                onPrev={onPrev}
                onNext={onNext}
              />
            )}

            {step === 3 && (
              <ReviewStep
                values={form}
                skills={skills}
                onPrev={onPrev}
                onSubmit={onSubmitCreate}
              />
            )}
          </>
        ) : (
          <ApplicationsPanel />
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur w-full max-w-3xl rounded-2xl shadow-xl p-6 border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Job</h3>
              <button
                onClick={() => setEditing(null)}
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
                title="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={saveEdit} className="grid md:grid-cols-2 gap-4">
              <input
                value={editing.title}
                onChange={(e) =>
                  setEditing((j) => ({ ...j, title: e.target.value }))
                }
                required
                placeholder="Job title"
                className="border rounded-xl px-3 py-2 bg-white/70 border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A55E3]/20"
              />

              <select
                value={editing.type}
                onChange={(e) =>
                  setEditing((j) => ({ ...j, type: e.target.value }))
                }
                className="border rounded-xl px-3 py-2 bg-white/70 border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A55E3]/20"
                title="Type"
              >
                <option value="job">Job (Full-time)</option>
                <option value="internship">Internship</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
              </select>

              <input
                value={editing.location}
                onChange={(e) =>
                  setEditing((j) => ({ ...j, location: e.target.value }))
                }
                placeholder="Location"
                className="border rounded-xl px-3 py-2 bg-white/70 border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A55E3]/20"
              />

              <input
                value={editing.experience}
                onChange={(e) =>
                  setEditing((j) => ({ ...j, experience: e.target.value }))
                }
                placeholder="Experience (e.g., 0-2 years)"
                className="border rounded-xl px-3 py-2 bg-white/70 border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A55E3]/20"
              />

              <input
                type="date"
                value={editing.startDate || ""}
                onChange={(e) =>
                  setEditing((j) => ({ ...j, startDate: e.target.value }))
                }
                className="border rounded-xl px-3 py-2 bg-white/70 border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A55E3]/20"
              />

              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={editing.openings}
                onChange={(e) =>
                  setEditing((j) => ({
                    ...j,
                    openings: e.target.value.replace(/[^\d]/g, "") || "1",
                  }))
                }
                placeholder="Openings"
                className="border rounded-xl px-3 py-2 bg-white/70 border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A55E3]/20"
              />

              <div className="md:col-span-2 grid md:grid-cols-4 gap-3">
                <div>
                  <SectionLabel>Package Min</SectionLabel>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={editing.packageMin}
                    onChange={(e) =>
                      setEditing((j) => ({
                        ...j,
                        packageMin: e.target.value.replace(/[^\d]/g, "") || "0",
                      }))
                    }
                    className="border rounded-xl px-3 py-2 bg-white/70 w-full border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A55E3]/20"
                  />
                </div>
                <div>
                  <SectionLabel>Package Max</SectionLabel>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={editing.packageMax}
                    onChange={(e) =>
                      setEditing((j) => ({
                        ...j,
                        packageMax: e.target.value.replace(/[^\d]/g, "") || "0",
                      }))
                    }
                    className="border rounded-xl px-3 py-2 bg-white/70 w-full border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A55E3]/20"
                  />
                </div>
                <div>
                  <SectionLabel>Currency</SectionLabel>
                  <select
                    value={editing.packageCurrency}
                    onChange={(e) =>
                      setEditing((j) => ({
                        ...j,
                        packageCurrency: e.target.value,
                      }))
                    }
                    className="border rounded-xl px-3 py-2 bg-white/70 w-full border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A55E3]/20"
                  >
                    {currencies.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <SectionLabel>Unit</SectionLabel>
                  <select
                    value={editing.packageUnit}
                    onChange={(e) =>
                      setEditing((j) => ({ ...j, packageUnit: e.target.value }))
                    }
                    className="border rounded-xl px-3 py-2 bg-white/70 w-full border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A55E3]/20"
                  >
                    {units.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="md:col-span-2">
                <SectionLabel>Min skill test score (0–10)</SectionLabel>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={editing.minScore}
                    onInput={(e) =>
                      setEditing((j) => ({ ...j, minScore: Number(e.target.value) }))
                    }
                    onChange={(e) =>
                      setEditing((j) => ({ ...j, minScore: Number(e.target.value) }))
                    }
                    className="w-full accent-[#1A55E3]"
                  />
                  <Pill className="bg-[#5E6EED]/10 text-[#1A55E3] border-[#5E6EED]/30">
                    {Number(editing.minScore || 0).toFixed(1)}/10
                  </Pill>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-slate-600">Role Description</label>
                <textarea
                  value={editing.description}
                  onChange={(e) =>
                    setEditing((j) => ({ ...j, description: e.target.value }))
                  }
                  placeholder="Role description"
                  className="w-full border rounded-2xl px-3 py-2 bg-white/70 h-28 border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A55E3]/20"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-slate-600">
                  Responsibilities (one per line)
                </label>
                <textarea
                  value={editing.responsibilities}
                  onChange={(e) =>
                    setEditing((j) => ({ ...j, responsibilities: e.target.value }))
                  }
                  className="w-full border rounded-2xl px-3 py-2 bg-white/70 h-24 border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A55E3]/20"
                />
              </div>

              <div className="md:col-span-2">
                <p className="text-xs text-slate-600 mb-1">Required skills</p>
                <div className="flex flex-wrap gap-3">
                  {skills.map((sk) => {
                    const checked = (editing.skills || []).includes(sk._id);
                    return (
                      <label
                        key={sk._id}
                        className="text-sm inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-white hover:bg-slate-50 cursor-pointer"
                        title={checked ? "Remove" : "Add"}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSkill("skills", sk._id)}
                          className="cursor-pointer"
                        />
                        {sk.name}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="md:col-span-2">
                <p className="text-xs text-slate-600 mb-1">Preferred skills</p>
                <div className="flex flex-wrap gap-3">
                  {skills.map((sk) => {
                    const checked = (editing.preferredSkills || []).includes(sk._id);
                    return (
                      <label
                        key={`pref-${sk._id}`}
                        className="text-sm inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-white hover:bg-slate-50 cursor-pointer"
                        title={checked ? "Remove" : "Add"}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSkill("preferredSkills", sk._id)}
                          className="cursor-pointer"
                        />
                        {sk.name}
                      </label>
                    );
                  })}
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!editing.isFeatured}
                  onChange={(e) =>
                    setEditing((j) => ({ ...j, isFeatured: e.target.checked }))
                  }
                  className="cursor-pointer"
                />
                Featured listing
              </label>

              <select
                value={editing.status}
                onChange={(e) =>
                  setEditing((j) => ({ ...j, status: e.target.value }))
                }
                className="border rounded-xl px-3 py-2 bg-white/70 border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A55E3]/20"
                title="Status"
              >
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="paused">Paused</option>
              </select>

              <div className="md:col-span-2 flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-3 py-2 rounded-xl border bg-white hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 rounded-xl text-white cursor-pointer"
                  style={{ backgroundColor: "#1A55E3" }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = "#1749c5")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "#1A55E3")
                  }
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
