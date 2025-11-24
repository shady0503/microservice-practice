# 🎫 UrbanMove - Complete User Flow Documentation

## Overview

This document describes the complete end-to-end user journey through the UrbanMove ticketing system, from searching for a route to tracking the bus in real-time.

---

## User Journey Steps

### 1. Landing Page (`/`)

**Purpose**: Introduce the platform and encourage users to search or sign up

**Key Elements**:
- Hero section with call-to-action
- Feature showcase (6 features)
- Statistics section
- "Book a Ride" button → `/search`
- "Sign In" button → `/login`

**Actions**:
- User clicks "Book a Ride" → Navigate to `/search`
- User clicks "Sign In" → Navigate to `/login`
- User clicks "Create Free Account" → Navigate to `/register`

---

### 2. Search Page (`/search`)

**Purpose**: Allow users to search for available bus routes

**Required Input**:
- From location (latitude, longitude)
- To location (latitude, longitude)
- Optional: Address labels
- Travel date

**Flow**:
```
User enters origin/destination coordinates
  ↓
User clicks "Search Routes" (or uses demo data)
  ↓
API Call: routeService.searchRoutes()
  ↓
Store search params + results in Zustand
  ↓
Navigate to /lines with query params
```

**State Changes**:
- `searchParams` → Stored in Zustand
- `searchResults` → Stored in Zustand
- Navigation → `/lines?fromLat=...&toLat=...`

**Error Handling**:
- Invalid coordinates → Show error banner
- Network error → Show error with retry

---

### 3. Bus Lines Page (`/lines`)

**Purpose**: Display available bus lines from search results

**Data Source**:
- Zustand store (`searchResults`)
- URL query params (as backup)

**Display**:
- List of available lines (animated stagger)
- Each line shows:
  - Line reference/name
  - Duration
  - Price
  - Next departure time
  - Number of stops

**Flow**:
```
Page loads with search results
  ↓
Display list of lines (animated)
  ↓
User clicks a line card
  ↓
Store selected line in Zustand
  ↓
Navigate to /lines/:lineId/buses
```

**State Changes**:
- `selectedLine` → Stored in Zustand
- Navigation → `/lines/L12/buses` (example)

---

### 4. Bus List Page (`/lines/:lineId/buses`)

**Purpose**: Show available buses for the selected line

**Data Source**:
- API Call: `busService.getBusesByLine(lineId)`
- React Query caching

**Display**:
- Bus cards showing:
  - Bus number
  - Capacity (progress bar)
  - Available seats
  - Status (Active/Inactive)
  - Current location (if available)
  - ETA

**Filtering**:
- Only show ACTIVE buses
- Filter by direction (based on search params)

**Flow**:
```
Page loads
  ↓
Fetch buses from API (React Query)
  ↓
Display filtered list (animated)
  ↓
User clicks a bus card
  ↓
Store selected bus in Zustand
  ↓
Navigate to /buses/:busId/reserve
```

**State Changes**:
- `selectedBus` → Stored in Zustand
- Navigation → `/buses/BUS_001/reserve`

**Loading States**:
- Show skeleton cards while loading
- Show spinner on error with retry

---

### 5. Reservation Page (`/buses/:busId/reserve`)

**Purpose**: Allow user to select seats and enter passenger details

**Components**:
- **Seat Selector** (left side):
  - Grid layout (4 columns: 2-2 with aisle)
  - Color-coded seats:
    - Green = Available
    - Blue = Selected
    - Gray = Occupied
  - Max 4 seats per booking
  - Interactive selection

- **Passenger Form** (right side):
  - Full name (pre-filled if logged in)
  - Email (pre-filled if logged in)
  - Phone number

- **Booking Summary** (right side):
  - Selected seats list
  - Price per seat
  - Total price
  - "Continue to Payment" button

**Flow**:
```
Page loads
  ↓
User selects seats (1-4)
  ↓
User fills passenger details
  ↓
User clicks "Continue to Payment"
  ↓
Validation:
  - At least 1 seat selected
  - Name + email filled
  ↓
Store reservation in Zustand
  ↓
Navigate to /payment
```

