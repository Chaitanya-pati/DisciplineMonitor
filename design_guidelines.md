# Design Guidelines: Fitness & Productivity Tracker PWA

## Design Approach

**Reference-Based Approach** drawing inspiration from leading productivity and habit tracking applications: Notion (information hierarchy), Linear (clean aesthetics), Streaks (habit visualization), and Todoist (task management). This creates a modern, focused interface prioritizing clarity and efficiency over decorative elements.

**Design Principles:**
- Information density without clutter
- Quick data entry and visualization
- Clear visual hierarchy for multi-section app
- Mobile-first, thumb-friendly interactions

---

## Typography System

**Font Family:** Inter (Google Fonts) - exceptional readability at small sizes, excellent for data-dense interfaces

**Hierarchy:**
- **Page Titles:** 2xl (24px), semibold (600)
- **Section Headers:** xl (20px), semibold (600)
- **Card/Component Titles:** lg (18px), medium (500)
- **Body Text:** base (16px), regular (400)
- **Labels/Meta:** sm (14px), medium (500)
- **Captions/Timestamps:** xs (12px), regular (400)
- **Numbers/Stats:** 3xl-4xl (30-36px), bold (700) for key metrics

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, and 8
- Component padding: p-4 or p-6
- Section spacing: mb-6 or mb-8
- Card gaps: gap-4
- Icon-text spacing: gap-2
- Screen padding: px-4 (mobile), max-w-7xl mx-auto (desktop)

**Screen Structure:**
- Fixed bottom navigation (h-16)
- Scrollable content area with pb-20 (bottom nav clearance)
- Sticky headers where needed (top-0 sticky)
- Safe area padding for mobile devices

---

## Component Library

### Navigation
**Bottom Tab Bar** (5 tabs):
- Home/Dashboard
- Fitness Checklist
- Tasks/Productivity
- Reports/Analytics
- Settings

Icon + label, active state with filled icon and accent indicator

### Core UI Elements

**Cards:**
- Rounded corners (rounded-xl)
- Subtle shadow (shadow-sm)
- White background with border (border border-gray-200)
- Padding p-4 to p-6

**Progress Indicators:**
- Circular progress rings for daily scores (stroke-based SVG)
- Horizontal progress bars (h-2, rounded-full)
- Percentage badges (inline with progress)

**Input Types:**
- Toggle switches for Yes/No
- Number steppers (+/- buttons with centered value)
- Sliders with value indicator
- Dropdown selects (native mobile feel)
- Timer inputs (number pad optimized)

**Buttons:**
- Primary: Solid fill, rounded-lg, py-3 px-6, font-medium
- Secondary: Border style, same sizing
- Icon buttons: Rounded-full, p-2
- FAB (Floating Action Button): Fixed bottom-right for quick add

**List Items:**
- Checklist items: Left checkbox/icon, title, right action/value, py-3
- Task items: Priority indicator (colored dot), title, metadata row, right arrow
- Drag handles: Left side, subtle icon

### Dashboard Components

**Daily Score Card:**
- Large circular progress at top
- Score number centered (large, bold)
- Completion ratio below (6/7 completed)
- Streak count with fire icon

**Quick Stats Grid:**
- 2x2 grid on mobile, 4 columns on desktop
- Each stat: Icon, large number, small label
- Examples: Current streak, tasks completed, water intake, steps

**Today's Checklist Preview:**
- Scrollable horizontal cards showing next 3-4 items
- Each card: Icon, title, current/target value, quick action button

**Motivation Quote:**
- Minimal card with quote text (italic)
- Author attribution in small text
- Background subtle gradient or image overlay

### Fitness Checklist Screen

**Checklist Builder:**
- List of user-created items (draggable)
- Each item expandable to show edit options
- Add new button (FAB or bottom of list)

**Daily Entry View:**
- Item card for each checklist entry
- Input control prominent and easy to tap
- Instant visual feedback on completion
- Progress indicator at top showing daily completion

### Task Management Screen

**Task List:**
- Grouped by priority or date
- Swipe actions (complete, delete, postpone)
- Expandable for subtasks
- Visual priority indicators (colored left border)

**Pomodoro Timer:**
- Large circular timer display
- Start/Pause controls (large tap targets)
- Session counter dots below
- Current task name at top

**Procrastination Dialog:**
- Modal when task postponed
- Reason selection (large tap targets)
- Suggested micro-action card
- Delay counter display

### Reports/Analytics Screen

**Chart Visualizations:**
- Line charts for trends (7-day, 30-day views)
- Bar charts for habit comparison
- Heatmap calendar for streak visualization
- Legend with color coding

**Insights Cards:**
- Icon representing insight type
- Bold insight statement
- Supporting data/percentage
- Actionable suggestion

**Time Period Selector:**
- Segmented control (Week/Month/Year)
- Sticky at top of scroll area

---

## Mobile Optimization

**Touch Targets:**
- Minimum 44x44px for all interactive elements
- Generous padding in list items (min h-12)
- Adequate spacing between tappable elements (gap-3 minimum)

**Gestures:**
- Swipe to complete/delete tasks
- Pull to refresh on lists
- Drag to reorder checklist items
- Swipe between tabs (if implemented)

**Performance:**
- Minimize animations (only use for feedback: checkmark completion, progress updates)
- Lazy load charts and historical data
- Optimize list rendering for large datasets

---

## Images

This is a data-focused utility app without traditional marketing needs. **No hero images required.**

**Icon Usage:**
- Use **Heroicons** (outline for inactive, solid for active states)
- Consistent icon sizing: w-5 h-5 for inline, w-6 h-6 for standalone
- Motivational quote cards may include subtle background patterns (CSS gradients)

**Data Visualization:**
- Use chart library (Chart.js or Recharts) for analytics
- Consistent color scheme across all charts
- Clear axis labels and legends

---

## Visual Polish

**Feedback Animations (subtle only):**
- Checkmark bounce on completion
- Progress bar smooth fill
- Card scale on tap (scale-95 active state)
- Skeleton loaders for data fetching

**Empty States:**
- Centered icon + message
- Clear call-to-action button
- Friendly, encouraging copy

**Error States:**
- Inline validation messages
- Toast notifications for actions
- Retry options for failures