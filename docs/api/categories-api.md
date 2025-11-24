# Categories API

**Last Updated**: November 2025

## Overview

The Categories API allows users to create and manage custom categories for organizing goals. In addition to default categories (health, career, personal, etc.), users can create custom categories with personalized colors and icons. All endpoints require authentication.

**Base Path**: `/api/v1/category`

## Default Categories

The system includes these default categories:

- **health** - Health and fitness goals
- **career** - Professional and career goals
- **personal** - Personal development goals
- **finance** - Financial goals
- **relationships** - Relationship goals
- **learning** - Education and learning goals
- **creativity** - Creative and artistic goals
- **travel** - Travel and adventure goals

## Endpoints

### Create Custom Category

Create a new custom category for organizing goals.

**Endpoint**: `POST /category`

**Authentication**: Required

**Request Body**:
```json
{
  "name": "Side Projects",
  "color": "#FF5733",
  "icon": "🚀"
}
```

**Request Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Category name (1-50 characters) |
| color | string | No | Hex color code (e.g., #FF5733) |
| icon | string | No | Emoji or icon identifier (max 50 characters) |

**Response** (201 Created):
```json
{
  "id": "category_abc123",
  "user_id": "user_xyz789",
  "name": "Side Projects",
  "color": "#FF5733",
  "icon": "🚀",
  "is_custom": true,
  "created_at": "2025-11-24T10:00:00Z",
  "updated_at": "2025-11-24T10:00:00Z"
}
```

**Error Responses**:
- `400 Bad Request` - Invalid data or validation failed
- `401 Unauthorized` - Missing or invalid token
- `409 Conflict` - Category name already exists for user

**Example**:
```bash
curl -X POST https://api.example.com/api/v1/category \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Side Projects",
    "color": "#FF5733",
    "icon": "🚀"
  }'
```

---

### List All Categories

Get all categories available to the user (both default and custom).

**Endpoint**: `GET /category`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "categories": [
    {
      "id": "health",
      "name": "Health",
      "color": "#4CAF50",
      "icon": "💪",
      "is_custom": false,
      "goal_count": 5
    },
    {
      "id": "career",
      "name": "Career",
      "color": "#2196F3",
      "icon": "💼",
      "is_custom": false,
      "goal_count": 3
    },
    {
      "id": "category_abc123",
      "name": "Side Projects",
      "color": "#FF5733",
      "icon": "🚀",
      "is_custom": true,
      "goal_count": 2
    }
  ],
  "total": 3,
  "custom_count": 1,
  "default_count": 2
}
```

**Example**:
```bash
curl -X GET https://api.example.com/api/v1/category \
  -H "Authorization: Bearer <token>"
```

---

### Get Category by ID

Get detailed information about a specific category.

**Endpoint**: `GET /category/:id`

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Category ID or name |

**Response** (200 OK):
```json
{
  "id": "category_abc123",
  "user_id": "user_xyz789",
  "name": "Side Projects",
  "color": "#FF5733",
  "icon": "🚀",
  "is_custom": true,
  "created_at": "2025-11-24T10:00:00Z",
  "updated_at": "2025-11-24T10:00:00Z",
  "goal_count": 2,
  "goals": [
    {
      "id": "goal_1",
      "title": "Build Mobile App",
      "status": "in_progress"
    },
    {
      "id": "goal_2",
      "title": "Launch Website",
      "status": "not_started"
    }
  ]
}
```

**Error Responses**:
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Category not found

**Example**:
```bash
# Get custom category
curl -X GET https://api.example.com/api/v1/category/category_abc123 \
  -H "Authorization: Bearer <token>"

# Get default category
curl -X GET https://api.example.com/api/v1/category/health \
  -H "Authorization: Bearer <token>"
```

---

### Update Custom Category

Update an existing custom category's information.

**Endpoint**: `PUT /category/:id`

**Authentication**: Required

**Authorization**: Can only update custom categories owned by the user

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Category ID |

**Request Body**:
```json
{
  "name": "Personal Projects",
  "color": "#FF6B6B",
  "icon": "⚡"
}
```

**Request Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | No | New category name |
| color | string | No | New hex color code |
| icon | string | No | New emoji or icon |

**Response** (200 OK):
```json
{
  "id": "category_abc123",
  "name": "Personal Projects",
  "color": "#FF6B6B",
  "icon": "⚡",
  "updated_at": "2025-11-24T16:00:00Z"
}
```

**Error Responses**:
- `400 Bad Request` - Invalid data
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Cannot update default categories
- `404 Not Found` - Category not found
- `409 Conflict` - New name already exists

**Example**:
```bash
curl -X PUT https://api.example.com/api/v1/category/category_abc123 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Personal Projects",
    "color": "#FF6B6B"
  }'
