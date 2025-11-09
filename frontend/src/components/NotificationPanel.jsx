// src/components/NotificationPanel.jsx
import { BellRing } from "lucide-react";

const notifications = [
  {
    type: "badge",
    message: "You earned the 'AI Learner' badge!",
    time: "2 mins ago",
    read: false,
  },
  {
    type: "job",
    message: "New internship match: Frontend at CodeCraft.",
    time: "1 hour ago",
    read: true,
  },
  {
    type: "event",
    message: "Reminder: Webinar on UI/UX tomorrow at 3PM.",
    time: "5 hours ago",
    read: false,
  },
  {
    type: "university",
    message: "Your mentor endorsed your React skill.",
    time: "Yesterday",
    read: true,
  },
];

function NotificationPanel() {
  return (
    <div className="bg-white shadow-md rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <BellRing className="text-blue-600" size={20} />
        <h2 className="text-lg font-semibold text-gray-800">Notifications</h2>
      </div>

      <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
        {notifications.map((note, idx) => (
          <li
            key={idx}
            className={`border rounded-md px-4 py-2 text-sm transition shadow-sm hover:shadow-md cursor-pointer ${
              note.read ? "bg-gray-50 text-gray-600" : "bg-blue-50 text-blue-700 border-blue-200"
            }`}
          >
            <p className="font-medium">{note.message}</p>
            <span className="text-xs text-gray-400">{note.time}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default NotificationPanel;
