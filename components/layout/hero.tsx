"use client"

import { ReactNode, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

interface HeroButtonProps {
  label: string
  href: string
  variant?: "default" | "outline" | "secondary" | "link"
  icon?: ReactNode
  className?: string
}

interface HeroProps {
  title: string | ReactNode
  description?: string | ReactNode
  className?: string
  titleClassName?: string
  descriptionClassName?: string
  backgroundComponent?: ReactNode
  withParallax?: boolean
  parallaxStrength?: number
  buttons?: HeroButtonProps[]
  children?: ReactNode
  fullHeight?: boolean
  withGrid?: boolean
  ctaClassName?: string
}

export function Hero({
  title,
  description,
  className,
  titleClassName,
  descriptionClassName,
  backgroundComponent,
  withParallax = true,
  parallaxStrength = 0.5,
  buttons,
  children,
  fullHeight = true,
  withGrid = false,
  ctaClassName,
}: HeroProps) {
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (withParallax && typeof window !== "undefined") {
      const handleScroll = () => {
        const scrollY = window.scrollY
        if (heroRef.current) {
          heroRef.current.style.transform = `translateY(${scrollY * parallaxStrength}px)`
          heroRef.current.style.opacity = `${1 - scrollY * 0.002}`
        }
      }

      window.addEventListener("scroll", handleScroll)
      return () => window.removeEventListener("scroll", handleScroll)
    }
  }, [withParallax, parallaxStrength])

  return (
    <section 
      className={cn(
        "relative bg-white dark:bg-dark-bg overflow-hidden",
        fullHeight && "h-screen",
        className
      )}
    >
      {/* Background Grid */}
      <div className="absolute inset-0 cyber-grid opacity-30"></div>

      {/* Parallax Background */}
      {backgroundComponent && (
        <div 
          ref={heroRef} 
          className="absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          {backgroundComponent}
        </div>
      )}

      {/* Content */}
      <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-center text-center z-10 pt-16">
        <h1 
          className={cn(
            "text-4xl md:text-6xl font-bold mb-6 cyber-gradient glow-text",
            titleClassName
          )}
        >
          {title}
        </h1>
        
        {description && (
          <p 
            className={cn(
              "text-xl md:text-2xl text-foreground/80 dark:text-white-85 max-w-3xl mb-8",
              descriptionClassName
            )}
          >
            {description}
          </p>
        )}
        
        {buttons && buttons.length > 0 && (
          <div className={cn(
            "flex flex-col sm:flex-row gap-4",
            ctaClassName
          )}>
            {buttons.map((button, index) => {
              const variants: Record<string, string> = {
                default: "bg-purple text-white hover:bg-opacity-90 glow",
                outline: "border-purple text-purple dark:text-white hover:bg-purple-bg-5 dark:hover:bg-purple-bg-10",
                secondary: "bg-cyber-accent text-white hover:bg-opacity-90",
                link: "text-purple hover:text-opacity-90 p-0 border-none"
              }
              
              return (
                <Button 
                  key={index}
                  size="lg" 
                  variant={button.variant === "outline" ? "outline" : "default"}
                  className={cn(
                    variants[button.variant || "default"],
                    button.className
                  )} 
                  asChild
                >
                  <Link href={button.href}>
                    {button.label}
                    {button.icon ? button.icon : button.variant === "default" ? <ArrowRight className="ml-2 h-5 w-5" /> : null}
                  </Link>
                </Button>
              )
            })}
          </div>
        )}
        
        {/* Additional content */}
        {children && (
          <div className={cn(
            "mt-16 w-full max-w-4xl",
            withGrid && "grid grid-cols-1 md:grid-cols-3 gap-6"
          )}>
            {children}
          </div>
        )}

        {/* Scroll Indicator */}
        {fullHeight && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
            <span className="text-sm text-foreground/60 dark:text-white-45 mb-2">Scroll to explore</span>
            <div className="w-6 h-10 border-2 border-foreground/30 dark:border-white-45 rounded-full flex justify-center">
              <div className="w-1.5 h-1.5 bg-foreground/60 dark:bg-white-45 rounded-full animate-bounce mt-2"></div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
} 