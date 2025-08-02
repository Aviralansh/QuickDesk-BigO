"use client"

import { Navbar } from "@/components/layout/navbar"
import { ApiStatus } from "@/components/debug/api-status"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Debug & Diagnostics</h1>
          <p className="text-muted-foreground mt-1">Check API connection and troubleshoot issues</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ApiStatus />

          <Card>
            <CardHeader>
              <CardTitle>Backend Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Hugging Face Space</span>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://huggingface.co/spaces/aviralansh/quickdesk"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open
                  </a>
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <span>API Health Check</span>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://aviralansh-quickdesk.hf.space/api/health" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Test
                  </a>
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <span>Database Info</span>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://aviralansh-quickdesk.hf.space/api/database/info"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Check
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Common Issues & Solutions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-red-600">❌ "Not Found" Error</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    The API endpoints are not accessible. This usually means:
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 ml-4 space-y-1">
                    <li>• The Hugging Face Space is not running</li>
                    <li>• Docker container failed to start</li>
                    <li>• Flask app is not properly configured</li>
                    <li>• Port 7860 is not exposed correctly</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-yellow-600">⚠️ Space Not Building</h4>
                  <p className="text-sm text-muted-foreground mt-1">Check your Hugging Face Space for build errors:</p>
                  <ul className="text-sm text-muted-foreground mt-2 ml-4 space-y-1">
                    <li>• Missing requirements.txt</li>
                    <li>• Dockerfile syntax errors</li>
                    <li>• Python import errors</li>
                    <li>• Missing environment variables</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-green-600">✅ Quick Fix Steps</h4>
                  <ol className="text-sm text-muted-foreground mt-2 ml-4 space-y-1">
                    <li>1. Go to your Hugging Face Space settings</li>
                    <li>2. Check the "Logs" tab for error messages</li>
                    <li>3. Ensure all backend files are uploaded</li>
                    <li>4. Restart the Space if needed</li>
                    <li>5. Wait for the container to fully start (can take 2-3 minutes)</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
