# 🏗️ Frontend Architecture Refactor Plan

## Executive Summary

This document outlines the complete refactor of the UrbanMove frontend application to modernize the codebase, implement proper routing, and fully integrate the ticketing workflow.

---

## 1. Current State Analysis

### ✅ Strengths
- **React 19**: Latest version with modern features
- **Tailwind CSS v4**: Modern utility-first styling
- **Feature-based structure**: Good component organization
- **Context API**: Working authentication system
- **Reusable UI components**: Shadcn-style component library started

### ❌ Critical Issues
1. **Manual state-based routing**: No React Router, not scalable
2. **Fragmented booking flow**: Components exist but not integrated
3. **Hardcoded API endpoints**: localhost URLs scattered everywhere
4. **No animation framework**: Static UI, no transitions
5. **Incomplete error handling**: Missing error boundaries and retry logic
6. **No data fetching library**: Manual fetch calls everywhere
7. **Dead code**: Wrapper components with minimal value
8. **Security issues**: Tokens in localStorage (XSS vulnerable)

---

## 2. New Architecture

### 2.1 Technology Stack Additions

```json
{
  "dependencies": {
    "react-router-dom": "^6.x",
    "framer-motion": "^11.x",
    "@tanstack/react-query": "^5.x",
    "zustand": "^4.x",
    "axios": "^1.x"
  }
}
```

**Rationale:**
- **React Router v6**: Industry standard for routing with nested layouts
- **Framer Motion**: Best-in-class animation library for React
- **React Query**: Automatic caching, background updates, optimistic updates
- **Zustand**: Lightweight state management for booking flow state
- **Axios**: Better error handling and interceptors than fetch

### 2.2 Directory Structure (New)

