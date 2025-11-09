import { useEffect, useState } from "react";
import API from "../../api/axios";

function AdminResults() {
  const [results, setResults] = useState([]);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const res = await API.get("/admin/results");
      setResults(res.data);
    } catch (err) {
      console.error("Failed to fetch results", err);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">📊 Skill Test Results</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2">Student</th>
              <th className="px-4 py-2">Skill</th>
              <th className="px-4 py-2">Score</th>
              <th className="px-4 py-2">Total</th>
              <th className="px-4 py-2">Percentage</th>
              <th className="px-4 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r._id} className="border-t">
                <td className="px-4 py-2">{r.studentId?.name || "N/A"}</td>
                <td className="px-4 py-2">{r.skill?.name}</td>
                <td className="px-4 py-2">{r.score}</td>
                <td className="px-4 py-2">{r.total}</td>
                <td className="px-4 py-2">{r.percentage.toFixed(2)}%</td>
                <td className="px-4 py-2">{new Date(r.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminResults;
