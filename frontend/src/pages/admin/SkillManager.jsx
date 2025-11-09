// src/admin/SkillManager.jsx
import { useEffect, useState } from "react";
import API from "../../api/axios";
import { Pencil, Trash2, Plus, Check, X, RefreshCcw, Loader2 } from "lucide-react";

export default function SkillManager() {
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState("");
  const [editId, setEditId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get("/admin/skills");
      setSkills(res.data || []);
    } catch (e) {
      console.error("Skills load failed:", e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(()=>{ load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    try {
      await API.post("/admin/skills", { name: newSkill.trim() });
      setNewSkill("");
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || "Add failed");
    }
  };

  const save = async (id) => {
    if (!editValue.trim()) return;
    try {
      await API.put(`/admin/skills/${id}`, { name: editValue.trim() });
      setEditId(null); setEditValue("");
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || "Update failed");
    }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this skill?")) return;
    try {
      await API.delete(`/admin/skills/${id}`);
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-indigo-700">🧩 Manage Skills</h2>
        <button onClick={load} className="px-3 py-2 rounded-lg border text-sm flex items-center gap-2">
          <RefreshCcw size={16}/> Refresh
        </button>
      </div>

      <form onSubmit={add} className="mb-6 flex gap-3">
        <input
          type="text"
          placeholder="New skill name"
          value={newSkill}
          onChange={(e)=>setNewSkill(e.target.value)}
          className="border px-3 py-2 rounded w-64"
        />
        <button className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2">
          <Plus size={18}/> Add Skill
        </button>
      </form>

      {loading ? (
        <div className="text-gray-500 flex items-center gap-2"><Loader2 className="animate-spin"/> Loading…</div>
      ) : (
        <table className="w-full bg-white rounded shadow text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="py-2 px-4">#</th>
              <th className="py-2 px-4">Skill</th>
              <th className="py-2 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {skills.length === 0 ? (
              <tr><td colSpan="3" className="text-center py-6 text-gray-500">No skills yet.</td></tr>
            ) : skills.map((s, idx)=>(
              <tr key={s._id} className="border-t">
                <td className="py-2 px-4">{idx+1}</td>
                <td className="py-2 px-4">
                  {editId === s._id ? (
                    <input value={editValue} onChange={(e)=>setEditValue(e.target.value)} className="border px-2 py-1 rounded w-full" />
                  ) : s.name}
                </td>
                <td className="py-2 px-4 flex gap-2">
                  {editId === s._id ? (
                    <>
                      <button onClick={()=>save(s._id)} className="text-green-600"><Check size={18}/></button>
                      <button onClick={()=>{ setEditId(null); setEditValue(""); }} className="text-gray-500"><X size={18}/></button>
                    </>
                  ) : (
                    <>
                      <button onClick={()=>{ setEditId(s._id); setEditValue(s.name); }} className="text-blue-600"><Pencil size={18}/></button>
                      <button onClick={()=>del(s._id)} className="text-red-600"><Trash2 size={18}/></button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
