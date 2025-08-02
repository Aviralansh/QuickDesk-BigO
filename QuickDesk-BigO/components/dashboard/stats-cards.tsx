"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Ticket, Clock, CheckCircle, TrendingUp } from "lucide-react"

interface StatsCardsProps {
  stats: {
    ticket_counts: {
      total: number
      open: number
      in_progress: number
      resolved: number
      closed: number
    }
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Tickets",
      value: stats.ticket_counts.total,
      icon: Ticket,
      color: "text-blue-600",
    },
    {
      title: "Open Tickets",
      value: stats.ticket_counts.open,
      icon: Clock,
      color: "text-orange-600",
    },
    {
      title: "In Progress",
      value: stats.ticket_counts.in_progress,
      icon: TrendingUp,
      color: "text-blue-600",
    },
    {
      title: "Resolved",
      value: stats.ticket_counts.resolved,
      icon: CheckCircle,
      color: "text-green-600",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
