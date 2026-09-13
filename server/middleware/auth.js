import prisma from "../prisma.js";
import { createClerkClient, verifyToken } from "@clerk/backend";
import dotenv from "dotenv";

dotenv.config();

const clerkSecretKey = process.env.CLERK_SECRET_KEY;
const isClerkConfigured = clerkSecretKey && !clerkSecretKey.includes("sample");

const clerkClient = isClerkConfigured
  ? createClerkClient({ secretKey: clerkSecretKey })
  : null;

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 1. If Clerk is configured
    if (isClerkConfigured && authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = await verifyToken(token, { secretKey: clerkSecretKey });
        const clerkUserId = decoded.sub;

        // Find or create local user
        let user = await prisma.user.findUnique({
          where: { clerkId: clerkUserId },
        });

        if (!user) {
          const clerkUser = await clerkClient.users.getUser(clerkUserId);
          const rawEmail =
            clerkUser.emailAddresses?.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
            clerkUser.emailAddresses?.[0]?.emailAddress ||
            `${clerkUserId}@clerk.user`;
          const email = rawEmail.toLowerCase().trim();
          const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || clerkUser.username || "User";
          const avatar = clerkUser.imageUrl;

          // Check if an invited user already exists with this email (case-insensitive)
          user = await prisma.user.findFirst({
            where: {
              email: {
                equals: email,
                mode: "insensitive",
              },
            },
          });

          if (user) {
            // Link existing invited user to their real Clerk account
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                clerkId: clerkUserId,
                name: name || user.name,
                avatar: avatar || user.avatar,
              },
            });
            console.log(`🔗 [Auth] Linked invited member ${email} to Clerk account (${clerkUserId})`);
          } else {
            // Brand new user without prior invitation
            user = await prisma.user.create({
              data: {
                clerkId: clerkUserId,
                email,
                name,
                avatar,
              },
            });

            // Automatically create initial workspace for brand new user
            const orgName = `${name}'s Workspace`;
            const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;
            const org = await prisma.organization.create({
              data: {
                name: orgName,
                slug,
                description: `Primary workspace for ${name}`,
                ownerId: user.id,
              },
            });

            await prisma.organizationMember.create({
              data: {
                organizationId: org.id,
                userId: user.id,
                role: "OWNER",
              },
            });
          }
        }

        req.user = user;
        return next();
      } catch (tokenErr) {
        console.error("Clerk token verification error:", tokenErr.message);
        return res.status(401).json({ error: "Invalid Clerk authentication session: " + tokenErr.message });
      }
    }

    // 2. If Clerk is not yet configured, allow local dev fallback
    if (!isClerkConfigured) {
      let devUser = await prisma.user.findFirst();
      if (!devUser) {
        devUser = await prisma.user.create({
          data: {
            clerkId: "local_dev_user",
            email: "dev@workspace.local",
            name: "Workspace Admin",
          },
        });
      }
      req.user = devUser;
      return next();
    }

    return res.status(401).json({ error: "Authentication required. Please log in via Clerk." });
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ error: "Unauthorized access: " + error.message });
  }
};
