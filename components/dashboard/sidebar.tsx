"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
  Menu,
  Bug,
  Gauge,
  ShieldAlert,
  Network,
  User,
  Link2Off,
  Target,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "@/lib/auth/auth-provider"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"

interface SidebarItemProps {
  icon: React.ReactNode
  label: string
  href?: string
  isActive: boolean
  isCollapsed: boolean
  onClick?: () => void
}

function SidebarItem({ icon, label, href, isActive, isCollapsed, onClick }: SidebarItemProps) {
  const content = (
    <div
      className={cn(
        "flex items-center py-2 px-3 rounded-md group transition-colors cursor-pointer",
        isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/20",
      )}
      onClick={onClick}
    >
      <div className="mr-3 flex-shrink-0">{icon}</div>
      {!isCollapsed && <span className="truncate">{label}</span>}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

function SidebarContent({ className, isCollapsed, setIsCollapsed }: { 
  className?: string
  isCollapsed: boolean
  setIsCollapsed: (value: boolean) => void 
}) {
  const pathname = usePathname()
  const { logout } = useAuth()

  const sidebarItems = [
    { icon: <LayoutDashboard size={20} />, label: "Dashboard", href: "/dashboard" },
    { icon: <ShieldAlert size={20} />, label: "Threat Composition", href: "/dashboard/threat-composition" },
    { icon: <Bug size={20} />, label: "Security Breach Indicators", href: "/dashboard/security-breach-indicators" },
    { icon: <Network size={20} />, label: "BusinessUnits Security", href: "/dashboard/business-units-security" },
    { icon: <User size={20} />, label: "User Behavior Analytics", href: "/dashboard/user-behavior-analytics" },
    { icon: <Link2Off size={20} />, label: "Kill Chain", href: "/dashboard/kill-chain" },
    { icon: <Gauge size={20} />, label: "Compliance Dashboard", href: "/dashboard/cybersecurity-compliance-dashboard" },
    { icon: <Building size={20} />, label: "Assets", href: "/dashboard/assets" },
    { icon: <Target size={20} />, label: "Attack Surface", href: "/dashboard/attack-surface" },
    { icon: <BarChart2 size={20} />, label: "Reports", href: "/dashboard/reports" },
  ]

  return (
    <div className={cn("flex flex-col h-full bg-card border-r", className)}>
      <div className="p-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-4 px-2">
          {!isCollapsed && (
            <div className="flex items-center">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold ml-2">Haktrak</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
        </div>
        <nav className="space-y-1">
          {sidebarItems.map((item) => (
            <TooltipProvider key={item.href} delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <SidebarItem
                      icon={item.icon}
                      label={item.label}
                      href={item.href}
                      isActive={pathname === item.href}
                      isCollapsed={isCollapsed}
                    />
                  </div>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right" className="flex items-center gap-4">
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-3">
        <nav className="space-y-1">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <SidebarItem
                    icon={<Settings size={20} />}
                    label="Settings"
                    href="/dashboard/settings"
                    isActive={pathname === "/dashboard/settings"}
                    isCollapsed={isCollapsed}
                  />
                </div>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">Settings</TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <SidebarItem
                    icon={<HelpCircle size={20} />}
                    label="Help"
                    href="/dashboard/help"
                    isActive={pathname === "/dashboard/help"}
                    isCollapsed={isCollapsed}
                  />
                </div>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">Help</TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <SidebarItem
                    icon={<LogOut size={20} />}
                    label="Logout"
                    isActive={false}
                    isCollapsed={isCollapsed}
                    onClick={logout}
                  />
                </div>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">Logout</TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </nav>
      </div>
    </div>
  )
}

export function DashboardSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      setIsCollapsed(window.innerWidth < 1024)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed left-4 top-3 z-40">
            <Menu size={20} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SidebarContent isCollapsed={false} setIsCollapsed={setIsCollapsed} />
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <SidebarContent 
      className={cn(
        "border-r transition-all duration-300",
        isCollapsed ? "w-[70px]" : "w-[240px]"
      )}
      isCollapsed={isCollapsed}
      setIsCollapsed={setIsCollapsed}
    />
  )
}
