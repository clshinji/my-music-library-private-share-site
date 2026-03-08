import type { Track, Album, Artist } from "../types/music";
import NowPlaying from "./NowPlaying";
import PlayerControls from "./PlayerControls";
import ProgressBar from "./ProgressBar";
import TrackList from "./TrackList";
import { getAlbumDisplayName } from "../utils/naming";

interface Props {
  currentTrack: Track | null;
  currentAlbum: Album | null;
  currentArtist: Artist | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  repeat: "none" | "all" | "one";
  queue: Track[];
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onPlayTrackAt: (index: number) => void;
}

export default function Player({
  currentTrack,
  currentAlbum,
  currentArtist,
  isPlaying,
  currentTime,
  duration,
  volume,
  shuffle,
  repeat,
  queue,
  isFavorite,
  onToggleFavorite,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  onToggleShuffle,
  onToggleRepeat,
  onPlayTrackAt,
}: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 md:px-8">
        <NowPlaying
          track={currentTrack}
          album={currentAlbum}
          artist={currentArtist}
          isFavorite={currentTrack ? isFavorite(currentTrack.id) : false}
          onToggleFavorite={() => currentTrack && onToggleFavorite(currentTrack.id)}
        />

        {currentAlbum && (
          <div className="mt-6 mb-4">
            <h3 className="text-lg font-semibold mb-3">
              {getAlbumDisplayName(currentAlbum.name)}
            </h3>
            <TrackList
              tracks={queue.length > 0 ? queue : currentAlbum.tracks}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onPlayTrack={(track) => {
                const idx = queue.findIndex((t) => t.id === track.id);
                if (idx >= 0) onPlayTrackAt(idx);
              }}
              isFavorite={isFavorite}
              onToggleFavorite={onToggleFavorite}
            />
          </div>
        )}
      </div>

      {/* 固定プレイヤーバー */}
      <div className="border-t border-bg-tertiary bg-bg-secondary px-4 py-3 space-y-2">
        <ProgressBar
          currentTime={currentTime}
          duration={duration}
          onSeek={onSeek}
        />
        <PlayerControls
          isPlaying={isPlaying}
          shuffle={shuffle}
          repeat={repeat}
          volume={volume}
          onTogglePlay={onTogglePlay}
          onNext={onNext}
          onPrev={onPrev}
          onToggleShuffle={onToggleShuffle}
          onToggleRepeat={onToggleRepeat}
          onVolumeChange={onVolumeChange}
        />
      </div>
    </div>
  );
}
