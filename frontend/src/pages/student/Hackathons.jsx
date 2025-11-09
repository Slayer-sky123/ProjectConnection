import { useEffect, useState } from "react";
import API from "../../api/axios";
import { Link } from "react-router-dom";
import { Trophy, MapPin, Calendar, Building2, ChevronRight } from "lucide-react";

export default function Hackathons() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get("/student/hackathons");
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Trophy /> Hackathons
        </h1>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1,2,3,4].map((i)=>(
            <div key={i} className="rounded-2xl border bg-white/70 p-5 animate-pulse">
              <div className="flex gap-3">
                <div className="h-16 w-24 rounded-lg bg-slate-200" />
                <div className="flex-1">
                  <div className="h-4 w-40 rounded bg-slate-200" />
                  <div className="mt-2 h-3 w-56 rounded bg-slate-200" />
                  <div className="mt-2 h-3 w-32 rounded bg-slate-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border bg-white/70 p-10 text-center text-sm text-gray-600">
          No hackathons yet. Check back soon!
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {rows.map((h) => (
            <Link
              key={h._id}
              to={`/student/hackathons/${h._id}`}
              className="group bg-white/80 backdrop-blur rounded-2xl border p-4 hover:shadow-sm transition"
            >
              <div className="flex gap-3">
                {h.bannerUrl ? (
                  <img src={h.bannerUrl} alt="" className="h-16 w-24 object-cover rounded-lg border" />
                ) : (
                  <div className="h-16 w-24 rounded-lg bg-gray-100 border grid place-items-center text-gray-400">
                    <Trophy size={18} />
                  </div>
                )}

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{h.title}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Calendar size={14} />
                        {new Date(h.startAt).toLocaleString()} → {new Date(h.endAt).toLocaleString()}
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full border bg-blue-50 text-blue-700">
                      {h.status || "upcoming"}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-gray-600 flex items-center gap-2">
                    {(h.skills || []).slice(0, 4).map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-full bg-gray-50 ring-1 ring-gray-200">
                        {typeof s === "string" ? s : s.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                <span className="inline-flex items-center gap-1">
                  <MapPin size={14} />
                  {h.location || "Online"}
                </span>
                <span className="inline-flex items-center gap-1 text-blue-600">
                  View details <ChevronRight size={16} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
