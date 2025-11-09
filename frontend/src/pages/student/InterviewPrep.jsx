// src/pages/student/InterviewPrep.jsx
import { useEffect, useMemo, useState } from "react";
import API from "../../api/axios";
import { useSkill } from "../../context/SkillContext";
import { Loader2, FileText, Wand2, CheckCircle2, AlertCircle } from "lucide-react";

export default function InterviewPrep() {
  const { selected } = useSkill();
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [strengths, setStrengths] = useState([]);
  const [gaps, setGaps] = useState([]);
  const [resumeText, setResumeText] = useState("");
  const [resumeFile, setResumeFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");

  const chosenSkillName = selected?.name || "";

  useEffect(() => {
    document.title = "Interview Prep | StudentConnect";
  }, []);

  const canGenerate = useMemo(() => !!targetRole, [targetRole]);

  const generate = async () => {
    setError("");
    setPlan(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.append("targetRole", targetRole);
      form.append("strengths", JSON.stringify(strengths));
      form.append("gaps", JSON.stringify(gaps));
      form.append("latestScores", JSON.stringify([]));
      if (resumeText?.trim()) form.append("resumeText", resumeText);
      if (resumeFile) form.append("resume", resumeFile);

      // fast fan-out route
      const res = await API.post("/ai/interview-prep", form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      });

      const data = res.data || {};
      setPlan(data);
      if (!data.checklist?.length || !data.practice?.length) {
        setError("Received partial content; try again or tweak inputs.");
      }
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to generate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Interview Preparation</h1>
          <p className="text-sm text-slate-600">
            Tailored to your latest tests, resume and chosen focus
            {chosenSkillName ? ` — ${chosenSkillName}` : ""}.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Focus Skill</div>
          <div className="text-sm font-medium">{chosenSkillName || "—"}</div>
        </div>
      </div>

      {/* Form */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border p-4 space-y-3">
          <label className="block">
            <div className="text-xs text-slate-500 mb-1">Target Role</div>
            <input
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              placeholder="e.g. Backend Developer"
            />
          </label>

          <label className="block">
            <div className="text-xs text-slate-500 mb-1">Strengths (comma-separated)</div>
            <input
              value={strengths.join(", ")}
              onChange={(e) => setStrengths(e.target.value.split(",").map((v) => v.trim()).filter(Boolean))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              placeholder="e.g. data structures, JavaScript"
            />
          </label>

          <label className="block">
            <div className="text-xs text-slate-500 mb-1">Gaps (comma-separated)</div>
            <input
              value={gaps.join(", ")}
              onChange={(e) => setGaps(e.target.value.split(",").map((v) => v.trim()).filter(Boolean))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              placeholder="e.g. system design, concurrency"
            />
          </label>
        </div>

        <div className="bg-white rounded-2xl border p-4 space-y-3">
          <div className="text-xs text-slate-500">Resume (paste or upload)</div>
          <textarea
            rows={8}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste resume text…"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          />
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="file"
              accept=".pdf,.txt,.md"
              onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
            />
            <FileText size={16} />
            {resumeFile ? resumeFile.name : "Upload file (optional)"}
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={generate}
          disabled={!canGenerate || loading}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-4 py-2 disabled:opacity-60"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
          Generate Plan
        </button>
        {error && (
          <div className="text-sm text-rose-700 inline-flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      {!plan ? null : (
        <div className="grid lg:grid-cols-3 gap-4">
          <Section title="Overview" icon={<CheckCircle2 className="text-emerald-600" />}>
            <p className="text-sm text-slate-800 whitespace-pre-wrap">{plan.overview || "—"}</p>
          </Section>

          <Section title="Checklist">
            <ul className="list-disc pl-5 text-sm text-slate-800 space-y-1">
              {(plan.checklist || []).map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </Section>

          <Section title="Revision Notes">
            <ul className="list-disc pl-5 text-sm text-slate-800 space-y-1">
              {(plan.revisionNotes || []).map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </Section>

          <Section title="Syllabus" span={2}>
            <div className="space-y-3">
              {(plan.syllabus || []).map((sec, i) => (
                <div key={i} className="rounded-xl border p-3">
                  <div className="font-medium text-slate-900">{sec.heading}</div>
                  <ul className="list-disc pl-5 text-sm text-slate-800 space-y-1 mt-1">
                    {(sec.bullets || []).map((b, j) => (
                      <li key={j}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          <Section title="4-Week Plan">
            <div className="space-y-3">
              {(plan.weeks || []).map((w, i) => (
                <div key={i} className="rounded-xl border p-3">
                  <div className="font-medium">{w.title} — <span className="text-slate-600">{w.focus}</span></div>
                  <ul className="list-disc pl-5 text-sm text-slate-800 space-y-1 mt-1">
                    {(w.tasks || []).map((t, j) => (
                      <li key={j}>{t}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Resources">
            <div className="space-y-3">
              {(plan.resources || []).map((r, i) => (
                <div key={i} className="rounded-xl border p-3">
                  <div className="font-medium text-slate-900">{r.title}</div>
                  <p className="text-sm text-slate-800 mt-1 whitespace-pre-wrap">{r.content}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Practice Sets" span={2}>
            <div className="space-y-3">
              {(plan.practice || []).map((set, i) => (
                <div key={i} className="rounded-xl border p-3">
                  <div className="font-medium text-slate-900">{set.title}</div>
                  <div className="mt-2 space-y-2">
                    {(set.items || []).map((qa, j) => (
                      <div key={j} className="bg-slate-50 rounded-lg p-3">
                        <div className="text-sm font-medium">Q: {qa.question}</div>
                        <div className="text-sm text-slate-700 mt-1">A: {qa.answer}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Behavioral">
            <div className="space-y-3">
              {(plan.behavioral || []).map((b, i) => (
                <div key={i} className="rounded-xl border p-3">
                  <div className="font-medium text-slate-900">{b.prompt}</div>
                  <p className="text-sm text-slate-800 mt-1 whitespace-pre-wrap">{b.guide}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ title, children, icon = null, span = 1 }) {
  return (
    <div className={`bg-white rounded-2xl border p-4 lg:col-span-${span}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}