**State Changes**:
- `reservation.seats` → Array of seat numbers
- `reservation.passengers` → Array with passenger info
- `reservation.totalPrice` → Calculated price
- Navigation → `/payment`

**Validation**:
- Minimum 1 seat selected
- Required fields: name, email
- Show error banner if validation fails

---

### 6. Payment Page (`/payment`)

**Purpose**: Select payment method and complete booking

**Payment Methods**:
1. Credit/Debit Card
2. Mobile Payment
3. Pay on Bus (cash)

**Order Summary**:
- Route (origin → destination)
- Bus number
- Selected seats
- Passenger name
- Total amount

**Flow**:
```
Page loads
  ↓
User selects payment method
  ↓
User clicks "Confirm & Pay"
  ↓
API Call 1: ticketService.createTicket()
  {
    userId, busId, lineRef,
    fromStation, toStation,
    seatNumber, passengerName,
    price, travelDate
  }
  ↓
API Call 2: ticketService.payTicket(ticketId)
  (Uses Idempotency-Key header)
  ↓
Store ticket in Zustand
  ↓
Navigate to /ticket/:ticketId
```

**State Changes**:
- `payment.method` → Selected payment method
- `ticket` → Created ticket object
- Navigation → `/ticket/TKT_12345`

**Error Handling**:
- Show error banner if creation fails
- Allow retry
- Don't navigate until both API calls succeed

---

### 7. Ticket Page (`/ticket/:ticketId`)

**Purpose**: Display ticket with QR code

**Data Source**:
- API Call: `ticketService.getTicket(ticketId)`
- React Query with 10s refetch interval

**Display**:
- ✅ Success message (green banner)
- Ticket card with:
  - Status badge (Paid, Confirmed, etc.)
  - Route information
  - Bus details
  - Travel date/time
  - Passenger info
  - Price
  - **QR Code** (ticket ID encoded)

**Actions**:
1. Download (placeholder - would generate PDF)
2. Share (native share API or copy link)
3. **Track Bus** → Navigate to `/track/:ticketId`

**Flow**:
```
Page loads
  ↓
Fetch ticket from API
  ↓
Display ticket with QR code
  ↓
User clicks "Track Bus"
  ↓
Navigate to /track/:ticketId
```

**QR Code**:
- Encodes: ticket ID
- Size: 200x200px
- Error correction: High (H)
- Used by: Driver to scan and verify

---

### 8. Live Tracking Page (`/track/:ticketId`)

**Purpose**: Track bus in real-time on map

**Data Sources**:
1. Ticket info: `ticketService.getTicket(ticketId)`
2. GPS location: WebSocket connection

**WebSocket Flow**:
```
Component mounts
  ↓
Connect to: ws://localhost:8080/ws/gps-tracking?ticketId=...
  ↓
Listen for GPS updates
  {
    latitude: number,
    longitude: number,
    speed: number,
    timestamp: string
  }
  ↓
Update map marker position (smooth animation)
  ↓
Display current location in info panel
```

**Display**:
- **Interactive Map** (left 2/3):
  - Leaflet/OpenStreetMap
  - Bus marker (custom icon)
  - Smooth position updates
  - Route polyline (if available)
  - Stop markers

- **Info Panel** (right 1/3):
  - Trip information
  - Live location (lat/lon, speed)
  - Connection status (animated dot)
  - ETA (if available)

**Connection States**:
- Connected: Green badge, receiving updates
- Disconnected: Red badge, attempting reconnect
- Reconnection: Exponential backoff (max 5 attempts)

**Flow**:
```
Page loads
  ↓
Fetch ticket info
  ↓
Connect to GPS WebSocket
  ↓
Receive location updates in real-time
  ↓
Update map position smoothly
  ↓
Display in info panel
```

---

## State Management Architecture

### Zustand Store (Booking)

**Persisted Data** (sessionStorage):
```javascript
{
  searchParams: { fromLat, fromLon, toLat, toLon, fromAddress, toAddress, date },
  selectedLine: { lineRef, lineName, price, duration, ... },
  selectedBus: { id, busNumber, capacity, status, ... },
  reservation: {
    passengers: [{ name, email, phone }],
    seats: [1, 2, 3],
    totalPrice: 45
  }
}
```

