"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth/auth-provider"
import { useTheme as useNextTheme } from "next-themes"
import { Menu, X, Shield, ChevronDown, User, LogOut, Sun, Moon, LaptopIcon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface NavItem {
  name: string
  href: string
  children?: NavItem[]
}

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout, isAuthenticated } = useAuth()
  const { theme, setTheme, resolvedTheme } = useNextTheme()
  const [mounted, setMounted] = useState(false)

  // After mounting, we have access to the theme
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle scroll events for navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    // Add passive: true for better performance on scroll events
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close mobile menu when navigating to a different page
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const navItems: NavItem[] = [
    { name: "Company", href: "/company" },
    { name: "Solutions", href: "/solutions" },
    { name: "Products", href: "/products" },
    { name: "Partners", href: "/partners" },
    { name: "Pricing", href: "/pricing" },
  ]

  // Memoized function to toggle mobile menu
  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev)
  }, [])

  // Handle keyboard navigation
  const handleNavItemKeyDown = useCallback((e: React.KeyboardEvent, href: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      window.location.href = href
    }
  }, [])

  // Avoid hydration mismatch by not rendering theme-specific elements until mounted
  const renderThemeChanger = () => {
    if (!mounted) return null

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="icon"
            aria-label="Change theme"
          >
            {theme === "light" || (theme === "system" && resolvedTheme === "light") ? (
              <Sun className="h-[1.2rem] w-[1.2rem]" />
            ) : (
              <Moon className="h-[1.2rem] w-[1.2rem]" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-background border-purple-10 dark:border-purple-30">
          <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value)}>
            <DropdownMenuRadioItem value="light" className="cursor-pointer">
              <Sun className="h-4 w-4 mr-2" />
              Light
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark" className="cursor-pointer">
              <Moon className="h-4 w-4 mr-2" />
              Dark
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system" className="cursor-pointer">
              <LaptopIcon className="h-4 w-4 mr-2" />
              System
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Avoid rendering the dashboard-specific navbar
  if (pathname.startsWith("/dashboard")) {
    return null
  }

  return (
    <nav
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300",
        isScrolled || isMobileMenuOpen ? 
          "bg-white/90 dark:bg-dark-card-translucent backdrop-blur-md shadow-sm" : 
          "bg-transparent"
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center space-x-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple rounded-md"
            aria-label="Haktrak Networks homepage"
          >
            <Shield className="h-8 w-8 text-purple" aria-hidden="true" />
            <span className="font-bold text-xl tracking-tight cyber-gradient">Haktrak Networks</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-purple focus:outline-none focus-visible:ring-2 focus-visible:ring-purple rounded-md px-2 py-1",
                  pathname.startsWith(item.href) ? 
                    "text-purple" : 
                    "text-foreground/80 dark:text-white-85"
                )}
                aria-current={pathname.startsWith(item.href) ? "page" : undefined}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Theme Toggle & Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {renderThemeChanger()}

            {isAuthenticated ? (
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  className="mr-2 text-foreground/80 dark:text-white-85 hover:text-foreground dark:hover:text-white"
                  asChild
                >
                  <Link href="/dashboard">Dashboard</Link>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="bg-background/50"
                      aria-label="User menu"
                    >
                      <User className="h-4 w-4 mr-2" aria-hidden="true" />
                      <span className="max-w-[100px] truncate">{user?.name}</span>
                      <ChevronDown className="h-4 w-4 ml-2" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-background border-purple-10 dark:border-purple-30">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings">Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={logout} 
                      className="text-purple-secondary cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="text-foreground/80 dark:text-white-85 hover:text-foreground dark:hover:text-white"
                  asChild
                >
                  <Link href="/auth/login">Login</Link>
                </Button>
                <Button className="bg-purple text-white hover:bg-opacity-90" asChild>
                  <Link href="/request-demo">Request Demo</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {renderThemeChanger()}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 text-foreground dark:text-white" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6 text-foreground dark:text-white" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div 
        id="mobile-menu"
        className={cn(
          "md:hidden bg-white dark:bg-dark-card border-t border-purple-10 dark:border-purple-30 transition-all duration-300 overflow-hidden",
          isMobileMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "block px-3 py-2 rounded-md text-base font-medium",
                pathname.startsWith(item.href)
                  ? "text-purple bg-purple-bg-5 dark:bg-purple-bg-10"
                  : "text-foreground/80 dark:text-white-85 hover:bg-purple-bg-5 dark:hover:bg-purple-bg-10 hover:text-foreground dark:hover:text-white"
              )}
              onClick={toggleMobileMenu}
              onKeyDown={(e) => handleNavItemKeyDown(e, item.href)}
              tabIndex={isMobileMenuOpen ? 0 : -1}
              aria-current={pathname.startsWith(item.href) ? "page" : undefined}
            >
              {item.name}
            </Link>
          ))}

          {isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                className="block px-3 py-2 rounded-md text-base font-medium text-foreground/80 dark:text-white-85 hover:bg-purple-bg-5 dark:hover:bg-purple-bg-10 hover:text-foreground dark:hover:text-white"
                onClick={toggleMobileMenu}
                tabIndex={isMobileMenuOpen ? 0 : -1}
              >
                Dashboard
              </Link>
              <button
                className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-purple-secondary hover:bg-purple-bg-5 dark:hover:bg-purple-bg-10"
                onClick={() => {
                  logout()
                  toggleMobileMenu()
                }}
                tabIndex={isMobileMenuOpen ? 0 : -1}
              >
                <LogOut className="h-4 w-4 mr-2 inline-block" aria-hidden="true" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="block px-3 py-2 rounded-md text-base font-medium text-foreground/80 dark:text-white-85 hover:bg-purple-bg-5 dark:hover:bg-purple-bg-10 hover:text-foreground dark:hover:text-white"
                onClick={toggleMobileMenu}
                tabIndex={isMobileMenuOpen ? 0 : -1}
              >
                Login
              </Link>
              <Link
                href="/request-demo"
                className="block px-3 py-2 rounded-md text-base font-medium bg-purple text-white hover:bg-opacity-90"
                onClick={toggleMobileMenu}
                tabIndex={isMobileMenuOpen ? 0 : -1}
              >
                Request Demo
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

