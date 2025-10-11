const pool = require('../config/db');

// Get all regions with depot and bus counts for DGM Technical dashboard
const getAllRegions = async (req, res) => {
    try {
        const query = `
      SELECT 
        r.region_id,
        r.region_name,
        COUNT(DISTINCT d.depot_id) as depot_count,
        COUNT(DISTINCT b.bus_id) as bus_count,
        COUNT(DISTINCT CASE WHEN b.status = 'Maintenance' THEN b.bus_id END) as maintenance_count
      FROM regions r
      LEFT JOIN depots d ON r.region_id = d.region_id
      LEFT JOIN buses b ON d.depot_id = b.depot_id AND b.is_active = true AND b.is_deleted = false
      GROUP BY r.region_id, r.region_name
      ORDER BY r.region_name
    `;

        const { rows } = await pool.query(query);

        res.status(200).json({
            success: true,
            message: 'Regions fetched successfully',
            data: rows
        });
    } catch (error) {
        console.error('Error fetching regions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch regions',
            error: error.message
        });
    }
};

// Get depots by region with bus counts
const getDepotsByRegion = async (req, res) => {
    try {
        const { regionId } = req.params;

        const query = `
      SELECT 
        d.depot_id,
        d.depot_name,
        d.address,
        d.contact_phone,
        r.region_name,
        COUNT(DISTINCT b.bus_id) as bus_count,
        COUNT(DISTINCT CASE WHEN b.status = 'Maintenance' THEN b.bus_id END) as maintenance_count,
        COUNT(DISTINCT CASE WHEN b.status = 'Active' THEN b.bus_id END) as active_count,
        COUNT(DISTINCT CASE WHEN b.status = 'Out of Service' THEN b.bus_id END) as out_of_service_count
      FROM depots d
      JOIN regions r ON d.region_id = r.region_id
      LEFT JOIN buses b ON d.depot_id = b.depot_id AND b.is_active = true AND b.is_deleted = false
      WHERE d.region_id = $1
      GROUP BY d.depot_id, d.depot_name, d.address, d.contact_phone, r.region_name
      ORDER BY d.depot_name
    `;

        const { rows } = await pool.query(query, [regionId]);

        res.status(200).json({
            success: true,
            message: 'Depots fetched successfully',
            data: rows
        });
    } catch (error) {
        console.error('Error fetching depots:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch depots',
            error: error.message
        });
    }
};

// Get all depots with region information for fleet monitoring
const getAllDepots = async (req, res) => {
    try {
        const query = `
      SELECT 
        d.depot_id,
        d.depot_name,
        d.address,
        d.contact_phone,
        r.region_id,
        r.region_name,
        COUNT(DISTINCT b.bus_id) as bus_count,
        COUNT(DISTINCT CASE WHEN b.status = 'Maintenance' THEN b.bus_id END) as maintenance_count,
        COUNT(DISTINCT CASE WHEN b.status = 'Active' THEN b.bus_id END) as active_count,
        COUNT(DISTINCT CASE WHEN b.status = 'Out of Service' THEN b.bus_id END) as out_of_service_count
      FROM depots d
      JOIN regions r ON d.region_id = r.region_id
      LEFT JOIN buses b ON d.depot_id = b.depot_id AND b.is_active = true AND b.is_deleted = false
      GROUP BY d.depot_id, d.depot_name, d.address, d.contact_phone, r.region_id, r.region_name
      ORDER BY r.region_name, d.depot_name
    `;

        const { rows } = await pool.query(query);

        // Group by region for DGM Technical dashboard structure
        const regionData = {};
        rows.forEach(depot => {
            if (!regionData[depot.region_name]) {
                regionData[depot.region_name] = {
                    region_id: depot.region_id,
                    region_name: depot.region_name,
                    depots: [],
                    total_buses: 0,
                    total_maintenance: 0,
                    total_active: 0,
                    total_out_of_service: 0
                };
            }

            regionData[depot.region_name].depots.push({
                depot_id: depot.depot_id,
                depot_name: depot.depot_name,
                address: depot.address,
                contact_phone: depot.contact_phone,
                bus_count: parseInt(depot.bus_count),
                maintenance_count: parseInt(depot.maintenance_count),
                active_count: parseInt(depot.active_count),
                out_of_service_count: parseInt(depot.out_of_service_count)
            });

            regionData[depot.region_name].total_buses += parseInt(depot.bus_count);
            regionData[depot.region_name].total_maintenance += parseInt(depot.maintenance_count);
            regionData[depot.region_name].total_active += parseInt(depot.active_count);
            regionData[depot.region_name].total_out_of_service += parseInt(depot.out_of_service_count);
        });

        res.status(200).json({
            success: true,
            message: 'All depots fetched successfully',
            data: regionData
        });
    } catch (error) {
        console.error('Error fetching all depots:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch depots',
            error: error.message
        });
    }
};

