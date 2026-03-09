import { useState } from "react";
import type { Artist, Album, Track } from "../types/music";
import { getAlbumDisplayName, formatDuration } from "../utils/naming";

interface Props {
  artists: Artist[];
  currentTrack: Track | null;
  onPlayTrack: (track: Track, album: Album, artist: Artist) => void;
  onClose?: () => void;
}

export default function Sidebar({ artists, currentTrack, onPlayTrack, onClose }: Props) {
  const [expandedArtists, setExpandedArtists] = useState<Set<string>>(new Set());
  const [expandedAlbums, setExpandedAlbums] = useState<Set<string>>(new Set());

  const currentArtistId = (() => {
    if (!currentTrack) return null;
    for (const artist of artists) {
      for (const album of artist.albums) {
        if (album.tracks.some((t) => t.id === currentTrack.id)) return artist.id;
      }
    }
    return null;
  })();

  const toggleArtist = (id: string) => {
    setExpandedArtists((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAlbum = (id: string) => {
    setExpandedAlbums((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col bg-bg-secondary">
      <div className="flex items-center justify-between p-4 border-b border-bg-tertiary bg-gradient-to-b from-bg-elevated/30 to-transparent">
        <h2 className="text-lg font-bold">ライブラリ</h2>
        {onClose && (
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {artists.map((artist) => (
          <div key={artist.id} className="mb-1">
            <button
              onClick={() => toggleArtist(artist.id)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-bg-hover text-left transition-colors"
            >
              <svg
                width="16"
                height="16"
                fill="currentColor"
                className={`shrink-0 transition-transform ${expandedArtists.has(artist.id) ? "rotate-90" : ""}`}
              >
                <path d="M6 3l6 5-6 5V3z" />
              </svg>
              <span className="font-medium truncate flex items-center gap-1.5">
                {currentArtistId === artist.id && (
                  <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                )}
                {artist.name}
              </span>
              <span className="text-text-secondary text-xs ml-auto shrink-0">
                {artist.albums.reduce((n, a) => n + a.tracks.length, 0)}曲
              </span>
            </button>

            {expandedArtists.has(artist.id) && (
              <div className="ml-4 border-l-2 border-bg-tertiary">
                {artist.albums.map((album) => (
                  <div key={album.id} className="mb-0.5">
                    <button
                      onClick={() => toggleAlbum(album.id)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-bg-hover text-left text-sm transition-colors"
                    >
                      <div className="w-4 h-4 rounded overflow-hidden shrink-0 bg-bg-tertiary">
                        <img src={album.artworkPath} alt="" className="w-full h-full object-cover" />
                      </div>
                      <svg
                        width="14"
                        height="14"
                        fill="currentColor"
                        className={`shrink-0 transition-transform text-text-secondary ${expandedAlbums.has(album.id) ? "rotate-90" : ""}`}
                      >
                        <path d="M5 2.5l5 4.5-5 4.5V2.5z" />
                      </svg>
                      <span className="truncate text-text-secondary hover:text-text-primary">
                        {getAlbumDisplayName(album.name)}
                      </span>
                    </button>

                    {expandedAlbums.has(album.id) && (
                      <div className="ml-4">
                        {album.tracks.map((track) => (
                          <button
                            key={track.id}
                            onClick={() => {
                              onPlayTrack(track, album, artist);
                              onClose?.();
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-1 rounded-lg text-left text-sm transition-colors ${
                              currentTrack?.id === track.id
                                ? "bg-accent/20 text-accent"
                                : "hover:bg-bg-hover text-text-secondary"
                            }`}
                          >
                            <span className="w-5 text-right shrink-0 text-xs opacity-50">
                              {track.trackNumber}
                            </span>
                            <span className="truncate flex-1">{track.title}</span>
                            <span className="text-xs opacity-50 shrink-0">
                              {formatDuration(track.duration)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
