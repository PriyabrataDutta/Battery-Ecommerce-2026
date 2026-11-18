/**
 * Last line of defence against a white screen: catches render errors and
 * failed lazy-page loads (stale script files after a deploy).
 */
import { Component, type ReactNode } from "react";

/** A page's script failed to load — almost always an old tab after a new deploy. */
const isChunkLoadError = (e: unknown) =>
  /dynamically imported module|Importing a module script failed|Failed to fetch|error loading dynamically/i.test(
    e instanceof Error ? e.message : String(e),
  );

/** Reload once to pick up the new deploy; the timestamp stops reload loops. */
export function reloadForNewVersion(): boolean {
  try {
    const last = Number(sessionStorage.getItem("kachi_chunk_reload") || 0);
    if (Date.now() - last < 30_000) return false;
    sessionStorage.setItem("kachi_chunk_reload", String(Date.now()));
  } catch {
    /* storage blocked: still reload once */
  }
  window.location.reload();
  return true;
}

export class AppErrorBoundary extends Component<{ children: ReactNode }, { error: unknown }> {
  state = { error: null as unknown };

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  componentDidCatch(error: unknown) {
    console.error("App crashed:", error);
    if (isChunkLoadError(error)) reloadForNewVersion();
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen grid place-items-center bg-background p-6">
        <div className="max-w-sm text-center space-y-3">
          <h1 className="font-display text-2xl font-bold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            The page didn't load properly — usually because the site was just updated. Reloading fixes it.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}
