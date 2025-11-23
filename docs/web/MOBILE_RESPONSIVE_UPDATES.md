# Mobile Responsive Updates

## Overview
The web application has been converted to be fully mobile-responsive across all pages and components. The updates use Tailwind CSS responsive breakpoints (sm, md, lg) to ensure optimal viewing on all device sizes.

## Key Changes

### 1. Layout & Metadata
- **Root Layout** (`web/app/layout.tsx`)
  - Added viewport metadata for proper mobile scaling
  - Set initial-scale=1 and maximum-scale=5

### 2. Landing Page (`web/app/page.tsx`)
- Hero section text scales from 4xl → 5xl → 6xl → 7xl
- Buttons stack vertically on mobile, horizontal on desktop
- Feature cards use responsive grid: 1 column (mobile) → 2 columns (tablet) → 3 columns (desktop)
- Reduced padding on mobile (py-12 → py-20)

### 3. Headers

#### Landing Header (`web/components/landing-header.tsx`)
- Added mobile hamburger menu with slide-down navigation
- Desktop navigation hidden on mobile
- CTA buttons stack vertically in mobile menu
- Logo text scales responsively

#### App Header (`web/app/app/app-header.tsx`)
- Mobile hamburger menu for navigation
- User email hidden on small screens
- Navigation items stack vertically on mobile
- Sign out button full-width on mobile

### 4. Journal Pages

#### Journal List (`web/app/app/journal/page.tsx`)
- Header and controls stack vertically on mobile
- View mode buttons show icons only on mobile
- Entry cards: 1 column (mobile) → 2 columns (tablet) → 3 columns (desktop)
- Date headers wrap on mobile
- Search bar full-width on all devices

#### Journal Entry Detail (`web/app/app/journal/[id]/page.tsx`)
- Title and action buttons stack vertically on mobile
- Badges wrap and use smaller text on mobile
- Edit/Save buttons show icons only on mobile
- Textarea rows reduced for mobile (12 rows)
- Date format shortened on mobile (PP instead of PPP)

#### New Entry (`web/app/app/journal/new/page.tsx`)
- Form buttons stack vertically on mobile
- Microphone buttons use icon-only on mobile
- Textarea optimized for mobile (10 rows)
- All buttons full-width on mobile

### 5. AI Coach Page (`web/app/app/coach/page.tsx`)
- Layout changes from row to column on mobile
- **Mobile Suggested Questions**: Collapsible section above chat (mobile only)
  - Toggle button with question count badge
  - Expands to show all suggested questions
  - Auto-closes after selecting a question
- Suggested prompts sidebar remains visible on desktop (lg:block)
- Chat messages max-width: 95% (mobile) → 85% (tablet) → 80% (desktop)
- Input controls stack better on mobile
- Insights/Clear buttons show shortened text on mobile
- Chat card height: 500px (mobile) → 600px (desktop)

### 6. Coach Sessions Sidebar (`web/components/coach-sessions-sidebar.tsx`)
- Collapsible on mobile with floating menu button
- Full-width on mobile when open
- Overlay backdrop on mobile
- Auto-collapse after session selection on mobile
- Responsive padding and text sizes

### 7. Settings Page (`web/app/app/settings/page.tsx`)
- Header and actions stack vertically on mobile
- Prompt cards: 1 column (mobile) → 2 columns (tablet) → 3 columns (desktop)
- Dialog max-width: 95vw (mobile) → 3xl (desktop)
- New Prompt button full-width on mobile

### 8. Footer (`web/components/footer.tsx`)
- Grid: 1 column (mobile) → 2 columns (tablet) → 4 columns (desktop)
- Brand section spans 2 columns on tablet
- Social icons and copyright stack vertically on mobile
- Reduced padding on mobile

### 9. Global CSS (`web/app/globals.css`)
- Added mobile-friendly touch targets (min 44px)
- Prevented horizontal scroll on mobile
- Improved text rendering on mobile devices
- Better font smoothing for mobile

## Responsive Breakpoints Used

- **sm**: 640px (small tablets and large phones)
- **md**: 768px (tablets)
- **lg**: 1024px (desktops)

## Mobile-First Approach

All components now follow a mobile-first approach:
1. Base styles target mobile devices
2. Responsive classes (sm:, md:, lg:) progressively enhance for larger screens
3. Touch targets meet accessibility standards (44px minimum)
4. Text remains readable at all sizes
5. No horizontal scrolling on any device

## Testing Recommendations

Test the application on:
- iPhone SE (375px width)
- iPhone 12/13/14 (390px width)
- iPad (768px width)
- iPad Pro (1024px width)
- Desktop (1280px+ width)

## Browser Compatibility

All changes use standard Tailwind CSS classes and are compatible with:
- Safari (iOS and macOS)
- Chrome (Android and Desktop)
- Firefox
- Edge

## Performance Considerations

- No additional JavaScript libraries added
- CSS-only responsive design
- Minimal impact on bundle size
- Maintains existing performance characteristics
