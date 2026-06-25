"use client";

import React, { useEffect, useRef, useState } from "react";
import { 
  Search, 
  Volume2, 
  User2, 
  MessageSquare, 
  Send, 
  Sparkles,
  Loader2,
  FileSpreadsheet
} from "lucide-react";
import { useActiveMeeting } from "@/context/ActiveMeetingContext";
import { TranscriptSegment } from "@/types";
import { API_BASE_URL } from "@/config";
import { FredLogo } from "./icons";

interface TranscriptPanelProps {
  meetingId: number;
  segments: TranscriptSegment[];
}

interface ChatMessage {
  sender: "user" | "fred";
  text: string;
}

export const TranscriptPanel: React.FC<TranscriptPanelProps> = ({ 
  meetingId, 
  segments 
}) => {
  const { currentTime, seekTo, searchQuery, setSearchQuery } = useActiveMeeting();
  
  // Tab State: "transcript" | "chat"
  const [activeTab, setActiveTab] = useState<"transcript" | "chat">("transcript");
  
  // Transcript States
  const [activeSegmentId, setActiveSegmentId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const segmentRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Chat States
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      sender: "fred",
      text: "Hi, I am Fred, your meeting assistant! Ask me questions like:\n- 'What are the action items?'\n- 'Who spoke during the meeting?'\n- 'What did Bob say about the backend?'",
    },
  ]);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Sync segment highlights with playback playhead
  useEffect(() => {
    const active = segments.find(
      (seg) => currentTime >= seg.start_time && currentTime <= seg.end_time
    );
    if (active) {
      setActiveSegmentId(active.id);
    }
  }, [currentTime, segments]);

  // Autoscroll transcript viewport
  useEffect(() => {
    if (activeTab === "transcript" && activeSegmentId !== null && segmentRefs.current[activeSegmentId]) {
      const element = segmentRefs.current[activeSegmentId];
      element?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeSegmentId, activeTab]);

  // Autoscroll chat history
  useEffect(() => {
    if (activeTab === "chat" && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeTab]);

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const highlightMatches = (text: string, query: string) => {
    if (!query.trim()) return <span>{text}</span>;
    const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`(${escapedQuery})`, "gi");
    const parts = text.split(regex);

    return (
      <span>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-amber-200 text-slate-900 rounded-sm font-semibold px-0.5">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  // Filter segments
  const filteredSegments = segments.filter((seg) => {
    if (!searchQuery.trim()) return true;
    return (
      seg.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seg.speaker.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Submit AI Question
  const handleSendQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userText = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/meetings/${meetingId}/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: userText }),
      });

      if (response.ok) {
        const data = await response.json();
        setChatMessages((prev) => [...prev, { sender: "fred", text: data.answer }]);
      } else {
        throw new Error("Chat endpoint error");
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { sender: "fred", text: "Sorry, I had trouble processing that request. Please try again." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
      {/* Header Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4">
        <div className="flex gap-1.5 pt-3">
          <button
            onClick={() => setActiveTab("transcript")}
            className={`flex items-center gap-1.5 border-b-2 px-3 pb-2 text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
              activeTab === "transcript"
                ? "border-indigo-600 text-indigo-600 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Interactive Transcript</span>
          </button>
          
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-1.5 border-b-2 px-3 pb-2 text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
              activeTab === "chat"
                ? "border-indigo-600 text-indigo-600 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FredLogo className="h-4 w-4" />
            <span>Ask Fred AI</span>
          </button>
        </div>

        {/* Search tool for transcripts tab */}
        {activeTab === "transcript" && (
          <div className="relative w-48 mb-1">
            <Search className="absolute top-2 left-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search words..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white pl-8 pr-2.5 py-1 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Tabs Container */}
      <div className="flex-1 min-h-0 bg-white relative">
        
        {/* TRANSCRIPT VIEW */}
        {activeTab === "transcript" && (
          <div 
            ref={containerRef}
            className="h-full overflow-y-auto p-5 space-y-4 max-h-[calc(100vh-270px)]"
          >
            {filteredSegments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center">
                <Search className="h-8 w-8 text-slate-300 mb-2 animate-bounce" />
                <p className="text-sm font-semibold text-slate-600">No matching dialogue lines</p>
                <p className="text-xs text-slate-400 mt-0.5">Try widening or resetting your search input.</p>
              </div>
            ) : (
              filteredSegments.map((seg) => {
                const isActive = seg.id === activeSegmentId;
                return (
                  <div
                    key={seg.id}
                    ref={(el) => {
                      segmentRefs.current[seg.id] = el;
                    }}
                    onClick={() => seekTo(seg.start_time)}
                    className={`flex gap-4 rounded-md p-3 cursor-pointer transition-all duration-200 group border border-transparent ${
                      isActive
                        ? "bg-indigo-50/70 border-l-4 border-l-indigo-500 shadow-sm border-slate-200/50"
                        : "hover:bg-slate-50/80 hover:border-slate-100"
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isActive ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
                    }`}>
                      <User2 className="h-4 w-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold ${
                          isActive ? "text-indigo-600" : "text-slate-800"
                        }`}>
                          {seg.speaker}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {formatTimestamp(seg.start_time)}
                        </span>
                        {isActive && (
                          <span className="inline-flex items-center gap-1 rounded bg-indigo-100 px-1 py-0.5 text-[9px] font-semibold text-indigo-700 animate-pulse">
                            <Volume2 className="h-2.5 w-2.5" />
                            Speaking
                          </span>
                        )}
                      </div>
                      <p className={`text-sm leading-relaxed ${
                        isActive ? "text-slate-900 font-medium" : "text-slate-600 group-hover:text-slate-800"
                      }`}>
                        {highlightMatches(seg.text, searchQuery)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* FRED CHAT VIEW */}
        {activeTab === "chat" && (
          <div className="flex flex-col h-full max-h-[calc(100vh-270px)] bg-slate-50">
            {/* Messages history */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 max-w-[85%] ${
                    msg.sender === "user" ? "ml-auto flex-row-reverse" : ""
                  }`}
                >
                  {/* Chat Avatar */}
                  {msg.sender === "user" ? (
                    <div className="h-7 w-7 rounded-full bg-[#7047eb] text-white flex items-center justify-center text-xs font-bold shrink-0">
                      PK
                    </div>
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-[#f3f0fc] border border-[#d8cff8]/60 flex items-center justify-center shrink-0 overflow-hidden">
                      <FredLogo className="h-5 w-5" />
                    </div>
                  )}
                  {/* Speech bubble */}
                  <div className={`rounded-md px-3.5 py-2.5 text-sm shadow-sm whitespace-pre-wrap leading-relaxed ${
                    msg.sender === "user" 
                      ? "bg-indigo-600 text-white rounded-tr-none" 
                      : "bg-white text-slate-700 border border-slate-200/70 rounded-tl-none"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex gap-3 max-w-[85%]">
                  <div className="h-7 w-7 rounded-full bg-[#f3f0fc] border border-[#d8cff8]/60 flex items-center justify-center shrink-0 overflow-hidden">
                    <FredLogo className="h-5 w-5" />
                  </div>
                  <div className="rounded-md px-3.5 py-2.5 text-sm bg-white text-slate-500 border border-slate-200/70 rounded-tl-none flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                    <span>Fred is scanning the transcript...</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Message input */}
            <form onSubmit={handleSendQuestion} className="border-t border-slate-200 p-3 bg-white flex gap-2">
              <input
                type="text"
                placeholder="Ask a question about this meeting..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 rounded-md border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || chatLoading}
                className="flex h-9 w-9 items-center justify-center rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors cursor-pointer shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
