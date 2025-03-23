"use client"

import { useState } from "react"
import { Bell, Search, User, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth/auth-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/dashboard/theme-toggle"

export function DashboardHeader() {
  const { user, logout } = useAuth()
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New threat detected",
      description: "High severity threat detected in your network",
      time: "10 minutes ago",
      read: false,
    },
    {
      id: 2,
      title: "Credential leak",
      description: "Potential credential leak detected on dark web",
      time: "1 hour ago",
      read: false,
    },
  ])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: number) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  return (
    <header className="bg-background py-2 px-4 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center w-1/3">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-8 bg-muted/30 border-border w-full" />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <ThemeToggle />

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-primary border-none">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 bg-card border-border">
              <div className="flex items-center justify-between p-4">
                <h3 className="font-medium">Notifications</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs text-primary hover:text-primary/90"
                >
                  Mark all as read
                </Button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">No notifications</div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-muted/10 cursor-pointer ${!notification.read ? "bg-muted/5" : ""}`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm">
                          {notification.title}
                          {!notification.read && (
                            <span className="ml-2 h-2 w-2 rounded-full bg-primary inline-block"></span>
                          )}
                        </h4>
                        <span className="text-xs text-muted-foreground">{notification.time}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{notification.description}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-center text-xs text-primary hover:text-primary/90"
                >
                  View all notifications
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center">
                  <User className="h-4 w-4 text-foreground" />
                </div>
                <div className="text-sm text-left hidden md:block">
                  <div className="font-medium">{user?.name || "Admin"}</div>
                  <div className="text-xs text-muted-foreground">{user?.role || "Administrator"}</div>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-card border-border">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-destructive" onClick={logout}>
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

