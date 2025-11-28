# UrbanMove - Frontend-Backend Integration Notes

## 🎯 Integration Summary

This document outlines the complete integration of all backend microservices with the frontend React application.

## 📋 Services Overview

### Backend Services
1. **User Service** (Port 8081) - Authentication, user management, roles
2. **Trajet Service** (Port 8082) - Bus lines, routes, stops
3. **Ticket Service** (Port 8083) - Ticket booking, payment processing
4. **Bus Service** (Port 8080) - Bus fleet management, real-time GPS tracking

### Frontend Application
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS 4
- **UI Components**: Custom components with Radix UI
- **Icons**: Lucide React
- **Maps**: Leaflet & React-Leaflet
- **QR Codes**: qrcode.react

## 🔗 Integration Features

### 1. Authentication & User Management
- ✅ User registration and login with JWT tokens
- ✅ Role-based access control (USER, ADMIN, DRIVER)
- ✅ Profile viewing and editing
- ✅ Password change functionality
- ✅ Admin user management (CRUD operations, role updates)

### 2. Ticket Booking System
- ✅ Route search by origin/destination
- ✅ Live bus selection for routes
- ✅ Ticket purchase with payment processing
- ✅ QR code generation for tickets
- ✅ Ticket history with status tracking (PAID, RESERVED, CANCELLED, EXPIRED)
- ✅ Idempotency support for duplicate prevention

### 3. Real-time Bus Tracking
- ✅ WebSocket integration for live GPS updates
- ✅ Interactive map with bus positions
- ✅ Dynamic ETA calculations
- ✅ Bus occupancy status display

### 4. Route Management
- ✅ Browse all bus lines and routes
- ✅ View route details with stops
- ✅ Multi-directional route support (going/return/circular)
- ✅ Geographic route search

### 5. Admin Dashboard
- ✅ User management (view, edit, delete, role assignment)
- ✅ Bus fleet monitoring and management
- ✅ Route and line overview
- ✅ Tabbed interface for organized administration

## 🔧 Key Technical Solutions

### UUID Conversion (User ID ↔ Ticket Service)
**Problem**: User Service uses Long IDs, but Ticket Service requires UUIDs.

**Solution**: Implemented deterministic UUID conversion using UUIDv5:
```javascript
// frontend/src/lib/uuidHelper.js
import { v5 as uuidv5 } from 'uuid'

const URBANMOVE_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341'

export const userIdToUUID = (userId) => {
  const userIdString = String(userId)
  return uuidv5(userIdString, URBANMOVE_NAMESPACE)
}
```

### Port Configuration
- ✅ Fixed ticket service endpoints to use correct port (8083 instead of 8080)
- ✅ Configured Vite proxy for `/api/v1` → `http://localhost:8083`

### Error Handling
- ✅ Comprehensive error messages for all API calls
- ✅ Loading states for async operations
- ✅ Retry functionality for failed requests
- ✅ User-friendly error displays

## 📱 Frontend Routes

### Public Routes
- `/` - Landing page
- `/login` - User login
- `/signup` - User registration

### Protected Routes (Authenticated)
- `/dashboard` - User dashboard with:
  - **Booking** - Search and book tickets
  - **My Tickets** - View ticket history with QR codes
  - **Profile** - View/edit user information
  - **Settings** - Change password, notification preferences

### Admin Routes
- `/dashboard` (Admin view) includes:
  - **Users Tab** - Manage all users
  - **Buses Tab** - Monitor bus fleet
  - **Routes Tab** - View lines and routes

## 🎨 UI/UX Enhancements

### Design System
- Modern glassmorphism effects
- Gradient backgrounds and accents
- Smooth animations with Framer Motion
- Responsive design (mobile-first approach)
- Consistent color palette (blue/indigo/purple theme)

### Components Created/Enhanced
1. **BookingFlow** - Multi-step booking process
2. **TicketHistory** - Ticket listing with QR code modal
3. **BusManagement** - Bus fleet overview for admins
4. **RouteManagement** - Route and line management
5. **AdminDashboardTabs** - Tabbed admin interface
6. **UserProfile** - Enhanced profile editing
7. **UserSettings** - Password change and preferences

## 🔌 API Integration Summary

