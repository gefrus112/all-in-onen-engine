// AllyAvatar — the official Ally-5 mascot.
// A cute, smiling AI orb with big glossy eyes, blush cheeks and an antenna
// sparkle. Pure inline SVG, animated with CSS (blink + sparkle pulse + float).
"use client";

import React from "react";

export type AllyMood = "happy" | "thinking" | "wink";

interface AllyAvatarProps {
  /** rendered pixel size (width & height) */
  size?: number;
  mood?: AllyMood;
  /** disable idle animations (for tiny sizes or static contexts) */
  still?: boolean;
  className?: string;
  title?: string;
}

/**
 * The Ally-5 face. ViewBox is 64x64; the orb body sits at cy=36 so the
 * antenna + sparkle have room above the head.
 */
export function AllyAvatar({ size = 32, mood = "happy", still = false, className, title }: AllyAvatarProps) {
  const anim = still ? "" : " ally-av-live";
  return (
    <span
      className={`ally-av${anim} ${className ?? ""}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={title ?? "Ally-5 mascot"}
    >
      <svg viewBox="0 0 64 64" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
        <title>{title ?? "Ally-5 mascot"}</title>
        <defs>
          <linearGradient id="allyBody" x1="10" y1="14" x2="54" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#5eead4" />
            <stop offset="0.45" stopColor="#22d3ee" />
            <stop offset="1" stopColor="#6366f1" />
          </linearGradient>
          <radialGradient id="allyShine" cx="0.32" cy="0.24" r="0.75">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <filter id="allySoft" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2.2" floodColor="#22d3ee" floodOpacity="0.45" />
          </filter>
        </defs>

        {/* antenna */}
        <g className="ally-av-antenna">
          <path d="M32 15 C32 11 30.5 9.5 29 8" stroke="url(#allyBody)" strokeWidth="2.4" strokeLinecap="round" />
          {/* 4-point sparkle star */}
          <path
            className="ally-av-star"
            d="M29 1.6 L30.4 5.6 L34.4 7 L30.4 8.4 L29 12.4 L27.6 8.4 L23.6 7 L27.6 5.6 Z"
            fill="#fde68a"
          />
        </g>

        {/* body */}
        <g filter="url(#allySoft)">
          <circle cx="32" cy="38" r="23" fill="url(#allyBody)" />
          <circle cx="32" cy="38" r="23" fill="url(#allyShine)" />
          {/* rim light */}
          <path d="M14.5 47 A23 23 0 0 0 49.5 47" stroke="rgba(255,255,255,0.35)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        </g>

        {/* eyes */}
        <g className="ally-av-eyes">
          {mood === "wink" ? (
            <>
              <ellipse cx="24" cy="36.5" rx="3.6" ry="5" fill="#0b1020" />
              <circle cx="25.3" cy="34.6" r="1.5" fill="#ffffff" />
              <path d="M40.5 36.5 q3.2 -3 6.4 0" stroke="#0b1020" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            </>
          ) : (
            <>
              <ellipse cx="24" cy="36.5" rx="3.6" ry="5" fill="#0b1020" />
              <ellipse cx="41" cy="36.5" rx="3.6" ry="5" fill="#0b1020" />
              <circle cx="25.3" cy="34.6" r="1.5" fill="#ffffff" />
              <circle cx="42.3" cy="34.6" r="1.5" fill="#ffffff" />
              <circle cx="22.8" cy="38.8" r="0.8" fill="#7dd3fc" opacity="0.9" />
              <circle cx="39.8" cy="38.8" r="0.8" fill="#7dd3fc" opacity="0.9" />
            </>
          )}
        </g>

        {/* blush */}
        <ellipse className="ally-av-blush" cx="16.5" cy="42.5" rx="3.4" ry="2" fill="#f472b6" opacity="0.55" />
        <ellipse className="ally-av-blush" cx="48.5" cy="42.5" rx="3.4" ry="2" fill="#f472b6" opacity="0.55" />

        {/* mouth */}
        {mood === "thinking" ? (
          <circle cx="33" cy="45.5" r="1.7" fill="#0b1020" />
        ) : (
          <path d="M26.5 43.5 Q32.5 49.5 38.5 43.5" stroke="#0b1020" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        )}
        {/* tongue highlight on the smile */}
        {mood === "happy" && <path d="M30 46.4 Q32.5 48.2 35 46.4" stroke="#f472b6" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.85" />}
      </svg>
    </span>
  );
}