// Get buses by depot for fleet monitoring
const getBusesByDepot = async (req, res) => {
    try {
        const { depotId } = req.params;
        const { page = 1, limit = 50, status, search } = req.query;

        let whereClause = 'WHERE b.depot_id = $1 AND b.is_active = true AND b.is_deleted = false';
        let queryParams = [depotId];
        let paramCount = 1;

        if (status && status !== 'all') {
            paramCount++;
            whereClause += ` AND b.status = $${paramCount}`;
            queryParams.push(status);
        }

        if (search) {
            paramCount++;
            whereClause += ` AND (b.registration_number ILIKE $${paramCount} OR b.model ILIKE $${paramCount} OR b.manufacturer ILIKE $${paramCount})`;
            queryParams.push(`%${search}%`);
        }

        // Get total count
        const countQuery = `
      SELECT COUNT(*) as total
      FROM buses b
      ${whereClause}
    `;
        const countResult = await pool.query(countQuery, queryParams);
        const totalBuses = parseInt(countResult.rows[0].total);

        // Calculate pagination
        const offset = (page - 1) * limit;
        paramCount++;
        const limitParam = `$${paramCount}`;
        paramCount++;
        const offsetParam = `$${paramCount}`;
        queryParams.push(limit, offset);

        const query = `
      SELECT 
        b.bus_id,
        b.registration_number,
        b.class,
        b.manufacturer,
        b.model,
        b.year,
        b.mileage,
        b.status,
        b.purchase_date,
        b.created_at,
        b.updated_at,
        d.depot_name,
        r.region_name
      FROM buses b
      JOIN depots d ON b.depot_id = d.depot_id
      JOIN regions r ON d.region_id = r.region_id
      ${whereClause}
      ORDER BY b.registration_number
      LIMIT ${limitParam} OFFSET ${offsetParam}
    `;

        const { rows } = await pool.query(query, queryParams);

        res.status(200).json({
            success: true,
            message: 'Buses fetched successfully',
            data: {
                buses: rows,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: Math.ceil(totalBuses / limit),
                    total_buses: totalBuses,
                    per_page: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching buses:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch buses',
            error: error.message
        });
    }
};

// Get bus details by ID for DGM Technical dashboard
const getBusDetails = async (req, res) => {
    try {
        const { busId } = req.params;

        const query = `
      SELECT 
        b.bus_id,
        b.registration_number,
        b.class,
        b.manufacturer,
        b.model,
        b.year,
        b.mileage,
        b.status,
        b.purchase_date,
        b.created_at,
        b.updated_at,
        d.depot_id,
        d.depot_name,
        d.address as depot_address,
        d.contact_phone as depot_phone,
        r.region_id,
        r.region_name
      FROM buses b
      JOIN depots d ON b.depot_id = d.depot_id
      JOIN regions r ON d.region_id = r.region_id
      WHERE b.bus_id = $1 AND b.is_active = true AND b.is_deleted = false
    `;

        const { rows } = await pool.query(query, [busId]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bus not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Bus details fetched successfully',
            data: rows[0]
        });
    } catch (error) {
        console.error('Error fetching bus details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bus details',
            error: error.message
        });
    }
};

