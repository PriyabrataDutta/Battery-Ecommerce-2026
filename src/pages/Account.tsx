import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, Shield, ShoppingBag } from "lucide-react";

const Account = () => {
  const { user, isStaff, loading, signOut } = useAuth();

  if (loading) return <div className="container-x py-20 text-center">Loading…</div>;
  if (!user) return <Navigate to="/auth?next=/account" replace />;

  return (
    <div className="container-x py-12 max-w-2xl">
      <h1 className="font-display-tight text-4xl font-bold">My Account</h1>
      <div className="mt-6 bg-white border border-line p-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Email</div>
        <div className="font-display font-bold text-lg">{user.email}</div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mt-4">
        <Button asChild variant="outline" className="h-14 justify-start">
          <Link to="/shop"><ShoppingBag className="h-4 w-4 mr-2" /> Continue Shopping</Link>
        </Button>
        {isStaff && (
          <Button asChild className="h-14 justify-start">
            <Link to="/admin"><Shield className="h-4 w-4 mr-2" /> Open Admin</Link>
          </Button>
        )}
      </div>

      <Button variant="ghost" className="mt-6" onClick={signOut}>
        <LogOut className="h-4 w-4 mr-2" /> Sign Out
      </Button>
    </div>
  );
};

export default Account;
