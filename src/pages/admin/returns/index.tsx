import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listAllReturns, updateReturnStatus, type ReturnRequest } from "@/api/returns";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, ShieldCheck, X, Clock, Calendar } from "lucide-react";

const statusColors: Record<string, string> = {
  requested: "bg-blue-100 text-blue-700",
  staff_verified: "bg-yellow-100 text-yellow-700",
  admin_approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  completed: "bg-muted text-muted-foreground",
};

const AdminReturns = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");
  const qc = useQueryClient();

  const { data: returns = [], isLoading } = useQuery({
    queryKey: ["admin-returns", filter],
    queryFn: () => listAllReturns(filter === "all" ? undefined : filter),
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: ReturnRequest["status"]; notes?: string }) =>
      updateReturnStatus(id, status, {
        staff_verified_by: user?.id,
        admin_decided_by: user?.id,
        admin_notes: notes,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-returns"] });
      toast.success("Return updated");
    },
    onError: () => toast.error("Failed to update"),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="requested">Requested</SelectItem>
            <SelectItem value="staff_verified">Staff Verified</SelectItem>
            <SelectItem value="admin_approved">Admin Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{returns.length} returns</span>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted animate-pulse rounded" />)}</div>
      ) : returns.length === 0 ? (
        <div className="border border-dashed border-line p-10 text-center text-sm text-muted-foreground">No returns found.</div>
      ) : (
        <div className="space-y-3">
          {returns.map((r) => (
            <div key={r.id} className="bg-white border border-line p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono text-xs text-muted-foreground">#{r.id.slice(0, 8)}</span>
                    <Badge variant="secondary" className={statusColors[r.status] ?? ""}>{r.status.replace(/_/g, " ")}</Badge>
                  </div>
                  <p className="text-sm font-semibold">{r.reason}</p>
                  {r.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.description}</p>}
                  {r.return_images && r.return_images.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {r.return_images.map((img) => (
                        <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 border rounded overflow-hidden">
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(r.created_at).toLocaleDateString("en-IN")}
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {r.status === "requested" && (
                    <Button size="sm" variant="outline" onClick={() => mutation.mutate({ id: r.id, status: "staff_verified" })} disabled={mutation.isPending}>
                      <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Verify
                    </Button>
                  )}
                  {(r.status === "requested" || r.status === "staff_verified") && (
                    <Button size="sm" variant="outline" className="text-green-600" onClick={() => mutation.mutate({ id: r.id, status: "admin_approved" })} disabled={mutation.isPending}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                    </Button>
                  )}
                  {r.status !== "rejected" && r.status !== "completed" && (
                    <Button size="sm" variant="outline" className="text-red-600" onClick={() => mutation.mutate({ id: r.id, status: "rejected" })} disabled={mutation.isPending}>
                      <X className="h-3.5 w-3.5 mr-1" /> Reject
                    </Button>
                  )}
                  {r.status === "admin_approved" && (
                    <Button size="sm" variant="outline" onClick={() => mutation.mutate({ id: r.id, status: "completed" })} disabled={mutation.isPending}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Complete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReturns;
