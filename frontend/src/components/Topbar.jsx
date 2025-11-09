// // src/components/Topbar.jsx
// import { Bell, UserCircle, Menu } from "lucide-react";
// import { Link } from "react-router-dom";
// import { useEffect, useState } from "react";

// function Topbar({ toggleSidebar, isMobile }) {
//   const [studentName, setStudentName] = useState("Student");

//   useEffect(() => {
//     const stored = localStorage.getItem("studentName");
//     if (stored) setStudentName(stored);
//   }, []);

//   return (
//     <header className="bg-white shadow px-4 sm:px-6 py-4 flex items-center justify-between border-b relative z-30">
//       {/* Hamburger for mobile */}
//       {isMobile && (
//         <button onClick={toggleSidebar} className="text-gray-700 p-2 rounded-md bg-white shadow-md">
//           <Menu size={22} />
//         </button>
//       )}

//       {/* Centered title on mobile */}
//       <h1
//         className={`text-lg font-semibold text-gray-800 ${
//           isMobile ? "absolute left-1/2 -translate-x-1/2" : ""
//         }`}
//       >
//         Student Dashboard
//       </h1>

//       {/* Notification and Profile (Desktop Only) */}
//       {!isMobile && (
//         <div className="flex items-center gap-4">
//           <button className="relative text-gray-600 hover:text-blue-600">
//             <Bell size={20} />
//             <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping" />
//             <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
//           </button>

//           <Link to="/student/profile" className="flex items-center gap-2 hover:underline">
//             <UserCircle size={28} className="text-gray-500" />
//             <span className="text-sm font-medium text-gray-800 hidden sm:block">{studentName}</span>
//           </Link>
//         </div>
//       )}
//     </header>
//   );
// }

// export default Topbar;
