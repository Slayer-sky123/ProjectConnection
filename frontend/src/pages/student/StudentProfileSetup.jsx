import React, { useEffect, useMemo, useRef, useState } from "react";
import API from "../../api/axios";
import { Info, ChevronLeft, ChevronRight, CheckCircle2, Upload, X, Copy as CopyIcon, ClipboardCheck } from "lucide-react";

/* ---------------------- tiny safe localStorage helpers ---------------------- */
const getLS = (k, fb) => { try { const v = localStorage.getItem(k); return v != null ? v : fb; } catch { return fb; } };
const setLS = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
const parseJSON = (s, fb) => { try { return JSON.parse(s); } catch { return fb; } };

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(ta);
    }
  }
}

/* ------------------------------ debounce hook ------------------------------ */
function useDebouncedEffect(fn, deps, delay) {
  useEffect(() => {
    const t = setTimeout(fn, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...(deps || []), delay]);
}

/* =============================== main component =============================== */
export default function StudentProfileSetup({ open, onClose, onSaved }) {
  /* ---------------------------- refs / simple state ---------------------------- */
  const panelRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [skills, setSkills] = useState([]);
  const [serverLoading, setServerLoading] = useState(false);
  const [serverLoadedOnce, setServerLoadedOnce] = useState(false);

  /* ------------------------------ local cache load ----------------------------- */
  const cachedName = getLS("studentName", "");
  const cachedExtras = parseJSON(getLS("studentProfileExtras", "{}"), {});
  const cachedSkillId = getLS("studentPrimarySkillId", "");
  const cachedDraft = parseJSON(getLS("student.profile.draft", "{}"), {});
  const cachedStudentId = getLS("studentId", ""); // <- read-only ID cache

  /* ---------------------------- primary form state ---------------------------- */
  const [form, setForm] = useState({
    name: cachedDraft.name ?? cachedName ?? "",
    email: cachedDraft.email ?? cachedExtras.email ?? "",
    phone: cachedDraft.phone ?? cachedExtras.phone ?? "",
    university: cachedDraft.university ?? cachedExtras.university ?? "",
    education: cachedDraft.education ?? cachedExtras.education ?? "UG",
    skillId: cachedDraft.skillId ?? cachedSkillId ?? "",
  });

  // studentId (read-only, non-editable)
  const [studentId, setStudentId] = useState(cachedStudentId || "");
  const [copied, setCopied] = useState(false);

  // resume local (never stored as a file in LS, only display info)
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeInfo, setResumeInfo] = useState(cachedDraft.resumeInfo ?? "");

  /* --------------------------------- effects --------------------------------- */
  // lock background scroll only when open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  // load skills list once
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await API.get("/admin/skills");
        if (!ignore) setSkills(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error("Load skills failed:", e?.response?.data || e.message);
        if (!ignore) setSkills([]);
      }
    })();
    return () => { ignore = true; };
  }, []);

  // load server profile when first opens (hydrate form + studentId)
  useEffect(() => {
    let ignore = false;
    if (!open || serverLoadedOnce) return;
    (async () => {
      setServerLoading(true);
      try {
        const res = await API.get("/student/profile");
        if (ignore) return;
        const u = res?.data || {};

        setForm((prev) => ({
          name: u.name ?? prev.name ?? "",
          email: u.email ?? prev.email ?? "",
          phone: u.phone ?? prev.phone ?? "",
          university: u.university ?? prev.university ?? "",
          education: u.education ?? prev.education ?? "UG",
          skillId: (u.primarySkillId?._id || u.primarySkillId || prev.skillId || "").toString(),
        }));

        // studentId (read-only)
        if (u.studentId) {
          setStudentId(u.studentId);
          setLS("studentId", String(u.studentId));
        }

        if (u.resumeUrl) {
          const hint = u.resumeUrl.split("/").slice(-1)[0];
          setResumeInfo(`Existing: ${decodeURIComponent(hint)}`);
        }
        setServerLoadedOnce(true);

        // Notify others (e.g., Sidebar) that profile info (including studentId) is fresh
        window.dispatchEvent(new Event("student:profile-refreshed"));
      } catch (e) {
        console.warn("Profile fetch failed (using local cache):", e?.response?.data || e.message);
      } finally {
        if (!ignore) setServerLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [open, serverLoadedOnce]);

  // debounce-persist the draft locally (so reopen shows what user typed)
  useDebouncedEffect(() => {
    setLS("student.profile.draft", JSON.stringify({ ...form, resumeInfo }));
  }, [form, resumeInfo], 250);

  // derived primary skill name
  const primarySkillName = useMemo(
    () => skills.find((s) => String(s._id) === String(form.skillId))?.name || "",
    [skills, form.skillId]
  );

  /* --------------------------------- wizard --------------------------------- */
  const stepsTotal = 4;
  const canPrev = step > 1;
  const canNext = step < stepsTotal;

  const onChange = (key, v) => {
    setError("");
    setForm((f) => ({ ...f, [key]: v }));
  };

  const next = () => {
    setError("");
    if (step === 1 && !form.name.trim()) return setError("Please enter your full name.");
    if (step === 3 && !form.skillId) return setError("Please choose your primary skill.");
    setStep((s) => Math.min(stepsTotal, s + 1));
  };
  const prev = () => { setError(""); setStep((s) => Math.max(1, s - 1)); };

  const onPickResume = (file) => {
    if (!file) { setResumeFile(null); setResumeInfo(""); return; }
    const allowed = new Set([
      "application/pdf","application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/png","image/jpeg","image/webp"
    ]);
    if (!allowed.has(file.type)) { setError("Unsupported file type. Upload PDF/DOC/DOCX/PNG/JPG/WEBP."); setResumeFile(null); setResumeInfo(""); return; }
    if (file.size > 5 * 1024 * 1024) { setError("File too large (max 5MB)."); setResumeFile(null); setResumeInfo(""); return; }
    setError(""); setResumeFile(file); setResumeInfo(`${file.name} • ${(file.size/1024/1024).toFixed(2)} MB`);
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.name.trim()) return setError("Please enter your full name.");
    if (!form.skillId) return setError("Please choose your primary skill.");

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("email", form.email.trim());
      fd.append("phone", form.phone.trim());
      fd.append("university", form.university.trim());
      fd.append("education", form.education);
      fd.append("skills", primarySkillName ? [primarySkillName].join(",") : "");
      fd.append("primarySkillId", form.skillId);
      if (resumeFile) fd.append("resume", resumeFile);

      const res = await API.post("/student/profile/update", fd);
      const updated = res?.data?.user || {};

      // mirror to localStorage for instant re-hydration
      setLS("studentName", form.name.trim());
      setLS("studentPrimarySkillId", String(form.skillId));
      setLS("studentProfileExtras", JSON.stringify({
        email: form.email.trim(),
        phone: form.phone.trim(),
        university: form.university.trim(),
        education: form.education,
        primarySkillName,
      }));
      setLS("student.profile.draft", JSON.stringify({ ...form, resumeInfo }));

      // NEW: cache studentId (non-editable, provided by server)
      if (updated.studentId) {
        setStudentId(updated.studentId);
        setLS("studentId", String(updated.studentId));
      }

      // notify others (Sidebar) that profile has been updated
      window.dispatchEvent(new Event("student:profile-refreshed"));

      onSaved?.(form.name.trim());
      onClose?.();
      return updated;
    } catch (e) {
      console.error("Save profile failed:", e?.response?.data || e.message);
      setError(e?.response?.data?.message || "Failed to save profile. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleCopyId = async () => {
    if (!studentId) return;
    const ok = await copyToClipboard(studentId);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };

  /* --------------------------------- ui bits --------------------------------- */
  const StepBadge = ({ n, label }) => {
    const active = step === n, done = step > n;
    return (
      <div className="flex items-center gap-2">
        <div className={["h-7 w-7 rounded-full grid place-items-center text-xs font-semibold border",
          done ? "bg-emerald-600 text-white border-emerald-600"
               : active ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-slate-600 border-slate-200"].join(" ")}>
          {done ? <CheckCircle2 size={16} /> : n}
        </div>
        <div className={["text-xs",
          done ? "text-emerald-700" : active ? "text-indigo-700" : "text-slate-500"].join(" ")}>
          {label}
        </div>
      </div>
    );
  };

  const ProgressBar = () => {
    const pct = Math.round((step / stepsTotal) * 100);
    return (
      <div className="mt-3 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-600" style={{ width: `${pct}%`, transition: "width .25s ease" }} />
      </div>
    );
  };

  /* --------------------------------- render --------------------------------- */
  return (
    <div
      className={[
        "fixed inset-0 z-50 flex items-center justify-center transition",
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      ].join(" ")}
      aria-hidden={!open}
    >
      {/* dim */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      {/* panel */}
      <div
        ref={panelRef}
        className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl z-10"
        role="dialog"
        aria-modal="true"
      >
        {/* Close (explicit) */}
        <button
          type="button"
          onClick={() => onClose?.()}
          className="absolute right-3 top-3 h-8 w-8 grid place-items-center rounded-lg hover:bg-slate-100 text-slate-600"
          title="Close"
        >
          <X size={18} />
        </button>

        {/* header */}
        <div className="flex items-start justify-between pr-10 gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-slate-900">Let’s personalize your experience</h2>
            <p className="text-sm text-slate-600">A few quick steps to tailor your dashboard to your chosen skill.</p>
            {serverLoading && (
              <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                Syncing your saved profile…
              </div>
            )}
          </div>

          {/* Right side: Read-only Student ID & note */}
          <div className="flex flex-col items-end gap-2">
            {studentId ? (
              <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
                <span className="text-[11px] text-slate-500">Student ID</span>
                <span className="font-mono text-sm text-slate-900">{studentId}</span>
                <button
                  onClick={handleCopyId}
                  className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[11px] text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                  title="Copy ID"
                >
                  {copied ? <ClipboardCheck size={14} /> : <CopyIcon size={14} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            ) : null}
            <div className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs text-blue-700 ring-1 ring-blue-100 inline-flex items-center gap-1">
              <Info size={14} /> You can edit this anytime.
            </div>
          </div>
        </div>

        {/* steps */}
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-4">
          <StepBadge n={1} label="Basics" />
          <StepBadge n={2} label="Academics" />
          <StepBadge n={3} label="Primary Skill" />
          <StepBadge n={4} label="Resume & Review" />
        </div>
        <ProgressBar />

        {/* error */}
        {error && <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

        {/* content */}
        <div className="mt-5" key={`wizard-step-${step}`}>
          {step === 1 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs text-slate-600">Full Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e)=>onChange("name", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200"
                  placeholder="e.g., Priya Sharma"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e)=>onChange("email", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200"
                  placeholder="name@example.com"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e)=>onChange("phone", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200"
                  placeholder="+91 9XXXXXXXXX"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs text-slate-600">University</label>
                <input
                  type="text"
                  value={form.university}
                  onChange={(e)=>onChange("university", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200"
                  placeholder="e.g., IIT Delhi"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600">Education</label>
                <select
                  value={form.education}
                  onChange={(e)=>onChange("education", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="UG">UG</option>
                  <option value="PG">PG</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs text-slate-600">Choose Primary Skill *</label>
                <select
                  value={form.skillId}
                  onChange={(e)=>onChange("skillId", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">-- choose your main skill --</option>
                  {skills.map((s) => (<option key={s._id} value={s._id}>{s.name}</option>))}
                </select>
                <p className="mt-1 text-[11px] text-slate-500">
                  Your dashboard (study, jobs, tests, roadmap, progress) will focus on <b>{primarySkillName || "your selected skill"}</b>.
                </p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              {/* Show student ID in review section as well */}
              {studentId ? (
                <div>
                  <label className="text-xs text-slate-600">Student ID (read-only)</label>
                  <div className="mt-1 inline-flex items-center gap-2 rounded-md bg-white px-2 py-1 text-sm font-mono text-slate-800 ring-1 ring-slate-200">
                    {studentId}
                    <button
                      onClick={handleCopyId}
                      className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-[2px] text-[11px] text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                      title="Copy ID"
                    >
                      {copied ? <ClipboardCheck size={14} /> : <CopyIcon size={14} />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              ) : null}

              <div>
                <label className="text-xs text-slate-600">Upload Resume (PDF/DOC/DOCX/PNG/JPG/WEBP, max 5MB)</label>
                <div className="mt-1 flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm cursor-pointer hover:bg-slate-50">
                    <Upload size={16} /> Choose file
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                      onChange={(e)=>onPickResume(e.target.files?.[0])}
                    />
                  </label>
                  <div className="text-xs text-slate-600">{resumeInfo || "No file selected"}</div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-medium text-slate-800">Quick Review</div>
                <div className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  <div><div className="text-slate-500">Name</div><div className="font-medium">{form.name || "—"}</div></div>
                  <div><div className="text-slate-500">Email</div><div className="font-medium">{form.email || "—"}</div></div>
                  <div><div className="text-slate-500">Phone</div><div className="font-medium">{form.phone || "—"}</div></div>
                  <div><div className="text-slate-500">University</div><div className="font-medium">{form.university || "—"}</div></div>
                  <div><div className="text-slate-500">Education</div><div className="font-medium">{form.education || "—"}</div></div>
                  <div><div className="text-slate-500">Primary Skill</div><div className="font-medium">{primarySkillName || "—"}</div></div>
                  <div className="sm:col-span-2"><div className="text-slate-500">Resume</div><div className="font-medium">{resumeInfo || "—"}</div></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* footer actions */}
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onClose?.()}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
            disabled={busy}
          >
            Cancel
          </button>
        <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prev}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              disabled={!canPrev || busy}
            >
              <ChevronLeft size={16} /> Back
            </button>
            {step < stepsTotal ? (
              <button
                type="button"
                onClick={next}
                className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-60"
                disabled={!canNext || busy}
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-60"
                disabled={busy}
              >
                {busy ? "Saving…" : "Save & Personalize"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
