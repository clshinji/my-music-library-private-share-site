import type { Track } from "../types/music";

interface Props {
  track: Track;
}

export default function DownloadButton({ track }: Props) {
  const handleDownload = () => {
    const isLocal = window.location.hostname === "localhost";
    const src = isLocal
      ? `/${track.s3Key.replace("music/", "music-library/")}`
      : `/${track.s3Key}`;

    const a = document.createElement("a");
    a.href = src;
    a.download = track.fileName;
    a.click();
  };

  return (
    <button
      onClick={handleDownload}
      className="p-2 rounded-full text-text-secondary hover:text-text-primary transition-colors"
      title="ダウンロード"
    >
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
      </svg>
    </button>
  );
}
