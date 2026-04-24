-- ================================================================
-- RESTAURANT MANAGEMENT SYSTEM - DATABASE SCHEMA
-- PostgreSQL 15+
-- ================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ================================================================
-- USERS & AUTHENTICATION
-- ================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) NOT NULL, -- ADMIN, MANAGER, STAFF, CUSTOMER
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, SUSPENDED
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE TABLE user_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(50), -- HOME, WORK, OTHER
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'France',
    location GEOGRAPHY(POINT, 4326), -- PostGIS for delivery zones
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    dietary_restrictions JSONB, -- ["vegetarian", "gluten-free"]
    favorite_cuisines JSONB, -- ["italian", "japanese"]
    allergens JSONB, -- ["nuts", "dairy"]
    language VARCHAR(10) DEFAULT 'fr',
    notification_settings JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- RESTAURANT & MENU
-- ================================================================

CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address VARCHAR(255),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    location GEOGRAPHY(POINT, 4326),
    opening_hours JSONB, -- {"monday": {"open": "09:00", "close": "22:00"}}
    settings JSONB, -- Configuration générale
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(500),
    images JSONB, -- Multiple images
    preparation_time INT, -- minutes
    calories INT,
    allergens JSONB, -- ["nuts", "dairy"]
    dietary_info JSONB, -- ["vegetarian", "vegan", "gluten-free"]
    is_available BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE menu_item_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    name VARCHAR(100), -- "Small", "Medium", "Large"
    price_adjustment DECIMAL(10, 2) DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE
);

CREATE TABLE menu_item_addons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    name VARCHAR(100),
    price DECIMAL(10, 2) DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE
);

-- ================================================================
-- DELIVERY MODULE
-- ================================================================

CREATE TABLE delivery_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(100),
    polygon GEOGRAPHY(POLYGON, 4326), -- Zone de livraison
    delivery_fee DECIMAL(10, 2),
    min_order_amount DECIMAL(10, 2),
    estimated_delivery_time INT, -- minutes
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    restaurant_id UUID REFERENCES restaurants(id),
    user_id UUID REFERENCES users(id),
    order_type VARCHAR(20) NOT NULL, -- DELIVERY, DINE_IN, TAKEAWAY
    status VARCHAR(50) NOT NULL, -- PENDING, CONFIRMED, PREPARING, READY, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
    
    -- Delivery info
    delivery_address_id UUID REFERENCES user_addresses(id),
    delivery_instructions TEXT,
    delivery_fee DECIMAL(10, 2),
    
    -- Dine-in info
    table_id UUID, -- Pour les commandes sur place
    
    -- Pricing
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    
    -- Payment
    payment_status VARCHAR(50), -- PENDING, PAID, REFUNDED
    payment_method VARCHAR(50), -- CARD, CASH, ONLINE
    payment_intent_id VARCHAR(255), -- Stripe payment intent
    
    -- Tracking
    estimated_delivery_time TIMESTAMP,
    confirmed_at TIMESTAMP,
    prepared_at TIMESTAMP,
    delivered_at TIMESTAMP,
    
    -- Additional
    special_instructions TEXT,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    reviewed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id),
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    special_instructions TEXT,
    variant_id UUID REFERENCES menu_item_variants(id),
    addons JSONB, -- [{id: uuid, name: string, price: number}]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    message TEXT,
    location GEOGRAPHY(POINT, 4326), -- Pour tracking en temps réel
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- DINE-IN MODULE
-- ================================================================

CREATE TABLE tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    table_number VARCHAR(20) NOT NULL,
    capacity INT NOT NULL,
    floor VARCHAR(50),
    section VARCHAR(50), -- "Terrace", "Main Hall", "VIP"
    status VARCHAR(20) DEFAULT 'AVAILABLE', -- AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE
    qr_code VARCHAR(500), -- QR code pour commander depuis la table
    position_x DECIMAL(10, 2), -- Pour plan de salle visuel
    position_y DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    table_id UUID REFERENCES tables(id),
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    party_size INT NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, CONFIRMED, SEATED, COMPLETED, CANCELLED, NO_SHOW
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    special_requests TEXT,
    reminder_sent BOOLEAN DEFAULT FALSE,
    confirmed_at TIMESTAMP,
    seated_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE table_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID REFERENCES tables(id),
    reservation_id UUID REFERENCES reservations(id),
    order_id UUID REFERENCES orders(id),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    customer_count INT,
    status VARCHAR(20) DEFAULT 'ACTIVE' -- ACTIVE, COMPLETED
);