```
frontend/src/
├── components/
│   ├── ui/                          # Base UI components (existing + new)
│   │   ├── button.jsx               ✅ EXISTS
│   │   ├── card.jsx                 ✅ EXISTS
│   │   ├── input.jsx                ✅ EXISTS
│   │   ├── dialog.jsx               🔧 FIX (implement properly)
│   │   ├── loading-spinner.jsx      ⭐ NEW
│   │   ├── error-banner.jsx         ⭐ NEW
│   │   ├── skeleton.jsx             ⭐ NEW
│   │   ├── badge.jsx                ⭐ NEW
│   │   ├── progress.jsx             ⭐ NEW
│   │   └── qr-code.jsx              ⭐ NEW (wrapper for qrcode.react)
│   │
│   ├── layout/                      ⭐ NEW DIRECTORY
│   │   ├── RootLayout.jsx           # App shell with header/footer
│   │   ├── AuthLayout.jsx           ✅ MOVE from /auth
│   │   ├── DashboardLayout.jsx      ⭐ NEW (replaces UserDashboard navigation)
│   │   ├── PublicLayout.jsx         ⭐ NEW
│   │   └── PageTransition.jsx       ⭐ NEW (Framer Motion wrapper)
│   │
│   ├── auth/                        # Clean up
│   │   ├── LoginForm.jsx            ✅ KEEP
│   │   ├── RegisterForm.jsx         ✅ KEEP
│   │   ├── LoginPage.jsx            ❌ DELETE (redundant wrapper)
│   │   ├── RegisterPage.jsx         ❌ DELETE (redundant wrapper)
│   │   └── AuthPage.jsx             ❌ DELETE (unused)
│   │
│   ├── user/                        # User management (mostly keep)
│   │   ├── UserProfile.jsx          ✅ KEEP
│   │   ├── UserSettings.jsx         ✅ KEEP
│   │   ├── AdminDashboard.jsx       ✅ KEEP
│   │   └── UserService.jsx          ❌ DELETE (minimal wrapper)
│   │
│   ├── booking/                     🔧 MAJOR REFACTOR
│   │   ├── SearchPage.jsx           🔧 REFACTOR (add animations, remove hardcoded coords)
│   │   ├── BusLinesPage.jsx         ⭐ NEW (list lines from search)
│   │   ├── BusListPage.jsx          🔧 REFACTOR BusSelectionPage
│   │   ├── ReservationPage.jsx      ⭐ NEW (seat selection + passenger details)
│   │   ├── PaymentPage.jsx          🔧 REFACTOR (add animations, better UX)
│   │   ├── TicketPage.jsx           ⭐ NEW (QR code display)
│   │   ├── LiveTrackingPage.jsx     🔧 REFACTOR TicketViewer
│   │   │
│   │   └── components/              ⭐ NEW (booking sub-components)
│   │       ├── LineCard.jsx         # Animated bus line card
│   │       ├── BusCard.jsx          # Animated bus card
│   │       ├── RouteMap.jsx         # Small map preview
│   │       ├── LiveMap.jsx          # Real-time tracking map
│   │       ├── SeatSelector.jsx     # Seat selection grid
│   │       └── TicketCard.jsx       # Ticket display card
│   │
│   └── shared/                      ⭐ NEW (cross-cutting components)
│       ├── ProtectedRoute.jsx       # Route guard
│       ├── ErrorBoundary.jsx        # Error boundary
│       └── AppProviders.jsx         # All providers wrapper
│
├── pages/                           ⭐ NEW (page-level components)
│   ├── HomePage.jsx                 # Landing page
│   ├── LoginPage.jsx                # Auth pages
│   ├── RegisterPage.jsx
│   ├── DashboardPage.jsx            # User dashboard
│   ├── ProfilePage.jsx
│   ├── SettingsPage.jsx
│   ├── AdminPage.jsx
│   └── NotFoundPage.jsx             ⭐ NEW
│
├── services/                        🔧 MAJOR EXPANSION
│   ├── api/
│   │   ├── client.js                ⭐ NEW (axios instance with interceptors)
│   │   ├── auth.service.js          🔧 REFACTOR (from api.js)
│   │   ├── user.service.js          🔧 REFACTOR (from api.js)
│   │   ├── ticket.service.js        ⭐ NEW
│   │   ├── bus.service.js           ⭐ NEW
│   │   └── route.service.js         ⭐ NEW (trajet service)
│   │
│   └── websocket/
│       └── gps-tracking.service.js  ⭐ NEW (encapsulate WebSocket)
│
├── stores/                          ⭐ NEW (Zustand stores)
│   └── bookingStore.js              # Booking flow state
│
├── hooks/                           ⭐ NEW (custom hooks)
│   ├── useAuth.js                   🔧 MOVE from AuthContext
│   ├── useBooking.js                ⭐ NEW
│   ├── useGPSTracking.js            ⭐ NEW
│   ├── queries/                     # React Query hooks
│   │   ├── useSearchRoutes.js
│   │   ├── useBuses.js
│   │   ├── useTickets.js
│   │   └── useUsers.js
│
├── config/                          ⭐ NEW
│   ├── api.config.js                # API base URLs (env-based)
│   ├── routes.config.js             # Route definitions
│   └── constants.js                 # App constants
│
├── utils/                           🔧 EXPAND
│   ├── lib/utils.js                 ✅ KEEP (existing utils)
│   ├── validation.js                ⭐ NEW
│   ├── formatting.js                ⭐ NEW
│   └── error-handling.js            ⭐ NEW
│
├── contexts/
│   └── AuthContext.jsx              🔧 SIMPLIFY (move logic to hooks)
│
├── App.jsx                          🔧 MAJOR REFACTOR (routing)
└── main.jsx                         🔧 UPDATE (add providers)
```

---

## 3. Routing Architecture

### 3.1 Route Structure

