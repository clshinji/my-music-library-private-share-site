import { useState, useCallback } from "react";
import type { Track } from "../types/music";

interface PlaylistState {
  queue: Track[];
  currentIndex: number;
  shuffle: boolean;
  repeat: "none" | "all" | "one";
}

export function usePlaylist() {
  const [state, setState] = useState<PlaylistState>({
    queue: [],
    currentIndex: -1,
    shuffle: false,
    repeat: "none",
  });

  const setQueue = useCallback((tracks: Track[], startIndex = 0) => {
    setState({
      queue: tracks,
      currentIndex: startIndex,
      shuffle: false,
      repeat: "none",
    });
  }, []);

  const currentTrack = state.queue[state.currentIndex] ?? null;

  const next = useCallback((): Track | null => {
    let nextIndex: number;
    if (state.repeat === "one") {
      nextIndex = state.currentIndex;
    } else if (state.shuffle) {
      nextIndex = Math.floor(Math.random() * state.queue.length);
    } else {
      nextIndex = state.currentIndex + 1;
      if (nextIndex >= state.queue.length) {
        if (state.repeat === "all") {
          nextIndex = 0;
        } else {
          return null;
        }
      }
    }
    setState((s) => ({ ...s, currentIndex: nextIndex }));
    return state.queue[nextIndex] ?? null;
  }, [state]);

  const prev = useCallback((): Track | null => {
    let prevIndex = state.currentIndex - 1;
    if (prevIndex < 0) {
      if (state.repeat === "all") {
        prevIndex = state.queue.length - 1;
      } else {
        prevIndex = 0;
      }
    }
    setState((s) => ({ ...s, currentIndex: prevIndex }));
    return state.queue[prevIndex] ?? null;
  }, [state]);

  const playTrackAt = useCallback((index: number): Track | null => {
    if (index >= 0 && index < state.queue.length) {
      setState((s) => ({ ...s, currentIndex: index }));
      return state.queue[index];
    }
    return null;
  }, [state.queue]);

  const toggleShuffle = useCallback(() => {
    setState((s) => ({ ...s, shuffle: !s.shuffle }));
  }, []);

  const toggleRepeat = useCallback(() => {
    setState((s) => ({
      ...s,
      repeat: s.repeat === "none" ? "all" : s.repeat === "all" ? "one" : "none",
    }));
  }, []);

  return {
    queue: state.queue,
    currentIndex: state.currentIndex,
    currentTrack,
    shuffle: state.shuffle,
    repeat: state.repeat,
    setQueue,
    next,
    prev,
    playTrackAt,
    toggleShuffle,
    toggleRepeat,
  };
}
