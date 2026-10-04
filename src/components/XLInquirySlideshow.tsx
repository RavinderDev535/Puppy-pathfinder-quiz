import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface XLInquirySlideshowProps {
  images: string[];
  intervalMs?: number;
}

const XLInquirySlideshow = ({ images, intervalMs = 4000 }: XLInquirySlideshowProps) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [images.length, intervalMs]);

  return (
    <div className="relative w-full h-56 md:h-72 rounded-2xl overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.img
          key={index}
          src={images[index]}
          alt="Custom XL whelping setup preview"
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      </AnimatePresence>

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Show image ${i + 1}`}
              className="h-2 rounded-full transition-all"
              style={{
                width: i === index ? 22 : 8,
                background: i === index ? "#D46A3A" : "rgba(255,255,255,0.75)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default XLInquirySlideshow;
