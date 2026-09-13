// Frontend API Service
let currentOrgId = localStorage.getItem("nexus_active_org_id") || "";
let currentUserId = localStorage.getItem("nexus_demo_user_id") || "";
let getClerkTokenFn = null;

export const setApiOrgId = (orgId) => {
  currentOrgId = orgId;
  if (orgId) {
    localStorage.setItem("nexus_active_org_id", orgId);
  }
};

export const setApiUserId = (userId) => {
  currentUserId = userId;
  if (userId) {
    localStorage.setItem("nexus_demo_user_id", userId);
  }
};

export const setClerkTokenProvider = (fn) => {
  getClerkTokenFn = fn;
};

const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

async function request(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(currentOrgId ? { "x-organization-id": currentOrgId } : {}),
    ...(currentUserId ? { "x-user-id": currentUserId } : {}),
    ...options.headers,
  };

  if (getClerkTokenFn) {
    try {
      const token = await getClerkTokenFn();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    } catch (e) {
      // Ignore token retrieval failure in dev
    }
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorData.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Me
  getMe: () => request("/me"),

  // Organizations
  getOrganizations: () => request("/organizations"),
  createOrganization: (data) => request("/organizations", { method: "POST", body: JSON.stringify(data) }),
  getMembers: () => request("/organizations/members"),
  inviteMember: (data) => request("/organizations/invite", { method: "POST", body: JSON.stringify(data) }),
  updateMemberRole: (memberId, role) => request(`/organizations/members/${memberId}`, { method: "PATCH", body: JSON.stringify({ role }) }),
  removeMember: (memberId) => request(`/organizations/members/${memberId}`, { method: "DELETE" }),

  // Dashboard
  getDashboard: () => request("/dashboard"),

  // Projects
  getProjects: () => request("/projects"),
  getProject: (id) => request(`/projects/${id}`),
  createProject: (data) => request("/projects", { method: "POST", body: JSON.stringify(data) }),
  updateProject: (id, data) => request(`/projects/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: "DELETE" }),

  // Tasks
  getTasks: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/tasks${query ? `?${query}` : ""}`);
  },
  getTask: (id) => request(`/tasks/${id}`),
  createTask: (data) => request("/tasks", { method: "POST", body: JSON.stringify(data) }),
  updateTask: (id, data) => request(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: "DELETE" }),

  // Comments
  getComments: (taskId) => request(`/tasks/${taskId}/comments`),
  addComment: (taskId, content) => request(`/tasks/${taskId}/comments`, { method: "POST", body: JSON.stringify({ content }) }),

  // Notifications
  getNotifications: () => request("/notifications"),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllNotificationsRead: () => request("/notifications/read-all", { method: "POST" }),
};
