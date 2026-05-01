import { useRef, useState } from "react";

/**
 * useAccountMenu
 * --------------------------------------------------------------
 * Encapsulates the hover-with-grace-period behaviour of the
 * account dropdown so the JSX stays readable.
 *
 * Behaviour:
 *   • Open instantly on hover/focus.
 *   • Close after a 250ms delay on mouseleave so the user can
 *     diagonally move the cursor into the menu.
 *   • Escape key + outside click close immediately.
 *   • Ignores blur events when focus moves into Radix portals
 *     (we keep this util-shaped so consumers can wire any portal).
 */
export function useAccountMenu(closeDelayMs = 250) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const openNow = () => {
    clearTimer();
    setOpen(true);
  };

  const scheduleClose = () => {
    clearTimer();
    timer.current = setTimeout(() => setOpen(false), closeDelayMs);
  };

  const closeNow = () => {
    clearTimer();
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape" && open) {
      e.stopPropagation();
      closeNow();
    }
  };

  const onBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    // Radix portals menu content outside this wrapper, so blur fires
    // when focus moves into the portal. Ignore those.
    const next = e.relatedTarget as HTMLElement | null;
    if (
      next &&
      next.closest("[data-radix-menu-content], [data-radix-popper-content-wrapper]")
    ) {
      return;
    }
    if (!e.currentTarget.contains(next as Node | null)) {
      closeNow();
    }
  };

  return { open, openNow, scheduleClose, closeNow, onKeyDown, onBlur };
}
