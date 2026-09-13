import dotenv from "dotenv";

dotenv.config();

/**
 * Send team member invitation email via Brevo Transactional Email API
 */
export async function sendTeamInviteEmail({
  recipientEmail,
  recipientName,
  orgName,
  inviterName,
  role,
  appUrl = "http://localhost:5173",
}) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || "neowne26@gmail.com";

  if (!apiKey) {
    console.warn("⚠️ [Brevo] BREVO_API_KEY is not configured in .env");
    return { success: false, reason: "Missing API Key" };
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0B0F19; color: #f1f5f9; margin: 0; padding: 40px 20px; }
          .container { max-width: 540px; margin: 0 auto; background-color: #111827; border: 1px solid #1F2937; border-radius: 16px; padding: 32px; }
          .logo { display: inline-block; padding: 8px 16px; border-radius: 8px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; font-weight: bold; font-size: 16px; margin-bottom: 24px; }
          h1 { font-size: 20px; font-weight: 800; color: #ffffff; margin: 0 0 12px 0; }
          p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 20px 0; }
          .role-badge { display: inline-block; background-color: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3); padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 24px; }
          .button { display: inline-block; background-color: #6366f1; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-size: 14px; font-weight: 600; text-align: center; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4); margin: 10px 0 24px 0; }
          .footer { font-size: 11px; color: #64748b; border-top: 1px solid #1F2937; padding-top: 20px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">NexusPM</div>
          <h1>You've been invited to join ${orgName}</h1>
          <p>
            <strong>${inviterName || "A team member"}</strong> has invited you to collaborate on projects and tasks in <strong>${orgName}</strong>.
          </p>
          <div>
            <span class="role-badge">Assigned Role: ${role}</span>
          </div>
          <div>
            <a href="${appUrl}" class="button" target="_blank">Accept Invitation & Join</a>
          </div>
          <p style="font-size: 12px; color: #64748b;">
            If you did not expect this invitation, you can safely ignore this email.
          </p>
          <div class="footer">
            Powered by NexusPM &bull; High-Velocity Team Project Management
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "NexusPM Workspaces",
          email: senderEmail,
        },
        to: [
          {
            email: recipientEmail,
            name: recipientName || recipientEmail.split("@")[0],
          },
        ],
        subject: `Invitation: Join ${orgName} on NexusPM`,
        htmlContent,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("❌ [Brevo API Error]:", err);
      return { success: false, error: err };
    }

    const data = await response.json();
    console.log("✉️ [Brevo] Invitation email sent successfully! MessageId:", data.messageId);
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error("❌ [Brevo Exception]:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send task assignment notification email via Brevo Transactional Email API
 */
export async function sendTaskAssignedEmail({
  recipientEmail,
  recipientName,
  taskTitle,
  taskDescription,
  projectName,
  priority = "MEDIUM",
  dueDate,
  status = "TODO",
  assignerName,
  appUrl = "http://localhost:5173/tasks",
}) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || "neowne26@gmail.com";

  if (!apiKey) {
    console.warn("⚠️ [Brevo] BREVO_API_KEY is not configured in .env");
    return { success: false, reason: "Missing API Key" };
  }

  const priorityColor =
    priority === "URGENT"
      ? "#ef4444"
      : priority === "HIGH"
      ? "#f97316"
      : priority === "MEDIUM"
      ? "#6366f1"
      : "#10b981";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0B0F19; color: #f1f5f9; margin: 0; padding: 40px 20px; }
          .container { max-width: 560px; margin: 0 auto; background-color: #111827; border: 1px solid #1F2937; border-radius: 16px; padding: 32px; }
          .logo { display: inline-block; padding: 8px 16px; border-radius: 8px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; font-weight: bold; font-size: 16px; margin-bottom: 24px; }
          h1 { font-size: 22px; font-weight: 800; color: #ffffff; margin: 0 0 10px 0; line-height: 1.3; }
          p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 20px 0; }
          .task-box { background-color: #0d1322; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; margin: 20px 0; }
          .meta-grid { display: table; width: 100%; margin-top: 14px; }
          .meta-item { display: table-cell; padding-right: 16px; font-size: 12px; color: #94a3b8; }
          .meta-value { font-weight: 700; color: #f8fafc; margin-top: 4px; font-size: 13px; }
          .priority-badge { display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; background-color: rgba(99, 102, 241, 0.15); color: ${priorityColor}; border: 1px solid ${priorityColor}40; }
          .button { display: inline-block; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-size: 14px; font-weight: 600; text-align: center; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4); margin: 10px 0 24px 0; }
          .footer { font-size: 11px; color: #64748b; border-top: 1px solid #1F2937; padding-top: 20px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">NexusPM</div>
          <h1>New Task Assigned to You 📋</h1>
          <p>
            Hello <strong>${recipientName || "Team Member"}</strong>,<br>
            <strong>${assignerName || "A team member"}</strong> has assigned you to a task in <strong>${projectName}</strong>.
          </p>

          <div class="task-box">
            <div style="font-size: 16px; font-weight: 700; color: #ffffff; margin-bottom: 8px;">
              ${taskTitle}
            </div>
            ${
              taskDescription
                ? `<div style="font-size: 13px; color: #94a3b8; line-height: 1.5; margin-bottom: 16px;">${taskDescription}</div>`
                : ""
            }
            <div class="meta-grid">
              <div class="meta-item">
                <div>PROJECT</div>
                <div class="meta-value">${projectName}</div>
              </div>
              <div class="meta-item">
                <div>PRIORITY</div>
                <div class="meta-value">
                  <span class="priority-badge">${priority}</span>
                </div>
              </div>
              <div class="meta-item">
                <div>DUE DATE</div>
                <div class="meta-value">${dueDate || "Not specified"}</div>
              </div>
            </div>
          </div>

          <div>
            <a href="${appUrl}" class="button" target="_blank">Open Task in NexusPM</a>
          </div>

          <p style="font-size: 12px; color: #64748b;">
            Track progress, update status, and post comments directly on the task board.
          </p>

          <div class="footer">
            Powered by NexusPM &bull; High-Velocity Team Project Management
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "NexusPM Tasks",
          email: senderEmail,
        },
        to: [
          {
            email: recipientEmail,
            name: recipientName || recipientEmail.split("@")[0],
          },
        ],
        subject: `New Task Assigned: ${taskTitle} [${projectName}]`,
        htmlContent,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("❌ [Brevo API Error for Task Assignment]:", err);
      return { success: false, error: err };
    }

    const data = await response.json();
    console.log(`✉️ [Brevo] Task assignment email sent to ${recipientEmail}! MessageId:`, data.messageId);
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error("❌ [Brevo Exception for Task Assignment]:", error.message);
    return { success: false, error: error.message };
  }
}

