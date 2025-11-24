# Categories Feature

**Custom goal categories with colors and icons**

---

**Last Updated**: November 2025  
**Status**: ✅ Complete

---

## Overview

The Categories feature allows users to create custom categories for organizing their goals beyond the default categories. Each custom category can have a unique name, color, and icon, providing a personalized organization system.

## Key Features

### Category Management

#### Create Categories
- Custom category names (1-50 characters)
- Custom colors (hex codes)
- Custom icons/emojis
- Unlimited categories per user
- Automatic timestamp tracking

#### Edit Categories
- Update category name
- Change category color
- Modify category icon
- Save changes instantly

#### Delete Categories
- Delete custom categories
- Confirmation dialog
- Automatic goal reassignment to "Other"
- Cannot delete default categories

### Default Categories

The system includes 7 default categories:

1. **Career**: Professional and work-related goals
2. **Health**: Physical and mental health goals
3. **Personal**: Personal development and hobbies
4. **Financial**: Money and financial goals
5. **Relationships**: Social and relationship goals
6. **Learning**: Education and skill development
7. **Other**: Miscellaneous goals

**Characteristics**:
- Cannot be deleted
- Cannot be edited
- Always available
- Consistent across all users

### Category Customization

#### Name
- 1-50 characters
- Must be unique per user
- Case-insensitive uniqueness check
- Alphanumeric and spaces allowed

