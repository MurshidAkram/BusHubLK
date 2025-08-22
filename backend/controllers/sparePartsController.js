const pool = require('../config/db');
const User = require('../models/userModel');

// Add new spare part
const addSparePart = async (req, res) => {
    try {
        console.log('🔧 AddSparePart called');
        console.log('📥 Request body:', req.body);
        console.log('👤 User info:', req.user);

        const { part_name, current_stock, unit } = req.body;

        console.log('📋 Extracted data:', { part_name, current_stock, unit });

        // Validate required fields
        if (!part_name || current_stock === undefined || !unit) {
            console.log('❌ Validation failed: missing required fields');
            return res.status(400).json({
                success: false,
                message: 'Part name, current stock, and unit are required'
            });
        }

        // Get depot engineer details to find depot_id
        console.log('🔍 Getting depot engineer details...');
        const depotEngineerDetails = await User.getRoleSpecificDetails(req.user.userId, req.user.role);
        console.log('🏢 Depot engineer details:', depotEngineerDetails);

        if (!depotEngineerDetails || !depotEngineerDetails.depot_id) {
            console.log('❌ Validation failed: no depot_id found');
            return res.status(404).json({
                success: false,
                message: 'Depot engineer details or depot ID not found for this user'
            });
        }

        const depot_id = depotEngineerDetails.depot_id;
        console.log('✅ Using depot_id:', depot_id);        // Validate stock is non-negative
        if (current_stock < 0) {
            console.log('❌ Validation failed: negative stock');
            return res.status(400).json({
                success: false,
                message: 'Current stock cannot be negative'
            });
        }

        console.log('🔍 Generating part ID...');
        // Generate next part_id
        const partIdQuery = `
            SELECT 
                CONCAT('P-', LPAD((COALESCE(MAX(CAST(SUBSTRING(part_id, 3) AS INTEGER)), 0) + 1)::TEXT, 2, '0')) as next_part_id
            FROM spare_parts_inventory
        `;

        console.log('📊 Executing part ID query...');
        const partIdResult = await pool.query(partIdQuery);
        const next_part_id = partIdResult.rows[0].next_part_id;
        console.log('🆔 Generated part ID:', next_part_id);

        // Insert new spare part
        const insertQuery = `
            INSERT INTO spare_parts_inventory (
                part_id, 
                part_name, 
                current_stock, 
                unit, 
                depot_id, 
                last_restocked
            ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
            RETURNING id, part_id, part_name, current_stock, unit, created_at
        `;

        console.log('💾 Inserting new part with values:', [next_part_id, part_name, current_stock, unit, depot_id]);
        const result = await pool.query(insertQuery, [
            next_part_id,
            part_name,
            current_stock,
            unit,
            depot_id
        ]);

        console.log('✅ Part inserted successfully:', result.rows[0]);
        res.status(201).json({
            success: true,
            message: 'Spare part added successfully',
            part: result.rows[0]
        });

    } catch (error) {
        console.error('💥 Add spare part error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add spare part',
            error: error.message
        });
    }
};

// Get all spare parts for depot
const getSpareParts = async (req, res) => {
    try {
        console.log('📋 GetSpareParts called');
        console.log('👤 User info:', req.user);

        // Get depot engineer details to find depot_id
        console.log('🔍 Getting depot engineer details...');
        const depotEngineerDetails = await User.getRoleSpecificDetails(req.user.userId, req.user.role);
        console.log('🏢 Depot engineer details:', depotEngineerDetails);

        if (!depotEngineerDetails || !depotEngineerDetails.depot_id) {
            console.log('❌ No depot_id found');
            return res.status(404).json({
                success: false,
                message: 'Depot engineer details or depot ID not found for this user'
            });
        }

        const depot_id = depotEngineerDetails.depot_id;
        console.log('✅ Using depot_id:', depot_id);

        const query = `
            SELECT 
                id,
                part_id,
                part_name,
                current_stock,
                unit,
                last_restocked,
                created_at
            FROM spare_parts_inventory 
            WHERE depot_id = $1 AND deleted_at IS NULL
            ORDER BY part_name ASC
        `;

        console.log('🔍 Executing query for depot:', depot_id);
        const result = await pool.query(query, [depot_id]);
        console.log('📊 Query result:', result.rows);

        res.status(200).json({
            success: true,
            message: 'Spare parts retrieved successfully',
            parts: result.rows
        });

    } catch (error) {
        console.error('💥 Get spare parts error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve spare parts',
            error: error.message
        });
    }
};

