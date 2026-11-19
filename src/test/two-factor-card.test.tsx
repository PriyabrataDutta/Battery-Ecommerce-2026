import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const { old, mfa } = vi.hoisted(() => {
const old = { id: "old", status: "verified", factor_type: "totp", created_at: "2026-11-19T10:00:00Z" };
const mfa = {
  listFactors: vi.fn(async () => ({ data: { totp: [old], all: [old] }, error: null })),
  enroll: vi.fn(async () => ({ data: { id: "new", totp: { qr_code: "data:image/svg+xml;x", secret: "SECRET" } }, error: null })),
  challengeAndVerify: vi.fn(async () => ({ error: null })),
  unenroll: vi.fn(async () => ({ error: null })),
};
return { old, mfa };
});
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { mfa } } }));
import { TwoFactorCard } from "@/pages/admin/settings/tabs/TwoFactorCard";

describe("Settings → Two-factor", () => {
  it("removes the old authenticator only after the new one verifies", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <TwoFactorCard />
      </QueryClientProvider>,
    );
    expect(await screen.findByText("On")).toBeTruthy();
    fireEvent.click(screen.getByText("Move to a new phone"));
    expect(await screen.findByText("SECRET")).toBeTruthy();
    expect(mfa.unenroll).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Code from the new app"), { target: { value: "123456" } });
    fireEvent.click(screen.getByText("Verify & switch"));
    await waitFor(() => expect(mfa.unenroll).toHaveBeenCalledWith({ factorId: "old" }));
    expect(mfa.challengeAndVerify).toHaveBeenCalledWith({ factorId: "new", code: "123456" });
  });
});
