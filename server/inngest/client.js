import { Inngest } from "inngest";
import dotenv from "dotenv";

dotenv.config();

// Inngest Client
export const inngest = new Inngest({
  id: "project-management-system",
  name: "Project Management System",
  eventKey: process.env.INNGEST_EVENT_KEY || "dev_event_key",
});
