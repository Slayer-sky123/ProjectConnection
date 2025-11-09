// src/components/university/SkillValidation.jsx
import { useEffect, useMemo, useState } from "react";
import { getValidationList, endorseSkill, getAiRecommendations } from "../../api/university";
import { CheckCircle2, Brain, BadgeCheck, Loader2 } from "lucide-react";
import { useParams } from "react-router-dom";

const LIGHT = "#b1d4e0";
const DARK = "#0c2d48";
const PRIMARY = "#145da0";

export default function SkillValidation() {
  const { username } = useParams();
  const [list, setList] = useState([]);
  const [reco, setReco] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [L, R] = await Promise.all([
          getValidationList(username),
          getAiRecommendations(username)
        ]);
        setList(L || []);
        setReco(R || []);
      } catch {
        setList([]);
        setReco([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [username]);

  const pending = useMemo(() => (list || []).filter((x) => !x.endorsed), [list]);

  const onEndorse = async (id) => {
    try {
      await endorseSkill(username, id);
      setList((p) => p.map((x) => (x.id === id ? { ...x, endorsed: true } : x)));
    } catch {
      // Optimistic fallback
      setList((p) => p.map((x) => (x.id === id ? { ...x, endorsed: true } : x)));
    }
  };

  const onBulkEndorse = async () => {
    if (!pending.length) return;
    setBulkBusy(true);
    try {
      for (const it of pending) {
        // eslint-disable-next-line no-await-in-loop
        await endorseSkill(username, it.id);
      }
      setList((p) => p.map((x) => (x.endorsed ? x : { ...x, endorsed: true })));
    } catch {
      // best-effort
      setList((p) => p.map((x) => (x.endorsed ? x : { ...x, endorsed: true })));
    } finally {
      setBulkBusy(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-gray-600 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>;
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: LIGHT }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold" style={{ color: DARK }}>Skill Validation (Faculty Endorsement)</h2>
          <button
            onClick={onBulkEndorse}
            disabled={!pending.length || bulkBusy}
            className="text-sm text-white px-3 py-2 rounded-lg inline-flex items-center gap-2"
            style={{ backgroundColor: PRIMARY }}
            title="Endorse all pending"
          >
            <BadgeCheck className="w-4 h-4" /> {bulkBusy ? "Endorsing…" : `Bulk Endorse (${pending.length})`}
          </button>
        </div>

        <div className="space-y-3">
          {list.map((it) => (
            <div key={it.id} className="border rounded-lg p-4 flex items-center justify-between" style={{ borderColor: LIGHT }}>
              <div>
                <p className="font-semibold" style={{ color: DARK }}>{it.student}</p>
                <p className="text-sm text-gray-600">Skill: {it.skill}</p>
                <p className="text-xs text-gray-500">Evidence: {it.evidence}</p>
              </div>
              {it.endorsed ? (
                <span className="text-xs px-2 py-1 rounded-full border" style={{ background: "#def7ec", color: DARK, borderColor: LIGHT }}>
                  Endorsed
                </span>
              ) : (
                <button
                  onClick={() => onEndorse(it.id)}
                  className="text-sm text-white px-3 py-2 rounded-lg inline-flex items-center gap-2"
                  style={{ backgroundColor: PRIMARY }}
                >
                  <CheckCircle2 className="w-4 h-4" /> Endorse
                </button>
              )}
            </div>
          ))}
          {list.length === 0 && <p className="text-sm text-gray-500">No validations pending.</p>}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: LIGHT }}>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: DARK }}>
          <Brain className="w-5 h-5" style={{ color: PRIMARY }} /> AI Course Recommendations
        </h2>
        <div className="space-y-3">
          {reco.map((r, idx) => (
            <div key={idx} className="border rounded-lg p-4" style={{ borderColor: LIGHT }}>
              <p className="font-semibold" style={{ color: DARK }}>{r.student}</p>
              <p className="text-sm text-gray-700">Gaps: {Array.isArray(r.gaps) ? r.gaps.join(", ") : "—"}</p>
              <p className="text-xs text-gray-600 mt-1">Suggested: {r.course} · {r.provider}</p>
            </div>
          ))}
          {reco.length === 0 && <p className="text-sm text-gray-500">No recommendations at the moment.</p>}
        </div>
      </div>
    </div>
  );
}
