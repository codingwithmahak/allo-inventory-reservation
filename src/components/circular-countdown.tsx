"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CircularCountdownProps {
  expiresAt: string;
  durationMinutes?: number;
  onExpired: () => void;
  className?: string;
}

export function CircularCountdown({
  expiresAt,
  durationMinutes = 10,
  onExpired,
  className,
}: CircularCountdownProps) {
  const [timeLeft, setTimeLeft] = useState("");
  const [progress, setProgress] = useState(1);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    function tick() {
      const now = Date.now();
      const expiry = new Date(expiresAt).getTime();
      const created = expiry - durationMinutes * 60 * 1000;
      const total = expiry - created;
      const remaining = expiry - now;

      if (remaining <= 0) {
        setTimeLeft("0:00");
        setProgress(0);
        if (!expired) {
          setExpired(true);
          onExpired();
        }
        return;
      }

      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      setProgress(Math.max(0, Math.min(1, remaining / total)));
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, durationMinutes, onExpired, expired]);

  const circumference = 2 * Math.PI * 64;
  const offset = circumference * (1 - progress);

  const ringColor =
    progress > 0.5
      ? "stroke-[#c6a66b]"
      : progress > 0.25
        ? "stroke-[#745a27]"
        : "stroke-[#ba1a1a]";

  const textColor =
    progress > 0.5
      ? "text-[#1b1c19]"
      : progress > 0.25
        ? "text-[#745a27]"
        : "text-[#ba1a1a]";

  const label =
    expired ? "Expired"
    : progress > 0.5 ? "Time left"
    : progress > 0.25 ? "Running out"
    : "Expiring soon";

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg className="w-40 h-40 -rotate-90" viewBox="0 0 140 140">
        <circle
          cx="70"
          cy="70"
          r="64"
          fill="none"
          stroke="#d0c5b5"
          strokeWidth="4"
          opacity="0.4"
        />
        <circle
          cx="70"
          cy="70"
          r="64"
          fill="none"
          className={cn(
            "transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]",
            ringColor,
          )}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            "text-3xl font-bold font-['Playfair_Display'] tracking-tight",
            textColor,
          )}
        >
          {expired ? "0:00" : timeLeft}
        </span>
        <span className="text-[10px] font-semibold text-[#4d463a] tracking-[0.1em] uppercase mt-0.5">
          {label}
        </span>
      </div>
    </div>
  );
}
