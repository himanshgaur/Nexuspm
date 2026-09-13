import React from "react";

export const StatusBadge = ({ status }) => {
  const styles = {
    TODO: "bg-slate-800/80 text-slate-300 border-slate-700/60",
    IN_PROGRESS: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    COMPLETED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    PLANNING: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    ACTIVE: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    ON_HOLD: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  };

  const labels = {
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    PLANNING: "Planning",
    ACTIVE: "Active",
    ON_HOLD: "On Hold",
  };

  const cls = styles[status] || "bg-slate-800 text-slate-300 border-slate-700";
  const label = labels[status] || status;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {status === "IN_PROGRESS" && (
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-1.5 animate-pulse" />
      )}
      {status === "COMPLETED" && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
      )}
      {label}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  const styles = {
    HIGH: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    MEDIUM: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    LOW: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  };

  const cls = styles[priority] || "bg-slate-800 text-slate-400 border-slate-700";

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${cls}`}>
      {priority}
    </span>
  );
};

export const RoleBadge = ({ role }) => {
  const styles = {
    OWNER: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    ADMIN: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    MEMBER: "bg-slate-800 text-slate-400 border-slate-700",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${styles[role] || styles.MEMBER}`}>
      {role}
    </span>
  );
};
