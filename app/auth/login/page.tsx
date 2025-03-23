"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Shield, AlertCircle, Eye, EyeOff, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth/auth-provider"
import { validateEmail } from "@/lib/auth/password-utils"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      await login(email, password)
      // Upon successful login, the auth provider will redirect to /dashboard
    } catch (err: any) {
      // Errors are handled in the auth provider and displayed via formError
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0f0f1b]">
      {/* Left side - Login Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center p-8 md:p-16">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-8">
            <Shield className="h-10 w-10 text-purple" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">
            Let's get you back <span className="text-purple">in.</span>
          </h1>
          
          {formError && (
            <div className="mb-4 p-3 bg-red-900/30 rounded-md flex items-center text-sm text-red-400">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-white mb-2 block">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`bg-[#171727]/50 border-0 text-white placeholder-gray-500 h-12 w-full ${
                    emailError ? "ring-1 ring-red-500" : ""
                  }`}
                  placeholder="Enter Your Email"
                />
                {emailError && (
                  <div className="mt-1 text-sm text-red-500 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {emailError}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <Link href="/auth/forgot-password" className="text-sm text-purple hover:text-purple/90">
                  Forget Password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`bg-[#171727]/50 border-0 text-white placeholder-gray-500 h-12 w-full pr-10 ${
                    passwordError ? "ring-1 ring-red-500" : ""
                  }`}
                  placeholder="Enter Your Password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
                {passwordError && (
                  <div className="mt-1 text-sm text-red-500 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {passwordError}
                  </div>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-purple hover:bg-purple/90 text-white flex items-center justify-center gap-2 rounded-md"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Continue"} {!isLoading && <ArrowRight className="h-5 w-5" />}
            </Button>
          </form>

          <div className="mt-6 text-white-45 text-sm">
            Not Subscribed yet? <Link href="/auth/register" className="text-purple hover:text-purple/90">Subscribe</Link>
          </div>
        </div>
      </div>
      
      {/* Right side with background and dashboard */}
      <div className="hidden md:block md:w-1/2 bg-[#0f0f1b] relative overflow-hidden">
        {/* Background lines/effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple/5 to-transparent"></div>
        <div className="absolute inset-0 bg-[url('/placeholder.svg?height=800&width=800')] bg-no-repeat bg-cover opacity-20"></div>
        
        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-center px-16 z-10">
          <h2 className="text-4xl font-bold text-white mb-4">
            We Protect you to the <span className="text-purple">limits</span>!
          </h2>
          <p className="text-white/85 max-w-md">
            Dark Atlas is an AI-powered eXtended Cyber Intelligence (XCI) Platform that protects you against cyber threats with actionable & contextualized intelligence.
          </p>
        </div>
        
        {/* Dashboard Preview */}
        <div className="absolute right-0 bottom-0 w-full h-3/5 flex items-end justify-center">
          <div className="relative w-full max-w-3xl">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1b] to-transparent z-10"></div>
            <Image 
              src="/placeholder.svg"
              alt="Dashboard Preview" 
              width={1000}
              height={600}
              className="object-contain relative z-0"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  )
}

