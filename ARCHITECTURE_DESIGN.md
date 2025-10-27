# B2B Platform - User Schema Enhancement Architecture

## 1. OVERVIEW

This document outlines the comprehensive architecture for enhancing the User schema with business-critical fields and integrating them throughout the frontend and backend of the B2B platform.

## 2. SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  React Components                                               │
│  ├── Onboarding (Multi-step)                                   │
│  ├── Settings (Tabbed Interface)                               │
│  ├── Business Profile (Display)                                │
│  └── Search/Discovery (Filters)                                │
├─────────────────────────────────────────────────────────────────┤
│  State Management (Zustand)                                     │
│  ├── authStore (User data & authentication)                    │
│  ├── appStore (App-level settings)                             │
│  └── New: businessStore (Business metrics & analytics)         │
├─────────────────────────────────────────────────────────────────┤
│  Services & API Layer                                           │
│  ├── authService (Login, Register, Profile Updates)            │
│  ├── userService (CRUD operations)                             │
│  └── New: subscriptionService (Billing & Plans)                │
└─────────────────────────────────────────────────────────────────┘
                              ▼ HTTP/REST API
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  Routes & Controllers                                           │
│  ├── /api/auth (Registration, Login, Token Refresh)            │
│  ├── /api/users (Profile, Search, Friends)                     │
│  ├── /api/users/business-profile (Business Info)               │
│  ├── /api/users/business-analytics (Metrics)                   │
│  └── New: /api/subscriptions (Billing, Plans, Upgrades)        │
├─────────────────────────────────────────────────────────────────┤
│  Middleware                                                      │
│  ├── Authentication (JWT Verification)                          │
│  ├── Validation (express-validator)                            │
│  ├── Rate Limiting                                              │
│  └── New: Subscription Access Control                          │
├─────────────────────────────────────────────────────────────────┤
│  Business Logic Layer                                           │
│  ├── User Service (Profile management)                         │
│  ├── Verification Service (Document verification)              │
│  ├── Analytics Service (Metrics calculation)                   │
│  └── New: Subscription Service (Plan management)               │
├─────────────────────────────────────────────────────────────────┤
│  Data Models (MongoDB/Mongoose)                                 │
│  ├── User (Enhanced schema)                                    │
│  ├── Product, Post, Community, etc.                            │
│  └── New: Subscription, Transaction, Review                    │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                             │
│  MongoDB with Indexes & Aggregations                           │
└─────────────────────────────────────────────────────────────────┘
```

## 3. ENHANCED USER SCHEMA STRUCTURE

### 3.1 New Field Categories

**A. Business/Tax Information**
- `gst` - GST number (String, validated format)
- `pan` - PAN card number (String, validated format)
- `businessType` - enum: ['manufacturer', 'wholesaler', 'retailer', 'distributor']
- `businessRegistrationNumber` - Business license number
- `yearEstablished` - Year (Number, 1900-current)
- `employeeCount` - enum: ['1-10', '11-50', '51-200', '201-500', '500+']

**B. Financial/Transaction**
- `bankDetails` - Object {accountNumber, ifscCode, accountHolderName, bankName}
- `paymentMethods` - Array of enums: ['upi', 'cash', 'card', 'netbanking', 'cheque']
- `creditTerms` - String (e.g., "30 days", "60 days")
- `minimumOrderValue` - Number
- `currency` - String (default: 'INR')

**C. Business Metrics (calculated/updated)**
- `rating` - Number (0-5, default 0)
- `totalReviews` - Number (default 0)
- `totalOrders` - Number (default 0)
- `responseTime` - Number (in minutes)
- `completionRate` - Number (0-100 percentage)
- `trustScore` - Number (0-100, platform-calculated)

**D. Business Hours**
- `businessHours` - Array [{day, openTime, closeTime, isClosed}]
- `timezone` - String (default: 'Asia/Kolkata')

**E. Catalog/Inventory**
- `totalProducts` - Number (auto-calculated)
- `catalogUrl` - String (external catalog link)
- `supplyCapacity` - Object {quantity, unit, period}
- `leadTime` - String (e.g., "3-5 days")

**F. Shipping/Logistics**
- `shippingMethods` - Array of enums: ['own_delivery', 'third_party', 'pickup']
- `returnPolicy` - Object {accepted, duration, conditions}
- `warrantyOffered` - Boolean

**G. Social/Marketing**
- `socialMedia` - Object {instagram, facebook, linkedin, twitter}
- `certifications` - Array [{name, issuedBy, expiryDate, documentUrl}]
- `awards` - Array [{title, issuedBy, year}]
- `featuredProducts` - Array of Product ObjectIds

**H. Platform Engagement**
- `subscriptionTier` - enum: ['free', 'basic', 'premium', 'enterprise']
- `subscriptionExpiry` - Date
- `featuredUntil` - Date
- `adCredits` - Number (default 0)
- `referralCode` - String (unique)
- `referredBy` - User ObjectId

**I. Preferences & Security**
- `emailVerified` - Boolean
- `phoneVerified` - Boolean
- `twoFactorEnabled` - Boolean
- `autoReplyMessage` - String
- `vacationMode` - Object {enabled, from, to, message}

## 4. DATABASE DESIGN

### 4.1 User Collection Indexes
```javascript
// Existing indexes
- email (unique)
- username (unique)
- firebaseUid (sparse, unique)
- shopLocation.city
- categories

