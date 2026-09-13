import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { serve } from "inngest/express";
import { inngest } from "./inngest/client.js";
import { inngestFunctions } from "./inngest/functions.js";
import { requireAuth } from "./middleware/auth.js";
import { requireOrgContext } from "./middleware/orgContext.js";

import * as orgController from "./controllers/orgController.js";
import * as projectController from "./controllers/projectController.js";
import * as taskController from "./controllers/taskController.js";
import * as commentController from "./controllers/commentController.js";
import * as dashboardController from "./controllers/dashboardController.js";
import * as notificationController from "./controllers/notificationController.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Ensure /api prefix compatibility for both standalone server and Vercel serverless
app.use((req, res, next) => {
  if (!req.url.startsWith("/api") && !req.url.startsWith("/inngest")) {
    req.url = `/api${req.url}`;
  }
  next();
});

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Project Management System API",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Inngest Background Jobs & Event Handlers Endpoint
app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions: inngestFunctions,
  })
);

// Auth / Profile Info
app.get("/api/me", requireAuth, (req, res) => {
  res.json(req.user);
});

// Organization Routes
app.get("/api/organizations", requireAuth, orgController.getUserOrganizations);
app.post("/api/organizations", requireAuth, orgController.createOrganization);
app.get("/api/organizations/members", requireAuth, requireOrgContext, orgController.getOrganizationMembers);
app.post("/api/organizations/invite", requireAuth, requireOrgContext, orgController.inviteMember);
app.patch("/api/organizations/members/:memberId", requireAuth, requireOrgContext, orgController.updateMemberRole);
app.delete("/api/organizations/members/:memberId", requireAuth, requireOrgContext, orgController.removeMember);

// Dashboard Route
app.get("/api/dashboard", requireAuth, requireOrgContext, dashboardController.getDashboardStats);

// Project Routes
app.get("/api/projects", requireAuth, requireOrgContext, projectController.getProjects);
app.get("/api/projects/:projectId", requireAuth, requireOrgContext, projectController.getProjectById);
app.post("/api/projects", requireAuth, requireOrgContext, projectController.createProject);
app.put("/api/projects/:projectId", requireAuth, requireOrgContext, projectController.updateProject);
app.delete("/api/projects/:projectId", requireAuth, requireOrgContext, projectController.deleteProject);

// Task Routes
app.get("/api/tasks", requireAuth, requireOrgContext, taskController.getTasks);
app.get("/api/tasks/:taskId", requireAuth, requireOrgContext, taskController.getTaskById);
app.post("/api/tasks", requireAuth, requireOrgContext, taskController.createTask);
app.put("/api/tasks/:taskId", requireAuth, requireOrgContext, taskController.updateTask);
app.delete("/api/tasks/:taskId", requireAuth, requireOrgContext, taskController.deleteTask);

// Comment Routes
app.get("/api/tasks/:taskId/comments", requireAuth, requireOrgContext, commentController.getComments);
app.post("/api/tasks/:taskId/comments", requireAuth, requireOrgContext, commentController.createComment);

// Notification Routes
app.get("/api/notifications", requireAuth, notificationController.getNotifications);
app.patch("/api/notifications/:notificationId/read", requireAuth, notificationController.markAsRead);
app.post("/api/notifications/read-all", requireAuth, notificationController.markAllAsRead);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled API Error:", err);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

// Start standalone server when running directly
if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 [Server] Project Management API listening on http://localhost:${PORT}`);
    console.log(`⚡ [Inngest] Background job endpoint ready at http://localhost:${PORT}/api/inngest`);
  });
}

export default app;
