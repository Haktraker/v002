import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Shield, ArrowRight, CheckCircle, Laptop, Server, Cloud, Smartphone } from "lucide-react"
import { ProductCard } from "@/components/products/product-card"
import { FeatureComparison } from "@/components/products/feature-comparison"
import { PageHeader } from "@/components/ui/page-header"

export default function ProductsPage() {
  const products = [
    {
      icon: <Shield className="h-10 w-10 text-cyber-primary" />,
      title: "Haktrak XCI Platform",
      description: "Our flagship eXtended Cyber Intelligence platform providing comprehensive threat protection.",
      features: [
        "All-in-one cybersecurity solution",
        "AI-powered threat detection",
        "Dark web monitoring",
        "Attack surface management",
        "Brand protection",
        "Credential monitoring",
      ],
      image: "/placeholder.svg?height=300&width=500",
      href: "/products/xci-platform",
    },
    {
      icon: <Cloud className="h-10 w-10 text-cyber-primary" />,
      title: "Haktrak Cloud Secure",
      description: "Cloud-native security solution for protecting your cloud infrastructure and applications.",
      features: [
        "Multi-cloud support (AWS, Azure, GCP)",
        "Cloud misconfigurations detection",
        "Identity and access monitoring",
        "Serverless security",
        "Container protection",
        "Compliance monitoring",
      ],
      image: "/placeholder.svg?height=300&width=500",
      href: "/products/cloud-secure",
    },
    {
      icon: <Laptop className="h-10 w-10 text-cyber-primary" />,
      title: "Haktrak Endpoint Guardian",
      description: "Advanced endpoint protection with AI-powered threat detection and response.",
      features: [
        "Real-time endpoint monitoring",
        "Behavioral analysis",
        "Fileless malware detection",
        "Automated response",
        "Remote device management",
        "Offline protection",
      ],
      image: "/placeholder.svg?height=300&width=500",
      href: "/products/endpoint-guardian",
    },
    {
      icon: <Smartphone className="h-10 w-10 text-cyber-primary" />,
      title: "Haktrak Mobile Protector",
      description: "Secure your mobile workforce with comprehensive protection for iOS and Android devices.",
      features: [
        "Mobile threat defense",
        "App security scanning",
        "Phishing protection",
        "Network security",
        "Data leakage prevention",
        "Remote wipe capabilities",
      ],
      image: "/placeholder.svg?height=300&width=500",
      href: "/products/mobile-protector",
    },
  ]

  return (
    <div className="pt-16">
      <PageHeader
        title="Our Products"
        description="Advanced cybersecurity products designed for the modern threat landscape"
      />

      {/* Products Overview */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div data-aos="fade-right">
              <h2 className="text-3xl font-bold mb-6">Innovative Security Products</h2>
              <p className="text-lg text-foreground/80 mb-6">
                Our product suite is designed to address the evolving cybersecurity challenges faced by organizations of
                all sizes, from startups to global enterprises.
              </p>
              <p className="text-lg text-foreground/80 mb-6">
                Each product is built on our core AI technology, providing intelligent, adaptive protection that evolves
                with the threat landscape.
              </p>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-cyber-primary mr-2 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Enterprise-Grade Security</h3>
                    <p className="text-foreground/80">Robust protection for organizations of all sizes</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-cyber-primary mr-2 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Seamless Integration</h3>
                    <p className="text-foreground/80">Works with your existing security infrastructure</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-cyber-primary mr-2 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Continuous Updates</h3>
                    <p className="text-foreground/80">Regular updates to address emerging threats</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative" data-aos="fade-left">
              <div className="aspect-video rounded-lg overflow-hidden">
                <Image
                  src="/placeholder.svg?height=720&width=1280"
                  alt="Haktrak Networks Products"
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
                <div className="flex items-center">
                  <Server className="h-6 w-6 text-cyber-primary mr-2" />
                  <p className="text-lg font-bold">99.9% uptime guarantee</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Cards */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12" data-aos="fade-up">
            <h2 className="text-3xl font-bold mb-4">Our Product Suite</h2>
            <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
              Explore our range of cybersecurity products designed for different needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {products.map((product, index) => (
              <ProductCard
                key={index}
                icon={product.icon}
                title={product.title}
                description={product.description}
                features={product.features}
                image={product.image}
                href={product.href}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12" data-aos="fade-up">
            <h2 className="text-3xl font-bold mb-4">Product Comparison</h2>
            <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
              Compare our products to find the right solution for your organization
            </p>
          </div>

          <div data-aos="fade-up">
            <FeatureComparison />
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12" data-aos="fade-up">
            <h2 className="text-3xl font-bold mb-4">Seamless Integration</h2>
            <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
              Our products integrate with your existing security infrastructure and tools
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 max-w-4xl mx-auto">
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={index}
                className="bg-card aspect-square rounded-lg flex items-center justify-center p-4"
                data-aos="fade-up"
                data-aos-delay={index * 50}
              >
                <div className="w-16 h-16 bg-muted/50 rounded-md"></div>
              </div>
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
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to see our products in action?</h2>
                <p className="text-foreground/80 max-w-xl">
                  Schedule a personalized demo to see how our products can protect your organization
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
                  <Link href="/contact">Contact Sales</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

