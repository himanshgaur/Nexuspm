import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Plus,
  Kanban,
  List,
  Clock,
  User,
  MoreVertical,
  Settings,
} from "lucide-react";
import { api } from "../services/api";
import { ProgressBar } from "../components/common/ProgressBar";
import { StatusBadge, PriorityBadge } from "../components/common/Badge";
import { Avatar } from "../components/common/Avatar";
import { ProjectSettingsSection } from "../components/projects/ProjectSettingsSection";

export const ProjectDetail = ({ onOpenCreateTask, onOpenTaskDetail }) => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("KANBAN"); // "KANBAN" or "LIST"

  const loadProjectData = async () => {
    try {
      setLoading(true);
      const proj = await api.getProject(projectId);
      setProject(proj);
      const projTasks = await api.getTasks({ projectId });
      setTasks(projTasks);
    } catch (err) {
      console.error("Failed loading project details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  const handleQuickStatusChange = async (taskId, newStatus) => {
    try {
      const updated = await api.updateTask(taskId, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));

      // Reload project for recalculated progress
      const refreshedProject = await api.getProject(projectId);
      setProject(refreshedProject);
    } catch (err) {
      alert("Failed updating task: " + err.message);
    }
  };

  if (loading || !project) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center text-slate-500">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const columns = [
    { id: "TODO", title: "To Do", color: "border-slate-700/60" },
    { id: "IN_PROGRESS", title: "In Progress", color: "border-indigo-500/40" },
    { id: "COMPLETED", title: "Completed", color: "border-emerald-500/40" },
  ];

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto">
      {/* Back button */}
      <Link
        to="/projects"
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Projects
      </Link>

      {/* Project Banner Card */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <StatusBadge status={project.status} />
              <PriorityBadge priority={project.priority} />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{project.name}</h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              {project.description || "No description provided."}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setViewMode(viewMode === "SETTINGS" ? "KANBAN" : "SETTINGS")}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 border ${
                viewMode === "SETTINGS"
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-glow"
                  : "bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Settings className="w-4 h-4" />
              Project Settings
            </button>
            <button
              onClick={() => onOpenCreateTask(project.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-glow transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>
        </div>

        {/* Progress & Meta Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80 items-center">
          <div className="md:col-span-2">
            <ProgressBar progress={project.progress} size="md" />
          </div>

          <div className="flex items-center justify-end gap-6 text-xs text-slate-400">
            {project.dueDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Due {new Date(project.dueDate).toLocaleDateString()}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 font-medium text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{project.completedTasks} / {project.totalTasks} Completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* View Switcher Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setViewMode("KANBAN")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === "KANBAN"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            Board
          </button>
          <button
            onClick={() => setViewMode("LIST")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === "LIST"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            List
          </button>
          <button
            onClick={() => setViewMode("SETTINGS")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === "SETTINGS"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Project Settings
          </button>
        </div>

        <span className="text-xs text-slate-400">
          {viewMode === "SETTINGS" ? "Project Configuration" : `${tasks.length} Total Tasks`}
        </span>
      </div>

      {/* Content based on View Mode */}
      {viewMode === "SETTINGS" ? (
        <ProjectSettingsSection
          project={project}
          onProjectUpdated={(updated) => {
            setProject((prev) => ({ ...prev, ...updated }));
          }}
        />
      ) : viewMode === "KANBAN" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className="rounded-2xl bg-slate-900/50 border border-slate-800/80 p-4 space-y-3 min-h-[400px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    {col.title}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400">
                    {colTasks.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-3">
                  {colTasks.length === 0 ? (
                    <div className="py-10 text-center text-slate-600 text-xs italic">
                      No tasks in {col.title}
                    </div>
                  ) : (
                    colTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => onOpenTaskDetail(t.id)}
                        className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 cursor-pointer shadow-sm hover:shadow-lg transition-all space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <PriorityBadge priority={t.priority} />
                          {t.dueDate && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(t.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs sm:text-sm font-semibold text-white leading-snug">{t.title}</h4>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Avatar src={t.assignee?.avatar} name={t.assignee?.name} size="xs" />
                            <span className="truncate max-w-[90px]">{t.assignee?.name || "Unassigned"}</span>
                          </div>

                          {/* Quick move selector */}
                          <select
                            value={t.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleQuickStatusChange(t.id, e.target.value)}
                            className="bg-slate-800 text-slate-300 text-[10px] rounded px-1.5 py-0.5 border border-slate-700"
                          >
                            <option value="TODO">To Do</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Task List View */
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Task</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tasks.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => onOpenTaskDetail(t.id)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4 font-semibold text-white max-w-xs truncate">{t.title}</td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="py-3.5 px-4">
                    <PriorityBadge priority={t.priority} />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <Avatar src={t.assignee?.avatar} name={t.assignee?.name} size="xs" />
                      <span className="text-slate-300">{t.assignee?.name || "Unassigned"}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
