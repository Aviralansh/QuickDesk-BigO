"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ApiService } from "@/lib/api-service"
import { Plus, Edit } from "lucide-react"

interface Category {
  id: number
  name: string
  description: string
  color: string
  is_active: boolean
}

export function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#007bff",
  })
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await ApiService.getCategories()
      setCategories(response.categories || [])
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = async () => {
    if (!formData.name.trim()) {
      setError("Category name is required")
      return
    }

    try {
      setFormLoading(true)
      setError("")
      await ApiService.createCategory(formData)
      setDialogOpen(false)
      setFormData({ name: "", description: "", color: "#007bff" })
      await fetchCategories()
    } catch (error: any) {
      setError(error.message || "Failed to create category")
    } finally {
      setFormLoading(false)
    }
  }

  const openCreateDialog = () => {
    setEditingCategory(null)
    setFormData({ name: "", description: "", color: "#007bff" })
    setError("")
    setDialogOpen(true)
  }

  const predefinedColors = [
    "#007bff",
    "#28a745",
    "#dc3545",
    "#ffc107",
    "#fd7e14",
    "#6f42c1",
    "#e83e8c",
    "#20c997",
    "#6c757d",
    "#343a40",
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Category Management</span>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCategory ? "Edit Category" : "Create New Category"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Category name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Category description"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                        className="w-12 h-8 rounded border"
                      />
                      <div className="flex gap-1">
                        {predefinedColors.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className="w-6 h-6 rounded border-2 border-gray-300 hover:border-gray-500"
                            style={{ backgroundColor: color }}
                            onClick={() => setFormData((prev) => ({ ...prev, color }))}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={handleCreateCategory} disabled={formLoading} className="flex-1">
                      {formLoading ? "Creating..." : "Create Category"}
                    </Button>
                    <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={formLoading}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Categories List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No categories found</div>
          ) : (
            <div className="divide-y">
              {categories.map((category) => (
                <div key={category.id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: category.color }} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{category.name}</h3>
                        {!category.is_active && <Badge variant="secondary">Inactive</Badge>}
                      </div>
                      {category.description && <p className="text-sm text-muted-foreground">{category.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant={category.is_active ? "destructive" : "default"} size="sm">
                      {category.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
