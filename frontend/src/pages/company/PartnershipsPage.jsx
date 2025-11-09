import { Building2 } from "lucide-react";

const Card = ({ className = "", children }) => (
  <div className={`bg-white/80 backdrop-blur rounded-2xl border border-slate-200/60 shadow-sm ${className}`}>{children}</div>
);

export default function PartnershipsPage({ partnerships, createPartnership, primary = "#1A55E3" }) {
  const onCreate = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await createPartnership({
      university: f.get("university"),
      title: f.get("title"),
      details: f.get("details"),
      status: f.get("status"),
    });
    e.currentTarget.reset();
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">University Partnerships & Research</h3>

      <form onSubmit={onCreate} className="grid md:grid-cols-2 gap-4 mb-6">
        <input name="university" required placeholder="University name" className="border rounded-xl px-3 py-2 bg-white/70" />
        <select name="status" className="border rounded-xl px-3 py-2 bg-white/70">
          <option value="proposal">Proposal</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
        <input name="title" required placeholder="Initiative title" className="border rounded-xl px-3 py-2 bg-white/70 md:col-span-2" />
        <textarea name="details" placeholder="Details" className="border rounded-xl px-3 py-2 bg-white/70 md:col-span-2" />
        <button
          className="md:justify-self-start inline-flex items-center rounded-xl px-4 py-2 text-white hover:opacity-95"
          style={{ background: primary }}
        >
          Save
        </button>
      </form>

      {partnerships.length === 0 ? (
        <p className="text-sm text-gray-500">No collaborations yet.</p>
      ) : (
        <ul className="space-y-3">
          {partnerships.map((p) => (
            <li key={p._id} className="border rounded-xl p-3 bg-white/70">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-xs text-gray-500">{p.university} • {p.status}</p>
                  <p className="text-xs mt-1">{p.details}</p>
                </div>
                <Building2 className="text-gray-400" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
