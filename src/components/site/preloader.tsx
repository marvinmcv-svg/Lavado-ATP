"use client";
// Premium preloader — shows company logo + animated water splash on initial load.
// Fades out once the page is ready.
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Preloader({ logoUrl }: { logoUrl: string | null }) {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress with a smooth animation
    const start = performance.now();
    const duration = 1800; // 1.8s minimum show time for the animation

    let raf: number;
    const tick = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);
      if (pct < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        // Wait a beat then fade out
        setTimeout(() => setVisible(false), 200);
      }
    };
    raf = requestAnimationFrame(tick);

    // Also listen for window load (in case assets take longer)
    const onLoad = () => {
      setTimeout(() => setVisible(false), 500);
    };
    if (document.readyState === "complete") {
      setTimeout(() => setVisible(false), 500);
    } else {
      window.addEventListener("load", onLoad);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("load", onLoad);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-primary overflow-hidden"
        >
          {/* Animated water splash background */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Expanding water rings */}
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0.4 }}
                animate={{ scale: 4, opacity: 0 }}
                transition={{
                  duration: 2.5,
                  delay: i * 0.4,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-32 rounded-full border-4 border-white/30"
              />
            ))}
            {/* Water droplets falling */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={`drip-${i}`}
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: "110vh", opacity: [0, 1, 1, 0] }}
                transition={{
                  duration: 1.5 + (i % 3) * 0.5,
                  delay: i * 0.15,
                  repeat: Infinity,
                  ease: "easeIn",
                }}
                className="absolute size-2 rounded-full bg-white/40"
                style={{ left: `${5 + i * 8}%` }}
              />
            ))}
            {/* Radial gradient glow */}
            <div
              className="absolute inset-0"
              style={{
                background: "radial-gradient(circle at 50% 50%, color-mix(in oklch, var(--accent) 20%, transparent) 0%, transparent 60%)",
              }}
            />
          </div>

          {/* Center content — logo + water splash */}
          <div className="relative z-10 flex flex-col items-center gap-6">
            {/* Logo with splash effect */}
            <motion.div
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              {/* Splash ring behind logo */}
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-white/30 blur-xl"
              />
              {/* Logo */}
              <div className="relative size-24 sm:size-28 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/20">
                {logoUrl ? (
                  <img src={logoUrl} alt="Lavado ATP" className="size-full object-cover" />
                ) : (
                  <div className="size-full bg-white flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="size-12 fill-primary">
                      <path d="M12 2L6 8v12h12V8l-6-6zm0 3.5L16 9v9H8V9l4-3.5z"/>
                    </svg>
                  </div>
                )}
              </div>
              {/* Water drop animations around logo */}
              {[0, 60, 120, 180, 240, 300].map((angle) => {
                const rad = (angle * Math.PI) / 180;
                const x = Math.cos(rad) * 60;
                const y = Math.sin(rad) * 60;
                return (
                  <motion.div
                    key={angle}
                    animate={{
                      scale: [0, 1, 0],
                      x: [0, x, x * 1.5],
                      y: [0, y, y * 1.5],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      delay: (angle / 360) * 1.5,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                    className="absolute top-1/2 left-1/2 size-3 rounded-full bg-accent"
                    style={{ marginLeft: -6, marginTop: -6 }}
                  />
                );
              })}
            </motion.div>

            {/* Brand name */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center"
            >
              <h1 className="text-2xl font-black text-white tracking-tight">
                Lavado <span className="text-accent">ATP</span>
              </h1>
              <p className="text-xs text-white/70 mt-1 tracking-[0.3em] uppercase">
                A toda presión
              </p>
            </motion.div>

            {/* Loading bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="w-48 h-1 rounded-full bg-white/20 overflow-hidden"
            >
              <motion.div
                className="h-full bg-accent rounded-full"
                style={{ width: `${progress}%` }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
