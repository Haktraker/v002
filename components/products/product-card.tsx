import Link from "next/link"
import Image from "next/image"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle } from "lucide-react"

interface ProductCardProps {
  icon: ReactNode
  title: string
  description: string
  features: string[]
  image: string
  href: string
  index: number
}

export function ProductCard({ icon, title, description, features, image, href, index }: ProductCardProps) {
  return (
    <div className="bg-card rounded-lg overflow-hidden" data-aos="fade-up" data-aos-delay={index * 100}>
      <div className="aspect-video relative">
        <Image src={image || "/placeholder.svg"} alt={title} fill className="object-cover" />
        <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm p-2 rounded-md">{icon}</div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-foreground/80 mb-4">{description}</p>

        <div className="space-y-2 mb-6">
          {features.slice(0, 4).map((feature, i) => (
            <div key={i} className="flex items-start">
              <CheckCircle className="h-5 w-5 text-cyber-primary mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            className="border-cyber-primary text-cyber-primary hover:bg-cyber-primary/10"
            asChild
          >
            <Link href={href}>
              Learn More <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>

          {features.length > 4 && (
            <span className="text-xs text-foreground/60">+{features.length - 4} more features</span>
          )}
        </div>
      </div>
    </div>
  )
}

