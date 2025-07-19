-- Sample data for lost_found_reports table
-- Updated with passenger_id = 14 and route_number = 138

INSERT INTO lost_found_reports (
    passenger_id, report_type, item_category, item_description, 
    route_number, bus_registration, incident_date, incident_time, 
    approximate_location, contact_email, contact_phone, 
    additional_notes, reward_offered, report_reference
) VALUES 
(14, 'lost', 'wallet', 'Brown leather wallet containing driver''s license and credit cards', '138', 'BUS001', '2024-01-15', '15:30:00', 'Main Bus Station', 'sarah.j@email.com', '+94771234567', 'Last seen on seat 12A', 50.00, 'LF2024001'),
(14, 'found', 'phone', 'Black iPhone 14 with blue case', '138', 'BUS002', '2024-01-16', '09:15:00', 'Colombo Fort', 'john.d@email.com', '+94772345678', 'Found under seat, screen is cracked', 0.00, 'LF2024002'),
(14, 'lost', 'bag', 'Red backpack with laptop inside', '138', 'BUS003', '2024-01-17', '18:45:00', 'Kandy Central', 'mary.s@email.com', '+94773456789', 'Contains important work documents', 100.00, 'LF2024003'),
(14, 'found', 'keys', 'Set of house keys with Toyota keychain', '138', 'BUS001', '2024-01-18', '12:20:00', 'Galle Road', 'david.w@email.com', '+94774567890', 'Found on floor near driver seat', 0.00, 'LF2024004'),
(14, 'lost', 'documents', 'Blue folder with university certificates', '138', 'BUS004', '2024-01-19', '14:10:00', 'University of Colombo', 'lisa.p@email.com', '+94775678901', 'Very important academic documents', 200.00, 'LF2024005'),
(14, 'found', 'clothing', 'Blue denim jacket, size M', '138', 'BUS005', '2024-01-20', '16:30:00', 'Nugegoda Junction', 'alex.m@email.com', '+94776789012', 'Left on seat, has name tag inside', 0.00, 'LF2024006'),
(14, 'lost', 'electronics', 'White wireless earbuds in charging case', '138', 'BUS002', '2024-01-21', '08:45:00', 'Dehiwala Station', 'emma.k@email.com', '+94777890123', 'Apple AirPods Pro, very expensive', 75.00, 'LF2024007'),
(14, 'found', 'jewelry', 'Gold bracelet with heart charm', '138', 'BUS003', '2024-01-22', '11:15:00', 'Mount Lavinia', 'mike.r@email.com', '+94778901234', 'Found in ladies restroom area', 0.00, 'LF2024008');
