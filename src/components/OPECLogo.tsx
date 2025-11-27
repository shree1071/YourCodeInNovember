// OPEC Logo Component - Colorful circular logo with 6 figures
import { cn } from "@/lib/utils";

interface OPECLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: "w-12 h-12",
  md: "w-16 h-16",
  lg: "w-24 h-24",
  xl: "w-32 h-32",
};

export function OPECLogo({ className, size = "md" }: OPECLogoProps) {
  return (
    <div className={cn("relative", sizeMap[size], className)}>
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Red figure - Top */}
        <g transform="translate(60, 10)">
          <circle cx="0" cy="0" r="8" fill="#EF4444" />
          <path
            d="M -6 8 Q 0 20 6 8"
            stroke="#EF4444"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </g>

        {/* Periwinkle Blue - Top Right */}
        <g transform="translate(95, 30) rotate(60)">
          <circle cx="0" cy="0" r="8" fill="#8B5CF6" />
          <path
            d="M -6 8 Q 0 20 6 8"
            stroke="#8B5CF6"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </g>

        {/* Sky Blue - Bottom Right */}
        <g transform="translate(95, 90) rotate(120)">
          <circle cx="0" cy="0" r="8" fill="#06B6D4" />
          <path
            d="M -6 8 Q 0 20 6 8"
            stroke="#06B6D4"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </g>

        {/* Lime Green - Bottom */}
        <g transform="translate(60, 110) rotate(180)">
          <circle cx="0" cy="0" r="8" fill="#84CC16" />
          <path
            d="M -6 8 Q 0 20 6 8"
            stroke="#84CC16"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </g>

        {/* Orange - Bottom Left */}
        <g transform="translate(25, 90) rotate(240)">
          <circle cx="0" cy="0" r="8" fill="#F97316" />
          <path
            d="M -6 8 Q 0 20 6 8"
            stroke="#F97316"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </g>

        {/* Yellow - Top Left */}
        <g transform="translate(25, 30) rotate(300)">
          <circle cx="0" cy="0" r="8" fill="#EAB308" />
          <path
            d="M -6 8 Q 0 20 6 8"
            stroke="#EAB308"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
}

