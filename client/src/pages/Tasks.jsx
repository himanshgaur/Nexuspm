import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  Calendar,
  Clock,
  Kanban,
  List,
  CheckCircle2,
  ArrowUpDown,
} from "lucide-react";
import { api } from "../services/api";
import { useAuthOrg } from "../context/AuthOrgContext";
import { StatusBadge, PriorityBadge } from "../components/common/Badge";
import { Avatar } from "../components/common/Avatar";

export const Tasks = ({ onOpenCreateTask, onOpenTaskDetail }) => {
  const { activeOrg } = useAuthOrg();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc' or 'desc'
  const [viewMode, setViewMode] = useState("KANBAN"); // 'KANBAN' or 'TABLE'

  const loadData = async () => {
    try {
      setLoading(true);
      const [projs, mems] = await Promise.all([api.getProjects(), api.getMembers()]);
      setProjects(projs);
      setMembers(mems);

      const params = {};
      if (selectedProject) params.projectId = selectedProject;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedPriority) params.priority = selectedPriority;
      if (selectedAssignee) params.assigneeId = selectedAssignee;
      if (search) params.search = search;
      params.sort = "dueDate";
      params.order = sortOrder;

      const taskList = await api.getTasks(params);
      setTasks(taskList);
    } catch (err) {
      console.error("Failed loading tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeOrg?.id, selectedProject, selectedStatus, selectedPriority, selectedAssignee, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleQuickStatusChange = async (taskId, newStatus) => {
    try {
      const updated = await api.updateTask(taskId, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch (err) {
      alert("Failed updating task status: " + err.message);
    }
  };

  const columns = [
    { id: "TODO", title: "To Do", bg: "bg-slate-900/50" },
    { id: "IN_PROGRESS", title: "In Progress", bg: "bg-slate-900/50" },
    { id: "COMPLETED", title: "Completed", bg: "bg-slate-900/50" },
  ];

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Task Tracking</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Search, filter, assign, and track progress across all projects in {activeOrg?.name}.
          </p>
        </div>

        <button
          onClick={() => onOpenCreateTask()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-glow transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create Task
        </button>
      </div>

      {/* Search & Multifaceted Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks by title, description, or project name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-24 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-[11px] font-medium text-white transition-colors"
          >
            Search
          </button>
        </form>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
          {/* Project Filter */}
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 truncate"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>

          {/* Assignee Filter */}
          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Assignees</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Deadline Sort */}
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs hover:border-slate-600 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3 h-3" />
              Deadline: {sortOrder === "asc" ? "Earliest" : "Latest"}
            </span>
          </button>
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
            onClick={() => setViewMode("TABLE")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === "TABLE"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            Table
          </button>
        </div>

        <span className="text-xs text-slate-400">{tasks.length} tasks match filters</span>
      </div>

      {/* Tasks Content */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
          <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No tasks found</p>
          <p className="text-xs text-slate-500">Try clearing filters or search query.</p>
        </div>
      ) : viewMode === "KANBAN" ? (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className="rounded-2xl bg-slate-900/50 border border-slate-800/80 p-4 space-y-3 min-h-[420px]"
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

                {/* Cards List */}
                <div className="space-y-3">
                  {colTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => onOpenTaskDetail(t.id)}
                      className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 cursor-pointer shadow-sm hover:shadow-lg transition-all space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-semibold text-indigo-400 truncate max-w-[140px]">
                          {t.project?.name || "Project"}
                        </span>
                        <PriorityBadge priority={t.priority} />
                      </div>

                      <h4 className="text-xs sm:text-sm font-semibold text-white leading-snug">{t.title}</h4>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Avatar src={t.assignee?.avatar} name={t.assignee?.name} size="xs" />
                          <span className="truncate max-w-[80px]">{t.assignee?.name || "Unassigned"}</span>
                        </div>

                        {t.dueDate && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(t.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Task</th>
                <th className="py-3 px-4">Project</th>
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
                  <td className="py-3.5 px-4 text-indigo-400 font-medium truncate">{t.project?.name || "-"}</td>
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
