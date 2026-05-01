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
  <div className="border border-line p-4">
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-primary" />
      <h3 className="font-display font-bold uppercase tracking-wide text-sm">{title}</h3>
    </div>
    {children}
  </div>
);
