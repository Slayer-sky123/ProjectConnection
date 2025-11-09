import { motion } from "framer-motion";
import { useEffect, useMemo, useState, useRef } from "react";
import {
  Info,
  CalendarDays,
  Sparkles,
  Target,
  ArrowRight,
  ArrowUpRight,
  GraduationCap,
  UserCircle2,
  LogOut,
  Edit3,
  Bell,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import SkillsProgressChart from "../../components/SkillsProgressChart";
import UniversityBadges from "../../components/UniversityBadges";
import WebinarsSchedule from "../../components/WebinarsSchedule";
import NotificationPanel from "../../components/NotificationPanel";
import CareerRoadmap from "../../components/CareerRoadmap";
import StudentProfileSetup from "./StudentProfileSetup";
import { useSkill } from "../../context/SkillContext.jsx";
import API from "../../api/axios";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut", delay } },
});

function Card({ children, className = "" }) {
  return (
    <div
      className={
        "rounded-2xl border border-slate-200/60 bg-white/80 shadow-sm hover:shadow-md transition-shadow " +
        className
      }
    >
      {children}
    </div>
  );
}

export default function StudentDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selected: selectedSkill, loading: skillLoading } = useSkill();

  const [studentName, setStudentName] = useState("Student");
  const [profileOpen, setProfileOpen] = useState(false);
  const [showCoachmark, setShowCoachmark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    document.title = "Student Dashboard | StudentConnect";
    const storedName = localStorage.getItem("studentName") || "Student";
    setStudentName(storedName);

    const seen = localStorage.getItem("coachmark_profile_setup_seen");
    if (!seen) setShowCoachmark(true);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingProfile(true);
      try {
        const res = await API.get("/student/profile");
        if (mounted) setProfile(res.data || null);
      } catch {
        if (mounted) setProfile(null);
      } finally {
        if (mounted) setLoadingProfile(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shouldOpen = params.get("setup") === "1";
    if (shouldOpen) {
      setProfileOpen(true);
      const newUrl = location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [location]);

  useEffect(() => {
    const handler = () => setProfileOpen(true);
    window.addEventListener("open-profile-setup", handler);
    return () => window.removeEventListener("open-profile-setup", handler);
  }, []);

  // close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const greeting = useMemo(() => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good morning";
    if (hr < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const profileComplete = useMemo(() => {
    if (loadingProfile || skillLoading) return true;
    if (!profile) return false;
    const nameOk = !!String(profile.name || "").trim();
    const emailOk = !!String(profile.email || "").trim();
    const resumeOk = !!profile.resumeUrl;
    const eduOk = !!String(profile.education || "").trim();
    const skillOk = !!selectedSkill?._id;
    return nameOk && emailOk && resumeOk && eduOk && skillOk;
  }, [loadingProfile, skillLoading, profile, selectedSkill]);

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  return (
    <div className="w-full">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <motion.div {...fade(0)}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
                {greeting}, {studentName} <span className="inline-block">👋</span>
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Your roadmap, skills and upcoming events — all in one place.
              </p>
              {selectedSkill?.name && (
                <div className="mt-2 inline-flex items-center gap-2 text-xs px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Sparkles size={14} />
                  <span>Focused Skill:</span>
                  <b>{selectedSkill.name}</b>
                </div>
              )}
            </div>

            {/* Top-right profile section with bell + menu */}
            <div className="flex items-center gap-4" ref={menuRef}>
              <button
                className="relative text-slate-600 hover:text-[#205295]"
                aria-label="Notifications"
              >
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500" />
              </button>

              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 hover:bg-slate-50"
              >
                <UserCircle2 size={18} className="text-slate-600" />
                <span className="text-sm font-medium">{studentName}</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-12 mt-2 w-44 rounded-lg border border-slate-200 bg-white shadow-md z-20">
                  <button
                    onClick={() => {
                      setProfileOpen(true);
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Edit3 size={16} /> Edit Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Prompt to complete profile */}
        {!profileComplete && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
            <Info size={18} className="text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-900">
              <span className="font-medium">Complete your profile</span> to improve search results and get tailored recommendations.
              <div className="mt-2">
                <button
                  onClick={() => setProfileOpen(true)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700"
                >
                  Complete now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Career Guidance */}
        <motion.div {...fade(0.03)}>
          <Card className="p-4 bg-gradient-to-br from-sky-50/70 to-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">AI Career Guidance</h2>
                <p className="text-sm text-slate-600 mt-0.5">
                  Personalized strengths, gaps, job matches, and a weekly plan tailored for you.
                </p>
              </div>
              <Link
                to="/student/guidance"
                className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-white px-3 py-2 text-sky-700 hover:bg-sky-50"
              >
                Open Guidance <ArrowUpRight size={16} />
              </Link>
            </div>
          </Card>
        </motion.div>

        {/* Pastel stat row */}
        <motion.div {...fade(0.05)} className="grid grid-cols-12 gap-4">
          <Card className="p-4 col-span-12 sm:col-span-6 lg:col-span-4 bg-gradient-to-br from-blue-50/60 to-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Roadmap Milestones</p>
                <p className="text-xl font-semibold leading-tight text-slate-900">Next 3 steps</p>
              </div>
              <Target className="text-blue-600" size={20} />
            </div>
            <p className="text-xs text-slate-500 mt-1">Keep momentum: complete one this week.</p>
          </Card>

          <Card className="p-4 col-span-12 sm:col-span-6 lg:col-span-4 bg-gradient-to-br from-indigo-50/60 to-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Upcoming</p>
                <p className="text-xl font-semibold leading-tight text-slate-900">Webinars</p>
              </div>
              <CalendarDays className="text-indigo-600" size={20} />
            </div>
            <p className="text-xs text-slate-500 mt-1">Reserve your spot & set reminders.</p>
          </Card>

          <Card className="p-4 col-span-12 sm:col-span-6 lg:col-span-4 bg-gradient-to-br from-emerald-50/60 to-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Academics</p>
                <p className="text-xl font-semibold leading-tight text-slate-900">Badges & Orgs</p>
              </div>
              <GraduationCap className="text-emerald-600" size={20} />
            </div>
            <p className="text-xs text-slate-500 mt-1">Showcase your wins on applications.</p>
          </Card>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6 auto-rows-fr">
          {/* Career Roadmap */}
          <motion.div {...fade(0.08)} className="col-span-12 xl:col-span-4">
            <Card className="p-5 h-full">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">AI Career Roadmap</h2>
                <button className="text-sm text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1">
                  View detail <ArrowRight size={16} />
                </button>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                Curated steps for courses, projects & certifications — tailored for you.
              </p>
              <div className="mt-4 overflow-y-auto max-h-[360px] pr-1">
                <CareerRoadmap />
              </div>
            </Card>
          </motion.div>

          {/* Skills */}
          <motion.div {...fade(0.1)} className="col-span-12 md:grid-cols-1 md:col-span-6 xl:col-span-4">
            <Card className="p-5 h-full">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">My Skills</h2>
                <span className="text-xs px-2 py-1 rounded-full border bg-slate-50 text-slate-700">
                  Keep building
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                Track growth across your chosen domains and see where to practice next.
              </p>
              <div className="mt-4">
                <SkillsProgressChart />
              </div>
            </Card>
          </motion.div>

          {/* Internships */}
          <motion.div {...fade(0.12)} className="col-span-12 md:col-span-6 xl:col-span-4">
            <Card className="p-5 h-full">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Recommended Internships</h2>
                <button className="text-sm text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1">
                  See more <ArrowRight size={16} />
                </button>
              </div>
              <ul className="text-sm text-slate-800 mt-3 space-y-2">
                {["Frontend Intern — TechNova", "ML Intern — AIWorks", "Backend Intern — CodeCraft"].map(
                  (t) => (
                    <li
                      key={t}
                      className="rounded-xl border border-slate-200/70 bg-white p-3 hover:bg-slate-50 transition"
                    >
                      {t}
                    </li>
                  )
                )}
              </ul>
            </Card>
          </motion.div>

          {/* Badges */}
          <motion.div {...fade(0.14)} className="col-span-12 md:col-span-6 xl:col-span-6">
            <Card className="p-5 h-full">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">University Badges</h2>
              <UniversityBadges />
            </Card>
          </motion.div>

          {/* Webinars */}
          <motion.div {...fade(0.16)} className="col-span-12 md:col-span-6 xl:col-span-6">
            <Card className="p-5 h-full">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Upcoming Webinars</h2>
                <span className="text-xs px-2 py-1 rounded-full border bg-indigo-50 text-indigo-700">
                  Live & Recorded
                </span>
              </div>
              <div className="mt-2">
                <WebinarsSchedule />
              </div>
            </Card>
          </motion.div>

          {/* Notifications */}
          <motion.div {...fade(0.18)} className="col-span-12">
            <Card className="p-5">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Notifications</h2>
              <NotificationPanel />
            </Card>
          </motion.div>
        </div>
      </div>

      <StudentProfileSetup
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onSaved={(updatedName) => {
          if (updatedName) {
            localStorage.setItem("studentName", updatedName);
            setStudentName(updatedName);
          }
          (async () => {
            try {
              const res = await API.get("/student/profile");
              setProfile(res.data || null);
            } catch {
              setProfile(null);
            }
          })();
          setProfileOpen(false);
        }}
      />
    </div>
  );
}
