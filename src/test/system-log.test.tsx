import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import fixture from "./fixtures-system-status.json";

vi.mock("@/api/admin/system", () => ({ getSystemStatus: () => Promise.resolve(fixture) }));
import SystemLog from "@/pages/admin/system-log";

describe("Admin → System Log", () => {
  it("renders Performance and DB Status from a real status snapshot", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <SystemLog />
      </QueryClientProvider>,
    );
    expect(await screen.findByText("Slowest queries")).toBeTruthy();
    expect(screen.getByText("Cache hit rate")).toBeTruthy();
    expect(screen.getByText("expire-unpaid-online-orders")).toBeTruthy();
    fireEvent.mouseDown(screen.getByRole("tab", { name: "DB Status" }));
    expect(await screen.findByText("Database size")).toBeTruthy();
    expect(screen.getByText("product_fitment")).toBeTruthy();
  });
});