// New indexes
- gst (sparse, unique)
- pan (sparse, unique)
- businessRegistrationNumber (sparse)
- subscriptionTier
- rating (descending)
- trustScore (descending)
- businessType
- referralCode (unique, sparse)
- { "shopLocation.coordinates": "2dsphere" } // Geospatial index
```

### 4.2 New Related Collections

**Subscription Collection**
```javascript
{
  user: ObjectId,
  tier: String,
  startDate: Date,
  endDate: Date,
  status: String,
  paymentHistory: Array,
  features: Object
}
```

**Review Collection**
```javascript
{
  reviewer: ObjectId,
  reviewee: ObjectId,
  rating: Number,
  comment: String,
  orderId: ObjectId,
  createdAt: Date
}
```

**Transaction Collection**
```javascript
{
  buyer: ObjectId,
  seller: ObjectId,
  amount: Number,
  status: String,
  paymentMethod: String,
  createdAt: Date
}
```

## 5. BACKEND IMPLEMENTATION PLAN

### 5.1 Schema Updates (backend/models/User.js)
- Add all new fields with proper validation
- Add computed virtuals for metrics
- Add indexes for performance
- Add pre/post hooks for calculations

### 5.2 New Routes & Controllers

**A. Update backend/routes/auth.js**
- Enhanced registration with business info
- Email/phone verification endpoints
- 2FA setup endpoints

**B. Update backend/routes/users.js**
- PUT /api/users/business-info (Update business details)
- PUT /api/users/financial-info (Update bank/payment info)
- PUT /api/users/business-hours (Update operating hours)
- GET /api/users/metrics (Get calculated metrics)
- POST /api/users/verify-documents (Upload verification docs)
- GET /api/users/subscription (Get subscription details)

**C. Create backend/routes/subscriptions.js**
- GET /api/subscriptions/plans (List available plans)
- POST /api/subscriptions/upgrade (Upgrade subscription)
- POST /api/subscriptions/payment (Process payment)
- GET /api/subscriptions/history (Payment history)

**D. Create backend/routes/reviews.js**
- POST /api/reviews (Submit review)
- GET /api/reviews/:userId (Get user reviews)
- GET /api/reviews/stats/:userId (Get rating stats)

### 5.3 Validation Schemas
Create backend/validators/ directory with:
- userValidator.js (Profile validation)
- businessValidator.js (Business info validation)
- financialValidator.js (Bank/payment validation)
- verificationValidator.js (Document validation)

### 5.4 Middleware Enhancements
- subscriptionMiddleware.js (Check tier access)
- verificationMiddleware.js (Check verification status)
- Update auth.js with 2FA support

### 5.5 Services Layer
Create backend/services/ directory:
- verificationService.js (Handle document verification)
- analyticsService.js (Calculate metrics/scores)
- subscriptionService.js (Manage subscriptions)
- emailService.js (Already exists - enhance)

## 6. FRONTEND IMPLEMENTATION PLAN

### 6.1 State Management

**Update src/store/authStore.js**
```javascript
- Add new user fields to state
- updateBusinessInfo(data)
- updateFinancialInfo(data)
- updateBusinessHours(data)
- uploadVerificationDocument(file)
- enableTwoFactor()
- setVacationMode(settings)
```

**Create src/store/subscriptionStore.js**
```javascript
- currentPlan
- availablePlans
- paymentHistory
- fetchPlans()
- upgradePlan(tier)
- processPayment(details)
```

**Create src/store/metricsStore.js**
```javascript
- businessMetrics
- analytics
- fetchMetrics()
- updateMetrics()
```

### 6.2 Component Structure

**A. Enhanced Onboarding (Multi-step)**
```
src/pages/auth/OnboardingPage.jsx
├── Step 1: Basic Business Info
│   ├── Business Name, Type, Established Year
│   ├── Categories, Employee Count
│   └── Business Description
├── Step 2: Location & Delivery
│   ├── Shop Address with Map Picker
│   ├── Delivery Areas
│   └── Business Hours
├── Step 3: Contact & Social
│   ├── Phone, WhatsApp, Website
│   ├── Social Media Links
│   └── Languages
├── Step 4: Business Documents (Optional)
│   ├── GST Number
│   ├── PAN Card
│   ├── Business Registration
│   └── Document Uploads
└── Step 5: Financial Setup (Optional)
    ├── Bank Details
    ├── Payment Methods
    ├── Credit Terms
    └── Minimum Order Value