```javascript
/ (Public)
├── /                                 # Landing page
├── /login                            # Login
├── /register                         # Register
│
├── /search                           # 🎫 Start booking flow
│   ├── /lines                        # View available lines
│   │   └── /lines/:lineId            # Line details
│   │       └── /buses                # Available buses
│   │           └── /buses/:busId     # Bus details
│   │               └── /reserve      # Reservation form
│   │                   └── /payment  # Payment
│   │                       └── /ticket/:ticketId  # Ticket view
│   │
│   └── /track/:ticketId              # Live tracking
│
└── /dashboard (Protected)            # User dashboard
    ├── /profile                      # User profile
    ├── /settings                     # Settings
    ├── /tickets                      # My tickets
    └── /admin                        # Admin panel (ADMIN only)
```

### 3.2 URL Parameter Strategy

| Route | Params | Query Params | Example |
|-------|--------|--------------|---------|
| `/search` | - | `from`, `to`, `date` | `/search?from=33.9716,-6.8498&to=33.9931,-6.8579` |
| `/lines` | - | Inherited from search | `/lines?from=...&to=...` |
| `/lines/:lineId` | `lineId` | - | `/lines/L12` |
| `/buses/:busId` | `busId` | `lineId` | `/buses/BUS_001?lineId=L12` |
| `/reserve/:busId` | `busId` | `lineId` | `/reserve/BUS_001?lineId=L12` |
| `/payment` | - | `reservationId` | `/payment?reservationId=abc123` |
| `/ticket/:ticketId` | `ticketId` | - | `/ticket/TKT_12345` |
| `/track/:ticketId` | `ticketId` | - | `/track/TKT_12345` |

### 3.3 Layout Hierarchy

```jsx
<BrowserRouter>
  <Routes>
    {/* Public routes */}
    <Route element={<PublicLayout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Route>

    {/* Booking flow (public + authenticated) */}
    <Route element={<RootLayout />}>
      <Route path="/search" element={<SearchPage />} />
      <Route path="/lines" element={<BusLinesPage />} />
      <Route path="/lines/:lineId/buses" element={<BusListPage />} />
      <Route path="/buses/:busId/reserve" element={<ReservationPage />} />
      <Route path="/payment" element={<PaymentPage />} />
      <Route path="/ticket/:ticketId" element={<TicketPage />} />
      <Route path="/track/:ticketId" element={<LiveTrackingPage />} />
    </Route>

    {/* Protected dashboard routes */}
    <Route element={<ProtectedRoute />}>
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/tickets" element={<MyTicketsPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Route>
    </Route>

    {/* 404 */}
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
</BrowserRouter>
```

---

## 4. State Management Strategy

### 4.1 State Layers

| Layer | Tool | Purpose | Persistence |
|-------|------|---------|-------------|
| **Server State** | React Query | API data, caching, background updates | Memory + Cache |
| **Auth State** | Context API | User session, permissions | localStorage |
| **Booking Flow** | Zustand | Multi-step booking state | sessionStorage |
| **UI State** | Local useState | Component-specific UI | None |

### 4.2 Booking Store (Zustand)

```javascript
// stores/bookingStore.js
{
  searchParams: { from, to, date },
  selectedLine: null,
  selectedBus: null,
  reservation: {
    passengers: [],
    seats: [],
    totalPrice: 0
  },
  payment: {
    method: null,
    status: 'pending'
  },
  ticket: null,

  // Actions
  setSearchParams,
  setSelectedLine,
  setSelectedBus,
  updateReservation,
  setPaymentStatus,
  setTicket,
  resetBooking
}
```

### 4.3 React Query Configuration

```javascript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 minutes
      cacheTime: 1000 * 60 * 30,      // 30 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
```

---

## 5. Animation Framework

### 5.1 Framer Motion Patterns

**Page Transitions:**
```javascript
const pageVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.4
};
```

**List Animations:**
```javascript
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};
```

**Card Hover Effects:**
```javascript
<motion.div
  whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 300 }}
>
```

### 5.2 Loading States

- **Skeleton screens** for initial loads
- **Shimmer animations** for loading cards
- **Spinner** for button actions
- **Progress bar** for multi-step flows

