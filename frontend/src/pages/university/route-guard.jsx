import { Navigate, useParams } from "react-router-dom";

export default function UniversityGuard({ children }) {
  const { username } = useParams();
  if (!username || username === "undefined") return <Navigate to="/login" replace />;
  return children;
}
