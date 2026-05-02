import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Rajesh Kumar",
    location: "Bangalore",
    rating: 5,
    text: "Got my Amaron battery delivered and installed the same day. Best price I found online. Highly recommend Kachi!",
  },
  {
    name: "Priya Sharma",
    location: "Hyderabad",
    rating: 5,
    text: "Excellent service! The technician was professional and the whole process took less than 30 minutes. Great warranty too.",
  },
  {
    name: "Mohammed Aziz",
    location: "Chennai",
    rating: 4,
    text: "Competitive prices and genuine products. I've been ordering for my fleet of 12 vehicles. Reliable B2B partner.",
  },
];

export function TestimonialsSection() {
  return (
    <section className="container-x mt-12 sm:mt-20">
      <div className="text-center mb-10">
        <div className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-primary">
          Customer Love
        </div>
        <h2 className="font-display-tight text-2xl sm:text-3xl lg:text-4xl font-bold mt-1 text-ink">
          What Our Customers Say
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
        {testimonials.map((t) => (
          <div
            key={t.name}
            className="bg-white border border-line p-5 sm:p-6 relative"
          >
            <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/10" />
            <div className="flex gap-0.5 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < t.rating ? "text-warning fill-warning" : "text-muted"}`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              "{t.text}"
            </p>
            <div className="border-t border-line pt-3">
              <div className="font-display font-semibold text-sm text-ink">{t.name}</div>
              <div className="text-xs text-muted-foreground">{t.location}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