---

## 6. API Service Layer

### 6.1 Environment Configuration

```javascript
// config/api.config.js
export const API_CONFIG = {
  USER_SERVICE: import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:8081/api',
  BUS_SERVICE: import.meta.env.VITE_BUS_SERVICE_URL || 'http://localhost:8080/api',
  TICKET_SERVICE: import.meta.env.VITE_TICKET_SERVICE_URL || 'http://localhost:8080/api/v1',
  ROUTE_SERVICE: import.meta.env.VITE_ROUTE_SERVICE_URL || 'http://localhost:8082/api',
  WS_TRACKING: import.meta.env.VITE_WS_TRACKING_URL || 'ws://localhost:8080/ws/gps-tracking',
};
```

### 6.2 Axios Client

```javascript
// services/api/client.js
const apiClient = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: add auth token
apiClient.interceptors.request.use(config => {
  const token = tokenManager.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle errors globally
apiClient.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      tokenManager.clearTokens();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 6.3 Service API Methods

**Ticket Service:**
```javascript
// services/api/ticket.service.js
export const ticketService = {
  createTicket: (data) => POST('/tickets', data, { 'Idempotency-Key': uuid() }),
  getTicket: (id) => GET(`/tickets/${id}`),
  getUserTickets: (userId) => GET(`/tickets?userId=${userId}`),
  payTicket: (id) => POST(`/tickets/${id}/pay`, {}, { 'Idempotency-Key': uuid() }),
  cancelTicket: (id) => POST(`/tickets/${id}/cancel`),
};
```

**Bus Service:**
```javascript
// services/api/bus.service.js
export const busService = {
  getBusesByLine: (lineRef) => GET(`/buses/line/${lineRef}`),
  getBusById: (busId) => GET(`/buses/${busId}`),
};
```

**Route Service:**
```javascript
// services/api/route.service.js
export const routeService = {
  searchRoutes: ({ fromLat, fromLon, toLat, toLon }) =>
    GET(`/search?fromLat=${fromLat}&fromLon=${fromLon}&toLat=${toLat}&toLon=${toLon}`),
};
```

---

## 7. Complete User Flow Specification

### 7.1 Step-by-Step Journey

```
┌─────────────────┐
│  1. SearchPage  │  User inputs origin + destination
└────────┬────────┘
         │ Submit search
         ▼
┌─────────────────┐
│ 2. BusLinesPage │  Display lines ordered by ETA
└────────┬────────┘  Shows: Line name, duration, price, next departure
         │ Click line
         ▼
┌─────────────────┐
│ 3. BusListPage  │  Show buses for selected line (filtered by direction)
└────────┬────────┘  Shows: Bus number, capacity, next stop, ETA
         │ Click bus
         ▼
┌─────────────────┐
│ 4. ReservationPage │  Seat selection + passenger details
└────────┬────────┘     Shows: Seat map, passenger form, price summary
         │ Confirm reservation
         ▼
┌─────────────────┐
│ 5. PaymentPage  │  Payment method + confirmation
└────────┬────────┘  Shows: Order summary, payment options, T&C
         │ Pay
         ▼
┌─────────────────┐
│ 6. TicketPage   │  QR code + ticket details
└────────┬────────┘  Shows: QR, passenger info, bus info, route
         │ Click "Track Bus"
         ▼
