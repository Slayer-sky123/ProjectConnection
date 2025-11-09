// src/components/InternshipRecommendations.jsx
import { Briefcase } from "lucide-react";

const internships = [
  {
    company: "TechNova",
    role: "Frontend Intern",
    type: "Remote",
    skills: ["React", "Tailwind", "Figma"],
  },
  {
    company: "AIWorks",
    role: "ML Intern",
    type: "On-site",
    skills: ["Python", "TensorFlow", "Data Analysis"],
  },
  {
    company: "CodeCraft",
    role: "Backend Intern",
    type: "Remote",
    skills: ["Node.js", "MongoDB", "REST API"],
  },
];

function InternshipRecommendations() {
  return (
    <div className="bg-white shadow-md rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Briefcase className="text-blue-600" size={20} />
        <h2 className="text-lg font-semibold text-gray-800">Recommended Internships</h2>
      </div>

      <div className="space-y-4">
        {internships.map((job, idx) => (
          <div
            key={idx}
            className="border border-gray-200 rounded-md p-4 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-700 text-sm">{job.role}</h3>
                <p className="text-sm text-gray-600">{job.company} • {job.type}</p>
              </div>
              <button className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                Apply
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {job.skills.map((skill, i) => (
                <span
                  key={i}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default InternshipRecommendations;
