import { Suspense } from "react";
import { Outlet } from "react-router-dom";
// Header is a folder (Header/index.tsx) — see README.md inside that folder.
import { Header } from "./Header/index";
import { Footer } from "./Footer";
import { FloatingCTAs } from "./FloatingCTAs";

export function StoreLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Inner boundary: if a page still has to load, only this area waits —
            header and footer stay on screen. */}
        <Suspense fallback={<div className="container-x py-20 text-center text-muted-foreground">Loading…</div>}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <FloatingCTAs />
    </div>
  );
}
