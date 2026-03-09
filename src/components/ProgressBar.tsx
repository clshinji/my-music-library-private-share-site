import { useRef, useCallback } from "react";
import { formatDuration } from "../utils/naming";

interface Props {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

export default function ProgressBar({ currentTime, duration, onSeek }: Props) {
  const barRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const getSeekRatio = useCallback(
    (clientX: number) => {
      const bar = barRef.current;
      if (!bar || !duration) return null;
      const rect = bar.getBoundingClientRect();
      return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    },
    [duration]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const ratio = getSeekRatio(e.clientX);
      if (ratio !== null) onSeek(ratio * duration);
    },
    [duration, onSeek, getSeekRatio]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      isDragging.current = true;
      const ratio = getSeekRatio(e.touches[0].clientX);
      if (ratio !== null) onSeek(ratio * duration);
    },
    [duration, onSeek, getSeekRatio]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!isDragging.current) return;
      const ratio = getSeekRatio(e.touches[0].clientX);
      if (ratio !== null) onSeek(ratio * duration);
    },
    [duration, onSeek, getSeekRatio]
  );

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 w-full">
      <span className="text-xs text-text-secondary w-10 text-right shrink-0">
        {formatDuration(currentTime)}
      </span>
      <div
        ref={barRef}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex-1 py-3 cursor-pointer group relative"
      >
        <div className="h-1 group-hover:h-1.5 bg-bg-tertiary rounded-full transition-all">
          <div
            className="h-full bg-accent rounded-full relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-accent rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md" />
          </div>
        </div>
      </div>
      <span className="text-xs text-text-secondary w-10 shrink-0">
        {formatDuration(duration)}
      </span>
    </div>
  );
}
