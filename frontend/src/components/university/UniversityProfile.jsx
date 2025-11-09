// src/components/university/UniversityProfile.jsx
import { useEffect, useState } from "react";
import { Pencil, LogOut, Mail, Phone, Globe, Shield } from "lucide-react";
import { getUniversityProfile, saveUniversityProfile } from "../../api/university";
import { isValidUniUsername, uniUsernameFromName } from "../../lib/username";

const LIGHT = "#b1d4e0";
const DARK = "#0c2d48";
const PRIMARY = "#145da0";

export default function UniversityProfile({ username, onLogout, onUsernameChanged }) {
  const [u, setU] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getUniversityProfile(username);
        setU(data);
        setForm(data);
      } catch {
        setU(null);
        setForm(null);
      }
    })();
  }, [username]);

  const save = async (e) => {
    e?.preventDefault();
    if (!form?.userId) { alert("Missing userId for this university."); return; }
    if (form.username && !isValidUniUsername(form.username)) {
      alert("Username must be 4–24 chars, letters and digits only.");
      return;
    }
    setSaving(true);
    try {
      const data = await saveUniversityProfile(form);
      setU(data);
      setOpen(false);
      if (data.username && data.username !== username) onUsernameChanged?.(data.username);
    } catch (err) {
      alert(err.response?.data?.message || "Unable to save");
    } finally {
      setSaving(false);
    }
  };

  if (!u) return <p className="text-sm text-gray-500">Loading…</p>;

  const initials = u.name?.split(" ").map((s) => s[0]).slice(0, 2).join("") || "UN";

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border" style={{ borderColor: LIGHT }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl grid place-items-center text-white font-bold text-lg"
            style={{ backgroundColor: PRIMARY }}
          >
            {initials}
          </div>
          <div>
            <h2 className="text-xl font-semibold" style={{ color: DARK }}>{u.name}</h2>
            <p className="text-sm text-gray-600">/{u.username}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Chip icon={Globe} label={u.website || "—"} />
              <Chip icon={Shield} label={u.accreditationId || "—"} />
              <Chip icon={Mail} label={u.contactEmail || "—"} />
              <Chip icon={Phone} label={u.contactPhone || "—"} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-white"
            style={{ backgroundColor: PRIMARY }}
          >
            <Pencil className="w-4 h-4" /> Edit Profile
          </button>
          <button onClick={onLogout} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 border border-red-200 hover:bg-red-50">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 text-sm">
        <Info label="Website" value={u.website || "—"} />
        <Info label="Accreditation ID" value={u.accreditationId || "—"} />
        <Info label="Primary Email" value={u.contactEmail || "—"} />
        <Info label="Primary Phone" value={u.contactPhone || "—"} />
        <Info label="City" value={u.address?.city || "—"} />
        <Info label="State" value={u.address?.state || "—"} />
        <Info label="Pincode" value={u.address?.pincode || "—"} />
        <Info label="Departments" value={(u.departments || []).join(", ") || "—"} />
      </div>

      {/* Placement Officer */}
      <div className="mt-6 border-t pt-4">
        <h3 className="font-semibold mb-2" style={{ color: DARK }}>Placement Officer</h3>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <Info label="Name" value={u.placementOfficer?.name || "—"} />
          <Info label="Email" value={u.placementOfficer?.email || "—"} />
          <Info label="Phone" value={u.placementOfficer?.phone || "—"} />
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/30 grid place-items-center p-4">
          <form onSubmit={save} className="w-full max-w-2xl bg-white rounded-2xl p-6 shadow-xl overflow-y-auto max-h-[90vh] border"
            style={{ borderColor: LIGHT }}
          >
            <h3 className="text-lg font-semibold" style={{ color: DARK }}>Edit University Profile</h3>

            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <Input label="University Name" value={form.name || ""} onChange={(v) => setForm({ ...form, name: v })} />
              <Input label="Website" value={form.website || ""} onChange={(v) => setForm({ ...form, website: v })} />
              <Input label="Accreditation ID" value={form.accreditationId || ""} onChange={(v) => setForm({ ...form, accreditationId: v })} />
              <Input label="Primary Email" value={form.contactEmail || ""} onChange={(v) => setForm({ ...form, contactEmail: v })} />
              <Input label="Primary Phone" value={form.contactPhone || ""} onChange={(v) => setForm({ ...form, contactPhone: v })} />

              <div className="sm:col-span-2">
                <label className="text-xs text-gray-600">Username (letters & digits only)</label>
                <input
                  className="border rounded-lg px-3 py-2 w-full"
                  style={{ borderColor: LIGHT }}
                  value={form.username || ""}
                  onChange={(e) => {
                    const raw = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "");
                    setForm({ ...form, username: raw });
                  }}
                  placeholder="Username"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Suggestion: {uniUsernameFromName(form.name || "")} · 4–24 chars, a–z & 0–9
                </p>
              </div>

              <Input label="Address Line 1" value={form.address?.line1 || ""} onChange={(v) => setForm({ ...form, address: { ...form.address, line1: v } })} />
              <Input label="Address Line 2" value={form.address?.line2 || ""} onChange={(v) => setForm({ ...form, address: { ...form.address, line2: v } })} />
              <Input label="City" value={form.address?.city || ""} onChange={(v) => setForm({ ...form, address: { ...form.address, city: v } })} />
              <Input label="State" value={form.address?.state || ""} onChange={(v) => setForm({ ...form, address: { ...form.address, state: v } })} />
              <Input label="Country" value={form.address?.country || "India"} onChange={(v) => setForm({ ...form, address: { ...form.address, country: v } })} />
              <Input label="Pincode" value={form.address?.pincode || ""} onChange={(v) => setForm({ ...form, address: { ...form.address, pincode: v } })} />

              <div className="sm:col-span-2">
                <label className="text-xs text-gray-600">Departments (comma separated)</label>
                <input
                  className="border rounded-lg px-3 py-2 w-full"
                  style={{ borderColor: LIGHT }}
                  value={(form.departments || []).join(", ")}
                  onChange={(e) => setForm({ ...form, departments: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                  placeholder="CSE, ECE, EEE,…"
                />
              </div>

              <Input label="PO Name" value={form.placementOfficer?.name || ""} onChange={(v) => setForm({ ...form, placementOfficer: { ...form.placementOfficer, name: v } })} />
              <Input label="PO Email" value={form.placementOfficer?.email || ""} onChange={(v) => setForm({ ...form, placementOfficer: { ...form.placementOfficer, email: v } })} />
              <Input label="PO Phone" value={form.placementOfficer?.phone || ""} onChange={(v) => setForm({ ...form, placementOfficer: { ...form.placementOfficer, phone: v } })} />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg border" style={{ borderColor: LIGHT }}>
                Cancel
              </button>
              <button disabled={saving} className="px-4 py-2 rounded-lg text-white" style={{ backgroundColor: PRIMARY }}>
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Input({ label, value, onChange, placeholder }) {
  const LIGHT = "#b1d4e0";
  return (
    <div>
      <label className="text-xs text-gray-600">{label}</label>
      <input
        className="border rounded-lg px-3 py-2 w-full"
        style={{ borderColor: LIGHT }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function Chip({ icon: Icon, label }) {
  const LIGHT = "#b1d4e0", DARK = "#0c2d48";
  return (
    <span className="text-xs px-2 py-1 rounded-full border inline-flex items-center gap-1"
          style={{ borderColor: LIGHT, color: DARK, background: "#fff" }}>
      <Icon className="w-3 h-3" /> {label}
    </span>
  );
}

function Info({ label, value }) {
  const LIGHT = "#b1d4e0", DARK = "#0c2d48";
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: LIGHT }}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium" style={{ color: DARK }}>{value}</p>
    </div>
  );
}
