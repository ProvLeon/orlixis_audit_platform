"use client";

import React, { useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";

// This component uses GSAP for entrance and scroll-triggered 3D animations.
// Make sure to install it in your project:
//   npm install gsap
// or
//   yarn add gsap
//
// Accent colors use Orlixis teal via CSS variables defined in your globals.css

export default function HeroAnimated() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const subRef = useRef<HTMLParagraphElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);

  const chartWrapRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const pointsRef = useRef<SVGCircleElement[] | null>(null);

  // Mouse-driven subtle 3D tilt
  useEffect(() => {
    const wrap = chartWrapRef.current;
    if (!wrap) return;
    const onMove = (e: MouseEvent) => {
      const rect = wrap.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;
      // Subtle tilt
      wrap.style.transform = `perspective(900px) rotateX(${(-dy * 6).toFixed(2)}deg) rotateY(${(dx * 8).toFixed(
        2
      )}deg) translateZ(0)`;
    };
    const onLeave = () => {
      wrap.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)";
    };
    window.addEventListener("mousemove", onMove);
    wrap.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      wrap.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  // GSAP animations (loaded only on client)
  useLayoutEffect(() => {
    let cleanup = () => { };
    const reduceMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    (async () => {
      // Dynamically import GSAP only on the client
      const gsapMod = await import("gsap");
      const { default: gsap } = gsapMod;
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      const ctx = gsap.context(() => {
        // Entrance animations
        if (!reduceMotion) {
          if (headingRef.current) {
            gsap.fromTo(
              headingRef.current,
              { autoAlpha: 0, y: 24 },
              { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.05 }
            );
          }
          if (subRef.current) {
            gsap.fromTo(
              subRef.current,
              { autoAlpha: 0, y: 16 },
              { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.18 }
            );
          }
          if (ctaRef.current) {
            gsap.fromTo(
              ctaRef.current,
              { autoAlpha: 0, y: 12 },
              { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out", delay: 0.28 }
            );
          }
          if (chartWrapRef.current) {
            gsap.fromTo(
              chartWrapRef.current,
              { autoAlpha: 0, y: 24, rotateX: -4, rotateY: 4 },
              { autoAlpha: 1, y: 0, rotateX: 0, rotateY: 0, duration: 0.9, ease: "power3.out", delay: 0.25 }
            );
          }
        } else {
          // If user prefers reduced motion, ensure everything is visible
          [headingRef.current, subRef.current, ctaRef.current, chartWrapRef.current].forEach((el) => {
            if (el) {
              gsap.set(el, { clearProps: "all", autoAlpha: 1, y: 0, rotateX: 0, rotateY: 0 });
            }
          });
        }

        // Scroll-triggered chart animation
        if (svgRef.current && pathRef.current) {
          const path = pathRef.current;
          const totalLength = path.getTotalLength();

          // Initialize stroke dash for drawing effect
          path.style.strokeDasharray = `${totalLength}`;
          path.style.strokeDashoffset = `${totalLength}`;

          // Points pop-in references
          const pointNodes = Array.from(svgRef.current.querySelectorAll("circle[data-point='true']")) as SVGCircleElement[];
          pointsRef.current = pointNodes;

          // Pre-set points invisible
          if (!reduceMotion) {
            gsap.set(pointNodes, { transformOrigin: "50% 50%", scale: 0.3, autoAlpha: 0 });
          } else {
            gsap.set(pointNodes, { clearProps: "all", autoAlpha: 1, scale: 1 });
          }

          // Timeline scrubbed by scroll
          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top top+=60",
              end: "bottom top+=120",
              scrub: true,
            },
          });

          // Animate the line drawing and slight 3D bump
          tl.to(path, { strokeDashoffset: 0, duration: 2 });

          if (!reduceMotion && chartWrapRef.current) {
            tl.to(
              chartWrapRef.current,
              {
                rotateX: -6,
                rotateY: 6,
                z: 20, // perspective effect
                duration: 1.2,
                transformPerspective: 900,
                transformOrigin: "50% 50%",
                ease: "power1.inOut",
              },
              0.1
            );
          }

          // Stagger points pop as the line draws
          if (!reduceMotion) {
            tl.to(
              pointNodes,
              { autoAlpha: 1, scale: 1, duration: 0.6, stagger: 0.08, ease: "back.out(1.7)" },
              0.35
            );
          }

          // Soft settle
          if (!reduceMotion && chartWrapRef.current) {
            tl.to(
              chartWrapRef.current,
              {
                rotateX: 0,
                rotateY: 0,
                z: 0,
                duration: 0.8,
                ease: "power1.out",
              },
              ">-0.1"
            );
          }
        }
      }, sectionRef);

      cleanup = () => {
        ctx.revert();
        ScrollTrigger.getAll().forEach((t) => t.kill());
      };
    })();

    return () => cleanup();
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden">
      {/* Background wash */}
      <div className="absolute inset-0 bg-gradient-orlixis-subtle pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        {/* Left content */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--orlixis-teal)]/30 bg-[var(--orlixis-teal)]/10 px-3 py-1 text-xs text-[var(--orlixis-teal)] mb-4">
            <SparkleIcon />
            Modern software assurance
          </div>
          <h1 ref={headingRef} className="text-4xl md:text-5xl font-bold leading-tight">
            Secure your codebase with confidence
          </h1>
          <p
            ref={subRef}
            className="mt-4 text-base md:text-lg text-[var(--muted-foreground)] max-w-xl"
          >
            Automated analysis, actionable insights, and professional reporting. Orlixis helps your
            team ship safer software without slowing down.
          </p>
          <div ref={ctaRef} className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href="/auth/signin"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--orlixis-teal)] px-5 py-3 text-[var(--primary-foreground)] font-medium hover:bg-[var(--orlixis-teal-light)] transition-colors"
            >
              Start auditing
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 rounded-md border px-5 py-3 border-[var(--border)] hover:border-[var(--orlixis-teal)] text-[var(--foreground)] hover:text-[var(--orlixis-teal)] transition-colors"
            >
              Explore features
            </a>
          </div>
        </div>

        {/* Right: 3D chart with scroll animation */}
        <div
          ref={chartWrapRef}
          className="relative rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-orlixis p-5 will-change-transform"
          style={{
            transformStyle: "preserve-3d",
            perspective: "900px",
          }}
        >
          <ChartSVG svgRef={svgRef} pathRef={pathRef} />
        </div>
      </div>
    </section>
  );
}

