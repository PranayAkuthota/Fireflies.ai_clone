"use client";

import React, { useRef, useEffect, useState } from "react";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Gauge, 
  RotateCcw, 
  RotateCw 
} from "lucide-react";
import { useActiveMeeting } from "@/context/ActiveMeetingContext";

interface AudioPlayerProps {
  src: string;
  title: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, title }) => {
  const {
    currentTime,
    setCurrentTime,
    isPlaying,
    setIsPlaying,
    duration,
    setDuration,
    triggerSeekTime,
    clearSeekTrigger,
  } = useActiveMeeting();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  // Sync state transitions when audio plays
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch((err) => {
        console.error("Playback play error:", err);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, setIsPlaying]);

  // Handle external seek events (e.g. from clicking transcript segments)
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && triggerSeekTime !== null) {
      audio.currentTime = triggerSeekTime;
      setCurrentTime(triggerSeekTime);
      clearSeekTrigger();
    }
  }, [triggerSeekTime, setCurrentTime, clearSeekTrigger]);

  // Handle speed selection
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Handle volume adjustments
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (audio) {
      setCurrentTime(audio.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (audio) {
      setDuration(audio.duration);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const handleSkip = (seconds: number) => {
    const audio = audioRef.current;
    if (audio) {
      const nextTime = Math.min(Math.max(0, audio.currentTime + seconds), duration);
      audio.currentTime = nextTime;
      setCurrentTime(nextTime);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed bottom-0 right-0 left-16 z-20 border-t border-slate-200 bg-white px-8 py-4.5 shadow-lg flex items-center justify-between gap-6">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Title & Metadata Info */}
      <div className="flex flex-col min-w-0 max-w-[200px] sm:max-w-xs">
        <span className="truncate text-xs font-bold text-slate-400 uppercase tracking-wider">Now Playing</span>
        <span className="truncate text-sm font-semibold text-slate-800">{title}</span>
      </div>

      {/* Main Playback Progress & Control Slider */}
      <div className="flex-1 flex flex-col items-center gap-2 max-w-2xl">
        {/* Buttons Controls */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => handleSkip(-10)}
            className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors"
            title="Rewind 10s"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95 cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 fill-white" />
            ) : (
              <Play className="h-5 w-5 fill-white ml-0.5" />
            )}
          </button>

          <button 
            onClick={() => handleSkip(10)}
            className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors"
            title="Fast Forward 10s"
          >
            <RotateCw className="h-4 w-4" />
          </button>
        </div>

        {/* Playback Seekbar */}
        <div className="w-full flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500 min-w-[35px] text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeekChange}
            className="flex-1 h-1.5 rounded-lg bg-slate-100 appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
            style={{
              background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${duration ? (currentTime / duration) * 100 : 0}%, #f1f5f9 ${duration ? (currentTime / duration) * 100 : 0}%, #f1f5f9 100%)`
            }}
          />
          <span className="text-xs font-medium text-slate-500 min-w-[35px]">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Speed & Volume Controls */}
      <div className="flex items-center gap-4.5">
        {/* Speed Selector */}
        <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-slate-600">
          <Gauge className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
            className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer text-slate-700"
          >
            <option value="0.75">0.75x</option>
            <option value="1.0">1.0x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2.0">2.0x</option>
          </select>
        </div>

        {/* Volume controls */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4.5 w-4.5" />
            ) : (
              <Volume2 className="h-4.5 w-4.5" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            className="w-16 h-1 rounded-lg bg-slate-200 appearance-none cursor-pointer accent-slate-600"
          />
        </div>
      </div>
    </div>
  );
};
