"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserManagement } from "./user-management"
import { CategoryManagement } from "./category-management"
import { SystemStats } from "./system-stats"
import { Users, FolderOpen, BarChart3 } from "lucide-react"

export function AdminDashboard() {
  return (
    <Tabs defaultValue="stats" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="stats" className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          System Stats
        </TabsTrigger>
        <TabsTrigger value="users" className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          User Management
        </TabsTrigger>
        <TabsTrigger value="categories" className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4" />
          Categories
        </TabsTrigger>
      </TabsList>

      <TabsContent value="stats">
        <SystemStats />
      </TabsContent>

      <TabsContent value="users">
        <UserManagement />
      </TabsContent>

      <TabsContent value="categories">
        <CategoryManagement />
      </TabsContent>
    </Tabs>
  )
}
