import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

/**
 * Wraps customer-only routes (account, checkout). If the user is logged in
 * but hasn't added or verified their mobile number, redirect them through
 * the phone capture/verification flow first.
 *
 * Staff/admins are exempt — they go through a different login flow.
 */
export const RequirePhoneVerified = () => {
  const { user, isStaff, hasPhone, phoneVerified, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container-x py-24 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not signed in → let the page itself decide (Checkout/Account already redirect).
  if (!user) return <Outlet />;

  // Staff bypass.
  if (isStaff) return <Outlet />;

  const next = encodeURIComponent(location.pathname + location.search);

  if (!hasPhone) {
    return <Navigate to={`/add-phone?next=${next}`} replace />;
  }

  if (!phoneVerified) {
    return <Navigate to={`/verify-phone?next=${next}`} replace />;
  }

  return <Outlet />;
};

export default RequirePhoneVerified;
