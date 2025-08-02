"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ApiService } from "@/lib/api-service"
import { StatsCards } from "@/components/dashboard/stats-cards"

export function SystemStats() {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await ApiService.getDashboard()
      setDashboardData(response)
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {dashboardData && (
        <>
          <StatsCards stats={dashboardData} />

          <div className="grid gap-6 lg:grid-cols-2">
            {dashboardData.top_voted_tickets && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Voted Tickets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboardData.top_voted_tickets.map((ticket: any) => (
                      <div key={ticket.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">
                            #{ticket.id} {ticket.subject}
                          </p>
                          <p className="text-sm text-muted-foreground">by {ticket.creator_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">Score: {ticket.vote_score}</p>
                          <p className="text-sm text-muted-foreground">
                            {ticket.upvotes}↑ {ticket.downvotes}↓
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {dashboardData.most_active_users && (
              <Card>
                <CardHeader>
                  <CardTitle>Most Active Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboardData.most_active_users.map((user: any, index: number) => (
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
        </>
      )}
    </div>
  )
}
