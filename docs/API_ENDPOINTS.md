# API Endpoints Documentation

Base URL: `https://api.restaurant-system.com/api/v1`

## Authentication Service

### POST /auth/register
Register a new user account.

**Request:**
\`\`\`json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+33612345678",
  "role": "CUSTOMER"
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "userId": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "CUSTOMER",
  "token": "jwt-token"
}
\`\`\`

### POST /auth/login
Authenticate user and get JWT token.

**Request:**
\`\`\`json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "token": "jwt-token",
  "refreshToken": "refresh-token",
  "expiresIn": 3600,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CUSTOMER"
  }
}
\`\`\`

### POST /auth/refresh
Refresh JWT token.

**Request:**
\`\`\`json
{
  "refreshToken": "refresh-token"
}
\`\`\`

### POST /auth/logout
Logout user and invalidate token.

---

## Delivery Service

### GET /delivery/menu
Get menu items with filters.

**Query Parameters:**
- `restaurantId` (required)
- `categoryId` (optional)
- `search` (optional)
- `minPrice` (optional)
- `maxPrice` (optional)
- `dietary` (optional): vegetarian, vegan, gluten-free
- `page` (default: 0)
- `size` (default: 20)

**Response (200):**
\`\`\`json
{
  "content": [
    {
      "id": "uuid",
      "name": "Margherita Pizza",
      "description": "Classic tomato and mozzarella",
      "price": 12.50,
      "imageUrl": "https://...",
      "category": {
        "id": "uuid",
        "name": "Pizza"
      },
      "preparationTime": 15,
      "isAvailable": true,
      "dietaryInfo": ["vegetarian"],
      "allergens": ["gluten", "dairy"]
    }
  ],
  "totalElements": 50,
  "totalPages": 3,
  "number": 0,
  "size": 20
}
\`\`\`

### POST /delivery/cart
Add item to cart.

**Request:**
\`\`\`json
{
  "userId": "uuid",
  "menuItemId": "uuid",
  "quantity": 2,
  "variantId": "uuid",
  "addons": ["uuid1", "uuid2"],
  "specialInstructions": "Extra cheese"
}
\`\`\`

### GET /delivery/cart/{userId}
Get user's cart.

### POST /delivery/orders
Place an order.

**Request:**
\`\`\`json
{
  "userId": "uuid",
  "restaurantId": "uuid",
  "orderType": "DELIVERY",
  "items": [
    {
      "menuItemId": "uuid",
      "quantity": 2,
      "variantId": "uuid",
      "addons": ["uuid1"]
    }
  ],
  "deliveryAddressId": "uuid",
  "deliveryInstructions": "Ring the bell",
  "paymentMethod": "CARD",
  "specialInstructions": "Extra napkins please"
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "orderId": "uuid",
  "orderNumber": "ORD-20250117-001",
  "status": "PENDING",
  "total": 45.50,
  "estimatedDeliveryTime": "2025-01-17T20:30:00Z",
  "paymentIntentId": "pi_stripe_id"
}
\`\`\`

### GET /delivery/orders/{orderId}
Get order details.

### GET /delivery/orders/user/{userId}
Get user's order history.

### GET /delivery/orders/{orderId}/tracking
Get real-time order tracking.

**Response (200):**
\`\`\`json
{
  "orderId": "uuid",
  "status": "OUT_FOR_DELIVERY",
  "timeline": [
    {
      "status": "CONFIRMED",
      "message": "Order confirmed",
      "timestamp": "2025-01-17T19:00:00Z"
    },
    {
      "status": "PREPARING",
      "message": "Your order is being prepared",
      "timestamp": "2025-01-17T19:05:00Z"
    }
  ],
  "estimatedDeliveryTime": "2025-01-17T20:30:00Z",
  "driverLocation": {
    "lat": 48.8566,
    "lng": 2.3522
  }
}
\`\`\`

### POST /delivery/orders/{orderId}/review
Submit order review and rating.

**Request:**
\`\`\`json
{
  "rating": 5,
  "review": "Excellent food and fast delivery!",
  "foodQuality": 5,
  "deliverySpeed": 5,
  "packaging": 5
}
\`\`\`

### GET /delivery/recommendations/{userId}
Get AI-powered recommendations for user.

**Response (200):**
\`\`\`json
{
  "recommendations": [
    {
      "menuItem": { /* menu item object */ },
      "score": 0.95,
      "reason": "Based on your previous orders"
    }
  ]
}
\`\`\`

---

## Dine-In Service

### POST /dine-in/reservations
Create a table reservation.

**Request:**
\`\`\`json
{
  "userId": "uuid",
  "restaurantId": "uuid",
  "reservationDate": "2025-01-20",
  "reservationTime": "19:30",
  "partySize": 4,
  "specialRequests": "Window seat preferred"
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "reservationId": "uuid",
  "confirmationCode": "RES-20250120-001",
  "status": "CONFIRMED",
  "tableNumber": "12",
  "reminderScheduled": true
}
\`\`\`

### GET /dine-in/reservations/{reservationId}
Get reservation details.

### PUT /dine-in/reservations/{reservationId}
Update reservation.

### DELETE /dine-in/reservations/{reservationId}
Cancel reservation.

### GET /dine-in/tables
Get available tables.

**Query Parameters:**
- `restaurantId` (required)
- `date` (required)
- `time` (required)
- `partySize` (required)

**Response (200):**
\`\`\`json
{
  "availableTables": [
    {
      "id": "uuid",
      "tableNumber": "12",
      "capacity": 4,
      "section": "Main Hall",
      "floor": "Ground"
    }
  ],
  "alternativeTimes": ["19:00", "19:30", "20:00", "20:30"]
}
\`\`\`

### POST /dine-in/sessions
Start a table session (when customer is seated).

**Request:**
\`\`\`json
{
  "tableId": "uuid",
  "reservationId": "uuid",
  "customerCount": 4
}
\`\`\`

### POST /dine-in/sessions/{sessionId}/transfer
Transfer to a different table.

**Request:**
\`\`\`json
{
  "toTableId": "uuid",
  "reason": "Customer request"
}
\`\`\`

### POST /dine-in/sessions/{sessionId}/order
Place order from table (via QR code).

### GET /dine-in/menu/qr/{tableId}
Get menu for QR code scanning at table.

### POST /dine-in/sessions/{sessionId}/payment
Request bill / make payment for dine-in.

**Request:**
\`\`\`json
{
  "paymentMethod": "CARD",
  "splitPayment": false,
  "tipAmount": 5.00
}
\`\`\`

---

## Admin Service

### GET /admin/dashboard/stats
Get dashboard statistics.

**Query Parameters:**
- `restaurantId` (required)
- `startDate` (optional)
- `endDate` (optional)

**Response (200):**
\`\`\`json
{
  "totalRevenue": 45678.90,
  "totalOrders": 1234,
  "averageOrderValue": 37.02,
  "topSellingItems": [
    {
      "menuItem": { /* item */ },
      "quantitySold": 450,
      "revenue": 5625.00
    }
  ],
  "ordersByType": {
    "delivery": 800,
    "dineIn": 300,
    "takeaway": 134
  },
  "revenueByDay": [
    {"date": "2025-01-10", "revenue": 1234.56},
    {"date": "2025-01-11", "revenue": 1456.78}
  ]
}
\`\`\`

### GET /admin/inventory
Get inventory items.

**Query Parameters:**
- `restaurantId` (required)
- `lowStock` (optional): boolean

**Response (200):**
\`\`\`json
{
  "items": [
    {
      "id": "uuid",
      "name": "Tomatoes",
      "category": "Vegetables",
      "currentStock": 15.5,
      "unit": "kg",
      "minStockLevel": 20,
      "status": "LOW_STOCK",
      "lastRestocked": "2025-01-15T10:00:00Z"
    }
  ]
}
\`\`\`

### POST /admin/inventory
Add inventory item.

### PUT /admin/inventory/{itemId}
Update inventory item.

### POST /admin/inventory/{itemId}/transaction
Record inventory transaction.

**Request:**
\`\`\`json
{
  "transactionType": "IN",
  "quantity": 50,
  "reason": "Weekly restock",
  "performedBy": "uuid"
}
\`\`\`

### GET /admin/inventory/alerts
Get low stock alerts.

### GET /admin/reservations
Get all reservations with filters.

**Query Parameters:**
- `restaurantId` (required)
- `date` (optional)
- `status` (optional)
- `page`, `size`

### POST /admin/reservations/{reservationId}/confirm
Confirm a reservation.

### GET /admin/staff
Get staff members.

### POST /admin/staff
Add new staff member.

### GET /admin/reports/sales
Generate sales report.

**Query Parameters:**
- `restaurantId` (required)
- `startDate` (required)
- `endDate` (required)
- `groupBy`: day, week, month

### Menu CMS (Next.js `/api/admin/*`)

Admin menu management endpoints used by `/admin/menu/*`. All require **ADMIN** or **STAFF** session (see `requireAdmin`).

#### GET /api/admin/catalog
Full menu catalog for the admin CMS: categories, products (with nested `product_ingredients`), ingredients, recommendations map, modifier/variant groups and items.

**Response (200):**
\`\`\`json
{
  "categories": [],
  "products": [],
  "ingredients": [],
  "recommendations": { "product-uuid": ["recommended-uuid"] },
  "modifier_groups": [],
  "modifiers": [],
  "variant_groups": [],
  "variants": []
}
\`\`\`

#### POST /api/admin/products
Create product. Body supports `name`, `name_ar`, `description`, `price`, `category_id`, `image_url`, `stock_quantity`, `station`, `display_order`, `is_available`, `is_archived`, `tags` (attribute tags sync legacy booleans).

#### PATCH /api/admin/products/{id}
Update product (same fields as POST).

#### DELETE /api/admin/products/{id}
Delete product.

#### POST /api/admin/products/{id}/duplicate
Duplicate product including extras, variants, and recommendations.

#### POST /api/admin/products/reorder
Body: `{ "items": [{ "id": "uuid", "display_order": 0 }] }`

#### POST /api/admin/categories
Create category.

#### PATCH /api/admin/categories/{id}
Update category (`name`, `name_ar`, `section`, `icon_emoji`, `is_active`, …).

#### DELETE /api/admin/categories/{id}
Delete category.

#### POST /api/admin/categories/reorder
Body: `{ "items": [{ "id": "uuid", "display_order": 0 }] }`

#### GET/POST /api/admin/modifiers
List modifiers (grouped) or create extra for a product (`product_id`, `name_de`, `name_ar`, `price`).

#### PATCH/DELETE /api/admin/modifiers/{id}
Update or delete an extra.

#### GET/POST /api/admin/variants
List variants or create variant for a product.

#### PATCH/DELETE /api/admin/variants/{id}
Update or delete a variant.

#### PUT /api/admin/product-recommendations/{productId}
Replace admin “Passt dazu” links. Body: `{ "recommended_product_ids": ["uuid", …] }`

#### PUT /api/admin/product-ingredients/{productId}
Replace recipe lines. Body: `{ "lines": [{ "ingredient_id": "uuid", "quantity": 1.5 }] }`

#### POST /api/admin/products/upload-image
Multipart image upload for product photos (Supabase Storage).

#### GET /api/menu (public)
Customer menu API — respects `display_order`, hides `is_archived` products, includes `slug`, `tags`, variants, extras, and merged `often_ordered_with` recommendations.

---

## Event Service

### GET /events
Get all events.

**Query Parameters:**
- `restaurantId` (required)
- `eventType` (optional)
- `startDate` (optional)
- `endDate` (optional)
- `status` (optional)

**Response (200):**
\`\`\`json
{
  "events": [
    {
      "id": "uuid",
      "title": "Wine Tasting Evening",
      "description": "Exclusive wine selection...",
      "eventType": "PUBLIC",
      "eventDate": "2025-02-14",
      "startTime": "19:00",
      "endTime": "22:00",
      "capacity": 50,
      "availableSpots": 15,
      "pricePerPerson": 75.00,
      "imageUrl": "https://...",
      "status": "PUBLISHED"
    }
  ]
}
\`\`\`

### POST /events
Create a new event (Admin only).

**Request:**
\`\`\`json
{
  "restaurantId": "uuid",
  "title": "Valentine's Day Special",
  "description": "Romantic dinner for two",
  "eventType": "PUBLIC",
  "eventDate": "2025-02-14",
  "startTime": "19:00",
  "endTime": "23:00",
  "capacity": 100,
  "pricePerPerson": 120.00,
  "minGuests": 2,
  "maxGuests": 2,
  "menuDetails": {
    "courses": ["Appetizer", "Main", "Dessert"],
    "drinks": "Wine pairing included"
  },
  "amenities": ["Live Music", "Decorations"]
}
\`\`\`

### GET /events/{eventId}
Get event details.

### PUT /events/{eventId}
Update event (Admin only).

### DELETE /events/{eventId}
Delete/Cancel event (Admin only).

### POST /events/{eventId}/bookings
Book an event.

**Request:**
\`\`\`json
{
  "userId": "uuid",
  "guestCount": 2,
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+33612345678",
  "specialRequests": "Vegan menu option"
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "bookingId": "uuid",
  "confirmationCode": "EVT-20250214-001",
  "totalAmount": 240.00,
  "status": "PENDING",
  "paymentRequired": true,
  "paymentIntentId": "pi_stripe_id"
}
\`\`\`

### GET /events/bookings/{bookingId}
Get booking details.

### PUT /events/bookings/{bookingId}/cancel
Cancel event booking.

### GET /events/calendar
Get event calendar view.

**Query Parameters:**
- `restaurantId` (required)
- `month` (required)
- `year` (required)

---

## Payment Service

### POST /payments/create-intent
Create Stripe payment intent.

**Request:**
\`\`\`json
{
  "amount": 45.50,
  "currency": "EUR",
  "orderId": "uuid",
  "customerId": "uuid"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx"
}
\`\`\`

### POST /payments/confirm
Confirm payment.

### POST /payments/refund
Process refund.

**Request:**
\`\`\`json
{
  "paymentIntentId": "pi_xxx",
  "amount": 45.50,
  "reason": "Customer cancellation"
}
\`\`\`

---

## Notification Service

### GET /notifications/{userId}
Get user notifications.

**Query Parameters:**
- `unreadOnly` (optional): boolean
- `page`, `size`

### PUT /notifications/{notificationId}/read
Mark notification as read.

### POST /notifications/send
Send notification (Internal use).

**Request:**
\`\`\`json
{
  "userId": "uuid",
  "type": "ORDER_UPDATE",
  "title": "Order Ready",
  "message": "Your order is ready for pickup",
  "data": {
    "orderId": "uuid"
  },
  "channels": ["PUSH", "EMAIL"]
}
\`\`\`

---

## AI Recommendation Service

### POST /ai/train/{userId}
Train user-specific recommendation model.

### GET /ai/recommendations/{userId}
Get personalized recommendations.

### POST /ai/interactions
Track user interaction for ML model.

**Request:**
\`\`\`json
{
  "userId": "uuid",
  "menuItemId": "uuid",
  "interactionType": "VIEW"
}
\`\`\`

---

## Error Responses

All endpoints return errors in the following format:

\`\`\`json
{
  "timestamp": "2025-01-17T19:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Invalid email format",
  "path": "/api/v1/auth/register"
}
\`\`\`

**Common Status Codes:**
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Internal Server Error
