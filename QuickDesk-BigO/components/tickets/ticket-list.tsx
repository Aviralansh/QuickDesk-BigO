"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ApiService } from "@/lib/api-service"
import { useAuth } from "@/lib/auth-context"
import { Search, Filter, ArrowUp, ArrowDown, MessageSquare } from "lucide-react"
import Link from "next/link"

interface Ticket {
  id: number
  subject: string
  description: string
  status: string
  priority: string
  created_at: string
  updated_at: string
  creator_name: string
  assignee_name?: string
  category_name: string
  upvotes: number
  downvotes: number
  comment_count: number
}

interface TicketListProps {
  showFilters?: boolean
  limit?: number
}

export function TicketList({ showFilters = true, limit }: TicketListProps) {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("updated_at")
  const [sortOrder, setSortOrder] = useState("desc")
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    fetchTickets()
    fetchCategories()
  }, [search, statusFilter, sortBy, sortOrder])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const params: any = {
        search,
        sort_by: sortBy,
        sort_order: sortOrder,
      }

      if (statusFilter !== "all") params.status = statusFilter
      if (limit) params.limit = limit

      const response = await ApiService.getTickets(params)
      setTickets(response.tickets || [])
    } catch (error) {
      console.error("Failed to fetch tickets:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await ApiService.getCategories()
      setCategories(response.categories || [])
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "resolved":
        return "bg-green-100 text-green-800"
      case "closed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading && tickets.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated_at">Last Updated</SelectItem>
                  <SelectItem value="created_at">Created Date</SelectItem>
                  <SelectItem value="votes">Vote Score</SelectItem>
                  <SelectItem value="replies">Most Replies</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descending</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {tickets.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No tickets found.</p>
            </CardContent>
          </Card>
        ) : (
          tickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">#{ticket.id}</Badge>
                      <Badge className={getStatusColor(ticket.status)}>{ticket.status.replace("_", " ")}</Badge>
                      <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                      <Badge variant="outline">{ticket.category_name}</Badge>
                    </div>

                    <Link href={`/tickets/${ticket.id}`}>
                      <h3 className="font-semibold text-lg hover:text-blue-600 cursor-pointer mb-2">
                        {ticket.subject}
                      </h3>
                    </Link>

                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{ticket.description}</p>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span>Created by {ticket.creator_name}</span>
                        {ticket.assignee_name && <span>Assigned to {ticket.assignee_name}</span>}
                        <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <ArrowUp className="h-4 w-4 text-green-600" />
                          <span>{ticket.upvotes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ArrowDown className="h-4 w-4 text-red-600" />
                          <span>{ticket.downvotes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>{ticket.comment_count}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
