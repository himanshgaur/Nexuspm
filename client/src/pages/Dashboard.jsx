import React, { useState, useEffect } from "react";
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  ArrowRight,
  TrendingUp,
  Activity,
  Plus,
} from "lucide-react";
import { api } from "../services/api";
import { useAuthOrg } from "../context/AuthOrgContext";
import { ProgressBar } from "../components/common/ProgressBar";
import { StatusBadge, PriorityBadge } from "../components/common/Badge";
import { Avatar } from "../components/common/Avatar";
import { Link } from "react-router-dom";

export const Dashboard = ({ onOpenCreateProject, onOpenCreateTask, onOpenTaskDetail }) => {
  const { activeOrg } = useAuthOrg();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboard();
      setData(res);
    } catch (err) {
      console.error("Failed loading dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [activeOrg?.id]);

  if (loading || !data) {
    return (
      <div className="flex-1 p-6 md:p-8 flex items-center justify-center text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span className="text-xs font-medium">Loading workspace dashboard...</span>
        </div>
      </div>
    );
  }

  const { metrics, deadlines, recentProjects, recentTasks, activities } = data;

  const statCards = [
    {
      title: "Total Projects",
      value: metrics.totalProjects,
      sub: `${metrics.activeProjects} active, ${metrics.completedProjects} completed`,
      icon: FolderKanban,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    },
    {
      title: "Active Tasks",
      value: metrics.inProgressTasks + metrics.pendingTasks,
      sub: `${metrics.pendingTasks} pending, ${metrics.inProgressTasks} in progress`,
      icon: Clock,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Completed Tasks",
      value: metrics.completedTasks,
      sub: `Across all organization projects`,
      icon: CheckCircle2,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Overdue Tasks",
      value: metrics.overdueTasksCount,
      sub: metrics.overdueTasksCount > 0 ? "Requires attention" : "All deadlines on track",
      icon: AlertTriangle,
      color: metrics.overdueTasksCount > 0 ? "text-rose-400 bg-rose-500/10 border-rose-500/30" : "text-slate-400 bg-slate-800/40 border-slate-700/40",
    },
  ];

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8 overflow-y-auto max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              Workspace Overview
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-2">
            Welcome to {activeOrg?.name || "Workspace"}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Centralized hub for planning, task assignment, progress tracking, and team collaboration.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenCreateProject}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            + New Project
          </button>
          <button
            onClick={onOpenCreateTask}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-glow transition-all"
          >
            + Add Task
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-sm flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{card.title}</span>
                <div className={`p-2 rounded-xl border ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-white tracking-tight">{card.value}</div>
                <div className="text-xs text-slate-500 mt-1">{card.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deadlines & Urgent Attention Section */}
      {(deadlines.overdue.length > 0 || deadlines.dueToday.length > 0 || deadlines.upcoming.length > 0) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Deadlines & Action Items
            </h2>
            <Link to="/tasks" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
              View all tasks <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Overdue */}
            <div className="p-4 rounded-xl bg-rose-950/15 border border-rose-500/25 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Overdue ({deadlines.overdue.length})</span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              {deadlines.overdue.length === 0 ? (
                <p className="text-xs text-slate-500">No overdue tasks 🎉</p>
              ) : (
                <div className="space-y-2">
                  {deadlines.overdue.slice(0, 3).map((t) => (
                    <div
                      key={t.id}
                      onClick={() => onOpenTaskDetail(t.id)}
                      className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-rose-500/40 cursor-pointer transition-colors"
                    >
                      <p className="text-xs font-semibold text-slate-200 truncate">{t.title}</p>
                      <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                        <span>{t.project?.name}</span>
                        <span className="text-rose-400 font-medium">Due {new Date(t.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Due Today */}
            <div className="p-4 rounded-xl bg-amber-950/15 border border-amber-500/25 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Due Today ({deadlines.dueToday.length})</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              {deadlines.dueToday.length === 0 ? (
                <p className="text-xs text-slate-500">Nothing due today</p>
              ) : (
                <div className="space-y-2">
                  {deadlines.dueToday.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => onOpenTaskDetail(t.id)}
                      className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition-colors"
                    >
                      <p className="text-xs font-semibold text-slate-200 truncate">{t.title}</p>
                      <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                        <span>{t.project?.name}</span>
                        <span className="text-amber-400 font-medium">Today</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming This Week */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Upcoming ({deadlines.upcoming.length})</span>
                <Calendar className="w-4 h-4 text-slate-400" />
              </div>
              {deadlines.upcoming.length === 0 ? (
                <p className="text-xs text-slate-500">No deadlines in the next 7 days</p>
              ) : (
                <div className="space-y-2">
                  {deadlines.upcoming.slice(0, 3).map((t) => (
                    <div
                      key={t.id}
                      onClick={() => onOpenTaskDetail(t.id)}
                      className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-colors"
                    >
                      <p className="text-xs font-semibold text-slate-200 truncate">{t.title}</p>
                      <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                        <span>{t.project?.name}</span>
                        <span className="text-indigo-400 font-medium">{new Date(t.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Projects & Activities Dual Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Projects Progress */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Project Progress Tracking
            </h2>
            <Link to="/projects" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
              All Projects <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recentProjects.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge status={p.status} />
                    <PriorityBadge priority={p.priority} />
                  </div>
                  <h3 className="text-base font-bold text-white mt-2.5 tracking-tight hover:text-indigo-400 transition-colors">
                    <Link to={`/projects/${p.id}`}>{p.name}</Link>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.description}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-800/80">
                  <ProgressBar progress={p.progress} />
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      {p.completedTasks} of {p.totalTasks} tasks done
                    </span>
                    <Link to={`/projects/${p.id}`} className="text-indigo-400 hover:underline text-[11px] font-medium">
                      Open Project →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Recent Activities Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Recent Activity
            </h2>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3.5 max-h-[460px] overflow-y-auto">
            {activities.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No recent team activities</p>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 text-xs">
                  <Avatar src={act.user?.avatar} name={act.user?.name} size="xs" className="mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-300">
                      <span className="font-semibold text-white">{act.user?.name || "Member"}</span>{" "}
                      <span className="text-slate-400">{act.details}</span>
                    </p>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      {new Date(act.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
