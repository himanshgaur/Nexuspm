import React, { useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Navbar } from "./components/layout/Navbar";
import { Sidebar } from "./components/layout/Sidebar";
import { Dashboard } from "./pages/Dashboard";
import { Projects } from "./pages/Projects";
import { ProjectDetail } from "./pages/ProjectDetail";
import { Tasks } from "./pages/Tasks";
import { Team } from "./pages/Team";
import { Landing } from "./pages/Landing";
import { CreateProjectModal } from "./components/projects/CreateProjectModal";
import { CreateTaskModal } from "./components/tasks/CreateTaskModal";
import { TaskDetailModal } from "./components/tasks/TaskDetailModal";
import { useAuthOrg } from "./context/AuthOrgContext";

export function AppContent() {
  const { user } = useAuthOrg();
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [selectedTaskDetailId, setSelectedTaskDetailId] = useState(null);
  const [defaultProjectIdForTask, setDefaultProjectIdForTask] = useState("");
  const navigate = useNavigate();

  // If user explicitly logs out or wants to view landing
  if (!isAuthenticated) {
    return <Landing onEnterApp={() => setIsAuthenticated(true)} />;
  }

  const handleOpenCreateTask = (projectId = "") => {
    setDefaultProjectIdForTask(projectId);
    setIsCreateTaskOpen(true);
  };

  const handleTaskCreated = (newTask) => {
    // Open the detail modal for the newly created task or navigate to tasks
    setSelectedTaskDetailId(newTask.id);
  };

  const handleProjectCreated = (newProject) => {
    navigate(`/projects/${newProject.id}`);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0B0F19]">
      {/* Top Navigation */}
      <Navbar
        onOpenCreateProject={() => setIsCreateProjectOpen(true)}
        onOpenCreateTask={() => handleOpenCreateTask()}
      />

      {/* Main Workspace View */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 flex flex-col overflow-hidden bg-[#0B0F19]">
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  onOpenCreateProject={() => setIsCreateProjectOpen(true)}
                  onOpenCreateTask={handleOpenCreateTask}
                  onOpenTaskDetail={(taskId) => setSelectedTaskDetailId(taskId)}
                />
              }
            />
            <Route
              path="/projects"
              element={<Projects onOpenCreateProject={() => setIsCreateProjectOpen(true)} />}
            />
            <Route
              path="/projects/:projectId"
              element={
                <ProjectDetail
                  onOpenCreateTask={handleOpenCreateTask}
                  onOpenTaskDetail={(taskId) => setSelectedTaskDetailId(taskId)}
                />
              }
            />
            <Route
              path="/tasks"
              element={
                <Tasks
                  onOpenCreateTask={handleOpenCreateTask}
                  onOpenTaskDetail={(taskId) => setSelectedTaskDetailId(taskId)}
                />
              }
            />
            <Route path="/team" element={<Team />} />
          </Routes>
        </main>
      </div>

      {/* Global Modals */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onCreated={handleProjectCreated}
      />

      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        onCreated={handleTaskCreated}
        defaultProjectId={defaultProjectIdForTask}
      />

      <TaskDetailModal
        taskId={selectedTaskDetailId}
        isOpen={!!selectedTaskDetailId}
        onClose={() => setSelectedTaskDetailId(null)}
        onTaskUpdated={() => {}}
        onTaskDeleted={() => setSelectedTaskDetailId(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
