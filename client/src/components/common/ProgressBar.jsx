import React from "react";

export const ProgressBar = ({ progress = 0, size = "md", showLabel = true, color = "indigo" }) => {
  const clamped = Math.min(100, Math.max(0, Math.round(progress)));

  const heightCls = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  }[size] || "h-2.5";

  const getGradient = (pct) => {
    if (pct === 100) return "from-emerald-500 to-teal-400";
    if (pct > 60) return "from-indigo-500 to-purple-500";
    if (pct > 25) return "from-amber-500 to-orange-500";
    return "from-slate-500 to-indigo-500";
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex items-center justify-between text-xs font-medium mb-1.5">
          <span className="text-slate-400">Progress</span>
          <span className={clamped === 100 ? "text-emerald-400 font-semibold" : "text-slate-200 font-semibold"}>
            {clamped}%
          </span>
        </div>
      )}
      <div className={`w-full bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/40 ${heightCls}`}>
        <div
          className={`h-full rounded-full bg-gradient-to-r ${getGradient(clamped)} transition-all duration-500 ease-out`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
