import { Injectable, NotFoundException, ForbiddenException, Logger, BadRequestException } from '@nestjs/common'
import { FirebaseService } from '@/firebase/firebase.service'
import { CreateCategoryDto, UpdateCategoryDto } from '@/common/dto/category.dto'
import { CustomCategory, DefaultGoalCategory, CategoryWithType } from '@/common/types/category.types'

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name)
  private readonly categoriesCollection = 'custom_categories'
  
  // Default categories that are always available
  private readonly defaultCategories: DefaultGoalCategory[] = [
    'career',
    'health',
    'personal',
    'financial',
    'relationships',
    'learning',
    'other',
  ]

  constructor(private readonly firebaseService: FirebaseService) {}

  async createCategory(userId: string, createCategoryDto: CreateCategoryDto): Promise<CustomCategory> {
    try {
      // Check if category name already exists for this user
      const existing = await this.getCategoryByName(userId, createCategoryDto.name)
      if (existing) {
        throw new BadRequestException('A category with this name already exists')
      }

      const now = new Date()
      const data: any = {
        user_id: userId,
        name: createCategoryDto.name,
        color: createCategoryDto.color || null,
        icon: createCategoryDto.icon || null,
        created_at: now,
        updated_at: now,
      }

      this.logger.log(`Creating custom category for user: ${userId}`)
      const result = await this.firebaseService.addDocument(this.categoriesCollection, data)

      this.logger.log(`Custom category created: ${result.id} for user: ${userId}`)

      return {
        id: result.id,
        user_id: userId,
        name: data.name,
        color: data.color,
        icon: data.icon,
        created_at: result.created_at.toDate(),
        updated_at: result.updated_at.toDate(),
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      }
      this.logger.error('Error creating custom category', error)
      throw error
    }
  }

  async getCategories(userId: string): Promise<CategoryWithType[]> {
    try {
      // Get custom categories
      const conditions = [{ field: 'user_id', operator: '==' as const, value: userId }]
      const customCategories = await this.firebaseService.getCollection(
        this.categoriesCollection,
        conditions,
        'name',
        'asc'
      )

      const mappedCustom: CategoryWithType[] = customCategories.map((cat: any) => ({
        id: cat.id,
        user_id: cat.user_id,
        name: cat.name,
        color: cat.color || undefined,
        icon: cat.icon || undefined,
        created_at: cat.created_at?.toDate() || new Date(),
        updated_at: cat.updated_at?.toDate() || new Date(),
        is_default: false,
      }))

      // Add default categories
      const defaultCats: CategoryWithType[] = this.defaultCategories.map((name) => ({
        id: name,
        user_id: userId,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        created_at: new Date(),
        updated_at: new Date(),
        is_default: true,
      }))

      return [...defaultCats, ...mappedCustom]
    } catch (error) {
      this.logger.error('Error fetching categories', error)
      throw error
    }
  }

  async getCategoryById(userId: string, categoryId: string): Promise<CustomCategory> {
    try {
      const category = await this.firebaseService.getDocument(this.categoriesCollection, categoryId)
      if (!category) {
        throw new NotFoundException('Category not found')
      }

      if (category.user_id !== userId) {
        throw new ForbiddenException('You do not have access to this category')
      }

      return {
        id: category.id,
        user_id: category.user_id,
        name: category.name,
        color: category.color || undefined,
        icon: category.icon || undefined,
        created_at: category.created_at?.toDate() || new Date(),
        updated_at: category.updated_at?.toDate() || new Date(),
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error
      }
      this.logger.error('Error fetching category', error)
      throw error
    }
  }

  async getCategoryByName(userId: string, name: string): Promise<CustomCategory | null> {
    try {
      const conditions = [
        { field: 'user_id', operator: '==' as const, value: userId },
        { field: 'name', operator: '==' as const, value: name },
      ]
      
      const categories = await this.firebaseService.getCollection(
        this.categoriesCollection,
        conditions
      )

      if (categories.length === 0) {
        return null
      }

      const cat = categories[0]
      return {
        id: cat.id,
        user_id: cat.user_id,
        name: cat.name,
        color: cat.color || undefined,
        icon: cat.icon || undefined,
        created_at: cat.created_at?.toDate() || new Date(),
        updated_at: cat.updated_at?.toDate() || new Date(),
      }
    } catch (error) {
      this.logger.error('Error fetching category by name', error)
      throw error
    }
  }

  async updateCategory(
    userId: string,
    categoryId: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<CustomCategory> {
    try {
      // Verify ownership
      await this.getCategoryById(userId, categoryId)

      // Check if new name conflicts with existing category
      if (updateCategoryDto.name) {
        const existing = await this.getCategoryByName(userId, updateCategoryDto.name)
        if (existing && existing.id !== categoryId) {
          throw new BadRequestException('A category with this name already exists')
        }
      }

      const updateData: any = {
        updated_at: new Date(),
      }

      if (updateCategoryDto.name !== undefined) {
        updateData.name = updateCategoryDto.name
      }

      if (updateCategoryDto.color !== undefined) {
        updateData.color = updateCategoryDto.color
      }

      if (updateCategoryDto.icon !== undefined) {
        updateData.icon = updateCategoryDto.icon
      }

      await this.firebaseService.updateDocument(this.categoriesCollection, categoryId, updateData)

      this.logger.log(`Category updated: ${categoryId} for user: ${userId}`)

      return this.getCategoryById(userId, categoryId)
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error
      }
      this.logger.error('Error updating category', error)
      throw error
    }
  }

  async deleteCategory(userId: string, categoryId: string): Promise<{ success: boolean; message: string; goalsAffected: number }> {
    try {
      // Verify ownership
      await this.getCategoryById(userId, categoryId)

      // Check how many goals use this category
      const firestore = this.firebaseService.getFirestore()
      const goalsRef = firestore.collection('goals')
      const goalsSnapshot = await goalsRef
        .where('user_id', '==', userId)
        .where('category', '==', categoryId)
        .get()

      const goalsAffected = goalsSnapshot.size

      // Update all goals using this category to 'other'
      if (goalsAffected > 0) {
        const batch = firestore.batch()
        goalsSnapshot.docs.forEach((doc) => {
          batch.update(doc.ref, { category: 'other', updated_at: new Date() })
        })
        await batch.commit()
      }

      // Delete the category
      await this.firebaseService.deleteDocument(this.categoriesCollection, categoryId)

      this.logger.log(`Category deleted: ${categoryId} for user: ${userId}, ${goalsAffected} goals updated`)

      return {
        success: true,
        message: 'Category deleted successfully',
        goalsAffected,
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error
      }
      this.logger.error('Error deleting category', error)
      throw error
    }
  }

  isDefaultCategory(categoryName: string): boolean {
    return this.defaultCategories.includes(categoryName as DefaultGoalCategory)
  }
}
