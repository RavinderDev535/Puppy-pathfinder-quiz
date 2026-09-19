import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import xlCondoImage from "@/assets/xl-condo-bundle-48x76.png";

/**
 * Multiple product images per bundle+variant for the slideshow.
 * Key format: "Bundle-boxSize-panelHeight" → string[]
 * Falls back to generic bundle images if no variant-specific slideshow exists.
 */
const bundleSlideshowImages: Record<string, Record<string, string[]>> = {
  Starter: {
    "28-18": [
      "https://www.ezwhelp.com/cdn/shop/files/EZC2828compressed_057b739a-7bae-41d6-bf28-421c9be3c6e3.jpg?v=1757336559&width=600",
      "https://www.ezwhelp.com/cdn/shop/files/StarterBundleImage.jpg?v=1762462561&width=600",
    ],
    "38-18": [
      "https://www.ezwhelp.com/cdn/shop/files/EZC3838compressed_3c0d3bcc-2a06-4c6e-ab31-f9baa7845c79.jpg?v=1757336560&width=600",
      "https://www.ezwhelp.com/cdn/shop/files/StarterBundleImage.jpg?v=1762462561&width=600",
    ],
    "38-28": [
      "https://www.ezwhelp.com/cdn/shop/files/Blk_Starter_38_Tall.jpg?v=1757336560&width=600",
      "https://www.ezwhelp.com/cdn/shop/files/Grey_Starter_38_Tall.jpg?v=1757336560&width=600",
    ],
    "48-18": [
      "https://www.ezwhelp.com/cdn/shop/files/EZC4848compressed_3de65923-f540-4a33-84fa-38b2737c3565.jpg?v=1757336560&width=600",
      "https://www.ezwhelp.com/cdn/shop/files/StarterBundleImage.jpg?v=1762462561&width=600",
    ],
    "48-28": [
      "https://www.ezwhelp.com/cdn/shop/files/Blk_Starter_48_Tall.jpg?v=1757336560&width=600",
      "https://www.ezwhelp.com/cdn/shop/files/Grey_Starter_48_Tall.jpg?v=1757336560&width=600",
    ],
  },
  Essential: {
    "28-18": [
      "https://www.ezwhelp.com/cdn/shop/files/EZC2828compressed_e4725d2e-64fe-495d-bf31-2b6eabb8bd75.jpg?v=1757336562&width=600",
      "https://www.ezwhelp.com/cdn/shop/files/EssentialBundleImage.jpg?v=1762462560&width=600",
    ],
    "38-18": [
      "https://www.ezwhelp.com/cdn/shop/files/EZC3838compressed_828790fd-bf03-4d61-b577-1c1310ecd2ca.jpg?v=1757336562&width=600",
      "https://www.ezwhelp.com/cdn/shop/files/EssentialBundleImage.jpg?v=1762462560&width=600",
    ],
    "38-28": [
      "https://www.ezwhelp.com/cdn/shop/files/Blk_Essential_38_Tall.jpg?v=1757336562&width=600",
    ],
    "48-18": [
      "https://www.ezwhelp.com/cdn/shop/files/EZC4848compressed_97ce1175-32e8-4b3b-8d30-a2591634e962.jpg?v=1757336562&width=600",
      "https://www.ezwhelp.com/cdn/shop/files/EssentialBundleImage.jpg?v=1762462560&width=600",
    ],
    "48-28": [
      "https://www.ezwhelp.com/cdn/shop/files/Blk_Essential_48_Tall.jpg?v=1757336563&width=600",
    ],
  },
  Pro: {
    "28-18": [
      "https://www.ezwhelp.com/cdn/shop/files/28x28_compressed.jpg?v=1757336556&width=600",
      "https://www.ezwhelp.com/cdn/shop/files/ProBundleImage.jpg?v=1762462562&width=600",
    ],
    "38-18": [
      "https://www.ezwhelp.com/cdn/shop/files/38x38_compressed.jpg?v=1757336557&width=600",
      "https://www.ezwhelp.com/cdn/shop/files/ProBundleImage.jpg?v=1762462562&width=600",
    ],
    "38-28": [
      "https://www.ezwhelp.com/cdn/shop/files/Blk_Pro_38_Tall.jpg?v=1757336557&width=600",
    ],
    "48-18": [
      "https://www.ezwhelp.com/cdn/shop/files/48x48_compressed.jpg?v=1757336557&width=600",
      "https://www.ezwhelp.com/cdn/shop/files/ProBundleImage.jpg?v=1762462562&width=600",
    ],
    "48-28": [
      "https://www.ezwhelp.com/cdn/shop/files/Blk_Pro_48_Tall.jpg?v=1757336557&width=600",
    ],
  },
  Elite: {
    "28-18": [
      "https://www.ezwhelp.com/cdn/shop/files/28x28_compressed_d6687380-d2a2-4d40-a75a-be00826d94a8.jpg?v=1757336554&width=600",
      "https://www.ezwhelp.com/cdn/shop/files/EliteBundleImage.jpg?v=1762462563&width=600",
    ],
    "38-18": [
      "https://www.ezwhelp.com/cdn/shop/files/38x38_compressed_1a5dcd47-4f01-47b7-8ea3-eeba6cff83a5.jpg?v=1757336554&width=600",
      "https://www.ezwhelp.com/cdn/shop/files/EliteBundleImage.jpg?v=1762462563&width=600",
    ],
    "38-28": [
      "https://www.ezwhelp.com/cdn/shop/files/Blk_Elite_38_Tall.jpg?v=1757336554&width=600",
    ],
    "48-18": [
      "https://www.ezwhelp.com/cdn/shop/files/48x48_compressed_4f6bc69e-ddce-419f-96c0-234072f22b31.jpg?v=1757336554&width=600",
      "https://www.ezwhelp.com/cdn/shop/files/EliteBundleImage.jpg?v=1762462563&width=600",
    ],
    "48-28": [
      "https://www.ezwhelp.com/cdn/shop/files/Blk_Elite_48_Tall.jpg?v=1757336555&width=600",
    ],
  },
  "Play Yard": {
    default: [
      "https://www.ezwhelp.com/cdn/shop/files/EZC3838withPlayYardsmall.jpg?v=1762462564&width=600",
    ],
  },
  Condo: {
    "28-18": [
      "https://www.ezwhelp.com/cdn/shop/files/28x28PlayYardSize-5.jpg?v=1762463441&width=600",
    ],
    "38-18": [
      "https://www.ezwhelp.com/cdn/shop/files/38x38PlayYardSize-4.jpg?v=1757336507&width=600",
    ],
    "38-28": [
      "https://www.ezwhelp.com/cdn/shop/files/TALL_38x38_Condo_Set_-_2.jpg?v=1757336508&width=600",
    ],
    "48-18": [
      "https://www.ezwhelp.com/cdn/shop/files/48x48PlayYardSize-6.jpg?v=1757336508&width=600",
    ],
    "48-28": [
      xlCondoImage,
    ],
  },
};

