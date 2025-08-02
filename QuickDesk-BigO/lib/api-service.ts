const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://aviralansh-quickdesk.hf.space/api"

interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

class ApiServiceClass {
  private token: string | null = null

  setToken(token: string | null) {
    this.token = token
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`

    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
    }

    try {
      console.log(`Making request to: ${url}`)
      const response = await fetch(url, config)

      if (!response.ok) {
        // Handle different HTTP status codes
        if (response.status === 404) {
          throw new Error(`API endpoint not found: ${url}`)
        } else if (response.status === 500) {
          throw new Error("Server error. Please try again later.")
        } else if (response.status === 403) {
          throw new Error("Access denied. Please check your permissions.")
        } else if (response.status === 401) {
          throw new Error("Authentication failed. Please login again.")
        }
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      return data
    } catch (error: any) {
      console.error(`API Request failed for ${url}:`, error)

      // Handle network errors
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        throw new Error("Network error. Please check your internet connection and try again.")
      }

      throw error
    }
  }

  // Test API connection
  async testConnection(): Promise<boolean> {
    try {
      await this.request("/health")
      return true
    } catch (error) {
      console.error("API connection test failed:", error)
      return false
    }
  }

  // Auth endpoints
  async login(username: string, password: string) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    })
  }

  async register(userData: any) {
    const response = await this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })

    if (response.error) {
      throw new Error(response.error)
    }

    return response
  }

  async getCurrentUser() {
    return this.request("/auth/me")
  }

  // Ticket endpoints
  async getTickets(params: any = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/tickets?${query}`)
  }

  async getTicket(id: number) {
    return this.request(`/tickets/${id}`)
  }

  async createTicket(ticketData: any) {
    return this.request("/tickets", {
      method: "POST",
      body: JSON.stringify(ticketData),
    })
  }

  async updateTicketStatus(id: number, status: string) {
    return this.request(`/tickets/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    })
  }

  async assignTicket(id: number, assigned_to_id: number | null) {
    return this.request(`/tickets/${id}/assign`, {
      method: "PUT",
      body: JSON.stringify({ assigned_to_id }),
    })
  }

  async addComment(ticketId: number, content: string, is_internal = false) {
    return this.request(`/tickets/${ticketId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content, is_internal }),
    })
  }

  async voteTicket(ticketId: number, is_upvote: boolean) {
    return this.request(`/tickets/${ticketId}/vote`, {
      method: "POST",
      body: JSON.stringify({ is_upvote }),
    })
  }

  // Categories
  async getCategories() {
    return this.request("/categories")
  }

  async createCategory(categoryData: any) {
    return this.request("/categories", {
      method: "POST",
      body: JSON.stringify(categoryData),
    })
  }

  // Users (admin only)
  async getUsers(params: any = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/users?${query}`)
  }

  // Dashboard
  async getDashboard() {
    return this.request("/dashboard")
  }

  // Notifications
  async getNotifications(params: any = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/notifications?${query}`)
  }

  async markNotificationRead(id: number) {
    return this.request(`/notifications/${id}/read`, {
      method: "PUT",
    })
  }

  // File upload
  async uploadAttachment(ticketId: number, file: File) {
    const formData = new FormData()
    formData.append("file", file)

    return this.request(`/tickets/${ticketId}/attachments`, {
      method: "POST",
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    })
  }

  // Database info (for debugging)
  async getDatabaseInfo() {
    return this.request("/database/info")
  }
}

export const ApiService = new ApiServiceClass()