```

**B. Enhanced Settings Page**
```
src/pages/SettingsPage.jsx
├── Profile Tab
│   ├── Basic Info
│   ├── Business Info
│   └── Profile Picture
├── Business Details Tab
│   ├── Business Type & Registration
│   ├── GST/PAN
│   ├── Certifications & Awards
│   └── Business Hours
├── Financial Tab
│   ├── Bank Account Details
│   ├── Payment Methods
│   ├── Credit Terms
│   └── Transaction History
├── Shipping & Logistics Tab
│   ├── Delivery Areas
│   ├── Shipping Methods
│   ├── Return Policy
│   └── Lead Time
├── Security Tab
│   ├── Change Password
│   ├── Two-Factor Authentication
│   ├── Email/Phone Verification
│   └── Session Management
├── Notifications Tab (Enhanced)
│   ├── Email/Push/SMS preferences
│   ├── Feature-specific settings
│   └── Digest preferences
├── Privacy Tab
│   ├── Profile visibility
│   ├── Contact visibility
│   └── Data sharing preferences
├── Subscription & Billing Tab
│   ├── Current Plan Details
│   ├── Upgrade Options
│   ├── Payment History
│   └── Invoice Downloads
├── Social Media Tab
│   ├── Connect Accounts
│   ├── Auto-posting settings
│   └── Analytics
└── Preferences Tab
    ├── Language & Timezone
    ├── Vacation Mode
    ├── Auto-reply Message
    └── Catalog Settings
```

**C. Enhanced Business Profile Page**
```
src/pages/BusinessPage.jsx
├── Header Section
│   ├── Cover Image
│   ├── Profile Picture
│   ├── Business Name & Badge (Verified/Premium)
│   ├── Rating & Reviews
│   └── Quick Actions
├── About Section
│   ├── Business Description
│   ├── Established Year
│   ├── Business Type
│   └── Employee Count
├── Contact Section
│   ├── Phone/WhatsApp (Privacy-aware)
│   ├── Email (Privacy-aware)
│   ├── Website
│   └── Social Media Links
├── Business Hours
│   ├── Weekly Schedule
│   ├── Current Status (Open/Closed)
│   └── Vacation Mode Banner
├── Location & Delivery
│   ├── Map with Shop Location
│   ├── Address
│   ├── Delivery Areas List
│   └── Coverage Map
├── Products & Catalog
│   ├── Featured Products
│   ├── Total Products Count
│   ├── Categories
│   └── View Full Catalog Button
├── Business Details
│   ├── Payment Methods Accepted
│   ├── Credit Terms
│   ├── Minimum Order Value
│   ├── Lead Time
│   └── Supply Capacity
├── Trust & Verification
│   ├── Verification Badge
│   ├── Trust Score
│   ├── Certifications
│   └── Awards
├── Performance Metrics
│   ├── Response Time
│   ├── Completion Rate
│   ├── Total Orders
│   └── Member Since
└── Reviews Section
    ├── Overall Rating
    ├── Rating Distribution
    └── Recent Reviews
