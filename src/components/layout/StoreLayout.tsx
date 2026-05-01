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
        <Outlet />
      </main>
      <Footer />
      <FloatingCTAs />
    </div>
  );
}
