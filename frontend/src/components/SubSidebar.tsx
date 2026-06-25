"use client";

import React, { useState } from "react";
import { 
  Search, 
  Hash, 
  Grid, 
  Bot, 
  Plus, 
  MessageSquareOff
} from "lucide-react";

export const SubSidebar: React.FC = () => {
  const [channelSearch, setChannelSearch] = useState("");

  return (
    <div className="w-60 h-[calc(100vh-64px)] border-r border-slate-200 bg-white flex flex-col select-none shrink-0">
      
      {/* Search channels box */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search channels"
            value={channelSearch}
            onChange={(e) => setChannelSearch(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-slate-50/50 pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Main navigation groups */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4">
        
        {/* Meetings folders */}
        <div className="space-y-0.5">
          {/* Active folder: Matches the official light lavender background and purple text */}
          <button className="w-full flex items-center gap-2.5 rounded-md bg-[#f3f0fc] text-[#6d28d9] px-3 py-2 text-xs font-bold transition-colors">
            <Hash className="h-4 w-4 text-[#6d28d9]" />
            <span>My Meetings</span>
          </button>
          
          <button className="w-full flex items-center gap-2.5 rounded-md text-slate-600 hover:bg-slate-50 px-3 py-2 text-xs font-semibold transition-colors">
            <Grid className="h-4 w-4 text-slate-400" />
            <span>All Meetings</span>
          </button>
          
          <button className="w-full flex items-center gap-2.5 rounded-md text-slate-600 hover:bg-slate-50 px-3 py-2 text-xs font-semibold transition-colors">
            <Bot className="h-4 w-4 text-slate-400" />
            <span>Voice Agent Meetings</span>
          </button>
        </div>

        <div className="border-t border-slate-100 my-3" />

        {/* Channels Section */}
        <div className="px-3 space-y-3">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span>All Channels</span>
            <button className="hover:text-slate-600">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          
          {/* Empty channels stub */}
          <div className="rounded-md border border-dashed border-slate-200 p-4 text-center space-y-2.5">
            <MessageSquareOff className="h-5 w-5 text-slate-300 mx-auto" />
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Create channels to organize your conversations
            </p>
            <button className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
              <Plus className="h-3 w-3" />
              <span>Channel</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
