import { inngest } from "./client.js";
import prisma from "../prisma.js";

/**
 * 1. Scheduled Background Job: Deadline Reminders
 * Checks for tasks due within 24 hours or overdue, and issues notifications
 */
export const checkDeadlinesCron = inngest.createFunction(
  { id: "check-task-deadlines", name: "Check Task Deadlines & Send Reminders" },
  { cron: "0 9 * * *" }, // Daily at 9 AM UTC
  async ({ step }) => {
    const results = await step.run("scan-tasks-and-notify", async () => {
      const now = new Date();
      const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Find all tasks that are not completed and have a due date
      const tasks = await prisma.task.findMany({
        where: {
          status: { in: ["TODO", "IN_PROGRESS"] },
        },
        include: {
          assignee: true,
          project: true,
        },
      });

      let remindersSent = 0;

      for (const task of tasks) {
        if (!task.dueDate || !task.assigneeId) continue;
        const dueDate = new Date(task.dueDate);

        // Check if overdue
        if (dueDate < now) {
          await prisma.notification.create({
            data: {
              userId: task.assigneeId,
              title: "Task Overdue ⚠️",
              message: `Task "${task.title}" was due on ${dueDate.toLocaleDateString()}. Please update its status.`,
              type: "DEADLINE_APPROACHING",
              link: `/tasks?taskId=${task.id}`,
            },
          });
          remindersSent++;
        }
        // Check if due within next 24 hours
        else if (dueDate <= next24Hours) {
          await prisma.notification.create({
            data: {
              userId: task.assigneeId,
              title: "Deadline Tomorrow ⏰",
              message: `Task "${task.title}" is due tomorrow!`,
              type: "DEADLINE_APPROACHING",
              link: `/tasks?taskId=${task.id}`,
            },
          });
          remindersSent++;
        }
      }

      return { scanned: tasks.length, remindersSent };
    });

    return results;
  }
);

/**
 * 2. Event-driven Function: Task Assigned Notification
 */
export const onTaskAssigned = inngest.createFunction(
  { id: "on-task-assigned", name: "Send Notification on Task Assignment" },
  { event: "task/assigned" },
  async ({ event, step }) => {
    const { taskId, assigneeId, assignerName, taskTitle } = event.data;

    await step.run("create-assignment-notification", async () => {
      if (!assigneeId) return;

      await prisma.notification.create({
        data: {
          userId: assigneeId,
          title: "New Task Assigned 🎯",
          message: `${assignerName || "A team member"} assigned you to "${taskTitle}".`,
          type: "TASK_ASSIGNED",
          link: `/tasks?taskId=${taskId}`,
        },
      });
    });

    return { success: true, taskId, assigneeId };
  }
);

/**
 * 3. Event-driven Function: Auto Calculate Project Progress & Status Update
 */
export const onTaskStatusChanged = inngest.createFunction(
  { id: "on-task-status-changed", name: "Recalculate Project Progress & Notify Team" },
  { event: "task/status_changed" },
  async ({ event, step }) => {
    const { projectId, taskId, newStatus, updaterName, taskTitle } = event.data;

    const progressData = await step.run("calculate-progress", async () => {
      if (!projectId) return null;

      const projectTasks = await prisma.task.findMany({
        where: { projectId },
      });

      if (!projectTasks || projectTasks.length === 0) return { progress: 0 };

      const completedCount = projectTasks.filter((t) => t.status === "COMPLETED").length;
      const progress = Math.round((completedCount / projectTasks.length) * 100);

      // Update project progress
      await prisma.project.update({
        where: { id: projectId },
        data: {
          progress,
          status: progress === 100 ? "COMPLETED" : "ACTIVE",
        },
      });

      return { total: projectTasks.length, completed: completedCount, progress };
    });

    return { success: true, progressData };
  }
);

/**
 * 4. Event-driven Function: Comment Created Notification
 */
export const onCommentCreated = inngest.createFunction(
  { id: "on-comment-created", name: "Notify Collaborators on Task Comment" },
  { event: "task/comment_created" },
  async ({ event, step }) => {
    const { taskId, authorId, authorName, commentPreview } = event.data;

    await step.run("notify-collaborators", async () => {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
      });

      if (!task) return;

      // Notify assignee if not the author
      if (task.assigneeId && task.assigneeId !== authorId) {
        await prisma.notification.create({
          data: {
            userId: task.assigneeId,
            title: "New Comment 💬",
            message: `${authorName || "Someone"} commented on "${task.title}": "${commentPreview.substring(0, 50)}..."`,
            type: "COMMENT_ADDED",
            link: `/tasks?taskId=${taskId}`,
          },
        });
      }

      // Notify creator if different from assignee and author
      if (task.creatorId && task.creatorId !== authorId && task.creatorId !== task.assigneeId) {
        await prisma.notification.create({
          data: {
            userId: task.creatorId,
            title: "New Comment 💬",
            message: `${authorName || "Someone"} commented on your task "${task.title}"`,
            type: "COMMENT_ADDED",
            link: `/tasks?taskId=${taskId}`,
          },
        });
      }
    });

    return { success: true, taskId };
  }
);

export const inngestFunctions = [
  checkDeadlinesCron,
  onTaskAssigned,
  onTaskStatusChanged,
  onCommentCreated,
];
