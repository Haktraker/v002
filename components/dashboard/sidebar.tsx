"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Database,
  WormIcon as Virus,
  Users,
  Shield,
  FileSearch,
  Globe,
  Building,
  Lock,
  BarChart2,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SidebarItemProps {
  icon: React.ReactNode
  label: string
  href: string
  isActive: boolean
  isCollapsed: boolean
}

function SidebarItem({ icon, label, href, isActive, isCollapsed }: SidebarItemProps) {
  const content = (
    <Link
      href={href}
      className={cn(
        "flex items-center py-2 px-3 rounded-md group transition-colors",
        isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/20",
      )}
    >
      <div className="mr-3">{icon}</div>
      {!isCollapsed && <span>{label}</span>}
    </Link>
  )

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" align="start">
          {label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return content
}

export function DashboardSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  const sidebarItems = [
    {
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      icon: <Database className="h-5 w-5" />,
      label: "Breached Databases",
      href: "/dashboard/breached",
    },
    {
      icon: <Virus className="h-5 w-5" />,
      label: "Employees Malware Logs",
      href: "/dashboard/employee-logs",
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: "Customers Malware Logs",
      href: "/dashboard/customer-logs",
    },
    {
      icon: <FileSearch className="h-5 w-5" />,
      label: "Threats Hunting",
      href: "/dashboard/threats",
    },
    {
      icon: <Globe className="h-5 w-5" />,
      label: "Mentions Monitoring",
      href: "/dashboard/mentions",
    },
    {
      icon: <Lock className="h-5 w-5" />,
      label: "Typo Squatting Domains",
      href: "/dashboard/typo-squatting",
    },
    {
      icon: <Shield className="h-5 w-5" />,
      label: "C-Level Protection",
      href: "/dashboard/c-level",
    },
    {
      icon: <BarChart2 className="h-5 w-5" />,
      label: "Third Party Monitoring",
      href: "/dashboard/third-party",
    },
  ]

  const bottomItems = [
    {
      icon: <Building className="h-5 w-5" />,
      label: "Organization",
      href: "/dashboard/organization",
    },
    {
      icon: <HelpCircle className="h-5 w-5" />,
      label: "Support",
      href: "/dashboard/support",
    },
    {
      icon: <Settings className="h-5 w-5" />,
      label: "Settings",
      href: "/dashboard/settings",
    },
    {
      icon: <LogOut className="h-5 w-5" />,
      label: "Log Out",
      href: "/auth/logout",
    },
  ]

  return (
    <>
      <div className={cn("bg-card transition-all duration-300 h-screen fixed z-30", isCollapsed ? "w-16" : "w-64")}>
        <div className="p-4 flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center">
              <Shield className="h-6 w-6 text-primary mr-2" />
              <span className="font-bold">
                DARK<span className="text-foreground">ATLAS</span>
              </span>
            </div>
          )}
          {isCollapsed && <Shield className="h-6 w-6 text-primary mx-auto" />}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-muted-foreground hover:text-foreground"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <TooltipProvider delayDuration={300}>
          <div className="flex flex-col h-[calc(100vh-4rem)]">
            <div className="flex-1 py-4 px-3 space-y-2 overflow-y-auto">
              {sidebarItems.map((item) => (
                <SidebarItem
                  key={item.href}
                  icon={item.icon}
                  label={item.label}
                  href={item.href}
                  isActive={pathname === item.href}
                  isCollapsed={isCollapsed}
                />
              ))}
            </div>

            <div className="px-3 py-4 space-y-2">
              {bottomItems.map((item) => (
                <SidebarItem
                  key={item.href}
                  icon={item.icon}
                  label={item.label}
                  href={item.href}
                  isActive={pathname === item.href}
                  isCollapsed={isCollapsed}
                />
              ))}
            </div>
          </div>
        </TooltipProvider>
      </div>
      <div className={cn("transition-all duration-300", isCollapsed ? "ml-16" : "ml-64")}>
        {/* This is an empty div that pushes the main content to make space for the sidebar */}
      </div>
    </>
  )
}

