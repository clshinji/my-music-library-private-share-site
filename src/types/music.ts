export interface Track {
  id: string;
  trackNumber: number;
  title: string;
  fileName: string;
  format: "m4a" | "mp3";
  s3Key: string;
  duration?: number;
  albumId: string;
  artistId: string;
}

export interface Album {
  id: string;
  name: string;
  artistId: string;
  artworkPath: string;
  tracks: Track[];
}

export interface Artist {
  id: string;
  sortKey: number;
  name: string;
  albums: Album[];
}

export interface Catalog {
  artists: Artist[];
  generatedAt: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  startTrackId: string;
  tracks: Track[];
}
