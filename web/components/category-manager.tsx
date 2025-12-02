'use client'

import { useState, useEffect } from 'react'
import { apiClient, CategoryWithType, CreateCategoryData, UpdateCategoryData } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2, Plus, Edit, Trash2, AlertCircle, Tag } from 'lucide-react'
import { IconPicker } from '@/components/ui/icon-picker'

interface CategoryManagerProps {
  onCategoryChange?: () => void
}

export function CategoryManager({ onCategoryChange }: CategoryManagerProps) {
  const [categories, setCategories] = useState<CategoryWithType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Create/Edit dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryWithType | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [categoryColor, setCategoryColor] = useState('#3B82F6')
  const [categoryIcon, setCategoryIcon] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryWithType | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await apiClient.getCategories()
      setCategories(data)
    } catch (err: any) {
      console.error('Failed to load categories:', err)
      setError(err.message || 'Failed to load categories')
    } finally {
      setIsLoading(false)
    }
  }

  const openCreateDialog = () => {
    setEditingCategory(null)
    setCategoryName('')
    setCategoryColor('#3B82F6')
    setCategoryIcon('')
    setSaveError(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (category: CategoryWithType) => {
    setEditingCategory(category)
    setCategoryName(category.name)
    setCategoryColor(category.color || '#3B82F6')
    setCategoryIcon(category.icon || '')
    setSaveError(null)
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!categoryName.trim()) {
      setSaveError('Category name is required')
      return
    }

    try {
      setIsSaving(true)
      setSaveError(null)

      const data: CreateCategoryData | UpdateCategoryData = {
        name: categoryName.trim(),
        color: categoryColor,
        icon: categoryIcon.trim() || undefined,
      }

      if (editingCategory) {
        await apiClient.updateCategory(editingCategory.id, data)
      } else {
        await apiClient.createCategory(data as CreateCategoryData)
      }

      await loadCategories()
      setIsDialogOpen(false)
      
      if (onCategoryChange) {
        onCategoryChange()
      }
    } catch (err: any) {
      console.error('Failed to save category:', err)
      setSaveError(err.message || 'Failed to save category')
    } finally {
      setIsSaving(false)
    }
  }

  const openDeleteDialog = (category: CategoryWithType) => {
    setCategoryToDelete(category)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!categoryToDelete) return

    try {
      setIsDeleting(true)
      const result = await apiClient.deleteCategory(categoryToDelete.id)
      
      await loadCategories()
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
      
      if (onCategoryChange) {
        onCategoryChange()
      }

      if (result.goalsAffected > 0) {
        alert(`Category deleted. ${result.goalsAffected} goal(s) were moved to "Other" category.`)
      }
    } catch (err: any) {
      console.error('Failed to delete category:', err)
      alert(err.message || 'Failed to delete category')
    } finally {
      setIsDeleting(false)
    }
  }

  const customCategories = categories.filter(c => !c.is_default)

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Custom Categories
            </CardTitle>
            <CardDescription className="mt-1">
              Create and manage your own goal categories
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Category
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {customCategories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Tag className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No custom categories yet</p>
            <p className="text-sm mt-1">Create your first custom category to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {customCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color || '#3B82F6' }}
                  />
                  <span className="font-medium">{category.name}</span>
                  {category.icon && (
                    <span className="text-lg">{category.icon}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDeleteDialog(category)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? 'Update your custom category details'
                  : 'Add a new custom category for your goals'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {saveError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{saveError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="category-name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="category-name"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g., Travel, Hobbies, Family"
                  maxLength={50}
                  disabled={isSaving}
                />
                <p className="text-xs text-gray-500">{categoryName.length}/50 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="category-color"
                    type="color"
                    value={categoryColor}
                    onChange={(e) => setCategoryColor(e.target.value)}
                    className="w-20 h-10"
                    disabled={isSaving}
                  />
                  <Input
                    value={categoryColor}
                    onChange={(e) => setCategoryColor(e.target.value)}
                    placeholder="#3B82F6"
                    className="flex-1"
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Icon (optional)</Label>
                <IconPicker
                  value={categoryIcon}
                  onChange={setCategoryIcon}
                  disabled={isSaving}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>{editingCategory ? 'Update' : 'Create'}</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Category</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{categoryToDelete?.name}"? Any goals using this
                category will be moved to "Other".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