function getBundleSlideImages(bundle: string, boxSize: string, panelHeight: string): string[] {
  const key = `${boxSize}-${panelHeight}`;
  const bundleMap = bundleSlideshowImages[bundle];
  if (!bundleMap) return [];
  return bundleMap[key] || bundleMap["default"] || [];
}

interface BundleSlideshowProps {
  bundle: string;
  boxSize: string;
  panelHeight: string;
  alt: string;
}

const BundleSlideshow: React.FC<BundleSlideshowProps> = ({ bundle, boxSize, panelHeight, alt }) => {
  const images = getBundleSlideImages(bundle, boxSize, panelHeight);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [images.length]);

  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className="w-full aspect-[16/9] overflow-hidden">
        <img src={images[0]} alt={alt} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[16/9] overflow-hidden" style={{ background: '#F5EDE2' }}>
      <AnimatePresence mode="wait">
        <motion.img
          key={activeSlide}
          src={images[activeSlide]}
          alt={`${alt} - View ${activeSlide + 1}`}
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        />
      </AnimatePresence>

      {/* Dot indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveSlide(i);
            }}
            className="transition-all duration-300"
            style={{
              width: i === activeSlide ? '20px' : '6px',
              height: '6px',
              borderRadius: '3px',
              background: i === activeSlide ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.4)',
              boxShadow: i === activeSlide ? '0 1px 4px rgba(0,0,0,0.2)' : 'none',
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default BundleSlideshow;
