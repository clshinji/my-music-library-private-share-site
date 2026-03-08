export function stripPrefix(name: string): string {
  return name.replace(/^\d+_/, "");
}

export function formatDuration(seconds: number | undefined): string {
  if (!seconds) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function getAlbumDisplayName(name: string): string {
  return name.replace(/^\d+_/, "");
}
