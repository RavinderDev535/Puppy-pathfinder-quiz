import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Check, Search } from "lucide-react";
import { searchBreeds } from "@/lib/breed-data";
import { playSelect, playHover, playTypeTick } from "@/lib/sounds";

type BreedMode = "known" | "mixed" | null;

interface BreedSelectorProps {
  value: string;
  onChange: (breed: string) => void;
  onNext?: () => void;
}

const BreedSelector: React.FC<BreedSelectorProps> = ({ value, onChange, onNext }) => {
  const [mode, setMode] = useState<BreedMode>("known");
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Initialize mode from existing value
  useEffect(() => {
    if (value && mode === null) {
      // If value matches a known breed, set to known mode
      setMode("known");
      setSearchText(value);
    }
  }, []);

  const handleModeSelect = useCallback((m: BreedMode) => {
    playSelect();
    setMode(m);
    setSearchText("");
    setSuggestions([]);
    setHighlightIdx(-1);
    onChange("");
    // Auto-focus the input after mode switch
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [onChange]);

  const handleSearchChange = useCallback((val: string) => {
    setSearchText(val);
    playTypeTick();
    if (mode === "known") {
      const results = searchBreeds(val);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setHighlightIdx(-1);
      // Clear selected breed when typing changes
      onChange("");
    } else {
      onChange(val);
    }
  }, [mode, onChange]);

  const handleSelectBreed = useCallback((breed: string) => {
    playSelect();
    setSearchText(breed);
    onChange(breed);
    setSuggestions([]);
    setShowSuggestions(false);
    setHighlightIdx(-1);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (mode === "known" && showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIdx(prev => Math.min(prev + 1, suggestions.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIdx(prev => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (highlightIdx >= 0 && highlightIdx < suggestions.length) {
          handleSelectBreed(suggestions[highlightIdx]);
        } else if (suggestions.length === 1) {
          handleSelectBreed(suggestions[0]);
        }
        return;
      }
    }
    if (e.key === "Enter" && value.trim()) {
      onNext?.();
    }
  }, [mode, showSuggestions, suggestions, highlightIdx, handleSelectBreed, value, onNext]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIdx >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-breed-item]");
      items[highlightIdx]?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIdx]);

  const accent = "#D46A3A";

  return (
    <div className="storybook-breed-selector">
      {/* Helper text */}
      <p className="breed-helper text-center mb-3 text-xs font-semibold" style={{ color: "#A08968" }}>
        Choose the option that fits best.
      </p>

      {/* Mode toggle */}
      <div className="breed-mode-toggle grid grid-cols-2 gap-2 md:gap-3 mb-4 md:mb-5 max-w-md mx-auto">
        {([
          { key: "known" as const, label: "Breed" },
          { key: "mixed" as const, label: "Breed not listed" },
        ]).map((opt, i) => {
          const isSelected = mode === opt.key;
          return (
            <motion.button
              key={opt.key}
              onClick={() => handleModeSelect(opt.key)}
              onMouseEnter={() => playHover()}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            className={`breed-mode-button ${isSelected ? "breed-mode-button-selected" : ""} relative text-center py-3 md:py-4 px-3 md:px-4 cursor-pointer transition-colors duration-200`}
              style={{
                borderRadius: "16px",
                background: isSelected ? "#FFF3EC" : "#FFFBF6",
                border: isSelected ? `3px solid ${accent}` : "2.5px solid #E8C9B5",
              }}
            >
              <span
                className="font-display font-extrabold text-sm md:text-base leading-tight block"
                style={{ color: "#2D2316" }}
              >
                {opt.label}
              </span>
              <AnimatePresence>
                {isSelected && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: accent }}
                  >
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Input area with smooth transition */}
      <AnimatePresence mode="wait">
        {mode === "known" && (
          <motion.div
            key="known"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="breed-search max-w-md mx-auto relative"
          >
            <div className="relative">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: "#A08968" }}
              />
              <Input
                ref={inputRef}
                autoFocus
                placeholder="Start typing the breed"
                value={searchText}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onBlur={() => {
                  // Delay to allow click on suggestion
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                className="text-base md:text-lg h-12 md:h-14 rounded-2xl border font-bold bg-card pl-10 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                style={{ borderColor: accent }}
              />
            </div>

            {/* Suggestions dropdown */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  ref={listRef}
                  initial={{ opacity: 0, y: -4, scaleY: 0.95 }}
                  animate={{ opacity: 1, y: 0, scaleY: 1 }}
                  exit={{ opacity: 0, y: -4, scaleY: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="breed-suggestions absolute z-50 w-full mt-1.5 rounded-xl border overflow-hidden shadow-lg max-h-[240px] overflow-y-auto"
                  style={{
                    background: "#FFFBF6",
                    borderColor: "#E8C9B5",
                  }}
                >
                  {suggestions.map((breed, i) => (
                    <button
                      key={breed}
                      data-breed-item
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectBreed(breed);
                      }}
                      onMouseEnter={() => setHighlightIdx(i)}
                      className="w-full text-left px-4 py-3 md:py-3.5 transition-colors duration-100 cursor-pointer"
                      style={{
                        background: highlightIdx === i ? "#FFF3EC" : "transparent",
                        borderBottom: i < suggestions.length - 1 ? "1px solid #F0E4D6" : "none",
                      }}
                    >
                      <span
                        className="font-display font-bold text-sm md:text-base"
                        style={{ color: "#2D2316" }}
                      >
                        {breed}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Selected confirmation */}
            <AnimatePresence>
              {value && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-1.5 mt-3"
                >
                  <Check className="w-4 h-4" style={{ color: accent }} strokeWidth={3} />
                  <span className="text-xs font-bold" style={{ color: accent }}>
                    {value} selected
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {mode === "mixed" && (
          <motion.div
            key="mixed"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="breed-search max-w-md mx-auto"
          >
            <p className="text-center mb-2 text-xs font-bold" style={{ color: "#2D2316" }}>
              Enter your breed name
            </p>
            <Input
              ref={inputRef}
              autoFocus
              placeholder="e.g. Lab mix, Mastiff mix, or unknown"
              value={searchText}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onNext?.();
              }}
              className="text-center text-base md:text-lg h-12 md:h-14 rounded-2xl border font-bold bg-card focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              style={{ borderColor: accent }}
            />
            <p className="text-center mt-2 text-[11px] font-semibold" style={{ color: "#A08968" }}>
              Use this if your breed isn't in our list.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BreedSelector;