```

### 6.3 New UI Components

Create in src/components/:

**A. Business Components**
- `BusinessCard.jsx` - Display business summary
- `BusinessHoursWidget.jsx` - Show operating hours
- `DeliveryAreasMap.jsx` - Map with delivery coverage
- `RatingStars.jsx` - Star rating display
- `TrustBadge.jsx` - Verification/trust indicators
- `SubscriptionBadge.jsx` - Plan tier badge

**B. Form Components**
- `BusinessHoursForm.jsx` - Edit business hours
- `BankDetailsForm.jsx` - Bank info form
- `DeliveryAreasForm.jsx` - Manage delivery areas
- `DocumentUpload.jsx` - Document verification upload
- `CertificationForm.jsx` - Add certifications
- `SocialMediaLinks.jsx` - Manage social accounts

**C. Feature Components**
- `SubscriptionPlans.jsx` - Plan comparison cards
- `PaymentHistory.jsx` - Transaction list
- `ReviewCard.jsx` - Individual review display
- `ReviewForm.jsx` - Submit review form
- `VacationModeToggle.jsx` - Enable vacation mode
- `TwoFactorSetup.jsx` - 2FA configuration

### 6.4 Service Layer Updates

**Create/Update in src/services/:**

```javascript
// api.js (Update base configuration)
- Add subscription tier headers
- Add token refresh logic

// authService.js (Update)
- registerWithBusinessInfo(data)
- verifyEmail(token)
- verifyPhone(code)
- setupTwoFactor()
- verifyTwoFactor(code)

// userService.js (Update)
- updateBusinessInfo(data)
- updateFinancialInfo(data)
- updateBusinessHours(data)
- uploadVerificationDocument(file, type)
- getBusinessMetrics()
- updateVacationMode(settings)

// subscriptionService.js (New)
- getPlans()
- getCurrentPlan()
- upgradePlan(tier)
- processPayment(paymentData)
- getPaymentHistory()
- downloadInvoice(id)

// reviewService.js (New)
- submitReview(userId, data)
- getReviews(userId, filters)
- getReviewStats(userId)
```

### 6.5 Hook Updates

**Create new hooks in src/hooks/:**

```javascript
// useBusinessProfile.js
- Fetch and manage business profile data
- Handle profile updates

// useSubscription.js
- Manage subscription state
- Check feature access by tier

// useMetrics.js
- Fetch business metrics
- Real-time updates

// useVerification.js
- Handle document uploads
- Track verification status

// useBusinessHours.js
- Manage operating hours
- Calculate open/closed status
```

## 7. INTEGRATION POINTS

### 7.1 Where New Fields Are Used

**A. Authentication & Onboarding**
- Registration: Collect basic business info
- Onboarding: Multi-step collection of detailed info
- Email/Phone verification flows

**B. Profile Display**
- Business Page: Show all public info
- Profile Cards: Summary in lists/search
- Network Page: Enhanced user cards

**C. Search & Discovery**
- Filter by business type
- Filter by payment methods
- Filter by certifications
- Sort by rating/trust score
- Geospatial search by delivery areas

**D. Marketplace & Products**
- Show seller's payment methods
- Display minimum order value
- Show lead time
- Display return policy
- Show business hours

**E. Analytics Dashboard**
- Display business metrics
- Show performance trends
- Calculate ROI by subscription tier
- Track verification status impact

**F. Settings & Management**
- Update all business information
- Manage subscription
- Configure vacation mode
- Manage business hours
- Update financial details

**G. Communication**
- Respect privacy settings
- Show/hide contact based on permissions
- Auto-reply when in vacation mode
- Display business hours before messaging

**H. Trust & Safety**
- Verification badge display
- Trust score calculation
- Review system
- Report mechanisms

## 8. VALIDATION & SECURITY

### 8.1 Field Validation Rules

```javascript
// GST Number: 15 characters, specific format
gst: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/

// PAN Card: 10 characters, specific format
pan: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/

// Phone: 10 digits (Indian)
phone: /^[6-9]\d{9}$/

// IFSC Code: 11 characters
ifsc: /^[A-Z]{4}0[A-Z0-9]{6}$/

// Email: Standard email validation
email: RFC 5322 compliant

