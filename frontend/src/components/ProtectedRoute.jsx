// components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("userToken");
  return token ? children : <Navigate to="/login" replace />;
}
