# Theming Feature

**Comprehensive custom theming system with AI-powered recommendations**

---

**Last Updated**: November 2025  
**Status**: ✅ Complete

---

## Overview

The Theming feature provides a complete system for customizing the application's appearance. Users can create unlimited themes with full control over colors, typography, spacing, visual effects, and animations. The system includes AI-powered theme recommendations based on mood and preferences.

## Key Features

### Theme Creation & Management

#### Create Themes
- Create unlimited custom themes
- Name and description
- Full customization options
- Save and apply instantly
- Set as default theme

#### Edit Themes
- Modify all theme properties
- Live preview of changes
- Save or discard changes
- Revert to previous version

#### Delete Themes
- Delete custom themes
- Cannot delete default theme if only one
- Confirmation dialog
- Automatic fallback to another theme

#### Theme Switching
- Switch themes instantly
- No page reload required
- CSS variables for instant updates
- Smooth transitions

### Color Customization

#### 19 Color Properties
- **Background**: Main background color
- **Foreground**: Main text color
- **Card**: Card background
- **Card Foreground**: Card text
- **Popover**: Popover background
- **Popover Foreground**: Popover text
- **Primary**: Primary action color
- **Primary Foreground**: Primary text
- **Secondary**: Secondary action color
- **Secondary Foreground**: Secondary text
- **Muted**: Muted background
- **Muted Foreground**: Muted text
- **Accent**: Accent color
- **Accent Foreground**: Accent text
- **Destructive**: Destructive action color
- **Destructive Foreground**: Destructive text
- **Border**: Border color
- **Input**: Input border color
- **Ring**: Focus ring color

#### Color Format
- HSL format: "hue saturation% lightness%"
- Example: "200 80% 50%" (blue)
- Easy to adjust brightness and saturation
- Consistent color relationships

#### Color Picker
- Visual color picker interface
- HSL sliders
- Hex input support
- Color preview
- Live preview of changes

### Typography Control

#### Font Settings
- **Font Family**: Choose from available fonts
- **Base Font Size**: 10-24px
- **Heading Scale**: 1-2 (size multiplier for headings)
- **Line Height**: 1-2.5 (spacing between lines)

#### Font Options
- System fonts
- Google Fonts integration ready
- Custom font upload ready
- Font weight options

### Spacing & Layout

#### Spacing Scale
- Multiplier: 0.5-2x
- Affects all margins and padding
- Consistent spacing throughout
- Responsive spacing

#### Layout Density
- **Compact**: Minimal spacing, more content
- **Comfortable**: Balanced spacing (default)
- **Spacious**: Maximum spacing, less content

### Visual Effects

#### Border Radius
- Range: 0-2rem
- Affects all rounded corners
- Consistent visual style
- Sharp to fully rounded

#### Shadow Intensity
- **None**: No shadows
- **Subtle**: Light shadows
- **Medium**: Moderate shadows (default)
- **Strong**: Prominent shadows

### Animations

#### Animation Duration
- Range: 0-1000ms
- Affects all transitions
- Consistent motion design
- Instant to slow

#### Easing Functions
- **Linear**: Constant speed
- **Ease**: Slow start and end
- **Ease-in**: Slow start
- **Ease-out**: Slow end
- **Ease-in-out**: Slow start and end (default)

### AI Recommendations

#### Color Scheme Suggestions
- Based on mood and preferences
- Color psychology integration
- Complementary color selection
- Accessibility considerations

#### Recommendation Process
1. User describes desired mood/style
2. AI analyzes preferences
3. Generates color scheme
4. Provides psychology explanation
5. Suggests typography and spacing

#### AI Provider
- Google Gemini for recommendations
- Natural language input
- Contextual understanding
- Creative suggestions

### Theme Sharing

#### Public Themes
- Make themes public
- Generate shareable links
- Browse public themes
- Import public themes

#### Import/Export
- Export themes as JSON
- Import themes from JSON
- Share via file
- Backup themes

## Architecture

### Database Schema

```typescript
interface UserTheme {
  id: string
  user_id: string
  name: string
  is_default: boolean
  is_public: boolean
  
  colors: {
    background: string
    foreground: string
    card: string
    cardForeground: string
    popover: string
    popoverForeground: string
    primary: string
    primaryForeground: string
    secondary: string
    secondaryForeground: string
    muted: string
    mutedForeground: string
    accent: string
    accentForeground: string
    destructive: string
    destructiveForeground: string
    border: string
    input: string
    ring: string
  }
  
  typography: {
    fontFamily: string
    baseFontSize: number
    headingScale: number
    lineHeight: number
  }
  
  spacing: {
    scale: number
  }
  
  borderRadius: number
  shadowIntensity: 'none' | 'subtle' | 'medium' | 'strong'
  
  animations: {
    duration: number
    easing: string
  }
  
  density: 'comfortable' | 'compact' | 'spacious'
  
  created_at: Timestamp
  updated_at: Timestamp
}
```

