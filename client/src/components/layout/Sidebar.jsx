import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Settings,
} from "lucide-react";
import { useAuthOrg } from "../../context/AuthOrgContext";
import { Avatar } from "../common/Avatar";
import { AccountSettingsModal } from "../account/AccountSettingsModal";

export const Sidebar = () => {
  const { user, activeOrg } = useAuthOrg();
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/projects", label: "Projects", icon: FolderKanban },
    { to: "/tasks", label: "Tasks & Tracking", icon: CheckSquare },
    { to: "/team", label: "Team Members", icon: Users },
  ];

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-[#0B0F19] hidden md:flex flex-col justify-between shrink-0 p-4">
      <div className="space-y-6">
        {/* Org Banner */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Current Workspace</div>
          <div className="text-sm font-semibold text-white truncate mt-0.5">{activeOrg?.name || "Workspace"}</div>
          <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">{activeOrg?.description || "Collaborative Projects"}</p>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/25 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Account Settings in Bottom Left */}
      <div className="pt-3 border-t border-slate-800/80">
        <button
          onClick={() => setIsAccountOpen(true)}
          className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-850 transition-all text-left group"
        >
          <Avatar src={user?.avatar} name={user?.name || "User"} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
              {user?.name || "My Account"}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {user?.email || "Account Settings"}
            </div>
          </div>
          <Settings className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors shrink-0" />
        </button>

        <AccountSettingsModal
          isOpen={isAccountOpen}
          onClose={() => setIsAccountOpen(false)}
        />
      </div>
    </aside>
  );
};
