# Custom Goal Categories

This document describes the custom categories feature that allows users to create and manage their own goal categories beyond the default ones.

## Overview

Users can now create custom categories for their goals in addition to the default categories (Career, Health, Personal, Financial, Relationships, Learning, Other). Each custom category can have:
- A unique name
- A custom color (hex code)
- An optional icon/emoji

## Architecture

### Backend

#### New Collections

**custom_categories**
- `id`: string (auto-generated)
- `user_id`: string (indexed)
- `name`: string
- `color`: string (optional, hex color like #3B82F6)
- `icon`: string (optional, emoji or icon name)
- `created_at`: timestamp
- `updated_at`: timestamp

#### API Endpoints

**Category Management**
- `GET /category` - Get all categories (default + custom) for the user
- `GET /category/:id` - Get a specific custom category
- `POST /category` - Create a new custom category
- `PUT /category/:id` - Update a custom category
- `DELETE /category/:id` - Delete a custom category (moves affected goals to "other")

#### Changes to Existing Types

**Goal.category**
- Changed from: `GoalCategory` (union type of default categories)
- Changed to: `string` (can be a default category name or custom category ID)

This maintains backward compatibility while allowing custom categories.

### Frontend

#### New Components

**CategoryManager** (`web/components/category-manager.tsx`)
- Main component for managing custom categories
- Features:
  - List all custom categories
  - Create new categories with name, color, and icon
  - Edit existing categories
  - Delete categories (with warning about affected goals)
  - Visual color picker
  - Real-time updates

#### Updated Components

**GoalForm** (`web/components/goal-form.tsx`)
- Now loads and displays all available categories (default + custom)
- Shows custom category colors and icons in the dropdown
- Supports selecting both default and custom categories

#### New Pages

**Goal Settings** (`web/app/app/goals/settings/page.tsx`)
- Dedicated page for managing goal-related settings
- Currently hosts the CategoryManager component
- Accessible from the goals page

### Database Indexes

Added to `web/firestore.indexes.json`:

```json
{
  "collectionGroup": "custom_categories",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "user_id", "order": "ASCENDING" },
    { "fieldPath": "name", "order": "ASCENDING" }
  ]
},
{
  "collectionGroup": "custom_categories",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "user_id", "order": "ASCENDING" },
    { "fieldPath": "created_at", "order": "DESCENDING" }
  ]
}
```

## Usage

### For Users

1. **Access Category Settings**
   - Navigate to Goals page
   - Click on "Settings" or access `/app/goals/settings`

2. **Create a Custom Category**
   - Click "New Category" button
   - Enter a name (required, max 50 characters)
   - Choose a color (optional, defaults to blue)
   - Add an icon/emoji (optional)
   - Click "Create"

3. **Edit a Category**
   - Click the edit icon next to any custom category
   - Update the name, color, or icon
   - Click "Update"

4. **Delete a Category**
   - Click the delete icon next to any custom category
   - Confirm the deletion
   - Any goals using this category will be moved to "Other"

5. **Use Custom Categories**
   - When creating or editing a goal, select from both default and custom categories
   - Custom categories appear with their color indicator and icon

### For Developers

#### Creating a Category (API)

```typescript
import { apiClient } from '@/lib/api/client'

const category = await apiClient.createCategory({
  name: 'Travel',
  color: '#FF6B6B',
  icon: '✈️'
})
```

#### Getting All Categories

```typescript
const categories = await apiClient.getCategories()
// Returns: CategoryWithType[] (includes both default and custom)

categories.forEach(cat => {
  console.log(cat.name, cat.is_default ? '(default)' : '(custom)')
})
```

#### Using Categories in Goals

```typescript
// Create a goal with a custom category
const goal = await apiClient.createGoal({
  title: 'Visit Japan',
  description: 'Plan a 2-week trip to Japan',
  category: customCategoryId, // Use the custom category ID
  target_date: '2024-12-31'
})

// Or use a default category
const goal2 = await apiClient.createGoal({
  title: 'Get promoted',
  category: 'career', // Use default category name
  target_date: '2024-12-31'
})
```

## Migration

### Setup Steps

1. **Deploy Firestore Indexes**
   ```bash
   cd web
   firebase deploy --only firestore:indexes
   ```

2. **Run Migration Script** (optional, for initialization)
   ```bash
   cd backend
   npm run ts-node src/firebase/migrations/setup-custom-categories.ts
   ```

### Backward Compatibility

- Existing goals with default categories continue to work without changes
- The category field now accepts both default category names and custom category IDs
- Default categories are always available and cannot be deleted
- When a custom category is deleted, affected goals are automatically moved to "other"

## Validation

### Backend Validation

- Category name: 1-50 characters, required
- Color: Must be valid hex color (#RRGGBB) if provided
- Icon: Max 50 characters if provided
- Duplicate names: Not allowed per user

### Frontend Validation

- Real-time validation in the category form
- Character count indicators
- Color picker with hex input
- Duplicate name detection

## Security

- All category operations require authentication
- Users can only access their own categories
- Category ownership is verified on all operations
- When deleting a category, only the user's goals are affected

## Performance Considerations

- Categories are cached in the frontend after initial load
- Firestore indexes ensure efficient queries
- Batch operations for updating multiple goals when deleting a category
- Minimal data transfer (categories are small documents)

## Future Enhancements

Potential improvements for future versions:

1. **Category Analytics**
   - Show goal count per category
   - Track completion rates by category
   - Category-based insights

2. **Category Sharing**
   - Share custom categories with other users
   - Import popular category templates

3. **Category Ordering**
   - Allow users to reorder categories
   - Pin favorite categories

4. **Category Icons Library**
   - Provide a built-in icon picker
   - Support for icon libraries (Lucide, etc.)

5. **Category Themes**
   - Apply category colors to goal cards
   - Category-based UI theming

6. **Bulk Operations**
   - Merge categories
   - Bulk reassign goals to different categories

## Testing

### Manual Testing Checklist

- [ ] Create a custom category
- [ ] Edit a custom category
- [ ] Delete a custom category
- [ ] Create a goal with a custom category
- [ ] Create a goal with a default category
- [ ] Edit a goal to change from default to custom category
- [ ] Edit a goal to change from custom to default category
- [ ] Delete a category that has goals assigned
- [ ] Verify goals are moved to "other" after category deletion
- [ ] Test duplicate category name validation
- [ ] Test color picker functionality
- [ ] Test with emoji icons
- [ ] Test category list loading
- [ ] Test category selection in goal form

### API Testing

Use the provided Postman collection or test manually:

```bash
# Get categories
curl -X GET http://localhost:3001/category \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create category
curl -X POST http://localhost:3001/category \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Travel","color":"#FF6B6B","icon":"✈️"}'

# Update category
curl -X PUT http://localhost:3001/category/CATEGORY_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Adventures","color":"#4ECDC4"}'

# Delete category
curl -X DELETE http://localhost:3001/category/CATEGORY_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### Categories not loading
- Check Firebase authentication
- Verify Firestore indexes are deployed
- Check browser console for errors

### Cannot create category
- Verify name is unique
- Check color format (#RRGGBB)
- Ensure user is authenticated

### Goals not updating after category deletion
- Check backend logs for batch operation errors
- Verify Firestore permissions
- Check that goals collection is accessible

## Related Documentation

- [Goal Setting Feature](./backend/GOALS_API.md)
- [Firestore Setup](./backend/FIRESTORE_GOALS_SETUP.md)
- [API Client](../web/lib/api/client.ts)
