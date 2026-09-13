import prisma from "../prisma.js";
import { calculateProjectProgress } from "./projectController.js";
import { inngest } from "../inngest/client.js";
import { sendTaskAssignedEmail } from "../services/brevoMailer.js";

export const getTasks = async (req, res) => {
  try {
    const { organizationId } = req;
    const { projectId, status, priority, assigneeId, search, sort = "dueDate", order = "asc" } = req.query;

    const where = { organizationId };

    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;

    let tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: true,
        creator: true,
        project: true,
        comments: {
          include: { user: true },
        },
      },
      orderBy: { [sort]: order },
    });

    // Handle search filter
    if (search && search.trim()) {
      const q = search.toLowerCase();
      tasks = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.project && t.project.name.toLowerCase().includes(q))
      );
    }

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: true,
        creator: true,
        project: true,
        comments: {
          include: { user: true },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createTask = async (req, res) => {
  try {
    const { organizationId } = req;
    const userId = req.user.id;
    const { title, description, projectId, status = "TODO", priority = "MEDIUM", dueDate, assigneeId } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Task title is required" });
    }
    if (!projectId) {
      return res.status(400).json({ error: "Project ID is required" });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        organizationId,
        assigneeId: assigneeId || null,
        creatorId: userId,
      },
      include: {
        assignee: true,
        project: true,
        creator: true,
      },
    });

    // Recalculate project progress
    await calculateProjectProgress(projectId);

    // Trigger Inngest background event and send notification email for assignment
    if (assigneeId && task.assignee?.email) {
      sendTaskAssignedEmail({
        recipientEmail: task.assignee.email,
        recipientName: task.assignee.name,
        taskTitle: task.title,
        taskDescription: task.description,
        projectName: task.project?.name || "Workspace Project",
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : null,
        assignerName: req.user?.name || "Team Member",
        appUrl: `${process.env.APP_URL || "http://localhost:5173"}/tasks`,
      }).catch((err) => console.warn("Task assignment email warning:", err.message));

      await prisma.notification.create({
        data: {
          userId: assigneeId,
          title: "New Task Assigned 📋",
          message: `${req.user?.name || "A team member"} assigned you to "${task.title}".`,
          type: "TASK_ASSIGNED",
        },
      }).catch((err) => console.warn("Notification error:", err.message));

      try {
        await inngest.send({
          name: "task/assigned",
          data: {
            taskId: task.id,
            assigneeId,
            assignerName: req.user?.name,
            taskTitle: task.title,
          },
        });
      } catch (ingErr) {
        console.warn("Inngest send event warning:", ingErr.message);
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        projectId,
        taskId: task.id,
        userId,
        action: "CREATED_TASK",
        details: `created task "${title}"`,
      },
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    const { title, description, status, priority, dueDate, assigneeId, position } = req.body;

    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!existingTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId || null;
    if (position !== undefined) updateData.position = position;

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignee: true,
        creator: true,
        project: true,
        comments: {
          include: { user: true },
        },
      },
    });

    // Recalculate project progress if status changed
    if (status && status !== existingTask.status) {
      await calculateProjectProgress(existingTask.projectId);

      // Trigger Inngest event
      try {
        await inngest.send({
          name: "task/status_changed",
          data: {
            projectId: existingTask.projectId,
            taskId: updatedTask.id,
            newStatus: status,
            updaterName: req.user.name,
            taskTitle: updatedTask.title,
          },
        });
      } catch (ingErr) {
        console.warn("Inngest send event warning:", ingErr.message);
      }

      // Log activity
      await prisma.activityLog.create({
        data: {
          organizationId: existingTask.organizationId,
          projectId: existingTask.projectId,
          taskId: updatedTask.id,
          userId,
          action: "UPDATED_STATUS",
          details: `changed status of "${updatedTask.title}" to ${status}`,
        },
      });
    }

    // Trigger email and in-app notification if assignee changed
    if (assigneeId && assigneeId !== existingTask.assigneeId) {
      if (updatedTask.assignee?.email) {
        sendTaskAssignedEmail({
          recipientEmail: updatedTask.assignee.email,
          recipientName: updatedTask.assignee.name,
          taskTitle: updatedTask.title,
          taskDescription: updatedTask.description,
          projectName: updatedTask.project?.name || "Workspace Project",
          priority: updatedTask.priority,
          status: updatedTask.status,
          dueDate: updatedTask.dueDate ? new Date(updatedTask.dueDate).toLocaleDateString() : null,
          assignerName: req.user?.name || "Team Member",
          appUrl: `${process.env.APP_URL || "http://localhost:5173"}/tasks`,
        }).catch((err) => console.warn("Task assignment email warning:", err.message));

        await prisma.notification.create({
          data: {
            userId: assigneeId,
            title: "Task Assigned to You 📋",
            message: `${req.user?.name || "A team member"} assigned you to "${updatedTask.title}".`,
            type: "TASK_ASSIGNED",
          },
        }).catch((err) => console.warn("Notification error:", err.message));
      }

      try {
        await inngest.send({
          name: "task/assigned",
          data: {
            taskId: updatedTask.id,
            assigneeId,
            assignerName: req.user?.name,
            taskTitle: updatedTask.title,
          },
        });
      } catch (ingErr) {
        console.warn("Inngest send event warning:", ingErr.message);
      }

      await prisma.activityLog.create({
        data: {
          organizationId: existingTask.organizationId,
          projectId: existingTask.projectId,
          taskId: updatedTask.id,
          userId,
          action: "ASSIGNED_TASK",
          details: `assigned "${updatedTask.title}" to a team member`,
        },
      });
    }

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    // Recalculate project progress
    await calculateProjectProgress(task.projectId);

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