**Indexes**:
- `user_id + created_at` (DESC)
- `user_id + is_default`
- `is_public + created_at` (DESC)

### Components

#### ThemeEditor
- Tabbed interface for theme editing
- **Colors Tab**: Color pickers for all colors
- **Typography Tab**: Font settings
- **Spacing Tab**: Spacing and density
- **Visual Tab**: Border radius and shadows
- **Animations Tab**: Duration and easing
- **Preview Tab**: Live preview
- AI recommendations button
- Save/cancel buttons

#### ThemePreview
- Live preview of theme
- Typography samples (H1, H2, body)
- Button samples (all variants)
- Card samples
- Form element samples
- Alert samples
- Density and spacing info

#### ThemeLoader
- Loads active theme on app start
- Applies CSS variables
- Handles theme switching
- Manages localStorage

#### Theme Settings Page
- Grid display of saved themes
- Theme preview cards
- Actions: edit, delete, set default, apply
- Create new theme button
- Import/export buttons
- Share dialog

### API Endpoints

**GET /theme**
- Get all user themes
- Returns: Array of themes

**GET /theme/default**
- Get default theme
- Creates if none exists
- Returns: Theme object

**GET /theme/public/:id**
- Get public shared theme
- Returns: Theme object

**GET /theme/:id**
- Get specific theme
- Returns: Theme object

**POST /theme**
- Create new theme
- Body: Theme data
- Returns: Created theme

**POST /theme/recommend**
- Get AI theme recommendations
- Body: { mood, preferences }
- Returns: Recommended theme data

**PATCH /theme/:id**
- Update theme
- Body: Partial theme data
- Returns: Updated theme

**PATCH /theme/:id/set-default**
- Set theme as default
- Returns: Updated theme

**DELETE /theme/:id**
- Delete theme
- Returns: Success message

## Usage Examples

### Creating a Theme

```typescript
import { useThemes } from '@/lib/hooks/useThemes'

function CreateTheme() {
  const { createTheme } = useThemes()

  const handleCreate = async () => {
    await createTheme({
      name: 'Ocean Blue',
      is_default: false,
      is_public: true,
      colors: {
        background: '200 100% 95%',
        primary: '200 80% 50%',
        // ... other colors
      },
      typography: {
        fontFamily: 'var(--font-geist-sans)',
        baseFontSize: 16,
        headingScale: 1.5,
        lineHeight: 1.6,
      },
      spacing: { scale: 1 },
      borderRadius: 0.75,
      shadowIntensity: 'medium',
      animations: {
        duration: 250,
        easing: 'ease-in-out',
      },
      density: 'comfortable',
    })
  }

  return <button onClick={handleCreate}>Create Theme</button>
}
```

### Applying a Theme

```typescript
const { setActiveTheme } = useThemes()

// Apply theme
await setActiveTheme(theme)

// Theme is applied instantly via CSS variables
```

### Getting AI Recommendations

```typescript
const { getRecommendations } = useThemes()

const suggestions = await getRecommendations({
  mood: 'calm and focused',
  preferences: 'I like blue and green colors',
})

// suggestions contains recommended color scheme
```

### Exporting a Theme

```typescript
const { exportTheme } = useThemes()

// Export theme as JSON file
exportTheme(theme)

// Downloads theme-name.json
```

### Importing a Theme

```typescript
const { importTheme } = useThemes()

// Import from file input
const handleImport = async (file: File) => {
  await importTheme(file)
}
```

## Features in Detail

### CSS Variables

Themes are applied using CSS variables:

```css
:root {
  /* Colors */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  
  /* Typography */
  --font-family: var(--font-geist-sans);
  --font-size-base: 16px;
  --heading-scale: 1.5;
  --line-height: 1.6;
  
  /* Spacing */
  --spacing-scale: 1;
  
  /* Visual */
  --border-radius: 0.75rem;
  --shadow-intensity: medium;
  
  /* Animations */
  --animation-duration: 250ms;
  --animation-easing: ease-in-out;
  
  /* Density */
  --density: comfortable;
}
```

**Benefits**:
- Instant theme switching
- No page reload
- Consistent styling
- Easy to customize

