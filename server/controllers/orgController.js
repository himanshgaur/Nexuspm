import prisma from "../prisma.js";
import { sendTeamInviteEmail } from "../services/brevoMailer.js";

export const getUserOrganizations = async (req, res) => {
  try {
    const userId = req.user.id;
    const memberships = await prisma.organizationMember.findMany({
      where: { userId },
      include: { organization: true },
    });

    const orgs = memberships.map((m) => ({
      ...m.organization,
      role: m.role,
    }));

    res.json(orgs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createOrganization = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Organization name is required" });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + `-${Date.now().toString(36)}`;

    const organization = await prisma.organization.create({
      data: {
        name,
        slug,
        description,
        ownerId: userId,
      },
    });

    // Create OWNER membership
    await prisma.organizationMember.create({
      data: {
        organizationId: organization.id,
        userId,
        role: "OWNER",
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: organization.id,
        userId,
        action: "CREATED_ORGANIZATION",
        details: `created organization "${name}"`,
      },
    });

    res.status(201).json({ ...organization, role: "OWNER" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getOrganizationMembers = async (req, res) => {
  try {
    const { organizationId } = req;
    const members = await prisma.organizationMember.findMany({
      where: { organizationId },
      include: { user: true },
    });

    // Enhance with tasks and projects counts
    const membersWithMetrics = await Promise.all(
      members.map(async (m) => {
        const assignedTasksCount = await prisma.task.count({
          where: { organizationId, assigneeId: m.userId, status: { in: ["TODO", "IN_PROGRESS"] } },
        });

        return {
          id: m.id,
          userId: m.userId,
          name: m.user?.name || "Team Member",
          email: m.user?.email,
          avatar: m.user?.avatar,
          role: m.role,
          assignedTasksCount,
          joinedAt: m.createdAt,
        };
      })
    );

    res.json(membersWithMetrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const inviteMember = async (req, res) => {
  try {
    const { organizationId } = req;
    const { email, name, role = "MEMBER" } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        email: {
          equals: cleanEmail,
          mode: "insensitive",
        },
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          name: name?.trim() || cleanEmail.split("@")[0],
          clerkId: `invited_${Date.now()}`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || cleanEmail)}`,
        },
      });
    }

    // Check if already in org
    const existing = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id },
    });

    if (existing) {
      return res.status(400).json({ error: "User is already a member of this organization" });
    }

    const membership = await prisma.organizationMember.create({
      data: {
        organizationId,
        userId: user.id,
        role: role.toUpperCase(),
      },
      include: { user: true },
    });

    // Send real invitation email via Brevo
    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    const appUrl = `${process.env.APP_URL || "http://localhost:5173"}/team?orgId=${organizationId}`;

    sendTeamInviteEmail({
      recipientEmail: cleanEmail,
      recipientName: name,
      orgName: org?.name || "Workspace",
      inviterName: req.user?.name || "Team Member",
      role: role.toUpperCase(),
      appUrl,
    }).catch((err) => console.warn("Brevo invite email warning:", err.message));

    // Notify user in-app
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "Organization Invitation 🎉",
        message: `You were added to ${org?.name || "the organization"} as a ${role}.`,
        type: "ORG_INVITE",
      },
    });

    res.status(201).json(membership);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateMemberRole = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { role } = req.body;

    const updated = await prisma.organizationMember.update({
      where: { id: memberId },
      data: { role },
      include: { user: true },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const removeMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    await prisma.organizationMember.delete({
      where: { id: memberId },
    });
    res.json({ message: "Member removed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
