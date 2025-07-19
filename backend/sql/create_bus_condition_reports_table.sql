CREATE TABLE bus_condition_reports (
    report_id SERIAL PRIMARY KEY,
    bus_id INTEGER REFERENCES buses(bus_id) ON DELETE CASCADE,
    driver_id INTEGER REFERENCES drivers(driver_id) ON DELETE CASCADE,
    condition_status VARCHAR(50) NOT NULL,
    description TEXT,
    report_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
