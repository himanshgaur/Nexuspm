import React, { useState } from "react";
import { X, User, Mail, Shield, KeyRound, LogOut, CheckCircle2, Building } from "lucide-react";
import { useAuthOrg } from "../../context/AuthOrgContext";
import { Avatar } from "../common/Avatar";
import { useClerk } from "@clerk/clerk-react";

export const AccountSettingsModal = ({ isOpen, onClose }) => {
  const { user, activeOrg } = useAuthOrg();
  const clerk = useClerk();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleOpenClerkProfile = () => {
    if (clerk && clerk.openUserProfile) {
      clerk.openUserProfile();
    }
  };

  const handleSignOut = () => {
    if (clerk && clerk.signOut) {
      clerk.signOut();
    } else {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Account Settings</h2>
              <p className="text-xs text-slate-400">Manage your profile, security, and workspace role</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Profile Card */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3.5">
            <Avatar src={user?.avatar} name={user?.name || "User"} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white truncate">{user?.name || "User"}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  {user?.role || "MEMBER"}
                </span>
              </div>
              <div className="text-xs text-slate-400 truncate mt-0.5 flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                <span>{user?.email || "No email available"}</span>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300">
              <span className="flex items-center gap-2 text-slate-400">
                <Building className="w-4 h-4 text-indigo-400" />
                Active Workspace
              </span>
              <span className="font-semibold text-white">{activeOrg?.name || "Default Workspace"}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300">
              <span className="flex items-center gap-2 text-slate-400">
                <Shield className="w-4 h-4 text-emerald-400" />
                Authentication
              </span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Clerk Verified
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <button
              onClick={() => {
                onClose();
                handleOpenClerkProfile();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-glow transition-all"
            >
              <KeyRound className="w-4 h-4" />
              Manage Profile & Security (Clerk)
            </button>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