// Year Established: 1900 - current year
yearEstablished: 1900 <= year <= new Date().getFullYear()
```

### 8.2 Privacy & Access Control

**Field Visibility Rules:**
- Public: Everyone can see
- Friends: Only accepted friends
- Communities: Members of same communities
- Private: Only the user

**Sensitive Fields (Default Private):**
- Bank details
- PAN card
- Email (based on preference)
- Phone (based on preference)
- GST number (business-public)

### 8.3 Data Encryption
- Encrypt bank account details at rest
- Hash sensitive identifiers
- Secure document storage (Cloudinary private URLs)

## 9. PERFORMANCE OPTIMIZATION

### 9.1 Database Optimization
- Compound indexes for common queries
- Aggregation pipelines for analytics
- Caching frequently accessed data (Redis)
- Lazy loading of related documents

### 9.2 Frontend Optimization
- Code splitting for settings page tabs
- Lazy load components
- Memoization of calculated values
- Virtual scrolling for long lists
- Image optimization (lazy loading, WebP)

### 9.3 API Optimization
- Pagination for all list endpoints
- Field selection (only return needed fields)
- Rate limiting by subscription tier
- CDN for static assets

## 10. TESTING STRATEGY

### 10.1 Backend Testing
- Unit tests for model validations
- Integration tests for API endpoints
- Test subscription tier access control
- Test privacy settings enforcement

### 10.2 Frontend Testing
- Component unit tests (Jest + React Testing Library)
- Integration tests for forms
- E2E tests for onboarding flow (Playwright/Cypress)
- Visual regression tests

### 10.3 Security Testing
- Penetration testing for sensitive endpoints
- OWASP security checks
- Authentication/authorization testing
- Data validation testing

## 11. MIGRATION STRATEGY

### 11.1 Database Migration
```javascript
// migration script
// 1. Add new fields with default values
// 2. Backfill existing users with sensible defaults
// 3. Create new indexes
// 4. Update existing documents incrementally
```

### 11.2 Rollout Plan
1. **Phase 1**: Backend schema update (non-breaking)
2. **Phase 2**: New API endpoints
3. **Phase 3**: Frontend components (feature-flagged)
4. **Phase 4**: Update onboarding flow
5. **Phase 5**: Update settings page
6. **Phase 6**: Full rollout with announcements

## 12. MONITORING & ANALYTICS

### 12.1 Metrics to Track
- Onboarding completion rate by step
- Profile completion percentage
- Verification request volume
- Subscription upgrade conversions
- Feature usage by subscription tier
- API response times
- Error rates by endpoint

### 12.2 User Analytics
- Which fields are most commonly filled
- Which fields are left empty
- Time spent on onboarding
- Settings page usage patterns

## 13. DOCUMENTATION

### 13.1 Developer Documentation
- API documentation (OpenAPI/Swagger)
- Component documentation (Storybook)
- Database schema documentation
- Deployment guide updates

### 13.2 User Documentation
- Help articles for new features
- Video tutorials for onboarding
- FAQ updates
- Email announcements

## 14. TIMELINE ESTIMATE

```
Phase 1: Backend Implementation (5-7 days)
  ├── Day 1-2: Schema updates & migrations
  ├── Day 3-4: API routes & controllers
  ├── Day 5-6: Validation & middleware
  └── Day 7: Testing & bug fixes

Phase 2: Frontend Implementation (7-10 days)
  ├── Day 1-2: State management & services
  ├── Day 3-4: UI components
  ├── Day 5-6: Onboarding flow
  ├── Day 7-8: Settings page
  ├── Day 9: Business profile updates
  └── Day 10: Testing & refinement

Phase 3: Integration & Polish (3-5 days)
  ├── Day 1-2: End-to-end integration
  ├── Day 3: Search/filter integration
  ├── Day 4: Performance optimization
  └── Day 5: Final testing

Phase 4: Deployment & Monitoring (2-3 days)
  ├── Day 1: Staging deployment & testing
  ├── Day 2: Production deployment
  └── Day 3: Monitoring & hotfixes

Total: 17-25 days
```

## 15. RISKS & MITIGATION

**Risk 1: Data Migration Issues**
- Mitigation: Comprehensive testing, rollback plan, incremental migration

**Risk 2: Performance Degradation**
- Mitigation: Load testing, database optimization, caching

**Risk 3: User Confusion**
- Mitigation: Clear UI/UX, help tooltips, onboarding guidance

**Risk 4: Privacy Compliance**
- Mitigation: Legal review, privacy audit, GDPR compliance

**Risk 5: Third-party Integration Failures**
- Mitigation: Fallback mechanisms, error handling, monitoring

## 16. SUCCESS CRITERIA

- ✅ All new fields integrated into schema
- ✅ Onboarding completion rate > 80%
- ✅ Profile completion average > 70%
- ✅ API response time < 200ms (p95)
- ✅ Zero critical security vulnerabilities
- ✅ Subscription conversion rate > 5%
- ✅ User satisfaction score > 4/5
- ✅ 100% test coverage for critical paths

## 17. FUTURE ENHANCEMENTS

- AI-powered business matching
- Advanced analytics dashboard
- Mobile app support
- Multi-language support
- API for third-party integrations
- Blockchain-based verification
- Video KYC for verification
- Advanced review system with images
