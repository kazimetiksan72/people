import React, { useEffect, useRef } from "react";

export default function SpinningCornerImage({
  src = "./olive.png",
  alt = "Spinning logo",
  size = 80,
  speed = 0.25, // scrollY * speed = derece (0.25 => 1000px scroll ≈ 250deg)
  offset = 10,  // köşeden boşluk (px)
}) {
  const imgRef = useRef(null);
  const rafRef = useRef(null);
  const lastRotationRef = useRef(0);

  useEffect(() => {

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) return;

    const onScroll = () => {
      // Scroll eventleri çok sık gelir; rAF ile tek frame'e indiriyoruz

      console.log('scrolling')
      // if (rafRef.current) return;

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;

        const y = window.scrollY || 0;
        const rotation = y * speed; // derece

        if (Math.abs(rotation - lastRotationRef.current) < 0.1) return;
        lastRotationRef.current = rotation;

        if (imgRef.current) {
          imgRef.current.style.transform = `perspective(600px) rotateY(${rotation}deg)`;
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // ilk render'da da ayarlasın

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [speed]);

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      style={{
        position: "fixed",
        top: offset,
        right: offset,
        height: size,
        zIndex: 9999,
        pointerEvents: "none",
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
    />
  );
}
