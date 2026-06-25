"use client";

import React, { useState } from "react";
import { 
  CheckSquare, 
  Square, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Plus, 
  User2,
  BookmarkCheck,
  Loader2
} from "lucide-react";
import { API_BASE_URL } from "@/config";
import { ActionItem } from "@/types";
import { toast } from "react-hot-toast";

interface ActionItemsPanelProps {
  meetingId: number;
  initialItems: ActionItem[];
}

export const ActionItemsPanel: React.FC<ActionItemsPanelProps> = ({ 
  meetingId, 
  initialItems 
}) => {
  const [items, setItems] = useState<ActionItem[]>(initialItems);
  const [newText, setNewText] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState<number | null>(null); // tracks item id being updated

  // Edit Mode states
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editingAssignee, setEditingAssignee] = useState("");

  const handleToggle = async (item: ActionItem) => {
    setLoading(item.id);
    try {
      const response = await fetch(
        `${API_BASE_URL}/meetings/${meetingId}/action-items/${item.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ is_completed: !item.is_completed }),
        }
      );
      if (response.ok) {
        const updated = await response.json();
        setItems(prev => prev.map(i => (i.id === item.id ? updated : i)));
        toast.success(item.is_completed ? "Action item marked incomplete" : "Action item completed!");
      } else {
        toast.error("Failed to update action item status");
      }
    } catch (err) {
      console.error("Failed to toggle action item:", err);
      toast.error("An error occurred");
    } finally {
      setLoading(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/meetings/${meetingId}/action-items`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: newText.trim(),
            assigned_to: newAssignee.trim() || null,
            is_completed: false,
          }),
        }
      );
      if (response.ok) {
        const created = await response.json();
        setItems(prev => [...prev, created]);
        setNewText("");
        setNewAssignee("");
        setIsAdding(false);
        toast.success("Action item added!");
      } else {
        toast.error("Failed to create action item");
      }
    } catch (err) {
      console.error("Failed to create action item:", err);
      toast.error("An error occurred");
    }
  };

  const handleSaveEdit = async (id: number) => {
    if (!editingText.trim()) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/meetings/${meetingId}/action-items/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: editingText.trim(),
            assigned_to: editingAssignee.trim() || null,
          }),
        }
      );
      if (response.ok) {
        const updated = await response.json();
        setItems(prev => prev.map(i => (i.id === id ? updated : i)));
        setEditingId(null);
        toast.success("Action item updated!");
      } else {
        toast.error("Failed to update action item");
      }
    } catch (err) {
      console.error("Failed to edit action item:", err);
      toast.error("An error occurred");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this task?")) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/meetings/${meetingId}/action-items/${id}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        setItems(prev => prev.filter(i => i.id !== id));
        toast.success("Action item deleted");
      } else {
        toast.error("Failed to delete action item");
      }
    } catch (err) {
      console.error("Failed to delete action item:", err);
      toast.error("An error occurred");
    }
  };

  const startEdit = (item: ActionItem) => {
    setEditingId(item.id);
    setEditingText(item.text);
    setEditingAssignee(item.assigned_to || "");
  };

  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-50 pb-3">
        <div className="flex items-center gap-2 text-emerald-600">
          <BookmarkCheck className="h-4.5 w-4.5" />
          <h3 className="text-xs font-bold uppercase tracking-wider">Action Items & Tasks</h3>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-600 hover:bg-indigo-100 transition-colors"
        >
          <Plus className="h-3 w-3" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Add Task Form inline */}
      {isAdding && (
        <form onSubmit={handleCreate} className="bg-slate-50 rounded-md p-3 border border-slate-200/60 space-y-2 animate-in slide-in-from-top-2 duration-150">
          <input
            type="text"
            required
            placeholder="Task description..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            className="w-full rounded border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Assignee (e.g. Bob)"
              value={newAssignee}
              onChange={(e) => setNewAssignee(e.target.value)}
              className="flex-1 rounded border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="rounded border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Checklist list */}
      <div className="space-y-2.5">
        {items.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No tasks logged for this meeting.</p>
        ) : (
          items.map((item) => {
            const isEditing = item.id === editingId;
            return (
              <div 
                key={item.id}
                className={`group flex items-start justify-between gap-3 rounded-md border border-slate-100 p-3 transition-colors ${
                  item.is_completed ? "bg-slate-50/50" : "bg-white hover:bg-slate-50/20"
                }`}
              >
                {/* Left Side: Checkbox and content */}
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <button
                    disabled={loading === item.id}
                    onClick={() => handleToggle(item)}
                    className="mt-0.5 text-slate-400 hover:text-indigo-600 disabled:text-slate-300 transition-colors cursor-pointer"
                  >
                    {loading === item.id ? (
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    ) : item.is_completed ? (
                      <CheckSquare className="h-4.5 w-4.5 text-indigo-600 fill-indigo-50" />
                    ) : (
                      <Square className="h-4.5 w-4.5" />
                    )}
                  </button>

                  {isEditing ? (
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full rounded border border-slate-200 px-2 py-1 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={editingAssignee}
                        onChange={(e) => setEditingAssignee(e.target.value)}
                        className="w-full rounded border border-slate-200 px-2 py-1 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                        placeholder="Unassigned"
                      />
                    </div>
                  ) : (
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm leading-relaxed ${
                        item.is_completed ? "text-slate-400 line-through" : "text-slate-700"
                      }`}>
                        {item.text}
                      </p>
                      {item.assigned_to && (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 mt-1.5">
                          <User2 className="h-2.5 w-2.5" />
                          <span>Assigned to: {item.assigned_to}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Side: Edit / Delete buttons */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => handleSaveEdit(item.id)}
                        className="p-1 rounded text-emerald-600 hover:bg-slate-100 transition-colors"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 rounded text-slate-400 hover:bg-slate-100 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(item)}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Edit task"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Delete task"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
