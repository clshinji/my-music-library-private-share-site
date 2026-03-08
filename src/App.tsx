import { useState, useCallback } from "react";
import type { Track, Album, Artist } from "./types/music";
import catalogData from "./data/catalog.json";
import { useAuth } from "./hooks/useAuth";
import { useAudioPlayer } from "./hooks/useAudioPlayer";
import { usePlaylist } from "./hooks/usePlaylist";
import { useFavorites } from "./hooks/useFavorites";
import PasswordGate from "./components/PasswordGate";
import Sidebar from "./components/Sidebar";
import Player from "./components/Player";
import RecommendedPlaylists from "./components/RecommendedPlaylists";
import MobileNav from "./components/MobileNav";

const catalog = catalogData as { artists: Artist[]; generatedAt: string };

function findTrackContext(trackId: string) {
  for (const artist of catalog.artists) {
    for (const album of artist.albums) {
      if (album.tracks.some((t) => t.id === trackId)) {
        return { artist, album };
      }
    }
  }
  return null;
}

function App() {
  const { isAuthenticated, login } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileView, setMobileView] = useState<"home" | "player">("home");
  const [currentAlbum, setCurrentAlbum] = useState<Album | null>(null);
  const [currentArtist, setCurrentArtist] = useState<Artist | null>(null);

  const playlist = usePlaylist();
  const { isFavorite, toggleFavorite } = useFavorites();

  const handleTrackEnd = useCallback(() => {
    const nextTrack = playlist.next();
    if (nextTrack) {
      audio.play(nextTrack);
      const ctx = findTrackContext(nextTrack.id);
      if (ctx) {
        setCurrentAlbum(ctx.album);
        setCurrentArtist(ctx.artist);
      }
    }
  }, []);

  const audio = useAudioPlayer(handleTrackEnd);

  const handlePlayTrack = useCallback(
    (track: Track, album: Album, artist: Artist) => {
      setCurrentAlbum(album);
      setCurrentArtist(artist);
      const startIndex = album.tracks.findIndex((t) => t.id === track.id);
      playlist.setQueue(album.tracks, startIndex >= 0 ? startIndex : 0);
      audio.play(track);
      setMobileView("player");
    },
    [audio, playlist]
  );

  const handlePlayPlaylist = useCallback(
    (tracks: Track[], startIndex: number) => {
      if (tracks.length === 0) return;
      const track = tracks[startIndex];
      const ctx = findTrackContext(track.id);
      if (ctx) {
        setCurrentAlbum(ctx.album);
        setCurrentArtist(ctx.artist);
      }
      playlist.setQueue(tracks, startIndex);
      audio.play(track);
      setMobileView("player");
    },
    [audio, playlist]
  );

  const playAndUpdateContext = useCallback(
    (track: Track) => {
      const ctx = findTrackContext(track.id);
      if (ctx) {
        setCurrentAlbum(ctx.album);
        setCurrentArtist(ctx.artist);
      }
      audio.play(track);
    },
    [audio]
  );

  const handleNext = useCallback(() => {
    const next = playlist.next();
    if (next) playAndUpdateContext(next);
  }, [playlist, playAndUpdateContext]);

  const handlePrev = useCallback(() => {
    if (audio.currentTime > 3) {
      audio.seek(0);
      return;
    }
    const prev = playlist.prev();
    if (prev) playAndUpdateContext(prev);
  }, [audio, playlist, playAndUpdateContext]);

  const handlePlayTrackAt = useCallback(
    (index: number) => {
      const track = playlist.playTrackAt(index);
      if (track) playAndUpdateContext(track);
    },
    [playlist, playAndUpdateContext]
  );

  if (!isAuthenticated) {
    return <PasswordGate onLogin={login} />;
  }

  return (
    <div className="h-full flex flex-col md:flex-row">
      {/* デスクトップサイドバー */}
      <div className="hidden md:block w-80 shrink-0 border-r border-bg-tertiary">
        <Sidebar
          artists={catalog.artists}
          currentTrack={audio.currentTrack}
          onPlayTrack={handlePlayTrack}
        />
      </div>

      {/* モバイルサイドバー（オーバーレイ） */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-80 max-w-[85vw] h-full">
            <Sidebar
              artists={catalog.artists}
              currentTrack={audio.currentTrack}
              onPlayTrack={handlePlayTrack}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      <div className={`flex-1 min-w-0 flex flex-col ${audio.currentTrack ? "pb-24" : "pb-14"} md:pb-0`}>
        {/* ホームビュー */}
        <div className={`flex-1 overflow-y-auto ${mobileView === "player" && !currentAlbum ? "" : mobileView === "player" ? "hidden md:block" : ""}`}>
          <div className="p-4 md:p-8">
            <RecommendedPlaylists
              artists={catalog.artists}
              onPlayPlaylist={handlePlayPlaylist}
            />

            <h2 className="text-xl font-bold mb-4 px-2">全アルバム</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {catalog.artists.flatMap((artist) =>
                artist.albums.map((album) => {
                  const artworkSrc = album.artworkPath.replace(
                    /^\/artwork\//,
                    "/src/assets/artwork/"
                  );
                  return (
                    <button
                      key={album.id}
                      onClick={() => handlePlayTrack(album.tracks[0], album, artist)}
                      className="bg-bg-secondary hover:bg-bg-tertiary rounded-xl p-3 text-left transition-colors group"
                    >
                      <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-bg-tertiary relative">
                        <img src={artworkSrc} alt={album.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                          <svg width="40" height="40" fill="white" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                      <p className="font-medium text-sm truncate">{album.name.replace(/^\d+_/, "")}</p>
                      <p className="text-text-secondary text-xs truncate mt-0.5">{artist.name}</p>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* プレイヤービュー */}
        <div className={`${mobileView === "home" && !audio.currentTrack ? "hidden" : mobileView === "home" ? "hidden md:flex" : "flex"} flex-col ${mobileView === "player" ? "flex-1" : ""}`}>
          {mobileView === "player" && (
            <button onClick={() => setMobileView("home")} className="md:hidden p-3 text-text-secondary">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <Player
            currentTrack={audio.currentTrack}
            currentAlbum={currentAlbum}
            currentArtist={currentArtist}
            isPlaying={audio.isPlaying}
            currentTime={audio.currentTime}
            duration={audio.duration}
            volume={audio.volume}
            shuffle={playlist.shuffle}
            repeat={playlist.repeat}
            queue={playlist.queue}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
            onTogglePlay={audio.togglePlay}
            onNext={handleNext}
            onPrev={handlePrev}
            onSeek={audio.seek}
            onVolumeChange={audio.setVolume}
            onToggleShuffle={playlist.toggleShuffle}
            onToggleRepeat={playlist.toggleRepeat}
            onPlayTrackAt={handlePlayTrackAt}
          />
        </div>
      </div>

      <MobileNav
        currentTrack={audio.currentTrack}
        isPlaying={audio.isPlaying}
        onTogglePlay={audio.togglePlay}
        onOpenSidebar={() => setSidebarOpen(true)}
        onOpenPlayer={() => setMobileView("player")}
      />
    </div>
  );
}

export default App;
