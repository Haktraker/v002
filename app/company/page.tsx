import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield, Users, Award, Globe, ArrowRight, ChevronRight } from "lucide-react"
import { TeamMember } from "@/components/company/team-member"
import { CompanyValue } from "@/components/company/company-value"
import { PageHeader } from "@/components/ui/page-header"

export default function CompanyPage() {
  const teamMembers = [
    {
      name: "Alex Johnson",
      role: "CEO & Founder",
      bio: "Former cybersecurity lead at a Fortune 500 company with 15+ years of experience in threat intelligence.",
      image: "/placeholder.svg?height=400&width=400",
    },
    {
      name: "Sarah Chen",
      role: "CTO",
      bio: "PhD in Computer Science with specialization in AI and machine learning for cybersecurity applications.",
      image: "/placeholder.svg?height=400&width=400",
    },
    {
      name: "Michael Rodriguez",
      role: "Head of Threat Intelligence",
      bio: "Former intelligence analyst with extensive experience in dark web monitoring and threat detection.",
      image: "/placeholder.svg?height=400&width=400",
    },
    {
      name: "Priya Sharma",
      role: "VP of Product",
      bio: "Product leader with a passion for building intuitive security solutions that solve real-world problems.",
      image: "/placeholder.svg?height=400&width=400",
    },
  ]

  const companyValues = [
    {
      icon: <Shield className="h-10 w-10 text-cyber-primary" />,
      title: "Proactive Protection",
      description: "We believe in staying ahead of threats rather than reacting to them after damage is done.",
    },
    {
      icon: <Users className="h-10 w-10 text-cyber-primary" />,
      title: "Customer-Centric",
      description:
        "Our customers' security is our top priority, and we build solutions that address their specific needs.",
    },
    {
      icon: <Award className="h-10 w-10 text-cyber-primary" />,
      title: "Excellence",
      description: "We strive for excellence in everything we do, from our technology to our customer service.",
    },
    {
      icon: <Globe className="h-10 w-10 text-cyber-primary" />,
      title: "Global Perspective",
      description: "Cyber threats are global, and our approach to security reflects this international reality.",
    },
  ]

  return (
    <div className="pt-16">
      <PageHeader
        title="About Haktrak Networks"
        description="Pioneering AI-powered cybersecurity solutions to protect organizations worldwide"
      />

      {/* Mission Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div data-aos="fade-right">
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-lg text-foreground/80 mb-6">
                At Haktrak Networks, our mission is to revolutionize cybersecurity through AI-powered intelligence,
                providing organizations with the tools they need to stay ahead of evolving threats in an increasingly
                complex digital landscape.
              </p>
              <p className="text-lg text-foreground/80 mb-6">
                We believe that proactive threat intelligence is the foundation of effective cybersecurity, and we're
                committed to making this intelligence accessible, actionable, and contextually relevant for
                organizations of all sizes.
              </p>
              <div className="flex items-center space-x-2 text-cyber-primary">
                <Link href="/solutions" className="flex items-center hover:underline">
                  Learn about our approach
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
            <div className="relative" data-aos="fade-left">
              <div className="aspect-video rounded-lg overflow-hidden">
                <Image
                  src="/placeholder.svg?height=720&width=1280"
                  alt="Haktrak Networks Mission"
                  width={1280}
                  height={720}
                  className="object-cover"
                />
              </div>
              <div
                className="absolute -bottom-6 -right-6 bg-background p-4 rounded-lg shadow-lg"
                data-aos="fade-up"
                data-aos-delay="200"
              >
                <p className="text-xl font-bold cyber-gradient">Protection Beyond Perimeters</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12" data-aos="fade-up">
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
              These core principles guide everything we do at Haktrak Networks
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {companyValues.map((value, index) => (
              <CompanyValue
                key={index}
                icon={value.icon}
                title={value.title}
                description={value.description}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12" data-aos="fade-up">
            <h2 className="text-3xl font-bold mb-4">Our Leadership Team</h2>
            <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
              Meet the experts behind Haktrak Networks' innovative cybersecurity solutions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <TeamMember
                key={index}
                name={member.name}
                role={member.role}
                bio={member.bio}
                image={member.image}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* History Timeline */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12" data-aos="fade-up">
            <h2 className="text-3xl font-bold mb-4">Our Journey</h2>
            <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
              From startup to industry leader in cybersecurity intelligence
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-border"></div>

            {/* Timeline Items */}
            <div className="space-y-16">
              <div className="relative" data-aos="fade-right">
                <div className="absolute left-1/2 transform -translate-x-1/2 -mt-3 w-7 h-7 rounded-full bg-cyber-primary border-4 border-background"></div>
                <div className="ml-auto mr-8 md:mr-auto md:ml-8 md:pl-10 max-w-md bg-card p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-bold mb-2">2018</h3>
                  <h4 className="text-lg font-semibold mb-2">Company Founded</h4>
                  <p className="text-foreground/80">
                    Haktrak Networks was founded with a vision to revolutionize threat intelligence through AI.
                  </p>
                </div>
              </div>

              <div className="relative" data-aos="fade-left">
                <div className="absolute left-1/2 transform -translate-x-1/2 -mt-3 w-7 h-7 rounded-full bg-cyber-primary border-4 border-background"></div>
                <div className="mr-auto ml-8 md:ml-auto md:mr-8 md:pr-10 max-w-md bg-card p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-bold mb-2">2020</h3>
                  <h4 className="text-lg font-semibold mb-2">Series A Funding</h4>
                  <p className="text-foreground/80">
                    Secured $12M in Series A funding to accelerate product development and market expansion.
                  </p>
                </div>
              </div>

              <div className="relative" data-aos="fade-right">
                <div className="absolute left-1/2 transform -translate-x-1/2 -mt-3 w-7 h-7 rounded-full bg-cyber-primary border-4 border-background"></div>
                <div className="ml-auto mr-8 md:mr-auto md:ml-8 md:pl-10 max-w-md bg-card p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-bold mb-2">2021</h3>
                  <h4 className="text-lg font-semibold mb-2">Platform Launch</h4>
                  <p className="text-foreground/80">
                    Launched our flagship XCI Platform, bringing AI-powered threat intelligence to organizations
                    worldwide.
                  </p>
                </div>
              </div>

              <div className="relative" data-aos="fade-left">
                <div className="absolute left-1/2 transform -translate-x-1/2 -mt-3 w-7 h-7 rounded-full bg-cyber-primary border-4 border-background"></div>
                <div className="mr-auto ml-8 md:ml-auto md:mr-8 md:pr-10 max-w-md bg-card p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-bold mb-2">2023</h3>
                  <h4 className="text-lg font-semibold mb-2">Global Expansion</h4>
                  <p className="text-foreground/80">
                    Expanded operations to Europe and Asia, with new offices in London and Singapore.
                  </p>
                </div>
              </div>

              <div className="relative" data-aos="fade-right">
                <div className="absolute left-1/2 transform -translate-x-1/2 -mt-3 w-7 h-7 rounded-full bg-cyber-primary border-4 border-background"></div>
                <div className="ml-auto mr-8 md:mr-auto md:ml-8 md:pl-10 max-w-md bg-card p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-bold mb-2">Today</h3>
                  <h4 className="text-lg font-semibold mb-2">Industry Leader</h4>
                  <p className="text-foreground/80">
                    Now serving over 500 enterprise clients globally with cutting-edge cybersecurity solutions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="bg-card p-8 md:p-12 rounded-lg" data-aos="fade-up">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0 md:mr-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Join Our Team</h2>
                <p className="text-foreground/80 max-w-xl">
                  We're always looking for talented individuals who are passionate about cybersecurity and innovation.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-cyber-primary text-cyber-dark hover:bg-cyber-primary/90" asChild>
                  <Link href="/company/careers">
                    View Open Positions <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

