// src/pages/UniversityGuard.jsx
import { Navigate, useParams } from "react-router-dom";

export default function UniversityGuard({ children }) {
  const { username } = useParams();
  // Let the dashboard resolve username via /auth/me on first load instead of forcing a redirect.
  if (!username || username === "undefined") return children;
  return children;
}
