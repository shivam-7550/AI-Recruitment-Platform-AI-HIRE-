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

        return next.token;
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

  const token = currentSession?.token;

  const headers = new Headers(options.headers || {});

  // -------------------------------------------------------
  // Content-Type
  // -------------------------------------------------------

  /*
   * IMPORTANT:
   *
   * For FormData requests, DO NOT set Content-Type manually.
   * Browser will automatically generate:
   *
   * multipart/form-data; boundary=...
   *
   * This is required for resume/file uploads.
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
  // Request
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
  } else {
    body = await response.text();
  }

  // =======================================================
  // ERROR
  // =======================================================

  if (!response.ok) {
    const message =
      body?.message ||
      body?.title ||
      (typeof body === "string" && body) ||
      "Something went wrong.";

    throw new Error(message);
  }

  return body;
}

// =========================================================
// JOB API
// =========================================================

export const jobsApi = {
  all: () => api("/Job"),

  byId: (id) => api(`/Job/${id}`),

  create: (data) =>
    api("/Job", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    api(`/Job/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  remove: (id) =>
    api(`/Job/${id}`, {
      method: "DELETE",
    }),
};

// =========================================================
// CANDIDATE API
// =========================================================

export const candidateApi = {
  // -------------------------------------------------------
  // PROFILE
  // -------------------------------------------------------

  profile: () => api("/UserProfile"),

  updateProfile: (data) =>
    api("/UserProfile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  uploadPhoto: (file) => {
    const form = new FormData();

    form.append("photo", file);

    return api("/UserProfile/photo", {
      method: "POST",
      body: form,
    });
  },

  // -------------------------------------------------------
  // RESUME
  // -------------------------------------------------------

  resume: () => api("/Resume"),

  uploadResume: (file) => {
    if (!file) {
      throw new Error("Please select a resume file.");
    }

    // =====================================================
    // ALLOWED RESUME FORMATS
    // =====================================================

    const allowedExtensions = [".pdf", ".doc", ".docx", ".word"];

    const fileName = String(file.name || "");

    const extension = "." + fileName.split(".").pop().toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      throw new Error("Only PDF, DOC, DOCX and WORD files are allowed.");
    }

    // =====================================================
    // MAX FILE SIZE = 5 MB
    // =====================================================

    const maxFileSize = 5 * 1024 * 1024;

    if (file.size > maxFileSize) {
      throw new Error("Maximum resume size is 5 MB.");
    }

    // =====================================================
    // FORM DATA
    // =====================================================

    const form = new FormData();

    /*
     * IMPORTANT:
     *
     * Backend DTO:
     *
     * public IFormFile Resume { get; set; }
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

  // -------------------------------------------------------
  // APPLICATIONS
  // -------------------------------------------------------

  applications: () => api("/Application/my-applications"),

  // -------------------------------------------------------
  // APPLY
  // -------------------------------------------------------

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

        experience: Number(applicationData.experience),
      }),
    }),
};

// =========================================================
// COMPANY API
// =========================================================

export const companyApi = {
  // -------------------------------------------------------
  // COMPANY PROFILE
  // -------------------------------------------------------

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

  // -------------------------------------------------------
  // APPLICATIONS FOR ONE JOB
  // -------------------------------------------------------

  applicants: (jobId) => api(`/Application/job/${jobId}`),

  // -------------------------------------------------------
  // ALL APPLICATIONS FOR COMPANY JOBS
  // -------------------------------------------------------

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
    // Remove duplicates
    // -----------------------------------------------------

    const uniqueApplications = Array.from(
      new Map(
        applications
          .filter((application) => application?.id)
          .map((application) => [
            String(application.id).toLowerCase(),

            application,
          ]),
      ).values(),
    );

    return uniqueApplications;
  },

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
};

// =========================================================
// APPLICATION API
// =========================================================

export const applicationApi = {
  // Candidate
  myApplications: () => api("/Application/my-applications"),

  // Company - one job
  byJob: (jobId) => api(`/Application/job/${jobId}`),

  // Company - direct endpoint
  company: () => api("/Application/company"),

  // By ID
  byId: (applicationId) => api(`/Application/${applicationId}`),

  // Status
  updateStatus: (applicationId, status) =>
    api(`/Application/${applicationId}/status`, {
      method: "PUT",
      body: JSON.stringify({
        status,
      }),
    }),

  // Resume
  downloadResume: (applicationId) =>
    api(`/Application/${applicationId}/resume`),

  // AI
  analyzeCandidateWithAI: (applicationId) =>
    api(`/Application/${applicationId}/ai-analysis`, {
      method: "POST",
    }),
};

// =========================================================
// INTERVIEW API
// =========================================================

export const interviewApi = {
  byId: (id) => api(`/Interview/${id}`),

  company: () => api("/Interview/company"),

  candidate: () => api("/Interview/user"),

  create: (data) =>
    api("/Interview", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    api(`/Interview/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  updateStatus: (id, status) =>
    api(`/Interview/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({
        status,
      }),
    }),

  remove: (id) =>
    api(`/Interview/${id}`, {
      method: "DELETE",
    }),
};

// =========================================================
// ADMIN API
// =========================================================

export const adminApi = {
  companies: () => api("/Company"),

  jobs: () => api("/Job"),

  users: () => api("/dashboards/admin/users"),

  approveCompany: (id) =>
    api(`/Company/${id}/approve`, {
      method: "PUT",
    }),

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
  mine: () => api("/Notification"),

  read: (id) =>
    api(`/Notification/${id}/read`, {
      method: "PUT",
    }),

  markAllRead: () =>
    api("/Notification/read-all", {
      method: "PUT",
    }),

  clearAll: () =>
    api("/Notification/clear-all", {
      method: "PUT",
    }),
};

// =========================================================
// SAVED JOB API
// =========================================================

export const savedJobsApi = {
  mine: () => api("/SavedJob"),

  save: (jobId) =>
    api(`/SavedJob/${jobId}`, {
      method: "POST",
    }),

  remove: (jobId) =>
    api(`/SavedJob/${jobId}`, {
      method: "DELETE",
    }),
};
