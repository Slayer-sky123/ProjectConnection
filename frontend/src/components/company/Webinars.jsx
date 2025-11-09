// src/components/company/Webinars.jsx
import { Video } from "lucide-react";
import { Link } from "react-router-dom";

const Card = ({ className = "", children }) => (
  <div className={`bg-white/80 backdrop-blur rounded-2xl border border-slate-200/60 shadow-sm ${className}`}>{children}</div>
);

export default function WebinarsTab({ webinars, createWebinar }) {
  const onCreate = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const payload = {
      title: (f.get("title") || "").trim(),
      speaker: (f.get("speaker") || "").trim(),
      description: (f.get("description") || "").trim(),
      startsAt: f.get("startsAt") || null,
      durationMins: Number(f.get("durationMins") || 60),
      visibility: "public",
    };
    await createWebinar(payload);
    e.currentTarget.reset();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Video className="text-blue-600" />
        <h3 className="text-lg font-semibold">Employer Branding & Webinars</h3>
      </div>

      <form onSubmit={onCreate} className="grid md:grid-cols-2 gap-4 mb-6">
        <input name="title" required placeholder="Title" className="border rounded-xl px-3 py-2 bg-white/70" />
        <input name="speaker" placeholder="Speaker" className="border rounded-xl px-3 py-2 bg-white/70" />
        <input type="datetime-local" name="startsAt" className="border rounded-xl px-3 py-2 bg-white/70" />
        <input type="number" name="durationMins" placeholder="Duration (mins)" className="border rounded-xl px-3 py-2 bg-white/70" />
        <textarea name="description" placeholder="Description" className="md:col-span-2 border rounded-xl px-3 py-2 bg-white/70" />
        <button className="md:justify-self-start inline-flex items-center rounded-xl px-4 py-2 bg-blue-600 text-white hover:bg-blue-700">
          Schedule
        </button>
      </form>

      {webinars.length === 0 ? (
        <p className="text-sm text-gray-500">No webinars yet.</p>
      ) : (
        <ul className="space-y-3">
          {webinars.map((w) => (
            <li key={w._id} className="border rounded-xl p-3 bg-white/70">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{w.title}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(w.startsAt).toLocaleString()} • {w.durationMins} mins
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link to={`/student/webinars/webinar/${w.roomId}`} className="text-blue-700 text-sm underline">
                    Join (Viewer)
                  </Link>
                  <Link to={`/company/webinar/${w.roomId}`} className="text-indigo-700 text-sm underline">
                    Open Studio
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
