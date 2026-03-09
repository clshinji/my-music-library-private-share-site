import type { Track, Album, Artist } from "../types/music";
import { getAlbumDisplayName } from "../utils/naming";
import FavoriteButton from "./FavoriteButton";
import DownloadButton from "./DownloadButton";

interface Props {
  track: Track | null;
  album: Album | null;
  artist: Artist | null;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export default function NowPlaying({ track, album, artist, isFavorite, onToggleFavorite }: Props) {
  if (!track || !album) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
        <svg width="64" height="64" fill="currentColor" viewBox="0 0 24 24" className="opacity-30 mb-4">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
        <p>曲を選択してください</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="w-64 h-64 md:w-80 md:h-80 rounded-xl overflow-hidden shadow-2xl">
        <img
          src={album.artworkPath}
          alt={album.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "data:image/svg+xml," +
              encodeURIComponent(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><rect fill="#252525" width="300" height="300"/><text fill="#666" font-size="48" text-anchor="middle" x="150" y="160">♪</text></svg>'
              );
          }}
        />
      </div>
      <div className="text-center max-w-sm">
        <h2 className="text-xl font-bold truncate">{track.title}</h2>
        <p className="text-text-secondary mt-1 truncate">
          {artist?.name} — {getAlbumDisplayName(album.name)}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <FavoriteButton isFavorite={isFavorite} onToggle={onToggleFavorite} />
        <DownloadButton track={track} />
      </div>
    </div>
  );
}
