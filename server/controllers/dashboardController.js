import prisma from "../prisma.js";

export const getDashboardStats = async (req, res) => {
  try {
    const { organizationId } = req;
    const now = new Date();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const in7Days = new Date(now.getTime() + 7 * 86400000);

    // Fetch projects
    const projects = await prisma.project.findMany({
      where: { organizationId },
      include: {
        tasks: {
          include: { assignee: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Fetch tasks
    const tasks = await prisma.task.findMany({
      where: { organizationId },
      include: {
        assignee: true,
        project: true,
      },
      orderBy: { dueDate: "asc" },
    });

    // Fetch members
    const members = await prisma.organizationMember.findMany({
      where: { organizationId },
      include: { user: true },
    });

    // Fetch recent activities
    const activities = await prisma.activityLog.findMany({
      where: { organizationId },
      include: {
        user: true,
        project: true,
        task: true,
      },
      take: 10,
    });

    // Compute Metrics
    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status === "ACTIVE" || p.status === "PLANNING").length;
    const completedProjects = projects.filter((p) => p.status === "COMPLETED").length;

    const totalTasks = tasks.length;
    const pendingTasks = tasks.filter((t) => t.status === "TODO").length;
    const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS").length;
    const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;

    // Overdue tasks: dueDate < now and status != COMPLETED
    const overdueTasks = tasks.filter((t) => {
      if (!t.dueDate || t.status === "COMPLETED") return false;
      return new Date(t.dueDate) < now;
    });

    // Tasks due today: dueDate >= now and dueDate <= endOfToday and status != COMPLETED
    const dueTodayTasks = tasks.filter((t) => {
      if (!t.dueDate || t.status === "COMPLETED") return false;
      const d = new Date(t.dueDate);
      return d >= now && d <= endOfToday;
    });

    // Upcoming deadlines: due within 7 days and status != COMPLETED
    const upcomingDeadlines = tasks
      .filter((t) => {
        if (!t.dueDate || t.status === "COMPLETED") return false;
        const d = new Date(t.dueDate);
        return d > endOfToday && d <= in7Days;
      })
      .slice(0, 5);

    // Recent projects summary (first 4)
    const recentProjects = projects.slice(0, 4).map((p) => {
      const pTasks = p.tasks || [];
      const pCompleted = pTasks.filter((t) => t.status === "COMPLETED").length;
      const progress = pTasks.length > 0 ? Math.round((pCompleted / pTasks.length) * 100) : p.progress || 0;
      return {
        ...p,
        progress,
        totalTasks: pTasks.length,
        completedTasks: pCompleted,
      };
    });

    // Recent tasks summary (first 6)
    const recentTasks = tasks.slice(0, 6);

    res.json({
      metrics: {
        totalProjects,
        activeProjects,
        completedProjects,
        totalTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        overdueTasksCount: overdueTasks.length,
        totalMembers: members.length,
      },
      deadlines: {
        overdue: overdueTasks,
        dueToday: dueTodayTasks,
        upcoming: upcomingDeadlines,
      },
      recentProjects,
      recentTasks,
      activities,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
