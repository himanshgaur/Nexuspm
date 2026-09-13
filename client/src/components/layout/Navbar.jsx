import React, { useState } from "react";
import { useAuthOrg } from "../../context/AuthOrgContext";
import { NotificationPopover } from "../notifications/NotificationPopover";
import { Avatar } from "../common/Avatar";
import {
  Building2,
  ChevronDown,
  Plus,
  Layers,
  Sparkles,
  LogOut,
  UserCheck,
} from "lucide-react";
import { UserButton } from "@clerk/clerk-react";

export const Navbar = ({ onOpenCreateProject, onOpenCreateTask }) => {
  const { user, organizations, activeOrg, switchOrg, createOrg } = useAuthOrg();
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");

  const handleCreateOrgSubmit = async (e) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    try {
      await createOrg(newOrgName.trim());
      setNewOrgName("");
      setIsCreatingOrg(false);
      setShowOrgDropdown(false);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-800/80 bg-[#0B0F19]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Brand & Org Switcher */}
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-glow">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white hidden sm:inline-block">
            Nexus<span className="text-indigo-400">PM</span>
          </span>
        </div>

        <div className="h-5 w-[1px] bg-slate-800 hidden sm:block" />

        {/* Organization Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowOrgDropdown(!showOrgDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-sm font-medium text-slate-200 hover:border-slate-700 hover:bg-slate-850 transition-colors"
          >
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span className="max-w-[140px] truncate">{activeOrg?.name || "Select Org"}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showOrgDropdown && (
            <div className="absolute left-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-50 p-2">
              <div className="px-2.5 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Organizations
              </div>
              <div className="space-y-1">
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => {
                      switchOrg(org);
                      setShowOrgDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                      activeOrg?.id === org.id
                        ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                        : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <span className="truncate">{org.name}</span>
                    {activeOrg?.id === org.id && <span className="text-[10px] text-indigo-400 font-semibold">Active</span>}
                  </button>
                ))}
              </div>

              <div className="my-2 border-t border-slate-800/80" />

              {!isCreatingOrg ? (
                <button
                  onClick={() => setIsCreatingOrg(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-indigo-400 hover:bg-indigo-950/30 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create New Organization
                </button>
              ) : (
                <form onSubmit={handleCreateOrgSubmit} className="p-1 space-y-2">
                  <input
                    type="text"
                    placeholder="Org Name..."
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    autoFocus
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex gap-1.5 justify-end">
                    <button
                      type="button"
                      onClick={() => setIsCreatingOrg(false)}
                      className="px-2 py-1 text-[11px] rounded bg-slate-800 text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-2.5 py-1 text-[11px] rounded bg-indigo-600 text-white font-medium hover:bg-indigo-500"
                    >
                      Create
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Quick Actions, Notifications, User Switcher */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Add Buttons */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={onOpenCreateProject}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Project
          </button>
          <button
            onClick={onOpenCreateTask}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white shadow-sm transition-all hover:shadow-glow"
          >
            <Plus className="w-3.5 h-3.5" />
            New Task
          </button>
        </div>

        {/* Notifications */}
        <NotificationPopover />

        <div className="h-5 w-[1px] bg-slate-800 mx-1" />

        {/* User / Clerk Profile */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-semibold text-slate-200 leading-none">{user?.name || "User"}</p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{user?.email || "Member"}</p>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
};
