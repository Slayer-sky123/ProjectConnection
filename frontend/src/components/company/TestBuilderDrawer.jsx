import { useEffect, useState } from "react";
import API from "../../api/axios";
import {
  X,
  Plus,
  Clock,
  ListChecks,
  Trash2,
  Edit3,
  UploadCloud,
  ChevronRight,
} from "lucide-react";

/**
 * Assessment Center (2-step)
 * Premium UI: Glass cards, subtle shadows, smooth hover states, and better spacing.
 */
export default function TestBuilderDrawer({
  open,
  onClose,
  application,
  onChanged,
}) {
  const [assignments, setAssignments] = useState([]);
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [tmplBusy, setTmplBusy] = useState(false);

  // Step 1 form (skill removed)
  const [form, setForm] = useState({
    type: "custom",
    title: "",
    durationMins: 30,
    startAt: "",
    endAt: "",
  });

  // Step 2 (questions/template)
  const [templateId, setTemplateId] = useState("");
  const [questions, setQuestions] = useState([
    { text: "", options: ["", "", "", ""], answerIndex: 0 },
  ]);
  const [bulkText, setBulkText] = useState("");

  // Load assigned tests when opening
  useEffect(() => {
    if (!open) return;
    setStep(1);
    setBusy(false);
    setTmplBusy(false);
    setTemplateId("");
    setQuestions([{ text: "", options: ["", "", "", ""], answerIndex: 0 }]);
    setBulkText("");

    const defaultTitle = `${application?.job?.title || "Role"} - Assessment`;
    setForm({
      type: "custom",
      title: defaultTitle,
      durationMins: 30,
      startAt: "",
      endAt: "",
    });

    (async () => {
      try {
        const a = await API.get(
          `/company/applications/${application._id}/assigned-tests`
        );
        setAssignments(Array.isArray(a.data) ? a.data : []);
      } catch {
        setAssignments([]);
      }
    })();
  }, [open, application?._id]);

  const reloadAssignments = async () => {
    const a = await API.get(
      `/company/applications/${application._id}/assigned-tests`
    );
    setAssignments(Array.isArray(a.data) ? a.data : []);
    onChanged?.();
  };

  const canProceedToStep2 =
    !!String(form.title || "").trim() && Number(form.durationMins) > 0;

  const goStep2 = () => {
    if (!canProceedToStep2) return;
    setStep(2);
  };

  const addQ = () =>
    setQuestions((qs) => [
      ...qs,
      { text: "", options: ["", "", "", ""], answerIndex: 0 },
    ]);

  const delQ = (i) => setQuestions((qs) => qs.filter((_, idx) => idx !== i));

  const setQ = (i, patch) =>
    setQuestions((qs) => {
      const arr = [...qs];
      arr[i] = { ...arr[i], ...patch };
      return arr;
    });

  const setOpt = (i, j, val) =>
    setQuestions((qs) => {
      const arr = [...qs];
      const opts = [...arr[i].options];
      opts[j] = val;
      arr[i] = { ...arr[i], options: opts };
      return arr;
    });

  const runBulkImport = () => {
    const lines = bulkText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) return;
    const parsed = [];
    for (const line of lines) {
      const parts = line.split("|").map((p) => p.trim());
      if (parts.length < 3) continue;
      const txt = parts[0];
      const opts = parts[1]
        .split(";")
        .map((o) => o.trim())
        .filter(Boolean);
      const idx = Math.max(0, Math.min(3, Number(parts[2]) || 0));
      if (txt && opts.length >= 2) {
        const fill = [...opts];
        while (fill.length < 4) fill.push("");
        parsed.push({
          text: txt,
          options: fill.slice(0, 4),
          answerIndex: idx,
        });
      }
    }
    if (parsed.length) setQuestions(parsed);
  };

  const assignNow = async () => {
    if (
      questions.some(
        (q) => !q.text.trim() || q.options.some((o) => !o.trim())
      )
    ) {
      return alert("Please complete all questions and options.");
    }

    setTmplBusy(true);
    try {
      let tmplId = templateId;

      const payload = {
        title: String(form.title || "").trim(),
        durationMins: Number(form.durationMins || 20),
        negative: 0,
        shuffle: true,
        questions: questions.map((q) => ({
          text: q.text,
          options: q.options,
          answerIndex: Number(q.answerIndex || 0),
        })),
      };

      if (tmplId) {
        await API.put(`/company/recruiter-tests/templates/${tmplId}`, payload);
      } else {
        const created = await API.post(
          "/company/recruiter-tests/templates",
          payload
        );
        tmplId = created.data?._id;
      }

      await API.post("/company/recruiter-tests/assign", {
        applicationId: application._id,
        templateId: tmplId,
        dueAt: form.endAt || null,
      });

      await reloadAssignments();

      setStep(1);
      setTemplateId("");
      setQuestions([{ text: "", options: ["", "", "", ""], answerIndex: 0 }]);
      setBulkText("");
    } catch (e) {
      alert(e?.response?.data?.message || "Assign failed");
    } finally {
      setTmplBusy(false);
    }
  };

  const deleteAssignment = async (id) => {
    if (!window.confirm("Delete this assignment?")) return;
    setBusy(true);
    try {
      await API.delete(`/company/tests/assignments/${id}`);
      await reloadAssignments();
    } catch (e) {
      alert(e?.response?.data?.message || "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  const loadTemplateToEditor = async (assign) => {
    try {
      if (assign.source !== "recruiter" || !assign.templateId) return;
      const list = await API.get("/company/recruiter-tests/templates");
      const tmpl = (list.data || []).find(
        (t) => String(t._id) === String(assign.templateId)
      );
      if (!tmpl) return alert("Template not found.");

      setTemplateId(String(tmpl._id));
      setForm((f) => ({
        ...f,
        title: tmpl.title || f.title,
        durationMins: Number(tmpl.durationMins || f.durationMins),
      }));
      setQuestions(
        (tmpl.questions || []).map((q) => ({
          text: q.text,
          options: q.options,
          answerIndex: Number(q.answerIndex || 0),
        }))
      );
      setStep(2);
    } catch (e) {
      alert("Failed to load template");
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm grid"
      style={{ gridTemplateColumns: "1fr min(980px, 100vw)" }}
    >
      <div
        onClick={() => {
          setStep(1);
          onClose?.();
        }}
        className="cursor-pointer"
      />
      <div className="bg-gradient-to-b from-white to-slate-50 h-full overflow-y-auto border-l shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b bg-white/80 backdrop-blur flex items-center justify-between sticky top-0 z-10">
          <div>
            <div className="font-bold text-lg text-slate-800">
              Assessment Center
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Candidate: {" "}
              <b className="text-slate-900">{application?.student?.name}</b> ·
              Job: <b className="text-slate-900">{application?.job?.title}</b>
            </div>
          </div>
          <button
            onClick={() => {
              setStep(1);
              onClose?.();
            }}
            className="p-2 rounded-full hover:bg-slate-100 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-4 pb-2 flex items-center gap-2 text-xs text-slate-600 font-medium">
          <span
            className={`px-2.5 py-1.5 rounded-lg ${
              step === 1
                ? "bg-blue-600 text-white shadow"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            Step 1: Details
          </span>
          <ChevronRight size={14} />
          <span
            className={`px-2.5 py-1.5 rounded-lg ${
              step === 2
                ? "bg-blue-600 text-white shadow"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            Step 2: Questions & Assign
          </span>
        </div>

        <div className="p-6 space-y-8">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="p-6 rounded-2xl border bg-white/80 shadow-sm hover:shadow-md transition">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-semibold text-slate-500">
                    Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, type: e.target.value }))
                    }
                    className="w-full border rounded-xl px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="custom">Custom</option>
                    <option value="skill">Skill</option>
                    <option value="aptitude">Aptitude</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500">
                    Title
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                    placeholder="e.g. JavaScript Basics"
                    className="w-full border rounded-xl px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500">
                    Duration (mins)
                  </label>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={form.durationMins}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, durationMins: e.target.value }))
                    }
                    className="w-full border rounded-xl px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500">
                    Start At (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={form.startAt}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, startAt: e.target.value }))
                    }
                    className="w-full border rounded-xl px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500">
                    End/Due (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={form.endAt}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, endAt: e.target.value }))
                    }
                    className="w-full border rounded-xl px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2 flex items-center justify-end">
                  <button
                    disabled={!canProceedToStep2}
                    onClick={goStep2}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    Next: Questions
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="p-6 rounded-2xl border bg-white/80 shadow-sm hover:shadow-md transition space-y-5">
              <div className="text-sm text-slate-700">
                <div className="font-semibold text-slate-800">
                  Add MCQs
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Each question needs at least two options populated.
                </div>
              </div>

              {/* Bulk import */}
              <div className="rounded-xl border bg-slate-50/70 p-4">
                <div className="text-xs text-slate-600 mb-2 inline-flex items-center gap-1">
                  <UploadCloud size={14} /> Bulk import format:
                  <code className="px-2 py-0.5 bg-white border rounded">
                    Question | opt1;opt2;opt3;opt4 | correctIndex
                  </code>
                </div>
                <textarea
                  rows={3}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={`What is 2+2? | 1;2;3;4 | 3`}
                  className="w-full border rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500"
                />
                <div className="pt-2">
                  <button
                    onClick={runBulkImport}
                    className="px-4 py-2 rounded-xl border bg-white hover:bg-slate-100 text-sm font-medium"
                  >
                    Import
                  </button>
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-4">
                {questions.map((q, i) => (
                  <div
                    key={i}
                    className="border rounded-xl p-4 bg-slate-50 hover:bg-slate-100 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm text-slate-700">
                        Question {i + 1}
                      </div>
                      <button
                        onClick={() => delQ(i)}
                        className="text-rose-600 hover:text-rose-700 text-xs inline-flex items-center gap-1"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={q.text}
                      onChange={(e) => setQ(i, { text: e.target.value })}
                      placeholder="Question text"
                      className="w-full mt-3 border rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="grid md:grid-cols-2 gap-2 mt-3">
                      {q.options.map((o, j) => (
                        <input
                          key={j}
                          value={o}
                          onChange={(e) => setOpt(i, j, e.target.value)}
                          placeholder={`Option ${j + 1}`}
                          className="border rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500"
                        />
                      ))}
                    </div>
                    <div className="mt-3">
                      <label className="text-xs font-semibold text-slate-500">
                        Correct Option
                      </label>
                      <select
                        value={q.answerIndex}
                        onChange={(e) =>
                          setQ(i, { answerIndex: Number(e.target.value) })
                        }
                        className="ml-2 border rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        {[0, 1, 2, 3].map((v) => (
                          <option key={v} value={v}>
                            {v + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={addQ}
                  className="px-4 py-2 rounded-xl border inline-flex items-center gap-2 font-medium hover:bg-slate-100 transition"
                >
                  <Plus size={16} /> Add Question
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-2 rounded-xl border bg-white hover:bg-slate-100 font-medium"
                  >
                    Back
                  </button>
                  <button
                    onClick={assignNow}
                    disabled={tmplBusy}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {tmplBusy ? "Assigning…" : "Assign"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Assigned list */}
          <div className="space-y-3">
            <div className="font-semibold text-slate-800">Assigned Tests</div>
            {assignments.length === 0 ? (
              <div className="text-sm text-slate-500 italic">
                No assignments yet.
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((t) => (
                  <div
                    key={t._id}
                    className="flex items-center justify-between rounded-2xl border bg-white/80 p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl border bg-slate-50 grid place-items-center">
                        <ListChecks size={16} />
                      </div>
                      <div>
                        <div className="font-medium text-sm text-slate-800">
                          {t.title}
                          {t.source === "recruiter" && (
                            <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                              Template
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                          <span className="capitalize">{t.type}</span>
                          <span>• {t.durationMins}m</span>
                          {t.startAt && (
                            <>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1">
                                <Clock size={12} /> {new Date(t.startAt).toLocaleString()}
                              </span>
                            </>
                          )}
                          {(t.endAt || t.dueAt) && (
                            <span>→ {new Date(t.endAt || t.dueAt).toLocaleString()}</span>
                          )}
                          {t.token && (
                            <span className="text-slate-400">• Token: {String(t.token).slice(0, 6)}…</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {t.source === "recruiter" && t.templateId && (
                        <button
                          onClick={() => loadTemplateToEditor(t)}
                          className="px-2.5 py-1.5 rounded-xl border bg-white hover:bg-slate-50 text-xs inline-flex items-center gap-1"
                        >
                          <Edit3 size={14} /> Edit
                        </button>
                      )}
                      <button
                        onClick={() => deleteAssignment(t._id)}
                        className="text-rose-600 hover:text-rose-700"
                        disabled={busy}
                        title="Delete assignment"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
