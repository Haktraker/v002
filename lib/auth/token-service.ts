// Token expiration times
const ACCESS_TOKEN_EXPIRY = 15 * 60 * 1000 // 15 minutes
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000 // 7 days

interface TokenData {
  token: string
  expiresAt: number
}

interface StoredTokens {
  accessToken: TokenData
  refreshToken: TokenData
}

export const TokenService = {
  // Store tokens securely
  storeTokens(accessToken: string, refreshToken: string): void {
    const now = Date.now()

    const tokens: StoredTokens = {
      accessToken: {
        token: accessToken,
        expiresAt: now + ACCESS_TOKEN_EXPIRY,
      },
      refreshToken: {
        token: refreshToken,
        expiresAt: now + REFRESH_TOKEN_EXPIRY,
      },
    }

    localStorage.setItem("auth_tokens", JSON.stringify(tokens))
  },

  // Get the access token
  getAccessToken(): string | null {
    try {
      const tokensStr = localStorage.getItem("auth_tokens")
      if (!tokensStr) return null

      const tokens: StoredTokens = JSON.parse(tokensStr)
      const now = Date.now()

      // Check if token is expired
      if (tokens.accessToken.expiresAt <= now) {
        return null
      }

      return tokens.accessToken.token
    } catch (error) {
      console.error("Error getting access token:", error)
      return null
    }
  },

  // Get the refresh token
  getRefreshToken(): string | null {
    try {
      const tokensStr = localStorage.getItem("auth_tokens")
      if (!tokensStr) return null

      const tokens: StoredTokens = JSON.parse(tokensStr)
      const now = Date.now()

      // Check if token is expired
      if (tokens.refreshToken.expiresAt <= now) {
        this.clearTokens()
        return null
      }

      return tokens.refreshToken.token
    } catch (error) {
      console.error("Error getting refresh token:", error)
      return null
    }
  },

  // Clear all tokens
  clearTokens(): void {
    localStorage.removeItem("auth_tokens")
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.getAccessToken() !== null
  },
}

