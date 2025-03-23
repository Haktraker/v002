import Link from "next/link"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle } from "lucide-react"

interface SolutionCardProps {
  icon: ReactNode
  title: string
  description: string
  features: string[]
  href: string
  index: number
}

export function SolutionCard({ icon, title, description, features, href, index }: SolutionCardProps) {
  return (
    <div className="bg-card p-6 rounded-lg" data-aos="fade-up" data-aos-delay={index * 100}>
      <div className="mb-4 bg-muted/30 p-4 rounded-md inline-block">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-foreground/80 mb-4">{description}</p>

      <div className="space-y-2 mb-6">
        {features.map((feature, i) => (
          <div key={i} className="flex items-start">
            <CheckCircle className="h-5 w-5 text-cyber-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{feature}</span>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        className="w-full border-cyber-primary text-cyber-primary hover:bg-cyber-primary/10"
        asChild
      >
        <Link href={href}>
          Learn More <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  )
}