// Get comprehensive fleet statistics for DGM Technical overview
const getFleetOverview = async (req, res) => {
    try {
        const statsQuery = `
      SELECT 
        COUNT(*) as total_buses,
        COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_buses,
        COUNT(CASE WHEN status = 'Maintenance' THEN 1 END) as maintenance_buses,
        COUNT(CASE WHEN status = 'Out of Service' THEN 1 END) as out_of_service_buses,
        COUNT(CASE WHEN status = 'In Service' THEN 1 END) as in_service_buses,
        COUNT(DISTINCT depot_id) as total_depots
      FROM buses 
      WHERE is_active = true AND is_deleted = false
    `;

        const regionStatsQuery = `
      SELECT 
        r.region_name,
        COUNT(DISTINCT d.depot_id) as depot_count,
        COUNT(DISTINCT b.bus_id) as bus_count,
        COUNT(DISTINCT CASE WHEN b.status = 'Maintenance' THEN b.bus_id END) as maintenance_count
      FROM regions r
      LEFT JOIN depots d ON r.region_id = d.region_id
      LEFT JOIN buses b ON d.depot_id = b.depot_id AND b.is_active = true AND b.is_deleted = false
      GROUP BY r.region_id, r.region_name
      ORDER BY bus_count DESC
    `;

        const manufacturerStatsQuery = `
      SELECT 
        manufacturer,
        COUNT(*) as bus_count,
        COUNT(CASE WHEN status = 'Maintenance' THEN 1 END) as maintenance_count
      FROM buses 
      WHERE is_active = true AND is_deleted = false
      GROUP BY manufacturer
      ORDER BY bus_count DESC
    `;

        const [statsResult, regionStatsResult, manufacturerStatsResult] = await Promise.all([
            pool.query(statsQuery),
            pool.query(regionStatsQuery),
            pool.query(manufacturerStatsQuery)
        ]);

        res.status(200).json({
            success: true,
            message: 'Fleet overview fetched successfully',
            data: {
                overall: statsResult.rows[0],
                by_region: regionStatsResult.rows,
                by_manufacturer: manufacturerStatsResult.rows
            }
        });
    } catch (error) {
        console.error('Error fetching fleet overview:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch fleet overview',
            error: error.message
        });
    }
};

// Get DGM Technical dashboard summary
const getDashboardSummary = async (req, res) => {
    try {
        const summaryQuery = `
      SELECT 
        (SELECT COUNT(*) FROM regions) as total_regions,
        (SELECT COUNT(*) FROM depots) as total_depots,
        (SELECT COUNT(*) FROM buses WHERE is_active = true AND is_deleted = false) as total_buses,
        (SELECT COUNT(*) FROM buses WHERE status = 'Maintenance' AND is_active = true AND is_deleted = false) as buses_in_maintenance,
        (SELECT COUNT(*) FROM buses WHERE status = 'Out of Service' AND is_active = true AND is_deleted = false) as buses_out_of_service,
        (SELECT COUNT(*) FROM buses WHERE status = 'Active' AND is_active = true AND is_deleted = false) as buses_active,
        (SELECT COUNT(*) FROM emergency_reports WHERE incident_type = 'accident') as total_accidents,
        (SELECT COUNT(*) FROM emergency_reports WHERE incident_type = 'breakdown') as total_breakdowns,
        (SELECT COUNT(*) FROM emergency_reports) as total_incidents
    `;

        const { rows } = await pool.query(summaryQuery);

        // Calculate maintenance percentage
        const totalBuses = parseInt(rows[0].total_buses);
        const maintenanceBuses = parseInt(rows[0].buses_in_maintenance);
        const maintenancePercentage = totalBuses > 0 ? ((maintenanceBuses / totalBuses) * 100).toFixed(1) : 0;

        const dashboardData = {
            ...rows[0],
            maintenance_percentage: parseFloat(maintenancePercentage),
            total_accidents: parseInt(rows[0].total_accidents),
            total_breakdowns: parseInt(rows[0].total_breakdowns),
            total_incidents: parseInt(rows[0].total_incidents)
        };

        res.status(200).json({
            success: true,
            message: 'Dashboard summary fetched successfully',
            data: dashboardData
        });
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard summary',
            error: error.message
        });
    }
};

