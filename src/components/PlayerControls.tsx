interface Props {
  isPlaying: boolean;
  shuffle: boolean;
  repeat: "none" | "all" | "one";
  volume: number;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onVolumeChange: (vol: number) => void;
}

export default function PlayerControls({
  isPlaying,
  shuffle,
  repeat,
  volume,
  onTogglePlay,
  onNext,
  onPrev,
  onToggleShuffle,
  onToggleRepeat,
  onVolumeChange,
}: Props) {
  return (
    <div className="flex items-center justify-center gap-4">
      {/* Shuffle */}
      <button
        onClick={onToggleShuffle}
        className={`p-2 rounded-full transition-colors ${shuffle ? "text-accent" : "text-text-secondary hover:text-text-primary"}`}
        title="シャッフル"
      >
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
        </svg>
      </button>

      {/* Previous */}
      <button onClick={onPrev} className="p-2 text-text-secondary hover:text-text-primary transition-colors">
        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
        </svg>
      </button>

      {/* Play/Pause */}
      <button
        onClick={onTogglePlay}
        className="w-12 h-12 bg-text-primary rounded-full flex items-center justify-center hover:scale-105 transition-transform"
      >
        {isPlaying ? (
          <svg width="24" height="24" fill="#0f0f0f" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg width="24" height="24" fill="#0f0f0f" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Next */}
      <button onClick={onNext} className="p-2 text-text-secondary hover:text-text-primary transition-colors">
        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
        </svg>
      </button>

      {/* Repeat */}
      <button
        onClick={onToggleRepeat}
        className={`p-2 rounded-full transition-colors relative ${repeat !== "none" ? "text-accent" : "text-text-secondary hover:text-text-primary"}`}
        title={repeat === "one" ? "1曲リピート" : repeat === "all" ? "全曲リピート" : "リピートオフ"}
      >
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
        </svg>
        {repeat === "one" && (
          <span className="absolute -top-1 -right-1 text-[10px] font-bold text-accent">1</span>
        )}
      </button>

      {/* Volume */}
      <div className="hidden md:flex items-center gap-2 ml-4">
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" className="text-text-secondary">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
        </svg>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="w-20"
        />
      </div>
    </div>
  );
}
