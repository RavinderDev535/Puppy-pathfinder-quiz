import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, HelpCircle } from "lucide-react";
import { playSelect, playHover, playPop, playNext } from "@/lib/sounds";
import { getCompatibleBoxSizes } from "@/lib/breed-box-sizes";
import type { BoxSizeString } from "@/lib/breed-box-sizes";

interface BoxConfigSelectorProps {
  value: string;
  onChange: (value: string) => void;
  onNext?: () => void;
  breed?: string;
}

const sizeConfigs = [
  { value: "28", label: '28×28', desc: "Small breeds" },
  { value: "38", label: '38×38', desc: "Medium breeds" },
  { value: "48", label: '48×48', desc: "Large breeds" },
  { value: "48xl", label: '48×76 Tall', desc: "Giant breeds" },
];

// For backward compatibility with old format
const configs = [
  { value: "28-18", label: '28×28', desc: "Small breeds", size: "28", height: "18" },
  { value: "38-18", label: '38×38', desc: "Medium breeds", size: "38", height: "18" },
  { value: "48-18", label: '48×48', desc: "Large breeds", size: "48", height: "18" },
  { value: "48-28", label: '48×76 Tall', desc: "Giant breeds", size: "48", height: "28" },
];

// Map box size strings to config values
const boxSizeToConfigValue: Record<BoxSizeString, string> = {
  "28x28": "28-18",
  "38x38": "38-18",
  "48x48": "48-18",
  "48x76": "48-28",
};

