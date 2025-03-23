// Generate a CSRF token
export const generateCsrfToken = (): string => {
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

  // Store the token in sessionStorage
  if (typeof window !== "undefined") {
    sessionStorage.setItem("csrf_token", token)
  }

  return token
}

// Validate a CSRF token
export const validateCsrfToken = (token: string): boolean => {
  if (typeof window === "undefined") return false

  const storedToken = sessionStorage.getItem("csrf_token")

  if (!storedToken || storedToken !== token) {
    return false
  }

  return true
}

// Add CSRF token to request headers
export const addCsrfHeader = (headers: Record<string, string> = {}): Record<string, string> => {
  if (typeof window === "undefined") return headers

  let token = sessionStorage.getItem("csrf_token")

  if (!token) {
    token = generateCsrfToken()
  }

  return {
    ...headers,
    "X-CSRF-Token": token,
  }
}

