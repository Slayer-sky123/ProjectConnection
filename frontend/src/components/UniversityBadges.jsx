// src/components/UniversityBadges.jsx
import { BadgeCheck } from "lucide-react";

const badges = [
  { title: "React Pro", status: "verified", color: "green" },
  { title: "AI Learner", status: "verified", color: "yellow" },
  { title: "Data Wrangler", status: "pending", color: "gray" },
  { title: "UI Designer", status: "verified", color: "purple" },
  { title: "Backend Champ", status: "pending", color: "gray" },
];

function UniversityBadges() {
  return (
    <div className="bg-white shadow-md rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <BadgeCheck className="text-blue-600" size={20} />
        <h2 className="text-lg font-semibold text-gray-800">University-Verified Badges</h2>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {badges.map((badge, idx) => (
          <div
            key={idx}
            className={`min-w-max px-4 py-2 rounded-full text-xs font-semibold text-${badge.color}-700 bg-${badge.color}-100 capitalize shadow-sm`}
          >
            {badge.title} {badge.status === "verified" ? "✔️" : "⏳"}
          </div>
        ))}
      </div>
    </div>
  );
}

export default UniversityBadges;