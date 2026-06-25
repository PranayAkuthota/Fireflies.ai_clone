"use client";

import React from "react";
import { 
  Bell, 
  Search, 
  Mic, 
  ChevronDown, 
  Video, 
  Sparkles
} from "lucide-react";
import { useActiveMeeting } from "@/context/ActiveMeetingContext";
import { usePathname } from "next/navigation";
import { toast } from "react-hot-toast";

interface HeaderProps {
  onOpenCreateModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCreateModal }) => {
  const pathname = usePathname();
  const { searchQuery, setSearchQuery } = useActiveMeeting();
  
  const isDashboard = pathname === "/";
  const title = isDashboard ? "Meetings" : "Meeting Details";

  return (
    <header className="fixed top-0 right-0 left-16 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8 select-none">
      
      {/* Left breadcrumb */}
      <div className="flex items-center gap-1 min-w-[120px]">
        <span className="text-sm font-bold text-slate-800">{title}</span>
      </div>

      {/* Middle Global Search (only on dashboard) */}
      <div className="flex-1 max-w-lg px-4">
        {isDashboard && (
          <div className="relative">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title or keyword"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-slate-50/50 pl-9.5 pr-12 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="absolute top-2 right-2.5 rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 select-none">
              ⌘K
            </div>
          </div>
        )}
      </div>

      {/* Right utilities controls */}
      <div className="flex items-center gap-5">
        
        {/* Unlimited Meetings Label: Plain text, no border/bg */}
        <span className="hidden md:inline-flex text-xs font-semibold text-slate-500">
          Unlimited Meetings
        </span>

        {/* Upgrade Button: Clean 32px height, rounded-md and bold font style */}
        <button 
          onClick={() => toast("Upgrade features coming soon!")}
          className="hidden sm:inline-flex h-8 items-center justify-center rounded-md border border-[#a7f0d6] bg-[#e2f7f0] px-4 text-xs font-bold text-[#107b5a] hover:bg-[#d2f3e8] transition-colors cursor-pointer"
        >
          Upgrade
        </button>

        {/* Split Capture Button: Adjusted to h-8 (32px) height, rounded-md and padded scale */}
        {onOpenCreateModal && (
          <div className="inline-flex h-8 rounded-md bg-[#6938EF] hover:bg-[#5925dc] text-white shadow-sm transition-all overflow-hidden">
            <button
              onClick={onOpenCreateModal}
              className="h-full flex items-center gap-1.5 pl-3 pr-3.5 py-0 text-xs font-bold text-white border-r border-white/15 hover:bg-white/5 transition-colors cursor-pointer"
            >
              <Video className="h-5 w-5 stroke-[1.6] shrink-0" />
              <span>Capture</span>
            </button>
            <button
              onClick={onOpenCreateModal}
              className="h-full px-2.5 flex items-center justify-center cursor-pointer text-white hover:bg-white/10 transition-colors"
            >
              <ChevronDown className="h-3.5 w-3.5 stroke-[1.6]" />
            </button>
          </div>
        )}

        <div className="h-4 w-[1px] bg-slate-200"></div>

        {/* Purple Microphone icon */}
        <button 
          onClick={() => toast("Live speech-to-text transcription coming soon!")}
          className="text-[#7047eb] hover:text-[#5b34d7] transition-colors cursor-pointer"
        >
          <Mic className="h-4.5 w-4.5" />
        </button>

        {/* Notifications Bell */}
        <button 
          onClick={() => toast("Notifications coming soon!")}
          className="relative text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
        </button>

        {/* Profile Avatar */}
        <div 
          onClick={() => toast("User authentication & profile coming soon!")}
          className="h-8 w-8 rounded-full bg-indigo-100 border border-slate-200 flex items-center justify-center text-indigo-700 font-bold text-xs cursor-pointer select-none"
        >
          PK
        </div>
      </div>
    </header>
  );
};
