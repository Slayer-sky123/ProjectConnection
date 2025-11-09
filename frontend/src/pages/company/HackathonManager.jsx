import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../../api/axios";
import { ArrowLeft, Megaphone, Scale, Users2, Trophy, Save, Check } from "lucide-react";

const Field = (p) => <input {...p} className={"border rounded-lg px-3 py-2 " + (p.className||"")} />;

export default function HackathonManager() {
  const { id } = useParams();
  const [h, setH] = useState(null);
  const [subs, setSubs] = useState([]);
  const [announceMsg, setAnnounceMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [d, s] = await Promise.all([
      API.get(`/company/hackathons/${id}`)  // we'll reuse /company/hackathons/:id via PUT route (GET fallback below)
        .catch(async () => ({ data: (await API.get("/company/hackathons")).data.find(x=>x._id===id) })),
      API.get(`/company/hackathons/${id}/submissions`)
    ]);
    setH(d.data);
    setSubs(s.data || []);
  };

  useEffect(()=>{ load(); }, [id]);

  if (!h) return <div className="p-6">Loading…</div>;

  const update = async (patch) => {
    setSaving(true);
    try {
      const res = await API.put(`/company/hackathons/${id}`, patch);
      setH(res.data);
    } catch (e) {
      alert(e?.response?.data?.message || "Save failed");
    } finally { setSaving(false); }
  };

  const announce = async () => {
    if (!announceMsg.trim()) return;
    await API.post(`/company/hackathons/${id}/announce`, { message: announceMsg });
    setAnnounceMsg("");
    load();
  };

  const score = async (subId, rubricKey, val) => {
    const sub = subs.find(s => s._id === subId);
    const items = (h.rubric || []).map(r => {
      if (r.key === rubricKey) return { rubricKey: r.key, score: Number(val) };
      const me = (sub.judgeScores||[]).find(js => js.judge === "me"); // UI only; backend derives judge from token
      const prev = me?.items?.find(i => i.rubricKey === r.key)?.score || 0;
      return { rubricKey: r.key, score: prev };
    });
    const res = await API.post(`/company/hackathons/${id}/submissions/${subId}/score`, { items });
    setSubs(s => s.map(x => x._id === subId ? res.data : x));
  };

  const finalize = async () => {
    if (!window.confirm("Finalize results? This will set ranks and mark finished.")) return;
    await API.post(`/company/hackathons/${id}/finalize`);
    load();
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/company" className="inline-flex items-center gap-2 text-sm text-gray-600">
          <ArrowLeft size={16}/> Back
        </Link>
        <div className="text-xs px-2 py-1 rounded-full border">{h.phase}</div>
      </div>

      <div className="bg-white border rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{h.title}</h1>
            <p className="text-sm text-gray-500">{new Date(h.startAt).toLocaleString()} → {new Date(h.endAt).toLocaleString()}</p>
          </div>
          <button onClick={finalize} className="px-3 py-2 rounded-lg bg-emerald-600 text-white flex items-center gap-2">
            <Trophy size={16}/> Finalize
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div>
            <h3 className="font-medium mb-2">Settings</h3>
            <div className="space-y-2">
              <Field defaultValue={h.prize} placeholder="Prize"
                onBlur={(e)=>update({ prize: e.target.value })}/>
              <Field defaultValue={h.bannerUrl} placeholder="Banner URL"
                onBlur={(e)=>update({ bannerUrl: e.target.value })}/>
              <select defaultValue={h.phase} onChange={(e)=>update({ phase: e.target.value })} className="border rounded-lg px-3 py-2 w-full">
                {["draft","upcoming","open","judging","finished"].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            {saving && <div className="text-xs text-gray-400 mt-2 flex items-center gap-1"><Save size={14}/> Saving…</div>}
          </div>

          <div>
            <h3 className="font-medium mb-2 flex items-center gap-2"><Megaphone size={16}/> Announcements</h3>
            <div className="flex gap-2">
              <Field value={announceMsg} onChange={(e)=>setAnnounceMsg(e.target.value)} placeholder="Share schedule changes, links, etc." className="flex-1"/>
              <button onClick={announce} className="px-3 py-2 rounded-lg border">Post</button>
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              {(h.announcements||[]).slice().reverse().map((a,i)=>(
                <li key={i} className="border rounded-lg p-2">{a.message} <span className="text-gray-400 text-xs">• {new Date(a.createdAt).toLocaleString()}</span></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="font-medium mb-2 flex items-center gap-2"><Scale size={16}/> Rubric</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {(h.rubric||[]).map((r,i)=>(
              <div key={i} className="border rounded-lg p-3 text-sm flex items-center justify-between">
                <div>{r.label}</div>
                <div className="text-gray-500">/ {r.max}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <h3 className="font-medium mb-3 flex items-center gap-2"><Users2 size={16}/> Submissions</h3>
          {subs.length === 0 ? (
            <p className="text-sm text-gray-500">No submissions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left">Team</th>
                    <th className="p-2">Title</th>
                    <th className="p-2">Repo</th>
                    <th className="p-2">Demo</th>
                    <th className="p-2">Final</th>
                    {(h.rubric||[]).map(r => <th key={r.key} className="p-2">{r.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {subs.map(s => (
                    <tr key={s._id} className="border-b">
                      <td className="p-2">{s.team?.name}</td>
                      <td className="p-2 text-center">{s.title}</td>
                      <td className="p-2 text-center">{s.repoUrl ? <a className="text-blue-600 underline" href={s.repoUrl} target="_blank" rel="noreferrer">Repo</a> : "-"}</td>
                      <td className="p-2 text-center">{s.demoUrl ? <a className="text-indigo-600 underline" href={s.demoUrl} target="_blank" rel="noreferrer">Demo</a> : "-"}</td>
                      <td className="p-2 text-center font-semibold">{s.finalScore ?? "-"}</td>
                      {(h.rubric||[]).map(r => {
                        const max = r.max || 10;
                        return (
                          <td key={r.key} className="p-2">
                            <input type="number" min="0" max={max}
                              onBlur={(e)=>score(s._id, r.key, e.target.value)}
                              className="w-20 border rounded px-2 py-1" placeholder={`0-${max}`}/>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
