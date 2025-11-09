import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import debounce from "lodash.debounce";
import API from "../api/axios";
import { uniUsernameFromName } from "../lib/username";
import { registerUniversity } from "../api/university";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // common
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "university", // default to university
    phone: "",
    // student
    university: "",
    education: "UG",
    skills: "",
    // company
    companyName: "",
    companyWebsite: "",
    companySize: "1-10",
    companyContactEmail: "",
    companyContactPhone: "",
    companyLocations: "",
    companyDomains: "",
    // university essentials
    universityName: "",
    universityWebsite: "",
    accreditationId: "",
    uContactEmail: "",
    uContactPhone: "",
    // address essentials
    city: "",
    state: "",
    country: "India",
    pincode: "",
  });

  const [errors, setErrors] = useState({});
  const [usernameAvailable, setUsernameAvailable] = useState(null);

  // derive username from University Name
  const derivedUniUsername = useMemo(
    () => uniUsernameFromName(formData.universityName),
    [formData.universityName]
  );

  // availability
  useEffect(() => {
    const u =
      formData.role === "university" ? derivedUniUsername : formData.username;
    if (!u || u.length < 4) {
      setUsernameAvailable(null);
      return;
    }
    const checkAvailability = debounce(async () => {
      try {
        const res = await API.get(`/auth/check-username?username=${u}`);
        setUsernameAvailable(res.data.available);
      } catch {
        setUsernameAvailable(null);
      }
    }, 500);
    checkAvailability();
    return () => checkAvailability.cancel();
  }, [formData.role, formData.username, derivedUniUsername]);

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*\d).{8,}$/;

    if (!passRegex.test(formData.password))
      newErrors.password =
        "Password must be 8+ chars, 1 number, 1 symbol, 1 uppercase";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    if (formData.role === "company") {
      if (!emailRegex.test(formData.email)) newErrors.email = "Invalid email";
      if (usernameAvailable === false)
        newErrors.username = "Username already taken";
      if (!formData.companyName.trim())
        newErrors.companyName = "Company name is required";
      if (!formData.companyContactEmail.trim())
        newErrors.companyContactEmail = "Company contact email is required";
    }

    if (formData.role === "student") {
      if (!emailRegex.test(formData.email)) newErrors.email = "Invalid email";
      if (usernameAvailable === false)
        newErrors.username = "Username already taken";
    }

    if (formData.role === "university") {
      if (!formData.universityName.trim())
        newErrors.universityName = "University name is required";
      if (!emailRegex.test(formData.uContactEmail))
        newErrors.uContactEmail = "Enter a valid university email";
      if (!formData.uContactPhone.trim())
        newErrors.uContactPhone = "Primary phone is required";
      if (!formData.city.trim()) newErrors.city = "City is required";
      if (!formData.state.trim()) newErrors.state = "State is required";
      if (!formData.pincode.trim()) newErrors.pincode = "Pincode is required";
      if (usernameAvailable === false)
        newErrors.universityName =
          "Username derived from university name is taken; tweak name slightly.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      // University-first flow uses University model endpoint
      if (formData.role === "university") {
        const uniPayload = {
          universityName: formData.universityName,
          email: formData.uContactEmail,
          phone: formData.uContactPhone,
          password: formData.password,
          website: formData.universityWebsite || "",
          accreditationId: formData.accreditationId || "",
          address: {
            line1: formData.addressLine1 || "",
            line2: formData.addressLine2 || "",
            city: formData.city,
            state: formData.state,
            country: formData.country,
            pincode: formData.pincode,
          },
          departments: (formData.departments || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          placementOfficer: {
            name: formData.placementOfficerName || "",
            email: formData.placementOfficerEmail || "",
            phone: formData.placementOfficerPhone || "",
          },
        };

        const reg = await registerUniversity(uniPayload);

        // Auto-login the university account (role sent!)
        try {
          const loginRes = await API.post("/auth/login", {
            identifier: formData.uContactEmail,
            password: formData.password,
            role: "university",
          });
          // Store in BOTH keys so interceptor always has a token
          localStorage.setItem("token", loginRes.data.token);
          localStorage.setItem("userToken", loginRes.data.token);
          localStorage.setItem("userRole", loginRes.data.user.role);
          const u = loginRes.data.user.username || reg?.user?.username;
          // Land on Overview (primary section)
          return navigate(`/university/${u}/overview`);
        } catch {
          // Fallback to login page if immediate login hiccups
          return navigate("/login");
        }
      }

      // student/company unchanged (standard /auth/register)
      let payload = {
        name: formData.name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone,
        university: formData.university,
        education: formData.education,
        skills: formData.skills,
      };

      const res = await API.post("/auth/register", payload);
      // store in BOTH keys so interceptor always attaches a token
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userToken", res.data.token);
      localStorage.setItem("userRole", res.data.user.role);

      if (res.data.user.role === "company") {
        try {
          await API.post("/company/profile", {
            name: formData.companyName || res.data.user.name,
            website: formData.companyWebsite || "",
            logoUrl: "",
            description: "",
            size: formData.companySize || "1-10",
            locations: (formData.companyLocations || "")
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean),
            domains: (formData.companyDomains || "")
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean),
            contactEmail: formData.companyContactEmail || formData.email,
            contactPhone: formData.companyContactPhone || formData.phone,
          });
        } catch {}
      }

      if (res.data.user.role === "student") navigate("/student/dashboard");
      else if (res.data.user.role === "company") navigate("/company");
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div
      className="min-h-screen bg-[#F6F7FB]"
      style={{
        backgroundImage:
          "radial-gradient(26rem 18rem at -10% -10%, rgba(2,76,170,0.10), transparent 55%), radial-gradient(22rem 16rem at 110% 110%, rgba(9,16,87,0.08), transparent 60%)",
      }}
    >
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
          to="/login"
          className="hidden sm:inline-flex items-center text-xs sm:text-sm font-semibold text-[#024CAA] hover:underline"
        >
          Already registered? Login →
        </Link>
      </div>

      <div className="w-full max-w-7xl mx-auto px-5 sm:px-6 py-10 md:py-14 grid md:grid-cols-2 gap-10 lg:gap-16 items-start">
        {/* LEFT — visuals */}
        <div className="md:pr-8">
          <h1 className="text-[32px] md:text-4xl font-bold leading-tight text-[#091057]">
            Create your{" "}
            <span className="text-[#024CAA]">Sproutyou</span> account
          </h1>
          <p className="mt-4 text-sm md:text-[15px] text-[#091057]/75 max-w-md">
            Join an outcome-first network where students, universities and
            companies share one space to build skills, validate progress and
            hire confidently.
          </p>

          <ul className="mt-6 space-y-2 text-[14px] md:text-sm text-[#091057] font-medium">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-[#EC8305]" />
              Build a verified profile of skills, projects and credentials.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-[#024CAA]" />
              Collaborate with universities and hiring partners.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-[#091057]" />
              Unlock internships and early-career roles faster.
            </li>
          </ul>

          <div className="mt-10 hidden md:block">
            <div className="relative">
              <div className="absolute -inset-5 rounded-3xl bg-gradient-to-tr from-[#024CAA]/16 via-[#091057]/14 to-[#EC8305]/12 blur-2xl" />
              <div className="relative rounded-3xl border border-[#DBD3D3] bg-white p-6 shadow-[0_8px_30px_rgba(9,16,87,0.10)]">
                <svg viewBox="0 0 520 200" className="w-full h-auto" aria-hidden="true">
                  <rect
                    x="24"
                    y="150"
                    width="472"
                    height="22"
                    rx="11"
                    fill="#F6F7FB"
                    stroke="#E5EAF0"
                  />
                  <rect
                    x="44"
                    y="32"
                    width="140"
                    height="90"
                    rx="14"
                    fill="#FFFFFF"
                    stroke="#E5EAF0"
                  />
                  <circle cx="84" cy="60" r="16" fill="#E9F1FA" />
                  <rect x="112" y="52" width="50" height="8" rx="4" fill="#024CAA" />
                  <rect x="66" y="96" width="96" height="10" rx="5" fill="#F0F4FB" />
                  <rect
                    x="210"
                    y="26"
                    width="150"
                    height="100"
                    rx="16"
                    fill="#FFFFFF"
                    stroke="#E5EAF0"
                  />
                  <rect x="232" y="48" width="106" height="12" rx="6" fill="#024CAA" />
                  <rect x="232" y="70" width="70" height="10" rx="5" fill="#F0F4FB" />
                  <rect x="232" y="88" width="96" height="10" rx="5" fill="#F0F4FB" />
                  <rect
                    x="380"
                    y="44"
                    width="112"
                    height="84"
                    rx="14"
                    fill="#FFFFFF"
                    stroke="#E5EAF0"
                  />
                  <circle cx="408" cy="74" r="14" fill="#E9F1FA" />
                  <rect x="428" y="66" width="42" height="8" rx="4" fill="#091057" />
                  <rect x="404" y="94" width="72" height="8" rx="4" fill="#F0F4FB" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — form */}
        <div className="w-full">
          <div className="relative">
            <div className="absolute -inset-3 rounded-[1.75rem] bg-gradient-to-tr from-[#024CAA]/12 via-[#091057]/10 to-[#EC8305]/8 blur-2xl" />
            <div className="relative bg-white border border-[#E5EAF0] p-7 sm:p-8 rounded-[1.75rem] shadow-[0_10px_34px_rgba(9,16,87,0.10)]">
              {/* Role selector */}
              <div
                className="mb-6 grid grid-cols-3 rounded-xl bg-[#F6F7FB] p-1 border border-[#E5EAF0]"
                role="tablist"
                aria-label="Select role"
              >
                {["student", "university", "company"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, role: r }))}
                    className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition ${
                      formData.role === r
                        ? "bg-white text-[#091057] shadow-[0_1px_0_rgba(9,16,87,0.03)]"
                        : "text-[#4A5270] hover:text-[#024CAA]"
                    }`}
                    role="tab"
                    aria-selected={formData.role === r}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>

              <form onSubmit={handleRegister} className="space-y-5">
                {/* Common personal block only for student/company */}
                {(formData.role === "student" || formData.role === "company") && (
                  <>
                    <div className="grid md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="name"
                        placeholder="Full Name"
                        required
                        className="w-full px-4 py-3 rounded-lg border border-[#E5EAF0] bg-white text-[#091057] placeholder:text-[#4A5270]/60 focus:outline-none focus:ring-4 focus:ring-[#024CAA]/14 focus:border-[#024CAA] transition"
                        value={formData.name}
                        onChange={handleChange}
                      />
                      <div>
                        <input
                          type="text"
                          name="username"
                          placeholder="Username"
                          required
                          className={`w-full px-4 py-3 rounded-lg bg-white placeholder:text-[#4A5270]/60 focus:outline-none focus:ring-4 focus:ring-[#024CAA]/14 transition ${
                            usernameAvailable === true
                              ? "border border-green-500"
                              : usernameAvailable === false
                              ? "border border-red-500"
                              : "border border-[#E5EAF0]"
                          }`}
                          value={formData.username}
                          onChange={handleChange}
                        />
                        {formData.username.length >= 4 && (
                          <p
                            className={`text-xs mt-1 ${
                              usernameAvailable === true
                                ? "text-green-600"
                                : usernameAvailable === false
                                ? "text-red-600"
                                : "text-[#4A5270]"
                            }`}
                          >
                            {usernameAvailable === true
                              ? "✅ Available"
                              : usernameAvailable === false
                              ? "❌ Taken"
                              : "⏳ Checking..."}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <input
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        required
                        className={`w-full px-4 py-3 rounded-lg bg-white placeholder:text-[#4A5270]/60 focus:outline-none focus:ring-4 focus:ring-[#024CAA]/14 transition ${
                          errors.email ? "border border-red-500" : "border border-[#E5EAF0]"
                        }`}
                        value={formData.email}
                        onChange={handleChange}
                      />
                      <input
                        type="text"
                        name="phone"
                        placeholder="Phone Number"
                        required
                        className="w-full px-4 py-3 rounded-lg border border-[#E5EAF0] bg-white placeholder:text-[#4A5270]/60 focus:outline-none focus:ring-4 focus:ring-[#024CAA]/14 transition"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>
                  </>
                )}

                {/* Passwords */}
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    required
                    className={`w-full px-4 py-3 rounded-lg bg-white placeholder:text-[#4A5270]/60 focus:outline-none focus:ring-4 focus:ring-[#024CAA]/14 transition ${
                      errors.password ? "border border-red-500" : "border border-[#E5EAF0]"
                    }`}
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    required
                    className={`w-full px-4 py-3 rounded-lg bg-white placeholder:text-[#4A5270]/60 focus:outline-none focus:ring-4 focus:ring-[#024CAA]/14 transition ${
                      errors.confirmPassword ? "border border-red-500" : "border border-[#E5EAF0]"
                    }`}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>

                {/* UNIVERSITY ONLY — essentials */}
                {formData.role === "university" && (
                  <div className="space-y-4 border-t border-[#E5EAF0] pt-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <input
                          type="text"
                          name="universityName"
                          placeholder="University Name"
                          className={`w-full px-4 py-3 rounded-lg bg-white placeholder:text-[#4A5270]/60 focus:outline-none focus:ring-4 focus:ring-[#024CAA]/14 transition ${
                            errors.universityName
                              ? "border border-red-500"
                              : "border border-[#E5EAF0]"
                          }`}
                          value={formData.universityName}
                          onChange={handleChange}
                        />
                        <p className="text-xs text-[#4A5270] mt-1">
                          Username:{" "}
                          <span className="font-semibold text-[#024CAA]">
                            {derivedUniUsername}
                          </span>
                          {usernameAvailable === true && " · ✅ Available"}
                          {usernameAvailable === false && " · ❌ Taken"}
                        </p>
                      </div>
                      <input
                        type="text"
                        name="universityWebsite"
                        placeholder="University Website (optional)"
                        className="w-full px-4 py-3 rounded-lg border border-[#E5EAF0] bg-white placeholder:text-[#4A5270]/60 focus:outline-none focus:ring-4 focus:ring-[#024CAA]/14 transition"
                        value={formData.universityWebsite}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <input
                        type="email"
                        name="uContactEmail"
                        placeholder="Official University Email (login)"
                        className={`w-full px-4 py-3 rounded-lg bg-white placeholder:text-[#4A5270]/60 focus:outline-none focus:ring-4 focus:ring-[#024CAA]/14 transition ${
                          errors.uContactEmail ? "border border-red-500" : "border border-[#E5EAF0]"
                        }`}
                        value={formData.uContactEmail}
                        onChange={handleChange}
                      />
                      <input
                        type="text"
                        name="uContactPhone"
                        placeholder="Primary Contact Phone"
                        className={`w-full px-4 py-3 rounded-lg bg-white placeholder:text-[#4A5270]/60 focus:outline-none focus:ring-4 focus:ring-[#024CAA]/14 transition ${
                          errors.uContactPhone ? "border border-red-500" : "border border-[#E5EAF0]"
                        }`}
                        value={formData.uContactPhone}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <input
                        type="text"
                        name="city"
                        placeholder="City"
                        className={`w-full px-4 py-3 rounded-lg bg-white placeholder:text-[#4A5270]/60 focus:outline-none focus:ring-4 focus:ring-[#024CAA]/14 transition ${
                          errors.city ? "border border-red-500" : "border border-[#E5EAF0]"
                        }`}
                        value={formData.city}
                        onChange={handleChange}
                      />
                      <input
                        type="text"
                        name="state"
                        placeholder="State"
                        className={`w-full px-4 py-3 rounded-lg bg-white placeholder:text-[#4A5270]/60 focus:outline-none focus:ring-4 focus:ring-[#024CAA]/14 transition ${
                          errors.state ? "border border-red-500" : "border border-[#E5EAF0]"
                        }`}
                        value={formData.state}
                        onChange={handleChange}
                      />
                      <input
                        type="text"
                        name="pincode"
                        placeholder="Pincode"
                        className={`w-full px-4 py-3 rounded-lg bg-white placeholder:text-[#4A5270]/60 focus:outline-none focus:ring-4 focus:ring-[#024CAA]/14 transition ${
                          errors.pincode ? "border border-red-500" : "border border-[#E5EAF0]"
                        }`}
                        value={formData.pincode}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#024CAA] hover:bg-[#013b84] transition font-semibold text-white shadow-[0_8px_26px_rgba(2,76,170,0.30)]"
                >
                  Sign Up
                </button>
              </form>

              <p className="mt-6 text-center text-xs sm:text-sm text-[#4A5270]">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-[#024CAA] font-semibold hover:underline"
                >
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </div>
        {/* /RIGHT */}
      </div>
    </div>
  );
}

export default Register;
