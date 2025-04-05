"use client"

import React from "react"
import useBreadcrumb from "../../hooks/use-breadcrumb"

interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export function PageContainer({ children, className = "" }: PageContainerProps) {
  const { BreadcrumbComponent } = useBreadcrumb()

  return (
    <div className={`p-6 ${className}`}>
      <BreadcrumbComponent />
      <div className="mt-6">
        {children}
      </div>
    </div>
  )
}
