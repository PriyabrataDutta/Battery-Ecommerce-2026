import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMyProfile, useUpdateMyProfile } from "@/hooks/queries/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User as UserIcon } from "lucide-react";

const AccountProfile = () => {
  const { user } = useAuth();
  const { data: profile, isLoading } = useMyProfile(user?.id);
  const update = useUpdateMyProfile(user?.id);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setPhone(profile.phone ?? "");
    setCompany(profile.company ?? "");
  }, [profile]);

  const save = () => {
    if (!user) return;
    update.mutate(
      { full_name: fullName, phone, company },
      {
        onSuccess: () => toast.success("Profile updated"),
        onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
      },
    );
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="bg-white border border-line p-6 max-w-xl">
      <div className="flex items-center gap-2 mb-5">
        <UserIcon className="h-5 w-5 text-primary" />
        <h2 className="font-display font-bold uppercase tracking-wide text-sm">Profile</h2>
      </div>
      <div className="space-y-4">
        <div>
          <Label className="text-xs font-display font-semibold uppercase tracking-wide">Email</Label>
          <Input value={user?.email ?? ""} disabled className="mt-1.5" />
        </div>
        <div>
          <Label className="text-xs font-display font-semibold uppercase tracking-wide">Full name</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={80} className="mt-1.5" />
        </div>
        <div>
          <Label className="text-xs font-display font-semibold uppercase tracking-wide">Phone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} className="mt-1.5" />
        </div>
        <div>
          <Label className="text-xs font-display font-semibold uppercase tracking-wide">Company (optional)</Label>
          <Input value={company} onChange={(e) => setCompany(e.target.value)} maxLength={120} className="mt-1.5" />
        </div>
        <Button onClick={save} disabled={update.isPending}>
          {update.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
};

export default AccountProfile;