**Non-Persisted Data** (memory):
```javascript
{
  searchResults: [...],
  payment: { method, status },
  ticket: { id, status, ... }
}
```

### React Query Cache

**Queries**:
- `['route', routeId]` - Route details
- `['buses', 'line', lineRef]` - Buses for a line
- `['bus', busId]` - Single bus
- `['ticket', ticketId]` - Ticket (refetch every 10s)
- `['tickets', 'user', userId]` - User's tickets

**Mutations**:
- `createTicket` - Create new ticket
- `payTicket` - Process payment
- `cancelTicket` - Cancel ticket

---

## API Integration

### Route Service (Port 8082)

```
GET /api/search?fromLat=...&fromLon=...&toLat=...&toLon=...
Response: [{ line, lineName, duration, price, fare, stops }]
```

### Bus Service (Port 8080)

```
GET /api/buses/line/{lineRef}
Response: [{ id, busNumber, lineRef, capacity, occupied, status }]
```

### Ticket Service (Port 8080)

```
POST /api/v1/tickets
Headers: { Idempotency-Key: uuid }
Body: { userId, busId, lineRef, fromStation, toStation, ... }
Response: { id, status, ... }

POST /api/v1/tickets/{id}/pay
Headers: { Idempotency-Key: uuid }
Response: { id, status: 'PAID', ... }

GET /api/v1/tickets/{id}
Response: { id, status, busNumber, passengerName, ... }
```

### GPS Tracking (WebSocket)

```
WS ws://localhost:8080/ws/gps-tracking?ticketId={id}
Message: { latitude, longitude, speed, timestamp }
```

---

## Navigation Flow Diagram

```
┌─────────────┐
│   HomePage  │ → /
└──────┬──────┘
       │ "Book a Ride"
       ▼
┌─────────────┐
│ SearchPage  │ → /search
└──────┬──────┘
       │ Search routes
       ▼
┌─────────────┐
│BusLinesPage │ → /lines?from=...&to=...
└──────┬──────┘
       │ Select line
       ▼
┌─────────────┐
│ BusListPage │ → /lines/:lineId/buses
└──────┬──────┘
       │ Select bus
       ▼
┌─────────────┐
│ReservationP.│ → /buses/:busId/reserve
└──────┬──────┘
       │ Fill details + select seats
       ▼
┌─────────────┐
│ PaymentPage │ → /payment
└──────┬──────┘
       │ Select method + pay
       ▼
┌─────────────┐
│ TicketPage  │ → /ticket/:ticketId
└──────┬──────┘
       │ "Track Bus"
       ▼
┌─────────────┐
│LiveTracking │ → /track/:ticketId
└─────────────┘
```

---

## Animations & Transitions

### Page Transitions
- **Type**: Fade + Slide
- **Duration**: 400ms
- **Easing**: Anticipate
- **Effect**:
  - Enter: opacity 0→1, x -20→0
  - Exit: opacity 1→0, x 0→20

### List Animations
- **Type**: Stagger children
- **Delay**: 100ms per item
- **Effect**: Each item fades up (y: 20→0)

### Card Hover
- **Scale**: 1.0 → 1.02
- **Shadow**: Increase on hover
- **Type**: Spring animation

### Loading States
- **Skeleton**: Shimmer effect (gradient moving)
- **Spinner**: Rotating circle
- **Progress**: Animated width with spring

### Success Indicators
- **Checkmark**: Path animation (drawSVG effect)
- **QR Code**: Fade in + scale up
- **Badge**: Pulse animation for status

---

## Error Handling

### Levels

1. **Field Validation** (inline)
   - Show error below input field
   - Red border on invalid input
   - Clear on correction

2. **Form Validation** (banner)
   - Show ErrorBanner at top of form
   - List all errors
   - Allow dismissal

3. **API Errors** (banner + retry)
   - Show ErrorBanner with error message
   - Provide "Retry" button
   - Log to console for debugging

4. **Network Errors** (global)
   - Show offline message
   - Auto-retry with exponential backoff
   - Reconnect when online