// Update spare part stock (for restock functionality)
const updatePartStock = async (req, res) => {
    try {
        const { part_id } = req.params;
        const { current_stock } = req.body;

        // Get depot engineer details to find depot_id
        const depotEngineerDetails = await User.getRoleSpecificDetails(req.user.userId, req.user.role);
        if (!depotEngineerDetails || !depotEngineerDetails.depot_id) {
            return res.status(404).json({
                success: false,
                message: 'Depot engineer details or depot ID not found for this user'
            });
        }

        const depot_id = depotEngineerDetails.depot_id;

        // Validate required fields
        if (current_stock === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Current stock is required'
            });
        }

        // Validate stock is non-negative
        if (current_stock < 0) {
            return res.status(400).json({
                success: false,
                message: 'Current stock cannot be negative'
            });
        }

        const updateQuery = `
            UPDATE spare_parts_inventory 
            SET current_stock = $1, last_restocked = CURRENT_TIMESTAMP
            WHERE part_id = $2 AND depot_id = $3 AND deleted_at IS NULL
            RETURNING id, part_id, part_name, current_stock, unit, last_restocked
        `;

        const result = await pool.query(updateQuery, [current_stock, part_id, depot_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Spare part not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Spare part stock updated successfully',
            part: result.rows[0]
        });

    } catch (error) {
        console.error('Update spare part error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update spare part',
            error: error.message
        });
    }
};

// Use spare part (reduce stock)
const useSparePartStock = async (req, res) => {
    try {
        const { part_id } = req.params;
        const { quantity_used, bus_id, notes } = req.body;

        // Get depot engineer details to find depot_id
        const depotEngineerDetails = await User.getRoleSpecificDetails(req.user.userId, req.user.role);
        if (!depotEngineerDetails || !depotEngineerDetails.depot_id) {
            return res.status(404).json({
                success: false,
                message: 'Depot engineer details or depot ID not found for this user'
            });
        }

        const depot_id = depotEngineerDetails.depot_id;
        const engineer_id = req.user.userId;

        // Validate required fields
        if (!quantity_used || !bus_id) {
            return res.status(400).json({
                success: false,
                message: 'Quantity used and bus ID are required'
            });
        }

        // Validate quantity is positive
        if (quantity_used <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Quantity used must be positive'
            });
        }

        // Check current stock
        const stockQuery = `
            SELECT current_stock FROM spare_parts_inventory 
            WHERE part_id = $1 AND depot_id = $2 AND deleted_at IS NULL
        `;
        const stockResult = await pool.query(stockQuery, [part_id, depot_id]);

        if (stockResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Spare part not found'
            });
        }

        const currentStock = stockResult.rows[0].current_stock;
        if (currentStock < quantity_used) {
            return res.status(400).json({
                success: false,
                message: `Insufficient stock. Available: ${currentStock}, Requested: ${quantity_used}`
            });
        }

        // Update stock
        const updateQuery = `
            UPDATE spare_parts_inventory 
            SET current_stock = current_stock - $1
            WHERE part_id = $2 AND depot_id = $3 AND deleted_at IS NULL
            RETURNING id, part_id, part_name, current_stock, unit
        `;

        const result = await pool.query(updateQuery, [quantity_used, part_id, depot_id]);

        // Insert usage history record
        const usageHistoryQuery = `
            INSERT INTO spare_parts_usage_history (
                part_id,
                part_name,
                bus_id,
                depot_id,
                engineer_id,
                quantity_used,
                unit,
                usage_date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
            RETURNING usage_id, usage_date
        `;

        const usageResult = await pool.query(usageHistoryQuery, [
            part_id,
            result.rows[0].part_name,
            bus_id,
            depot_id,
            engineer_id,
            quantity_used,
            result.rows[0].unit
        ]);

        console.log('✅ Usage history recorded:', usageResult.rows[0]);

        res.status(200).json({
            success: true,
            message: 'Spare part stock updated successfully',
            part: result.rows[0],
            usageHistory: usageResult.rows[0]
        });

    } catch (error) {
        console.error('Use spare part error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to use spare part',
            error: error.message
        });
    }
};

