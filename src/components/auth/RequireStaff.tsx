import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function RequireStaff({ children }: { children: React.ReactNode }) {
  const { user, isStaff, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="container-x py-20 text-center text-muted-foreground">Loading…</div>;
  }
  if (!user) {
    return <Navigate to={`/auth?next=${encodeURIComponent(location.pathname)}`} replace />;
  }
  if (!isStaff) {
    return (
      <div className="container-x py-20 text-center">
        <h1 className="font-display-tight text-3xl font-bold">Staff access only</h1>
        <p className="text-muted-foreground mt-2">
          Your account doesn't have admin permissions.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}
