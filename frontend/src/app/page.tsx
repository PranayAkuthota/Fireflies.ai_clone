"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Clock, 
  ArrowUpDown, 
  Video, 
  ChevronRight,
  TrendingUp,
  Clock3,
  CheckCircle2,
  ListTodo,
  Bot,
  Sparkles,
  Check,
  Flag,
  Globe,
  Send,
  X,
  Target,
  FileText,
  SlidersHorizontal,
  ChevronDown,
  MessageSquare,
  Plus,
  Loader2
} from "lucide-react";
import { Header } from "@/components/Header";
import { CreateMeetingModal } from "@/components/CreateMeetingModal";
import { SubSidebar } from "@/components/SubSidebar";
import { API_BASE_URL } from "@/config";
import { Meeting, Participant } from "@/types";
import { FredLogo } from "@/components/icons";
import { toast } from "react-hot-toast";

export default function Home() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedParticipant, setSelectedParticipant] = useState("");
  const [selectedDateFilter, setSelectedDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");
  
  // Dashboard Tabs: hosted, shared
  const [activeMeetingTab, setActiveMeetingTab] = useState<"hosted" | "shared">("hosted");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Stats
  const [totalDuration, setTotalDuration] = useState(0);
  
  // Ask Fred Quick Panel
  const [fredInput, setFredInput] = useState("");
  const [fredResponse, setFredResponse] = useState<string | null>(null);
  const [fredLoading, setFredLoading] = useState(false);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("q", searchQuery);
      if (selectedParticipant) params.append("participant_id", selectedParticipant);
      
      const now = new Date();
      if (selectedDateFilter === "today") {
        const startOfDay = new Date(now.setHours(0,0,0,0)).toISOString();
        params.append("date_start", startOfDay);
      } else if (selectedDateFilter === "week") {
        const oneWeekAgo = new Date(now.setDate(now.getDate() - 7)).toISOString();
        params.append("date_start", oneWeekAgo);
      } else if (selectedDateFilter === "month") {
        const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
        params.append("date_start", oneMonthAgo);
      }
      
      params.append("sort_by", sortBy);

      const response = await fetch(`${API_BASE_URL}/meetings?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch meetings");
      const data = await response.json();
      setMeetings(data);

      const total = data.reduce((acc: number, item: Meeting) => acc + item.duration, 0);
      setTotalDuration(total);
    } catch (error) {
      console.error("Error fetching meetings:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedParticipant, selectedDateFilter, sortBy]);

  const fetchParticipants = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/participants`);
      if (response.ok) {
        const data = await response.json();
        setParticipants(data);
      }
    } catch (error) {
      console.error("Error fetching participants:", error);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  useEffect(() => {
    fetchParticipants();
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleFredQuery = async (queryText: string) => {
    if (!queryText.trim()) return;
    setFredLoading(true);
    setFredResponse(null);
    try {
      const contextId = meetings[0]?.id;
      if (!contextId) {
        setFredResponse("Create or upload a meeting first so I have context to answer your questions!");
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/meetings/${contextId}/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: queryText }),
      });
      if (response.ok) {
        const data = await response.json();
        setFredResponse(data.answer);
      }
    } catch (err) {
      setFredResponse("Sorry, I had trouble processing that skill. Please try again.");
    } finally {
      setFredLoading(false);
    }
  };

  return (
    <>
      <Header onOpenCreateModal={() => setIsModalOpen(true)} />

      {/* Main split-screen container */}
      <div className="flex bg-slate-50 pt-16 min-h-[calc(100vh-64px)] overflow-hidden">
        
        {/* Sub-sidebar for channels/folders */}
        <SubSidebar />

        {/* Central library list workspace */}
        <main className="flex-1 p-6 overflow-y-auto space-y-6 max-h-[calc(100vh-64px)]">
          
          {/* Header breadcrumb & tabs bar */}
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-3.5 select-none">
            {/* Folder Tabs - Recreating the rounded double button border */}
            <div className="inline-flex p-1 bg-slate-100/70 border border-slate-200/60 rounded-md flex items-center h-9 shadow-sm select-none">
              <button 
                onClick={() => setActiveMeetingTab("hosted")}
                className={`h-full px-4 rounded text-xs font-semibold transition-all cursor-pointer ${
                  activeMeetingTab === "hosted"
                    ? "text-slate-800 bg-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 bg-transparent"
                }`}
              >
                Hosted by me
              </button>
              <button 
                onClick={() => {
                  setActiveMeetingTab("shared");
                  toast("Team sharing & collaboration coming soon!");
                }}
                className={`h-full px-4 rounded text-xs font-semibold transition-all cursor-pointer ${
                  activeMeetingTab === "shared"
                    ? "text-slate-800 bg-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 bg-transparent"
                }`}
              >
                Shared with me
              </button>
            </div>

            {/* Sub-actions toolbar */}
            <div className="flex items-center gap-2">
              {/* Sliders filter button */}
              <button className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
                <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
                <span>Filters</span>
              </button>

              {/* Square Search Icon Button */}
              <button className="flex h-7.5 w-7.5 items-center justify-center rounded-md border border-slate-200 bg-white p-1 text-slate-400 hover:text-slate-600 shadow-sm cursor-pointer">
                <Search className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Quick search filters dropdown (expandable widget) */}
          <div className="bg-white rounded-md border border-slate-200/80 p-4 shadow-sm flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search meeting titles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            
            {/* Participant Dropdown */}
            <div className="flex items-center gap-1 border border-slate-200 rounded-md px-2.5 py-1.5 bg-slate-50/50">
              <User className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={selectedParticipant}
                onChange={(e) => setSelectedParticipant(e.target.value)}
                className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer text-slate-600"
              >
                <option value="">All Participants</option>
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Date filter */}
            <div className="flex items-center gap-1 border border-slate-200 rounded-md px-2.5 py-1.5 bg-slate-50/50">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer text-slate-600"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">Past 7 Days</option>
                <option value="month">Past 30 Days</option>
              </select>
            </div>

            {/* Sort filter */}
            <div className="flex items-center gap-1 border border-slate-200 rounded-md px-2.5 py-1.5 bg-slate-50/50">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer text-slate-600"
              >
                <option value="date_desc">Most Recent</option>
                <option value="date_asc">Oldest</option>
                <option value="duration_desc">Longest Duration</option>
                <option value="duration_asc">Shortest Duration</option>
              </select>
            </div>
          </div>

          {/* List display panel */}
          <div className="rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600"></div>
                <span className="text-sm font-semibold">Scanning meeting storage...</span>
              </div>
            ) : activeMeetingTab === "shared" || meetings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center">
                <Video className="h-12 w-12 text-slate-200 mb-2" />
                <p className="text-sm font-bold text-slate-700">Looks like you haven't recorded a meeting yet</p>
                <p className="text-xs text-slate-400 mt-0.5 max-w-xs mx-auto">
                  Once you capture or upload your first meeting transcript, it will show up right here.
                </p>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-1.5 rounded bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow shadow-indigo-600/10 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Capture</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Meeting Title</th>
                      <th className="px-6 py-4">Date & Time</th>
                      <th className="px-6 py-4">Duration</th>
                      <th className="px-6 py-4">Participants</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {meetings.map((meeting) => (
                      <tr 
                        key={meeting.id} 
                        className="hover:bg-slate-50/50 transition-colors group cursor-pointer font-medium"
                      >
                        <td className="px-6 py-4 font-bold text-slate-900">
                          <Link href={`/meetings/${meeting.id}`} className="block focus:outline-none">
                            {meeting.title}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {formatDate(meeting.date)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <span>{formatDuration(meeting.duration)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center -space-x-1.5 overflow-hidden">
                            {meeting.participants.slice(0, 3).map((p) => (
                              <div
                                key={p.id}
                                title={`${p.name} (${p.email})`}
                                className="inline-flex h-7.5 w-7.5 items-center justify-center rounded-full bg-slate-100 border-2 border-white text-xs font-bold text-slate-600"
                              >
                                {p.name.split(" ").map(n => n[0]).join("")}
                              </div>
                            ))}
                            {meeting.participants.length > 3 && (
                              <div className="flex h-7.5 w-7.5 items-center justify-center rounded-full border-2 border-white bg-indigo-50 text-[10px] font-bold text-indigo-600">
                                +{meeting.participants.length - 3}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link 
                            href={`/meetings/${meeting.id}`}
                            className="inline-flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <span>Open Notes</span>
                            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </main>

        {/* Right Columns sidebar: Ask Fred workspace panel */}
        <aside className="w-80 border-l border-slate-200 bg-white p-5 flex flex-col justify-between shrink-0 select-none hidden xl:flex">
          <div className="space-y-5">
            {/* Panel Title: Speech bubble & plus icon next to text */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-[#f3f0fc] flex items-center justify-center shrink-0">
                  <FredLogo className="h-4.5 w-4.5" />
                </div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Ask Fred</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-400">
                <MessageSquare className="h-4 w-4 cursor-pointer hover:text-slate-600" />
                <Plus className="h-4 w-4 cursor-pointer hover:text-slate-600" />
              </div>
            </div>

            {/* Slack/Gmail integration promo banner: Lavender background & purple text */}
            <div className="rounded-md border border-[#d8cff8]/60 bg-[#f3f0fc]/70 p-3.5 relative">
              <button className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-3 w-3" />
              </button>
              <h4 className="text-xs font-bold text-[#6d28d9] leading-snug">
                Connect Slack and Gmail —
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                get answers with full context.
              </p>
              <button 
                onClick={() => toast("Integrations coming soon!")}
                className="text-[10px] font-bold text-[#6d28d9] hover:underline mt-2 block cursor-pointer"
              >
                Connect
              </button>
            </div>

            {/* Profile greeting with Fred Mascot Logo */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-[#fdfaff] border border-[#d8cff8]/60 flex items-center justify-center p-1 shadow-sm shrink-0">
                <FredLogo className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 leading-snug">Hi Pranaykumar!</h3>
                <p className="text-[11px] font-semibold text-slate-500">Get ready for your meeting</p>
              </div>
            </div>

            {/* Custom static quick action shortcuts: Matching background & shapes */}
            <div className="space-y-2">
              <button 
                onClick={() => handleFredQuery("What are the action items?")}
                className="w-full flex items-center gap-2.5 rounded border border-slate-200/60 bg-[#f8f9fa] p-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-sm cursor-pointer"
              >
                <Check className="h-4 w-4 text-[#107b5a] bg-[#e2f7f0] rounded p-0.5 shrink-0" />
                <span>My action items</span>
              </button>
              
              <button 
                onClick={() => handleFredQuery("List the key decisions made")}
                className="w-full flex items-center gap-2.5 rounded border border-slate-200/60 bg-[#f8f9fa] p-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-sm cursor-pointer"
              >
                <Target className="h-4 w-4 text-[#e11d48] bg-[#ffe4e6] rounded p-0.5 shrink-0" />
                <span>Key decisions</span>
              </button>
              
              <button 
                onClick={() => handleFredQuery("Tell me about key initiatives discussed")}
                className="w-full flex items-center gap-2.5 rounded border border-slate-200/60 bg-[#f8f9fa] p-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-sm cursor-pointer"
              >
                <Flag className="h-4 w-4 text-[#6d28d9] bg-[#f3f0fc] rounded p-0.5 shrink-0" />
                <span>Key initiatives</span>
              </button>
            </div>

            {/* Answer Display */}
            {fredResponse && (
              <div className="rounded bg-indigo-50/40 border border-indigo-100 p-3 max-h-[160px] overflow-y-auto space-y-1 animate-in fade-in duration-150">
                <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider block">Fred Response</span>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{fredResponse}</p>
              </div>
            )}
            
            {fredLoading && (
              <div className="flex items-center justify-center gap-1.5 py-4 text-slate-400">
                <Loader2 className="h-4.5 w-4.5 animate-spin text-indigo-600" />
                <span className="text-xs font-semibold">Fred is thinking...</span>
              </div>
            )}
          </div>

          {/* AI skills chatbot input box at the bottom */}
          <div className="space-y-3 rounded-md border border-slate-200 p-4 bg-white shadow-sm">
            <span className="inline-block bg-[#f8f9fa] border border-slate-200/60 px-2 py-0.5 rounded text-[9px] font-bold text-slate-500">
              # My Meetings
            </span>
            <div className="relative flex items-center">
              <Globe className="absolute left-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Ask anything. Type / to run AI skills."
                value={fredInput}
                onChange={(e) => setFredInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleFredQuery(fredInput); }}
                className="w-full rounded border border-slate-200 pl-8.5 pr-10 py-2 text-[10px] text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
              />
              <button 
                onClick={() => handleFredQuery(fredInput)}
                disabled={!fredInput.trim() || fredLoading}
                className="absolute right-2 text-indigo-600 bg-[#f3f0fc] hover:bg-[#e4def7] rounded-md p-1.5 disabled:text-slate-300 disabled:bg-slate-100 transition-colors cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

        </aside>

      </div>

      <CreateMeetingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchMeetings}
      />
    </>
  );
}
