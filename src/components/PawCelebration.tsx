import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PawCelebrationProps {
  onComplete: () => void;
}

const PawSvg = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="7" cy="5.5" rx="2.2" ry="3" transform="rotate(-15 7 5.5)" />
    <ellipse cx="12" cy="4" rx="2" ry="2.8" />
    <ellipse cx="17" cy="5.5" rx="2.2" ry="3" transform="rotate(15 17 5.5)" />
    <ellipse cx="20" cy="10" rx="1.8" ry="2.6" transform="rotate(30 20 10)" />
    <ellipse cx="4" cy="10" rx="1.8" ry="2.6" transform="rotate(-30 4 10)" />
    <path d="M12 20c-4.5 0-7-3-7-6 0-2.5 2.5-5 7-5s7 2.5 7 5c0 3-2.5 6-7 6z" />
  </svg>
);

const pawPositions = [
  { x: "-40%", y: "60%", rotate: -25 },
  { x: "-15%", y: "35%", rotate: -10 },
  { x: "10%",  y: "55%", rotate: 15 },
  { x: "35%",  y: "30%", rotate: -5 },
  { x: "55%",  y: "50%", rotate: 20 },
];

const PawCelebration: React.FC<PawCelebrationProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<"paws" | "stamp" | "done">("paws");

  useEffect(() => {
    // Paws take ~0.12*5 + 0.3s travel = ~0.9s, then stamp
    const stampTimer = setTimeout(() => setPhase("stamp"), 750);
    const doneTimer = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 1400);
    return () => {
      clearTimeout(stampTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Paw prints walking across */}
      <AnimatePresence>
        {phase === "paws" && pawPositions.map((pos, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: pos.x, y: pos.y, scale: 0.3, rotate: pos.rotate - 20 }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0.3, 1.1, 1, 0.8],
              rotate: [pos.rotate - 20, pos.rotate, pos.rotate + 5, pos.rotate],
              y: [pos.y, `calc(${pos.y} - 8px)`, pos.y, `calc(${pos.y} + 4px)`],
            }}
            transition={{
              duration: 0.55,
              delay: i * 0.12,
              ease: "easeOut",
              times: [0, 0.3, 0.7, 1],
            }}
            className="absolute"
            style={{ left: `calc(50% + ${pos.x})`, color: "#D46A3A" }}
          >
            <PawSvg className="w-6 h-6 md:w-8 md:h-8 drop-shadow-sm" />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Breeder Ready stamp */}
      <AnimatePresence>
        {phase === "stamp" && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 1.3, rotate: -8 }}
            animate={{
              opacity: [0, 1, 1, 0.27],
              y: [-40, 4, -2, 0],
              scale: [1.3, 1.05, 0.98, 1],
              rotate: [-8, 2, -1, 0],
            }}
            transition={{
              duration: 0.65,
              ease: "easeOut",
              times: [0, 0.35, 0.65, 1],
            }}
            className="absolute flex flex-col items-center"
          >
            <div
              className="px-6 py-3 md:px-8 md:py-4 font-display font-black text-lg md:text-2xl uppercase tracking-[0.15em] text-center select-none"
              style={{
                color: "#D46A3A",
                border: "3px solid #D46A3A",
                borderRadius: "12px",
                background: "rgba(255,243,236,0.85)",
                boxShadow: "0 4px 20px rgba(212,106,58,0.2)",
                transform: "rotate(-3deg)",
              }}
            >
              🐾 Breeder Ready
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PawCelebration;
