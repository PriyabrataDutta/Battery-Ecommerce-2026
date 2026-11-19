import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, Phone, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const statusColor: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-muted text-muted-foreground",
};

const AccountSupport = () => {
  const { user } = useAuth();

  const { data: messages = [], isLoading: loadingMsgs } = useQuery({
    queryKey: ["my-contact-messages", user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .eq("email", user.email)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.email,
    staleTime: 60_000,
  });

  const { data: callbacks = [], isLoading: loadingCbs } = useQuery({
    queryKey: ["my-callbacks", user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      // Callbacks use phone, try to match by name for now
      const { data, error } = await supabase
        .from("callback_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.email,
    staleTime: 60_000,
  });

  const isLoading = loadingMsgs || loadingCbs;

  return (
    <section className="surface p-6">
      <div className="flex items-center gap-3 mb-4">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h2 className="font-display-tight text-2xl font-bold">Support</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Review your contact messages and callback requests.
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-20 bg-muted animate-pulse rounded" />)}
        </div>
      ) : messages.length === 0 && callbacks.length === 0 ? (
        <div className="border border-dashed border-line p-10 text-center text-sm text-muted-foreground">
          No support history yet.
        </div>
      ) : (
        <div className="space-y-4">
          {messages.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground mb-2">
                Contact Messages
              </h3>
              <div className="space-y-2">
                {messages.map((m: any) => (
                  <div key={m.id} className="border border-line p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{m.subject || "General Inquiry"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{m.message}</p>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(m.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </div>
                    <Badge variant="secondary" className={statusColor[m.status] ?? ""}>
                      {m.status?.replace(/_/g, " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default AccountSupport;