// Get service history by region/depot with filtering
const getServiceHistory = async (req, res) => {
    try {
        const { regionId, depotId } = req.query;
        const { page = 1, limit = 50, status, serviceType, startDate, endDate } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = ['ss.is_deleted = false'];
        let params = [];
        let paramIndex = 1;

        if (regionId && regionId !== 'all') {
            whereConditions.push(`r.region_id = $${paramIndex}`);
            params.push(regionId);
            paramIndex++;
        }

        if (depotId && depotId !== 'all') {
            whereConditions.push(`d.depot_id = $${paramIndex}`);
            params.push(depotId);
            paramIndex++;
        }

        if (status && status !== 'all') {
            whereConditions.push(`ss.status = $${paramIndex}`);
            params.push(status);
            paramIndex++;
        }

        if (serviceType && serviceType !== 'all') {
            whereConditions.push(`ss.service_type ILIKE $${paramIndex}`);
            params.push(`%${serviceType}%`);
            paramIndex++;
        }

        if (startDate) {
            whereConditions.push(`ss.scheduled_date >= $${paramIndex}`);
            params.push(startDate);
            paramIndex++;
        }

        if (endDate) {
            whereConditions.push(`ss.scheduled_date <= $${paramIndex}`);
            params.push(endDate);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const query = `
            SELECT 
                ss.id as service_id,
                ss.service_type,
                ss.scheduled_date,
                ss.completed_date,
                ss.cancelled_date,
                ss.status,
                ss.created_at,
                ss.updated_at,
                b.bus_id,
                b.registration_number,
                b.model,
                b.year,
                b.mileage,
                d.depot_id,
                d.depot_name,
                d.address as depot_address,
                r.region_id,
                r.region_name
            FROM service_schedules ss
            INNER JOIN buses b ON ss.bus_id = b.bus_id
            INNER JOIN depots d ON ss.depot_id = d.depot_id
            INNER JOIN regions r ON d.region_id = r.region_id
            ${whereClause}
            ORDER BY ss.scheduled_date DESC, ss.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        params.push(parseInt(limit), offset);

        const { rows } = await pool.query(query, params);

        // Get total count for pagination
        const countQuery = `
            SELECT COUNT(*) as total
            FROM service_schedules ss
            INNER JOIN buses b ON ss.bus_id = b.bus_id
            INNER JOIN depots d ON ss.depot_id = d.depot_id
            INNER JOIN regions r ON d.region_id = r.region_id
            ${whereClause}
        `;

        const countParams = params.slice(0, -2); // Remove limit and offset
        const { rows: countRows } = await pool.query(countQuery, countParams);
        const totalRecords = parseInt(countRows[0].total);

        res.status(200).json({
            success: true,
            message: 'Service history fetched successfully',
            data: {
                records: rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalRecords / limit),
                    totalRecords: totalRecords,
                    recordsPerPage: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching service history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch service history',
            error: error.message
        });
    }
};

const getPartsHistory = async (req, res) => {
    try {
        const { page = 1, limit = 10, regionId, depotId } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let whereClause = '';
        let queryParams = [];

        if (regionId && regionId !== 'all') {
            whereClause += ' WHERE r.region_id = $' + (queryParams.length + 1);
            queryParams.push(regionId);
        }

        if (depotId && depotId !== 'all') {
            if (whereClause) {
                whereClause += ' AND d.depot_id = $' + (queryParams.length + 1);
            } else {
                whereClause += ' WHERE d.depot_id = $' + (queryParams.length + 1);
            }
            queryParams.push(depotId);
        }

        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total
            FROM spare_parts_usage_history sph
            JOIN buses b ON sph.bus_id = b.bus_id
            JOIN depots d ON b.depot_id = d.depot_id
            JOIN regions r ON d.region_id = r.region_id
            ${whereClause}
        `;

        const countResult = await pool.query(countQuery, queryParams);
        const totalRecords = parseInt(countResult.rows[0].total);

        // Get paginated data
        const dataQuery = `
            SELECT 
                sph.usage_id,
                sph.part_id,
                sph.part_name,
                sph.quantity_used,
                sph.unit,
                sph.usage_date,
                sph.created_at,
                b.bus_id,
                b.registration_number,
                b.model,
                b.year,
                d.depot_id,
                d.depot_name,
                r.region_id,
                r.region_name,
                sph.engineer_id,
                e.first_name || ' ' || e.last_name as engineer_name
            FROM spare_parts_usage_history sph
            JOIN buses b ON sph.bus_id = b.bus_id
            JOIN depots d ON b.depot_id = d.depot_id
            JOIN regions r ON d.region_id = r.region_id
            LEFT JOIN users e ON sph.engineer_id = e.user_id
            ${whereClause}
            ORDER BY sph.usage_date DESC
            LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
        `;

        queryParams.push(parseInt(limit), offset);
        const dataResult = await pool.query(dataQuery, queryParams);

        res.json({
            success: true,
            data: dataResult.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalRecords / parseInt(limit)),
                totalRecords: totalRecords,
                hasNextPage: offset + parseInt(limit) < totalRecords,
                hasPrevPage: parseInt(page) > 1
            }
        });
    } catch (error) {
        console.error('Error fetching parts history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch parts history',
            error: error.message
        });
    }
};

