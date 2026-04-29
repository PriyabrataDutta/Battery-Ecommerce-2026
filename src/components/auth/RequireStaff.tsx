import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function RequireStaff({ children }: { children: React.ReactNode }) {
  const { user, isStaff, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="container-x py-20 text-center text-muted-foreground">Loading…</div>;
  }
  if (!user || !isStaff) {
    return (
      <Navigate
        to={`/admin/login?next=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }
  return <>{children}</>;
}