const BoxConfigSelector: React.FC<BoxConfigSelectorProps> = ({ value, onChange, onNext, breed }) => {
  const parts = value ? value.split("-") : [];
  // ONLY hydrate to "48xl" when the stored token is literally "48xl". The
  // previous logic also upgraded "48-28-..." to "48xl" assuming the legacy
  // shape meant XL, but the same shape is now legitimately emitted when a
  // user picks 48×48 footprint + Tall 28" panels (NOT XL). That caused
  // 48×48 Tall customers (e.g. Alaskan Malamute) to silently end up on the
  // XL path with XL-sized pad variants.
  const [selectedSize, setSelectedSize] = useState(parts.length >= 1 ? (parts[0] === "48xl" ? "48xl" : parts[0]) : "");
  const [selectedHeight, setSelectedHeight] = useState<string>(parts[1] || "");
  const [isWindowed, setIsWindowed] = useState(parts[2] === "yes");
  const [showUnsureHelp, setShowUnsureHelp] = useState(false);

  const isXL = selectedSize === "48xl";
  const isSmall = selectedSize === "28";
  const needsHeightQuestion = selectedSize && !isXL && !isSmall;

  // Filter configs based on breed compatibility
  const visibleSizes = useMemo(() => {
    if (!breed) return sizeConfigs;
    const compatible = getCompatibleBoxSizes(breed);
    if (compatible.length === 0) return sizeConfigs;
    const allowedSizes = new Set<string>();
    compatible.forEach(s => {
      if (s === "48x76") allowedSizes.add("48xl");
      else allowedSizes.add(s.split("x")[0]);
    });
    return sizeConfigs.filter(c => allowedSizes.has(c.value));
  }, [breed]);

  useEffect(() => {
    if (selectedSize) {
      if (isXL) {
        // Use "48xl" as the size token so the XL signal survives all the way
        // to the backend (which auto-detects XL when box_size === "48xl").
        // Previously this collapsed to "48-28" and the backend couldn't tell
        // 48×76 XL apart from 48×48 TALL → resolved to LARGE pad variants.
        const window = isWindowed ? "yes" : "no";
        onChange(`48xl-28-${window}`);
      } else if (selectedHeight) {
        const window = isWindowed ? "yes" : "no";
        onChange(`${selectedSize}-${selectedHeight}-${window}`);
      }
    }
  }, [selectedSize, selectedHeight, isWindowed]);

  useEffect(() => {
    if (value) {
      const p = value.split("-");
      // Only treat "48xl-..." as XL. "48-28-..." now legitimately means
      // 48×48 footprint + Tall 28" panels (a Large dog like an Alaskan
      // Malamute), NOT XL/Giant.
      if (p[0] === "48xl") {
        setSelectedSize("48xl");
        setSelectedHeight("28");
      } else if (p[0] && p[1]) {
        setSelectedSize(p[0]);
        setSelectedHeight(p[1]);
      }
      if (p[2]) setIsWindowed(p[2] === "yes");
    }
  }, [value]);

  const handleContinue = () => {
    const ready = (isXL || isSmall) ? selectedSize : (selectedSize && selectedHeight);
    if (ready && onNext) {
      playNext();
      onNext();
    }
  };

  const getButtonLabel = () => {
    if (!selectedSize) return "";
    const sizeLabel = sizeConfigs.find(c => c.value === selectedSize)?.label || "";
    const heightLabel = isXL ? "" : (selectedHeight === "28" ? " Tall" : "");
    const windowLabel = isWindowed ? "Windowed" : "No window";
    return `${sizeLabel}${heightLabel} • ${windowLabel}`;
  };

  const canContinue = (isXL || isSmall) ? !!selectedSize : (!!selectedSize && !!selectedHeight);

  return (
    <div className="storybook-box-config w-full max-w-md mx-auto space-y-5">
      {/* Size cards — 2×2 grid */}
      <div className={`box-size-grid grid gap-2.5 ${visibleSizes.length <= 2 ? "grid-cols-1 sm:grid-cols-2 max-w-sm mx-auto" : "grid-cols-2"}`}>
        {visibleSizes.map((cfg, i) => {
          const isSelected = selectedSize === cfg.value;
          return (
            <motion.button
              key={cfg.value}
              onClick={() => {
                playSelect();
                setSelectedSize(cfg.value);
                if (cfg.value === "48xl") {
                  setSelectedHeight("28");
                } else if (cfg.value === "28") {
                  setSelectedHeight("18");
                } else {
                  setSelectedHeight(""); // Reset height when changing size
                }
              }}
              onMouseEnter={() => playHover()}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              className="box-size-button relative flex flex-col items-center justify-center py-4 md:py-5 px-2 rounded-2xl cursor-pointer transition-colors"
              style={{
                background: isSelected ? '#FFF3EC' : '#FFFBF6',
                border: isSelected ? '3px solid #D46A3A' : '2.5px solid #E5D8C8',
                boxShadow: isSelected ? '0 4px 16px rgba(212,106,58,0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <span className="font-display font-black text-lg md:text-xl leading-none" style={{ color: '#2D2316' }}>
                {cfg.label}
              </span>
              <span className="text-[10px] md:text-xs font-semibold mt-1" style={{ color: '#6B5B4A' }}>
                {cfg.desc}
              </span>
              <AnimatePresence>
                {isSelected && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: '#D46A3A' }}
                  >
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* "Not sure?" helper */}
      <div className="text-center">
        <button
          onClick={() => setShowUnsureHelp(!showUnsureHelp)}
          className="inline-flex items-center gap-1 text-[10px] md:text-[11px] font-semibold cursor-pointer"
          style={{ color: '#A08968' }}
        >
          <HelpCircle className="w-3 h-3" /> Not sure which size?
        </button>
        <AnimatePresence>
          {showUnsureHelp && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-[10px] md:text-xs font-medium mt-1.5 px-4"
              style={{ color: '#6B5B4A' }}
            >
              Check the label on your EZWhelp box — it's printed on the outside panel. If you can't find it, measure the inside length in inches: ~28", ~38", or ~48". The 48×76 uses tall 28" panels.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Height question — only for non-XL sizes */}
      <AnimatePresence>
        {needsHeightQuestion && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="box-height-section space-y-2.5"
          >
            <p className="font-display font-bold text-sm md:text-base text-center pt-1" style={{ color: '#2D2316' }}>
              Is your box Standard or Tall?
            </p>
            <div className="box-height-grid grid grid-cols-2 gap-2.5">
              {[
                { val: "18", label: 'Standard (18")', desc: "Most common" },
                { val: "28", label: 'Tall (28")', desc: "Taller panels" },
              ].map((opt) => {
                const isSelected = selectedHeight === opt.val;
                return (
                  <motion.button
                    key={opt.val}
                    onClick={() => { playSelect(); setSelectedHeight(opt.val); }}
                    onMouseEnter={() => playHover()}
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    className="box-height-button relative flex flex-col items-center justify-center py-3 md:py-4 px-2 rounded-2xl cursor-pointer transition-colors"
                    style={{
                      background: isSelected ? '#FFF3EC' : '#FFFBF6',
                      border: isSelected ? '3px solid #D46A3A' : '2.5px solid #E5D8C8',
                      boxShadow: isSelected ? '0 4px 16px rgba(212,106,58,0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                    }}
                  >
                    <span className="font-display font-black text-base md:text-lg" style={{ color: '#2D2316' }}>
                      {opt.label}
                    </span>
                    <span className="text-[10px] md:text-xs font-semibold mt-0.5" style={{ color: '#6B5B4A' }}>
                      {opt.desc}
                    </span>
                    <AnimatePresence>
                      {isSelected && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 25 }}
                          className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: '#D46A3A' }}
                        >
                          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Window toggle + Continue — only after size + height selected */}
      <AnimatePresence>
        {canContinue && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="box-window-section space-y-2.5"
          >
            {/* Viewing window — Yes/No cards */}
            <p className="font-display font-bold text-sm md:text-base text-center pt-1" style={{ color: '#2D2316' }}>
              Does your box have a viewing window?
            </p>
            <div className="box-window-grid grid grid-cols-2 gap-2.5">
              {[
                { val: true, label: "Yes", desc: "Clear front panel" },
                { val: false, label: "No", desc: "Solid panels" },
              ].map((opt) => {
                const isSelected = isWindowed === opt.val;
                return (
                  <motion.button
                    key={String(opt.val)}
                    onClick={() => { playSelect(); setIsWindowed(opt.val); }}
                    onMouseEnter={() => playHover()}
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    className="box-window-button relative flex flex-col items-center justify-center py-3 md:py-4 px-2 rounded-2xl cursor-pointer transition-colors"
                    style={{
                      background: isSelected ? '#FFF3EC' : '#FFFBF6',
                      border: isSelected ? '3px solid #D46A3A' : '2.5px solid #E5D8C8',
                      boxShadow: isSelected ? '0 4px 16px rgba(212,106,58,0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                    }}
                  >
                    <span className="font-display font-black text-base md:text-lg" style={{ color: '#2D2316' }}>
                      {opt.label}
                    </span>
                    <span className="text-[10px] md:text-xs font-semibold mt-0.5" style={{ color: '#6B5B4A' }}>
                      {opt.desc}
                    </span>
                    <AnimatePresence>
                      {isSelected && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 25 }}
                          className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: '#D46A3A' }}
                        >
                          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>

            {/* Continue button */}
            <motion.button
              onClick={handleContinue}
              onMouseEnter={() => playHover()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{
                opacity: 1,
                scale: 1,
                rotate: [0, -2, 2, -1.5, 1.5, 0],
              }}
              transition={{
                opacity: { duration: 0.3 },
                scale: { duration: 0.3 },
                rotate: { delay: 1.2, duration: 0.6, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" },
              }}
              whileHover={{ scale: 1.05, y: -2, boxShadow: '0 6px 20px rgba(212,106,58,0.25)' }}
              whileTap={{ scale: 0.95 }}
              className="w-full flex items-center justify-center gap-2 py-3 md:py-3.5 px-5 rounded-full cursor-pointer mt-1"
              style={{
                background: 'linear-gradient(135deg, #D46A3A, #E8944A)',
                color: '#FFFFFF',
                border: 'none',
                boxShadow: '0 4px 14px rgba(212,106,58,0.3)',
              }}
            >
              <span className="font-display font-black text-sm md:text-base">
                {getButtonLabel()}
              </span>
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5" strokeWidth={3} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BoxConfigSelector;
