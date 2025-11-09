import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";

function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState("student"); // UI role tab (S/U/C)
  const [showPass, setShowPass] = useState(false);
  const [loginData, setLoginData] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setLoginData({ ...loginData, [e.target.name]: e.target.value });

  const validateLogin = () => {
    if (!loginData.identifier || !loginData.password) {
      setError("Please fill in all fields.");
      return false;
    }
    const isEmail = loginData.identifier.includes("@");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (isEmail && !emailRegex.test(loginData.identifier)) {
      setError("Please enter a valid email address.");
      return false;
    }
    setError("");
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateLogin()) return;
    try {
      // IMPORTANT: send role along so backend can route university creds to University model
      const res = await API.post("/auth/login", {
        identifier: loginData.identifier,
        password: loginData.password,
        role, // <— this fixes the university login path & flicker
      });

      // store token in BOTH keys for the interceptor
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userToken", res.data.token);
      localStorage.setItem("userRole", res.data.user.role);

      const r = res.data.user.role;
      if (r === "student") {
        navigate("/student/dashboard");
      } else if (r === "university") {
        const uname = res.data.user.username;
        // Land on Overview (primary section)
        navigate(`/university/${uname}/overview`);
      } else if (r === "company") {
        navigate("/company/dashboard");
      } else {
        navigate("/student/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  const roles = ["student", "university", "company"];

  return (
    <div
      className="min-h-screen bg-[#F6F7FB]"
      style={{
        backgroundImage:
          "radial-gradient(28rem 18rem at -10% -10%, rgba(2,76,170,0.12), transparent 55%), radial-gradient(24rem 16rem at 110% 110%, rgba(9,16,87,0.10), transparent 60%)",
      }}
    >
      {/* Top bar / back home */}
      <div className="max-w-7xl mx-auto px-5 sm:px-6 pt-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#091057] hover:text-[#024CAA]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to home
        </Link>

        <Link
          to="/register"
          className="hidden sm:inline-flex items-center text-xs sm:text-sm font-semibold text-[#024CAA] hover:underline"
        >
          New here? Create an account →
        </Link>
      </div>

      <div className="w-full max-w-7xl mx-auto px-5 sm:px-6 py-10 md:py-14">
        <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* LEFT */}
          <div className="md:pr-8">
            <h1 className="text-[32px] md:text-4xl font-bold leading-tight text-[#091057]">
              Welcome back to{" "}
              <span className="text-[#024CAA]">Sproutyou</span>
            </h1>
            <p className="mt-4 text-sm md:text-[15px] text-[#091057]/75 max-w-md">
              Access your dashboard, continue your roadmap, and apply to roles
              tailored to your verified skills and projects.
            </p>
            <ul className="mt-6 space-y-2 text-[14px] md:text-sm text-[#091057] font-medium">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#EC8305]" />
                Explore internships and entry-level roles curated for you.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#024CAA]" />
                Showcase your projects, skills, and credentials in one profile.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#091057]" />
                Track your AI-powered career roadmap step by step.
              </li>
            </ul>

            {/* Illustration */}
            <div className="mt-10 hidden md:block">
              <div className="relative">
                <div className="absolute -inset-6 rounded-3xl bg-gradient-to-tr from-[#024CAA]/18 via-[#091057]/14 to-[#EC8305]/10 blur-2xl" />
                <div className="relative rounded-3xl border border-[#DBD3D3] bg-white p-6 shadow-[0_16px_48px_rgba(9,16,87,0.12)]">
                  <svg viewBox="0 0 520 220" className="w-full h-auto" aria-hidden="true">
                    <rect
                      x="20"
                      y="160"
                      width="480"
                      height="28"
                      rx="14"
                      fill="#F6F7FB"
                      stroke="#E5EAF0"
                    />
                    <g>
                      <rect
                        x="50"
                        y="40"
                        width="130"
                        height="90"
                        rx="14"
                        fill="#FFFFFF"
                        stroke="#E5EAF0"
                      />
                      <circle cx="90" cy="70" r="18" fill="#E9F1FA" />
                      <rect x="120" y="58" width="40" height="8" rx="4" fill="#024CAA" />
                      <rect x="70" y="100" width="90" height="10" rx="5" fill="#F0F4FB" />
                    </g>
                    <g>
                      <rect
                        x="200"
                        y="30"
                        width="140"
                        height="100"
                        rx="16"
                        fill="#FFFFFF"
                        stroke="#E5EAF0"
                      />
                      <rect x="220" y="50" width="100" height="14" rx="7" fill="#024CAA" />
                      <rect x="220" y="74" width="70" height="10" rx="5" fill="#F0F4FB" />
                      <rect x="220" y="90" width="90" height="10" rx="5" fill="#F0F4FB" />
                    </g>
                    <g>
                      <rect
                        x="360"
                        y="50"
                        width="110"
                        height="80"
                        rx="14"
                        fill="#FFFFFF"
                        stroke="#E5EAF0"
                      />
                      <circle cx="390" cy="80" r="16" fill="#E9F1FA" />
                      <rect x="412" y="72" width="40" height="8" rx="4" fill="#091057" />
                      <rect x="382" y="100" width="70" height="8" rx="4" fill="#F0F4FB" />
                    </g>
                    <circle cx="480" cy="32" r="3" fill="#024CAA" />
                    <circle cx="36" cy="28" r="3" fill="#EC8305" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: card */}
          <div className="flex md:justify-end">
            <div className="w-full max-w-md">
              <div className="relative">
                <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-[#024CAA]/14 via-[#091057]/10 to-[#EC8305]/10 blur-2xl" />
                <div className="relative bg-white border border-[#E5EAF0] p-7 sm:p-8 rounded-[2rem] shadow-[0_20px_60px_rgba(9,16,87,0.12)]">
                  {/* Role Selector (UI tabs) */}
                  <div
                    className="mb-6 grid grid-cols-3 rounded-xl bg-[#F6F7FB] p-1 border border-[#E5EAF0]"
                    role="tablist"
                    aria-label="Select role"
                  >
                    {roles.map((r) => (
                      <button
                        key={r}
                        onClick={() => setRole(r)}
                        type="button"
                        className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition ${
                          role === r
                            ? "bg-white text-[#091057] shadow-sm"
                            : "text-[#4A5270] hover:text-[#024CAA]"
                        }`}
                        role="tab"
                        aria-selected={role === r}
                      >
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                      <label
                        htmlFor="identifier"
                        className="block text-[11px] font-semibold text-[#4A5270] mb-1.5"
                      >
                        Email or Username
                      </label>
                      <input
                        id="identifier"
                        type="text"
                        name="identifier"
                        placeholder={
                          role === "university"
                            ? "University email or username"
                            : "e.g. johndoe or john@ex.com"
                        }
                        className="w-full px-4 py-3 rounded-lg border border-[#E5EAF0] bg-white text-[#091057] placeholder:text-[#4A5270]/60 focus:outline-none focus:ring-4 focus:ring-[#024CAA]/18 focus:border-[#024CAA] transition"
                        value={loginData.identifier}
                        onChange={handleChange}
                        autoComplete="username"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="password"
                        className="block text-[11px] font-semibold text-[#4A5270] mb-1.5"
                      >
                        Password
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPass ? "text" : "password"}
                          name="password"
                          placeholder="••••••••"
                          className="w-full px-4 py-3 rounded-lg border border-[#E5EAF0] bg-white text-[#091057] placeholder:text-[#4A5270]/60 focus:outline-none focus:ring-4 focus:ring-[#024CAA]/18 focus:border-[#024CAA] transition"
                          value={loginData.password}
                          onChange={handleChange}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass((prev) => !prev)}
                          className="absolute inset-y-0 right-0 px-3 text-xs sm:text-sm font-medium text-[#024CAA] hover:text-[#013b84]"
                          aria-label={showPass ? "Hide password" : "Show password"}
                        >
                          {showPass ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-[#024CAA] hover:bg-[#013b84] transition font-semibold text-white shadow-[0_10px_30px_rgba(2,76,170,0.35)]"
                    >
                      Login
                    </button>
                  </form>

                  <p className="mt-6 text-center text-xs sm:text-sm text-[#4A5270]">
                    Don’t have an account?{" "}
                    <Link
                      to="/register"
                      className="text-[#024CAA] font-semibold hover:underline"
                    >
                      Register here
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* /RIGHT */}
        </div>
      </div>
    </div>
  );
}

export default Login;