CREATE TABLE table_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES table_sessions(id),
    from_table_id UUID REFERENCES tables(id),
    to_table_id UUID REFERENCES tables(id),
    reason TEXT,
    transferred_by UUID REFERENCES users(id), -- Staff member
    transferred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- EVENTS MODULE
-- ================================================================

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50), -- PRIVATE, CORPORATE, WEDDING, BIRTHDAY, PUBLIC
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    capacity INT,
    price_per_person DECIMAL(10, 2),
    min_guests INT,
    max_guests INT,
    status VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, PUBLISHED, FULL, COMPLETED, CANCELLED
    image_url VARCHAR(500),
    images JSONB,
    menu_details JSONB, -- Menu personnalisé pour l'événement
    amenities JSONB, -- ["DJ", "Projector", "Decorations"]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE event_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    guest_count INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, CONFIRMED, PAID, CANCELLED
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    special_requests TEXT,
    payment_status VARCHAR(50),
    payment_intent_id VARCHAR(255),
    confirmed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- ADMIN MODULE
-- ================================================================

CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100), -- "Vegetables", "Meat", "Dairy", "Beverages"
    unit VARCHAR(50), -- "kg", "liters", "pieces"
    current_stock DECIMAL(10, 2) NOT NULL,
    min_stock_level DECIMAL(10, 2), -- Alert threshold
    max_stock_level DECIMAL(10, 2),
    unit_cost DECIMAL(10, 2),
    supplier_name VARCHAR(255),
    supplier_contact VARCHAR(255),
    last_restocked TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20), -- IN, OUT, ADJUSTMENT
    quantity DECIMAL(10, 2) NOT NULL,
    reason TEXT,
    reference_id UUID, -- Order ID or autre référence
    performed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    position VARCHAR(100), -- "Chef", "Waiter", "Manager", "Delivery Driver"
    hire_date DATE,
    salary DECIMAL(10, 2),
    schedule JSONB, -- Work schedule
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, ON_LEAVE, TERMINATED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sales_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    total_orders INT,
    total_revenue DECIMAL(10, 2),
    total_delivery_orders INT,
    total_dine_in_orders INT,
    total_takeaway_orders INT,
    average_order_value DECIMAL(10, 2),
    top_selling_items JSONB,
    metrics JSONB, -- Additional metrics
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- AI & RECOMMENDATIONS
-- ================================================================

CREATE TABLE user_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50), -- VIEW, ADD_TO_CART, ORDER, FAVORITE
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    score DECIMAL(5, 4), -- Confidence score
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- NOTIFICATIONS
-- ================================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50), -- ORDER_UPDATE, RESERVATION_REMINDER, PROMOTION
    title VARCHAR(255),
    message TEXT,
    data JSONB, -- Additional data
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- LOYALTY PROGRAM
-- ================================================================

CREATE TABLE loyalty_points (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    points INT DEFAULT 0,
    tier VARCHAR(50) DEFAULT 'BRONZE', -- BRONZE, SILVER, GOLD, PLATINUM
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id),
    points_change INT, -- Positive for earning, negative for redeeming
    transaction_type VARCHAR(50), -- EARNED, REDEEMED, EXPIRED, ADJUSTED
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_reservations_date ON reservations(reservation_date, reservation_time);
CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_tables_restaurant ON tables(restaurant_id);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_inventory_restaurant ON inventory_items(restaurant_id);
CREATE INDEX idx_user_addresses_user ON user_addresses(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- Spatial indexes
CREATE INDEX idx_user_addresses_location ON user_addresses USING GIST(location);
CREATE INDEX idx_restaurants_location ON restaurants USING GIST(location);
CREATE INDEX idx_delivery_zones_polygon ON delivery_zones USING GIST(polygon);

-- ================================================================
-- TRIGGERS FOR UPDATED_AT
-- ================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
