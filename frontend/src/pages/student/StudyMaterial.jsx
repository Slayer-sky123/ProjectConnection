import { useEffect, useMemo, useState } from "react";
import API from "../../api/axios";
import { useSkill } from "../../context/SkillContext";
import { Loader2, CheckCircle2, BookOpen, ListChecks, Lightbulb, Sparkles, Save } from "lucide-react";

export default function StudyMaterial() {
  const { selected } = useSkill();
  const [study, setStudy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [genLoading, setGenLoading] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [error, setError] = useState("");

  const skillName = selected?.name || "";

  useEffect(() => {
    document.title = "Study Material | StudentConnect";
    (async () => {
      try {
        const res = await API.get("/student/study");
        setStudy(res.data?.study || null);
      } catch (e) {
        setStudy(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const generate = async () => {
    setGenLoading(true);
    setError("");
    try {
      const form = new FormData();
      if (resumeText?.trim()) form.append("resumeText", resumeText);
      if (resumeFile) form.append("resume", resumeFile);

      const res = await API.post("/ai/study", form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      });
      setStudy(res.data?.study || null);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to generate study material");
    } finally {
      setGenLoading(false);
    }
  };

  const toggleChecklist = async (idx) => {
    if (!study?.content?.checklist) return;
    const cur = new Set(study.progress?.checklistDone || []);
    if (cur.has(idx)) cur.delete(idx); else cur.add(idx);
    const next = Array.from(cur).sort((a,b)=>a-b);
    setStudy((s) => ({ ...s, progress: { ...s.progress, checklistDone: next }}));
    try {
      await API.patch(`/student/study/${study.id}/progress`, { checklistDone: next });
    } catch {}
  };

  const markRead = async (key) => {
    const set = new Set(study.progress?.sectionsRead || []);
    set.add(key);
    const next = Array.from(set);
    setStudy((s) => ({ ...s, progress: { ...s.progress, sectionsRead: next }}));
    try {
      await API.patch(`/student/study/${study.id}/progress`, { sectionsRead: next });
    } catch {}
  };

  const canGenerate = useMemo(() => !!skillName, [skillName]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Study Material</h1>
          <p className="text-sm text-slate-600">Personalized for <span className="font-medium">{skillName || "your skill"}</span>.</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Focus Skill</div>
          <div className="text-sm font-medium">{skillName || "—"}</div>
        </div>
      </div>

      {/* Generate region */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border p-4 bg-gradient-to-br from-sky-50/70 to-white">
          <div className="text-sm font-medium text-slate-900 mb-1">Add/Override Resume Context (optional)</div>
          <textarea
            rows={6}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
            placeholder="Paste resume text or leave empty to use saved resume."
          />
          <div className="mt-2 flex items-center gap-3 text-sm">
            <input type="file" accept=".pdf,.txt,.md" onChange={(e)=> setResumeFile(e.target.files?.[0] || null)} />
            <button
              onClick={generate}
              disabled={!canGenerate || genLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-4 py-2 disabled:opacity-60"
            >
              {genLoading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
              Generate / Refresh
            </button>
            {error && <span className="text-rose-700">{error}</span>}
          </div>
        </div>

        <div className="rounded-2xl border p-4 bg-gradient-to-br from-indigo-50/70 to-white">
          <div className="text-sm font-medium text-slate-900 mb-1">Progress</div>
          <div className="text-xs text-slate-600">We save your checklist and read sections.</div>
          {study?.progress?.lastVisitedAt && (
            <div className="text-xs text-slate-500 mt-1">
              Last visited: {new Date(study.progress.lastVisitedAt).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="rounded-2xl border p-6 text-center">Loading…</div>
      ) : !study ? (
        <div className="rounded-2xl border p-6 text-center">
          <div className="max-w-lg mx-auto">
            <p>No study pack yet. Generate one above to get started.</p>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Overview */}
          <Section title="Overview" icon={<BookOpen className="text-sky-600" />}>
            <p className="text-sm text-slate-800 whitespace-pre-wrap">{study.content?.overview || "—"}</p>
            <button
              className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm"
              onClick={() => markRead("overview")}
            >
              <Save size={14} /> Mark read
            </button>
          </Section>

          {/* Checklist */}
          <Section title="Checklist" icon={<ListChecks className="text-emerald-600" />}>
            <ul className="space-y-2">
              {(study.content?.checklist || []).map((t, i) => {
                const done = (study.progress?.checklistDone || []).includes(i);
                return (
                  <li key={i} className="flex items-start gap-2">
                    <button
                      onClick={() => toggleChecklist(i)}
                      className={
                        "mt-0.5 h-5 w-5 rounded grid place-items-center border " +
                        (done ? "bg-emerald-600 text-white border-emerald-600" : "bg-white")
                      }
                      title="toggle"
                    >
                      {done ? <CheckCircle2 size={14} /> : null}
                    </button>
                    <div className={"text-sm " + (done ? "line-through text-slate-400" : "text-slate-800")}>{t}</div>
                  </li>
                );
              })}
            </ul>
          </Section>

          {/* Quick Ref */}
          <Section title="Quick Reference" icon={<Lightbulb className="text-amber-600" />}>
            <ul className="list-disc pl-5 text-sm text-slate-800 space-y-1">
              {(study.content?.quickRef || []).map((x, i) => <li key={i}>{x}</li>)}
            </ul>
          </Section>

          {/* Units */}
          <Section title="Units" span={2}>
            <div className="space-y-3">
              {(study.content?.units || []).map((u, i) => (
                <div key={i} className="rounded-xl border p-3">
                  <div className="font-medium text-slate-900">{u.title}</div>
                  <ul className="list-disc pl-5 text-sm text-slate-800 space-y-1 mt-1">
                    {(u.topics || []).map((b, j) => <li key={j}>{b}</li>)}
                  </ul>
                  <div className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{u.notes}</div>
                </div>
              ))}
            </div>
            <button
              className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm"
              onClick={() => markRead("units")}
            >
              <Save size={14} /> Mark read
            </button>
          </Section>

          {/* Practice Sets */}
          <Section title="Practice Sets">
            <div className="space-y-3">
              {(study.content?.practiceSets || []).map((set, i) => (
                <div key={i} className="rounded-xl border p-3">
                  <div className="font-medium text-slate-900">{set.title}</div>
                  <div className="mt-2 space-y-2">
                    {(set.items || []).map((qa, j) => (
                      <div key={j} className="bg-slate-50 rounded-lg p-3">
                        <div className="text-sm font-medium">Q: {qa.q}</div>
                        <div className="text-sm text-slate-700 mt-1">A: {qa.a}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm"
              onClick={() => markRead("practice")}
            >
              <Save size={14} /> Mark read
            </button>
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
