const API_ROOT = "/api";

// =========================================================
// SESSION
// =========================================================

function session() {
  try {
    return JSON.parse(sessionStorage.getItem("user")) || {};
  } catch {
    return {};
  }
}

// =========================================================
// TOKEN REFRESH
// =========================================================

let refreshPromise = null;

async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = fetch("/api/Auth/refresh", {
      method: "POST",
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Session expired");
        }

        const refreshed = await response.json();

        const current = session();

        const next = {
          ...current,
          ...refreshed,
        };

        sessionStorage.setItem("user", JSON.stringify(next));

        return next.token || next.accessToken || next.jwtToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

// =========================================================
// COMMON API FUNCTION
// =========================================================

export async function api(path, options = {}, allowRefresh = true) {
  const currentSession = session();

  const token =
    currentSession?.token ||
    currentSession?.accessToken ||
    currentSession?.jwtToken;

  const headers = new Headers(options.headers || {});

  // -------------------------------------------------------
  // CONTENT TYPE
  // -------------------------------------------------------

  /*
   * IMPORTANT:
   *
   * For FormData requests, never manually set Content-Type.
   * Browser automatically adds:
   *
   * multipart/form-data; boundary=...
   */

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  } else {
    headers.delete("Content-Type");
  }

  // -------------------------------------------------------
  // JWT
  // -------------------------------------------------------

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // -------------------------------------------------------
  // REQUEST
  // -------------------------------------------------------

  const response = await fetch(`${API_ROOT}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  // =======================================================
  // ACCESS TOKEN EXPIRED
  // =======================================================

  if (response.status === 401 && token && allowRefresh) {
    try {
      await refreshSession();

      return api(path, options, false);
    } catch {
      sessionStorage.removeItem("user");

      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }

      throw new Error("Your session has expired. Please log in again.");
    }
  }

  // =======================================================
  // RESPONSE
  // =======================================================

  const contentType = response.headers.get("content-type") || "";

  let body;

  if (contentType.includes("application/json")) {
    body = await response.json();
  } else if (contentType.includes("text/")) {
    body = await response.text();
  } else {
    body = await response.blob();
  }

  // =======================================================
  // ERROR
  // =======================================================

  if (!response.ok) {
    let message = "Something went wrong.";

    if (body && typeof body === "object") {
      message =
        body?.message || body?.title || body?.error || body?.detail || message;
    } else if (typeof body === "string" && body.trim()) {
      message = body;
    }

    throw new Error(message);
  }

  return body;
}

// =========================================================
// JOB API
// =========================================================

export const jobsApi = {
  // -------------------------------------------------------
  // GET ALL
  // -------------------------------------------------------

  all: () => api("/Job"),

  // -------------------------------------------------------
  // GET BY ID
  // -------------------------------------------------------

  byId: (id) => api(`/Job/${id}`),

  // -------------------------------------------------------
  // CREATE
  // -------------------------------------------------------

  create: (data) =>
    api("/Job", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // -------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------

  update: (id, data) =>
    api(`/Job/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // -------------------------------------------------------
  // DELETE
  // -------------------------------------------------------

  remove: (id) =>
    api(`/Job/${id}`, {
      method: "DELETE",
    }),
};

// =========================================================
// CANDIDATE API
// =========================================================

export const candidateApi = {
  // =======================================================
  // PROFILE
  // =======================================================

  profile: () => api("/UserProfile"),

  updateProfile: (data) =>
    api("/UserProfile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  uploadPhoto: (file) => {
    if (!file) {
      throw new Error("Please select a photo.");
    }

    const form = new FormData();

    form.append("photo", file);

    return api("/UserProfile/photo", {
      method: "POST",
      body: form,
    });
  },

  // =======================================================
  // RESUME
  // =======================================================

  resume: () => api("/Resume"),

  uploadResume: (file) => {
    if (!file) {
      throw new Error("Please select a resume file.");
    }

    // -----------------------------------------------------
    // ALLOWED FORMATS
    // -----------------------------------------------------

    const allowedExtensions = [".pdf", ".doc", ".docx", ".word"];

    const fileName = String(file.name || "");

    const extension = fileName.includes(".")
      ? "." + fileName.split(".").pop().toLowerCase()
      : "";

    if (!allowedExtensions.includes(extension)) {
      throw new Error("Only PDF, DOC, DOCX and WORD files are allowed.");
    }

    // -----------------------------------------------------
    // MAX SIZE = 5 MB
    // -----------------------------------------------------

    const maxFileSize = 5 * 1024 * 1024;

    if (file.size > maxFileSize) {
      throw new Error("Maximum resume size is 5 MB.");
    }

    // -----------------------------------------------------
    // FORM DATA
    // -----------------------------------------------------

    const form = new FormData();

    /*
     * Backend expects:
     *
     * IFormFile Resume
     *
     * Therefore field name must be exactly "Resume".
     */

    form.append("Resume", file, file.name);

    return api("/Resume/upload", {
      method: "POST",
      body: form,
    });
  },

  removeResume: () =>
    api("/Resume", {
      method: "DELETE",
    }),

  // =======================================================
  // APPLICATIONS
  // =======================================================

  applications: () => api("/Application/my-applications"),

  // =======================================================
  // APPLY
  // =======================================================

  apply: (jobId, resumeId, applicationData) =>
    api("/Application/apply", {
      method: "POST",
      body: JSON.stringify({
        jobId,
        resumeId,

        name: applicationData.name,

        email: applicationData.email,

        contact: applicationData.contact,

        qualification: applicationData.qualification,

        course: applicationData.course,

        collegeName: applicationData.collegeName,

        skills: applicationData.skills,

        experience: Number(applicationData.experience || 0),
      }),
    }),
};

// =========================================================
// COMPANY API
// =========================================================

export const companyApi = {
  // =======================================================
  // COMPANY PROFILE
  // =======================================================

  byUser: (userId) => api(`/Company/user/${userId}`),

  create: (data) =>
    api("/Company", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    api(`/Company/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // =======================================================
  // APPLICATIONS FOR ONE JOB
  // =======================================================

  applicants: (jobId) => api(`/Application/job/${jobId}`),

  // =======================================================
  // ALL APPLICATIONS FOR COMPANY JOBS
  // =======================================================

  applications: async (jobIds = []) => {
    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return [];
    }

    const uniqueJobIds = [
      ...new Set(jobIds.filter(Boolean).map((id) => String(id))),
    ];

    const results = await Promise.all(
      uniqueJobIds.map(async (jobId) => {
        try {
          const result = await api(`/Application/job/${jobId}`);

          if (Array.isArray(result)) {
            return result;
          }

          if (Array.isArray(result?.data)) {
            return result.data;
          }

          if (Array.isArray(result?.applications)) {
            return result.applications;
          }

          return [];
        } catch (error) {
          console.error(`Unable to load applications for job ${jobId}:`, error);

          return [];
        }
      }),
    );

    const applications = results.flat();

    // -----------------------------------------------------
    // REMOVE DUPLICATES
    // -----------------------------------------------------

    return Array.from(
      new Map(
        applications
          .filter((application) => application?.id)
          .map((application) => [
            String(application.id).toLowerCase(),
            application,
          ]),
      ).values(),
    );
  },

  // =======================================================
  // RESUME DOWNLOAD
  // =======================================================

  downloadResume: (applicationId) =>
    api(`/Application/${applicationId}/resume`),

  // =======================================================
  // AI CANDIDATE ANALYSIS
  // =======================================================

  /*
   * Backend:
   *
   * POST
   * /api/Application/{applicationId}/ai-analysis
   *
   * No request body is required.
   */

  analyzeCandidateWithAI: (applicationId) =>
    api(`/Application/${applicationId}/ai-analysis`, {
      method: "POST",
    }),

  // =======================================================
  // APPLICATION STATUS
  // =======================================================

  updateStatus: (applicationId, status) =>
    api(`/Application/${applicationId}/status`, {
      method: "PUT",
      body: JSON.stringify({
        status,
      }),
    }),
};

// =========================================================
// APPLICATION API
// =========================================================

export const applicationApi = {
  // -------------------------------------------------------
  // CANDIDATE
  // -------------------------------------------------------

  myApplications: () => api("/Application/my-applications"),

  // -------------------------------------------------------
  // COMPANY - BY JOB
  // -------------------------------------------------------

  byJob: (jobId) => api(`/Application/job/${jobId}`),

  // -------------------------------------------------------
  // COMPANY
  // -------------------------------------------------------

  company: () => api("/Application/company"),

  // -------------------------------------------------------
  // BY ID
  // -------------------------------------------------------

  byId: (applicationId) => api(`/Application/${applicationId}`),

  // -------------------------------------------------------
  // STATUS
  // -------------------------------------------------------

  updateStatus: (applicationId, status) =>
    api(`/Application/${applicationId}/status`, {
      method: "PUT",
      body: JSON.stringify({
        status,
      }),
    }),

  // -------------------------------------------------------
  // RESUME
  // -------------------------------------------------------

  downloadResume: (applicationId) =>
    api(`/Application/${applicationId}/resume`),

  // -------------------------------------------------------
  // AI ANALYSIS
  // -------------------------------------------------------

  analyzeCandidateWithAI: (applicationId) =>
    api(`/Application/${applicationId}/ai-analysis`, {
      method: "POST",
    }),
};

// =========================================================
// INTERVIEW API
// =========================================================

export const interviewApi = {
  // =======================================================
  // GET BY ID
  // =======================================================

  byId: (id) => api(`/Interview/${id}`),

  // =======================================================
  // COMPANY INTERVIEWS
  // =======================================================

  company: () => api("/Interview/company"),

  // =======================================================
  // CANDIDATE INTERVIEWS
  // =======================================================

  candidate: () => api("/Interview/user"),

  // =======================================================
  // CREATE / SCHEDULE
  // =======================================================

  /*
   * Backend expects:
   *
   * {
   *   applicationId,
   *   round,
   *   interviewType,
   *   scheduledAt,
   *   durationMinutes,
   *   meetingLink,
   *   location,
   *   instructions
   * }
   */

  create: (data) =>
    api("/Interview", {
      method: "POST",
      body: JSON.stringify({
        applicationId: data.applicationId,

        round: data.round,

        interviewType: data.interviewType,

        scheduledAt: data.scheduledAt,

        durationMinutes: Number(data.durationMinutes),

        meetingLink: data.meetingLink || null,

        location: data.location || null,

        instructions: data.instructions || null,
      }),
    }),

  // =======================================================
  // UPDATE
  // =======================================================

  update: (id, data) =>
    api(`/Interview/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        applicationId: data.applicationId,

        round: data.round,

        interviewType: data.interviewType,

        scheduledAt: data.scheduledAt,

        durationMinutes: Number(data.durationMinutes),

        meetingLink: data.meetingLink || null,

        location: data.location || null,

        instructions: data.instructions || null,
      }),
    }),

  // =======================================================
  // UPDATE STATUS
  // =======================================================

  updateStatus: (id, status) =>
    api(`/Interview/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({
        status,
      }),
    }),

  // =======================================================
  // DELETE
  // =======================================================

  remove: (id) =>
    api(`/Interview/${id}`, {
      method: "DELETE",
    }),
};

// =========================================================
// ADMIN API
// =========================================================

export const adminApi = {
  // -------------------------------------------------------
  // COMPANIES
  // -------------------------------------------------------

  companies: () => api("/Company"),

  // -------------------------------------------------------
  // JOBS
  // -------------------------------------------------------

  jobs: () => api("/Job"),

  // -------------------------------------------------------
  // USERS
  // -------------------------------------------------------

  users: () => api("/dashboards/admin/users"),

  // -------------------------------------------------------
  // APPROVE COMPANY
  // -------------------------------------------------------

  approveCompany: (id) =>
    api(`/Company/${id}/approve`, {
      method: "PUT",
    }),

  // -------------------------------------------------------
  // REJECT COMPANY
  // -------------------------------------------------------

  rejectCompany: (id, reason) =>
    api(`/Company/${id}/reject`, {
      method: "PUT",
      body: JSON.stringify({
        reason,
      }),
    }),
};

// =========================================================
// NOTIFICATION API
// =========================================================

export const notificationApi = {
  // -------------------------------------------------------
  // MY NOTIFICATIONS
  // -------------------------------------------------------

  mine: () => api("/Notification"),

  // -------------------------------------------------------
  // READ ONE
  // -------------------------------------------------------

  read: (id) =>
    api(`/Notification/${id}/read`, {
      method: "PUT",
    }),

  // -------------------------------------------------------
  // READ ALL
  // -------------------------------------------------------

  markAllRead: () =>
    api("/Notification/read-all", {
      method: "PUT",
    }),

  // -------------------------------------------------------
  // CLEAR ALL
  // -------------------------------------------------------

  clearAll: () =>
    api("/Notification/clear-all", {
      method: "PUT",
    }),
};

// =========================================================
// SAVED JOB API
// =========================================================

export const savedJobsApi = {
  // -------------------------------------------------------
  // MY SAVED JOBS
  // -------------------------------------------------------

  mine: () => api("/SavedJob"),

  // -------------------------------------------------------
  // SAVE
  // -------------------------------------------------------

  save: (jobId) =>
    api(`/SavedJob/${jobId}`, {
      method: "POST",
    }),

  // -------------------------------------------------------
  // REMOVE
  // -------------------------------------------------------

  remove: (jobId) =>
    api(`/SavedJob/${jobId}`, {
      method: "DELETE",
    }),
};
