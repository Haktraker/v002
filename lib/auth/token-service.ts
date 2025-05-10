import { jwtDecode } from 'jwt-decode';

// Token expiration times
const ACCESS_TOKEN_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours for better persistence

interface TokenData {
  token: string
  expiresAt: number
}

interface StoredTokens {
  accessToken: TokenData
}

export const TokenService = {
  // Store token securely
  storeTokens(accessToken: string, refreshToken?: string): void {
    const now = Date.now()

    const tokens: StoredTokens = {
      accessToken: {
        token: accessToken,
        expiresAt: now + ACCESS_TOKEN_EXPIRY,
      }
    }

    // Store in localStorage for persistence across page refreshes
    try {
      localStorage.setItem("auth_tokens", JSON.stringify(tokens))
    } catch (error) {
      console.error("Error storing auth tokens:", error)
    }
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
        this.clearTokens()
        return null
      }

      return tokens.accessToken.token
    } catch (error) {
      console.error("Error getting access token:", error)
      this.clearTokens()
      return null
    }
  },

  // Get User ID from access token
  getUserId(): string | null {
    try {
      const token = this.getAccessToken();
      if (!token) return null;

      // Adjusting the type to expect a nested payload object
      const decodedToken: { payload: { _id: string } } = jwtDecode(token);
      
      // Access _id from the nested payload object
      if (decodedToken && decodedToken.payload && decodedToken.payload._id) {
        return decodedToken.payload._id;
      }
      
      console.error("User ID not found in decoded token payload.");
      return null;
    } catch (error) {
      console.error("Error decoding token or getting user ID:", error);
      return null;
    }
  },

  // Clear all tokens
  clearTokens(): void {
    try {
      // Remove tokens from localStorage
      localStorage.removeItem("auth_tokens");
      
      // Also clear any other auth-related items
      localStorage.removeItem("user_data");
      
      // Clear cookies if any (this is a fallback in case cookies are used)
      document.cookie.split(";").forEach(cookie => {
        const [name] = cookie.trim().split("=");
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      });
      
      // Ensure sessions are cleared in case they're used
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem("auth_tokens");
        sessionStorage.removeItem("user_data");
      }
    } catch (error) {
      console.error("Error clearing tokens:", error);
    }
  },

  // Check if user has a valid token
  isAuthenticated(): boolean {
    return this.getAccessToken() !== null
  },

  // Get token expiration time
  getTokenExpiration(): number | null {
    try {
      const tokensStr = localStorage.getItem("auth_tokens")
      if (!tokensStr) return null

      const tokens: StoredTokens = JSON.parse(tokensStr)
      return tokens.accessToken.expiresAt
    } catch (error) {
      console.error("Error getting token expiration:", error)
      return null
    }
  },

  // Get token remaining time in seconds
  getTokenRemainingTime(): number | null {
    const expiration = this.getTokenExpiration()
    if (!expiration) return null

    const remaining = expiration - Date.now()
    return remaining > 0 ? Math.floor(remaining / 1000) : 0
  }
}

