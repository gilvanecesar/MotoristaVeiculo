# Design Guidelines: Quero Fretes - Brazilian Freight Management System

## Design Approach
**Selected System:** Carbon Design System (IBM) - optimized for data-heavy enterprise applications with excellent dark theme support and table/form patterns.

**Key Principles:**
- Functional hierarchy over decoration
- Information density balanced with breathing room
- Professional, trustworthy aesthetic
- Efficient task completion flows

## Typography
**Font Stack:** Inter (Google Fonts)
- Headings: 600 weight, tracking-tight
- Body: 400 weight, leading-relaxed
- Data/Tables: 500 weight, tabular-nums for alignment
- Labels: 500 weight, text-sm, uppercase tracking-wide

**Hierarchy:**
- H1: text-2xl lg:text-3xl
- H2: text-xl lg:text-2xl
- H3: text-lg lg:text-xl
- Body: text-sm lg:text-base
- Small/Meta: text-xs

## Layout System
**Spacing Units:** Tailwind units of 2, 4, 6, and 8 as primary spacing (p-4, gap-6, mt-8)
- Component padding: p-4 to p-6
- Section spacing: py-6 to py-8
- Card gaps: gap-4 to gap-6

**Grid Structure:**
- Sidebar: Fixed w-64 on desktop, collapsible to w-16 (icon-only), full overlay on mobile
- Main content: Full width with max-w-7xl container, px-4 lg:px-8
- Dashboard cards: grid-cols-1 md:grid-cols-2 xl:grid-cols-3, gap-6
- Data tables: Full width scrollable containers

## Component Library

### Navigation
**Sidebar (#00222d background, white text):**
- Logo/Brand at top (h-16)
- Navigation items with icons (h-12 each, px-4)
- Active state: subtle white/10 background, border-l-2 accent
- Collapsed state: Show icons only, tooltip on hover
- Bottom section: User profile, settings, logout

**Top Bar:**
- Height: h-16
- Search input (w-full max-w-md), notifications bell, user avatar dropdown
- Breadcrumbs below on content pages

### Data Display
**Tables (shadcn Table):**
- Striped rows with hover states
- Sticky header
- Row actions (kebab menu right-aligned)
- Pagination footer
- Column sorting indicators
- Bulk selection checkboxes
- Empty states with illustration + CTA

**Cards:**
- Rounded-lg, p-6
- Header with icon + title + action button
- Content area with metric/chart/list
- Footer with secondary actions or metadata

**Stat Cards:**
- Large number display (text-3xl font-bold)
- Label above, trend indicator below
- Icon in top-right corner
- Compact height (h-32)

### Forms
**Input Fields (shadcn Input):**
- Label above (text-sm font-medium mb-2)
- Helper text below when needed
- Error states with red text-sm
- Full width within container, max-w-md for single-column forms

**Form Layout:**
- Two-column grid on desktop (grid-cols-2 gap-6)
- Single column on mobile
- Action buttons right-aligned in footer

**Toggles/Switches (shadcn Switch):**
- Label inline (justify-between flex items-center)
- Use in settings panels and table filters

### Actions
**Buttons (shadcn Button):**
- Primary: Solid, medium size default
- Secondary: Outline variant
- Destructive: Red variant for delete actions
- Icon buttons: Square, ghost variant
- Loading states with spinner

**Filters Panel:**
- Collapsible on mobile
- Multi-select dropdowns, date range pickers
- Apply/Reset button pair at bottom

## Admin Page Structures

### Dashboard (Home)
- Stat cards row (4 metrics: Total Shipments, Active Routes, Revenue, Pending)
- Chart section (2 columns: Line chart for trends, Pie chart for status distribution)
- Recent activity table (10 rows)
- Quick actions card

### Freight List
- Filter bar at top (Status dropdown, Date range, Search)
- Data table with columns: ID, Client, Origin, Destination, Status badge, Value, Actions
- 20 rows per page with pagination
- Bulk action toolbar when selecting

### Freight Detail
- Header with ID, status badge, edit button
- 3-column info grid: Client details, Route info, Financial data
- Timeline component showing freight progression
- Documents section with upload area
- Notes/Comments section at bottom

### Create/Edit Forms
- Stepper navigation at top (Client Info → Route Details → Pricing → Review)
- Form sections in cards
- Validation feedback inline
- Save draft + Submit buttons

## Images
**No hero images needed.** This is an admin dashboard focused on functionality.

**Illustrations:**
- Empty states: Simple line illustrations (undraw.co style)
- Error pages: Friendly but professional illustrations
- Onboarding: Feature explanation graphics

**Icons:**
- Lucide React (consistent with shadcn)
- Sidebar: Truck, Package, MapPin, Users, Settings, BarChart
- Actions: Plus, Edit, Trash2, MoreVertical, Download

## Responsive Behavior
- Mobile: Sidebar overlays, single-column forms, horizontal scroll tables
- Tablet: Sidebar visible, 2-column forms, optimized tables
- Desktop: Full layout, 3-column cards, expanded tables