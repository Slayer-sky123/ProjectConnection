// src/components/RequireRole.jsx
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function RequireRole({ role, children }) {
  const [ready, setReady] = useState(false);
  const [ok, setOk] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    const userRole = localStorage.getItem("userRole");
    setOk(Boolean(token) && userRole === role);
    setReady(true);
  }, [role]);

  if (!ready) {
    return (
      <div className="min-h-[30vh] grid place-items-center text-gray-500">
        Checking access…
      </div>
    );
  }

  if (!ok) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
