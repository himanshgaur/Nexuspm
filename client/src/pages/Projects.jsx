import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FolderKanban, Plus, Search, Calendar, CheckSquare, Trash2, ArrowRight } from "lucide-react";
import { api } from "../services/api";
import { useAuthOrg } from "../context/AuthOrgContext";
import { ProgressBar } from "../components/common/ProgressBar";
import { StatusBadge, PriorityBadge } from "../components/common/Badge";
import { Avatar } from "../components/common/Avatar";

export const Projects = ({ onOpenCreateProject }) => {
  const { activeOrg } = useAuthOrg();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await api.getProjects();
      setProjects(data);
    } catch (err) {
      console.error("Failed loading projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [activeOrg?.id]);

  const handleDeleteProject = async (e, projectId) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this project and all its tasks?")) {
      try {
        await api.deleteProject(projectId);
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
      } catch (err) {
        alert("Failed deleting project: " + err.message);
      }
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Projects</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your organization's deliverables, timelines, and progress.
          </p>
        </div>

        <button
          onClick={onOpenCreateProject}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-glow transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Project
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {["ALL", "ACTIVE", "PLANNING", "COMPLETED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors shrink-0 ${
                statusFilter === st
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {st === "ALL" ? "All Projects" : st}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs">Loading projects...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
          <FolderKanban className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No projects found</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search ? "Try adjusting your search criteria" : "Create your first project to begin assigning tasks."}
          </p>
          {!search && (
            <button
              onClick={onOpenCreateProject}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              New Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((p) => (
            <Link
              key={p.id}
              to={`/projects/${p.id}`}
              className="group p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-5 hover:shadow-xl hover:shadow-indigo-950/20"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <StatusBadge status={p.status} />
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={p.priority} />
                    <button
                      onClick={(e) => handleDeleteProject(e, p.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/20 hover:text-rose-400 text-slate-500 transition-all"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {p.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {p.description || "No description specified."}
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-3 border-t border-slate-800/80">
                {/* Progress bar */}
                <ProgressBar progress={p.progress} />

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-slate-500" />
                    <span>{p.completedTasks}/{p.totalTasks} Tasks</span>
                  </span>

                  {p.dueDate && (
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{new Date(p.dueDate).toLocaleDateString()}</span>
                    </span>
                  )}
                </div>

                {/* Team Avatars */}
                {p.members && p.members.length > 0 && (
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex -space-x-2 overflow-hidden">
                      {p.members.slice(0, 4).map((m) => (
                        <Avatar key={m.id} src={m.avatar} name={m.name} size="xs" />
                      ))}
                      {p.members.length > 4 && (
                        <div className="w-6 h-6 rounded-full bg-slate-800 text-[10px] text-slate-400 font-semibold flex items-center justify-center ring-1 ring-slate-700">
                          +{p.members.length - 4}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-indigo-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      Details <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
