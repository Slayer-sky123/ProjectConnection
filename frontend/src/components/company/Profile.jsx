import { Globe2, Mail, Phone, MapPin, BarChart3, Settings } from "lucide-react";

/**
 * Company Profile — Premium Full-Page Layout
 * - No outer container card; full page area under your fixed layout
 * - Left: edit form (2/3 width on large screens)
 * - Right: live profile preview & quick facts (1/3 width)
 * - Keeps ALL logic intact (same input names, same onSave signature)
 */

const SectionTitle = ({ icon: Icon, title, hint }) => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      {Icon && <Icon size={18} className="text-[#1A55E3]" />}
      <h3 className="font-semibold text-slate-900">{title}</h3>
    </div>
    {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
  </div>
);

const Label = ({ children }) => (
  <label className="text-xs font-medium text-slate-600">{children}</label>
);

export default function ProfileTab({ profile, onSave }) {
  return (
    <div className="w-full">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl grid place-items-center"
               style={{ background: "linear-gradient(135deg,#1A55E3,#5E6EED)" }}>
            <Settings size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 leading-tight">Company Profile</h1>
            <p className="text-xs text-slate-500">Manage your brand identity, contacts and presence.</p>
          </div>
        </div>
      </div>

      {/* Content grid: form + preview */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Form (spans 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basics */}
          <section className="rounded-2xl border border-slate-200 bg-white/80 p-5">
            <SectionTitle icon={Settings} title="Basics" />
            <form onSubmit={onSave} className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Company Name *</Label>
                <input
                  name="name"
                  required
                  placeholder="Company Name"
                  defaultValue={profile?.name || ""}
                  className="border rounded-xl px-3 py-2 bg-white/70 border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A55E3]/20"
                />
              </div>
              <div className="space-y-1">
                <Label>Website</Label>
                <input
                  name="website"
                  placeholder="https://example.com"
                  defaultValue={profile?.website || ""}
                  className="border rounded-xl px-3 py-2 bg-white/70 border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A55E3]/20"
                />
              </div>

              <div className="space-y-1">
                <Label>Logo URL</Label>
                <input
                  name="logoUrl"
                  placeholder="https://cdn.yoursite/logo.png"
                  defaultValue={profile?.logoUrl || ""}
                  className="border rounded-xl px-3 py-2 bg-white/70 border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A55E3]/20"
                />
              </div>
              <div className="space-y-1">
                <Label>Company Size</Label>
                <select
                  name="size"
                  defaultValue={profile?.size || "1-10"}
                  className="border rounded-xl px-3 py-2 bg-white/70 border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A55E3]/20"
                >
                  {["1-10","11-50","51-200","201-500","500+"].map(s => (
                    <option key={s} value={s}>{s} employees</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <Label>About Company</Label>
                <textarea
                  name="description"
                  placeholder="Mission, product, achievements…"
                  defaultValue={profile?.description || ""}
                  className="border rounded-2xl px-3 py-2 bg-white/70 border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A55E3]/20 h-28"
                />
              </div>

              <div className="md:col-span-2 pt-2">
                <button
                  className="inline-flex items-center rounded-xl px-5 py-2.5 text-white font-medium"
                  style={{ backgroundColor: "#1A55E3" }}
                  onMouseOver={(e)=>e.currentTarget.style.backgroundColor="#1749c5"}
                  onMouseOut={(e)=>e.currentTarget.style.backgroundColor="#1A55E3"}
                >
                  {profile?._id ? "Update Profile" : "Create Profile"}
                </button>
              </div>

              {/* Divider */}
              <div className="md:col-span-2 h-px bg-slate-200 my-1" />

              {/* Contacts */}
              <div className="md:col-span-2">
                <SectionTitle title="Contacts" />
              </div>
              <div className="space-y-1">
                <Label>Contact Email</Label>
                <input
                  name="contactEmail"
                  placeholder="hello@company.com"
                  defaultValue={profile?.contactEmail || ""}
                  className="border rounded-xl px-3 py-2 bg-white/70 border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A55E3]/20"
                />
              </div>
              <div className="space-y-1">
                <Label>Contact Phone</Label>
                <input
                  name="contactPhone"
                  placeholder="+1 000 000 0000"
                  defaultValue={profile?.contactPhone || ""}
                  className="border rounded-xl px-3 py-2 bg-white/70 border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A55E3]/20"
                />
              </div>

              {/* Divider */}
              <div className="md:col-span-2 h-px bg-slate-200 my-1" />

              {/* Locations & Domains */}
              <div className="md:col-span-2">
                <SectionTitle title="Presence & Focus" hint="comma separated" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Locations</Label>
                <input
                  name="locations"
                  placeholder="New York, Remote, Bangalore"
                  defaultValue={profile?.locations?.join(", ") || ""}
                  className="w-full border rounded-xl px-3 py-2 bg-white/70 border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A55E3]/20"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Domains / Industry</Label>
                <input
                  name="domains"
                  placeholder="Fintech, AI, Cloud"
                  defaultValue={profile?.domains?.join(", ") || ""}
                  className="w-full border rounded-xl px-3 py-2 bg-white/70 border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A55E3]/20"
                />
              </div>
            </form>
          </section>
        </div>

        {/* Right: Preview */}
        <aside className="space-y-6">
          {/* Brand Preview */}
          <section className="rounded-2xl border border-slate-200 bg-white/80 p-5">
            <SectionTitle title="Brand Preview" />
            <div className="flex items-center gap-3">
              {profile?.logoUrl ? (
                <img
                  src={profile.logoUrl}
                  alt="logo"
                  className="h-12 w-12 rounded-xl object-cover border border-slate-200"
                />
              ) : (
                <div
                  className="h-12 w-12 rounded-xl grid place-items-center text-white text-sm font-semibold"
                  style={{ background: "linear-gradient(135deg,#1A55E3,#5E6EED)" }}
                >
                  {profile?.name ? profile.name.slice(0,2).toUpperCase() : "—"}
                </div>
              )}
              <div>
                <div className="font-semibold text-slate-900">
                  {profile?.name || "—"}
                </div>
                <div className="text-xs text-slate-500">{profile?.website || "—"}</div>
              </div>
            </div>

            <p className="text-sm text-slate-700 mt-3 whitespace-pre-wrap">
              {profile?.description || "Add a short mission-focused intro so candidates instantly get your vibe."}
            </p>

            {(profile?.domains?.length ? profile.domains : []).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.domains.map((d, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-full border text-xs"
                    style={{
                      background: "rgba(94,110,237,0.1)",
                      color: "#1A55E3",
                      borderColor: "rgba(94,110,237,0.3)",
                    }}
                  >
                    {d}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Quick Facts */}
          <section className="rounded-2xl border border-slate-200 bg-white/80 p-5 text-sm text-slate-700">
            <SectionTitle title="Quick Facts" />
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Globe2 size={16} className="text-[#0DCAF0]" />
                <span className="truncate">{profile?.website || "—"}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-[#5E6EED]" />
                <span className="truncate">{profile?.contactEmail || "—"}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="text-[#00D284]" />
                <span className="truncate">{profile?.contactPhone || "—"}</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={16} className="mt-[2px] text-[#1A55E3]" />
                <span>{(profile?.locations || []).join(", ") || "—"}</span>
              </li>
              <li className="flex items-center gap-2">
                <BarChart3 size={16} className="text-[#FF0854]" />
                <span>Size: {profile?.size || "—"}</span>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
