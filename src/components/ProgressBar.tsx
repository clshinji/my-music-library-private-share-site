import { useRef, useCallback } from "react";
import { formatDuration } from "../utils/naming";

interface Props {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

export default function ProgressBar({ currentTime, duration, onSeek }: Props) {
  const barRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const bar = barRef.current;
      if (!bar || !duration) return;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onSeek(ratio * duration);
    },
    [duration, onSeek]
  );

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 w-full">
      <span className="text-xs text-text-secondary w-10 text-right shrink-0">
        {formatDuration(currentTime)}
      </span>
      <div
        ref={barRef}
        onClick={handleClick}
        className="flex-1 h-1 bg-bg-tertiary rounded-full cursor-pointer group relative"
      >
        <div
          className="h-full bg-accent rounded-full relative"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-accent rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
      <span className="text-xs text-text-secondary w-10 shrink-0">
        {formatDuration(duration)}
      </span>
    </div>
  );
}
