import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Handshake, Globe, Award, Users, ChevronRight } from "lucide-react"
import { PartnerCard } from "@/components/partners/partner-card"
import { PageHeader } from "@/components/ui/page-header"

export default function PartnersPage() {
  const partnerTypes = [
    {
      title: "Technology Partners",
      description: "Strategic integrations with leading technology providers",
      icon: <Globe className="h-10 w-10 text-cyber-primary" />,
      partners: [
        { name: "CloudSecure", logo: "/placeholder.svg?height=100&width=200", tier: "Premier" },
        { name: "DataGuard", logo: "/placeholder.svg?height=100&width=200", tier: "Premier" },
        { name: "NetDefend", logo: "/placeholder.svg?height=100&width=200", tier: "Elite" },
        { name: "SecureStack", logo: "/placeholder.svg?height=100&width=200", tier: "Elite" },
        { name: "ThreatShield", logo: "/placeholder.svg?height=100&width=200", tier: "Select" },
        { name: "CyberForce", logo: "/placeholder.svg?height=100&width=200", tier: "Select" },
      ],
    },
    {
      title: "Channel Partners",
      description: "Resellers and distributors of Haktrak Networks solutions",
      icon: <Handshake className="h-10 w-10 text-cyber-primary" />,
      partners: [
        { name: "Global Security Solutions", logo: "/placeholder.svg?height=100&width=200", tier: "Premier" },
        { name: "CyberDefense Partners", logo: "/placeholder.svg?height=100&width=200", tier: "Premier" },
        { name: "SecureNet Distributors", logo: "/placeholder.svg?height=100&width=200", tier: "Elite" },
        { name: "Enterprise Security Group", logo: "/placeholder.svg?height=100&width=200", tier: "Elite" },
        { name: "Cyber Solutions Inc.", logo: "/placeholder.svg?height=100&width=200", tier: "Select" },
        { name: "Digital Shield Partners", logo: '/placeholder.svg?  tier: "Select' },
        { name: "Digital Shield Partners", logo: "/placeholder.svg?height=100&width=200", tier: "Select" },
      ],
    },
    {
      title: "Service Partners",
      description: "Consulting and implementation partners for Haktrak solutions",
      icon: <Users className="h-10 w-10 text-cyber-primary" />,
      partners: [
        { name: "Cyber Consulting Group", logo: "/placeholder.svg?height=100&width=200", tier: "Premier" },
        { name: "Security Implementation Experts", logo: "/placeholder.svg?height=100&width=200", tier: "Premier" },
        { name: "ThreatOps Consultants", logo: "/placeholder.svg?height=100&width=200", tier: "Elite" },
        { name: "Digital Defense Advisors", logo: "/placeholder.svg?height=100&width=200", tier: "Elite" },
        { name: "SecureStrategy Partners", logo: "/placeholder.svg?height=100&width=200", tier: "Select" },
        { name: "CyberForce Implementers", logo: "/placeholder.svg?height=100&width=200", tier: "Select" },
      ],
    },
  ]

  return (
    <div className="pt-16">
      <PageHeader
        title="Our Partners"
        description="Join forces with Haktrak Networks to deliver cutting-edge cybersecurity solutions"
      />

      {/* Partners Overview */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div data-aos="fade-right">
              <h2 className="text-3xl font-bold mb-6">Partner Ecosystem</h2>
              <p className="text-lg text-foreground/80 mb-6">
                At Haktrak Networks, we believe in the power of collaboration. Our partner ecosystem brings together
                leading technology providers, resellers, and service organizations to deliver comprehensive
                cybersecurity solutions to our clients.
              </p>
              <p className="text-lg text-foreground/80 mb-6">
                Through strategic partnerships, we extend the reach and capabilities of our platform, ensuring that
                organizations of all sizes can benefit from our advanced threat intelligence and protection.
              </p>
              <div className="flex items-center space-x-2 text-cyber-primary">
                <Link href="/partners/become-a-partner" className="flex items-center hover:underline">
                  Learn about becoming a partner
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
            <div className="relative" data-aos="fade-left">
              <div className="aspect-video rounded-lg overflow-hidden">
                <Image
                  src="/placeholder.svg?height=720&width=1280"
                  alt="Haktrak Networks Partner Ecosystem"
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
                  <Award className="h-6 w-6 text-cyber-primary mr-2" />
                  <p className="text-lg font-bold">100+ global partners</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Types */}
      {partnerTypes.map((type, typeIndex) => (
        <section key={typeIndex} className={`py-16 ${typeIndex % 2 === 0 ? "bg-muted/30" : "bg-background"}`}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-12" data-aos="fade-up">
              <div className="inline-flex items-center justify-center mb-4">{type.icon}</div>
              <h2 className="text-3xl font-bold mb-4">{type.title}</h2>
              <p className="text-lg text-foreground/80 max-w-2xl mx-auto">{type.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {type.partners.map((partner, partnerIndex) => (
                <PartnerCard
                  key={partnerIndex}
                  name={partner.name}
                  logo={partner.logo}
                  tier={partner.tier}
                  index={partnerIndex}
                />
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Partner Benefits */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12" data-aos="fade-up">
            <h2 className="text-3xl font-bold mb-4">Partner Benefits</h2>
            <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
              Join our partner program and unlock exclusive benefits
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-lg" data-aos="fade-up" data-aos-delay="0">
              <h3 className="text-xl font-bold mb-4">Financial Incentives</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 text-cyber-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Competitive margins and discounts</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 text-cyber-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Deal registration protection</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 text-cyber-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Recurring revenue opportunities</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 text-cyber-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Performance-based incentives</span>
                </li>
              </ul>
            </div>

            <div className="bg-card p-6 rounded-lg" data-aos="fade-up" data-aos-delay="100">
              <h3 className="text-xl font-bold mb-4">Sales & Marketing Support</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 text-cyber-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Co-branded marketing materials</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 text-cyber-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Lead generation programs</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 text-cyber-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Sales enablement resources</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 text-cyber-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Joint marketing campaigns</span>
                </li>
              </ul>
            </div>

            <div className="bg-card p-6 rounded-lg" data-aos="fade-up" data-aos-delay="200">
              <h3 className="text-xl font-bold mb-4">Technical Resources</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 text-cyber-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Comprehensive training programs</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 text-cyber-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Dedicated technical support</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 text-cyber-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Integration assistance</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 text-cyber-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Early access to new features</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="bg-card p-8 md:p-12 rounded-lg" data-aos="fade-up">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0 md:mr-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Become a Haktrak Networks Partner</h2>
                <p className="text-foreground/80 max-w-xl">
                  Join our partner ecosystem and help deliver cutting-edge cybersecurity solutions to your clients
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-cyber-primary text-cyber-dark hover:bg-cyber-primary/90" asChild>
                  <Link href="/partners/become-a-partner">
                    Apply Now <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-cyber-primary text-cyber-primary hover:bg-cyber-primary/10"
                  asChild
                >
                  <Link href="/contact">Contact Us</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

