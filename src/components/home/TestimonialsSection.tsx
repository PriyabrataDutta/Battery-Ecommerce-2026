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

const TINTS = ["bg-primary text-white", "bg-volt text-ink", "bg-ink text-white"];

export function TestimonialsSection() {
  return (
    <section className="container-x mt-16 sm:mt-24">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="eyebrow">Customer love</div>
          <h2 className="mt-2 font-display-tight text-3xl font-bold text-ink sm:text-4xl">What our customers say</h2>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3 md:gap-5">
        {testimonials.map((t, i) => (
          <figure
            key={t.name}
            className={`relative flex flex-col overflow-hidden rounded-[2rem] p-6 sm:p-7 ${i === 1 ? "bg-ink text-white" : "surface"}`}
          >
            <Quote className={`h-10 w-10 ${i === 1 ? "text-volt" : "text-primary"} fill-current opacity-90`} aria-hidden />
            <div className="mt-4 flex gap-0.5" aria-label={`${t.rating} out of 5 stars`}>
              {Array.from({ length: 5 }).map((_, k) => (
                <Star key={k} className={`h-4 w-4 ${k < t.rating ? "fill-volt text-volt" : i === 1 ? "text-white/20" : "text-line"}`} />
              ))}
            </div>
            <blockquote className={`mt-3 flex-1 text-[15px] leading-relaxed ${i === 1 ? "text-white/85" : "text-ink-soft"}`}>
              "{t.text}"
            </blockquote>
            <figcaption className={`mt-6 flex items-center gap-3 border-t pt-5 ${i === 1 ? "border-white/10" : "border-line"}`}>
              <span className={`grid h-11 w-11 place-items-center rounded-full font-display text-sm font-bold ${TINTS[i % TINTS.length]}`}>{t.name.charAt(0)}</span>
              <span>
                <span className="block font-display text-sm font-bold">{t.name}</span>
                <span className={`block text-xs ${i === 1 ? "text-white/55" : "text-muted-foreground"}`}>{t.location}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
