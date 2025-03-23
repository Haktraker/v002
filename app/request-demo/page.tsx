"use client"

import type React from "react"

import { useState } from "react"
import { Shield, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export default function RequestDemoPage() {
  const [formState, setFormState] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    jobTitle: "",
    companySize: "",
    message: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsSubmitting(false)
    setIsSubmitted(true)
    toast.success("Demo request submitted successfully!")
  }

  const features = [
    "AI-powered threat detection",
    "Dark web monitoring",
    "Attack surface management",
    "Brand protection",
    "Credential leak detection",
    "Real-time alerts",
    "Comprehensive reporting",
  ]

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-cyber-darker">
        <div className="cyber-grid absolute inset-0 opacity-20"></div>

        <div className="max-w-md w-full space-y-8 bg-cyber-dark p-8 rounded-lg z-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-cyber-primary/20">
              <CheckCircle className="h-10 w-10 text-cyber-primary" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold cyber-gradient">Thank You!</h2>
            <p className="mt-2 text-sm text-gray-400">
              Your demo request has been submitted successfully. Our team will contact you shortly to schedule your
              personalized demo.
            </p>
          </div>
          <div className="mt-6">
            <Button
              className="w-full bg-cyber-primary text-cyber-dark hover:bg-cyber-primary/90"
              onClick={() => (window.location.href = "/")}
            >
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-cyber-darker">
      <div className="cyber-grid absolute inset-0 opacity-20"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8 z-10">
        <div className="flex justify-center">
          <Shield className="h-12 w-12 text-cyber-primary" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold cyber-gradient">Request a Demo</h2>
        <p className="mt-2 text-center text-sm text-gray-400">Experience the power of AI-driven cyber intelligence</p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-5xl z-10">
        <div className="bg-cyber-dark py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={formState.firstName}
                      onChange={handleChange}
                      className="bg-cyber-gray/30 border-cyber-gray mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={formState.lastName}
                      onChange={handleChange}
                      className="bg-cyber-gray/30 border-cyber-gray mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formState.email}
                    onChange={handleChange}
                    className="bg-cyber-gray/30 border-cyber-gray mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    name="company"
                    type="text"
                    required
                    value={formState.company}
                    onChange={handleChange}
                    className="bg-cyber-gray/30 border-cyber-gray mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    name="jobTitle"
                    type="text"
                    required
                    value={formState.jobTitle}
                    onChange={handleChange}
                    className="bg-cyber-gray/30 border-cyber-gray mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="companySize">Company Size</Label>
                  <Select
                    value={formState.companySize}
                    onValueChange={(value) => handleSelectChange("companySize", value)}
                  >
                    <SelectTrigger className="bg-cyber-gray/30 border-cyber-gray mt-1">
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent className="bg-cyber-dark border-cyber-gray">
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="201-500">201-500 employees</SelectItem>
                      <SelectItem value="501+">501+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="message">Message (Optional)</Label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formState.message}
                    onChange={handleChange}
                    className="bg-cyber-gray/30 border-cyber-gray mt-1"
                    placeholder="Tell us about your security needs"
                  />
                </div>

                <div>
                  <Button
                    type="submit"
                    className="w-full bg-cyber-primary text-cyber-dark hover:bg-cyber-primary/90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Request Demo"}
                  </Button>
                </div>
              </form>
            </div>

            <div className="bg-cyber-gray/10 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-4 cyber-gradient">Why Choose Haktrak Networks?</h3>
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-cyber-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 p-4 bg-cyber-primary/10 rounded-lg">
                <h4 className="font-bold text-cyber-primary mb-2">What to expect from your demo</h4>
                <p className="text-sm text-gray-300">
                  Our security experts will provide a personalized walkthrough of our platform, tailored to your
                  organization's specific needs and challenges. You'll see firsthand how our AI-powered solutions can
                  protect your digital assets.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

