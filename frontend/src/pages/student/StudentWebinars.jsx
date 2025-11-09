import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api/axios";

export default function StudentWebinars() {
  const [loading, setLoading] = useState(true);
  const [webinars, setWebinars] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await API.get("/student/webinars");
        setWebinars(res.data || []);
      } catch (e) {
        console.error("Fetch webinars failed:", e?.response?.data || e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse h-8 w-48 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-16 bg-gray-100 rounded" />
          <div className="h-16 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Live & Upcoming Webinars</h1>
      </div>

      {webinars.length === 0 ? (
        <p className="text-sm text-gray-500">No webinars available right now.</p>
      ) : (
        <ul className="space-y-3">
          {webinars.map((w) => (
            <li key={w.roomId} className="border rounded-lg p-4 flex items-center justify-between bg-white">
              <div>
                <p className="font-medium">{w.title}</p>
                <p className="text-xs text-gray-500">
                  {w.startsAt ? new Date(w.startsAt).toLocaleString() : "No start time"} • {w.durationMins || 60} mins
                </p>
              </div>
              {/* Relative to /student route so it stays inside the student layout */}
              <Link to={`webinar/${w.roomId}`} className="text-blue-600 text-sm underline">
                Join
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