// Get inspection history with filtering and pagination for DGM Technical
const getInspectionHistory = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            regionId = 'all',
            depotId = 'all',
            status = 'all'
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        let whereClause = 'WHERE 1=1';
        const queryParams = [];

        // Add region filter
        if (regionId !== 'all') {
            queryParams.push(regionId);
            whereClause += ` AND r.region_id = $${queryParams.length}`;
        }

        // Add depot filter
        if (depotId !== 'all') {
            queryParams.push(depotId);
            whereClause += ` AND d.depot_id = $${queryParams.length}`;
        }

        // Add status filter
        if (status !== 'all') {
            queryParams.push(status);
            whereClause += ` AND i.status = $${queryParams.length}`;
        }

        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total
            FROM inspections i
            JOIN depots d ON i.depot_id = d.depot_id
            JOIN regions r ON d.region_id = r.region_id
            ${whereClause}
        `;

        const countResult = await pool.query(countQuery, queryParams);
        const totalRecords = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(totalRecords / parseInt(limit));

        // Get paginated data
        const dataQuery = `
            SELECT
                i.id,
                i.inspection_type,
                i.date,
                i.time,
                i.status,
                i.created_at,
                i.updated_at,
                d.depot_id,
                d.depot_name,
                r.region_id,
                r.region_name
            FROM inspections i
            JOIN depots d ON i.depot_id = d.depot_id
            JOIN regions r ON d.region_id = r.region_id
            ${whereClause}
            ORDER BY i.date DESC, i.time DESC
            LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
        `;

        queryParams.push(parseInt(limit), offset);
        const dataResult = await pool.query(dataQuery, queryParams);

        res.status(200).json({
            success: true,
            message: 'Inspection history fetched successfully',
            data: dataResult.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalRecords,
                recordsPerPage: parseInt(limit),
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1
            }
        });
    } catch (error) {
        console.error('Error fetching inspection history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch inspection history',
            error: error.message
        });
    }
};

// Generate Regional Performance and Maintenance Reports
const generateRegionalReport = async (req, res) => {
    try {
        const { dateRange, startDate, endDate, categories } = req.query;

        // Calculate date range
        let dateCondition = '';
        let dateParams = [];

        if (dateRange === 'custom' && startDate && endDate) {
            dateCondition = `AND er.created_at BETWEEN $1 AND $2`;
            dateParams = [startDate, endDate];
        } else {
            const days = {
                'last_30_days': 30,
                'last_quarter': 90,
                'last_6_months': 180
            }[dateRange] || 30;

            dateCondition = `AND er.created_at >= NOW() - INTERVAL '${days} days'`;
        }

        // Get regional data with performance metrics
        const regionalQuery = `
            SELECT 
                r.region_id,
                r.region_name,
                COUNT(DISTINCT d.depot_id) as depot_count,
                COUNT(DISTINCT b.bus_id) as total_buses,
                COUNT(DISTINCT CASE WHEN b.status = 'Active' THEN b.bus_id END) as active_buses,
                COUNT(DISTINCT CASE WHEN b.status = 'Maintenance' THEN b.bus_id END) as maintenance_buses,
                COUNT(DISTINCT CASE WHEN b.status = 'Out of Service' THEN b.bus_id END) as out_of_service_buses,
                COUNT(DISTINCT CASE WHEN er.incident_type = 'accident' THEN er.id END) as accidents,
                COUNT(DISTINCT CASE WHEN er.incident_type = 'breakdown' THEN er.id END) as breakdowns,
                COUNT(DISTINCT er.id) as total_incidents,
                COUNT(DISTINCT ss.id) as total_services,
                COUNT(DISTINCT CASE WHEN ss.status = 'Completed' THEN ss.id END) as completed_services,
                AVG(CASE WHEN b.status = 'Active' THEN 1.0 ELSE 0.0 END) * 100 as fleet_utilization,
                CASE 
                    WHEN COUNT(DISTINCT ss.id) > 0 
                    THEN (COUNT(DISTINCT CASE WHEN ss.status = 'Completed' THEN ss.id END) * 100.0 / COUNT(DISTINCT ss.id))
                    ELSE 0 
                END as maintenance_compliance
            FROM regions r
            LEFT JOIN depots d ON r.region_id = d.region_id
            LEFT JOIN buses b ON d.depot_id = b.depot_id AND b.is_active = true AND b.is_deleted = false
            LEFT JOIN emergency_reports er ON b.bus_id = er.bus_id ${dateCondition}
            LEFT JOIN service_schedules ss ON b.bus_id = ss.bus_id ${dateCondition}
            GROUP BY r.region_id, r.region_name
            ORDER BY r.region_name
        `;

        const { rows: regionalData } = await pool.query(regionalQuery, dateParams);

        // Get total incident counts across all regions (not filtered by region)
        const incidentSummaryQuery = `
            SELECT 
                COUNT(*) as total_incidents,
                COUNT(CASE WHEN incident_type = 'accident' THEN 1 END) as total_accidents,
                COUNT(CASE WHEN incident_type = 'breakdown' THEN 1 END) as total_breakdowns
            FROM emergency_reports
            WHERE 1=1 ${dateCondition.replace('er.', '')}
        `;

        const { rows: incidentSummary } = await pool.query(incidentSummaryQuery, dateParams);

        // Calculate summary metrics
        const summary = {
            total_entities: regionalData.length,
            total_buses: regionalData.reduce((sum, region) => sum + parseInt(region.total_buses), 0),
            total_incidents: parseInt(incidentSummary[0].total_incidents),
            total_accidents: parseInt(incidentSummary[0].total_accidents),
            total_breakdowns: parseInt(incidentSummary[0].total_breakdowns),
            overall_performance: regionalData.length > 0
                ? regionalData.reduce((sum, region) => sum + parseFloat(region.fleet_utilization), 0) / regionalData.length
                : 0
        };

        const reportData = {
            reportType: 'regional',
            generatedAt: new Date().toISOString(),
            dateRange,
            summary,
            entities: regionalData.map(region => ({
                id: region.region_id,
                name: region.region_name,
                metrics: {
                    performance: {
                        fleet_utilization: parseFloat(region.fleet_utilization),
                        depot_count: parseInt(region.depot_count),
                        total_buses: parseInt(region.total_buses),
                        active_buses: parseInt(region.active_buses)
                    },
                    maintenance: {
                        scheduled_compliance: parseFloat(region.maintenance_compliance),
                        maintenance_buses: parseInt(region.maintenance_buses),
                        out_of_service_buses: parseInt(region.out_of_service_buses),
                        total_services: parseInt(region.total_services),
                        completed_services: parseInt(region.completed_services)
                    },
                    incidents: {
                        total_incidents: parseInt(region.total_incidents),
                        accidents: parseInt(region.accidents),
                        breakdowns: parseInt(region.breakdowns)
                    }
                }
            }))
        };

        res.status(200).json({
            success: true,
            message: 'Regional report generated successfully',
            data: reportData
        });
    } catch (error) {
        console.error('Error generating regional report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate regional report',
            error: error.message
        });
    }
};

// Generate Depot-Level Performance and Maintenance Reports
const generateDepotReport = async (req, res) => {
    try {
        const { dateRange, startDate, endDate, regionId, depotId, categories } = req.query;

        // Calculate date range
        let dateCondition = '';
        let dateParams = [];
        let paramCount = 0;

        if (dateRange === 'custom' && startDate && endDate) {
            paramCount += 2;
            dateCondition = `AND er.created_at BETWEEN $${paramCount - 1} AND $${paramCount}`;
            dateParams = [startDate, endDate];
        } else {
            const days = {
                'last_30_days': 30,
                'last_quarter': 90,
                'last_6_months': 180
            }[dateRange] || 30;

            dateCondition = `AND er.created_at >= NOW() - INTERVAL '${days} days'`;
        }

        // Add filters
        let whereConditions = [];
        if (regionId && regionId !== 'all') {
            paramCount++;
            whereConditions.push(`r.region_id = $${paramCount}`);
            dateParams.push(regionId);
        }
        if (depotId && depotId !== 'all') {
            paramCount++;
            whereConditions.push(`d.depot_id = $${paramCount}`);
            dateParams.push(depotId);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Get depot data with performance metrics
        const depotQuery = `
            SELECT 
                d.depot_id,
                d.depot_name,
                r.region_name,
                COUNT(DISTINCT b.bus_id) as total_buses,
                COUNT(DISTINCT CASE WHEN b.status = 'Active' THEN b.bus_id END) as active_buses,
                COUNT(DISTINCT CASE WHEN b.status = 'Maintenance' THEN b.bus_id END) as maintenance_buses,
                COUNT(DISTINCT CASE WHEN b.status = 'Out of Service' THEN b.bus_id END) as out_of_service_buses,
                COUNT(DISTINCT CASE WHEN er.incident_type = 'accident' THEN er.id END) as accidents,
                COUNT(DISTINCT CASE WHEN er.incident_type = 'breakdown' THEN er.id END) as breakdowns,
                COUNT(DISTINCT er.id) as total_incidents,
                COUNT(DISTINCT ss.id) as total_services,
                COUNT(DISTINCT CASE WHEN ss.status = 'Completed' THEN ss.id END) as completed_services,
                AVG(CASE WHEN b.status = 'Active' THEN 1.0 ELSE 0.0 END) * 100 as fleet_utilization,
                CASE 
                    WHEN COUNT(DISTINCT ss.id) > 0 
                    THEN (COUNT(DISTINCT CASE WHEN ss.status = 'Completed' THEN ss.id END) * 100.0 / COUNT(DISTINCT ss.id))
                    ELSE 0 
                END as maintenance_compliance
            FROM depots d
            JOIN regions r ON d.region_id = r.region_id
            LEFT JOIN buses b ON d.depot_id = b.depot_id AND b.is_active = true AND b.is_deleted = false
            LEFT JOIN emergency_reports er ON b.bus_id = er.bus_id ${dateCondition}
            LEFT JOIN service_schedules ss ON b.bus_id = ss.bus_id ${dateCondition}
            ${whereClause}
            GROUP BY d.depot_id, d.depot_name, r.region_name
            ORDER BY r.region_name, d.depot_name
        `;

        const { rows: depotData } = await pool.query(depotQuery, dateParams);

        // Get total incident counts across all depots (not filtered by depot/region)
        const incidentSummaryQuery = `
            SELECT 
                COUNT(*) as total_incidents,
                COUNT(CASE WHEN incident_type = 'accident' THEN 1 END) as total_accidents,
                COUNT(CASE WHEN incident_type = 'breakdown' THEN 1 END) as total_breakdowns
            FROM emergency_reports
            WHERE 1=1 ${dateCondition.replace('er.', '')}
        `;

        const { rows: incidentSummary } = await pool.query(incidentSummaryQuery, dateParams);

        // Calculate summary metrics
        const summary = {
            total_entities: depotData.length,
            total_buses: depotData.reduce((sum, depot) => sum + parseInt(depot.total_buses), 0),
            total_incidents: parseInt(incidentSummary[0].total_incidents),
            total_accidents: parseInt(incidentSummary[0].total_accidents),
            total_breakdowns: parseInt(incidentSummary[0].total_breakdowns),
            overall_performance: depotData.length > 0
                ? depotData.reduce((sum, depot) => sum + parseFloat(depot.fleet_utilization), 0) / depotData.length
                : 0
        };

        const reportData = {
            reportType: 'depot',
            generatedAt: new Date().toISOString(),
            dateRange,
            summary,
            entities: depotData.map(depot => ({
                id: depot.depot_id,
                name: depot.depot_name,
                region: depot.region_name,
                metrics: {
                    performance: {
                        fleet_utilization: parseFloat(depot.fleet_utilization),
                        total_buses: parseInt(depot.total_buses),
                        active_buses: parseInt(depot.active_buses)
                    },
                    maintenance: {
                        scheduled_compliance: parseFloat(depot.maintenance_compliance),
                        maintenance_buses: parseInt(depot.maintenance_buses),
                        out_of_service_buses: parseInt(depot.out_of_service_buses),
                        total_services: parseInt(depot.total_services),
                        completed_services: parseInt(depot.completed_services)
                    },
                    incidents: {
                        total_incidents: parseInt(depot.total_incidents),
                        accidents: parseInt(depot.accidents),
                        breakdowns: parseInt(depot.breakdowns)
                    }
                }
            }))
        };

        res.status(200).json({
            success: true,
            message: 'Depot report generated successfully',
            data: reportData
        });
    } catch (error) {
        console.error('Error generating depot report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate depot report',
            error: error.message
        });
    }
};

module.exports = {
    getAllRegions,
    getDepotsByRegion,
    getAllDepots,
    getBusesByDepot,
    getBusDetails,
    getFleetOverview,
    getDashboardSummary,
    getServiceHistory,
    getPartsHistory,
    getInspectionHistory,
    generateRegionalReport,
    generateDepotReport
};
