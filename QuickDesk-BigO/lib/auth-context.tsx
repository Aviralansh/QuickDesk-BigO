"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { ApiService } from "./api-service"

interface User {
  id: number
  username: string
  email: string
  full_name: string
  role: "end_user" | "support_agent" | "admin"
  is_active: boolean
  created_at: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored auth data
    const storedToken = localStorage.getItem("quickdesk_token")
    const storedUser = localStorage.getItem("quickdesk_user")

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
      ApiService.setToken(storedToken)
    }
    setLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    const response = await ApiService.login(username, password)
    setUser(response.user)
    setToken(response.token)

    localStorage.setItem("quickdesk_token", response.token)
    localStorage.setItem("quickdesk_user", JSON.stringify(response.user))
    ApiService.setToken(response.token)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem("quickdesk_token")
    localStorage.removeItem("quickdesk_user")
    ApiService.setToken(null)
  }

  return <AuthContext.Provider value={{ user, token, login, logout, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
