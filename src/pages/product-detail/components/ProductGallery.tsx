/**
 * ProductGallery — main image + thumbnail strip.
 *
 * Owns the active-image state. Parent passes the full image URL list.
 * GSAP fade animation runs whenever `active` changes.
 */
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export const ProductGallery = ({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) => {
  const [active, setActive] = useState<string | null>(images[0] ?? null);
  const mainRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!active && images.length) setActive(images[0]);
  }, [images, active]);

  useEffect(() => {
    if (mainRef.current && active) {
      gsap.fromTo(
        mainRef.current,
        { opacity: 0, scale: 1.02 },
        { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out" },
      );
    }
  }, [active]);

  return (
    <>
      <div className="bg-white border border-line aspect-square overflow-hidden">
        {active && (
          <img
            ref={mainRef}
            src={active}
            alt={alt}
            className="w-full h-full object-contain p-4"
          />
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.slice(0, 5).map((url) => (
            <button
              key={url}
              onClick={() => setActive(url)}
              className={`bg-white border aspect-square overflow-hidden ${
                active === url ? "border-primary ring-1 ring-primary" : "border-line"
              }`}
            >
              <img src={url} alt="" className="w-full h-full object-contain p-1" />
            </button>
          ))}
        </div>
      )}
    </>
  );
};
