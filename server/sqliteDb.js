import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { initialSeedData } from "./seedData.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "nexus.db");

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Initialize real SQL tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    clerkId TEXT UNIQUE,
    email TEXT UNIQUE,
    name TEXT,
    avatar TEXT,
    role TEXT DEFAULT 'MEMBER',
    createdAt TEXT,
    updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT,
    slug TEXT UNIQUE,
    description TEXT,
    ownerId TEXT,
    createdAt TEXT,
    updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS organization_members (
    id TEXT PRIMARY KEY,
    organizationId TEXT,
    userId TEXT,
    role TEXT DEFAULT 'MEMBER',
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    status TEXT DEFAULT 'ACTIVE',
    priority TEXT DEFAULT 'MEDIUM',
    startDate TEXT,
    dueDate TEXT,
    progress INTEGER DEFAULT 0,
    organizationId TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    status TEXT DEFAULT 'TODO',
    priority TEXT DEFAULT 'MEDIUM',
    dueDate TEXT,
    position INTEGER DEFAULT 0,
    projectId TEXT,
    organizationId TEXT,
    assigneeId TEXT,
    creatorId TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    content TEXT,
    taskId TEXT,
    userId TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    userId TEXT,
    title TEXT,
    message TEXT,
    type TEXT,
    isRead INTEGER DEFAULT 0,
    link TEXT,
    createdAt TEXT,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    organizationId TEXT,
    projectId TEXT,
    taskId TEXT,
    userId TEXT,
    action TEXT,
    details TEXT,
    createdAt TEXT
  );
