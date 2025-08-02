"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Navbar } from "@/components/layout/navbar"
import { TicketDetail } from "@/components/tickets/ticket-detail"

export default function TicketDetailPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const ticketId = params.id as string

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <TicketDetail ticketId={Number.parseInt(ticketId)} />
      </main>
    </div>
  )
}
