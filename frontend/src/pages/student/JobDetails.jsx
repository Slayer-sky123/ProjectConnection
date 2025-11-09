// src/pages/student/JobDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import API from "../../api/axios";
import {
  Briefcase, MapPin, Layers, CalendarDays, Users,
  FileText, ArrowLeft
} from "lucide-react";

/* ------------------- tiny helpers (palette-matched) ------------------- */
const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut", delay } },
});

function Card({ children, className = "" }) {
  return (
    <div
      className={
        "rounded-2xl border border-[#E5EAF0] bg-white/90 backdrop-blur " +
        "shadow-[0_6px_18px_rgba(10,38,71,0.06)] hover:shadow-[0_12px_30px_rgba(10,38,71,0.12)] transition-shadow " +
        className
      }
    >
      {children}
    </div>
  );
}

function Pill({ children, className = "" }) {
  return (
    <span
      className={
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border " +
        "border-[#E5EAF0] " + className
      }
    >
      {children}
    </span>
  );
}

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

/* ---------------------------------- Page ---------------------------------- */
export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [job, setJob] = useState(location.state?.job || null);
  const [busy, setBusy] = useState(false);
  const [resumeName, setResumeName] = useState("");
  const [appliedIds, setAppliedIds] = useState([]);
  const appliedSet = useMemo(() => new Set(appliedIds), [appliedIds]);

  // Fallback: fetch list and find job if direct URL access (kept exactly as your logic)
  useEffect(() => {
    (async () => {
      if (job) return;
      try {
        const j = await API.get("/student/jobs");
        const list = Array.isArray(j.data) ? j.data : [];
        const found = list.find((x) => String(x._id) === String(id));
        if (found) setJob(found);
        else console.warn("Job not found in /student/jobs list");
      } catch (e) {
        console.error("JobDetails fallback load failed:", e?.response?.data || e.message);
      }
    })();
  }, [id, job]);

  // Load my applications (to show "already applied")
  useEffect(() => {
    (async () => {
      try {
        const mine = await API.get("/student/jobs/mine/applications").catch(() => ({ data: [] }));
        const ids = new Set(
          (mine.data || [])
            .map((a) => (typeof a.job === "object" ? a.job._id : a.job))
            .filter(Boolean)
        );
        setAppliedIds(Array.from(ids));
      } catch {
        // non-fatal
      }
    })();
  }, []);

  const submitApplication = async (e) => {
    e.preventDefault();
    if (!job?._id) return;

    setBusy(true);
    const form = new FormData(e.currentTarget);
    const coverLetter = (form.get("coverLetter") || "").toString().trim();
    const resumeFile = form.get("resume");

    try {
      if (resumeFile && resumeFile.name) {
        const fd = new FormData();
        fd.append("coverLetter", coverLetter);
        fd.append("resume", resumeFile);
        await API.post(`/student/jobs/${job._id}/apply`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await API.post(`/student/jobs/${job._id}/apply`, { coverLetter });
      }
      setAppliedIds((arr) => Array.from(new Set([...arr, job._id])));
      alert("Application submitted!");
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || "Failed to apply";
      if (status === 409) {
        setAppliedIds((arr) => Array.from(new Set([...arr, job._id])));
        alert("You already applied to this job.");
      } else {
        alert(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  if (!job) {
    return (
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-[#144272] hover:underline"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <Card className="p-10 text-center mt-4">Loading…</Card>
      </div>
    );
  }

  const startTxt = job.startDate ? new Date(job.startDate).toLocaleDateString() : "—";
  const typeBadge =
    job.type === "internship"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-[#E9F1FA] text-[#205295]";

  return (
    <div className="w-full">
      {/* Header band with brand gradient */}
      <div className="bg-gradient-to-br from-[#E9F1FA] via-white to-white border-b border-[#E5EAF0]">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-xl border border-[#E5EAF0] bg-white text-[#0A2647] hover:bg-[#F7FAFF]"
              title="Go back"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <Pill className={typeBadge}>{job.type === "internship" ? "Internship" : "Job"}</Pill>
          </div>

          {/* Title row */}
          <div className="pb-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs text-[#144272B3]">{job.company?.name || "—"}</div>
                <h1 className="mt-1 text-2xl sm:text-3xl font-semibold leading-tight text-[#0A2647]">
                  {job.title}
                </h1>
                <div className="mt-3 grid sm:grid-cols-5 gap-2 text-sm text-[#0A2647]">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-[#14427299]" /> {job.location || "Remote"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers size={14} className="text-[#14427299]" /> {job.experience || "—"}
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays size={14} className="text-[#14427299]" /> Start: {startTxt}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-[#14427299]" /> Openings: {job.openings ?? 1}
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase size={14} className="text-[#14427299]" /> {formatPackage(job.package)}
                  </div>
                </div>
              </div>

              {job.company?.logoUrl ? (
                <img
                  src={job.company.logoUrl}
                  alt="logo"
                  className="h-12 w-12 rounded-xl object-cover border border-[#E5EAF0]"
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_360px]">
          {/* LEFT: Details */}
          <motion.div {...fade(0.03)} className="space-y-6">
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-[#144272]">Role Overview</h2>
              <p className="mt-2 text-sm text-[#0A2647] whitespace-pre-wrap">
                {job.description || "No description provided."}
              </p>
            </Card>

            {(job.responsibilities || []).length > 0 && (
              <Card className="p-6">
                <h2 className="text-sm font-semibold text-[#144272] mb-2">Responsibilities</h2>
                <ul className="list-disc pl-5 text-sm text-[#0A2647] space-y-1">
                  {job.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </Card>
            )}

            {(job.skills || []).length > 0 && (
              <Card className="p-6">
                <h2 className="text-sm font-semibold text-[#144272] mb-2">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((s, i) => (
                    <Pill
                      key={i}
                      className="bg-white text-[#144272] border-[#E5EAF0] shadow-[0_2px_8px_rgba(10,38,71,0.04)]"
                    >
                      {typeof s === "string" ? s : s.name}
                    </Pill>
                  ))}
                </div>
              </Card>
            )}

            {job.company?.description && (
              <Card className="p-6">
                <h2 className="text-sm font-semibold text-[#144272] mb-2">
                  About {job.company.name}
                </h2>
                <p className="text-sm text-[#0A2647]">{job.company.description}</p>
              </Card>
            )}
          </motion.div>

          {/* RIGHT: Apply box (sticky) */}
          <motion.aside {...fade(0.06)} className="space-y-4">
            <Card className="p-5 sticky top-6 bg-gradient-to-b from-[#E9F1FA] via-white to-white">
              <div className="text-sm font-semibold text-[#0A2647]">Apply for this role</div>
              <p className="text-xs text-[#144272] mt-1">Attach a resume and add a short note.</p>

              {appliedSet.has(job._id) ? (
                <div className="mt-4">
                  <Pill className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    You’ve already applied
                  </Pill>
                </div>
              ) : (
                <form onSubmit={submitApplication} className="space-y-3 mt-4">
                  <div>
                    <label className="text-xs text-[#144272]">Cover letter (optional)</label>
                    <textarea
                      name="coverLetter"
                      rows={5}
                      className="mt-1 w-full border border-[#E5EAF0] rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#E9F1FA]"
                      placeholder="Introduce yourself, highlight your fit…"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[#144272] flex items-center gap-2">
                      <FileText size={14}/> Resume (PDF/DOC) — optional
                    </label>
                    <input
                      name="resume"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="mt-1 block w-full text-sm file:mr-3 file:rounded-md file:border file:px-3 file:py-1.5 file:bg-[#F6F9FF] hover:file:bg-[#EEF5FF]"
                      onChange={(e) => setResumeName(e.target.files?.[0]?.name || "")}
                    />
                    {resumeName && (
                      <div className="mt-1 text-xs text-[#144272] truncate">Selected: {resumeName}</div>
                    )}
                  </div>

                  <button
                    disabled={busy}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#205295] text-white hover:opacity-95 disabled:opacity-60"
                  >
                    {busy ? "Submitting…" : "Submit Application"}
                  </button>
                </form>
              )}
            </Card>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
