"use client";

import React, { useState } from "react";
import { X, Link2, ChevronDown, Upload, Sparkles, Loader2, AlertCircle, Play, Calendar, Mic, FileText } from "lucide-react";
import { API_BASE_URL } from "@/config";
import { toast } from "react-hot-toast";
import { FredLogo } from "./icons";

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateMeetingModal: React.FC<CreateMeetingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  // Tab State: "bot" | "upload"
  const [activeTab, setActiveTab] = useState<"bot" | "upload">("bot");

  // Invite Bot Form States
  const [botMeetingName, setBotMeetingName] = useState("");
  const [botMeetingLink, setBotMeetingLink] = useState("");
  const [botLanguage, setBotLanguage] = useState("English (Global)");

  // Upload Transcript Form States
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [participantsInput, setParticipantsInput] = useState("");
  const [transcriptText, setTranscriptText] = useState("");

  // Common States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === "string") {
        setTranscriptText(result);
        if (!title) {
          const fileNameNoExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
          setTitle(fileNameNoExt.replace(/[_-]/g, ' '));
        }
      }
    };
    reader.readAsText(file);
  };

  // Submit Bot invite (simulate call join)
  const handleInviteBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botMeetingLink.trim()) {
      setError("Meeting link is required to invite the assistant bot.");
      return;
    }

    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      // Simulate Bot processing - post a new mock meeting in progress after 2 seconds
      const simulatedTitle = botMeetingName.trim() || "Webinar / Live Video Sync";
      const response = await fetch(`${API_BASE_URL}/meetings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: simulatedTitle,
          date: new Date().toISOString(),
          participants: [
            { name: "Pranaykumar", email: "pranay@scaler.ai" },
            { name: "Anand Chakravarthy", email: "alice@scaler.ai" }
          ],
          transcript_text: "Anand Chakravarthy: Welcome everyone, the Fireflies capturing bot is now connected to the meeting and recording audio. Let's make sure our live seek syncing works.\nPranaykumar: Thanks, Anand. This bot captures everything and syncs the transcript automatically."
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to invite assistant bot.");
      }

      setInfoMessage("Fireflies Bot is joining the call. The transcript and summaries will populate momentarily!");
      
      // Delay closing to show mock joining message
      setTimeout(() => {
        setBotMeetingLink("");
        setBotMeetingName("");
        setInfoMessage(null);
        onSuccess();
        onClose();
        toast.success("Bot joined the meeting!");
      }, 2500);

    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      // Keep loading spinner active during mock join duration
      setTimeout(() => setLoading(false), 2500);
    }
  };

  // Submit Transcript Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Meeting title is required.");
      return;
    }

    setLoading(true);
    setError(null);

    const parsedParticipants = [];
    if (participantsInput.trim()) {
      const parts = participantsInput.split(",");
      for (let p of parts) {
        p = p.trim();
        if (!p) continue;

        const match = p.match(/^([^(]+)\(([^)]+)\)$/);
        if (match) {
          parsedParticipants.push({
            name: match[1].trim(),
            email: match[2].trim(),
          });
        } else {
          parsedParticipants.push({
            name: p.split("@")[0].trim(),
            email: p,
          });
        }
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/meetings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          date: date ? new Date(date).toISOString() : null,
          participants: parsedParticipants,
          transcript_text: transcriptText.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create meeting.");
      }

      setTitle("");
      setDate("");
      setParticipantsInput("");
      setTranscriptText("");
      onSuccess();
      onClose();
      toast.success("Meeting uploaded successfully!");
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
      toast.error(err.message || "Failed to upload meeting.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-[500px] rounded-md bg-white shadow-2xl border border-slate-200/80 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Modal Header: Tab controls to choose original bot vs transcript uploads */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-1 bg-slate-100 rounded-md p-0.5">
            <button
              onClick={() => { setActiveTab("bot"); setError(null); setInfoMessage(null); }}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeTab === "bot" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Invite Live Bot
            </button>
            <button
              onClick={() => { setActiveTab("upload"); setError(null); setInfoMessage(null); }}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeTab === "upload" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Upload Transcript
            </button>
          </div>
          <button 
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dynamic content forms */}
        <div className="p-6">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-rose-50 p-3 text-xs font-semibold text-rose-600 border border-rose-100 mb-4">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="flex items-center gap-2 rounded-md bg-indigo-50 p-3 text-xs font-semibold text-indigo-700 border border-indigo-100 mb-4 animate-pulse">
              <FredLogo className="h-4.5 w-4.5 shrink-0" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* TAB 1: ADD TO LIVE MEETING (RECREATES ORIGINAL SCREENSHOT) */}
          {activeTab === "bot" && (
            <form onSubmit={handleInviteBot} className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">Add to live meeting</h3>
              </div>

              {/* Meeting Name */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Name your meeting <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={botMeetingName}
                  onChange={(e) => setBotMeetingName(e.target.value)}
                  placeholder="E.g. Product team sync"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Meeting Link */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Meeting link
                </label>
                <p className="text-[10px] text-slate-400 mb-1">
                  Capture meetings from GMeet, Zoom, MS teams, and <span className="text-indigo-600 cursor-pointer hover:underline">more.</span>
                </p>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Link2 className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={botMeetingLink}
                    onChange={(e) => setBotMeetingLink(e.target.value)}
                    placeholder="https://zoom.us/s/77277195107"
                    className="w-full rounded-md border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Language Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Meeting language
                </label>
                <div className="relative">
                  <select
                    value={botLanguage}
                    onChange={(e) => setBotLanguage(e.target.value)}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-800 bg-white appearance-none focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer pr-10 font-medium"
                  >
                    <option>English (Global)</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 border-l border-slate-200">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !botMeetingLink.trim()}
                  className="flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Start Capturing</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: UPLOAD TRANSCRIPT (MAPPED TO CORE CRITICAL REQUIREMENTS) */}
          {activeTab === "upload" && (
            <form onSubmit={handleUploadSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3.5">
                {/* Title */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Meeting Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Sales Kickoff"
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Date */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Meeting Date
                  </label>
                  <input
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Participants */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Participants List
                </label>
                <input
                  type="text"
                  value={participantsInput}
                  onChange={(e) => setParticipantsInput(e.target.value)}
                  placeholder="Anand (alice@scaler.ai), Vikram (bob@scaler.ai)"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* File upload input */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Upload Transcript File (.txt, .json)
                </label>
                <input
                  type="file"
                  accept=".txt,.json"
                  onChange={handleFileUpload}
                  className="w-full text-[10px] text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer border border-dashed border-slate-200 p-2 rounded-md"
                />
              </div>

              {/* Transcript Text */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Transcript Text
                </label>
                <textarea
                  rows={4}
                  value={transcriptText}
                  onChange={(e) => setTranscriptText(e.target.value)}
                  placeholder="Paste dialog lines:&#10;Anand: Welcome everyone...&#10;Vikram: Thanks Anand..."
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none font-mono"
                ></textarea>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Upload & Sync</span>
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
