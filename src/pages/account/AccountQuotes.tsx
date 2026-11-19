import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { FileText, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const statusColor: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-muted text-muted-foreground",
};

const AccountQuotes = () => {
  const { user } = useAuth();

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["my-quotes", user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const { data, error } = await supabase
        .from("quote_requests")
        .select("*")
        .eq("email", user.email)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.email,
    staleTime: 60_000,
  });

  return (
    <section className="surface p-6">
      <div className="flex items-center gap-3 mb-4">
        <FileText className="h-5 w-5 text-primary" />
        <h2 className="font-display-tight text-2xl font-bold">Quote Requests</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Track the status of bulk and B2B quote requests you've submitted.
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-20 bg-muted animate-pulse rounded" />)}
        </div>
      ) : quotes.length === 0 ? (
        <div className="border border-dashed border-line p-10 text-center text-sm text-muted-foreground">
          You haven't submitted any quote requests yet.
        </div>
      ) : (
        <div className="space-y-3">
          {quotes.map((q: any) => (
            <div key={q.id} className="border border-line p-4 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink line-clamp-1">{q.requirement}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {new Date(q.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  {q.company && <span>• {q.company}</span>}
                </div>
              </div>
              <Badge variant="secondary" className={statusColor[q.status] ?? ""}>
                {q.status?.replace(/_/g, " ")}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default AccountQuotes;
