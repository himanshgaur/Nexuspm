import prisma from "../prisma.js";
import { inngest } from "../inngest/client.js";

export const getComments = async (req, res) => {
  try {
    const { taskId } = req.params;
    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Comment content is required" });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const comment = await prisma.comment.create({
      data: {
        taskId,
        userId,
        content: content.trim(),
      },
      include: {
        user: true,
      },
    });

    // Inngest background event
    try {
      await inngest.send({
        name: "task/comment_created",
        data: {
          taskId,
          authorId: userId,
          authorName: req.user.name,
          commentPreview: content.trim(),
        },
      });
    } catch (ingErr) {
      console.warn("Inngest send event warning:", ingErr.message);
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: task.organizationId,
        projectId: task.projectId,
        taskId,
        userId,
        action: "COMMENTED",
        details: `commented on "${task.title}"`,
      },
    });

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
