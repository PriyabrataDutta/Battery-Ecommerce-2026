import { MapPin, Clock, Truck } from "lucide-react";

const cities = [
  "Bangalore", "Hyderabad", "Chennai", "Mumbai",
  "Delhi NCR", "Pune", "Kolkata", "Ahmedabad",
];

export function DeliveryCoverage() {
  return (
    <section className="mt-12 sm:mt-20 bg-muted/50 border-y border-line py-10 sm:py-14">
      <div className="container-x">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 items-center">
          {/* Left info */}
          <div>
            <div className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-primary">
              Pan-India Delivery
            </div>
            <h2 className="font-display-tight text-2xl sm:text-3xl font-bold mt-1 text-ink">
              We Deliver to Your Doorstep
            </h2>
            <p className="text-sm text-muted-foreground mt-3 max-w-md">
              Same-day delivery &amp; free installation available in major cities.
              Nationwide shipping with trusted logistics partners.
            </p>
            <div className="mt-6 space-y-3">
              {[
                { Icon: Clock, t: "Same-day dispatch for orders before 2 PM" },
                { Icon: Truck, t: "Free shipping on orders above ₹5,000" },
                { Icon: MapPin, t: "Free doorstep installation in select cities" },
              ].map(({ Icon, t }) => (
                <div key={t} className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-md bg-primary/10 text-primary grid place-items-center flex-shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm text-ink">{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right city tags */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
              Cities with Free Installation
            </div>
            <div className="flex flex-wrap gap-2">
              {cities.map((city) => (
                <span
                  key={city}
                  className="badge-pill bg-white border border-line text-ink text-xs px-3 py-1.5 font-medium"
                >
                  <MapPin className="h-3 w-3 text-primary mr-1" />
                  {city}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
