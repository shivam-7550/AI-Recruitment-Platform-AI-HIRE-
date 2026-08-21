const BASE_URL = "/api/Auth";

// ==========================================
// Helper: Parse API Response
// ==========================================

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await response.json();
  }

  const text = await response.text();

  return text ? { message: text } : {};
}

// ==========================================
// Register
// ==========================================

export async function registerUser(userData) {
  const response = await fetch(`${BASE_URL}/register`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(userData),
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(data?.message || data?.title || "Registration Failed");
  }

  return data;
}

// ==========================================
// Login
// ==========================================

export async function loginUser(userData) {
  const response = await fetch(`${BASE_URL}/login`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(userData),
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(data?.message || data?.title || "Login Failed");
  }

  // ==========================================
  // Store Authentication Information
  // ==========================================

  if (data?.token) {
    sessionStorage.setItem("accessToken", data.token);
  }

  if (data?.refreshToken) {
    sessionStorage.setItem("refreshToken", data.refreshToken);
  }

  // ==========================================
  // Store User Information
  // ==========================================

  sessionStorage.setItem(
    "user",
    JSON.stringify({
      id: data.userId,
      name: data.name,
      email: data.email,
      role: data.role,
    }),
  );

  return data;
}

// ==========================================
// Refresh Access Token
// ==========================================

export async function refreshAccessToken() {
  const refreshToken = sessionStorage.getItem("refreshToken");

  if (!refreshToken) {
    throw new Error("Refresh token not found.");
  }

  const response = await fetch(`${BASE_URL}/refresh`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      refreshToken,
    }),
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    clearAuthSession();

    throw new Error(data?.message || data?.title || "Refresh token expired.");
  }

  // ==========================================
  // Store Rotated Tokens
  // ==========================================

  if (data?.token) {
    sessionStorage.setItem("accessToken", data.token);
  }

  if (data?.refreshToken) {
    sessionStorage.setItem("refreshToken", data.refreshToken);
  }

  // ==========================================
  // Update User
  // ==========================================

  const existingUser = JSON.parse(sessionStorage.getItem("user") || "null");

  sessionStorage.setItem(
    "user",
    JSON.stringify({
      ...existingUser,

      id: data.userId ?? existingUser?.id,

      name: data.name ?? existingUser?.name,

      email: data.email ?? existingUser?.email,

      role: data.role ?? existingUser?.role,
    }),
  );

  return data;
}

// ==========================================
// Logout
// ==========================================

export async function logoutUser() {
  const refreshToken = sessionStorage.getItem("refreshToken");

  try {
    await fetch(`${BASE_URL}/logout`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        refreshToken,
      }),
    });
  } finally {
    clearAuthSession();
  }
}

// ==========================================
// Clear Authentication Session
// ==========================================

export function clearAuthSession() {
  sessionStorage.removeItem("user");

  sessionStorage.removeItem("accessToken");

  sessionStorage.removeItem("refreshToken");
}
