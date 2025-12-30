import { Navigate, Outlet } from "react-router-dom";
import { getAuth } from "../Utils/Auth";

export function ProtectedRoute() {
  const { token } = getAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

export function LandlordRoute() {
  const { token, role } = getAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (role !== "landlord") {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
