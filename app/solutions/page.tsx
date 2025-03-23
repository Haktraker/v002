import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Shield, Eye, Search, Lock, ArrowRight, CheckCircle, AlertTriangle, Database, Globe } from "lucide-react"
import { SolutionCard } from "@/components/solutions/solution-card"
import { TestimonialCard } from "@/components/solutions/testimonial-card"
import { PageHeader } from "@/components/ui/page-header"

export default function SolutionsPage() {
  const solutions = [
    {
      icon: <Eye className="h-10 w-10 text-cyber-primary" />,
      title: "Dark Web Monitoring",
      description:
        "Continuous monitoring of dark web forums, marketplaces, and channels to detect leaked credentials and sensitive data.",
      features: [
        "Real-time monitoring of dark web sources",
        "Credential leak detection",
        "Brand mention tracking",
        "Automated alerts for critical findings",
        "Historical data analysis",
      ],
      href: "/solutions/dark-web-monitoring",
    },
    {
      icon: <Shield className="h-10 w-10 text-cyber-primary" />,
      title: "Threat Intelligence",
      description:
        "AI-powered analysis of emerging threats with actionable insights to strengthen your security posture.",
      features: [
        "Proactive threat detection",
        "Contextual intelligence",
        "Threat actor profiling",
        "Industry-specific threat feeds",
        "Integration with security tools",
      ],
      href: "/solutions/threat-intelligence",
    },
    {
      icon: <Lock className="h-10 w-10 text-cyber-primary" />,
      title: "Brand Protection",
      description: "Detect and respond to brand impersonation, phishing attempts, and reputation threats.",
      features: [
        "Domain impersonation detection",
        "Social media monitoring",
        "Phishing campaign identification",
        "Counterfeit product tracking",
        "Automated takedown services",
      ],
      href: "/solutions/brand-protection",
    },
    {
      icon: <Search className="h-10 w-10 text-cyber-primary" />,
      title: "Attack Surface Management",
      description: "Discover and secure your external digital footprint to minimize potential attack vectors.",
      features: [
        "Continuous asset discovery",
        "Vulnerability assessment",
        "Misconfigurations detection",
        "Shadow IT identification",
        "Risk prioritization",
      ],
      href: "/solutions/attack-surface-management",
    },
  ]

  const testimonials = [
    {
      quote:
        "Haktrak Networks has transformed our security operations. Their dark web monitoring capabilities have helped us identify and mitigate potential breaches before they happened.",
      author: "Sarah Johnson",
      title: "CISO, Global Financial Services",
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      quote:
        "The threat intelligence provided by Haktrak Networks is unmatched in terms of accuracy and actionability. It's like having an elite security team working alongside us.",
      author: "Michael Chen",
      title: "VP of Security, Tech Innovators Inc.",
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      quote:
        "We've seen a 70% reduction in successful phishing attempts since implementing Haktrak's brand protection solution. The ROI has been incredible.",
      author: "Jessica Rodriguez",
      title: "Director of IT Security, Retail Giant",
      image: "/placeholder.svg?height=100&width=100",
    },
  ]

  return (
    <div className="pt-16">
      <PageHeader
        title="Our Solutions"
        description="Comprehensive cybersecurity solutions powered by AI and expert intelligence"
      />

      {/* Solutions Overview */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div data-aos="fade-right">
              <h2 className="text-3xl font-bold mb-6">Comprehensive Protection</h2>
              <p className="text-lg text-foreground/80 mb-6">
                Our integrated suite of solutions provides end-to-end protection for your organization's digital assets,
                from proactive threat intelligence to continuous monitoring of the dark web.
              </p>
              <p className="text-lg text-foreground/80 mb-6">
                Powered by advanced AI and machine learning algorithms, our platform analyzes vast amounts of data to
                identify patterns, anomalies, and potential threats before they impact your business.
              </p>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-cyber-primary mr-2 mt-0.5" />
                  <div>
                    <h3 className="font-medium">AI-Powered Analysis</h3>
                    <p className="text-foreground/80">Advanced algorithms that continuously learn and adapt</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-cyber-primary mr-2 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Real-Time Monitoring</h3>
                    <p className="text-foreground/80">24/7 surveillance of threats across the web</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-cyber-primary mr-2 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Actionable Intelligence</h3>
                    <p className="text-foreground/80">Clear, contextual insights that drive effective response</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative" data-aos="fade-left">
              <div className="aspect-video rounded-lg overflow-hidden">
                <Image
                  src="/placeholder.svg?height=720&width=1280"
                  alt="Haktrak Networks Solutions"
                  width={1280}
                  height={720}
                  className="object-cover"
                />
              </div>
              <div
                className="absolute -bottom-6 -left-6 bg-background p-4 rounded-lg shadow-lg"
                data-aos="fade-up"
                data-aos-delay="200"
              >
                <div className="flex items-center">
                  <AlertTriangle className="h-6 w-6 text-cyber-secondary mr-2" />
                  <p className="text-lg font-bold">10M+ threats detected monthly</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Cards */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12" data-aos="fade-up">
            <h2 className="text-3xl font-bold mb-4">Our Solution Suite</h2>
            <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
              Explore our comprehensive range of cybersecurity solutions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {solutions.map((solution, index) => (
              <SolutionCard
                key={index}
                icon={solution.icon}
                title={solution.title}
                description={solution.description}
                features={solution.features}
                href={solution.href}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12" data-aos="fade-up">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
              Our platform provides comprehensive protection through a four-step process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-card p-6 rounded-lg relative" data-aos="fade-up" data-aos-delay="0">
              <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-cyber-primary text-cyber-dark flex items-center justify-center font-bold">
                1
              </div>
              <Globe className="h-12 w-12 mb-4 text-cyber-primary" />
              <h3 className="text-xl font-bold mb-2">Continuous Monitoring</h3>
              <p className="text-foreground/80">
                Our platform scans the surface, deep, and dark web 24/7 to identify potential threats to your
                organization
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg relative" data-aos="fade-up" data-aos-delay="100">
              <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-cyber-primary text-cyber-dark flex items-center justify-center font-bold">
                2
              </div>
              <Database className="h-12 w-12 mb-4 text-cyber-primary" />
              <h3 className="text-xl font-bold mb-2">Data Collection</h3>
              <p className="text-foreground/80">
                We collect and process vast amounts of data from various sources to provide comprehensive coverage
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg relative" data-aos="fade-up" data-aos-delay="200">
              <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-cyber-primary text-cyber-dark flex items-center justify-center font-bold">
                3
              </div>
              <Shield className="h-12 w-12 mb-4 text-cyber-primary" />
              <h3 className="text-xl font-bold mb-2">AI Analysis</h3>
              <p className="text-foreground/80">
                Our AI algorithms analyze the collected data to identify patterns, anomalies, and potential threats
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg relative" data-aos="fade-up" data-aos-delay="300">
              <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-cyber-primary text-cyber-dark flex items-center justify-center font-bold">
                4
              </div>
              <AlertTriangle className="h-12 w-12 mb-4 text-cyber-primary" />
              <h3 className="text-xl font-bold mb-2">Actionable Intelligence</h3>
              <p className="text-foreground/80">
                We provide actionable insights and recommendations to help you respond to threats effectively
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12" data-aos="fade-up">
            <h2 className="text-3xl font-bold mb-4">What Our Clients Say</h2>
            <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
              Hear from organizations that have transformed their security posture with Haktrak Networks
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={index}
                quote={testimonial.quote}
                author={testimonial.author}
                title={testimonial.title}
                image={testimonial.image}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="bg-card p-8 md:p-12 rounded-lg" data-aos="fade-up">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0 md:mr-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to secure your digital assets?</h2>
                <p className="text-foreground/80 max-w-xl">
                  Get started with Haktrak Networks today and experience the power of AI-driven cyber intelligence
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-cyber-primary text-cyber-dark hover:bg-cyber-primary/90" asChild>
                  <Link href="/request-demo">
                    Request Demo <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-cyber-primary text-cyber-primary hover:bg-cyber-primary/10"
                  asChild
                >
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

