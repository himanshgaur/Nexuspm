import { PrismaClient } from "@prisma/client";
import { initialSeedData } from "./seedData.js";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed to Neon PostgreSQL...");

  // Seed Users
  for (const u of initialSeedData.users) {
    await prisma.user.upsert({
      where: { clerkId: u.clerkId },
      update: { name: u.name, avatar: u.avatar },
      create: {
        id: u.id,
        clerkId: u.clerkId,
        email: u.email,
        name: u.name,
        avatar: u.avatar,
      },
    });
  }

  // Seed Organizations
  for (const org of initialSeedData.organizations) {
    await prisma.organization.upsert({
      where: { slug: org.slug },
      update: { name: org.name, description: org.description },
      create: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        description: org.description,
        ownerId: org.ownerId,
      },
    });
  }

  // Seed Members
  for (const m of initialSeedData.organizationMembers) {
    const existing = await prisma.organizationMember.findFirst({
      where: { organizationId: m.organizationId, userId: m.userId },
    });
    if (!existing) {
      await prisma.organizationMember.create({
        data: {
          id: m.id,
          organizationId: m.organizationId,
          userId: m.userId,
          role: m.role,
        },
      });
    }
  }

  // Seed Projects
  for (const p of initialSeedData.projects) {
    const existing = await prisma.project.findUnique({ where: { id: p.id } });
    if (!existing) {
      await prisma.project.create({
        data: {
          id: p.id,
          organizationId: p.organizationId,
          name: p.name,
          description: p.description,
          status: p.status,
          priority: p.priority,
          startDate: new Date(p.startDate),
          dueDate: new Date(p.dueDate),
          progress: p.progress,
        },
      });
    }
  }

  // Seed Tasks
  for (const t of initialSeedData.tasks) {
    const existing = await prisma.task.findUnique({ where: { id: t.id } });
    if (!existing) {
      await prisma.task.create({
        data: {
          id: t.id,
          organizationId: t.organizationId,
          projectId: t.projectId,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          dueDate: new Date(t.dueDate),
          position: t.position,
          assigneeId: t.assigneeId,
          creatorId: t.creatorId,
        },
      });
    }
  }

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
