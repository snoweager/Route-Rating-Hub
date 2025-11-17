import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bus, User, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";

export const Navbar = () => {
  const location = useLocation();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <Bus className="h-6 w-6 text-primary" />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              RouteRider
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/routes"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/routes") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Routes
            </Link>
            {session && (
              <>
                <Link
                  to="/bookings"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive("/bookings") ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  My Bookings
                </Link>
                <Link
                  to="/profile"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive("/profile") ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  Profile
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {session ? (
              <>
                <Link to="/profile">
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button>Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
