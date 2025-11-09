import { useEffect, useMemo, useState } from "react";
import API from "../../api/axios";
import { useParams } from "react-router-dom";
import { Calendar, Clock, Users, Link as LinkIcon, FileDown, Gift, ChevronRight } from "lucide-react";

const toAbs = (url) => {
  if (!url) return null;
  const origin = (API.defaults.baseURL && new URL(API.defaults.baseURL).origin) || window.location.origin;
  return url.startsWith("http") ? url : `${origin}${url.startsWith("/") ? url : `/${url}`}`;
};

export default function HackathonDetail() {
  const { id } = useParams();
  const [hack, setHack] = useState(null);
  const [reg, setReg] = useState(null);
  const [mySub, setMySub] = useState(null);
  const [leader, setLeader] = useState([]);
  const [busy, setBusy] = useState(false);

  // modals
  const [showRegister, setShowRegister] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [showUnreg, setShowUnreg] = useState(false);

  const loadAll = async () => {
    const [h, r, s, l] = await Promise.allSettled([
      API.get(`/student/hackathons/${id}`),
      API.get(`/student/hackathons/${id}/registration`),
      API.get(`/student/hackathons/${id}/my-submission`),
      API.get(`/student/hackathons/${id}/leaderboard`),
    ]);
    setHack(h.value?.data || null);
    setReg(r.value?.data || null);
    setMySub(s.value?.data || null);
    setLeader(l.value?.data || []);
  };

  useEffect(()=>{ loadAll(); }, [id]);

  const now = new Date();
  const started = hack ? now >= new Date(hack.startAt) : false;
  const ended = hack ? now > new Date(hack.endAt) : false;

  const countdown = useMemo(() => {
    if (!hack) return "";
    const target = started && !ended ? new Date(hack.endAt) : new Date(hack.startAt);
    let diff = +target - +now;
    if (diff <= 0) return "0d 0h 0m";
    const d = Math.floor(diff / (1000*60*60*24));
    const h = Math.floor((diff / (1000*60*60)) % 24);
    const m = Math.floor((diff / (1000*60)) % 60);
    return `${d}d ${h}h ${m}m`;
  }, [hack]);

  const doRegister = async () => {
    setBusy(true);
    try {
      await API.post(`/student/hackathons/${id}/register`, { teamName: teamName.trim() });
      setShowRegister(false);
      setTeamName("");
      await loadAll();
    } finally {
      setBusy(false);
    }
  };

  const doUnregister = async () => {
    setBusy(true);
    try {
      await API.delete(`/student/hackathons/${id}/register`);
      setShowUnreg(false);
      await loadAll();
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      await API.post(`/student/hackathons/${id}/submit`, f, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      e.currentTarget.reset();
      await loadAll();
      alert("Submitted!");
    } catch (e2) {
      alert(e2?.response?.data?.message || "Submit failed");
    } finally {
      setBusy(false);
    }
  };

  if (!hack) return <div className="max-w-6xl mx-auto p-6">Loading…</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Hero */}
      <div className="bg-white/80 backdrop-blur rounded-2xl border p-5">
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          {hack.bannerUrl ? (
            <img src={hack.bannerUrl} alt="" className="h-28 w-full md:w-44 object-cover rounded-xl border" />
          ) : null}

          <div className="flex-1">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl font-semibold">{hack.title}</h1>
              <span className="text-xs px-2 py-1 rounded-full border bg-blue-50 text-blue-700">{hack.status}</span>
            </div>

            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-700">
              <div className="inline-flex items-center gap-2">
                <Calendar size={16} /> {new Date(hack.startAt).toLocaleString()} → {new Date(hack.endAt).toLocaleString()}
              </div>
              <div className="inline-flex items-center gap-2">
                <Clock size={16} /> {started ? (ended ? "Ended" : "Ends in") : "Starts in"} {countdown}
              </div>
              {hack.prize ? (
                <div className="inline-flex items-center gap-2">
                  <Gift size={16} /> Prize: <b>{hack.prize}</b>
                </div>
              ) : null}
            </div>

            {(hack.skills||[]).length ? (
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {(hack.skills||[]).map((s, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full bg-gray-50 ring-1 ring-gray-200">
                    {typeof s === "string" ? s : s.name}
                  </span>
                ))}
              </div>
            ) : null}

            <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap">{hack.brief}</p>

            <div className="mt-4 flex gap-2">
              {reg ? (
                <button onClick={()=>setShowUnreg(true)} disabled={busy} className="px-3 py-2 rounded-lg border">
                  Leave event
                </button>
              ) : (
                <button onClick={()=>setShowRegister(true)} disabled={busy} className="px-3 py-2 rounded-lg bg-blue-600 text-white">
                  Register
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rules & Submission */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white/80 backdrop-blur rounded-2xl border p-5">
          <h3 className="font-semibold mb-2">Rules</h3>
          <div className="text-sm whitespace-pre-wrap">{hack.rules || "—"}</div>

          <h3 className="font-semibold mt-4 mb-2">Resources</h3>
          <div className="text-sm whitespace-pre-wrap">{hack.resources || "—"}</div>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-2xl border p-5">
          <h3 className="font-semibold mb-3">Submit Project</h3>
          {new Date() > new Date(hack.endAt) ? (
            <div className="text-sm text-gray-500">Submission window closed.</div>
          ) : new Date() < new Date(hack.startAt) ? (
            <div className="text-sm text-gray-500">You can submit when the event starts.</div>
          ) : !reg ? (
            <div className="text-sm text-gray-500">Register to submit.</div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <input name="repoUrl" placeholder="Repo URL (optional)" className="w-full border rounded-lg px-3 py-2" />
              <input name="demoUrl" placeholder="Demo URL (optional)" className="w-full border rounded-lg px-3 py-2" />
              <textarea name="notes" placeholder="Notes for judges (optional)" className="w-full border rounded-lg px-3 py-2" />
              <div>
                <label className="text-sm block mb-1">Upload ZIP/PDF (optional)</label>
                <input type="file" name="file" accept=".zip,.pdf" />
              </div>
              <button disabled={busy} className="px-4 py-2 rounded-lg bg-blue-600 text-white">
                {busy ? "Submitting…" : "Submit / Update"}
              </button>
            </form>
          )}

          {mySub && (
            <div className="mt-4 text-sm">
              <div className="font-medium mb-1">Your submission</div>
              <div className="flex items-center gap-2">
                <LinkIcon size={14} /> Repo:&nbsp;
                {mySub.repoUrl ? (
                  <a className="text-blue-600 underline" href={mySub.repoUrl} target="_blank" rel="noreferrer">Open</a>
                ) : "—"}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <LinkIcon size={14} /> Demo:&nbsp;
                {mySub.demoUrl ? (
                  <a className="text-blue-600 underline" href={mySub.demoUrl} target="_blank" rel="noreferrer">Open</a>
                ) : "—"}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <FileDown size={14} /> File:&nbsp;
                {mySub.fileUrl ? (
                  <a className="text-blue-600 underline" href={toAbs(mySub.fileUrl)} target="_blank" rel="noreferrer" download>Download</a>
                ) : "—"}
              </div>
              <div className="mt-2">
                Score: {mySub.score ?? "—"} {mySub.rank ? `• Rank #${mySub.rank}` : ""}
              </div>
              {mySub.feedback ? <div className="mt-1 italic text-gray-700">“{mySub.feedback}”</div> : null}
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white/80 backdrop-blur rounded-2xl border p-5">
        <h3 className="font-semibold mb-3">Leaderboard</h3>
        {leader.length === 0 ? (
          <div className="text-sm text-gray-500">Not published yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2">Rank</th>
                <th className="p-2 text-left">Student</th>
                <th className="p-2">Score</th>
              </tr>
            </thead>
            <tbody>
              {leader.map((l)=>(
                <tr key={l._id} className="border-b">
                  <td className="p-2 text-center">{l.rank}</td>
                  <td className="p-2">{l.student?.name || "—"}</td>
                  <td className="p-2 text-center">{l.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Register modal */}
      {showRegister && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-semibold mb-3">Register for {hack.title}</h3>
            <input
              value={teamName}
              onChange={(e)=>setTeamName(e.target.value)}
              placeholder="Team name (optional)"
              className="w-full border rounded-lg px-3 py-2"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={()=>setShowRegister(false)} className="px-3 py-2 rounded-lg border">Cancel</button>
              <button onClick={doRegister} disabled={busy} className="px-3 py-2 rounded-lg bg-blue-600 text-white">
                {busy ? "Registering…" : "Register"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unregister modal */}
      {showUnreg && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-semibold mb-3">Leave this hackathon?</h3>
            <p className="text-sm text-gray-600">You can re-register before it ends.</p>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={()=>setShowUnreg(false)} className="px-3 py-2 rounded-lg border">Cancel</button>
              <button onClick={doUnregister} disabled={busy} className="px-3 py-2 rounded-lg bg-red-600 text-white">
                {busy ? "Leaving…" : "Leave"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
