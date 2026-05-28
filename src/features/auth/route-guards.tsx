import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./auth-context";
import { PageLoader } from "../../components/shared/PageLoader";

export function RequireAuth() {
  const { isLoading, session } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!session) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { isLoading, session } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
