import { EntityDrawer } from "@/components/admin/EntityDrawer";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import {
  REQUEST_STATUSES,
  type AdminQuoteRow,
  type RequestStatus,
} from "@/api/admin/quotes";
import { useSetQuoteStatus } from "../hooks/useAdminQuotes";

export function QuoteDetailDrawer({
  open,
  onOpenChange,
  quote,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  quote: AdminQuoteRow | null;
}) {
  const setStatus = useSetQuoteStatus();
  if (!quote) {
    return (
      <EntityDrawer open={open} onOpenChange={onOpenChange} title="" size="lg">
        {null}
      </EntityDrawer>
    );
  }

  const handleStatus = (next: RequestStatus) => {
    setStatus.mutate({ id: quote.id, status: next, prev: quote.status });
  };

  return (
    <EntityDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={`Quote · ${quote.name}`}
      description={new Date(quote.created_at).toLocaleString("en-IN", {
        dateStyle: "full",
        timeStyle: "short",
      })}
      size="lg"
    >
      <div className="bg-muted/40 border border-line rounded-lg p-3 flex items-center justify-between">
        <div>
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Status
          </Label>
          <div className="font-display font-bold text-lg capitalize">
            {quote.status.replace(/_/g, " ")}
          </div>
        </div>
        <Select
          value={quote.status}
          onValueChange={(v) => handleStatus(v as RequestStatus)}
          disabled={setStatus.isPending}
        >
          <SelectTrigger className="h-9 w-[160px] text-xs capitalize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REQUEST_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="text-xs capitalize">
                {s.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card title="Contact">
        <Row label="Name" value={quote.name} />
        <Row label="Email" value={<a className="underline" href={`mailto:${quote.email}`}>{quote.email}</a>} />
        <Row label="Phone" value={<a className="underline" href={`tel:${quote.phone}`}>{quote.phone}</a>} />
        <Row label="Company" value={quote.company ?? "—"} />
      </Card>

      <Card title="Requirement">
        <p className="text-sm whitespace-pre-wrap">{quote.requirement}</p>
      </Card>

      {quote.boq_file_url && (
        <Card title="BOQ attachment">
          <Button asChild variant="outline" size="sm">
            <a href={quote.boq_file_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open file
            </a>
          </Button>
        </Card>
      )}
    </EntityDrawer>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-line rounded-lg p-3">
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
        {title}
      </h3>
      <div className="space-y-1 text-sm">{children}</div>
    </div>
  );
}
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right truncate">{value}</span>
    </div>
  );
}