### User Service Integration
```
POST /api/auth/register - Register new user
POST /api/auth/login - Authenticate user
GET /api/users/me - Get current user
PUT /api/users/{id} - Update user
POST /api/users/change-password - Change password
GET /api/users/admin/all - Get all users (Admin)
PUT /api/users/admin/{id}/role - Update role (Admin)
DELETE /api/users/{id} - Delete user (Admin)
```

### Ticket Service Integration
```
GET /api/v1/tickets?userId={uuid} - Get user tickets
POST /api/v1/tickets - Create ticket (with Idempotency-Key)
POST /api/v1/tickets/{id}/pay - Process payment
```

### Trajet Service Integration
```
GET /api/search?fromLat&fromLon&toLat&toLon - Search routes
GET /api/lines - Get all lines
GET /api/lines/{ref}/complete - Get line details with routes
```

### Bus Service Integration
```
GET /api/buses - Get all buses
GET /api/buses/line/{lineCode} - Get buses for line
WS ws://localhost:8080/ws/gps-tracking - Real-time GPS updates
```

## 📦 Dependencies Added

```json
{
  "@radix-ui/react-slot": "^1.0.2",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.1.0",
  "leaflet": "^1.9.4",
  "lucide-react": "^0.344.0",
  "qrcode.react": "^3.1.0",
  "react-leaflet": "^4.2.1",
  "react-router-dom": "^6.22.3",
  "tailwind-merge": "^2.2.1",
  "uuid": "^9.0.1"
}
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- All backend services running on their respective ports
- PostgreSQL databases configured for each service
- Kafka running for event-driven communication

### Installation
```bash
cd frontend
npm install
```

### Development
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Build
```bash
npm run build
```

## 🧪 Testing the Integration

### 1. User Flow
1. Register a new user at `/signup`
2. Login at `/login`
3. Navigate to booking tab
4. Search for a route (demo: Rabat Ville → Agdal)
5. Select a bus
6. Complete payment (test card: **** 4242)
7. View QR code in ticket viewer
8. Check "My Tickets" tab for history

### 2. Admin Flow
1. Login as admin user
2. Navigate to admin section
3. **Users Tab**: View all users, update roles, delete users
4. **Buses Tab**: Monitor bus fleet, view status
5. **Routes Tab**: Browse lines, view route details

## 🐛 Known Issues & Solutions

### Issue: CORS Errors
**Solution**: Backend services are configured with CORS enabled. If issues persist, use Vite proxy configuration.

### Issue: User ID Type Mismatch
**Solution**: Implemented UUID conversion helper using UUIDv5 for consistent mapping.

### Issue: WebSocket Connection Fails
**Solution**: Ensure bus-service is running on port 8080 and WebSocket endpoint is accessible.

## 🔐 Security Considerations

- ✅ JWT tokens stored in localStorage
- ✅ Authorization headers included in all authenticated requests
- ✅ Role-based access control enforced
- ✅ Idempotency keys prevent duplicate transactions
- ✅ Password encryption (BCrypt) on backend
- ⚠️ Consider implementing refresh token rotation
- ⚠️ Add HTTPS in production
- ⚠️ Implement rate limiting

## 📈 Future Enhancements

### High Priority
- [ ] Implement token refresh mechanism
- [ ] Add real payment gateway integration
- [ ] Implement ticket expiration cleanup job
- [ ] Add push notifications
- [ ] Implement offline support with service workers

### Medium Priority
- [ ] Add favorite routes feature
- [ ] Implement trip history analytics
- [ ] Add multi-language support (i18n)
- [ ] Implement dark mode
- [ ] Add email verification flow

### Low Priority
- [ ] Add social sharing for trips
- [ ] Implement trip planning with multiple routes
- [ ] Add weather integration
- [ ] Create mobile app with React Native

## 📚 Documentation

- **API Documentation**: See individual service README files
- **Component Documentation**: JSDoc comments in component files
- **Architecture**: See main README.md

## 👥 Contributors

This integration was completed as part of the UrbanMove microservices project.

## 📄 License

This project is part of an academic exercise supervised by Pr. Mahmoud Nassar.

---

**Last Updated**: November 28, 2024
**Version**: 1.0.0
**Status**: ✅ Fully Integrated
