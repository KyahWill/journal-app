# Custom Categories - Quick Start Guide

## For Users

### Creating Your First Custom Category

1. **Navigate to Goal Settings**
   - Go to your Goals page
   - Click the "Settings" button in the top right

2. **Create a Category**
   - Click "New Category"
   - Enter a name (e.g., "Travel", "Side Projects", "Family")
   - Pick a color that represents your category
   - Add an emoji icon (optional, e.g., ✈️, 💼, 👨‍👩‍👧)
   - Click "Create"

3. **Use Your Category**
   - Go back to Goals
   - Click "New Goal"
   - Select your custom category from the dropdown
   - Your category will appear with its color and icon!

### Managing Categories

**Edit a Category**
- Go to Settings
- Click the edit icon (pencil) next to any custom category
- Update the name, color, or icon
- Click "Update"

**Delete a Category**
- Go to Settings
- Click the delete icon (trash) next to any custom category
- Confirm deletion
- Note: Any goals using this category will be moved to "Other"

### Tips

- **Use Colors Wisely**: Pick distinct colors for easy visual identification
- **Emojis Work Great**: Use emojis as icons for a fun, visual touch (🎯, 🚀, 💪, 📚)
- **Keep Names Short**: Shorter names display better in the UI
- **Organize by Life Areas**: Create categories that match your life structure

### Example Categories

Here are some ideas to get you started:

| Name | Color | Icon | Use For |
|------|-------|------|---------|
| Travel | #FF6B6B | ✈️ | Trip planning, bucket list destinations |
| Side Projects | #4ECDC4 | 🚀 | Personal projects, hobbies |
| Family | #FFE66D | 👨‍👩‍👧 | Family goals, events, milestones |
| Fitness | #95E1D3 | 💪 | Workout goals, health targets |
| Reading | #F38181 | 📚 | Books to read, learning goals |
| Home | #AA96DA | 🏠 | Home improvement, organization |
| Creative | #FCBAD3 | 🎨 | Art, music, creative projects |
| Social | #A8D8EA | 🤝 | Networking, friendships |

## For Developers

### Quick Integration

```typescript
import { apiClient } from '@/lib/api/client'

// Get all categories
const categories = await apiClient.getCategories()

// Create a category
const newCategory = await apiClient.createCategory({
  name: 'Travel',
  color: '#FF6B6B',
  icon: '✈️'
})

// Use in a goal
const goal = await apiClient.createGoal({
  title: 'Visit Japan',
  category: newCategory.id, // Use custom category ID
  target_date: '2024-12-31'
})
```

### Component Usage

```tsx
import { CategoryManager } from '@/components/category-manager'

function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
      <CategoryManager onCategoryChange={() => {
        // Refresh goals or other data
        console.log('Categories updated!')
      }} />
    </div>
  )
}
```

### API Endpoints

```bash
# Get all categories (includes defaults)
GET /category

# Create category
POST /category
{
  "name": "Travel",
  "color": "#FF6B6B",
  "icon": "✈️"
}

# Update category
PUT /category/:id
{
  "name": "Adventures",
  "color": "#4ECDC4"
}

# Delete category
DELETE /category/:id
```

## Deployment

### 1. Deploy Firestore Indexes

```bash
cd web
firebase deploy --only firestore:indexes
```

Wait for indexes to build (check Firebase Console).

### 2. Deploy Backend

```bash
cd backend
npm run build
# Deploy to your hosting service
```

### 3. Deploy Frontend

```bash
cd web
npm run build
# Deploy to your hosting service
```

### 4. Test

1. Log in to your app
2. Navigate to Goals → Settings
3. Create a test category
4. Create a goal with that category
5. Verify everything works!

## Troubleshooting

### "Categories not loading"
- Check if you're logged in
- Open browser console for errors
- Verify Firestore indexes are deployed

### "Cannot create category"
- Check if name is unique
- Verify color format is #RRGGBB
- Make sure you're authenticated

### "Category not appearing in goal form"
- Refresh the page
- Check if category was created successfully
- Verify API is responding

## Need Help?

- Check the full documentation: `docs/CUSTOM_CATEGORIES.md`
- Review the implementation: `web/components/category-manager.tsx`
- Check API client: `web/lib/api/client.ts`
- Backend service: `backend/src/category/category.service.ts`
