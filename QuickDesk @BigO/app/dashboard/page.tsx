"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Navbar } from "@/components/layout/navbar"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { TicketList } from "@/components/tickets/ticket-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ApiService } from "@/lib/api-service"
import { Plus, Settings, Ticket } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user, loading, router])

  const fetchDashboardData = async () => {
    try {
      const response = await ApiService.getDashboard()
      setDashboardData(response)
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setLoadingData(false)
    }
  }

  const getRoleSpecificActions = () => {
    if (!user) return []

    switch (user.role) {
      case "end_user":
        return [
          {
            href: "/tickets/create",
            icon: Plus,
            label: "Create New Ticket",
            description: "Report an issue or request help",
            color: "bg-blue-600 hover:bg-blue-700",
          },
          {
            href: "/tickets",
            icon: Ticket,
            label: "View My Tickets",
            description: "Check status of your tickets",
            color: "bg-green-600 hover:bg-green-700",
          },
        ]

      case "support_agent":
        return [
          {
            href: "/tickets?status=open",
            icon: Ticket,
            label: "Open Tickets",
            description: "View and respond to open tickets",
            color: "bg-orange-600 hover:bg-orange-700",
          },
          {
            href: "/tickets?status=in_progress",
            icon: Ticket,
            label: "My Assigned Tickets",
            description: "Tickets assigned to you",
            color: "bg-blue-600 hover:bg-blue-700",
          },
        ]

      case "admin":
        return [
          {
            href: "/admin",
            icon: Settings,
            label: "Admin Panel",
            description: "Manage system settings",
            color: "bg-purple-600 hover:bg-purple-700",
          },
          {
            href: "/tickets",
            icon: Ticket,
            label: "All Tickets",
            description: "Overview of all tickets",
            color: "bg-blue-600 hover:bg-blue-700",
          },
        ]

      default:
        return []
    }
  }

  const getWelcomeMessage = () => {
    if (!user) return "Welcome!"

    switch (user.role) {
      case "end_user":
        return `Welcome back, ${user.full_name}!`
      case "support_agent":
        return `Welcome back, Agent ${user.full_name}!`
      case "admin":
        return `Welcome back, Admin ${user.full_name}!`
      default:
        return `Welcome back, ${user.full_name}!`
    }
  }

  const getSubtitle = () => {
    if (!user) return ""

    switch (user.role) {
      case "end_user":
        return "Here's an overview of your support tickets and their current status."
      case "support_agent":
        return "Here are the tickets that need your attention today."
      case "admin":
        return "Here's your system overview and key metrics."
      default:
        return "Here's what's happening with your tickets today."
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const roleActions = getRoleSpecificActions()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{getWelcomeMessage()}</h1>
            <p className="text-muted-foreground mt-1">{getSubtitle()}</p>
          </div>
        </div>

        {/* Role-specific action cards */}
        {roleActions.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {roleActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${action.color}`}>
                        <action.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{action.label}</h3>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : dashboardData ? (
          <div className="space-y-8">
            <StatsCards stats={dashboardData} />

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{user.role === "end_user" ? "My Recent Tickets" : "Recent Tickets"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <TicketList showFilters={false} limit={5} />
                </CardContent>
              </Card>

              {dashboardData.category_distribution && (
                <Card>
                  <CardHeader>
                    <CardTitle>Tickets by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardData.category_distribution.map((item: any) => (
                        <div key={item.category} className="flex items-center justify-between">
                          <span className="text-sm">{item.category}</span>
                          <span className="font-medium">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Admin-specific additional stats */}
            {user.role === "admin" && dashboardData.top_voted_tickets && (
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Voted Tickets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboardData.top_voted_tickets.slice(0, 5).map((ticket: any) => (
                        <div key={ticket.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <p className="font-medium">
                              #{ticket.id} {ticket.subject}
                            </p>
                            <p className="text-sm text-muted-foreground">by {ticket.creator_name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">Score: {ticket.vote_score}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {dashboardData.most_active_users && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Most Active Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {dashboardData.most_active_users.slice(0, 5).map((user: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded">
                            <span className="font-medium">{user.user}</span>
                            <span className="text-sm text-muted-foreground">{user.ticket_count} tickets</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Failed to load dashboard data</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
