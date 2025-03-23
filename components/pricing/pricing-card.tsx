import Link from "next/link"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

interface PricingCardProps {
  name: string
  description: string
  price: number | string
  period: string
  features: string[]
  cta: string
  popular: boolean
  icon: ReactNode
  index: number
}

export function PricingCard({
  name,
  description,
  price,
  period,
  features,
  cta,
  popular,
  icon,
  index,
}: PricingCardProps) {
  return (
    <div
      className={`bg-card rounded-lg ${popular ? "shadow-lg shadow-cyber-primary/10" : ""} overflow-hidden relative`}
      data-aos="fade-up"
      data-aos-delay={index * 100}
    >
      {popular && (
        <div className="absolute top-0 right-0 bg-cyber-primary text-cyber-dark text-xs font-bold py-1 px-3 rounded-bl-lg">
          Most Popular
        </div>
      )}

      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className={`p-2 rounded-md ${popular ? "bg-cyber-primary/20" : "bg-muted/30"} mr-3`}>{icon}</div>
          <h3 className="text-xl font-bold">{name}</h3>
        </div>

        <p className="text-foreground/80 mb-6">{description}</p>

        <div className="mb-6">
          <div className="flex items-end">
            <span className="text-3xl font-bold">{typeof price === "number" ? `$${price}` : price}</span>
            <span className="text-foreground/60 ml-1">{period}</span>
          </div>
        </div>

        <Button
          className={`w-full mb-6 ${popular ? "bg-cyber-primary text-cyber-dark hover:bg-cyber-primary/90" : "bg-muted/30 hover:bg-muted/50"}`}
          asChild
        >
          <Link href={name === "Enterprise" ? "/contact" : "/request-demo"}>{cta}</Link>
        </Button>

        <div className="space-y-3">
          {features.map((feature, i) => (
            <div key={i} className="flex items-start">
              <CheckCircle
                className={`h-5 w-5 ${popular ? "text-cyber-primary" : "text-foreground/60"} mr-2 mt-0.5 flex-shrink-0`}
              />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

