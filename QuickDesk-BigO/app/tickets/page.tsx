"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Navbar } from "@/components/layout/navbar"
import { TicketList } from "@/components/tickets/ticket-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function TicketsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">All Tickets</h1>
            <p className="text-muted-foreground mt-1">Manage and track all your support tickets</p>
          </div>

          <Link href="/tickets/create">
            <Button size="lg" className="gap-2">
              <Plus className="w-5 h-5" />
              Create Ticket
            </Button>
          </Link>
        </div>

        <TicketList />
      </main>
    </div>
  )
}
