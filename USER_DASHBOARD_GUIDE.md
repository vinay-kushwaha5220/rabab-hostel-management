# 🎨 User Dashboard - Visual Guide

## Overview

The User Dashboard is the central hub for renters/customers to manage their bookings and account.

---

## Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│                    GRADIENT HEADER                          │
│         Welcome back, [User Name]!                          │
│         Manage your bookings and account                    │
└─────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┐
│ 📋 Active    │ 🏠 Total     │ 💰 Total     │
│ Bookings     │ Bookings     │ Spent        │
│    [#]       │    [#]       │   ₹[Amount]  │
└──────────────┴──────────────┴──────────────┘

┌──────────────┬──────────────┬──────────────┐
│ 🔍 Browse    │ ✉️ Contact   │ 👤 My        │
│ Rooms        │ Admin        │ Profile      │
│ Find perfect │ Get help &   │ Update your  │
│ stay         │ support      │ details      │
└──────────────┴──────────────┴──────────────┘

┌─────────────────────────────────────────────┐
│         ACTIVE BOOKINGS                     │
├─────────────────────────────────────────────┤
│ [Status] Booking ID: RBS-2026-001           │
│ Deluxe AC Room                              │
│ Room: 101 | Check-in: 15/05 | Amount: ₹5000│
│ [View Details] [Contact Admin]              │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│         PAST BOOKINGS                       │
├─────────────────────────────────────────────┤
│ [Completed] Booking ID: RBS-2026-002        │
│ Standard Non-AC Room                        │
│ Room: 205 | Check-in: 01/05 | Amount: ₹3000│
│ [View Details]                              │
└─────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Header Section
```
┌─────────────────────────────────────────────┐
│  Gradient Background (Blue → Indigo)        │
│                                             │
│  Welcome back, Vinay!                       │
│  Manage your bookings and account           │
│                                             │
└─────────────────────────────────────────────┘
```

**Features:**
- Gradient background (blue-600 to indigo-700)
- Large heading (4xl)
- User name personalization
- Subtitle text

---

### 2. Quick Stats Cards

#### Active Bookings Card
```
┌─────────────────────────┐
│ 📋                  [3] │ ← Large number
│ Active Bookings         │ ← Label
│                         │
│ Blue border on left     │
└─────────────────────────┘
```

#### Total Bookings Card
```
┌─────────────────────────┐
│ 🏠                  [5] │
│ Total Bookings          │
│                         │
│ Green border on left    │
└─────────────────────────┘
```

#### Total Spent Card
```
┌─────────────────────────┐
│ 💰            ₹15,000   │
│ Total Spent             │
│                         │
│ Purple border on left   │
└─────────────────────────┘
```

**Design:**
- White background
- Rounded corners (xl)
- Shadow (md)
- Colored left border (4px)
- Icon in colored circle
- Large number (3xl, bold)
- Small label (sm, gray)

---

### 3. Quick Action Cards

#### Browse Rooms
```
┌─────────────────────────────────┐
│ 🔍  Browse Rooms                │
│     Find your perfect stay      │
│                                 │
│ Hover: Shadow increases         │
└─────────────────────────────────┘
```

#### Contact Admin
```
┌─────────────────────────────────┐
│ ✉️  Contact Admin               │
│     Get help & support          │
│                                 │
│ Hover: Shadow increases         │
└─────────────────────────────────┘
```

#### My Profile
```
┌─────────────────────────────────┐
│ 👤  My Profile                  │
│     Update your details         │
│                                 │
│ Hover: Shadow increases         │
└─────────────────────────────────┘
```

**Design:**
- White background
- Rounded corners (xl)
- Shadow (md → lg on hover)
- Icon in colored circle
- Title (semibold)
- Description (sm, gray)
- Clickable button
- Smooth transitions

---

### 4. Active Bookings Section

```
┌─────────────────────────────────────────────────────────┐
│ Active Bookings                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ [CONFIRMED] Booking ID: RBS-2026-001                    │
│                                                         │
│ Deluxe AC Room                                          │
│                                                         │
│ Room Number    Check-in      Check-out     Total Amount│
│ 101            15/05/2026    20/05/2026    ₹5,000      │
│                                                         │
│                    [View Details] [Contact Admin]       │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Green status badge
- Booking ID in gray
- Room title (xl, bold)
- Grid of details (4 columns)
- Two action buttons
- Full opacity
- Hover shadow effect

---

### 5. Past Bookings Section

```
┌─────────────────────────────────────────────────────────┐
│ Past Bookings                                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ [COMPLETED] Booking ID: RBS-2026-002                    │
│                                                         │
│ Standard Non-AC Room                                    │
│                                                         │
│ Room Number    Check-in      Check-out     Total Amount│
│ 205            01/05/2026    05/05/2026    ₹3,000      │
│                                                         │
│                              [View Details]             │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Gray/Red status badge
- Booking ID in gray
- Room title (xl, bold)
- Grid of details (4 columns)
- One action button
- Reduced opacity (75%)
- Hover shadow effect

---

### 6. Empty State

```
┌─────────────────────────────────────────────┐
│                                             │
│              ┌─────────┐                    │
│              │   📋    │                    │
│              └─────────┘                    │
│                                             │
│         No Bookings Yet                     │
│                                             │
│  Start your journey by booking your first   │
│  room!                                      │
│                                             │
│      [Browse Available Rooms]               │
│                                             │
└─────────────────────────────────────────────┘
```

**Features:**
- Large icon in gray circle
- Heading (2xl, bold)
- Description text
- Blue CTA button
- Centered layout
- Encouraging message

---

## Color Palette

### Primary Colors
- **Blue**: #2563EB (Primary actions, borders)
- **Indigo**: #4F46E5 (Gradient, accents)
- **Green**: #059669 (Success, confirmed)
- **Purple**: #7C3AED (Spending, premium)
- **Red**: #DC2626 (Cancelled, alerts)
- **Yellow**: #D97706 (Pending, warnings)

### Neutral Colors
- **Gray-50**: #F9FAFB (Background)
- **Gray-100**: #F3F4F6 (Light backgrounds)
- **Gray-600**: #4B5563 (Secondary text)
- **Gray-900**: #111827 (Primary text)
- **White**: #FFFFFF (Cards, surfaces)

---

## Typography

### Headings
- **Hero**: 4xl (36px), Bold
- **Section**: 2xl (24px), Bold
- **Card Title**: xl (20px), Bold
- **Stat Number**: 3xl (30px), Bold

### Body Text
- **Primary**: base (16px), Regular
- **Secondary**: sm (14px), Regular
- **Label**: sm (14px), Semibold
- **Caption**: xs (12px), Regular

---

## Spacing

### Padding
- **Cards**: p-6 (24px)
- **Sections**: p-4 (16px)
- **Buttons**: px-6 py-2 (24px, 8px)

### Margins
- **Section Bottom**: mb-8 (32px)
- **Element Bottom**: mb-4 (16px)
- **Small Gap**: mb-2 (8px)

### Gaps
- **Grid**: gap-6 (24px)
- **Flex**: gap-4 (16px)
- **Small**: gap-2 (8px)

---

## Responsive Breakpoints

### Desktop (1024px+)
```
[Stat 1] [Stat 2] [Stat 3]
[Action 1] [Action 2] [Action 3]
[Booking Card - Full Width]
```

### Tablet (768px - 1023px)
```
[Stat 1] [Stat 2]
[Stat 3]
[Action 1] [Action 2]
[Action 3]
[Booking Card - Full Width]
```

### Mobile (< 768px)
```
[Stat 1]
[Stat 2]
[Stat 3]
[Action 1]
[Action 2]
[Action 3]
[Booking Card - Stacked]
```

---

## Interactions

### Hover Effects
- **Cards**: shadow-md → shadow-lg
- **Buttons**: bg-blue-600 → bg-blue-700
- **Action Cards**: Icon background lightens

### Click Actions
- **View Details**: Navigate to booking details
- **Contact Admin**: Navigate to contact page
- **Browse Rooms**: Navigate to rooms page
- **My Profile**: Navigate to profile page

### Loading State
```
┌─────────────────────────────────┐
│                                 │
│         ⟳ Loading...            │
│                                 │
└─────────────────────────────────┘
```

---

## Status Badges

### Confirmed (Green)
```
[CONFIRMED]
bg-green-100 text-green-800
```

### Pending (Yellow)
```
[PENDING]
bg-yellow-100 text-yellow-800
```

### Completed (Gray)
```
[COMPLETED]
bg-gray-100 text-gray-800
```

### Cancelled (Red)
```
[CANCELLED]
bg-red-100 text-red-800
```

---

## Icons Used

- 📋 Clipboard (Active Bookings)
- 🏠 Home (Total Bookings)
- 💰 Currency (Total Spent)
- 🔍 Search (Browse Rooms)
- ✉️ Email (Contact Admin)
- 👤 User (My Profile)

---

## User Actions Flow

```
Dashboard
    ↓
┌───────────────────────────────┐
│ What would you like to do?    │
├───────────────────────────────┤
│ → Browse Rooms                │
│ → View Active Bookings        │
│ → Contact Admin               │
│ → Update Profile              │
│ → View Past Bookings          │
└───────────────────────────────┘
```

---

## Best Practices

### Do's ✅
- Use consistent spacing
- Maintain color hierarchy
- Show loading states
- Provide empty states
- Use hover effects
- Keep it responsive
- Show clear CTAs

### Don'ts ❌
- Don't overcrowd cards
- Don't use too many colors
- Don't hide important actions
- Don't forget mobile users
- Don't skip loading states

---

## Accessibility

- ✅ Semantic HTML
- ✅ Proper heading hierarchy
- ✅ Color contrast (WCAG AA)
- ✅ Keyboard navigation
- ✅ Focus indicators
- ✅ Alt text for icons
- ✅ Descriptive buttons

---

## Performance

- ✅ Lazy loading
- ✅ Optimized images
- ✅ Minimal re-renders
- ✅ Efficient state management
- ✅ Fast API calls

---

**The User Dashboard provides a professional, OYO-style experience for managing bookings!** 🎨✨
