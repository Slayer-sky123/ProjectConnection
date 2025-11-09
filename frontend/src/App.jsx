import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import { useEffect } from "react";

import API from "./api/axios";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

import StudentLayout from "./layouts/StudentLayout";
import StudentDashboard from "./pages/student/StudentDashboard";
import CareerRoadmapPage from "./pages/student/CareerRoadmapPage";
import InternshipPage from "./pages/student/InternshipPage";
import StudentProfile from "./pages/student/StudentProfile";
import TestSkill from "./pages/student/TestSkill";
import SkillProgress from "./pages/student/SkillProgress";
import JobsBoard from "./pages/student/JobsBoard";
import StudentWebinars from "./pages/student/StudentWebinars";
import StudentWebinarViewer from "./pages/student/StudentWebinarViewer";
import JobDetails from "./pages/student/JobDetails";
import InterviewPrep from "./pages/student/InterviewPrep";
import Study from "./pages/student/Study";
import Guidance from "./pages/student/Guidance";
import MyApplications from "./pages/student/MyApplications";
import StudentInterviewRoom from "./pages/student/StudentInterviewRoom";

// ✅ These two must be present or you’ll get “not defined” errors
import Hackathons from "./pages/student/Hackathons";
import HackathonDetail from "./pages/student/HackathonDetail";

import Admin from "./pages/admin/Admin";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminRoute from "./components/AdminRoute";

import CompanyApp from "./pages/company/CompanyApp";
import WebinarStudio from "./pages/company/WebinarStudio";
import CompanyInterviewRoom from "./pages/company/CompanyInterviewRoom";
import HackathonManager from "./pages/company/HackathonManager";
import ApplicationResults from "./pages/company/ApplicationResults";

import Pricing from "./pages/Pricing";
import RequireRole from "./components/RequireRole";

import UniversityDashboard from "./pages/university/UniversityDashboard";
import UniversityGuard from "./pages/university/route-guard";

import "./styles/company.css";
import VerifyCertificate from "./pages/VerifyCertificate";
import StudentCertificates from "./pages/student/StudentCertificates";
import CollabPage from "./pages/collab";

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert" className="text-center py-20 px-4">
      <h2 className="text-2xl font-bold text-red-600 mb-2">Something went wrong!</h2>
      <pre className="text-gray-800 mb-4">{error.message}</pre>
      <button onClick={resetErrorBoundary} className="bg-blue-600 text-white px-4 py-2 rounded">
        Try Again
      </button>
    </div>
  );
}

/**
 * University landing redirector
 * - Resolves the logged-in university user (via /auth/me)
 * - Redirects to /university/:username/analytics
 * - Falls back to localStorage if necessary
 */
function UniversityLandingRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    let aborted = false;

    (async () => {
      try {
        const meRes = await API.get("/auth/me"); // expected: { user: { username, role } }
        const user = meRes?.data?.user;

        if (!user || user.role !== "university") {
          if (!aborted) navigate("/login", { replace: true });
          return;
        }

        const u = String(user.username || "").trim();
        if (u && u !== "undefined") {
          if (!aborted) navigate(`/university/${u}/analytics`, { replace: true });
          return;
        }
      } catch {
        // Fallback to localStorage if /auth/me isn't available
        const role = localStorage.getItem("userRole");
        if (role === "university") {
          const cached = localStorage.getItem("userUsername") || localStorage.getItem("username");
          if (cached && cached !== "undefined") {
            navigate(`/university/${cached}/analytics`, { replace: true });
            return;
          }
        }
      }

      if (!aborted) navigate("/login", { replace: true });
    })();

    return () => {
      aborted = true;
    };
  }, [navigate]);

  return null;
}

export default function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student */}
          <Route
            path="/student"
            element={
              <RequireRole role="student">
                <StudentLayout />
              </RequireRole>
            }
          >
            <Route index element={<StudentDashboard />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="roadmap" element={<CareerRoadmapPage />} />
            <Route path="internships" element={<InternshipPage />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="testskill" element={<TestSkill />} />
            <Route path="progress" element={<SkillProgress />} />
            <Route path="jobs" element={<JobsBoard />} />
            <Route path="jobs/:id" element={<JobDetails />} />
            <Route path="webinars" element={<StudentWebinars />} />
            <Route path="webinars/webinar/:roomId" element={<StudentWebinarViewer />} />
            <Route path="interview/:roomId" element={<StudentInterviewRoom />} />
            <Route path="status" element={<MyApplications />} />
            <Route path="hackathons" element={<Hackathons />} />
            <Route path="hackathons/:id" element={<HackathonDetail />} />
            <Route path="guidance" element={<Guidance />} />
            <Route path="interview-prep" element={<InterviewPrep />} />
            <Route path="study" element={<Study />} />
            <Route path="certificates" element={<StudentCertificates />} />

          </Route>

          <Route path="/pricing" element={<Pricing />} />

          {/* Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            }
          />

          {/* ---- University ---- */}

          {/* Visiting /university without username resolves and redirects */}
          <Route
            path="/university"
            element={
              <RequireRole role="university">
                <UniversityLandingRedirect />
              </RequireRole>
            }
          />

          {/* Default University route -> redirect to analytics */}
          <Route
            path="/university/:username"
            element={<Navigate to="analytics" replace />}
          />

          {/* (legacy) university collab path still supported */}
          <Route path="/university/collab" element={<CollabPage />} />

          {/* All University sections, protected and guarded */}
          <Route
            path="/university/:username/*"
            element={
              <RequireRole role="university">
                <UniversityGuard>
                  <UniversityDashboard />
                </UniversityGuard>
              </RequireRole>
            }
          />
          <Route path="/verify/:hash" element={<VerifyCertificate />} />

          {/* Company — single mount */}
          <Route path="/company" element={<Navigate to="/company/overview" replace />} />
          <Route
            path="/company/*"
            element={
              <RequireRole role="company">
                <CompanyApp />
              </RequireRole>
            }
          />
          <Route path="/company/dashboard/*" element={<Navigate to="/company/overview" replace />} />
          <Route
            path="/company/webinar/:roomId"
            element={
              <RequireRole role="company">
                <WebinarStudio />
              </RequireRole>
            }
          />
          <Route
            path="/company/interview/:roomId"
            element={
              <RequireRole role="company">
                <CompanyInterviewRoom />
              </RequireRole>
            }
          />
          <Route
            path="/company/hackathons/:id"
            element={
              <RequireRole role="company">
                <HackathonManager />
              </RequireRole>
            }
          />
          <Route
            path="/company/applications/:id/results"
            element={
              <RequireRole role="company">
                <ApplicationResults />
              </RequireRole>
            }
          />

          {/* ==== UNIVERSAL COLLAB WORKSPACE ==== */}
          <Route path="/collab" element={<CollabPage />} />
          <Route path="/collab/:id" element={<CollabPage />} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
