import React, { useState } from "react";

export const Avatar = ({ src, name = "User", size = "md", className = "" }) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-7 h-7 text-xs",
    md: "w-8 h-8 text-xs",
    lg: "w-10 h-10 text-sm font-medium",
    xl: "w-14 h-14 text-base font-semibold",
  }[size] || "w-8 h-8 text-xs";

  const getInitials = (n) => {
    if (!n) return "U";
    return n
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // Deterministic color based on name
  const colors = [
    "bg-indigo-600 text-white",
    "bg-purple-600 text-white",
    "bg-pink-600 text-white",
    "bg-emerald-600 text-white",
    "bg-cyan-600 text-white",
    "bg-amber-600 text-white",
  ];
  const charCode = (name || "U").charCodeAt(0);
  const colorClass = colors[charCode % colors.length];

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setImgError(true)}
        className={`${sizeClasses} rounded-full object-cover ring-1 ring-white/10 shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} rounded-full flex items-center justify-center font-medium ring-1 ring-white/10 shrink-0 select-none ${colorClass} ${className}`}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
};
