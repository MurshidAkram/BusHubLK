-- ===============================================
-- BUS LIVE TRACKING DATABASE SCHEMA
-- Similar to Uber's location tracking system
-- ===============================================

-- Main table for storing real-time bus location data
CREATE TABLE bus_live_tracking (
    tracking_id BIGSERIAL PRIMARY KEY,
    
    -- Bus and Route Information
    bus_id INTEGER NOT NULL REFERENCES buses(bus_id),
    route_id INTEGER NOT NULL REFERENCES routes(route_id),
    assignment_id INTEGER REFERENCES dailyassignment(assignment_id),
    
    -- Driver Information
    driver_id INTEGER NOT NULL REFERENCES users(user_id),
    
    -- Location Data (High Precision for GPS)
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    altitude DECIMAL(8, 2), -- Optional: altitude in meters
    
    -- Movement Data
    speed DECIMAL(5, 2), -- Speed in km/h
    heading INTEGER, -- Direction in degrees (0-360)
    accuracy DECIMAL(7, 2), -- GPS accuracy in meters
    
    -- Timestamps
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    server_received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Status Information
    tracking_status VARCHAR(20) DEFAULT 'active' CHECK (tracking_status IN ('active', 'inactive', 'offline', 'break')),
    is_live BOOLEAN DEFAULT TRUE,
    
    -- Additional Context
    passenger_count INTEGER DEFAULT 0,
    occupancy_level VARCHAR(20) DEFAULT 'unknown' CHECK (occupancy_level IN ('low', 'medium', 'high', 'full', 'unknown')),
    
    -- Technical Data
    battery_level INTEGER, -- Driver's device battery percentage
    signal_strength INTEGER, -- Network signal strength
    data_source VARCHAR(20) DEFAULT 'mobile' CHECK (data_source IN ('mobile', 'gps_device', 'manual')),
    
    -- Indexes for Performance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- INDEXES FOR OPTIMAL PERFORMANCE
-- ===============================================

-- Primary index for real-time bus location queries
CREATE INDEX idx_bus_live_tracking_bus_live ON bus_live_tracking(bus_id, is_live, recorded_at DESC) WHERE is_live = TRUE;

-- Index for route-based queries
CREATE INDEX idx_bus_live_tracking_route_live ON bus_live_tracking(route_id, is_live, recorded_at DESC) WHERE is_live = TRUE;

-- Index for driver tracking
CREATE INDEX idx_bus_live_tracking_driver ON bus_live_tracking(driver_id, recorded_at DESC);

-- Geospatial index for location-based queries
CREATE INDEX idx_bus_live_tracking_location ON bus_live_tracking(latitude, longitude);

-- Index for time-based queries (cleanup, analytics)
CREATE INDEX idx_bus_live_tracking_time ON bus_live_tracking(recorded_at);

-- Index for assignment-based queries
CREATE INDEX idx_bus_live_tracking_assignment ON bus_live_tracking(assignment_id, recorded_at DESC);

-- ===============================================
-- CURRENT LIVE POSITIONS VIEW
-- ===============================================

-- View for getting the latest live position of all active buses
CREATE VIEW bus_current_positions AS
SELECT DISTINCT ON (bt.bus_id)
    bt.tracking_id,
    bt.bus_id,
    b.registration_number,
    b.class as bus_class,
    bt.route_id,
    r.route_number,
    r.route_name,
    bt.driver_id,
    CONCAT(u.first_name, ' ', u.last_name) as driver_name,
    bt.latitude,
    bt.longitude,
    bt.speed,
    bt.heading,
    bt.accuracy,
    bt.recorded_at as last_update,
    bt.tracking_status,
    bt.passenger_count,
    bt.occupancy_level,
    bt.battery_level,
    da.shift_start_time,
    da.shift_end_time,
    da.status as assignment_status,
    d.depot_name
FROM bus_live_tracking bt
JOIN buses b ON bt.bus_id = b.bus_id
JOIN routes r ON bt.route_id = r.route_id
JOIN users u ON bt.driver_id = u.user_id
LEFT JOIN dailyassignment da ON bt.assignment_id = da.assignment_id
LEFT JOIN depots d ON da.depot_id = d.depot_id
WHERE bt.is_live = TRUE
  AND bt.tracking_status = 'active'
  AND bt.recorded_at >= NOW() - INTERVAL '10 minutes' -- Only recent positions
ORDER BY bt.bus_id, bt.recorded_at DESC;

-- ===============================================
-- ROUTE LIVE TRACKING VIEW
-- ===============================================

-- View for passengers to see all buses on a specific route
CREATE VIEW route_live_buses AS
SELECT 
    r.route_id,
    r.route_number,
    r.route_name,
    r.start_location,
    r.end_location,
    COUNT(bcp.bus_id) as active_buses_count,
    JSON_AGG(
        JSON_BUILD_OBJECT(
            'bus_id', bcp.bus_id,
            'registration_number', bcp.registration_number,
            'latitude', bcp.latitude,
            'longitude', bcp.longitude,
            'speed', bcp.speed,
            'last_update', bcp.last_update,
            'occupancy_level', bcp.occupancy_level,
            'driver_name', bcp.driver_name
        ) ORDER BY bcp.last_update DESC
    ) as buses
FROM routes r
LEFT JOIN bus_current_positions bcp ON r.route_id = bcp.route_id
WHERE r.is_active = TRUE
GROUP BY r.route_id, r.route_number, r.route_name, r.start_location, r.end_location;

-- ===============================================
-- HISTORICAL TRACKING TABLE (For Analytics)
-- ===============================================

-- Table for storing historical tracking data (moved from live table)
CREATE TABLE bus_tracking_history (
    history_id BIGSERIAL PRIMARY KEY,
    original_tracking_id BIGINT,
    bus_id INTEGER NOT NULL,
    route_id INTEGER NOT NULL,
    driver_id INTEGER NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    speed DECIMAL(5, 2),
    heading INTEGER,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    tracking_status VARCHAR(20),
    passenger_count INTEGER,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for historical data queries
CREATE INDEX idx_bus_tracking_history_bus_date ON bus_tracking_history(bus_id, recorded_at);
CREATE INDEX idx_bus_tracking_history_route_date ON bus_tracking_history(route_id, recorded_at);

-- ===============================================
-- DATA MANAGEMENT FUNCTIONS
-- ===============================================

-- Function to archive old tracking data
CREATE OR REPLACE FUNCTION archive_old_tracking_data()
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    -- Move data older than 24 hours to history table
    WITH moved_data AS (
        DELETE FROM bus_live_tracking 
        WHERE recorded_at < NOW() - INTERVAL '24 hours'
        OR is_live = FALSE
        RETURNING tracking_id, bus_id, route_id, driver_id, latitude, longitude, 
                 speed, heading, recorded_at, tracking_status, passenger_count
    )
    INSERT INTO bus_tracking_history (
        original_tracking_id, bus_id, route_id, driver_id, latitude, longitude,
        speed, heading, recorded_at, tracking_status, passenger_count
    )
    SELECT * FROM moved_data;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update bus position (called by mobile app)
CREATE OR REPLACE FUNCTION update_bus_position(
    p_bus_id INTEGER,
    p_route_id INTEGER,
    p_driver_id INTEGER,
    p_latitude DECIMAL(10, 8),
    p_longitude DECIMAL(11, 8),
    p_speed DECIMAL(5, 2) DEFAULT NULL,
    p_heading INTEGER DEFAULT NULL,
    p_accuracy DECIMAL(7, 2) DEFAULT NULL,
    p_passenger_count INTEGER DEFAULT 0,
    p_occupancy_level VARCHAR(20) DEFAULT 'unknown',
    p_assignment_id INTEGER DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    new_tracking_id BIGINT;
    assignment_id INTEGER;
BEGIN
    -- Get assignment_id if not provided
    IF p_assignment_id IS NULL THEN
        SELECT da.assignment_id INTO assignment_id
        FROM dailyassignment da
        WHERE da.driver_id = p_driver_id 
          AND da.bus_id = p_bus_id
          AND da.is_active = TRUE
          AND da.assignment_date = CURRENT_DATE
        LIMIT 1;
    ELSE
        assignment_id := p_assignment_id;
    END IF;
    
    -- Mark previous positions as not live for this bus
    UPDATE bus_live_tracking 
    SET is_live = FALSE 
    WHERE bus_id = p_bus_id AND is_live = TRUE;
    
    -- Insert new position
    INSERT INTO bus_live_tracking (
        bus_id, route_id, assignment_id, driver_id,
        latitude, longitude, speed, heading, accuracy,
        passenger_count, occupancy_level, is_live
    ) VALUES (
        p_bus_id, p_route_id, assignment_id, p_driver_id,
        p_latitude, p_longitude, p_speed, p_heading, p_accuracy,
        p_passenger_count, p_occupancy_level, TRUE
    )
    RETURNING tracking_id INTO new_tracking_id;
    
    RETURN new_tracking_id;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- CLEANUP AND MAINTENANCE
-- ===============================================

-- Function to clean up old historical data (run monthly)
CREATE OR REPLACE FUNCTION cleanup_old_history()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM bus_tracking_history 
    WHERE archived_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- EXAMPLE QUERIES FOR COMMON USE CASES
-- ===============================================

/* 
-- 1. Get current position of a specific bus
SELECT * FROM bus_current_positions WHERE bus_id = 17;

-- 2. Get all buses currently on route 138
SELECT * FROM bus_current_positions WHERE route_number = '138';

-- 3. Get live tracking data for passenger app (by route)
SELECT * FROM route_live_buses WHERE route_number = '138';

-- 4. Get historical tracking for analysis
SELECT * FROM bus_tracking_history 
WHERE bus_id = 17 
  AND recorded_at >= '2025-07-20 06:00:00'
  AND recorded_at <= '2025-07-20 14:00:00'
ORDER BY recorded_at;

-- 5. Get nearby buses (within 5km radius) - requires PostGIS extension
-- For basic distance calculation without PostGIS:
SELECT *, 
    (6371 * acos(cos(radians(6.9271)) * cos(radians(latitude)) * 
    cos(radians(longitude) - radians(79.8612)) + 
    sin(radians(6.9271)) * sin(radians(latitude)))) AS distance_km
FROM bus_current_positions
HAVING distance_km <= 5
ORDER BY distance_km;
*/

-- ===============================================
-- SCHEDULED MAINTENANCE (Run via cron job)
-- ===============================================

-- Daily cleanup job
-- SELECT archive_old_tracking_data();

-- Monthly cleanup job  
-- SELECT cleanup_old_history();
