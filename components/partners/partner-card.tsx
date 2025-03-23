import Image from "next/image"

interface PartnerCardProps {
  name: string
  logo: string
  tier: "Premier" | "Elite" | "Select"
  index: number
}

export function PartnerCard({ name, logo, tier, index }: PartnerCardProps) {
  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Premier":
        return "bg-cyber-primary/20 text-cyber-primary border-cyber-primary/30"
      case "Elite":
        return "bg-cyber-accent/20 text-cyber-accent border-cyber-accent/30"
      case "Select":
        return "bg-muted/30 text-foreground/80 border-border"
      default:
        return "bg-muted/30 text-foreground/80 border-border"
    }
  }

  return (
    <div className="bg-card rounded-lg overflow-hidden" data-aos="fade-up" data-aos-delay={index * 50}>
      <div className="p-6">
        <div className="h-20 flex items-center justify-center mb-4">
          <Image src={logo || "/placeholder.svg"} alt={name} width={200} height={100} className="max-h-16 w-auto" />
        </div>
        <h3 className="text-lg font-bold text-center mb-2">{name}</h3>
        <div
          className={`text-xs py-1 px-3 rounded-full ${getTierColor(tier)} inline-block mx-auto text-center w-full border`}
        >
          {tier} Partner
        </div>
      </div>
    </div>
  )
}

