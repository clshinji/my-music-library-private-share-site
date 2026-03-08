import type { Artist, Track, Album } from "../types/music";

interface PlaylistDef {
  name: string;
  description: string;
  getTracks: (artists: Artist[]) => { tracks: Track[]; startIndex: number; album?: Album } | null;
}

const PLAYLIST_DEFS: PlaylistDef[] = [
  {
    name: "名取交響吹奏楽団（n響）全曲",
    description: "全4大会の演奏を連続再生",
    getTracks: (artists) => {
      const artist = artists.find((a) => a.name.includes("名取"));
      if (!artist) return null;
      const tracks = artist.albums.flatMap((a) => a.tracks);
      return { tracks, startIndex: 0, album: artist.albums[0] };
    },
  },
  {
    name: "プレリュード、フーガ&リフス",
    description: "バーンスタイン・オン・ブラス Track 11から",
    getTracks: (artists) => {
      const artist = artists.find((a) => a.name.includes("シエナ"));
      if (!artist) return null;
      const album = artist.albums.find((a) => a.name.includes("バーンスタイン"));
      if (!album) return null;
      const idx = album.tracks.findIndex((t) => t.trackNumber === 11);
      return { tracks: album.tracks, startIndex: idx >= 0 ? idx : 0, album };
    },
  },
  {
    name: "クラリネット協奏曲 Carousel",
    description: "第31回青少年コンサート Track 07から",
    getTracks: (artists) => {
      const artist = artists.find((a) => a.name.includes("東北"));
      if (!artist) return null;
      const album = artist.albums.find((a) => a.name.includes("31"));
      if (!album) return null;
      const idx = album.tracks.findIndex((t) => t.trackNumber === 7);
      return { tracks: album.tracks, startIndex: idx >= 0 ? idx : 0, album };
    },
  },
  {
    name: "スクーティン・オン・ハードロック",
    description: "CAFUA Selection 2004 Track 05から",
    getTracks: (artists) => {
      const artist = artists.find((a) => a.name.includes("航空"));
      if (!artist) return null;
      const album = artist.albums.find((a) => a.name.includes("CAFUA"));
      if (!album) return null;
      const idx = album.tracks.findIndex((t) => t.trackNumber === 5);
      return { tracks: album.tracks, startIndex: idx >= 0 ? idx : 0, album };
    },
  },
];

interface Props {
  artists: Artist[];
  onPlayPlaylist: (tracks: Track[], startIndex: number) => void;
}

export default function RecommendedPlaylists({ artists, onPlayPlaylist }: Props) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4 px-2">おすすめプレイリスト</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PLAYLIST_DEFS.map((def, i) => {
          const result = def.getTracks(artists);
          if (!result) return null;
          const artworkSrc = result.album?.artworkPath?.replace(
            /^\/artwork\//,
            "/src/assets/artwork/"
          );
          return (
            <button
              key={i}
              onClick={() => onPlayPlaylist(result.tracks, result.startIndex)}
              className="flex items-center gap-3 bg-bg-secondary hover:bg-bg-tertiary rounded-lg p-3 text-left transition-colors group"
            >
              <div className="w-12 h-12 rounded overflow-hidden shrink-0 bg-bg-tertiary">
                {artworkSrc && (
                  <img src={artworkSrc} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{def.name}</p>
                <p className="text-xs text-text-secondary truncate">{def.description}</p>
              </div>
              <svg
                width="24"
                height="24"
                fill="currentColor"
                viewBox="0 0 24 24"
                className="text-accent opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}