┌─────────────────┐
│7.LiveTrackingPage│ Real-time bus location on map
└─────────────────┘  Shows: Live map, ETA, next stops, bus status
```

### 7.2 Data Flow Between Pages

| From | To | Data Passed | Method |
|------|-----|-------------|--------|
| SearchPage | BusLinesPage | `searchParams` (from, to, date) | URL query params |
| BusLinesPage | BusListPage | `lineId`, `searchParams` | URL params + Zustand |
| BusListPage | ReservationPage | `busId`, `lineId` | URL params + Zustand |
| ReservationPage | PaymentPage | `reservation` (seats, passengers, price) | Zustand store |
| PaymentPage | TicketPage | `ticketId` | URL param (after creation) |
| TicketPage | LiveTrackingPage | `ticketId` | URL param |

### 7.3 Events & Triggers

**SearchPage:**
- Event: Form submit
- Validation: Coordinates, date >= today
- API Call: `routeService.searchRoutes(params)`
- Success: Navigate to `/lines` with query params
- Error: Show error banner

**BusLinesPage:**
- Event: Page load
- API Call: Fetch from query params (already done in SearchPage)
- Display: List of lines with animations (stagger)
- Click: Store `selectedLine` in Zustand, navigate to `/lines/:lineId/buses`

**BusListPage:**
- Event: Page load
- API Call: `busService.getBusesByLine(lineId)`
- Filter: Only buses in the correct direction
- Display: Animated bus cards
- Click: Store `selectedBus`, navigate to `/buses/:busId/reserve`

**ReservationPage:**
- Event: Page load
- Display: Seat selector + passenger form
- Validation: At least 1 seat, valid passenger info
- Update: `bookingStore.updateReservation(data)`
- Click "Continue": Navigate to `/payment`

**PaymentPage:**
- Event: Page load
- API Call: `ticketService.createTicket(reservationData)`
- Display: Order summary, payment methods
- Click "Pay": `ticketService.payTicket(ticketId)`
- Success: Navigate to `/ticket/:ticketId`
- Error: Show error, allow retry

**TicketPage:**
- Event: Page load
- API Call: `ticketService.getTicket(ticketId)`
- Display: QR code, ticket details
- Generate: QR code with ticket ID
- Click "Track Bus": Navigate to `/track/:ticketId`

**LiveTrackingPage:**
- Event: Page load
- API Call: `ticketService.getTicket(ticketId)` (get bus info)
- WebSocket: Connect to GPS tracking
- Update: Real-time bus position on map
- Display: ETA, next stops, live location

---

## 8. Component Specifications

### 8.1 Core Pages

#### SearchPage
```javascript
// State: origin, destination, date, loading, errors
// API: routeService.searchRoutes()
// Animations: Fade in form, slide up results
// Validation: Coordinates format, future date
// Success: Navigate to /lines with query params
```

#### BusLinesPage
```javascript
// Props: searchParams from URL
// API: Already called in SearchPage, use React Query cache
// Display: Staggered list of line cards
// Click: Store line, navigate to /lines/:lineId/buses
// Animations: Container > stagger children
```

#### BusListPage
```javascript
// Props: lineId from URL
// API: busService.getBusesByLine(lineId)
// Filter: Direction based on search params
// Display: Bus cards with capacity, ETA
// Click: Store bus, navigate to /buses/:busId/reserve
// Animations: List stagger, card hover effects
```

#### ReservationPage
```javascript
// Props: busId from URL
// State: selectedSeats[], passengers[], price
// Components: SeatSelector, PassengerForm, PriceSummary
// Validation: Min 1 seat, valid passenger data
// Submit: Store in Zustand, navigate to /payment
// Animations: Step transitions, seat selection feedback
```

#### PaymentPage
```javascript
// Props: reservation from Zustand
// API: createTicket(), payTicket()
// Display: Order summary, payment method selector
// Flow: Create ticket → Pay → Navigate to ticket
// Animations: Loading spinner, success checkmark
// Error handling: Retry logic, error banner
```

#### TicketPage
```javascript
// Props: ticketId from URL
// API: ticketService.getTicket(ticketId)
// Display: QR code (qrcode.react), ticket details
// Actions: Download, Share, Track Bus
// Navigate: /track/:ticketId
// Animations: QR code fade in, details slide up
```

#### LiveTrackingPage
```javascript
// Props: ticketId from URL
// API: getTicket() for bus info
// WebSocket: Connect to GPS tracking
// Components: LiveMap (react-leaflet), BusInfo, ETADisplay
// Updates: Real-time position, recalculate ETA
// Animations: Map marker movement (smooth)
```

### 8.2 Shared Components

#### LineCard
```javascript
// Props: line { name, duration, price, nextDeparture }
// Display: Horizontal card with route visual
// Hover: Scale up, shadow increase
// Click: onSelect callback
```

#### BusCard
```javascript
// Props: bus { number, capacity, occupied, eta, status }
// Display: Bus icon, stats, capacity bar
// States: available, full, arriving
// Hover: Interactive feedback
```

#### LiveMap
```javascript
// Props: busPosition { lat, lon }, route
// Library: react-leaflet
// Markers: Bus (moving), stops, user location
// Updates: Smooth marker transitions
```

#### SeatSelector
```javascript
// Props: totalSeats, occupiedSeats[], onSelect
// Display: Grid layout (4 columns for bus)
// States: available, occupied, selected
// Click: Toggle seat selection
// Validation: Max seats per booking
```

#### ErrorBanner
```javascript
// Props: error, retry, onClose
// Display: Red banner with message
// Actions: Retry button, close X
// Animations: Slide down from top
```

#### LoadingSpinner
```javascript
// Props: size, color
// Animation: Framer Motion spinning circle
// Variants: Small (button), medium (inline), large (fullscreen)
```

#### Skeleton
```javascript
// Props: variant (card, list, text)
// Animation: Shimmer effect (gradient moving)
// Use: While loading API data
```

---

## 9. Error Handling Strategy

### 9.1 Error Boundary

```javascript
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### 9.2 API Error Handling

