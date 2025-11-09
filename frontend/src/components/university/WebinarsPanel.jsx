// src/components/university/WebinarsPanel.jsx
import { useEffect, useState } from "react";
import { getWebinars, createWebinar } from "../../api/university";
import { CalendarDays, Plus } from "lucide-react";
import { useParams } from "react-router-dom";

const LIGHT = "#b1d4e0";
const DARK = "#0c2d48";
const PRIMARY = "#145da0";

export default function WebinarsPanel() {
  const { username } = useParams();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: "", speaker: "", date: "", mode: "Live" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try { setItems(await getWebinars(username)); }
      catch { setItems([]); }
    })();
  }, [username]);

  const onCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const saved = await createWebinar(username, form);
      setItems((p) => [saved, ...p]);
      setForm({ title: "", speaker: "", date: "", mode: "Live" });
    } catch {
      // noop
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: LIGHT }}>
      <h2 className="text-lg font-bold mb-3" style={{ color: DARK }}>Live Webinars & Guest Lectures</h2>

      <form onSubmit={onCreate} className="grid md:grid-cols-5 gap-3 bg-[#b1d4e01a] rounded-lg p-3 mb-5">
        <input
          className="border rounded-lg px-3 py-2"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          style={{ borderColor: LIGHT }}
        />
        <input
          className="border rounded-lg px-3 py-2"
          placeholder="Speaker / Org"
          value={form.speaker}
          onChange={(e) => setForm({ ...form, speaker: e.target.value })}
          style={{ borderColor: LIGHT }}
        />
        <input
          className="border rounded-lg px-3 py-2"
          type="datetime-local"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          style={{ borderColor: LIGHT }}
        />
        <select
          className="border rounded-lg px-3 py-2"
          value={form.mode}
          onChange={(e) => setForm({ ...form, mode: e.target.value })}
          style={{ borderColor: LIGHT }}
        >
          <option>Live</option>
          <option>Recorded</option>
        </select>
        <button
          className="inline-flex items-center justify-center gap-2 text-white rounded-lg px-3 py-2 hover:opacity-95"
          style={{ backgroundColor: PRIMARY }}
          disabled={saving}
          aria-busy={saving}
        >
          <Plus className="w-4 h-4" /> {saving ? "Adding…" : "Add Session"}
        </button>
      </form>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((w) => (
          <div key={w.id} className="border rounded-xl p-4 hover:shadow-sm" style={{ borderColor: LIGHT }}>
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold" style={{ color: DARK }}>{w.title}</h4>
                <p className="text-sm text-gray-600">{w.speaker}</p>
              </div>
              <span
                className="text-xs px-2 py-1 rounded-full border"
                style={{ background: "#b1d4e033", color: DARK, borderColor: LIGHT }}
                aria-label={`Mode ${w.mode}`}
              >
                {w.mode}
              </span>
            </div>
            <div className="mt-3 text-sm text-gray-700 flex items-center gap-2">
              <CalendarDays className="w-4 h-4" style={{ color: PRIMARY }} />
              {new Date(w.date).toLocaleString()}
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-500">No sessions yet.</p>}
      </div>
    </div>
  );
}
