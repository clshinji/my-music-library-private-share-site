import type { Track } from "../types/music";
import { formatDuration } from "../utils/naming";
import FavoriteButton from "./FavoriteButton";

interface Props {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
}

export default function TrackList({
  tracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  isFavorite,
  onToggleFavorite,
}: Props) {
  return (
    <div className="w-full">
      {tracks.map((track, index) => {
        const isCurrent = currentTrack?.id === track.id;
        return (
          <div
            key={track.id}
            onClick={() => onPlayTrack(track)}
            className={`flex items-center gap-3 px-4 py-3 sm:py-2.5 rounded-lg cursor-pointer transition-colors group ${
              isCurrent ? "bg-accent/15 border-l-2 border-accent" : "hover:bg-bg-hover border-l-2 border-transparent"
            }`}
          >
            <div className="w-8 text-center shrink-0">
              {isCurrent && isPlaying ? (
                <div className="flex items-end justify-center gap-0.5 h-4">
                  <div className="w-0.5 bg-accent" style={{ animation: "equalizer-1 0.8s ease-in-out infinite" }} />
                  <div className="w-0.5 bg-accent" style={{ animation: "equalizer-2 0.8s ease-in-out infinite" }} />
                  <div className="w-0.5 bg-accent" style={{ animation: "equalizer-3 0.8s ease-in-out infinite" }} />
                </div>
              ) : (
                <span className={`text-sm ${isCurrent ? "text-accent" : "text-text-secondary"}`}>
                  {index + 1}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm truncate ${isCurrent ? "text-accent font-medium" : "text-text-primary"}`}>
                {track.title}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <FavoriteButton
                  isFavorite={isFavorite(track.id)}
                  onToggle={() => onToggleFavorite(track.id)}
                  size={18}
                />
              </div>
              <span className="text-xs text-text-secondary w-10 text-right">
                {formatDuration(track.duration)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
