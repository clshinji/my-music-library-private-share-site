import type { Track, Artist } from "../types/music";

interface Props {
  currentTrack: Track | null;
  currentArtist?: Artist | null;
  isPlaying: boolean;
  currentTime?: number;
  duration?: number;
  mobileView: "home" | "player";
  onTogglePlay: () => void;
  onOpenSidebar: () => void;
  onOpenPlayer: () => void;
}

export default function MobileNav({
  currentTrack,
  currentArtist,
  isPlaying,
  currentTime = 0,
  duration = 0,
  mobileView,
  onTogglePlay,
  onOpenSidebar,
  onOpenPlayer,
}: Props) {
  if (mobileView === "player") return null;

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* ミニプレイヤー（曲再生中かつフルプレイヤー非表示時のみ） */}
      {currentTrack && (
        <div
          onClick={onOpenPlayer}
          className="md:hidden fixed bottom-14 left-0 right-0 bg-bg-secondary border-t border-bg-tertiary/50 z-40 cursor-pointer"
        >
          {/* 極細プログレスバー */}
          <div className="h-0.5 bg-bg-tertiary">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="px-4 py-2 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentTrack.title}</p>
              {currentArtist && (
                <p className="text-xs text-text-secondary truncate">{currentArtist.name}</p>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePlay();
              }}
              className="p-2.5 shrink-0"
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
        </div>
      )}

      {/* ボトムナビ */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-secondary border-t border-bg-tertiary/50 flex z-50 pb-[env(safe-area-inset-bottom)]">
        <button
          onClick={onOpenSidebar}
          className="flex-1 flex flex-col items-center py-3 text-text-secondary hover:text-text-primary"
        >
          {/* フォルダアイコン */}
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
          </svg>
          <span className="text-[10px] mt-0.5">ライブラリ</span>
        </button>
        <button
          onClick={onOpenPlayer}
          className="flex-1 flex flex-col items-center py-3 text-text-secondary hover:text-text-primary"
        >
          {/* イコライザーバー風アイコン */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <rect x="4" y="10" width="3" height="10" rx="1" />
            <rect x="10.5" y="4" width="3" height="16" rx="1" />
            <rect x="17" y="7" width="3" height="13" rx="1" />
          </svg>
          <span className="text-[10px] mt-0.5">再生中</span>
        </button>
      </div>
    </>
  );
}