`);

// Check if database needs initial seeding
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get().count;
if (userCount === 0) {
  console.log("🌱 [SQLite Database] Seeding initial database tables in server/nexus.db...");
  const insertUser = db.prepare("INSERT INTO users (id, clerkId, email, name, avatar, role, createdAt, updatedAt) VALUES (@id, @clerkId, @email, @name, @avatar, @role, @createdAt, @updatedAt)");
  const insertOrg = db.prepare("INSERT INTO organizations (id, name, slug, description, ownerId, createdAt, updatedAt) VALUES (@id, @name, @slug, @description, @ownerId, @createdAt, @updatedAt)");
  const insertMember = db.prepare("INSERT INTO organization_members (id, organizationId, userId, role, createdAt, updatedAt) VALUES (@id, @organizationId, @userId, @role, @createdAt, @updatedAt)");
  const insertProject = db.prepare("INSERT INTO projects (id, organizationId, name, description, status, priority, startDate, dueDate, progress, createdAt, updatedAt) VALUES (@id, @organizationId, @name, @description, @status, @priority, @startDate, @dueDate, @progress, @createdAt, @updatedAt)");
  const insertTask = db.prepare("INSERT INTO tasks (id, organizationId, projectId, title, description, status, priority, dueDate, position, assigneeId, creatorId, createdAt, updatedAt) VALUES (@id, @organizationId, @projectId, @title, @description, @status, @priority, @dueDate, @position, @assigneeId, @creatorId, @createdAt, @updatedAt)");
  const insertComment = db.prepare("INSERT INTO comments (id, taskId, userId, content, createdAt, updatedAt) VALUES (@id, @taskId, @userId, @content, @createdAt, @updatedAt)");
  const insertNotification = db.prepare("INSERT INTO notifications (id, userId, title, message, type, isRead, link, createdAt) VALUES (@id, @userId, @title, @message, @type, @isRead, @link, @createdAt)");
  const insertActivity = db.prepare("INSERT INTO activity_logs (id, organizationId, projectId, taskId, userId, action, details, createdAt) VALUES (@id, @organizationId, @projectId, @taskId, @userId, @action, @details, @createdAt)");

  const seedTx = db.transaction(() => {
    for (const u of initialSeedData.users) insertUser.run(u);
    for (const o of initialSeedData.organizations) insertOrg.run(o);
    for (const m of initialSeedData.organizationMembers) insertMember.run({ ...m, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    for (const p of initialSeedData.projects) insertProject.run(p);
    for (const t of initialSeedData.tasks) insertTask.run(t);
    for (const c of initialSeedData.comments) insertComment.run({ ...c, updatedAt: c.createdAt });
    for (const n of initialSeedData.notifications) insertNotification.run({ ...n, isRead: n.isRead ? 1 : 0 });
    for (const a of initialSeedData.activities) insertActivity.run({ ...a, projectId: a.projectId || null, taskId: a.taskId || null });
  });

  seedTx();
  console.log("✅ [SQLite Database] Initial setup and persistent schema completed!");
}

console.log("📦 [SQLite Database] Persistent database active at:", dbPath);

// Helper to hydrate relations
function hydrateProject(p, include = {}) {
  if (!p) return null;
  const copy = { ...p };
  if (include.tasks) {
    const tasks = db.prepare("SELECT * FROM tasks WHERE projectId = ? ORDER BY position ASC").all(p.id);
    copy.tasks = tasks.map((t) => hydrateTask(t, include.tasks.include));
  }
  return copy;
}

function hydrateTask(t, include = {}) {
  if (!t) return null;
  const copy = { ...t };
  if (include?.assignee && t.assigneeId) {
    copy.assignee = db.prepare("SELECT * FROM users WHERE id = ?").get(t.assigneeId) || null;
  }
  if (include?.creator && t.creatorId) {
    copy.creator = db.prepare("SELECT * FROM users WHERE id = ?").get(t.creatorId) || null;
  }
  if (include?.project && t.projectId) {
    copy.project = db.prepare("SELECT * FROM projects WHERE id = ?").get(t.projectId) || null;
  }
  if (include?.comments) {
    const comments = db.prepare("SELECT * FROM comments WHERE taskId = ? ORDER BY createdAt ASC").all(t.id);
    copy.comments = comments.map((c) => {
      const cCopy = { ...c };
      if (include.comments?.include?.user) {
        cCopy.user = db.prepare("SELECT * FROM users WHERE id = ?").get(c.userId) || null;
      }
      return cCopy;
    });
  }
  return copy;
}

function hydrateComment(c, include = {}) {
  if (!c) return null;
  const copy = { ...c };
  if (include?.user) {
    copy.user = db.prepare("SELECT * FROM users WHERE id = ?").get(c.userId) || null;
  }
  return copy;
}

function hydrateActivity(a, include = {}) {
  if (!a) return null;
  const copy = { ...a };
  if (include?.user) {
    copy.user = db.prepare("SELECT * FROM users WHERE id = ?").get(a.userId) || null;
  }
  return copy;
}

// Export database adapter matching Prisma API
export const sqlitePrismaAdapter = {
  isSqlite: true,
  user: {
    findUnique: async ({ where }) => {
      if (where.id) return db.prepare("SELECT * FROM users WHERE id = ?").get(where.id) || null;
      if (where.clerkId) return db.prepare("SELECT * FROM users WHERE clerkId = ?").get(where.clerkId) || null;
      if (where.email) return db.prepare("SELECT * FROM users WHERE email = ?").get(where.email) || null;
      return null;
    },
    findFirst: async ({ where } = {}) => {
      if (!where) return db.prepare("SELECT * FROM users LIMIT 1").get() || null;
      if (where.id) return db.prepare("SELECT * FROM users WHERE id = ?").get(where.id) || null;
      return db.prepare("SELECT * FROM users LIMIT 1").get() || null;
    },
    findMany: async () => {
      return db.prepare("SELECT * FROM users").all();
    },
    create: async ({ data }) => {
      const id = data.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();
      const user = {
        id,
        clerkId: data.clerkId || id,
        email: data.email,
        name: data.name || "User",
        avatar: data.avatar || null,
        role: data.role || "MEMBER",
        createdAt: now,
        updatedAt: now,
      };
      db.prepare("INSERT INTO users (id, clerkId, email, name, avatar, role, createdAt, updatedAt) VALUES (@id, @clerkId, @email, @name, @avatar, @role, @createdAt, @updatedAt)").run(user);
      return user;
    },
  },

  organization: {
    findUnique: async ({ where }) => {
      if (where.id) return db.prepare("SELECT * FROM organizations WHERE id = ?").get(where.id) || null;
      if (where.slug) return db.prepare("SELECT * FROM organizations WHERE slug = ?").get(where.slug) || null;
      return null;
    },
    findFirst: async () => {
      return db.prepare("SELECT * FROM organizations LIMIT 1").get() || null;
    },
    findMany: async () => {
      return db.prepare("SELECT * FROM organizations ORDER BY createdAt DESC").all();
    },
    create: async ({ data }) => {
      const id = data.id || `org_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();
      const org = {
        id,
        name: data.name,
        slug: data.slug || `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`,
        description: data.description || "",
        ownerId: data.ownerId,
        createdAt: now,
        updatedAt: now,
      };
      db.prepare("INSERT INTO organizations (id, name, slug, description, ownerId, createdAt, updatedAt) VALUES (@id, @name, @slug, @description, @ownerId, @createdAt, @updatedAt)").run(org);
      return org;
    },
  },

  organizationMember: {
    findFirst: async ({ where }) => {
      return db.prepare("SELECT * FROM organization_members WHERE organizationId = ? AND userId = ?").get(where.organizationId, where.userId) || null;
    },
    findMany: async ({ where, include } = {}) => {
      let query = "SELECT * FROM organization_members";
      const params = [];
      if (where?.userId) {
        query += " WHERE userId = ?";
        params.push(where.userId);
      } else if (where?.organizationId) {
        query += " WHERE organizationId = ?";
        params.push(where.organizationId);
      }
      const members = db.prepare(query).all(...params);
      return members.map((m) => {
        const copy = { ...m };
        if (include?.user) {
          copy.user = db.prepare("SELECT * FROM users WHERE id = ?").get(m.userId) || null;
        }
        if (include?.organization) {
          copy.organization = db.prepare("SELECT * FROM organizations WHERE id = ?").get(m.organizationId) || null;
        }
        return copy;
      });
    },
    create: async ({ data, include }) => {
      const id = data.id || `om_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();
      const member = {
        id,
        organizationId: data.organizationId,
        userId: data.userId,
        role: data.role || "MEMBER",
        createdAt: now,
        updatedAt: now,
      };
      db.prepare("INSERT INTO organization_members (id, organizationId, userId, role, createdAt, updatedAt) VALUES (@id, @organizationId, @userId, @role, @createdAt, @updatedAt)").run(member);
      if (include?.user) {
        member.user = db.prepare("SELECT * FROM users WHERE id = ?").get(member.userId) || null;
      }
      return member;
    },
    update: async ({ where, data, include }) => {
      db.prepare("UPDATE organization_members SET role = ?, updatedAt = ? WHERE id = ?").run(data.role, new Date().toISOString(), where.id);
      const updated = db.prepare("SELECT * FROM organization_members WHERE id = ?").get(where.id);
      if (include?.user) {
        updated.user = db.prepare("SELECT * FROM users WHERE id = ?").get(updated.userId) || null;
      }
      return updated;
    },
    delete: async ({ where }) => {
      return db.prepare("DELETE FROM organization_members WHERE id = ?").run(where.id);
    },
  },

  project: {
    findUnique: async ({ where, include }) => {
      const p = db.prepare("SELECT * FROM projects WHERE id = ?").get(where.id);
      return hydrateProject(p, include);
    },
    findMany: async ({ where, include } = {}) => {
      let query = "SELECT * FROM projects";
      const params = [];
      if (where?.organizationId) {
        query += " WHERE organizationId = ?";
        params.push(where.organizationId);
      }
      query += " ORDER BY createdAt DESC";
      const list = db.prepare(query).all(...params);
      return list.map((p) => hydrateProject(p, include));
    },
    create: async ({ data }) => {
      const id = data.id || `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();
      const project = {
        id,
        organizationId: data.organizationId,
        name: data.name,
        description: data.description || "",
        status: data.status || "ACTIVE",
        priority: data.priority || "MEDIUM",
        startDate: data.startDate ? new Date(data.startDate).toISOString() : now,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
        progress: 0,
        createdAt: now,
        updatedAt: now,
      };
      db.prepare("INSERT INTO projects (id, organizationId, name, description, status, priority, startDate, dueDate, progress, createdAt, updatedAt) VALUES (@id, @organizationId, @name, @description, @status, @priority, @startDate, @dueDate, @progress, @createdAt, @updatedAt)").run(project);
      return project;
    },
    update: async ({ where, data }) => {
      const fields = [];
      const params = [];
      for (const [k, v] of Object.entries(data)) {
        fields.push(`${k} = ?`);
        params.push(v instanceof Date ? v.toISOString() : v);
      }
      fields.push("updatedAt = ?");
      params.push(new Date().toISOString());
      params.push(where.id);
      db.prepare(`UPDATE projects SET ${fields.join(", ")} WHERE id = ?`).run(...params);
      return db.prepare("SELECT * FROM projects WHERE id = ?").get(where.id);
    },
    delete: async ({ where }) => {
      db.prepare("DELETE FROM tasks WHERE projectId = ?").run(where.id);
      return db.prepare("DELETE FROM projects WHERE id = ?").run(where.id);
    },
  },

  task: {
    findUnique: async ({ where, include }) => {
      const t = db.prepare("SELECT * FROM tasks WHERE id = ?").get(where.id);
      return hydrateTask(t, include);
    },
    findMany: async ({ where, include, orderBy } = {}) => {
      let query = "SELECT * FROM tasks WHERE 1=1";
      const params = [];
      if (where?.organizationId) {
        query += " AND organizationId = ?";
        params.push(where.organizationId);
      }
      if (where?.projectId) {
        query += " AND projectId = ?";
        params.push(where.projectId);
      }
      if (where?.status) {
        if (typeof where.status === "object" && where.status.in) {
          query += ` AND status IN (${where.status.in.map(() => "?").join(",")})`;
          params.push(...where.status.in);
        } else {
          query += " AND status = ?";
          params.push(where.status);
        }
      }
      if (where?.priority) {
        query += " AND priority = ?";
        params.push(where.priority);
      }
      if (where?.assigneeId) {
        query += " AND assigneeId = ?";
        params.push(where.assigneeId);
      }
      if (orderBy?.dueDate) {
        query += ` ORDER BY dueDate ${orderBy.dueDate === "desc" ? "DESC" : "ASC"}`;
      } else {
        query += " ORDER BY position ASC, createdAt DESC";
      }

      const tasks = db.prepare(query).all(...params);
      return tasks.map((t) => hydrateTask(t, include));
    },
    create: async ({ data, include }) => {
      const id = data.id || `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();
      const task = {
        id,
        organizationId: data.organizationId,
        projectId: data.projectId,
        title: data.title,
        description: data.description || "",
        status: data.status || "TODO",
        priority: data.priority || "MEDIUM",
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
        position: data.position || 0,
        assigneeId: data.assigneeId || null,
        creatorId: data.creatorId,
        createdAt: now,
        updatedAt: now,
      };
      db.prepare("INSERT INTO tasks (id, organizationId, projectId, title, description, status, priority, dueDate, position, assigneeId, creatorId, createdAt, updatedAt) VALUES (@id, @organizationId, @projectId, @title, @description, @status, @priority, @dueDate, @position, @assigneeId, @creatorId, @createdAt, @updatedAt)").run(task);
      return hydrateTask(task, include);
    },
    update: async ({ where, data, include }) => {
      const fields = [];
      const params = [];
      for (const [k, v] of Object.entries(data)) {
        fields.push(`${k} = ?`);
        params.push(v instanceof Date ? v.toISOString() : v);
      }
      fields.push("updatedAt = ?");
      params.push(new Date().toISOString());
      params.push(where.id);
      db.prepare(`UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`).run(...params);
      const updated = db.prepare("SELECT * FROM tasks WHERE id = ?").get(where.id);
      return hydrateTask(updated, include);
    },
    delete: async ({ where }) => {
      db.prepare("DELETE FROM comments WHERE taskId = ?").run(where.id);
      return db.prepare("DELETE FROM tasks WHERE id = ?").run(where.id);
    },
    count: async ({ where } = {}) => {
      let query = "SELECT COUNT(*) as count FROM tasks WHERE 1=1";
      const params = [];
      if (where?.organizationId) {
        query += " AND organizationId = ?";
        params.push(where.organizationId);
      }
      if (where?.assigneeId) {
        query += " AND assigneeId = ?";
        params.push(where.assigneeId);
      }
      if (where?.status?.in) {
        query += ` AND status IN (${where.status.in.map(() => "?").join(",")})`;
        params.push(...where.status.in);
      }
      return db.prepare(query).get(...params).count;
    },
  },

  comment: {
    findMany: async ({ where, include }) => {
      const comments = db.prepare("SELECT * FROM comments WHERE taskId = ? ORDER BY createdAt ASC").all(where.taskId);
      return comments.map((c) => hydrateComment(c, include));
    },
    create: async ({ data, include }) => {
      const id = data.id || `comm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();
      const comment = {
        id,
        taskId: data.taskId,
        userId: data.userId,
        content: data.content,
        createdAt: now,
        updatedAt: now,
      };
      db.prepare("INSERT INTO comments (id, taskId, userId, content, createdAt, updatedAt) VALUES (@id, @taskId, @userId, @content, @createdAt, @updatedAt)").run(comment);
      return hydrateComment(comment, include);
    },
  },

  notification: {
    findMany: async ({ where }) => {
      const rows = db.prepare("SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC").all(where.userId);
      return rows.map((r) => ({ ...r, isRead: !!r.isRead }));
    },
    create: async ({ data }) => {
      const id = data.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();
      const notif = {
        id,
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        isRead: 0,
        link: data.link || null,
        createdAt: now,
      };
      db.prepare("INSERT INTO notifications (id, userId, title, message, type, isRead, link, createdAt) VALUES (@id, @userId, @title, @message, @type, @isRead, @link, @createdAt)").run(notif);
      return { ...notif, isRead: false };
    },
    update: async ({ where, data }) => {
      db.prepare("UPDATE notifications SET isRead = ? WHERE id = ?").run(data.isRead ? 1 : 0, where.id);
      const row = db.prepare("SELECT * FROM notifications WHERE id = ?").get(where.id);
      return row ? { ...row, isRead: !!row.isRead } : null;
    },
    updateMany: async ({ where, data }) => {
      const res = db.prepare("UPDATE notifications SET isRead = ? WHERE userId = ? AND isRead = 0").run(data.isRead ? 1 : 0, where.userId);
      return { count: res.changes };
    },
  },

  activityLog: {
    findMany: async ({ where, include, take } = {}) => {
      let query = "SELECT * FROM activity_logs WHERE organizationId = ? ORDER BY createdAt DESC";
      if (take) query += ` LIMIT ${take}`;
      const logs = db.prepare(query).all(where.organizationId);
      return logs.map((l) => hydrateActivity(l, include));
    },
    create: async ({ data, include }) => {
      const id = data.id || `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();
      const act = {
        id,
        organizationId: data.organizationId,
        projectId: data.projectId || null,
        taskId: data.taskId || null,
        userId: data.userId,
        action: data.action,
        details: data.details || "",
        createdAt: now,
      };
      db.prepare("INSERT INTO activity_logs (id, organizationId, projectId, taskId, userId, action, details, createdAt) VALUES (@id, @organizationId, @projectId, @taskId, @userId, @action, @details, @createdAt)").run(act);
      return hydrateActivity(act, include);
    },
  },
};

export default sqlitePrismaAdapter;
