import React, { useEffect, useRef } from "react";

export default function SpinningCornerImage({
  loading = false,
  src = "./olive.png",
  alt = "Loading",
  size = 120,
  rpm = 60
}) {
  const imgRef = useRef(null);
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (!loading) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) return;

    const degPerMs = (rpm * 360) / 60000;

    const animate = (time) => {
      if (!startTimeRef.current) startTimeRef.current = time;

      const elapsed = time - startTimeRef.current;
      const rotation = elapsed * degPerMs;

      if (imgRef.current) {
        // ✅ SAĞ-SOL (Y ekseni)
        imgRef.current.style.transform = `rotateY(${rotation}deg)`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      startTimeRef.current = null;
    };
  }, [loading, rpm]);

  if (!loading) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        perspective: "1000px",
        zIndex: 9999,
        pointerEvents: "none"
      }}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        style={{
          height: size,
          transformStyle: "preserve-3d",
          willChange: "transform"
        }}
      />
    </div>
  );
}
