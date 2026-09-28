"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export function AveryPortrait({
  src,
  className,
  size = 48,
}: {
  src?: string | null;
  className?: string;
  size?: number;
}) {
  if (src) {
    return (
      // External portrait URLs come from server env, not user input.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt="Portrait of Avery, an AI team member at AudioLink"
        width={size}
        height={size}
        className={cn("rounded-full object-cover", className)}
      />
    );
  }

  return <PortraitMark className={className} size={size} />;
}

function PortraitMark({ className, size }: { className?: string; size: number }) {
  const clipId = useId().replace(/:/g, "");

  return (
    <svg
      viewBox="0 0 160 160"
      width={size}
      height={size}
      role="img"
      aria-label="Portrait of Avery, an AI team member at AudioLink"
      className={cn("rounded-full", className)}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="80" cy="80" r="80" />
        </clipPath>
        <linearGradient id={`${clipId}-bg`} x1="20" y1="0" x2="140" y2="160">
          <stop offset="0" stopColor="#315e66" />
          <stop offset="1" stopColor="#1b3338" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${clipId})}>
        <rect width="160" height="160" fill={`url(#${clipId}-bg)`} />
        <circle cx="118" cy="28" r="26" fill="#c9844a" opacity="0.35" />
        <path
          d="M18 168c8-46 32-62 62-62s54 16 62 62"
          fill="#1f6a64"
        />
        <path d="M58 118c6 18 38 18 44 0 2 16-8 28-22 28s-24-12-22-28z" fill="#e6c2a6" />
        <ellipse cx="80" cy="86" rx="34" ry="38" fill="#f0d0b6" />
        <path
          d="M46 86c2-40 18-58 34-58 18 0 34 16 36 42-8-10-18-14-28-12-8 2-12 8-16 8-6 0-10-8-20-6-8 2-8 14-6 26z"
          fill="#3c2a24"
        />
        <path
          d="M44 92c-2 22 4 40 10 44 2-16 4-30 2-44-4-2-8-2-12 0z"
          fill="#3c2a24"
        />
        <path
          d="M112 78c6 2 12 10 12 28 0 16-4 30-8 38 6-8 12-28 8-48-4-8-8-16-12-18z"
          fill="#3c2a24"
        />
        <ellipse cx="68" cy="88" rx="3.4" ry="4" fill="#2b241f" />
        <ellipse cx="94" cy="88" rx="3.4" ry="4" fill="#2b241f" />
        <path
          d="M62 78c4-4 10-4 14-1"
          fill="none"
          stroke="#3c2a24"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M86 77c4-3 10-3 14 1"
          fill="none"
          stroke="#3c2a24"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M70 104c6 7 16 7 22 0"
          fill="none"
          stroke="#a86a52"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
