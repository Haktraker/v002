interface SessionActivity {
  lastActive: number
  expiresAt: number
}

const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes
const ACTIVITY_CHECK_INTERVAL = 60 * 1000 // 1 minute

export const SessionManager = {
  // Initialize session monitoring
  init(onSessionExpired: () => void): () => void {
    // Set initial activity
    this.updateActivity()

    // Set up interval to check for inactivity
    const intervalId = setInterval(() => {
      if (this.isSessionExpired()) {
        onSessionExpired()
      }
    }, ACTIVITY_CHECK_INTERVAL)

    // Set up activity listeners
    const activityEvents = ["mousedown", "keydown", "touchstart", "scroll"]
    const activityHandler = () => this.updateActivity()

    activityEvents.forEach((event) => {
      window.addEventListener(event, activityHandler)
    })

    // Return cleanup function
    return () => {
      clearInterval(intervalId)
      activityEvents.forEach((event) => {
        window.removeEventListener(event, activityHandler)
      })
    }
  },

  // Update last activity time
  updateActivity(): void {
    const now = Date.now()
    const sessionActivity: SessionActivity = {
      lastActive: now,
      expiresAt: now + SESSION_TIMEOUT,
    }

    localStorage.setItem("session_activity", JSON.stringify(sessionActivity))
  },

  // Check if session is expired
  isSessionExpired(): boolean {
    const activityData = localStorage.getItem("session_activity")

    if (!activityData) {
      return true
    }

    try {
      const activity: SessionActivity = JSON.parse(activityData)
      return Date.now() > activity.expiresAt
    } catch (error) {
      return true
    }
  },

  // Clear session activity data
  clearActivity(): void {
    localStorage.removeItem("session_activity")
  },
}

