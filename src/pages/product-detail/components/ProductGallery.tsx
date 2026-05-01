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
      <div className="bg-white border border-line aspect-square overflow-hidden rounded-md">
        {active && (
          <img
            key={fadeKey}
            src={active}
            alt={alt}
            className="w-full h-full object-contain p-4 animate-fade-in"
            fetchPriority="high"
          />
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.slice(0, 5).map((url) => (
            <button
              key={url}
              onClick={() => handleSelect(url)}
              className={`bg-white border aspect-square overflow-hidden rounded ${
                active === url
                  ? "border-primary ring-1 ring-primary"
                  : "border-line"
              }`}
            >
              <img
                src={url}
                alt=""
                loading="lazy"
                className="w-full h-full object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}
    </>
  );
};