| Error Type | Status Code | Action |
|------------|-------------|--------|
| Unauthorized | 401 | Clear tokens, redirect to login |
| Forbidden | 403 | Show error message, redirect to dashboard |
| Not Found | 404 | Show error banner, allow retry |
| Validation | 400 | Show field errors inline |
| Server Error | 500 | Show generic error, offer retry |
| Network Error | - | Show offline message, auto-retry |

### 9.3 Retry Logic

```javascript
const useRetryableQuery = (queryKey, queryFn, maxRetries = 3) => {
  return useQuery({
    queryKey,
    queryFn,
    retry: (failureCount, error) => {
      if (error.response?.status === 404) return false;
      return failureCount < maxRetries;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
```

---

## 10. Performance Optimizations

### 10.1 Code Splitting

```javascript
const BusLinesPage = lazy(() => import('./components/booking/BusLinesPage'));
const PaymentPage = lazy(() => import('./components/booking/PaymentPage'));
// Wrap in <Suspense fallback={<LoadingSpinner />}>
```

### 10.2 React Query Caching

- **Stale time**: 5 minutes for route searches
- **Cache time**: 30 minutes for bus/line data
- **Background refetch**: Disabled for booking flow
- **Optimistic updates**: For seat selection

### 10.3 Image Optimization

- Use WebP format with PNG fallback
- Lazy load images below fold
- Use `loading="lazy"` attribute

### 10.4 Bundle Size

- Tree-shake unused Tailwind classes (automatic in v4)
- Import only needed Framer Motion features
- Use route-based code splitting

---

## 11. Migration Plan

### Phase 1: Foundation (No Breaking Changes)
1. ✅ Install dependencies
2. ✅ Create new directory structure (parallel to old)
3. ✅ Set up API service layer with environment config
4. ✅ Create shared UI components
5. ✅ Set up React Query and Zustand

### Phase 2: Routing (Gradual Migration)
6. ✅ Install React Router
7. ✅ Create layout components
8. ✅ Set up route definitions
9. ✅ Migrate landing page to new routing
10. ✅ Keep old navigation as fallback

### Phase 3: Booking Flow (New Feature)
11. ✅ Build all booking pages
12. ✅ Integrate with ticket-service APIs
13. ✅ Add animations with Framer Motion
14. ✅ Test complete flow end-to-end

