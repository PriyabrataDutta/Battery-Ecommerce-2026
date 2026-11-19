/** Full-width delivery / installation / returns strip under the product hero. */
import { Link } from "react-router-dom";
import { Clock, RotateCcw, Truck, Wrench } from "lucide-react";

const SERVICES = [
  { Icon: Truck, t: "Standard delivery", s: "3–5 business days", tag: "Free" },
  { Icon: Clock, t: "Express delivery", s: "1–2 business days", tag: "₹299" },
  { Icon: Wrench, t: "Doorstep installation", s: "With old battery pickup", tag: "₹499" },
  { Icon: RotateCcw, t: "7-day returns", s: "Unused & uninstalled", to: "/refund-policy" },
];

export const ServiceStrip = () => (
  <section aria-label="Delivery and returns" className="mt-10 sm:mt-14">
    <ul className="grid grid-cols-2 overflow-hidden rounded-[2rem] border border-line bg-white shadow-card lg:grid-cols-4">
      {SERVICES.map(({ Icon, t, s, tag, to }, i) => {
        const body = (
          <>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-sm font-bold leading-tight text-ink sm:text-[15px]">{t}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{s}{tag && <span className="font-semibold text-ink sm:hidden"> · {tag}</span>}</span>
            </span>
            {tag && (
              <span className={`hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-bold sm:inline ${tag === "Free" ? "bg-volt text-ink" : "bg-muted text-ink"}`}>{tag}</span>
            )}
          </>
        );
        const cls = `flex h-full items-center gap-3 p-4 sm:p-6 ${i % 2 === 0 ? "border-r border-line" : ""} ${i < 2 ? "border-b border-line lg:border-b-0" : ""} ${i === 1 ? "lg:border-r" : ""}`;
        return (
          <li key={t}>
            {to ? <Link to={to} className={`${cls} transition-colors hover:bg-muted/50`}>{body}</Link> : <div className={cls}>{body}</div>}
          </li>
        );
      })}
    </ul>
  </section>
);
