const Bus = require('../models/busModel');
const User = require('../models/userModel');

// Get buses for depot engineer (filtered by their depot)
const getBusesForDepotEngineer = async (req, res) => {
    try {
        // Use getRoleSpecificDetails instead of the non-existent getDepotEngineerDetails
        const depotEngineerDetails = await User.getRoleSpecificDetails(req.user.userId, req.user.role);
        
        if (!depotEngineerDetails || !depotEngineerDetails.depot_id) {
            return res.status(404).json({ 
                success: false,
                message: 'Depot engineer details or depot ID not found for this user' 
            });
        }

        const buses = await Bus.getByDepot(depotEngineerDetails.depot_id);
        
        res.json({
            success: true,
            message: 'Buses retrieved successfully',
            buses
        });
    } catch (err) {
        console.error('Get buses for depot engineer error:', err);
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: err.message 
        });
    }
};

// Update bus status (only status can be updated by depot engineer)
const updateBusStatus = async (req, res) => {
    const { bus_id } = req.params;
    const { status } = req.body;

    try {
        // Use getRoleSpecificDetails here as well
        const depotEngineerDetails = await User.getRoleSpecificDetails(req.user.userId, req.user.role);
        const bus = await Bus.findById(bus_id);

        if (!depotEngineerDetails || !depotEngineerDetails.depot_id) {
            return res.status(403).json({ 
                success: false,
                message: 'Depot engineer details or depot ID not found for this user' 
            });
        }

        if (!bus) {
            return res.status(404).json({ 
                success: false,
                message: 'Bus not found' 
            });
        }

        if (bus.depot_id !== depotEngineerDetails.depot_id) {
            return res.status(403).json({ 
                success: false,
                message: 'Not authorized to update this bus' 
            });
        }

        const updatedBus = await Bus.update(bus_id, { status });
        
        res.json({
            success: true,
            message: 'Bus status updated successfully',
            bus: updatedBus
        });
    } catch (err) {
        console.error('Update bus status error:', err);
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: err.message 
        });
    }
};

module.exports = {
    getBusesForDepotEngineer,
    updateBusStatus
};