```

---

### Delete Custom Category

Delete a custom category. Goals in this category will be moved to "personal" category.

**Endpoint**: `DELETE /category/:id`

**Authentication**: Required

**Authorization**: Can only delete custom categories owned by the user

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Category ID |

**Response** (200 OK):
```json
{
  "message": "Category deleted successfully",
  "id": "category_abc123",
  "goals_moved": 2,
  "moved_to_category": "personal"
}
```

**Error Responses**:
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Cannot delete default categories
- `404 Not Found` - Category not found

**Example**:
```bash
curl -X DELETE https://api.example.com/api/v1/category/category_abc123 \
  -H "Authorization: Bearer <token>"
```

**Note**: Default categories cannot be deleted. When a custom category is deleted, all goals in that category are automatically moved to the "personal" category.

---

## Category Colors

### Recommended Colors

Here are some recommended hex colors for categories:

| Color | Hex Code | Use Case |
|-------|----------|----------|
| Green | #4CAF50 | Health, growth, success |
| Blue | #2196F3 | Career, productivity, trust |
| Purple | #9C27B0 | Creativity, learning, wisdom |
| Orange | #FF9800 | Energy, enthusiasm, adventure |
| Red | #F44336 | Passion, urgency, important |
| Teal | #009688 | Balance, calm, focus |
| Pink | #E91E63 | Relationships, care, love |
| Yellow | #FFC107 | Happiness, optimism, ideas |

### Color Validation

Colors must be valid 6-digit hex codes:
- ✅ Valid: `#FF5733`, `#4CAF50`, `#2196F3`
- ❌ Invalid: `FF5733`, `#F57`, `rgb(255, 87, 51)`

## Category Icons

### Recommended Emojis

Popular emojis for categories:

| Category Type | Emojis |
|---------------|--------|
| Health/Fitness | 💪 🏃 🧘 🥗 ❤️ |
| Career/Work | 💼 📊 🎯 💻 📈 |
| Learning | 📚 🎓 🧠 ✏️ 🔬 |
| Creativity | 🎨 🎭 🎵 ✨ 🎬 |
| Finance | 💰 💵 📊 💳 🏦 |
| Travel | ✈️ 🌍 🗺️ 🏖️ 🎒 |
| Relationships | ❤️ 👥 🤝 💑 👨‍👩‍👧‍👦 |
| Personal | 🌟 ⭐ 🎯 🔥 ⚡ |

### Icon Validation

- Maximum 50 characters
- Can be emoji, text, or icon identifier
- Displayed in UI alongside category name

## Using Categories with Goals

### Creating Goals with Categories

When creating a goal, specify the category:

```bash
curl -X POST https://api.example.com/api/v1/goal \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Build Mobile App",
    "category": "category_abc123",
    "target_date": "2025-12-31"
  }'
```

### Filtering Goals by Category

Get all goals in a specific category:

```bash
curl -X GET "https://api.example.com/api/v1/goal?category=category_abc123" \
  -H "Authorization: Bearer <token>"
```

Or use the category-specific endpoint:

```bash
curl -X GET https://api.example.com/api/v1/goal/category/category_abc123 \
  -H "Authorization: Bearer <token>"
```

## Best Practices

### Creating Categories

1. **Use Descriptive Names**: Clear, specific names (e.g., "Side Projects" not "Other")
2. **Choose Meaningful Colors**: Colors that represent the category's purpose
3. **Select Relevant Icons**: Emojis that visually represent the category
4. **Avoid Duplicates**: Check existing categories before creating new ones
5. **Keep It Simple**: Don't create too many categories (5-10 is ideal)

### Organizing Goals

1. **Consistent Categorization**: Use the same category for similar goals
2. **Review Regularly**: Update categories as your goals evolve
3. **Use Default Categories**: Leverage built-in categories when appropriate
4. **Merge Similar Categories**: Consolidate overlapping custom categories

### Performance

1. **Cache Category List**: Categories change infrequently
2. **Batch Updates**: Update multiple goals' categories together
3. **Lazy Load Goals**: Don't load all goals when listing categories

## Limitations

- **Maximum Custom Categories**: 50 per user
- **Name Length**: 1-50 characters
- **Icon Length**: Maximum 50 characters
- **Default Categories**: Cannot be modified or deleted

## Migration from Default Categories

If you want to replace a default category with a custom one:

1. Create new custom category
2. Update all goals to use new category
3. Default category remains available but unused

**Example**:
```bash
# Create custom "Fitness" category
curl -X POST https://api.example.com/api/v1/category \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "Fitness", "color": "#FF5733", "icon": "🏋️"}'

# Update goals to use new category
curl -X PUT https://api.example.com/api/v1/goal/goal_123 \
  -H "Authorization: Bearer <token>" \
  -d '{"category": "category_abc123"}'
```

## Related Documentation

- [Categories Feature](../features/categories.md)
- [Goals API](./goals-api.md)
- [Data Models](../architecture/data-models.md)

---

[← Back to API Reference](../API_REFERENCE.md)
