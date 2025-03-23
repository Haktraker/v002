import Image from "next/image"

interface TeamMemberProps {
  name: string
  role: string
  bio: string
  image: string
  index: number
}

export function TeamMember({ name, role, bio, image, index }: TeamMemberProps) {
  return (
    <div className="bg-card rounded-lg overflow-hidden" data-aos="fade-up" data-aos-delay={index * 100}>
      <div className="aspect-square relative">
        <Image src={image || "/placeholder.svg"} alt={name} fill className="object-cover" />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold">{name}</h3>
        <p className="text-cyber-primary mb-2">{role}</p>
        <p className="text-foreground/80 text-sm">{bio}</p>
      </div>
    </div>
  )
}

