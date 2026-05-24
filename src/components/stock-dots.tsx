"use client";

import { cn } from "@/lib/utils";

interface StockDotsProps {
  available: number;
  total: number;
  label?: string;
  className?: string;
}

const DOTS = 10;

export function StockDots({ available, total, label, className }: StockDotsProps) {
  const filled = total === 0 ? 0 : Math.round((available / total) * DOTS);
  const safe = Math.max(0, Math.min(DOTS, filled));

  const color =
    safe > 6
      ? "bg-[#c6a66b]"
      : safe > 3
        ? "bg-[#745a27]"
        : "bg-[#ba1a1a]";

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <p className="text-[10px] font-semibold text-[#4d463a] tracking-[0.1em] uppercase">
          {label}
        </p>
      )}
      <div className="flex items-center gap-1">
        {Array.from({ length: DOTS }).map((_, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full transition-all duration-500"
            style={{
              animation: i < safe ? `dot-pop 0.35s cubic-bezier(0.22,1,0.36,1) ${i * 0.04}s both` : "none",
              border: `1.5px solid ${i < safe ? "transparent" : "#d0c5b5"}`,
            }}
          >
            <div
              className={cn(
                "w-full h-full rounded-full transition-colors duration-500",
                i < safe ? color : "bg-transparent",
              )}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-[#4d463a]">
        <span>{available} free</span>
        <span>{total} total</span>
      </div>
    </div>
  );
}
