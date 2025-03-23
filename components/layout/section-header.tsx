"use client"

import React, { ReactNode } from "react"
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
  highlight?: string | string[]
  align?: "left" | "center" | "right"
  titleSize?: "sm" | "md" | "lg" | "xl"
  withLine?: boolean
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
  highlight,
  align = "center",
  titleSize = "lg",
  withLine = false,
}: SectionHeaderProps) {
  const alignClasses = {
    left: "text-left",
    center: "text-center mx-auto",
    right: "text-right ml-auto",
  }

  const titleClasses = {
    sm: "text-xl md:text-2xl",
    md: "text-2xl md:text-3xl",
    lg: "text-3xl md:text-4xl",
    xl: "text-4xl md:text-5xl",
  }

  const formattedTitle = 
    typeof title === "string" && withHighlight && highlightWord 
      ? title.split(highlightWord).map((part, i, arr) => (
          i < arr.length - 1 ? (
            <React.Fragment key={`part-${i}`}>
              {part}
              <span className="text-purple dark:cyber-gradient font-semibold">{highlightWord}</span>
            </React.Fragment>
          ) : (
            part
          )
        ))
      : title;

  const renderTitle = () => {
    if (!highlight) return <>{formattedTitle}</>

    let highlights = Array.isArray(highlight) ? highlight : [highlight]
    
    // Create parts array to alternate between regular and highlighted text
    const parts: ReactNode[] = []
    let remainingTitle = formattedTitle
    
    highlights.forEach((highlightText, highlightIndex) => {
      const index = remainingTitle.toString().indexOf(highlightText)
      if (index !== -1) {
        parts.push(remainingTitle.toString().substring(0, index))
        parts.push(
          <span key={`highlight-${highlightIndex}`} className="text-purple dark:cyber-gradient font-semibold">{highlightText}</span>
        )
        remainingTitle = remainingTitle.toString().substring(index + highlightText.length)
      }
    })
    if (remainingTitle) parts.push(remainingTitle)
    
    return (
      <>
        {parts.map((part, index) => {
          // If part is already a React element with a key, just return it
          if (React.isValidElement(part) && part.key) {
            return part
          }
          // Otherwise wrap it with a span and add a key
          return <span key={`part-${index}`}>{part}</span>
        })}
      </>
    )
  }

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
          `text-3xl md:text-4xl font-bold mb-4 text-gray-800 dark:text-white ${titleClasses[titleSize]}`,
          titleClassName
        )}
      >
        {renderTitle()}
      </h2>

      {withLine && (
        <div className={cn(
          "w-24 h-1 bg-purple mb-6",
          align === "center" && "mx-auto",
          align === "right" && "ml-auto"
        )}></div>
      )}

      {description && (
        <p 
          className={cn(
            "text-gray-600 dark:text-white-85 max-w-2xl",
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