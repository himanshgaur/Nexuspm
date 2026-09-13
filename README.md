# NexusPM - Modern SaaS Project Management System

NexusPM is an enterprise-grade, modern **Project Management System** built for high-velocity software engineering and product teams. It centralizes project planning, task assignments, automated progress tracking, team role management, discussions, and event-driven background reminders.

---

## 🚀 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Canvas Confetti
- **Backend**: Node.js, Express.js REST API
- **Database**: Neon PostgreSQL via Prisma ORM
- **Authentication**: Clerk (`@clerk/clerk-react`, `@clerk/backend`)
- **Background Jobs & Event Automation**: Inngest (`inngest`, `inngest/express`)
- **Deployment**: Vercel Serverless Architecture (`vercel.json`)

---

## 🌟 Key Features

1. **Authentication (Clerk)**
   - Secure login, sign-up, session handling, and user profile management.
   - Intelligent dev fallback mode for instant local testing across multiple roles.

2. **Organization-Based Data Isolation**
   - True multi-tenant workspace architecture.
   - Switch seamlessly between multiple organizations.
   - All projects, tasks, comments, and members are strictly isolated per organization.

3. **High-Level Executive Dashboard**
   - Real-time KPI cards: Total Projects, Active Tasks, Completed Tasks, Overdue Tasks.
   - Urgent deadlines tracker: Overdue tasks, tasks due today, upcoming deadlines within 7 days.
   - Live project progress tracking bars with task counts.
   - Team audit activity feed.

4. **Project Management**
   - Create, edit, and manage projects with priorities (Low, Medium, High) and timelines.
   - Project detail views featuring both **Interactive Kanban Board** and **Task List Table**.

5. **Task Management & Automated Progress Calculation**
   - Automatic project completion percentage calculation:
     $$\text{Progress} = \left(\frac{\text{Completed Tasks}}{\text{Total Tasks}}\right) \times 100\%$$
   - Updates automatically whenever a task status changes.

6. **Centralized Task Tracking & Multifaceted Filters**
   - Full-text search across titles, descriptions, and project names.
   - Filter by Project, Status (Todo, In Progress, Completed), Priority, and Assignee.
   - Sort by Deadline (earliest first or latest first).
   - Switch between Kanban Board and Table view.

7. **Task Discussions & Collaboration**
   - Dedicated comment thread on every task.
   - Real-time discussion between team members.
   - Confetti celebration when completing tasks!

8. **Team Management & Role-Based Access Control**
   - Roles: `OWNER`, `ADMIN`, `MEMBER`.
   - Workload counters: active tasks assigned to each member.
   - Invite team members via modal.

9. **Inngest Background Jobs & Scheduled Reminders**
   - **Deadline Reminders**: Daily scheduled cron job (`0 9 * * *`) scans tasks due within 24 hours or overdue and dispatches alerts.
   - **Event Automation**: Dispatches notifications when tasks are assigned, statuses change, or comments are posted.
   - Integrated Inngest endpoint ready at `/api/inngest`.

10. **In-App Notifications Center**
    - Notification bell with unread badge counter.
    - Quick actions to mark as read or mark all read.
    - Direct click navigates straight to the task.

---

## 🛠️ Getting Started Locally

### 1. Install Dependencies
```bash
# Install root backend dependencies
npm install

# Install client frontend dependencies
npm run client:install
```

### 2. Generate Prisma Client
```bash
npm run prisma:generate
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

*(Note: The system comes with a built-in mock database and seed data so it can run immediately even before configuring external database credentials!)*

### 4. Start Development Server
```bash
npm run dev
```
- Frontend will open at: **http://localhost:5173**
- Backend API will run at: **http://localhost:5000**
- Inngest background endpoint at: **http://localhost:5000/api/inngest**

---

## ⚡ Connecting Neon PostgreSQL

1. Create a database at [Neon Console](https://console.neon.tech).
2. Copy your connection string and add it to `.env`:
   ```env
   DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```
3. Push schema and seed database:
   ```bash
   npm run prisma:push
   npm run prisma:seed
   ```

---

## 🔐 Connecting Clerk Authentication

1. Create an application at [Clerk Dashboard](https://dashboard.clerk.com).
2. Add your keys to `.env`:
   ```env
   VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
   CLERK_SECRET_KEY="sk_test_..."
   ```

---

## ✉️ Connecting Brevo Transactional Email Service

1. Create a free account or login at [Brevo Dashboard](https://app.brevo.com).
2. Go to **Settings > SMTP & API > API Keys** and generate an API key.
3. Verify your sender email address under **Senders & IP**.
4. Add your Brevo credentials to `.env`:
   ```env
   BREVO_API_KEY="xkeysib-..."
   BREVO_SENDER_EMAIL="your-verified-sender@domain.com"
   APP_URL="https://your-production-app.vercel.app" # or http://localhost:5173 for local dev
   ```

---

## ⏰ Running Inngest Dev Server (Optional)

To test Inngest background jobs and cron triggers visually in local dev:
```bash
npx inngest-cli@latest dev -u http://localhost:5000/api/inngest
```
Visit `http://localhost:8288` to inspect event logs, trigger test events, and view scheduled crons.

---

## 🌐 Deploying to Production (Vercel)

NexusPM is pre-configured with a serverless monorepo deployment architecture in `vercel.json`.

### Step 1: Push Code to GitHub / GitLab / Bitbucket
Ensure all your files are committed and pushed to your remote repository.

### Step 2: Import into Vercel
1. Go to your [Vercel Dashboard](https://vercel.com/new).
2. Select your repository and click **Import**.
3. Framework Preset: **Other** (or Vite).
4. Root Directory: `./` (leave default).

### Step 3: Configure Environment Variables in Vercel
Under the **Environment Variables** section in Vercel, add the following:

| Variable Name | Description | Example / Source |
| :--- | :--- | :--- |
| `DATABASE_URL` | Neon PostgreSQL pooled connection URI | `postgresql://...@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk frontend publishable key | `pk_test_...` (from Clerk Dashboard) |
| `CLERK_SECRET_KEY` | Clerk backend secret key | `sk_test_...` (from Clerk Dashboard) |
| `BREVO_API_KEY` | Brevo transactional email API key | `xkeysib-...` (from Brevo Settings > API Keys) |
| `BREVO_SENDER_EMAIL` | Verified sender email in Brevo | `name@company.com` |
| `APP_URL` | Your live Vercel domain | `https://your-project.vercel.app` |
| `INNGEST_EVENT_KEY` | Inngest event dispatch key (optional) | From Inngest dashboard |
| `INNGEST_SIGNING_KEY` | Inngest webhook signing key (optional) | From Inngest dashboard |

### Step 4: Click Deploy!
Vercel executes:
```bash
npm run vercel-build
```
This compiles the Vite frontend bundle into `client/dist`, generates the Prisma Linux client engine, and mounts the serverless Express API at `/api/index.js` with full SPA route rewrites!
