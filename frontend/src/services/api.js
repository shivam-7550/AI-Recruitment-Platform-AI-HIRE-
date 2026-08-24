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

  // ---------------------------------------------------------
  // FormData ke saath Content-Type manually set nahi karna.
  // Browser automatically multipart boundary set karega.
  // ---------------------------------------------------------

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // ---------------------------------------------------------
  // JWT
  // ---------------------------------------------------------

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_ROOT}${path}`, {
    ...options,
    headers,
  });

  // =========================================================
  // ACCESS TOKEN EXPIRED
  // =========================================================

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

  // =========================================================
  // RESPONSE
  // =========================================================

  const contentType = response.headers.get("content-type") || "";

  let body;

  if (contentType.includes("application/json")) {
    body = await response.json();
  } else {
    body = await response.text();
  }

  // =========================================================
  // ERROR
  // =========================================================

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
  // ---------------------------------------------------------
  // Get all jobs
  // GET /api/Job
  // ---------------------------------------------------------

  all: () => api("/Job"),

  // ---------------------------------------------------------
  // Get job by ID
  // GET /api/Job/{id}
  // ---------------------------------------------------------

  byId: (id) => api(`/Job/${id}`),

  // ---------------------------------------------------------
  // Create job
  // POST /api/Job
  // ---------------------------------------------------------

  create: (data) =>
    api("/Job", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // ---------------------------------------------------------
  // Update job
  // PUT /api/Job/{id}
  // ---------------------------------------------------------

  update: (id, data) =>
    api(`/Job/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // ---------------------------------------------------------
  // Delete job
  // DELETE /api/Job/{id}
  // ---------------------------------------------------------

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
    const form = new FormData();

    form.append("Resume", file);

    return api("/Resume/upload", {
      method: "POST",
      body: form,
    });
  },

  analyzeResume: (resumeId) =>
    api(`/Resume/${resumeId}/analysis`),

  removeResume: () =>
    api("/Resume", {
      method: "DELETE",
    }),

  // =======================================================
  // APPLICATIONS
  // =======================================================

  applications: () => api("/Application/my-applications"),

  // =======================================================
  // APPLY FOR JOB
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

        experience: Number(applicationData.experience),
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
  // APPLICATIONS
  // =======================================================

  // -------------------------------------------------------
  // Applications received for a particular job
  // GET /api/Application/job/{jobId}
  // -------------------------------------------------------

  applicants: (jobId) => api(`/Application/job/${jobId}`),

  // -------------------------------------------------------
  // All company applications
  //
  // NOTE:
  // Current ApplicationController does NOT have
  // /api/Application/company endpoint.
  //
  // Keep this only if you create that endpoint later.
  // -------------------------------------------------------

  applications: () => api("/Application/company"),

  // =======================================================
  // CANDIDATE RESUME
  // =======================================================

  // -------------------------------------------------------
  // This endpoint will be added in backend.
  //
  // GET:
  // /api/Application/{applicationId}/resume
  //
  // Company will use this to download candidate resume.
  // -------------------------------------------------------

  downloadResume: (applicationId) =>
    api(`/Application/${applicationId}/resume`),
};

// =========================================================
// ADMIN API
// =========================================================

export const adminApi = {
  // ---------------------------------------------------------
  // Get all companies
  // GET /api/Company
  // ---------------------------------------------------------

  companies: () => api("/Company"),

  // ---------------------------------------------------------
  // Get all jobs
  // GET /api/Job
  // ---------------------------------------------------------

  jobs: () => api("/Job"),

  // ---------------------------------------------------------
  // Approve company
  // PUT /api/Company/{id}/approve
  // ---------------------------------------------------------

  approveCompany: (id) =>
    api(`/Company/${id}/approve`, {
      method: "PUT",
    }),

  // ---------------------------------------------------------
  // Reject company
  // PUT /api/Company/{id}/reject
  // ---------------------------------------------------------

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
  // ---------------------------------------------------------
  // Get my notifications
  // GET /api/Notification
  // ---------------------------------------------------------

  mine: () => api("/Notification"),

  // ---------------------------------------------------------
  // Mark notification as read
  // PUT /api/Notification/{id}/read
  // ---------------------------------------------------------

  read: (id) =>
    api(`/Notification/${id}/read`, {
      method: "PUT",
    }),

  // ---------------------------------------------------------
  // Mark all notifications as read
  // PUT /api/Notification/read-all
  // ---------------------------------------------------------

  markAllRead: () =>
    api("/Notification/read-all", {
      method: "PUT",
    }),

  // ---------------------------------------------------------
  // Clear all notifications
  // PUT /api/Notification/clear-all
  // ---------------------------------------------------------

  clearAll: () =>
    api("/Notification/clear-all", {
      method: "PUT",
    }),
};

// =========================================================
// SAVED JOB API
// =========================================================

export const savedJobsApi = {
  // ---------------------------------------------------------
  // Get saved jobs
  // GET /api/SavedJob
  // ---------------------------------------------------------

  mine: () => api("/SavedJob"),

  // ---------------------------------------------------------
  // Save job
  // POST /api/SavedJob/{jobId}
  // ---------------------------------------------------------

  save: (jobId) =>
    api(`/SavedJob/${jobId}`, {
      method: "POST",
    }),

  // ---------------------------------------------------------
  // Remove saved job
  // DELETE /api/SavedJob/{jobId}
  // ---------------------------------------------------------

  remove: (jobId) =>
    api(`/SavedJob/${jobId}`, {
      method: "DELETE",
    }),
};
