"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Shield, AlertCircle, Eye, EyeOff, Info, CheckCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth/auth-provider"
import { validatePassword, validateEmail } from "@/lib/auth/password-utils"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordStrength, setShowPasswordStrength] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong">("weak")
  const [passwordFeedback, setPasswordFeedback] = useState<string[]>([])
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const { login, isLoading, error, clearError } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (error) {
      setFormError(error.message)
    }
  }, [error])

  const validateForm = (): boolean => {
    let isValid = true

    // Clear previous errors
    setEmailError(null)
    setPasswordError(null)
    setFormError(null)
    clearError()

    // Validate email
    if (!email) {
      setEmailError("Email is required")
      isValid = false
    } else if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address")
      isValid = false
    }

    // Validate password
    if (!password) {
      setPasswordError("Password is required")
      isValid = false
    }

    return isValid
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)

    if (newPassword) {
      const validation = validatePassword(newPassword)
      setPasswordStrength(validation.strength)
      setPasswordFeedback(validation.feedback)
    } else {
      setPasswordStrength("weak")
      setPasswordFeedback([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      await login(email, password)
      // Toast notification is now handled in the AuthProvider
    } catch (err: any) {
      // Error is already handled in the auth provider
      // Toast notification is now handled in the AuthProvider
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8 bg-cyber-darker">
      <div className="cyber-grid absolute inset-0 opacity-20"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center">
          <Shield className="h-12 w-12 text-cyber-primary" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold cyber-gradient">Sign in to your account</h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Or{" "}
          <Link href="/request-demo" className="font-medium text-cyber-primary hover:text-cyber-primary/90">
            request a demo to get started
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-cyber-dark py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {formError && (
            <div className="mb-4 p-3 bg-red-900/30 rounded-md flex items-center text-sm text-red-400">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              {formError}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="email">Email address</Label>
              <div className="mt-1 relative">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`bg-cyber-gray/30 border-cyber-gray ${emailError ? "border-red-500" : ""}`}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? "email-error" : undefined}
                />
                {emailError && (
                  <div id="email-error" className="mt-1 text-sm text-red-500 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {emailError}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <div className="text-sm">
                  <Link
                    href="/auth/forgot-password"
                    className="font-medium text-cyber-primary hover:text-cyber-primary/90"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>
              <div className="mt-1 relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={handlePasswordChange}
                  onFocus={() => setShowPasswordStrength(true)}
                  className={`bg-cyber-gray/30 border-cyber-gray pr-10 ${passwordError ? "border-red-500" : ""}`}
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? "password-error" : undefined}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
                {passwordError && (
                  <div id="password-error" className="mt-1 text-sm text-red-500 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {passwordError}
                  </div>
                )}
              </div>

              {showPasswordStrength && password && (
                <div className="mt-2 p-3 bg-cyber-gray/20 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Password Strength</span>
                    <span
                      className={`text-xs font-medium ${
                        passwordStrength === "weak"
                          ? "text-red-400"
                          : passwordStrength === "medium"
                            ? "text-yellow-400"
                            : "text-green-400"
                      }`}
                    >
                      {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-cyber-gray/30 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        passwordStrength === "weak"
                          ? "bg-red-500 w-1/3"
                          : passwordStrength === "medium"
                            ? "bg-yellow-500 w-2/3"
                            : "bg-green-500 w-full"
                      }`}
                    ></div>
                  </div>

                  <div className="mt-2 space-y-1">
                    {passwordFeedback.map((feedback, index) => (
                      <div key={index} className="flex items-start text-xs">
                        <X className="h-4 w-4 text-red-400 mr-1 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300">{feedback}</span>
                      </div>
                    ))}

                    {passwordFeedback.length === 0 && (
                      <div className="flex items-start text-xs">
                        <CheckCircle className="h-4 w-4 text-green-400 mr-1 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300">Your password meets all requirements</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <Button
                type="submit"
                className="w-full bg-cyber-primary text-cyber-dark hover:bg-cyber-primary/90"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-cyber-gray" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-cyber-dark text-gray-400">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button variant="outline" className="border-cyber-gray hover:bg-cyber-gray/30">
                Google
              </Button>
              <Button variant="outline" className="border-cyber-gray hover:bg-cyber-gray/30">
                Microsoft
              </Button>
            </div>
          </div>

          <div className="mt-6 p-3 bg-cyber-gray/20 rounded">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-cyber-primary mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-400">
                For demo purposes, use any email and password. For MFA testing, use code{" "}
                <span className="font-mono bg-cyber-gray/30 px-1 rounded">123456</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

