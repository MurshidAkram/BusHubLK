// controllers/ceoController.js
const pool = require('../config/db');

// Get all regions with aggregated data for CEO dashboard
const getRegionalOverview = async (req, res) => {
    try {
        const query = `
      SELECT 
        r.region_id,
        r.region_name,
        COUNT(DISTINCT d.depot_id) as depot_count,
        COUNT(DISTINCT b.bus_id) as bus_count,
        COUNT(DISTINCT CASE WHEN b.status = 'Active' THEN b.bus_id END) as active_buses,
        COUNT(DISTINCT CASE WHEN b.status = 'Maintenance' THEN b.bus_id END) as maintenance_buses,
        COUNT(DISTINCT CASE WHEN b.status = 'Out of Service' THEN b.bus_id END) as out_of_service_buses
      FROM regions r
      LEFT JOIN depots d ON r.region_id = d.region_id
      LEFT JOIN buses b ON d.depot_id = b.depot_id AND b.is_active = true AND b.is_deleted = false
      GROUP BY r.region_id, r.region_name
      ORDER BY r.region_name;
    `;

        const { rows } = await pool.query(query);

        res.status(200).json({
            success: true,
            message: 'Regional overview data retrieved successfully',
            data: rows
        });

    } catch (error) {
        console.error('Error fetching regional overview:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch regional overview data',
            error: error.message
        });
    }
};

// Get all depots with detailed information for CEO dashboard
const getDepotOverview = async (req, res) => {
    try {
        const query = `
      SELECT 
        d.depot_id,
        d.depot_name,
        r.region_name,
        COUNT(DISTINCT b.bus_id) as bus_count,
        COUNT(DISTINCT CASE WHEN b.status = 'Active' THEN b.bus_id END) as active_buses,
        COUNT(DISTINCT CASE WHEN b.status = 'Maintenance' THEN b.bus_id END) as maintenance_buses,
        COUNT(DISTINCT CASE WHEN b.status = 'Out of Service' THEN b.bus_id END) as out_of_service_buses
      FROM depots d
      LEFT JOIN regions r ON d.region_id = r.region_id
      LEFT JOIN buses b ON d.depot_id = b.depot_id AND b.is_active = true AND b.is_deleted = false
      GROUP BY d.depot_id, d.depot_name, r.region_name
      ORDER BY r.region_name, d.depot_name;
    `;

        const { rows } = await pool.query(query);

        res.status(200).json({
            success: true,
            message: 'Depot overview data retrieved successfully',
            data: rows
        });

    } catch (error) {
        console.error('Error fetching depot overview:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch depot overview data',
            error: error.message
        });
    }
};

// Get fleet summary statistics for CEO dashboard
const getFleetSummary = async (req, res) => {
    try {
        const query = `
      SELECT 
        COUNT(DISTINCT r.region_id) as total_regions,
        COUNT(DISTINCT d.depot_id) as total_depots,
        COUNT(DISTINCT b.bus_id) as total_buses,
        COUNT(DISTINCT CASE WHEN b.status = 'Active' THEN b.bus_id END) as active_buses,
        COUNT(DISTINCT CASE WHEN b.status = 'Maintenance' THEN b.bus_id END) as maintenance_buses,
        COUNT(DISTINCT CASE WHEN b.status = 'Out of Service' THEN b.bus_id END) as out_of_service_buses
      FROM regions r
      LEFT JOIN depots d ON r.region_id = d.region_id
      LEFT JOIN buses b ON d.depot_id = b.depot_id AND b.is_active = true AND b.is_deleted = false;
    `;

        const { rows } = await pool.query(query);

        res.status(200).json({
            success: true,
            message: 'Fleet summary retrieved successfully',
            data: rows[0]
        });

    } catch (error) {
        console.error('Error fetching fleet summary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch fleet summary',
            error: error.message
        });
    }
};

// Get region-specific depot details
const getRegionDepots = async (req, res) => {
    try {
        const { regionId } = req.params;

        const query = `
      SELECT 
        d.depot_id,
        d.depot_name,
        r.region_name,
        COUNT(DISTINCT b.bus_id) as bus_count,
        COUNT(DISTINCT CASE WHEN b.status = 'Active' THEN b.bus_id END) as active_buses,
        COUNT(DISTINCT CASE WHEN b.status = 'Maintenance' THEN b.bus_id END) as maintenance_buses,
        COUNT(DISTINCT CASE WHEN b.status = 'Out of Service' THEN b.bus_id END) as out_of_service_buses
      FROM depots d
      JOIN regions r ON d.region_id = r.region_id
      LEFT JOIN buses b ON d.depot_id = b.depot_id AND b.is_active = true AND b.is_deleted = false
      WHERE r.region_id = $1
      GROUP BY d.depot_id, d.depot_name, r.region_name
      ORDER BY d.depot_name;
    `;

        const { rows } = await pool.query(query, [regionId]);

        res.status(200).json({
            success: true,
            message: 'Region depot data retrieved successfully',
            data: rows
        });

    } catch (error) {
        console.error('Error fetching region depots:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch region depot data',
            error: error.message
        });
    }
};

// Get buses for a specific depot
const getDepotBuses = async (req, res) => {
    try {
        const { depotId } = req.params;

        const query = `
      SELECT 
        b.bus_id,
        b.registration_number,
        b.manufacturer,
        b.model,
        b.year,
        b.mileage,
        b.status,
        b.class,
        b.purchase_date,
        d.depot_name,
        r.region_name
      FROM buses b
      JOIN depots d ON b.depot_id = d.depot_id
      LEFT JOIN regions r ON d.region_id = r.region_id
      WHERE b.depot_id = $1 AND b.is_active = true AND b.is_deleted = false
      ORDER BY b.registration_number;
    `;

        const { rows } = await pool.query(query, [depotId]);

        res.status(200).json({
            success: true,
            message: 'Depot buses retrieved successfully',
            data: rows
        });

    } catch (error) {
        console.error('Error fetching depot buses:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch depot buses',
            error: error.message
        });
    }
};

module.exports = {
    getRegionalOverview,
    getDepotOverview,
    getFleetSummary,
    getRegionDepots,
    getDepotBuses
};
