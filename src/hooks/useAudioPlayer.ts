import { useState, useRef, useCallback, useEffect } from "react";
import type { Track } from "../types/music";

interface AudioPlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackError: string | null;
}

export function useAudioPlayer(onTrackEnd?: () => void) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<AudioPlayerState>({
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    playbackError: null,
  });

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    audio.addEventListener("timeupdate", () => {
      setState((s) => ({ ...s, currentTime: audio.currentTime }));
    });
    audio.addEventListener("loadedmetadata", () => {
      setState((s) => ({ ...s, duration: audio.duration }));
    });
    audio.addEventListener("ended", () => {
      setState((s) => ({ ...s, isPlaying: false }));
      onTrackEnd?.();
    });
    audio.addEventListener("play", () => {
      setState((s) => ({ ...s, isPlaying: true }));
    });
    audio.addEventListener("pause", () => {
      setState((s) => ({ ...s, isPlaying: false }));
    });
    audio.addEventListener("error", async () => {
      if (!audioRef.current) return;
      const url = audioRef.current.src;
      try {
        const res = await fetch(url, { method: "HEAD" });
        if (res.status === 403) {
          document.cookie =
            "music_auth=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
          window.location.reload();
          return;
        }
      } catch {}
      setState((s) => ({ ...s, playbackError: "再生エラーが発生しました" }));
    });

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [onTrackEnd]);

  const play = useCallback((track: Track) => {
    const audio = audioRef.current;
    if (!audio) return;

    // ローカル開発では music-library/ から直接、本番では S3 から
    const isLocal = window.location.hostname === "localhost";
    const src = isLocal
      ? `/${track.s3Key.replace("music/", "music-library/")}`
      : `/${track.s3Key}`;

    if (state.currentTrack?.id !== track.id) {
      audio.src = src;
    }
    audio.play();
    setState((s) => ({ ...s, currentTrack: track, isPlaying: true, playbackError: null }));
  }, [state.currentTrack?.id]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const togglePlay = useCallback(() => {
    if (state.isPlaying) {
      pause();
    } else if (state.currentTrack) {
      audioRef.current?.play();
    }
  }, [state.isPlaying, state.currentTrack, pause]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = time;
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = vol;
      setState((s) => ({ ...s, volume: vol }));
    }
  }, []);

  return {
    ...state,
    play,
    pause,
    togglePlay,
    seek,
    setVolume,
  };
}
