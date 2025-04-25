"use client";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Trophy, XIcon } from "lucide-react";
import Link from "next/link";

export function AnnouncementBar() {
  const [showBanner, setShowBanner] = useState(true);
  const [progress, setProgress] = useState(100);
  const [isFirstRender, setIsFirstRender] = useState(true);

  // Auto-close timer - only on first render
  useEffect(() => {
    if (!showBanner || !isFirstRender) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          setShowBanner(false);
          setIsFirstRender(false);
          return 0;
        }
        return prev - 0.5;
      });
    }, 25);

    return () => clearInterval(interval);
  }, [showBanner, isFirstRender]);

  // Reset progress when banner is shown on first render only
  useEffect(() => {
    if (showBanner && isFirstRender) {
      setProgress(100);
    }
  }, [showBanner, isFirstRender]);

  return (
    <div className="fixed z-50 top-0 left-0 w-full">
      {/* Banner */}
      <div
        className={`
          absolute top-0 left-0 w-full
          min-h-[2.5rem] md:h-10 
          bg-muted shadow-md
          flex items-center justify-center px-4
          transition-all duration-300 ease-in-out origin-top-right
          ${
            showBanner
              ? "scale-100 opacity-100 translate-y-0"
              : "scale-0 opacity-0 -translate-y-full"
          }
        `}
      >
        <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 py-1 md:py-0 text-xs md:text-sm font-medium">
          <Link
            href="https://youtu.be/KDRwgbwq0_c?t=1143"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            🏆 We won the first global ▲ Next.js Hackathon!
          </Link>
          <span className="hidden md:inline">•</span>
          <Link
            href="https://github.com/crafter-station/text0"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            Star the repo ⭐
          </Link>
        </div>

        {/* Progress Bar - only show on first render */}
        {isFirstRender && (
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-transparent">
            <div
              className="h-full bg-yellow-500 transition-all duration-[25ms] ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Control Button */}
      <Button
        onClick={() => setShowBanner((prev) => !prev)}
        variant="ghost"
        size="icon"
        className={`
          fixed z-[51] 
          top-1 right-2 md:right-auto md:left-[75%]
          w-6 h-6 md:w-8 md:h-8 
          rounded-full 
          bg-muted shadow-md
          border border-border
          flex items-center justify-center
          transition-all duration-200
          hover:bg-primary/10
          active:scale-95
        `}
        aria-label={showBanner ? "Close announcement" : "Show announcement"}
      >
        {showBanner ? (
          <XIcon className="w-3 h-3 md:w-4 md:h-4 transition-all duration-200" />
        ) : (
          <Trophy className="w-3 h-3 md:w-4 md:h-4 text-yellow-500 transition-all duration-200" />
        )}
      </Button>
    </div>
  );
}
