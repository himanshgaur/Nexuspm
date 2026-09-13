import React, { useState, useEffect } from "react";
import { Users, UserPlus, Shield, CheckCircle2, MoreVertical, Trash2 } from "lucide-react";
import { api } from "../services/api";
import { useAuthOrg } from "../context/AuthOrgContext";
import { Avatar } from "../components/common/Avatar";
import { RoleBadge } from "../components/common/Badge";
import { InviteMemberModal } from "../components/team/InviteMemberModal";

export const Team = () => {
  const { user, activeOrg } = useAuthOrg();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await api.getMembers();
      setMembers(data);
    } catch (err) {
      console.error("Failed loading members:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [activeOrg?.id]);

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await api.updateMemberRole(memberId, newRole);
      setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)));
    } catch (err) {
      alert("Failed updating member role: " + err.message);
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (window.confirm(`Are you sure you want to remove ${memberName} from this organization?`)) {
      try {
        await api.removeMember(memberId);
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      } catch (err) {
        alert("Failed removing member: " + err.message);
      }
    }
  };

  const isCurrentUserAdminOrOwner = user?.role === "OWNER" || user?.role === "ADMIN";

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Team Management</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage collaborators, roles, and assignments for {activeOrg?.name || "Workspace"}.
          </p>
        </div>

        <button
          onClick={() => setIsInviteOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-glow transition-all shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      {/* Team Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Total Members</div>
            <div className="text-2xl font-bold text-white mt-1">{members.length}</div>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Admins & Owners</div>
            <div className="text-2xl font-bold text-white mt-1">
              {members.filter((m) => m.role === "OWNER" || m.role === "ADMIN").length}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Active Workload</div>
            <div className="text-2xl font-bold text-white mt-1">
              {members.reduce((acc, m) => acc + (m.assignedTasksCount || 0), 0)} Tasks
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Organization Members ({members.length})</h2>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-500 text-xs">Loading team members...</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Active Tasks</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={m.avatar} name={m.name} size="md" />
                      <div>
                        <div className="font-semibold text-white">{m.name}</div>
                        <div className="text-[11px] text-slate-400">{m.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    {isCurrentUserAdminOrOwner && m.role !== "OWNER" ? (
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.id, e.target.value)}
                        className="bg-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1 border border-slate-700 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="MEMBER">MEMBER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    ) : (
                      <RoleBadge role={m.role} />
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                      {m.assignedTasksCount || 0} tasks
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    {m.role !== "OWNER" && isCurrentUserAdminOrOwner && (
                      <button
                        onClick={() => handleRemoveMember(m.id, m.name)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onInvited={(newMember) => {
          setMembers((prev) => [...prev, newMember]);
          loadMembers();
        }}
      />
    </div>
  );
};
