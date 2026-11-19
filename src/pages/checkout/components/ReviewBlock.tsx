/**
 * ReviewBlock — bordered section with an icon + title used by the Review step.
 */
import type { ReactNode } from "react";
import type { IconType } from "../lib/types";

export const ReviewBlock = ({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: IconType;
  children: ReactNode;
}) => (
  <div className="rounded-2xl border border-line bg-background p-4 sm:p-5">
    <div className="flex items-center gap-2.5 mb-3">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </span>
      <h3 className="font-display font-bold text-base text-ink">{title}</h3>
    </div>
    {children}
  </div>
);
