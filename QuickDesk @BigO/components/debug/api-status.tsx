"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ApiService } from "@/lib/api-service"
import { RefreshCw, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

export function ApiStatus() {
  const [status, setStatus] = useState<"checking" | "connected" | "error">("checking")
  const [error, setError] = useState<string>("")
  const [apiInfo, setApiInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkApiStatus = async () => {
    setLoading(true)
    setStatus("checking")
    setError("")

    try {
      // Test basic connection
      const isConnected = await ApiService.testConnection()

      if (isConnected) {
        setStatus("connected")

        // Try to get additional API info
        try {
          const dbInfo = await ApiService.getDatabaseInfo()
          setApiInfo(dbInfo)
        } catch (dbError) {
          console.log("Database info not available:", dbError)
        }
      } else {
        setStatus("error")
        setError("API health check failed")
      }
    } catch (err: any) {
      setStatus("error")
      setError(err.message || "Failed to connect to API")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkApiStatus()
  }, [])

  const getStatusIcon = () => {
    switch (status) {
      case "connected":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case "error":
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case "connected":
        return "bg-green-100 text-green-800"
      case "error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>API Status</span>
          <Button variant="outline" size="sm" onClick={checkApiStatus} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Connection Status:</span>
              <Badge className={getStatusColor()}>
                {status === "checking" ? "Checking..." : status === "connected" ? "Connected" : "Error"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">API URL: https://aviralansh-quickdesk.hf.space/api</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {status === "connected" && apiInfo && (
          <div className="space-y-2 text-sm">
            <h4 className="font-medium">Database Information:</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span>Type:</span>
              <span>{apiInfo.database_info?.type || "Unknown"}</span>
              <span>Status:</span>
              <span className="text-green-600">Connected</span>
              {apiInfo.database_info?.size && (
                <>
                  <span>Size:</span>
                  <span>{Math.round(apiInfo.database_info.size / 1024)} KB</span>
                </>
              )}
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-2">
            <h4 className="font-medium text-red-600">Troubleshooting Steps:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>1. Check if the Hugging Face Space is running</li>
              <li>2. Verify the Space URL is correct</li>
              <li>3. Check Space logs for errors</li>
              <li>4. Ensure Docker container started successfully</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
