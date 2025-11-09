import { useEffect, useState } from "react";
import API from "../api/axios";

export default function SkillPicker({ onChange, compact = false, valueId = "" }) {
  const [skills, setSkills] = useState([]);
  const [saving, setSaving] = useState(false);
  const [current, setCurrent] = useState(valueId || "");

  useEffect(() => {
    (async () => {
      try {
        const s = await API.get("/admin/skills");
        setSkills(Array.isArray(s.data) ? s.data : []);
      } catch {}
    })();
  }, []);

  useEffect(() => { if (valueId) setCurrent(valueId); }, [valueId]);

  const save = async (id) => {
    setSaving(true);
    try {
      const skill = skills.find((x) => x._id === id);
      setCurrent(id);
      onChange && onChange(skill || null);
    } finally {
      setSaving(false);
    }
  };

  if (compact) {
    return (
      <select
        value={current}
        onChange={(e) => save(e.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        disabled={saving}
      >
        <option value="">Choose skill</option>
        {skills.map((s) => (
          <option key={s._id} value={s._id}>
            {s.name}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((s) => {
        const active = current === s._id;
        return (
          <button
            key={s._id}
            onClick={() => save(s._id)}
            disabled={saving}
            className={
              "px-3 py-1.5 rounded-xl border text-sm " +
              (active
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50")
            }
          >
            {s.name}
          </button>
        );
      })}
    </div>
  );
}