#### Color
- Hex color format (#RRGGBB)
- Visual color picker
- Default: #3B82F6 (blue)
- Used for visual indicators

#### Icon
- Emoji support
- Icon name support (Lucide icons ready)
- Max 50 characters
- Optional field
- Visual icon picker ready

### Category Usage

#### Goal Assignment
- Assign category when creating goal
- Change category when editing goal
- Select from default + custom categories
- Visual category indicators on goal cards

#### Category Filtering
- Filter goals by category
- Show all goals in category
- Combine with other filters
- Real-time filtering

#### Category Display
- Color indicator on goal cards
- Icon display on goal cards
- Category name in goal details
- Category badge styling

### Category Protection

#### Default Category Protection
- Default categories cannot be deleted
- Default categories cannot be edited
- Always available to all users
- Consistent naming and behavior

#### Custom Category Safeguards
- Duplicate name prevention
- Validation on all operations
- User-scoped categories
- Automatic goal reassignment on deletion

## Architecture

### Database Schema

```typescript
interface CustomCategory {
  id: string
  user_id: string
  name: string
  color?: string  // Hex color like #3B82F6
  icon?: string   // Emoji or icon name
  created_at: Timestamp
  updated_at: Timestamp
}
```

**Indexes**:
- `user_id + name` (unique)
- `user_id + created_at` (DESC)

**Security Rules**:
- Users can only read/write their own categories
- Category ownership verified on all operations
- Validation on required fields

### Components

#### CategoryManager
- Main component for category management
- List all custom categories
- Create new category form
- Edit category dialog
- Delete category confirmation
- Real-time updates

#### Category Selector
- Dropdown for category selection
- Shows default + custom categories
- Color and icon indicators
- Search/filter categories
- Used in goal forms

#### Category Badge
- Visual category indicator
- Shows color and icon
- Displays category name
- Used on goal cards

### API Endpoints

**GET /category**
- Get all categories (default + custom)
- Returns: Array of categories with type indicator

**GET /category/:id**
- Get specific custom category
- Returns: Category object

**POST /category**
- Create new custom category
- Body: { name, color?, icon? }
- Returns: Created category

**PUT /category/:id**
- Update custom category
- Body: Partial category data
- Returns: Updated category

**DELETE /category/:id**
- Delete custom category
- Reassigns affected goals to "Other"
- Returns: Success message

## Usage Examples

### Creating a Category

```typescript
import { apiClient } from '@/lib/api/client'

const category = await apiClient.createCategory({
  name: 'Travel',
  color: '#FF6B6B',
  icon: '✈️'
})
```

### Getting All Categories

```typescript
// Returns both default and custom categories
const categories = await apiClient.getCategories()

categories.forEach(cat => {
  console.log(cat.name, cat.is_default ? '(default)' : '(custom)')
})
```

### Using Categories in Goals

```typescript
// Create goal with custom category
const goal = await apiClient.createGoal({
  title: 'Visit Japan',
  description: 'Plan a 2-week trip to Japan',
  category: customCategoryId,  // Use custom category ID
  target_date: '2024-12-31'
})

// Create goal with default category
const goal2 = await apiClient.createGoal({
  title: 'Get promoted',
  category: 'career',  // Use default category name
  target_date: '2024-12-31'
})
```

### Deleting a Category

```typescript
// Delete category (goals reassigned to "other")
await apiClient.deleteCategory(categoryId)
```

## Features in Detail

### Category Type System

Categories can be either default or custom:

**Default Categories**:
- Identified by name (e.g., "career")
- `is_default: true` flag
- Cannot be modified or deleted
- Consistent across all users

**Custom Categories**:
- Identified by UUID
- `is_default: false` flag
- Can be modified and deleted
- User-specific

**Goal Category Field**:
- Stores either default category name or custom category ID
- Backward compatible with existing goals
- Flexible and extensible

### Duplicate Prevention

The system prevents duplicate category names:

**Validation**:
- Case-insensitive comparison
- Checks against default categories
- Checks against user's custom categories
- Returns clear error message

**Example**:
```typescript
// This will fail if "Travel" already exists
await apiClient.createCategory({ name: 'Travel' })
// Error: "Category name already exists"
```

### Goal Reassignment

When a custom category is deleted:

**Process**:
1. Find all goals using the category
2. Update each goal's category to "other"
3. Delete the category
4. Return success message

**User Experience**:
- Confirmation dialog warns about reassignment
- Shows count of affected goals
- Goals remain accessible
- No data loss

### Color System

Colors are stored as hex codes:

**Format**: `#RRGGBB`
- Example: `#3B82F6` (blue)
- Example: `#10B981` (green)
- Example: `#F59E0B` (amber)

**Usage**:
- Background colors for badges
- Border colors for indicators
- Visual distinction between categories

**Validation**:
- Must start with #
- Must be 7 characters (#RRGGBB)
- Must be valid hex digits

### Icon System

Icons can be emojis or icon names:

**Emoji Support**:
- Any Unicode emoji
- Example: ✈️, 🎯, 💼, 🏃
- Displayed directly

**Icon Names** (Ready for implementation):
- Lucide icon names
- Example: "plane", "target", "briefcase"
- Rendered as SVG icons

## Performance Optimizations

### Caching
- Categories cached after initial load
- Reduces API calls
- Faster category selection
- Automatic cache invalidation

### Efficient Queries
- Indexed database queries
- Composite indexes for performance
- Minimal data transfer
- Optimized for common operations

### Real-time Updates
- Firestore real-time subscriptions
- Automatic UI updates
- Multi-device sync
- Optimistic updates

## Testing

### Manual Testing Checklist

- [ ] Create custom category
- [ ] Create category with color
- [ ] Create category with icon
- [ ] Edit category name
- [ ] Edit category color
- [ ] Edit category icon
- [ ] Delete category (verify confirmation)
- [ ] Delete category with goals (verify reassignment)
- [ ] Try to create duplicate category (should fail)
- [ ] Create goal with custom category
- [ ] Create goal with default category
- [ ] Change goal category
- [ ] Filter goals by category
- [ ] View category indicators on goal cards
- [ ] Test with many categories (50+)

### API Testing

```bash
# Get all categories
curl http://localhost:3001/api/v1/category \
  -H "Authorization: Bearer $TOKEN"

# Create category
curl -X POST http://localhost:3001/api/v1/category \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Travel",
    "color": "#FF6B6B",
    "icon": "✈️"
  }'

# Update category
curl -X PUT http://localhost:3001/api/v1/category/$CATEGORY_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Adventures",
    "color": "#4ECDC4"
  }'

# Delete category
curl -X DELETE http://localhost:3001/api/v1/category/$CATEGORY_ID \
  -H "Authorization: Bearer $TOKEN"
```

## Troubleshooting

### Categories not loading

**Symptoms**: Category list is empty or not loading

**Possible Causes**:
1. Authentication issue
2. Firestore indexes not deployed
3. Network connectivity

**Solutions**:
1. Verify user is authenticated
2. Deploy Firestore indexes
3. Check network connection
4. Check browser console for errors

### Cannot create category

**Symptoms**: Error when creating category

**Possible Causes**:
1. Duplicate name
2. Invalid color format
3. Name too long

**Solutions**:
1. Use unique name
2. Use valid hex color (#RRGGBB)
3. Keep name under 50 characters
4. Check validation errors

### Goals not updating after category deletion

**Symptoms**: Goals still show deleted category

**Possible Causes**:
1. Batch operation failed
2. Firestore permissions issue
3. Cache not invalidated

**Solutions**:
1. Check backend logs
2. Verify Firestore permissions
3. Refresh page
4. Check goal data in database

## Migration

### Setup Steps

1. **Deploy Firestore Indexes**:
```bash
cd web
firebase deploy --only firestore:indexes
```

2. **Update Firestore Rules**:
```bash
firebase deploy --only firestore:rules
```

3. **Run Migration** (if needed):
```bash
cd backend
npm run ts-node src/firebase/migrations/setup-custom-categories.ts
```

### Backward Compatibility

The system is fully backward compatible:

**Existing Goals**:
- Goals with default categories continue to work
- No migration required
- Category field accepts both names and IDs

**New Goals**:
- Can use default categories (by name)
- Can use custom categories (by ID)
- Flexible and extensible

## Future Enhancements

### Planned Features

- [ ] Category analytics (goal count per category)
- [ ] Category completion rates
- [ ] Category-based insights
- [ ] Category sharing
- [ ] Category templates
- [ ] Category ordering
- [ ] Pin favorite categories
- [ ] Category icons library
- [ ] Category themes
- [ ] Bulk category operations

### Potential Improvements

- [ ] Merge categories
- [ ] Bulk reassign goals
- [ ] Category hierarchy (subcategories)
- [ ] Category tags
- [ ] Category search
- [ ] Category statistics
- [ ] Category export/import
- [ ] Category recommendations

## Related Documentation

- [API Reference](../API_REFERENCE.md#categories)
- [Goals Feature](./goals.md)
- [Database Setup](../setup/database-setup.md)
- [Firestore Configuration](../integrations/firebase.md)

