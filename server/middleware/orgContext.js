import prisma from "../prisma.js";

export const requireOrgContext = async (req, res, next) => {
  try {
    const orgIdHeader = req.headers["x-organization-id"] || req.query.orgId || req.body?.organizationId;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "User authentication required" });
    }

    let targetOrgId = orgIdHeader;

    if (!targetOrgId) {
      // Find the first organization the user belongs to
      const membership = await prisma.organizationMember.findFirst({
        where: { userId },
        include: { organization: true },
      });

      if (membership) {
        targetOrgId = membership.organizationId;
        req.orgRole = membership.role;
      } else {
        // Find default ABC Tech organization
        const defaultOrg = await prisma.organization.findFirst();
        if (defaultOrg) {
          targetOrgId = defaultOrg.id;
          req.orgRole = "MEMBER";
        }
      }
    } else {
      // Validate membership in target org
      let membership = await prisma.organizationMember.findFirst({
        where: { organizationId: targetOrgId, userId },
      });

      if (!membership) {
        // If targetOrgId is invalid or stale, fallback to user's real membership
        membership = await prisma.organizationMember.findFirst({
          where: { userId },
        });
        if (membership) {
          targetOrgId = membership.organizationId;
        }
      }
      req.orgRole = membership ? membership.role : "MEMBER";
    }

    if (!targetOrgId) {
      return res.status(400).json({ error: "No organization found. Please create or join an organization first." });
    }

    req.organizationId = targetOrgId;
    next();
  } catch (error) {
    console.error("Org context middleware error:", error);
    res.status(500).json({ error: "Organization context error: " + error.message });
  }
};
