"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface ActiveMeetingContextType {
  currentTime: number;
  setCurrentTime: (time: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  duration: number;
  setDuration: (duration: number) => void;
  triggerSeekTime: number | null;
  seekTo: (time: number) => void;
  clearSeekTrigger: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const ActiveMeetingContext = createContext<ActiveMeetingContextType | undefined>(undefined);

export const ActiveMeetingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [triggerSeekTime, setTriggerSeekTime] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const seekTo = (time: number) => {
    setTriggerSeekTime(time);
    setCurrentTime(time);
  };

  const clearSeekTrigger = () => {
    setTriggerSeekTime(null);
  };

  return (
    <ActiveMeetingContext.Provider
      value={{
        currentTime,
        setCurrentTime,
        isPlaying,
        setIsPlaying,
        duration,
        setDuration,
        triggerSeekTime,
        seekTo,
        clearSeekTrigger,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </ActiveMeetingContext.Provider>
  );
};

export const useActiveMeeting = () => {
  const context = useContext(ActiveMeetingContext);
  if (!context) {
    throw new Error("useActiveMeeting must be used within an ActiveMeetingProvider");
  }
  return context;
};
