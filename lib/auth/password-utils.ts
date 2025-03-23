export const validatePassword = (
  password: string,
): {
  isValid: boolean
  strength: "weak" | "medium" | "strong"
  feedback: string[]
} => {
  const feedback: string[] = []

  // Check length
  if (password.length < 8) {
    feedback.push("Password should be at least 8 characters long")
  }

  // Check for uppercase letters
  if (!/[A-Z]/.test(password)) {
    feedback.push("Password should contain at least one uppercase letter")
  }

  // Check for lowercase letters
  if (!/[a-z]/.test(password)) {
    feedback.push("Password should contain at least one lowercase letter")
  }

  // Check for numbers
  if (!/\d/.test(password)) {
    feedback.push("Password should contain at least one number")
  }

  // Check for special characters
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    feedback.push("Password should contain at least one special character")
  }

  // Determine strength
  let strength: "weak" | "medium" | "strong" = "weak"
  if (feedback.length <= 2 && password.length >= 8) {
    strength = "medium"
  }
  if (feedback.length === 0 && password.length >= 12) {
    strength = "strong"
  }

  return {
    isValid: feedback.length === 0,
    strength,
    feedback,
  }
}

// Function to check if email is valid
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