// Delete spare part
const deleteSparepart = async (req, res) => {
    try {
        console.log('🗑️ DeleteSparePart called');
        console.log('👤 User info:', req.user);
        console.log('📥 Params:', req.params);

        const { part_id } = req.params;

        if (!part_id) {
            console.log('❌ Validation failed: no part_id provided');
            return res.status(400).json({
                success: false,
                message: 'Part ID is required'
            });
        }

        // Get depot engineer details to find depot_id
        console.log('🔍 Getting depot engineer details...');
        const depotEngineerDetails = await User.getRoleSpecificDetails(req.user.userId, req.user.role);
        console.log('🏢 Depot engineer details:', depotEngineerDetails);

        if (!depotEngineerDetails || !depotEngineerDetails.depot_id) {
            console.log('❌ No depot_id found');
            return res.status(404).json({
                success: false,
                message: 'Depot engineer details or depot ID not found for this user'
            });
        }

        const depot_id = depotEngineerDetails.depot_id;
        console.log('✅ Using depot_id:', depot_id);

        // First check if the part exists and belongs to this depot (and is not deleted)
        const checkQuery = `
            SELECT id, part_id, part_name FROM spare_parts_inventory 
            WHERE part_id = $1 AND depot_id = $2 AND deleted_at IS NULL
        `;

        console.log('🔍 Checking if part exists:', [part_id, depot_id]);
        const checkResult = await pool.query(checkQuery, [part_id, depot_id]);

        if (checkResult.rows.length === 0) {
            console.log('❌ Part not found');
            return res.status(404).json({
                success: false,
                message: 'Spare part not found or does not belong to your depot'
            });
        }

        const partToDelete = checkResult.rows[0];
        console.log('📋 Found part to delete:', partToDelete);

        // Delete the spare part (soft delete)
        const deleteQuery = `
            UPDATE spare_parts_inventory 
            SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE part_id = $1 AND depot_id = $2 AND deleted_at IS NULL
            RETURNING id, part_id, part_name, deleted_at
        `;

        console.log('🗑️ Soft deleting part:', [part_id, depot_id]);
        const deleteResult = await pool.query(deleteQuery, [part_id, depot_id]);

        if (deleteResult.rows.length === 0) {
            console.log('❌ Part not found or already deleted');
            return res.status(404).json({
                success: false,
                message: 'Spare part not found or already deleted'
            });
        }
        console.log('✅ Part soft deleted successfully:', deleteResult.rows[0]);
        res.status(200).json({
            success: true,
            message: 'Spare part deleted successfully',
            deletedPart: deleteResult.rows[0]
        });

    } catch (error) {
        console.error('💥 Delete spare part error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete spare part',
            error: error.message
        });
    }
};

