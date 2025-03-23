"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  title: string | ReactNode
  description?: string | ReactNode
  className?: string
  titleClassName?: string
  descriptionClassName?: string
  highlightWord?: string
  withHighlight?: boolean
  centered?: boolean
  withAnimation?: boolean
}

export function SectionHeader({
  title,
  description,
  className,
  titleClassName,
  descriptionClassName,
  highlightWord,
  withHighlight = true,
  centered = true,
  withAnimation = true,
}: SectionHeaderProps) {
  // If title is a string and highlightWord exists, highlight that word
  const formattedTitle = 
    typeof title === "string" && withHighlight && highlightWord 
      ? title.split(highlightWord).map((part, i, arr) => (
          i < arr.length - 1 ? (
            <>
              {part}
              <span className="cyber-gradient">{highlightWord}</span>
            </>
          ) : (
            part
          )
        ))
      : title;

  return (
    <div 
      className={cn(
        "mb-16",
        centered && "text-center",
        className
      )}
      data-aos={withAnimation ? "fade-up" : undefined}
    >
      <h2 
        className={cn(
          "text-3xl md:text-4xl font-bold mb-4",
          titleClassName
        )}
      >
        {formattedTitle}
      </h2>
      {description && (
        <p 
          className={cn(
            "text-foreground/80 dark:text-white-85 max-w-2xl",
            centered && "mx-auto",
            descriptionClassName
          )}
        >
          {description}
        </p>
      )}
    </div>
  )
} 