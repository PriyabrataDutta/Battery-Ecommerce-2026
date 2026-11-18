import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AppErrorBoundary, reloadForNewVersion } from "./components/AppErrorBoundary";
import "./index.css";

// Vite fires this when a lazy page's script (or its CSS) can't be fetched —
// e.g. a tab opened before the latest deploy. Reload to get the new files.
window.addEventListener("vite:preloadError", (event) => {
  if (reloadForNewVersion()) event.preventDefault();
});

createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>,
);
