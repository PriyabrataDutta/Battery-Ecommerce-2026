import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/**
 * Gate for any route that requires a signed-in customer (or staff). Sends
 * unauthenticated visitors to /auth and remembers where they were going so
 * we can drop them back after sign-in.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container-x py-20 text-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?next=${next}`} replace />;
  }
  return <>{children}</>;
}