5. **Crash Errors** (boundary)
   - ErrorBoundary catches React errors
   - Show fallback UI
   - Offer "Go Home" or "Reload"

---

## Protected Routes

### Public Routes
- `/` - Homepage
- `/login` - Login
- `/register` - Register
- `/search` - Search (anyone can search)
- All booking flow pages (tickets can be bought by guests)

### Protected Routes (require auth)
- `/dashboard` - User dashboard
- `/profile` - User profile
- `/settings` - User settings
- `/tickets` - My tickets
- `/admin` - Admin panel (ADMIN role only)

### Route Guards
- `<ProtectedRoute>` component
- Checks `user` from AuthContext
- Redirects to `/login` if not authenticated
- Stores intended destination in location state
- Redirects back after login

---

## Mobile Responsiveness

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Responsive Patterns

**SearchPage**:
- Mobile: Stack form fields vertically
- Desktop: Grid layout for coordinates

**BusLinesPage**:
- Mobile: 1 column grid
- Tablet: 2 columns
- Desktop: 3 columns

**ReservationPage**:
- Mobile: Stack seat selector and form vertically
- Desktop: Side-by-side (2 columns)

**LiveTrackingPage**:
- Mobile: Map full width, info below
- Desktop: Map 2/3, info panel 1/3

**DashboardLayout**:
- Mobile: Hamburger menu
- Desktop: Full navigation bar

---

## Performance Optimizations

1. **React Query Caching**
   - Stale time: 5 minutes
   - Cache time: 30 minutes
   - Automatic background refetch

2. **Code Splitting**
   - Route-based splitting (React Router)
   - Lazy loading for pages
   - Suspense boundaries

3. **Image Optimization**
   - Use WebP format
   - Lazy loading for images
   - Responsive images

4. **Zustand Persistence**
   - Only persist essential data
   - Use sessionStorage (cleared on tab close)
   - Avoid storing large objects

5. **WebSocket Reconnection**
   - Exponential backoff
   - Max 5 reconnection attempts
   - Clean disconnection on unmount

---

## Testing the Flow

### Manual Test Checklist

- [ ] Load homepage
- [ ] Click "Book a Ride"
- [ ] Use demo data on SearchPage
- [ ] See list of lines
- [ ] Click a line
- [ ] See list of buses
- [ ] Click a bus
- [ ] Select 2 seats
- [ ] Fill passenger details
- [ ] Continue to payment
- [ ] Select payment method
- [ ] Complete payment
- [ ] See ticket with QR code
- [ ] Click "Track Bus"
- [ ] See map (may not have live data)
- [ ] Back to ticket
- [ ] Navigate to dashboard
- [ ] See ticket in recent tickets

### Test Data

**Demo Coordinates**:
- From: `33.9716, -6.8498` (Rabat Ville)
- To: `33.9931, -6.8579` (Agdal)

**Expected Lines**: Based on backend data
**Expected Buses**: Active buses on selected line

---

## Future Enhancements

1. **Offline Support**
   - Service worker
   - Offline ticket viewing
   - Queue actions for when online

2. **Push Notifications**
   - Bus approaching stop
   - Delay notifications
   - Boarding reminders

3. **Multi-language Support**
   - i18n integration
   - Arabic + French + English

4. **Favorites & History**
   - Save frequent routes
   - Quick rebooking
   - Travel statistics

5. **Payment Integration**
   - Real payment gateway (Stripe, PayPal)
   - Mobile money integration
   - Split payments

---

## Summary

The UrbanMove booking flow provides a seamless, 8-step journey from searching for routes to tracking buses in real-time. With proper error handling, smooth animations, and a mobile-responsive design, users can book tickets quickly and track their buses with confidence.

**Key Features**:
- ✅ Complete booking workflow
- ✅ Real-time GPS tracking
- ✅ QR code tickets
- ✅ Smooth animations (Framer Motion)
- ✅ Proper routing (React Router)
- ✅ Centralized state (Zustand + React Query)
- ✅ Responsive design (Tailwind CSS)
- ✅ Error handling & retry logic

---

*Last updated: 2025-11-24*
*Version: 1.0*
