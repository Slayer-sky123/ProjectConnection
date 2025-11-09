// src/components/WebinarsSchedule.jsx
import { CalendarDays } from "lucide-react";

const events = [
  {
    date: "Apr 15",
    title: "UI/UX Design Webinar",
    time: "3:00 PM - 4:00 PM",
    speaker: "Jane Doe (UX Lead, CreativX)"
  },
  {
    date: "Apr 22",
    title: "Full Stack Career Talk",
    time: "11:00 AM - 12:30 PM",
    speaker: "Rahul Mehta (CTO, Stackify)"
  },
  {
    date: "May 02",
    title: "AI in Real World",
    time: "5:00 PM - 6:00 PM",
    speaker: "Dr. Kavita Nair (AI Researcher)"
  }
];

function WebinarsSchedule() {
  return (
    <div className="bg-white shadow-md rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className="text-blue-600" size={20} />
        <h2 className="text-lg font-semibold text-gray-800">Upcoming Webinars & Events</h2>
      </div>

      <ul className="space-y-4">
        {events.map((event, idx) => (
          <li
            key={idx}
            className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50/30 rounded-md hover:bg-blue-100/50"
          >
            <p className="text-sm text-gray-700 font-medium">{event.date}</p>
            <h3 className="text-md text-blue-700 font-semibold">{event.title}</h3>
            <p className="text-sm text-gray-600">{event.time} • {event.speaker}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default WebinarsSchedule;
