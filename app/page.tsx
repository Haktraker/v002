"use client"

import {
  Shield,
  Eye,
  Lock,
  Search,
  AlertTriangle,
  Globe,
  Database,
  UserCheck,
  BarChart3,
  Clock,
} from "lucide-react"
import { ThreatMap } from "@/components/features/threat-map"
import { StatCard } from "@/components/features/stat-card"
import { Hero } from "@/components/layout/hero"
import { FeatureSection } from "@/components/features/feature-section"
import { ProcessSection } from "@/components/features/process-section"
import { CtaSection } from "@/components/layout/cta-section"

export default function Home() {
  // Features data
  const features = [
    {
      title: "Dark Web Monitoring",
      description: "Continuous monitoring of dark web forums, marketplaces, and channels to detect leaked credentials and sensitive data",
      icon: <Eye className="h-10 w-10 text-purple" />,
    },
    {
      title: "Threat Intelligence",
      description: "AI-powered analysis of emerging threats with actionable insights to strengthen your security posture",
      icon: <Shield className="h-10 w-10 text-cyber-accent" />,
    },
    {
      title: "Brand Protection",
      description: "Detect and respond to brand impersonation, phishing attempts, and reputation threats",
      icon: <Lock className="h-10 w-10 text-purple-secondary" />,
    },
    {
      title: "Attack Surface Management",
      description: "Discover and secure your external digital footprint to minimize potential attack vectors",
      icon: <Search className="h-10 w-10 text-purple" />,
    },
  ]

  // Process steps data
  const processSteps = [
    {
      title: "Continuous Monitoring",
      description: "Our platform scans the surface, deep, and dark web 24/7 to identify potential threats to your organization",
      icon: <Globe className="h-12 w-12" />,
      number: 1,
    },
    {
      title: "Data Collection",
      description: "We collect and process vast amounts of data from various sources to provide comprehensive coverage",
      icon: <Database className="h-12 w-12" />,
      number: 2,
    },
    {
      title: "AI Analysis",
      description: "Our AI algorithms analyze the collected data to identify patterns, anomalies, and potential threats",
      icon: <BarChart3 className="h-12 w-12" />,
      number: 3,
    },
    {
      title: "Actionable Intelligence",
      description: "We provide actionable insights and recommendations to help you respond to threats effectively",
      icon: <UserCheck className="h-12 w-12" />,
      number: 4,
    },
  ]

  return (
    <div className="relative">
      {/* Hero Section */}
      <Hero
        title="AI-Powered Cyber Intelligence"
        description="Protect your digital assets with actionable intelligence and comprehensive dark web monitoring"
        backgroundComponent={<ThreatMap />}
        buttons={[
          {
            label: "Request Demo",
            href: "/request-demo",
            variant: "default",
          },
          {
            label: "Explore Solutions",
            href: "/solutions",
            variant: "outline",
          },
        ]}
        withGrid={true}
      >
        <StatCard
          title="Threats Detected"
          value="10M+"
          description="Monthly cyber threats identified"
          icon={<AlertTriangle className="h-6 w-6 text-purple-secondary" />}
        />
        <StatCard
          title="Dark Web Coverage"
          value="98%"
          description="Of known dark web sources monitored"
          icon={<Eye className="h-6 w-6 text-purple" />}
        />
        <StatCard
          title="Response Time"
          value="< 15min"
          description="Average threat response time"
          icon={<Clock className="h-6 w-6 text-cyber-accent" />}
        />
      </Hero>

      {/* Features Section */}
      <FeatureSection
        title="Comprehensive Protection"
        description="Our platform provides end-to-end security solutions to protect your organization from evolving cyber threats"
        features={features}
        highlightWord="Protection"
        withCta={true}
        ctaText="View All Solutions"
        ctaHref="/solutions"
      />

      {/* How It Works Section */}
      <ProcessSection
        title="How Haktrak Networks Works"
        description="Our AI-powered platform provides comprehensive protection through a four-step process"
        steps={processSteps}
        highlightWord="Haktrak Networks"
      />

      {/* CTA Section */}
      <CtaSection
        title="Ready to secure your digital assets?"
        description="Get started with Haktrak Networks today and experience the power of AI-driven cyber intelligence"
        primaryButtonText="Request Demo"
        primaryButtonHref="/request-demo"
        secondaryButtonText="Contact Sales"
        secondaryButtonHref="/contact"
      />
    </div>
  )
}

