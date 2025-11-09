import { Globe2, Mail, Phone, MapPin, BarChart3, Settings } from "lucide-react";

const Card = ({ className = "", children }) => (
  <div className={`bg-white/80 backdrop-blur rounded-2xl border border-slate-200/60 shadow-sm ${className}`}>{children}</div>
);

export default function ProfilePage({ profile, onSave, primary = "#1A55E3" }) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Settings style={{ color: primary }} />
          <h3 className="text-lg font-semibold text-gray-800">Company Profile</h3>
        </div>

        <form onSubmit={onSave} className="grid md:grid-cols-2 gap-4">
          <input name="name" required placeholder="Company Name" defaultValue={profile?.name || ""} className="border rounded-xl px-3 py-2 bg-white/70" />
          <input name="website" placeholder="Website" defaultValue={profile?.website || ""} className="border rounded-xl px-3 py-2 bg-white/70" />
          <input name="logoUrl" placeholder="Logo URL" defaultValue={profile?.logoUrl || ""} className="border rounded-xl px-3 py-2 bg-white/70" />
          <select name="size" defaultValue={profile?.size || "1-10"} className="border rounded-xl px-3 py-2 bg-white/70">
            {["1-10","11-50","51-200","201-500","500+"].map(s => <option key={s} value={s}>{s} employees</option>)}
          </select>
          <input name="contactEmail" placeholder="Contact Email" defaultValue={profile?.contactEmail || ""} className="border rounded-xl px-3 py-2 bg-white/70" />
          <input name="contactPhone" placeholder="Contact Phone" defaultValue={profile?.contactPhone || ""} className="border rounded-xl px-3 py-2 bg-white/70" />
          <input name="locations" placeholder="Locations (comma separated)" defaultValue={profile?.locations?.join(", ") || ""} className="border rounded-xl px-3 py-2 bg-white/70 md:col-span-2" />
          <input name="domains" placeholder="Domains/Industry (comma separated)" defaultValue={profile?.domains?.join(", ") || ""} className="border rounded-xl px-3 py-2 bg-white/70 md:col-span-2" />
          <textarea name="description" placeholder="About company" defaultValue={profile?.description || ""} className="border rounded-xl px-3 py-2 bg-white/70 md:col-span-2" />
          <button
            className="md:justify-self-start inline-flex items-center rounded-xl px-4 py-2 text-white hover:opacity-95"
            style={{ background: primary }}
          >
            {profile?._id ? "Update Profile" : "Create Profile"}
          </button>
        </form>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            {profile?.logoUrl ? <img src={profile.logoUrl} alt="logo" className="h-10 w-10 rounded-xl object-cover border border-slate-200" /> : <div className="h-10 w-10 rounded-xl bg-gray-200" />}
            <div>
              <div className="font-semibold">{profile?.name || "-"}</div>
              <div className="text-xs text-gray-500">{profile?.website || "-"}</div>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-3">{profile?.description || "—"}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
            {(profile?.domains || []).map((d,i) => (
              <span key={i} className="px-2.5 py-1 rounded-full border bg-indigo-50 text-indigo-800 border-indigo-200">{d}</span>
            ))}
          </div>
        </Card>

        <Card className="p-5 text-sm text-gray-600">
          <div className="flex items-center gap-2"><Globe2 size={14} /> {profile?.website || "—"}</div>
          <div className="flex items-center gap-2 mt-2"><Mail size={14} /> {profile?.contactEmail || "—"}</div>
          <div className="flex items-center gap-2 mt-2"><Phone size={14} /> {profile?.contactPhone || "—"}</div>
          <div className="flex items-center gap-2 mt-2"><MapPin size={14} /> {(profile?.locations || []).join(", ") || "—"}</div>
          <div className="flex items-center gap-2 mt-2"><BarChart3 size={14} /> Size: {profile?.size || "—"}</div>
        </Card>
      </div>
    </div>
  );
}
