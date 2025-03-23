"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Shield, Twitter, Linkedin, Github, Mail } from "lucide-react"
import { cn } from "@/lib/utils"

interface FooterLink {
  label: string
  href: string
  external?: boolean
}

interface SocialLink {
  label: string
  href: string
  icon: React.ReactNode
}

export function Footer() {
  const pathname = usePathname()

  // Don't render footer on dashboard routes
  if (pathname?.startsWith("/dashboard")) {
    return null
  }

  const solutionsLinks: FooterLink[] = [
    { label: "Threat Intelligence", href: "/solutions/threat-intelligence" },
    { label: "Brand Protection", href: "/solutions/brand-protection" },
    { label: "Dark Web Monitoring", href: "/solutions/dark-web-monitoring" },
    { label: "Attack Surface Management", href: "/solutions/attack-surface-management" },
  ]

  const companyLinks: FooterLink[] = [
    { label: "About Us", href: "/company/about-us" },
    { label: "Careers", href: "/company/careers" },
    { label: "Blog", href: "/company/blog" },
    { label: "Press", href: "/company/press" },
    { label: "Contact", href: "/company/contact" },
  ]

  const socialLinks: SocialLink[] = [
    { label: "Twitter", href: "https://twitter.com/haktraknetworks", icon: <Twitter className="h-5 w-5" aria-hidden="true" /> },
    { label: "LinkedIn", href: "https://linkedin.com/company/haktraknetworks", icon: <Linkedin className="h-5 w-5" aria-hidden="true" /> },
    { label: "GitHub", href: "https://github.com/haktraknetworks", icon: <Github className="h-5 w-5" aria-hidden="true" /> },
  ]

  const renderFooterLinkSection = (title: string, links: FooterLink[]) => (
    <div>
      <h3 className="text-sm font-semibold text-foreground dark:text-white tracking-wider uppercase mb-4">
        {title}
      </h3>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            {link.external ? (
              <a
                href={link.href}
                className="text-sm text-foreground/80 dark:text-white-45 hover:text-purple dark:hover:text-purple transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label}
              </a>
            ) : (
              <Link
                href={link.href}
                className="text-sm text-foreground/80 dark:text-white-45 hover:text-purple dark:hover:text-purple transition-colors"
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )

  return (
    <footer className="bg-white dark:bg-dark-bg" role="contentinfo" aria-label="Site footer">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-purple" aria-hidden="true" />
              <div className="flex flex-col">
                <span className="font-bold text-lg text-purple">Haktrak Networks</span>
                <p className="text-gray-600 dark:text-white-85 mt-2 max-w-sm">
                  Protecting your digital assets with state-of-the-art security solutions tailored for modern enterprises.
                </p>
              </div>
            </div>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="text-foreground/60 dark:text-white-45 hover:text-purple dark:hover:text-purple transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Solutions */}
          {renderFooterLinkSection("Solutions", solutionsLinks)}

          {/* Company */}
          {renderFooterLinkSection("Company", companyLinks)}

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-foreground dark:text-white tracking-wider uppercase mb-4">
              Contact Us
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <Mail className="h-5 w-5 text-foreground/60 dark:text-white-45 mr-2 mt-0.5" aria-hidden="true" />
                <a 
                  href="mailto:info@haktrak-networks.com" 
                  className="text-sm text-foreground/80 dark:text-white-45 hover:text-purple dark:hover:text-purple transition-colors"
                >
                  info@haktrak-networks.com
                </a>
              </li>
              <li>
                <Link
                  href="/request-demo"
                  className={cn(
                    "inline-flex items-center px-4 py-2 border border-purple text-sm font-medium rounded-md",
                    "text-purple hover:bg-purple hover:text-white transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple"
                  )}
                >
                  Request a Demo
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border dark:border-border-dark">
          <p className="text-center text-xs text-foreground/60 dark:text-white-45">
            &copy; {new Date().getFullYear()} Haktrak Networks. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