### Theme Persistence

Themes are persisted in multiple ways:

**localStorage**:
- Active theme ID stored
- Loads on app start
- Survives page refresh

**Firestore**:
- All themes stored in cloud
- Syncs across devices
- Backup and recovery

**Default Theme**:
- One theme marked as default
- Auto-loads if no active theme
- Created automatically if none exists

### AI Recommendations

AI recommendations use Google Gemini:

**Process**:
1. User describes mood/preferences
2. Sent to Gemini with prompt
3. AI analyzes and generates scheme
4. Returns colors with explanations
5. User can apply or modify

**Prompt Template**:
```
Generate a color scheme for a journaling app based on:
Mood: {mood}
Preferences: {preferences}

Provide colors in HSL format and explain the psychology.
```

### Theme Validation

Themes are validated before saving:

**Validation Rules**:
- Name: 1-50 characters
- Colors: Valid HSL format
- Font size: 10-24px
- Heading scale: 1-2
- Line height: 1-2.5
- Spacing scale: 0.5-2
- Border radius: 0-2rem
- Animation duration: 0-1000ms

### Accessibility

Themes consider accessibility:

**Color Contrast**:
- Minimum contrast ratios
- WCAG AA compliance
- Readable text colors
- Clear focus indicators

**Typography**:
- Readable font sizes
- Appropriate line heights
- Clear heading hierarchy
- Sufficient spacing

## Performance Optimizations

### CSS Variables
- Instant theme switching
- No re-render required
- Minimal DOM updates
- Efficient browser handling

### Theme Caching
- Active theme cached in memory
- Reduces database queries
- Faster theme switching
- localStorage backup

### Lazy Loading
- Themes loaded on demand
- Preview images lazy loaded
- Reduced initial load time

## Testing

### Manual Testing Checklist

- [ ] Create new theme
- [ ] Edit theme colors
- [ ] Edit typography settings
- [ ] Edit spacing and density
- [ ] Edit visual effects
- [ ] Edit animations
- [ ] Preview theme changes
- [ ] Save theme
- [ ] Apply theme
- [ ] Set theme as default
- [ ] Delete theme
- [ ] Export theme to JSON
- [ ] Import theme from JSON
- [ ] Make theme public
- [ ] Get shareable link
- [ ] Get AI recommendations
- [ ] Test on mobile device
- [ ] Test theme persistence

### API Testing

```bash
# Create theme
curl -X POST http://localhost:3001/api/v1/theme \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Theme",
    "colors": {...},
    "typography": {...}
  }'

# Get AI recommendations
curl -X POST http://localhost:3001/api/v1/theme/recommend \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mood": "calm and focused",
    "preferences": "blue and green"
  }'

# Set as default
curl -X PATCH http://localhost:3001/api/v1/theme/$THEME_ID/set-default \
  -H "Authorization: Bearer $TOKEN"
```

## Troubleshooting

### Theme not applying

**Symptoms**: Theme changes don't appear

**Possible Causes**:
1. CSS variables not updating
2. Cache issue
3. Theme not saved

**Solutions**:
1. Hard refresh browser
2. Clear localStorage
3. Verify theme saved in database
4. Check browser console for errors

### AI recommendations failing

**Symptoms**: Error when requesting recommendations

**Possible Causes**:
1. Gemini API error
2. Invalid input
3. Rate limiting

**Solutions**:
1. Check Gemini API key
2. Verify input format
3. Wait and retry
4. Check backend logs

### Theme export/import not working

**Symptoms**: Can't export or import themes

**Possible Causes**:
1. Browser file API not supported
2. Invalid JSON format
3. File size too large

**Solutions**:
1. Use modern browser
2. Validate JSON format
3. Check file size
4. Check browser permissions

## Future Enhancements

### Planned Features

- [ ] Theme marketplace
- [ ] Theme templates
- [ ] Dark mode toggle
- [ ] Color accessibility checker
- [ ] Theme versioning
- [ ] Bulk theme operations
- [ ] Theme categories/tags
- [ ] Community ratings
- [ ] Theme previews
- [ ] Theme analytics

### Potential Improvements

- [ ] Advanced color tools
- [ ] Color palette generator
- [ ] Theme inheritance
- [ ] Theme variants
- [ ] Seasonal themes
- [ ] Automatic theme switching
- [ ] Time-based themes
- [ ] Location-based themes

## Related Documentation

- [API Reference](../API_REFERENCE.md#themes)
- [Gemini Integration](../integrations/gemini.md)
- [Web Architecture](../architecture/web-architecture.md)

