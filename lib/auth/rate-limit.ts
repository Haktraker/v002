interface RateLimitData {
  attempts: number
  firstAttempt: number
  blockedUntil: number | null
}

const MAX_ATTEMPTS = 5
const BLOCK_DURATION = 15 * 60 * 1000 // 15 minutes
const WINDOW_DURATION = 5 * 60 * 1000 // 5 minutes

export const RateLimitService = {
  checkRateLimit(identifier: string): { allowed: boolean; waitTime: number | null } {
    try {
      const now = Date.now()
      const storedData = localStorage.getItem(`rate_limit_${identifier}`)

      if (!storedData) {
        // First attempt
        this.recordAttempt(identifier)
        return { allowed: true, waitTime: null }
      }

      const data: RateLimitData = JSON.parse(storedData)

      // Check if currently blocked
      if (data.blockedUntil && data.blockedUntil > now) {
        const waitTime = Math.ceil((data.blockedUntil - now) / 1000)
        return { allowed: false, waitTime }
      }

      // Check if we need to reset the window
      if (now - data.firstAttempt > WINDOW_DURATION) {
        this.recordAttempt(identifier)
        return { allowed: true, waitTime: null }
      }

      // Check if max attempts reached
      if (data.attempts >= MAX_ATTEMPTS) {
        // Block the user
        const blockedUntil = now + BLOCK_DURATION
        localStorage.setItem(
          `rate_limit_${identifier}`,
          JSON.stringify({
            ...data,
            blockedUntil,
          }),
        )

        const waitTime = Math.ceil(BLOCK_DURATION / 1000)
        return { allowed: false, waitTime }
      }

      // Increment attempts
      this.recordAttempt(identifier, data)
      return { allowed: true, waitTime: null }
    } catch (error) {
      console.error("Rate limit check error:", error)
      return { allowed: true, waitTime: null } // Fail open in case of error
    }
  },

  recordAttempt(identifier: string, existingData?: RateLimitData): void {
    const now = Date.now()

    if (existingData) {
      localStorage.setItem(
        `rate_limit_${identifier}`,
        JSON.stringify({
          attempts: existingData.attempts + 1,
          firstAttempt: existingData.firstAttempt,
          blockedUntil: existingData.blockedUntil,
        }),
      )
    } else {
      localStorage.setItem(
        `rate_limit_${identifier}`,
        JSON.stringify({
          attempts: 1,
          firstAttempt: now,
          blockedUntil: null,
        }),
      )
    }
  },

  resetAttempts(identifier: string): void {
    localStorage.removeItem(`rate_limit_${identifier}`)
  },
}