/* ------------------------
   SVG/Icons and helpers
-------------------------*/

function SparkleIcon() {
  // Minimal sparkle in Orlixis teal
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3l1.5 3.8L17 8.5l-3.5 1.2L12 13l-1.5-3.3L7 8.5l3.5-1.7L12 3z"
        fill="var(--orlixis-teal)"
        opacity=".75"
      />
      <path
        d="M18 12l.9 2.2 2.1.9-2.1.9L18 18l-.9-2.2-2.1-.9 2.1-.9.9-2.2z"
        fill="var(--orlixis-teal)"
        opacity=".35"
      />
    </svg>
  );
}

function ChartSVG({
  svgRef,
  pathRef,
}: {
  svgRef: React.MutableRefObject<SVGSVGElement | null>;
  pathRef: React.MutableRefObject<SVGPathElement | null>;
}) {
  // Only Orlixis teal + neutrals
  const teal = "var(--orlixis-teal)";
  const border = "var(--border)";
  const muted = "var(--muted-foreground)";

  // Points for the line
  const points = [
    { x: 30, y: 140 },
    { x: 75, y: 90 },
    { x: 120, y: 110 },
    { x: 165, y: 80 },
    { x: 210, y: 120 },
    { x: 255, y: 60 },
  ];

  // Build path from points
  const d = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 300 190"
      className="w-full h-auto"
      role="img"
      aria-label="Animated security trend chart"
    >
      <defs>
        <linearGradient id="orlixisArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={teal} stopOpacity="0.22" />
          <stop offset="100%" stopColor={teal} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Frame */}
      <rect x="6" y="8" width="288" height="174" rx="10" fill="none" stroke={border} />

      {/* Grid */}
      {[0, 1, 2, 3].map((i) => (
        <line
          key={`h-${i}`}
          x1="18"
          x2="282"
          y1={36 + i * 34}
          y2={36 + i * 34}
          stroke={border}
          opacity="0.6"
        />
      ))}
      <line x1="18" x2="18" y1="36" y2="170" stroke={border} opacity="0.8" />
      <line x1="282" x2="282" y1="36" y2="170" stroke={border} opacity="0.2" />

      {/* Bars (context) */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const h = [60, 100, 86, 125, 72, 140][i];
        return (
          <rect
            key={`b-${i}`}
            x={30 + i * 45}
            y={170 - h}
            width="22"
            height={h}
            rx="4"
            fill={teal}
            opacity={0.16 + i * 0.06}
          />
        );
      })}

      {/* Area under the line */}
      <path
        d={`${d} L 255 170 L 30 170 Z`}
        fill="url(#orlixisArea)"
        opacity="0.6"
        style={{ mixBlendMode: "multiply" }}
      />

      {/* Animated line */}
      <path
        ref={pathRef}
        d={d}
        fill="none"
        stroke={teal}
        strokeWidth={2.5}
        strokeLinecap="round"
        opacity="0.95"
      />

      {/* Points that will pop in during scroll */}
      {points.map((p, i) => (
        <circle
          key={`p-${i}`}
          cx={p.x}
          cy={p.y}
          r="4.25"
          fill={teal}
          opacity="0.9"
          data-point="true"
        />
      ))}

      {/* Axis labels (muted) */}
      <text x="14" y="30" fontSize="8" fill={muted} opacity="0.85">
        Risk
      </text>
      <text x="268" y="182" fontSize="8" fill={muted} opacity="0.7">
        Time
      </text>
    </svg>
  );
}
