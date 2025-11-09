// src/admin/HomePageManager.jsx
import { useState, useEffect } from "react";
import axios from "axios";

export default function HomePageManager() {
  const [hero, setHero] = useState({ heading: "", subheading: "" });
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    axios.get("/api/homepage").then((res) => {
      setHero(res.data.hero);
      setHighlights(res.data.highlights);
      setLoading(false);
    });
  }, []);

  const updateHomepage = async () => {
    try {
      await axios.post("/api/homepage/update", { hero, highlights });
      setMessage("Homepage updated successfully");
    } catch (err) {
      console.error(err);
      setMessage("Update failed");
    }
  };

  const updateHighlight = (index, field, value) => {
    const updated = [...highlights];
    updated[index][field] = value;
    setHighlights(updated);
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Manage Home Page</h2>

      {/* Hero Section */}
      <div className="bg-white p-6 rounded shadow">
        <h3 className="text-lg font-semibold mb-4">Hero Section</h3>
        <input
          type="text"
          value={hero.heading}
          onChange={(e) => setHero({ ...hero, heading: e.target.value })}
          placeholder="Main Heading"
          className="border p-2 w-full mb-2"
        />
        <textarea
          value={hero.subheading}
          onChange={(e) => setHero({ ...hero, subheading: e.target.value })}
          placeholder="Subheading"
          className="border p-2 w-full"
        ></textarea>
      </div>

      {/* Highlights Section */}
      <div className="bg-white p-6 rounded shadow">
        <h3 className="text-lg font-semibold mb-4">Highlights</h3>
        {highlights.map((item, index) => (
          <div key={index} className="mb-4">
            <input
              type="text"
              value={item.label}
              onChange={(e) => updateHighlight(index, "label", e.target.value)}
              placeholder="Label"
              className="border p-2 w-full mb-2"
            />
            <input
              type="text"
              value={item.desc}
              onChange={(e) => updateHighlight(index, "desc", e.target.value)}
              placeholder="Description"
              className="border p-2 w-full"
            />
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <button
        onClick={updateHomepage}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
      >
        Save Changes
      </button>

      {message && <p className="text-sm text-green-600 mt-4">{message}</p>}
    </div>
  );
}
