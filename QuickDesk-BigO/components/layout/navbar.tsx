"use client"

import { Bell, LogOut, User, Settings, Home, Ticket } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { useState, useEffect } from "react"
import { ApiService } from "@/lib/api-service"

interface Notification {
  id: number
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export function Navbar() {
  const { user, logout } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (user) {
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 30000) // Poll every 30s
      return () => clearInterval(interval)
    }
  }, [user])

  const fetchNotifications = async () => {
    try {
      const response = await ApiService.getNotifications({ limit: 10 })
      setNotifications(response.notifications || [])
      setUnreadCount(response.notifications?.filter((n: Notification) => !n.is_read).length || 0)
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    }
  }

  const handleNotificationClick = async (notificationId: number) => {
    try {
      await ApiService.markNotificationRead(notificationId)
      fetchNotifications()
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "end_user":
        return "User"
      case "support_agent":
        return "Agent"
      case "admin":
        return "Admin"
      default:
        return "User"
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-500"
      case "support_agent":
        return "bg-blue-500"
      default:
        return "bg-green-500"
    }
  }

  const getNavigationItems = () => {
    if (!user) return []

    const baseItems = [
      {
        href: "/dashboard",
        icon: Home,
        label: "Dashboard",
        show: true,
      },
    ]

    // Role-specific navigation
    switch (user.role) {
      case "end_user":
        return [
          ...baseItems,
          {
            href: "/tickets",
            icon: Ticket,
            label: "My Tickets",
            show: true,
          },
          {
            href: "/tickets/create",
            icon: Ticket,
            label: "Create Ticket",
            show: true,
            highlight: true,
          },
        ]

      case "support_agent":
        return [
          ...baseItems,
          {
            href: "/tickets",
            icon: Ticket,
            label: "All Tickets",
            show: true,
          },
        ]

      case "admin":
        return [
          ...baseItems,
          {
            href: "/tickets",
            icon: Ticket,
            label: "All Tickets",
            show: true,
          },
          {
            href: "/admin",
            icon: Settings,
            label: "Admin Panel",
            show: true,
          },
        ]

      default:
        return baseItems
    }
  }

  const navigationItems = getNavigationItems()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">QD</span>
            </div>
            <span className="font-bold text-xl">QuickDesk</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-2">
            {navigationItems.map(
              (item) =>
                item.show && (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={item.highlight ? "default" : "ghost"}
                      size="sm"
                      className={item.highlight ? "bg-blue-600 hover:bg-blue-700" : ""}
                    >
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Button>
                  </Link>
                ),
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground text-center">No notifications</div>
              ) : (
                notifications.slice(0, 5).map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`flex flex-col items-start p-3 cursor-pointer ${
                      !notification.is_read ? "bg-blue-50" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <div className="font-medium text-sm">{notification.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{notification.message}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{user?.full_name}</span>
                  <Badge className={`text-xs ${getRoleColor(user?.role || "")}`}>
                    {getRoleDisplayName(user?.role || "")}
                  </Badge>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Role-specific menu items */}
              {user?.role === "end_user" && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/tickets/create" className="flex items-center">
                      <Ticket className="mr-2 h-4 w-4" />
                      <span>Create Ticket</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/tickets" className="flex items-center">
                      <Ticket className="mr-2 h-4 w-4" />
                      <span>My Tickets</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              {user?.role === "support_agent" && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/tickets" className="flex items-center">
                      <Ticket className="mr-2 h-4 w-4" />
                      <span>All Tickets</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              {user?.role === "admin" && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Admin Panel</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/tickets" className="flex items-center">
                      <Ticket className="mr-2 h-4 w-4" />
                      <span>All Tickets</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              <DropdownMenuItem onClick={() => logout()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
