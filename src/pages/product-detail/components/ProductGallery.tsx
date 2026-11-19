/**
 * ProductGallery — main image + thumbnail strip.
 *
 * Uses CSS transitions instead of GSAP for the image fade.
 * Main image loads eagerly (LCP); thumbnails use loading="lazy".
 */
import { useEffect, useState } from "react";

export const ProductGallery = ({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) => {
  const [active, setActive] = useState<string | null>(images[0] ?? null);
  const [fadeKey, setFadeKey] = useState(0);

  useEffect(() => {
    if (!active && images.length) setActive(images[0]);
  }, [images, active]);

  const handleSelect = (url: string) => {
    if (url !== active) {
      setFadeKey((k) => k + 1);
      setActive(url);
    }
  };

  return (
    <>
      <div className="relative aspect-square overflow-hidden rounded-3xl border border-line bg-[radial-gradient(circle_at_50%_40%,hsl(var(--card))_0%,hsl(var(--muted))_100%)] shadow-card">
        {active && (
          <img
            key={fadeKey}
            src={active}
            alt={alt}
            className="w-full h-full object-contain p-6 sm:p-10 animate-fade-in"
            fetchPriority="high"
          />
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2 sm:gap-3">
          {images.slice(0, 5).map((url) => (
            <button
              key={url}
              onClick={() => handleSelect(url)}
              aria-label="Show image"
              aria-pressed={active === url}
              className={`bg-card border aspect-square overflow-hidden rounded-xl transition-all ${
                active === url
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-line hover:border-ink/30"
              }`}
            >
              <img
                src={url}
                alt=""
                loading="lazy"
                className="w-full h-full object-contain p-1.5"
              />
            </button>
          ))}
        </div>
      )}
    </>
  );
};
