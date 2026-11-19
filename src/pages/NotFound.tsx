import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-hero px-4 text-white">
      <div className="absolute inset-0 bg-dots" aria-hidden />
      <div className="relative max-w-md text-center">
        <span className="eyebrow">Error 404</span>
        <h1 className="mt-4 font-display-tight text-7xl sm:text-8xl font-bold">
          4<span className="text-primary">0</span>4
        </h1>
        <p className="mt-4 text-lg text-white/75">This page has run out of charge. It may have moved or never existed.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="/" className="inline-flex h-12 items-center rounded-full bg-primary px-7 text-[15px] font-semibold shadow-red hover:bg-primary-hover">
            Return to Home
          </a>
          <a href="/shop" className="inline-flex h-12 items-center rounded-full border border-white/30 px-7 text-[15px] font-semibold hover:bg-white/10">
            Browse batteries
          </a>
        </div>
      </div>
    </main>
  );
};

export default NotFound;
