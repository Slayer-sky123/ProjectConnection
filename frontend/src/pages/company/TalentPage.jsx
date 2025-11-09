export default function TalentPage({ skills, search, setSearch, results, onRunSearch, primary = "#1A55E3" }) {
  const toggleSkill = (id) => {
    setSearch((s) => {
      const list = s.skillIds || [];
      return list.includes(id)
        ? { ...s, skillIds: list.filter((x) => x !== id) }
        : { ...s, skillIds: [...list, id] };
    });
  };

  return (
    <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200/60 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">AI-Powered Talent Search</h3>
        <div className="flex items-center gap-3">
          <input
            type="number" min={0} max={10} value={search.minScore ?? 6}
            onChange={(e) => setSearch((s) => ({ ...s, minScore: e.target.value }))}
            className="w-24 border rounded-xl px-3 py-1 text-sm bg-white/70"
            placeholder="Min score"
            title="Min average score (0-10)"
          />
          <button
            onClick={onRunSearch}
            className="px-3 py-2 rounded-xl text-white hover:opacity-95"
            style={{ background: primary }}
          >
            Search
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {skills.map((sk) => {
          const active = (search.skillIds || []).includes(sk._id);
          return (
            <button
              key={sk._id}
              onClick={() => toggleSkill(sk._id)}
              className={`px-3 py-1 rounded-full border text-sm ${active ? "text-white" : "bg-white/70 hover:bg-white"}`}
              style={active ? { background: primary, borderColor: primary } : {}}
            >
              {sk.name}
            </button>
          );
        })}
      </div>

      {results?.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm overflow-hidden rounded-2xl border border-slate-200">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="p-3 text-left">Student</th>
                <th className="p-3 text-left">University</th>
                <th className="p-3">Avg Req Skill Score</th>
                <th className="p-3">Fit Score</th>
              </tr>
            </thead>
            <tbody>
              {results.map((t, i) => (
                <tr key={i} className="border-b">
                  <td className="p-3">{t.student?.name} <span className="text-gray-400">({t.student?.email})</span></td>
                  <td className="p-3">{t.student?.university || "-"}</td>
                  <td className="p-3 text-center">{t.avgRequiredSkillScore}</td>
                  <td className="p-3 text-center font-semibold">{t.fitScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-500">Pick skills and run search to see ranked candidates.</p>
      )}
    </div>
  );
}
