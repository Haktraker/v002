"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight, Shield, Eye, Search, Lock } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { PricingCard } from "@/components/pricing/pricing-card"
import { PricingFaq } from "@/components/pricing/pricing-faq"
import { PageHeader } from "@/components/ui/page-header"

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true)

  const plans = [
    {
      name: "Starter",
      description: "Essential protection for small businesses",
      price: isAnnual ? 499 : 599,
      period: isAnnual ? "/month, billed annually" : "/month",
      features: [
        "Dark web monitoring",
        "Basic threat intelligence",
        "Email security",
        "Up to 100 users",
        "8/5 support",
        "Weekly reports",
      ],
      cta: "Get Started",
      popular: false,
      icon: <Shield className="h-6 w-6" />,
    },
    {
      name: "Professional",
      description: "Comprehensive protection for growing organizations",
      price: isAnnual ? 999 : 1199,
      period: isAnnual ? "/month, billed annually" : "/month",
      features: [
        "Everything in Starter",
        "Advanced threat intelligence",
        "Brand protection",
        "Up to 500 users",
        "24/7 support",
        "Daily reports",
        "API access",
        "Custom integrations",
      ],
      cta: "Get Started",
      popular: true,
      icon: <Eye className="h-6 w-6" />,
    },
    {
      name: "Enterprise",
      description: "Advanced protection for large organizations",
      price: "Custom",
      period: "",
      features: [
        "Everything in Professional",
        "Full attack surface management",
        "Custom threat feeds",
        "Unlimited users",
        "Dedicated account manager",
        "Real-time alerts",
        "Advanced API access",
        "Custom dashboard",
        "On-premise deployment option",
      ],
      cta: "Contact Sales",
      popular: false,
      icon: <Lock className="h-6 w-6" />,
    },
  ]

  const faqs = [
    {
      question: "How does the pricing work?",
      answer:
        "Our pricing is based on a monthly subscription model, with discounts available for annual commitments. The price varies based on the plan you choose and the number of users in your organization.",
    },
    {
      question: "Can I upgrade or downgrade my plan?",
      answer:
        "Yes, you can upgrade your plan at any time. Downgrades can be processed at the end of your current billing cycle. Our team will help ensure a smooth transition between plans.",
    },
    {
      question: "Is there a free trial available?",
      answer:
        "Yes, we offer a 14-day free trial of our Professional plan so you can experience the full capabilities of our platform before making a commitment.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards, including Visa, Mastercard, and American Express. For Enterprise plans, we also offer invoicing options.",
    },
    {
      question: "Do you offer discounts for non-profits or educational institutions?",
      answer:
        "Yes, we offer special pricing for non-profit organizations, educational institutions, and government agencies. Please contact our sales team for more information.",
    },
    {
      question: "What kind of support is included?",
      answer:
        "All plans include email support. The Professional plan includes 24/7 support via email and chat, while the Enterprise plan adds phone support and a dedicated account manager.",
    },
  ]

  return (
    <div className="pt-16">
      <PageHeader title="Pricing Plans" description="Transparent pricing for organizations of all sizes" />

      {/* Pricing Toggle */}
      <section className="py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center space-x-4" data-aos="fade-up">
            <span className={`text-sm font-medium ${!isAnnual ? "text-foreground" : "text-foreground/60"}`}>
              Monthly
            </span>
            <Switch checked={isAnnual} onCheckedChange={setIsAnnual} id="billing-toggle" />
            <div className="flex items-center">
              <span className={`text-sm font-medium ${isAnnual ? "text-foreground" : "text-foreground/60"}`}>
                Annual
              </span>
              <span className="ml-2 bg-cyber-primary/20 text-cyber-primary text-xs py-0.5 px-2 rounded-full">
                Save 20%
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <PricingCard
                key={index}
                name={plan.name}
                description={plan.description}
                price={plan.price}
                period={plan.period}
                features={plan.features}
                cta={plan.cta}
                popular={plan.popular}
                icon={plan.icon}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div data-aos="fade-right">
              <h2 className="text-3xl font-bold mb-6">Enterprise Solutions</h2>
              <p className="text-lg text-foreground/80 mb-6">
                For large organizations with complex security needs, our Enterprise solution offers customized
                protection tailored to your specific requirements.
              </p>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-cyber-primary mr-2 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Customized Implementation</h3>
                    <p className="text-foreground/80">Tailored to your organization's specific security needs</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-cyber-primary mr-2 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Dedicated Support Team</h3>
                    <p className="text-foreground/80">Direct access to security experts who know your environment</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-cyber-primary mr-2 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Advanced Integration</h3>
                    <p className="text-foreground/80">
                      Seamless integration with your existing security infrastructure
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-cyber-primary mr-2 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Custom Reporting</h3>
                    <p className="text-foreground/80">Tailored reports and dashboards for your specific KPIs</p>
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <Button size="lg" className="bg-cyber-primary text-cyber-dark hover:bg-cyber-primary/90" asChild>
                  <Link href="/contact">
                    Contact Sales <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative" data-aos="fade-left">
              <div className="aspect-square md:aspect-video rounded-lg overflow-hidden">
                <div className="w-full h-full bg-muted/50 flex items-center justify-center">
                  <Search className="h-16 w-16 text-cyber-primary/50" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12" data-aos="fade-up">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
              Find answers to common questions about our pricing and plans
            </p>
          </div>

          <div className="max-w-3xl mx-auto" data-aos="fade-up">
            <PricingFaq faqs={faqs} />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="bg-card p-8 md:p-12 rounded-lg" data-aos="fade-up">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0 md:mr-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Still have questions?</h2>
                <p className="text-foreground/80 max-w-xl">
                  Our team is here to help you find the right plan for your organization's needs
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