### Phase 4: Cleanup (Remove Legacy)
15. ✅ Remove old routing logic from App.jsx
16. ✅ Delete redundant wrapper components
17. ✅ Remove dead code
18. ✅ Update documentation

### Phase 5: Polish
19. ✅ Add loading states everywhere
20. ✅ Implement error boundaries
21. ✅ Optimize performance
22. ✅ Accessibility audit

---

## 12. Naming Conventions

### Files
- **Components**: PascalCase (`SearchPage.jsx`, `LineCard.jsx`)
- **Utilities**: camelCase (`validation.js`, `formatting.js`)
- **Hooks**: camelCase with `use` prefix (`useAuth.js`)
- **Services**: camelCase with `.service.js` suffix (`ticket.service.js`)

### Components
- **Pages**: `*Page` suffix (`SearchPage`, `DashboardPage`)
- **Layouts**: `*Layout` suffix (`RootLayout`, `AuthLayout`)
- **Cards**: `*Card` suffix (`LineCard`, `BusCard`)
- **Forms**: `*Form` suffix (`LoginForm`, `PassengerForm`)

### Functions
- **Event handlers**: `handle*` prefix (`handleSubmit`, `handleClick`)
- **API calls**: verb + noun (`searchRoutes`, `createTicket`)
- **Utility functions**: verb + noun (`formatDate`, `validateEmail`)

### Constants
- **All caps with underscores**: `API_CONFIG`, `ROUTE_PATHS`
- **Grouped by purpose**: `USER_ROLES`, `TICKET_STATUS`

---

## 13. Testing Strategy (Future)

While not implemented in this refactor, the new architecture supports:

1. **Unit tests**: For utilities, hooks, services
2. **Component tests**: For UI components (React Testing Library)
3. **Integration tests**: For booking flow (Cypress/Playwright)
4. **E2E tests**: For critical user journeys

---

## 14. Success Criteria

### ✅ Functional Requirements
- [ ] Complete booking flow: Search → Pay → Ticket
- [ ] Real-time bus tracking with WebSocket
- [ ] QR code generation for tickets
- [ ] Responsive design (mobile + desktop)
- [ ] Proper routing with browser history
- [ ] Error handling with retry logic

### ✅ Non-Functional Requirements
- [ ] Page transitions < 400ms
- [ ] API calls with loading states
- [ ] No console errors or warnings
- [ ] Clean, maintainable code
- [ ] Minimal code duplication
- [ ] Proper TypeScript types (if migrating to TS)

### ✅ User Experience
- [ ] Smooth animations (60fps)
- [ ] Intuitive navigation
- [ ] Clear error messages
- [ ] Loading feedback
- [ ] Mobile-friendly touch targets

---

## 15. Rollback Plan

If critical issues arise:

1. **Git branch**: All changes on feature branch
2. **Gradual rollout**: New routing coexists with old
3. **Feature flags**: Toggle new booking flow
4. **Quick revert**: `git revert` to previous commit

---

## 16. Next Steps After Refactor

1. **Accessibility audit**: Add ARIA labels, keyboard navigation
2. **Performance monitoring**: Add analytics, error tracking
3. **TypeScript migration**: Gradual conversion to TS
4. **Testing**: Add comprehensive test coverage
5. **PWA features**: Offline support, push notifications
6. **Internationalization**: Multi-language support

---

## Conclusion

This refactor transforms the UrbanMove frontend from a prototype into a production-ready application with:

- ✅ Modern routing architecture
- ✅ Complete ticketing workflow
- ✅ Smooth animations and transitions
- ✅ Centralized API service layer
- ✅ Proper error handling
- ✅ Clean, maintainable code structure

**Estimated effort**: 40-60 hours for complete implementation
**Risk level**: Low (feature branch, gradual migration)
**Impact**: High (enables full ticketing service integration)

---

*Last updated: 2025-11-24*
*Version: 1.0*
*Author: Senior Frontend Architect*
