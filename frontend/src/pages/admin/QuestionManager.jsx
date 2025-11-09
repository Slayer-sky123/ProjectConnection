import { useEffect, useState } from "react";
import API from "../../api/axios";
import { Trash2 } from "lucide-react";

export default function QuestionManager() {
  const [skills, setSkills] = useState([]);
  const [sets, setSets] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [selectedSet, setSelectedSet] = useState("");

  const [form, setForm] = useState({
    question: "",
    options: ["", "", "", ""],
    answer: "",
  });

  useEffect(() => {
    fetchSkills();
  }, []);

  useEffect(() => {
    setSelectedSet("");
    setSets([]);
    setQuestions([]);
    fetchSets();
  }, [selectedSkill]);

  useEffect(() => {
    setQuestions([]);
    fetchQuestions();
  }, [selectedSet]);

  const fetchSkills = async () => {
    try {
      const res = await API.get("/admin/skills");
      setSkills(res.data);
    } catch (err) {
      console.error("Failed to fetch skills");
    }
  };

const fetchSets = async () => {
  if (!selectedSkill) return;
  try {
    const res = await API.get("/admin/question-sets");
    const filtered = res.data.filter(
      (set) => set.skill && set.skill._id === selectedSkill
    );
    setSets(filtered);
  } catch (err) {
    console.error("Failed to fetch sets", err.message);
  }
};

  const fetchQuestions = async () => {
    if (!selectedSet) return;
    try {
      const res = await API.get(`/admin/questions/set/${selectedSet}`);
      setQuestions(res.data);
    } catch (err) {
      console.error("Failed to fetch questions");
    }
  };

  const handleInputChange = (index, value) => {
    const newOptions = [...form.options];
    newOptions[index] = value;
    setForm({ ...form, options: newOptions });
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!form.question || form.options.some((o) => !o) || !form.answer) {
      return alert("Please fill in all fields.");
    }

    try {
      await API.post("/admin/questions", {
        set: selectedSet,
        question: form.question,
        options: form.options,
        answer: form.answer,
      });
      setForm({ question: "", options: ["", "", "", ""], answer: "" });
      fetchQuestions();
    } catch (err) {
      alert("Failed to add question");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await API.delete(`/admin/questions/${id}`);
      fetchQuestions();
    } catch (err) {
      alert("Failed to delete question");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-6 text-purple-700">🧠 Manage Questions</h2>

      <div className="flex gap-6 mb-6">
        <div>
          <label className="block mb-1 font-medium">Select Skill:</label>
          <select
            className="border rounded px-3 py-2 w-52"
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value)}
          >
            <option value="">-- Skill --</option>
            {skills.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {sets.length > 0 && (
          <div>
            <label className="block mb-1 font-medium">Select Set:</label>
            <select
              className="border rounded px-3 py-2 w-60"
              value={selectedSet}
              onChange={(e) => setSelectedSet(e.target.value)}
            >
              <option value="">-- Set --</option>
              {sets.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Add Question Form */}
      {selectedSet && (
        <form onSubmit={handleAddQuestion} className="mb-8 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block mb-1 font-medium">Question</label>
            <input
              type="text"
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
              className="border rounded px-3 py-2 w-full"
            />
          </div>

          {[0, 1, 2, 3].map((i) => (
            <div key={i}>
              <label className="block mb-1 font-medium">Option {i + 1}</label>
              <input
                type="text"
                value={form.options[i]}
                onChange={(e) => handleInputChange(i, e.target.value)}
                className="border rounded px-3 py-2 w-full"
              />
            </div>
          ))}

          <div className="col-span-2">
            <label className="block mb-1 font-medium">Correct Answer</label>
            <select
              className="border rounded px-3 py-2 w-full"
              value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
            >
              <option value="">-- Choose Answer --</option>
              {form.options.map((opt, idx) => (
                <option key={idx} value={opt}>
                  {opt || `Option ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <button
              type="submit"
              className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700"
            >
              Add Question
            </button>
          </div>
        </form>
      )}

      {/* Question List */}
      <h3 className="text-lg font-semibold mb-3">All Questions</h3>
      <table className="w-full text-sm bg-white rounded shadow">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-4 text-left">#</th>
            <th className="py-2 px-4 text-left">Question</th>
            <th className="py-2 px-4 text-left">Answer</th>
            <th className="py-2 px-4 text-left">Action</th>
          </tr>
        </thead>
        <tbody>
          {questions.length === 0 ? (
            <tr>
              <td colSpan="4" className="text-center py-6 text-gray-500">
                No questions added yet.
              </td>
            </tr>
          ) : (
            questions.map((q, idx) => (
              <tr key={q._id} className="border-t">
                <td className="py-2 px-4">{idx + 1}</td>
                <td className="py-2 px-4">{q.question}</td>
                <td className="py-2 px-4">{q.answer}</td>
                <td className="py-2 px-4">
                  <button
                    onClick={() => handleDelete(q._id)}
                    className="text-red-600 hover:underline"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
