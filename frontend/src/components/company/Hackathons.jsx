// src/components/company/Hackathons.jsx
import { useState } from "react";

const Card = ({ className = "", children }) => (
  <div className={`bg-white/80 backdrop-blur rounded-2xl border border-slate-200/60 shadow-sm ${className}`}>{children}</div>
);

export default function HackathonsTab({ skills, hackathons, createHackathon, setHackStatus, publishLeaderboard }) {
  const onCreate = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const payload = {
      title: f.get("title"),
      prize: f.get("prize"),
      brief: f.get("brief"),
      rules: f.get("rules"),
      resources: f.get("resources"),
      skills: f.getAll("skills"),
      startAt: f.get("startAt"),
      endAt: f.get("endAt"),
      visibility: f.get("visibility") || "public",
      bannerUrl: f.get("bannerUrl"),
    };
    await createHackathon(payload);
    e.currentTarget.reset();
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Live Hackathons & Talent Challenges</h3>

      <form onSubmit={onCreate} className="grid md:grid-cols-2 gap-4 mb-6">
        <input name="title" required placeholder="Hackathon Title" className="border rounded-xl px-3 py-2 bg-white/70" />
        <input name="prize" placeholder="Prize / Awards" className="border rounded-xl px-3 py-2 bg-white/70" />
        <textarea name="brief" placeholder="Brief / Problem Statement" className="md:col-span-2 border rounded-xl px-3 py-2 bg-white/70" />
        <textarea name="rules" placeholder="Rules / Evaluation Criteria" className="md:col-span-2 border rounded-xl px-3 py-2 bg-white/70" />
        <textarea name="resources" placeholder="Resources / Datasets / Links" className="md:col-span-2 border rounded-xl px-3 py-2 bg-white/70" />
        <div className="md:col-span-2">
          <p className="text-xs text-gray-500 mb-1">Target skills</p>
          <div className="flex flex-wrap gap-2">
            {skills.map((sk) => (
              <label key={sk._id} className="text-sm flex items-center gap-2">
                <input type="checkbox" name="skills" value={sk._id} />
                {sk.name}
              </label>
            ))}
          </div>
        </div>
        <input type="datetime-local" name="startAt" className="border rounded-xl px-3 py-2 bg-white/70" />
        <input type="datetime-local" name="endAt" className="border rounded-xl px-3 py-2 bg-white/70" />
        <select name="visibility" className="border rounded-xl px-3 py-2 bg-white/70">
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
        <input name="bannerUrl" placeholder="Banner image URL (optional)" className="border rounded-xl px-3 py-2 bg-white/70" />
        <button className="md:justify-self-start inline-flex items-center rounded-xl px-4 py-2 bg-blue-600 text-white hover:bg-blue-700">Create</button>
      </form>

      {hackathons.length === 0 ? (
        <p className="text-sm text-gray-500">No hackathons yet.</p>
      ) : (
        <ul className="space-y-5">
          {hackathons.map((h) => (
            <li key={h._id} className="border rounded-2xl p-5 bg-white/70 hover:shadow-sm transition">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-3">
                  {h.bannerUrl ? (
                    <img src={h.bannerUrl} alt="" className="h-16 w-24 object-cover rounded-xl border border-slate-200" />
                  ) : (
                    <div className="h-16 w-24 rounded-xl bg-gray-100 border" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-semibold">{h.title}</div>
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-slate-50">{h.status}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {new Date(h.startAt).toLocaleString()} → {new Date(h.endAt).toLocaleString()} • {h.visibility}
                    </div>
                    {h.prize && <div className="text-xs mt-1">Prize: <b>{h.prize}</b></div>}
                    <div className="text-xs mt-1 text-gray-600">
                      {(h.skills || []).map((s) => (typeof s === "string" ? s : s.name)).join(", ")}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <select
                    value={h.status}
                    onChange={(e) => setHackStatus(h._id, e.target.value)}
                    className="px-3 py-1.5 rounded-xl border bg-white"
                  >
                    <option value="draft">draft</option>
                    <option value="open">open</option>
                    <option value="judging">judging</option>
                    <option value="closed">closed</option>
                  </select>
                  <button
                    onClick={async () => {
                      const shareUrl = `${window.location.origin}/student/hackathons/${h._id}`;
                      try { await navigator.clipboard.writeText(shareUrl); alert("Share link copied!"); }
                      catch { window.prompt("Copy link", shareUrl); }
                    }}
                    className="px-3 py-1.5 rounded-xl border bg-white"
                    title="Copy public link"
                  >
                    Share
                  </button>
                  <button onClick={() => publishLeaderboard(h._id)} className="px-3 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
                    Publish Leaderboard
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <Card className="p-4">
                  <div className="font-medium mb-2">Registrations</div>
                  <p className="text-sm text-gray-600">Registration list rendering can go here (optional API endpoint).</p>
                </Card>

                <Card className="p-4">
                  <div className="font-medium mb-2">Submissions & Judging</div>
                  <p className="text-sm text-gray-600">Submissions table + scores/judges (optional API endpoint).</p>
                </Card>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
