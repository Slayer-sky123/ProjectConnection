// src/pages/admin/AdminLogin.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const navigate = useNavigate();

  // Always reset admin session on login page to avoid stuck states
  useEffect(() => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("adminEmail");
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(""); setInfo("");
    try {
      const res = await API.post("/auth/admin/login", { email, password });
      const token = res?.data?.token;
      const user = res?.data?.user || {};
      if (!token) throw new Error("Login response did not include a token");

      localStorage.setItem("adminToken", token);
      localStorage.setItem("adminUser", JSON.stringify(user));
      if (user.email) localStorage.setItem("adminEmail", user.email);

      // verify before navigation (prevents bounce-back)
      await API.get("/auth/admin/me");

      setInfo("Login successful. Redirecting…");
      navigate("/admin", { replace: true });
    } catch (e2) {
      setErr(e2?.response?.data?.message || e2.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white border rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-1">Admin Sign in</h1>
        <p className="text-sm text-gray-500 mb-4">Access the control panel</p>
        {err && <div className="mb-3 text-sm text-red-600">{err}</div>}
        {info && <div className="mb-3 text-sm text-emerald-600">{info}</div>}

        <label className="block text-sm mb-1">Email</label>
        <input
          type="email"
          className="w-full border rounded-lg px-3 py-2 mb-3"
          placeholder="admin@yourdomain.com"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          autoComplete="username"
          required
        />

        <label className="block text-sm mb-1">Password</label>
        <input
          type="password"
          className="w-full border rounded-lg px-3 py-2 mb-4"
          placeholder="********"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        <button disabled={busy} className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium">
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
