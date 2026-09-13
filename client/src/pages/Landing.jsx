import React from "react";
import { Layers, ArrowRight, CheckCircle, Zap, Shield, Database, Users } from "lucide-react";

export const Landing = ({ onEnterApp }) => {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="h-20 border-b border-slate-800/80 px-6 max-w-7xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-glow">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Nexus<span className="text-indigo-400">PM</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onEnterApp}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-glow transition-all flex items-center gap-1.5"
          >
            Launch Workspace <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-20 text-center space-y-8 flex-1 flex flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
          <Zap className="w-3.5 h-3.5" />
          Enterprise Modern Project Management SaaS
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-3xl leading-[1.15]">
          Plan, collaborate, and deliver projects{" "}
          <span className="gradient-text">faster than ever.</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          The all-in-one platform for high-velocity teams. Features multi-tenant organization scoping,
          Kanban boards, real-time discussions, and event-driven background reminders.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={onEnterApp}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-glow transition-all flex items-center justify-center gap-2"
          >
            Enter Project Workspace
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Tech Stack Callout */}
        <div className="pt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-left space-y-1">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
              <Shield className="w-4 h-4" /> Clerk Auth
            </div>
            <p className="text-[11px] text-slate-400">Secure user profiles and team role permissions</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-left space-y-1">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs">
              <Database className="w-4 h-4" /> Neon PostgreSQL
            </div>
            <p className="text-[11px] text-slate-400">Serverless PostgreSQL with Prisma ORM pooling</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-left space-y-1">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
              <Zap className="w-4 h-4" /> Inngest Engine
            </div>
            <p className="text-[11px] text-slate-400">Scheduled reminders and event-driven notifications</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-left space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
              <Users className="w-4 h-4" /> Multi-Tenant
            </div>
            <p className="text-[11px] text-slate-400">Isolated organizations, teams, and projects</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        NexusPM SaaS Platform &bull; Built with React, Vite, Express, Neon PostgreSQL, Clerk, and Inngest.
      </footer>
    </div>
  );
};
