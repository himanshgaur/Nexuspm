import prisma from "../prisma.js";

// Recalculate and update progress for a project
export const calculateProjectProgress = async (projectId) => {
  const tasks = await prisma.task.findMany({
    where: { projectId },
  });

  if (!tasks || tasks.length === 0) return 0;
  const completed = tasks.filter((t) => t.status === "COMPLETED").length;
  const progress = Math.round((completed / tasks.length) * 100);

  await prisma.project.update({
    where: { id: projectId },
    data: {
      progress,
      status: progress === 100 ? "COMPLETED" : "ACTIVE",
    },
  });

  return progress;
};

export const getProjects = async (req, res) => {
  try {
    const { organizationId } = req;
    const projects = await prisma.project.findMany({
      where: { organizationId },
      include: {
        tasks: {
          include: { assignee: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Format with task counts and unique members
    const formatted = projects.map((p) => {
      const totalTasks = p.tasks ? p.tasks.length : 0;
      const completedTasks = p.tasks ? p.tasks.filter((t) => t.status === "COMPLETED").length : 0;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : p.progress || 0;

      // Extract unique assignees
      const membersMap = new Map();
      if (p.tasks) {
        p.tasks.forEach((t) => {
          if (t.assignee) {
            membersMap.set(t.assignee.id, t.assignee);
          }
        });
      }

      return {
        ...p,
        progress,
        totalTasks,
        completedTasks,
        members: Array.from(membersMap.values()),
      };
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          include: { assignee: true, creator: true },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const totalTasks = project.tasks ? project.tasks.length : 0;
    const completedTasks = project.tasks ? project.tasks.filter((t) => t.status === "COMPLETED").length : 0;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      ...project,
      progress,
      totalTasks,
      completedTasks,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createProject = async (req, res) => {
  try {
    const { organizationId } = req;
    const userId = req.user.id;
    const { name, description, priority = "MEDIUM", status = "ACTIVE", startDate, dueDate } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Project name is required" });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        priority,
        status,
        startDate: startDate ? new Date(startDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        progress: 0,
        organizationId,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        projectId: project.id,
        userId,
        action: "CREATED_PROJECT",
        details: `created project "${name}"`,
      },
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description, priority, status, startDate, dueDate } = req.body;

    const data = {};
    if (name) data.name = name;
    if (description !== undefined) data.description = description;
    if (priority) data.priority = priority;
    if (status) data.status = status;
    if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;

    const updated = await prisma.project.update({
      where: { id: projectId },
      data,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    await prisma.project.delete({
      where: { id: projectId },
    });
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
