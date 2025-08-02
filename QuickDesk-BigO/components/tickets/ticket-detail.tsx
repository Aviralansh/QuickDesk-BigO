"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ApiService } from "@/lib/api-service"
import { useAuth } from "@/lib/auth-context"
import { ArrowUp, ArrowDown, MessageSquare, Paperclip, User, Calendar, ArrowLeft, Send, Loader2 } from "lucide-react"

interface TicketDetailProps {
  ticketId: number
}

interface Ticket {
  id: number
  subject: string
  description: string
  status: string
  priority: string
  created_at: string
  updated_at: string
  creator: any
  assignee: any
  category: any
  comments: any[]
  attachments: any[]
  upvotes: number
  downvotes: number
  vote_score: number
}

export function TicketDetail({ ticketId }: TicketDetailProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [newComment, setNewComment] = useState("")
  const [commentLoading, setCommentLoading] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [voteLoading, setVoteLoading] = useState(false)

  useEffect(() => {
    fetchTicket()
  }, [ticketId])

  const fetchTicket = async () => {
    try {
      setLoading(true)
      const response = await ApiService.getTicket(ticketId)
      setTicket(response.ticket)
    } catch (error: any) {
      setError(error.message || "Failed to load ticket")
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return

    try {
      setStatusLoading(true)
      await ApiService.updateTicketStatus(ticket.id, newStatus)
      await fetchTicket() // Refresh ticket data
    } catch (error: any) {
      setError(error.message || "Failed to update status")
    } finally {
      setStatusLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !ticket) return

    try {
      setCommentLoading(true)
      await ApiService.addComment(ticket.id, newComment)
      setNewComment("")
      await fetchTicket() // Refresh to show new comment
    } catch (error: any) {
      setError(error.message || "Failed to add comment")
    } finally {
      setCommentLoading(false)
    }
  }

  const handleVote = async (isUpvote: boolean) => {
    if (!ticket) return

    try {
      setVoteLoading(true)
      await ApiService.voteTicket(ticket.id, isUpvote)
      await fetchTicket() // Refresh to show updated votes
    } catch (error: any) {
      setError(error.message || "Failed to vote")
    } finally {
      setVoteLoading(false)
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

  const canUpdateStatus = () => {
    return user?.role === "support_agent" || user?.role === "admin"
  }

  const canComment = () => {
    return user?.role === "support_agent" || user?.role === "admin" || ticket?.creator?.id === user?.id
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertDescription>{error || "Ticket not found"}</AlertDescription>
          </Alert>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tickets
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleVote(true)}
            disabled={voteLoading}
            className="flex items-center gap-1"
          >
            <ArrowUp className="w-4 h-4 text-green-600" />
            {ticket.upvotes}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleVote(false)}
            disabled={voteLoading}
            className="flex items-center gap-1"
          >
            <ArrowDown className="w-4 h-4 text-red-600" />
            {ticket.downvotes}
          </Button>
        </div>
      </div>

      {/* Ticket Details */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">#{ticket.id}</Badge>
                <Badge className={getStatusColor(ticket.status)}>{ticket.status.replace("_", " ")}</Badge>
                <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                {ticket.category && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ticket.category.color }} />
                    {ticket.category.name}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl">{ticket.subject}</CardTitle>
            </div>

            {canUpdateStatus() && (
              <Select value={ticket.status} onValueChange={handleStatusChange} disabled={statusLoading}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{ticket.description}</p>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                Created by {ticket.creator?.full_name || "Unknown"}
              </div>
              {ticket.assignee && (
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  Assigned to {ticket.assignee.full_name}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(ticket.created_at).toLocaleString()}
              </div>
            </div>

            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  Attachments
                </h4>
                <div className="space-y-1">
                  {ticket.attachments.map((attachment: any) => (
                    <div key={attachment.id} className="flex items-center gap-2 text-sm">
                      <Paperclip className="w-3 h-3" />
                      <span>{attachment.original_filename}</span>
                      <span className="text-muted-foreground">({Math.round(attachment.file_size / 1024)}KB)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Comments ({ticket.comments?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ticket.comments && ticket.comments.length > 0 ? (
              ticket.comments.map((comment: any) => (
                <div key={comment.id} className="border-l-2 border-gray-200 pl-4 py-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">{comment.author_name}</span>
                    <Badge variant="outline" className="text-xs">
                      {comment.author_role?.replace("_", " ")}
                    </Badge>
                    {comment.is_internal && (
                      <Badge variant="secondary" className="text-xs">
                        Internal
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{comment.content}</p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No comments yet</p>
            )}

            {canComment() && (
              <div className="border-t pt-4 space-y-3">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <Button
                  onClick={handleAddComment}
                  disabled={commentLoading || !newComment.trim()}
                  className="flex items-center gap-2"
                >
                  {commentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Add Comment
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
