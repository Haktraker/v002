"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Home, Search } from "lucide-react"
import { usePathname } from "next/navigation"

export default function NotFoundPage() {
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const pathname = usePathname()
  
  // Handle path display with appropriate truncation for long paths
  const displayPath = pathname && pathname.length > 40 
    ? pathname.substring(0, 20) + "..." + pathname.substring(pathname.length - 20) 
    : pathname

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Redirect to a search page or homepage with query parameter
    window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
  }

  const isDashboardPath = pathname?.startsWith("/dashboard")

  return (
    <div className="min-h-screen flex flex-col">
      {!isDashboardPath && (
        <PageHeader 
          title="Page Not Found" 
          description="We couldn't find the page you're looking for"
        />
      )}
      
      <div className="flex-grow flex items-center justify-center py-16 px-4">
        <div className="max-w-2xl w-full text-center">
          {isDashboardPath && (
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800 dark:text-white">
              404 - Page Not Found
            </h1>
          )}
          
          <div className="mb-8 p-6 bg-purple/5 dark:bg-purple/10 rounded-lg">
            <p className="text-lg text-gray-600 dark:text-white-85 mb-4">
              The requested URL <span className="font-mono text-purple">{displayPath}</span> could not be found.
            </p>
            
            <p className="text-gray-600 dark:text-white-85">
              The page might have been removed, had its name changed, or is temporarily unavailable.
            </p>
          </div>
          
          <div className="mb-8">
            <form onSubmit={handleSearch} className="flex items-center max-w-md mx-auto">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </div>
                <input
                  type="search"
                  id="search"
                  className="block w-full py-3 pl-10 pr-4 bg-[#F7F7F7] dark:bg-dark-card border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple focus:border-purple text-gray-900 dark:text-white placeholder-gray-400"
                  placeholder="Search for content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="ml-2 dashboard-highlight py-3 px-6">
                Search
              </Button>
            </form>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-4">
            <Button asChild className="flex items-center space-x-2 bg-purple text-white hover:bg-purple/90">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                <span>Return Home</span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="flex items-center space-x-2 border-purple text-purple dark:text-white">
              <Link href={isDashboardPath ? "/dashboard" : "/"}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span>{isDashboardPath ? "Back to Dashboard" : "Go Back"}</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 