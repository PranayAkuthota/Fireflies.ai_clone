"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Trash2, 
  Edit2, 
  Download, 
  Sparkles,
  FileText,
  BookmarkCheck,
  Check,
  Loader2,
  Trash
} from "lucide-react";
import { API_BASE_URL } from "@/config";
import { MeetingDetail } from "@/types";
import { AudioPlayer } from "@/components/AudioPlayer";
import { TranscriptPanel } from "@/components/TranscriptPanel";
import { ActionItemsPanel } from "@/components/ActionItemsPanel";
import { toast } from "react-hot-toast";

interface MeetingPageProps {
  params: Promise<{ id: string }>;
}

export default function MeetingPage({ params }: MeetingPageProps) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const meetingId = parseInt(unwrappedParams.id);

  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Mode States
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [isEditingParticipants, setIsEditingParticipants] = useState(false);
  const [editedParticipants, setEditedParticipants] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchMeetingDetails = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/meetings/${meetingId}`);
      if (!response.ok) {
        throw new Error("Meeting details not found.");
      }
      const data = await response.json();
      setMeeting(data);
      setEditedTitle(data.title);
      setEditedParticipants(data.participants.map((p: any) => p.email).join(", "));
    } catch (err: any) {
      setError(err.message || "Failed to load meeting details.");
      toast.error(err.message || "Failed to load meeting details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetingDetails();
  }, [meetingId]);

  const handleUpdateTitle = async () => {
    if (!editedTitle.trim()) return;
    setUpdating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/meetings/${meetingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: editedTitle.trim() }),
      });
      if (response.ok) {
        const data = await response.json();
        setMeeting(prev => prev ? { ...prev, title: data.title } : null);
        setIsEditingTitle(false);
        toast.success("Title updated successfully!");
      } else {
        toast.error("Failed to update title");
      }
    } catch (err) {
      console.error("Failed to update title:", err);
      toast.error("An error occurred while updating title");
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateParticipants = async () => {
    if (!editedParticipants.trim()) return;
    setUpdating(true);
    
    const emails = editedParticipants.split(",").map(e => e.trim()).filter(Boolean);
    const participantPayload = emails.map(email => ({
      name: email.split("@")[0],
      email: email
    }));

    try {
      const response = await fetch(`${API_BASE_URL}/meetings/${meetingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participants: participantPayload }),
      });
      if (response.ok) {
        const data = await response.json();
        setMeeting(prev => prev ? { ...prev, participants: data.participants } : null);
        setIsEditingParticipants(false);
        toast.success("Participants updated!");
      } else {
        toast.error("Failed to update participants");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating participants");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteMeeting = async () => {
    if (!confirm("Are you sure you want to delete this meeting? This action is permanent and will clear all transcripts and summary notes.")) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/meetings/${meetingId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Meeting deleted");
        router.push("/");
      } else {
        toast.error("Failed to delete meeting.");
      }
    } catch (err) {
      console.error("Failed to delete meeting:", err);
      toast.error("Error deleting meeting.");
    }
  };

  const handleExportTranscript = async () => {
    try {
      window.open(`${API_BASE_URL}/meetings/${meetingId}/export`, "_blank");
    } catch (err) {
      console.error("Failed to export transcript:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-slate-50 text-slate-400">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600"></div>
        <span className="text-sm font-semibold">Loading meeting data...</span>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 text-slate-500">
        <div className="text-center">
          <Trash2 className="h-12 w-12 text-slate-300 mx-auto mb-2" />
          <h2 className="text-base font-bold text-slate-700">Meeting Not Found</h2>
          <p className="text-xs text-slate-400 mt-1 mb-4">{error || "The requested item does not exist."}</p>
          <Link href="/" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 transition-colors">
            Return to Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Top sticky detail navigation bar */}
      <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Link 
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors shrink-0"
            title="Back to library"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Link>

          {/* Dynamic Editing Title Form */}
          {isEditingTitle ? (
            <div className="flex flex-col gap-2 max-w-xl flex-1">
              <div className="flex items-center gap-2 w-full">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-800 focus:border-indigo-500 focus:outline-none"
                />
                <button 
                  onClick={handleUpdateTitle}
                  disabled={updating}
                  className="flex items-center justify-center h-8 w-8 shrink-0 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-400 cursor-pointer"
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </button>
                <button 
                  onClick={() => { setIsEditingTitle(false); setEditedTitle(meeting.title); }}
                  className="text-xs text-slate-400 hover:text-slate-600 shrink-0"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="text-base font-bold text-slate-800 truncate">{meeting.title}</h2>
                <button 
                  onClick={() => setIsEditingTitle(true)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-50 transition-colors"
                  title="Edit title"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              </div>
              
              {/* Participants Display & Edit */}
              {isEditingParticipants ? (
                <div className="flex items-center gap-2 mt-1 w-full max-w-xl">
                  <input
                    type="text"
                    value={editedParticipants}
                    onChange={(e) => setEditedParticipants(e.target.value)}
                    placeholder="Emails separated by commas"
                    className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                  <button 
                    onClick={handleUpdateParticipants}
                    disabled={updating}
                    className="flex items-center justify-center h-6 w-6 shrink-0 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={() => { setIsEditingParticipants(false); setEditedParticipants(meeting.participants.map(p => p.email).join(", ")); }}
                    className="text-[10px] text-slate-400 hover:text-slate-600 shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] text-slate-500 font-medium">
                    {meeting.participants.map(p => p.name).join(", ") || "No participants"}
                  </span>
                  <button 
                    onClick={() => setIsEditingParticipants(true)}
                    className="text-slate-300 hover:text-slate-500 transition-colors"
                    title="Edit participants"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportTranscript}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Markdown</span>
          </button>
          
          <button
            onClick={handleDeleteMeeting}
            className="flex items-center gap-1.5 rounded-md border border-rose-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <Trash className="h-3.5 w-3.5" />
            <span>Delete Meeting</span>
          </button>
        </div>
      </div>

      {/* Main split-screen grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 h-[calc(100vh-140px)]">
        {/* Left Column: AI Summary panel & Action items (Stubs for Milestone 4) */}
        <div className="lg:col-span-5 flex flex-col gap-6 overflow-y-auto pr-2">
          {/* Summary */}
          <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-indigo-600">
              <Sparkles className="h-4.5 w-4.5" />
              <h3 className="text-xs font-bold uppercase tracking-wider">AI Meeting Summary</h3>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              {meeting.summary?.summary_text || "No AI notes summary generated."}
            </p>
          </div>

          {/* Action Items Checklist */}
          <ActionItemsPanel meetingId={meeting.id} initialItems={meeting.action_items} />

          {/* Chapters Outline */}
          <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <FileText className="h-4.5 w-4.5" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Outline & Chapters</h3>
            </div>
            <div className="space-y-3">
              {meeting.chapters.map((chapter) => {
                const mins = Math.floor(chapter.start_time / 60);
                const secs = Math.floor(chapter.start_time % 60);
                const timeStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
                return (
                  <div key={chapter.id} className="border-l-2 border-slate-100 hover:border-amber-400 pl-3.5 py-0.5 transition-colors">
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 rounded px-1.5 py-0.5 select-none">{timeStr}</span>
                    <h4 className="text-sm font-semibold text-slate-800 mt-1.5">{chapter.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{chapter.summary}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Audio player and Interactive Transcript segment scroll */}
        <div className="lg:col-span-7 flex flex-col h-full overflow-hidden">
          <TranscriptPanel meetingId={meeting.id} segments={meeting.transcript_segments} />
        </div>
      </div>

      {/* Sticky Audio Player */}
      <AudioPlayer 
        src={meeting.audio_url || ""} 
        title={meeting.title} 
      />
    </div>
  );
}
