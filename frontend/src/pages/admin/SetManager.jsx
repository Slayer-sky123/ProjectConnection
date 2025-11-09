import { useEffect, useState } from "react";
import API from "../../api/axios";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";

export default function SetManager() {
  const [skills, setSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [sets, setSets] = useState([]);
  const [newSetTitle, setNewSetTitle] = useState("");
  const [editMode, setEditMode] = useState(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    fetchSkills();
  }, []);

  useEffect(() => {
    if (selectedSkill) fetchSets();
    else setSets([]);
  }, [selectedSkill]);

  const fetchSkills = async () => {
    try {
      const res = await API.get("/admin/skills");
      setSkills(res.data);
    } catch (err) {
      console.error("Failed to fetch skills", err.message);
    }
  };

  const fetchSets = async () => {
    try {
      const res = await API.get("/admin/question-sets");
      const filtered = res.data.filter(
        (set) =>
          set.skill && (set.skill._id === selectedSkill || set.skill === selectedSkill)
      );
      setSets(filtered);
    } catch (err) {
      console.error("Failed to fetch sets", err.message);
    }
  };

  const handleAddSet = async (e) => {
    e.preventDefault();
    if (!newSetTitle.trim() || !selectedSkill) return;

    try {
      await API.post("/admin/question-sets", {
        title: newSetTitle.trim(),
        skill: selectedSkill,
        description: "",
      });
      setNewSetTitle("");
      fetchSets();
    } catch (err) {
      console.error("Error adding set", err.message);
      alert("Error adding set: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this question set?")) return;
    try {
      await API.delete(`/admin/question-sets/${id}`);
      fetchSets();
    } catch (err) {
      alert("Error deleting set");
    }
  };

  const startEdit = (id, currentTitle) => {
    setEditMode(id);
    setEditValue(currentTitle);
  };

  const cancelEdit = () => {
    setEditMode(null);
    setEditValue("");
  };

  const saveEdit = async (id) => {
    if (!editValue.trim()) return;
    try {
      await API.put(`/admin/question-sets/${id}`, {
        title: editValue.trim(),
        skill: selectedSkill,
        description: "",
      });
      setEditMode(null);
      setEditValue("");
      fetchSets();
    } catch (err) {
      alert("Failed to update set");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-6 text-indigo-700">📚 Manage Question Sets</h2>

      <div className="mb-6 flex items-center gap-4">
        <label className="font-medium">Select Skill:</label>
        <select
          className="border rounded px-3 py-2 w-64"
          value={selectedSkill}
          onChange={(e) => setSelectedSkill(e.target.value)}
        >
          <option value="">-- Choose Skill --</option>
          {skills.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {selectedSkill && (
        <form onSubmit={handleAddSet} className="mb-6 flex gap-4">
          <input
            type="text"
            placeholder="Enter Set Title"
            value={newSetTitle}
            onChange={(e) => setNewSetTitle(e.target.value)}
            className="border px-3 py-2 rounded w-1/2"
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <Plus size={18} /> Add Set
          </button>
        </form>
      )}

      <table className="w-full bg-white rounded shadow text-sm">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="py-2 px-4">#</th>
            <th className="py-2 px-4">Set Title</th>
            <th className="py-2 px-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sets.length === 0 ? (
            <tr>
              <td colSpan="3" className="text-center py-6 text-gray-500">
                No sets found for selected skill.
              </td>
            </tr>
          ) : (
            sets.map((set, idx) => (
              <tr key={set._id} className="border-t">
                <td className="py-2 px-4">{idx + 1}</td>
                <td className="py-2 px-4">
                  {editMode === set._id ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="border px-2 py-1 rounded w-full"
                    />
                  ) : (
                    set.title
                  )}
                </td>
                <td className="py-2 px-4 flex gap-2">
                  {editMode === set._id ? (
                    <>
                      <button
                        onClick={() => saveEdit(set._id)}
                        className="text-green-600 hover:underline"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-gray-500 hover:underline"
                      >
                        <X size={18} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(set._id, set.title)}
                        className="text-blue-600 hover:underline"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(set._id)}
                        className="text-red-600 hover:underline"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
