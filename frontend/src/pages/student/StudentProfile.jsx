import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { UserCircle, Mail, Phone, GraduationCap, Building2, FileText } from "lucide-react";
import API from "../../api/axios";

function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="text-gray-600">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export default function StudentProfile() {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    university: "",
    education: "UG",
    skills: "",
    resume: null,
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "My Profile | StudentConnect";
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get("/student/profile");
      const data = res.data || {};
      if (!data.name) throw new Error("Invalid user data");
      setFormData({
        name: data.name || "",
        username: data.username || "",
        email: data.email || "",
        phone: data.phone || "",
        university: data.university || "",
        education: data.education || "UG",
        skills: Array.isArray(data.skills) ? data.skills.join(", ") : (data.skills || ""),
        resume: null,
      });
      localStorage.setItem("studentName", data.name);
    } catch (err) {
      console.error("Failed to load profile:", err.message || err);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "resume") {
      setFormData((prev) => ({ ...prev, resume: files?.[0] || null }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const form = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        if (v !== null && v !== undefined && v !== "") form.append(k, v);
      });
      await API.post("/student/profile/update", form); // use POST per your backend
      localStorage.setItem("studentName", formData.name);
      alert("Profile updated successfully");
    } catch (err) {
      console.error("Failed to update profile:", err.response || err.message);
      alert("Update failed. Check console for details.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white/80 backdrop-blur rounded-2xl border p-6 md:p-8"
      >
        {/* header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-blue-50 text-blue-600 grid place-items-center">
              <UserCircle size={28} />
            </div>
            <div>
              <h2 className="text-xl font-semibold leading-tight">
                {formData.name || "Student"}
              </h2>
              <p className="text-xs text-gray-500">@{formData.username || "username"}</p>
            </div>
          </div>

          <div className="w-full md:w-auto">
            <label className="text-sm font-medium flex items-center gap-2">
              <FileText size={16} /> Upload Resume (PDF)
            </label>
            <input
              type="file"
              name="resume"
              accept=".pdf"
              onChange={handleChange}
              className="mt-2 w-full md:w-72 text-sm file:mr-3 file:rounded-md file:border file:px-3 file:py-1.5 file:bg-gray-50 hover:file:bg-gray-100"
            />
            {formData.resume && (
              <p className="text-xs text-gray-600 mt-1 truncate">Selected: {formData.resume.name}</p>
            )}
          </div>
        </div>

        {/* form */}
        <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Full Name">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </Field>

            <Field label="Username">
              <input
                type="text"
                name="username"
                value={formData.username}
                disabled
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500"
              />
            </Field>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Email">
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </Field>

            <Field label="Phone">
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </Field>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="University">
              <div className="relative">
                <Building2 size={16} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  name="university"
                  value={formData.university}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </Field>

            <Field label="Education Level">
              <div className="relative">
                <GraduationCap size={16} className="absolute left-3 top-2.5 text-gray-400" />
                <select
                  name="education"
                  value={formData.education}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="UG">Undergraduate</option>
                  <option value="PG">Postgraduate</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </Field>
          </div>

          <Field label="Skills (comma‑separated)">
            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </Field>

          <div className="text-right">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
