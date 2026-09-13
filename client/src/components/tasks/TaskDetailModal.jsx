import React, { useState, useEffect } from "react";
import { X, Calendar, User, MessageSquare, Send, CheckCircle2, Clock, Trash2 } from "lucide-react";
import { api } from "../../services/api";
import { Avatar } from "../common/Avatar";
import { StatusBadge, PriorityBadge } from "../common/Badge";
import confetti from "canvas-confetti";

export const TaskDetailModal = ({ taskId, isOpen, onClose, onTaskUpdated, onTaskDeleted }) => {
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (taskId && isOpen) {
      loadTaskData();
      api.getMembers().then(setMembers);
    }
  }, [taskId, isOpen]);

  const loadTaskData = async () => {
    try {
      setLoading(true);
      const data = await api.getTask(taskId);
      setTask(data);
      const commentsData = await api.getComments(taskId);
      setComments(commentsData);
    } catch (err) {
      console.error("Failed loading task:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !taskId) return null;

  const handleStatusChange = async (newStatus) => {
    try {
      const updated = await api.updateTask(task.id, { status: newStatus });
      setTask(updated);
      onTaskUpdated(updated);

      if (newStatus === "COMPLETED") {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err) {
      alert("Failed updating status: " + err.message);
    }
  };

  const handleAssigneeChange = async (newAssigneeId) => {
    try {
      const updated = await api.updateTask(task.id, { assigneeId: newAssigneeId || null });
      setTask(updated);
      onTaskUpdated(updated);
    } catch (err) {
      alert("Failed updating assignee: " + err.message);
    }
  };

  const handlePriorityChange = async (newPriority) => {
    try {
      const updated = await api.updateTask(task.id, { priority: newPriority });
      setTask(updated);
      onTaskUpdated(updated);
    } catch (err) {
      alert("Failed updating priority: " + err.message);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      const added = await api.addComment(task.id, newComment.trim());
      setComments((prev) => [...prev, added]);
      setNewComment("");
    } catch (err) {
      alert("Failed posting comment: " + err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await api.deleteTask(task.id);
        if (onTaskDeleted) onTaskDeleted(task.id);
        onClose();
      } catch (err) {
        alert("Failed deleting task: " + err.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {task?.project?.name || "Project Task"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading || !task ? (
            <div className="py-16 text-center text-slate-500">Loading task details...</div>
          ) : (
            <>
              {/* Task Title & Description */}
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">{task.title}</h1>
                <p className="text-sm text-slate-300 mt-2 whitespace-pre-wrap leading-relaxed">
                  {task.description || "No description provided."}
                </p>
              </div>

              {/* Status, Assignee, Priority Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                {/* Status */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Status
                  </label>
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full text-xs font-medium bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Priority
                  </label>
                  <select
                    value={task.priority}
                    onChange={(e) => handlePriorityChange(e.target.value)}
                    className="w-full text-xs font-medium bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                {/* Assignee */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Assignee
                  </label>
                  <select
                    value={task.assigneeId || ""}
                    onChange={(e) => handleAssigneeChange(e.target.value)}
                    className="w-full text-xs font-medium bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Due Date Indicator */}
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Due Date:</span>
                <span className="font-medium text-slate-200">
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "No due date"}
                </span>
              </div>

              {/* Comments Section */}
              <div className="border-t border-slate-800 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                    Discussion & Collaboration ({comments.length})
                  </h3>
                </div>

                {/* Comments List */}
                <div className="space-y-3">
                  {comments.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2">No comments yet. Start the team discussion below!</p>
                  ) : (
                    comments.map((comm) => (
                      <div key={comm.id} className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 flex gap-3">
                        <Avatar src={comm.user?.avatar} name={comm.user?.name} size="sm" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-200">{comm.user?.name || "Collaborator"}</span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(comm.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{comm.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Comment Input */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Write a comment or update for the team..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 px-3.5 py-2 text-xs bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={submittingComment || !newComment.trim()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-glow disabled:opacity-50 transition-all flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Comment
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