// Get spare parts usage history for a bus
const getUsageHistoryByBus = async (req, res) => {
    try {
        console.log('📊 Getting usage history for bus:', req.params.bus_id);

        const { bus_id } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        // Get depot engineer details to find depot_id
        const depotEngineerDetails = await User.getRoleSpecificDetails(req.user.userId, req.user.role);
        if (!depotEngineerDetails || !depotEngineerDetails.depot_id) {
            return res.status(404).json({
                success: false,
                message: 'Depot engineer details or depot ID not found for this user'
            });
        }

        const depot_id = depotEngineerDetails.depot_id;

        const query = `
            SELECT 
                uh.usage_id,
                uh.part_id,
                uh.part_name,
                uh.bus_id,
                uh.quantity_used,
                uh.unit,
                uh.usage_date,
                b.registration_number,
                u.first_name,
                u.last_name
            FROM spare_parts_usage_history uh
            LEFT JOIN buses b ON uh.bus_id = b.bus_id
            LEFT JOIN users u ON uh.engineer_id = u.user_id
            WHERE uh.bus_id = $1 AND uh.depot_id = $2
            ORDER BY uh.usage_date DESC
            LIMIT $3 OFFSET $4
        `;

        console.log('🔍 Executing usage history query for bus:', [bus_id, depot_id, limit, offset]);
        const result = await pool.query(query, [bus_id, depot_id, limit, offset]);

        console.log('📊 Usage history results:', result.rows.length);

        res.status(200).json({
            success: true,
            message: 'Usage history retrieved successfully',
            usageHistory: result.rows,
            bus_id: parseInt(bus_id),
            total_records: result.rows.length
        });

    } catch (error) {
        console.error('💥 Get usage history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve usage history',
            error: error.message
        });
    }
};

// Get all spare parts usage history for the depot
const getAllUsageHistory = async (req, res) => {
    try {
        console.log('📊 Getting all usage history for depot');

        const { limit = 100, offset = 0, bus_id, part_id, date_from, date_to } = req.query;

        // Get depot engineer details to find depot_id
        const depotEngineerDetails = await User.getRoleSpecificDetails(req.user.userId, req.user.role);
        if (!depotEngineerDetails || !depotEngineerDetails.depot_id) {
            return res.status(404).json({
                success: false,
                message: 'Depot engineer details or depot ID not found for this user'
            });
        }

        const depot_id = depotEngineerDetails.depot_id;

        let whereClause = 'WHERE uh.depot_id = $1';
        let queryParams = [depot_id];
        let paramCounter = 2;

        // Add optional filters
        if (bus_id) {
            whereClause += ` AND uh.bus_id = $${paramCounter}`;
            queryParams.push(bus_id);
            paramCounter++;
        }

        if (part_id) {
            whereClause += ` AND uh.part_id = $${paramCounter}`;
            queryParams.push(part_id);
            paramCounter++;
        }

        if (date_from) {
            whereClause += ` AND uh.usage_date >= $${paramCounter}`;
            queryParams.push(date_from);
            paramCounter++;
        }

        if (date_to) {
            whereClause += ` AND uh.usage_date <= $${paramCounter}`;
            queryParams.push(date_to);
            paramCounter++;
        }

        const query = `
            SELECT 
                uh.usage_id,
                uh.part_id,
                uh.part_name,
                uh.bus_id,
                uh.quantity_used,
                uh.unit,
                uh.usage_date,
                b.registration_number,
                u.first_name,
                u.last_name
            FROM spare_parts_usage_history uh
            LEFT JOIN buses b ON uh.bus_id = b.bus_id
            LEFT JOIN users u ON uh.engineer_id = u.user_id
            ${whereClause}
            ORDER BY uh.usage_date DESC
            LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
        `;

        queryParams.push(limit, offset);

        console.log('🔍 Executing all usage history query:', queryParams);
        const result = await pool.query(query, queryParams);

        console.log('📊 All usage history results:', result.rows.length);

        res.status(200).json({
            success: true,
            message: 'Usage history retrieved successfully',
            usageHistory: result.rows,
            total_records: result.rows.length,
            filters: { bus_id, part_id, date_from, date_to }
        });

    } catch (error) {
        console.error('💥 Get all usage history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve usage history',
            error: error.message
        });
    }
};

// Test endpoint to check if routes are working
const testSpareParts = async (req, res) => {
    try {
        console.log('🧪 Test endpoint called');
        console.log('👤 User info:', req.user);

        res.status(200).json({
            success: true,
            message: 'Spare parts routes are working!',
            user: req.user,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('💥 Test error:', error);
        res.status(500).json({
            success: false,
            message: 'Test failed',
            error: error.message
        });
    }
};

module.exports = {
    addSparePart,
    getSpareParts,
    updatePartStock,
    useSparePartStock,
    deleteSparepart,
    getUsageHistoryByBus,
    getAllUsageHistory,
    testSpareParts
};
