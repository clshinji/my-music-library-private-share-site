import type { Track } from "../types/music";

interface Props {
  currentTrack: Track | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onOpenSidebar: () => void;
  onOpenPlayer: () => void;
}

export default function MobileNav({
  currentTrack,
  isPlaying,
  onTogglePlay,
  onOpenSidebar,
  onOpenPlayer,
}: Props) {
  return (
    <>
      {/* ミニプレイヤー（曲再生中のみ表示） */}
      {currentTrack && (
        <div
          onClick={onOpenPlayer}
          className="md:hidden fixed bottom-14 left-0 right-0 bg-bg-secondary border-t border-bg-tertiary px-4 py-2 flex items-center gap-3 z-40 cursor-pointer"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentTrack.title}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlay();
            }}
            className="p-1.5 shrink-0"
          >
            {isPlaying ? (
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* ボトムナビ */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-secondary border-t border-bg-tertiary flex z-50">
        <button
          onClick={onOpenSidebar}
          className="flex-1 flex flex-col items-center py-2 text-text-secondary hover:text-text-primary"
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
          <span className="text-[10px] mt-0.5">ライブラリ</span>
        </button>
        <button
          onClick={onOpenPlayer}
          className="flex-1 flex flex-col items-center py-2 text-text-secondary hover:text-text-primary"
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
          <span className="text-[10px] mt-0.5">再生中</span>
        </button>
      </div>
    </>
  );
}
