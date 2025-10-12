const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateJWT } = require('../middlewares/authMiddleware');

router.get('/depot/:depot_id', authenticateJWT, async (req, res) => {
  try {
    const { depot_id } = req.params;
    const date = req.query.date || new Date().toISOString().slice(0, 10);

    // Get all trips for the depot and date
    const trips = await db.query(`
      SELECT
        blt.bus_id,
        b.registration_number,
        blt.route_id,
        r.route_number,
        r.route_name,
        blt.driver_id,
        u.first_name || ' ' || u.last_name AS driver_name,
        da.assignment_id,
        da.shift_start_time AS scheduled_departure,
        da.shift_end_time AS scheduled_arrival
      FROM bus_live_tracking blt
      JOIN buses b ON blt.bus_id = b.bus_id
      JOIN routes r ON blt.route_id = r.route_id
      JOIN drivers d ON blt.driver_id = d.driver_id
      JOIN users u ON d.driver_id = u.user_id
      JOIN dailyassignment da ON blt.assignment_id = da.assignment_id
      WHERE b.depot_id = $1
        AND blt.recorded_at::date = $2
      GROUP BY blt.bus_id, b.registration_number, blt.route_id, r.route_number, r.route_name, blt.driver_id, u.first_name, u.last_name, da.assignment_id, da.shift_start_time, da.shift_end_time
      ORDER BY MIN(blt.recorded_at)
    `, [depot_id, date]);

    // For each trip, get all tracking points and calculate distance and times
    const data = [];
    for (const trip of trips.rows) {
      const pointsRes = await db.query(`
        SELECT latitude, longitude, recorded_at
        FROM bus_live_tracking
        WHERE bus_id = $1 AND route_id = $2 AND assignment_id = $3 AND recorded_at::date = $4
        ORDER BY recorded_at ASC
      `, [trip.bus_id, trip.route_id, trip.assignment_id, date]);
      const points = pointsRes.rows;

      // Calculate total distance
      let totalDistance = 0;
      for (let i = 1; i < points.length; i++) {
        totalDistance += haversine(
          points[i-1].latitude, points[i-1].longitude,
          points[i].latitude, points[i].longitude
        );
      }

      // Get actual departure/arrival
      const actual_departure = points.length > 0 ? points[0].recorded_at : null;
      const actual_arrival = points.length > 0 ? points[points.length-1].recorded_at : null;

      // Status logic for departure
      let departure_status = 'Not Logged';
      let departure_time_difference = '';
      if (actual_departure && trip.scheduled_departure) {
        const scheduledDepartureDate = new Date(actual_departure);
        const [h, m, s] = trip.scheduled_departure.split(':');
        scheduledDepartureDate.setHours(h, m, s || 0, 0);
        const actualDepartureDate = new Date(actual_departure);
        const diffMs = actualDepartureDate - scheduledDepartureDate;
        const diffMin = Math.round(diffMs / 60000);
        if (diffMin < -5) {
          departure_status = 'Early';
        } else if (diffMin > 5) {
          departure_status = 'Delayed';
        } else {
          departure_status = 'On Time';
        }
        departure_time_difference = (diffMin > 0 ? '+' : '') + diffMin + ' min';
      }

      // Status logic for arrival
      let arrival_status = 'Not Logged';
      let arrival_time_difference = '';
      if (actual_arrival && trip.scheduled_arrival) {
        const scheduledArrivalDate = new Date(actual_arrival);
        const [h, m, s] = trip.scheduled_arrival.split(':');
        scheduledArrivalDate.setHours(h, m, s || 0, 0);
        const actualArrivalDate = new Date(actual_arrival);
        const diffMs = actualArrivalDate - scheduledArrivalDate;
        const diffMin = Math.round(diffMs / 60000);
        if (diffMin < -5) {
          arrival_status = 'Early';
        } else if (diffMin > 5) {
          arrival_status = 'Delayed';
        } else {
          arrival_status = 'On Time';
        }
        arrival_time_difference = (diffMin > 0 ? '+' : '') + diffMin + ' min';
      }

      data.push({
        ...trip,
        actual_departure,
        actual_arrival,
        total_distance_km: totalDistance.toFixed(2),
        departure_status,
        departure_time_difference,
        arrival_status,
        arrival_time_difference
      });
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch live tracking summary', details: err.message });
  }
});

router.get('/depot/:depot_id/distance-summary', authenticateJWT, async (req, res) => {
  try {
    const { depot_id } = req.params;
    const period = req.query.period || 'monthly';

    // Get all trips for the depot (for all months/years)
    const trips = await db.query(`
      SELECT
        TO_CHAR(blt.recorded_at, 'YYYY-MM') AS month,
        blt.bus_id,
        blt.route_id,
        blt.assignment_id
      FROM bus_live_tracking blt
      JOIN buses b ON blt.bus_id = b.bus_id
      WHERE b.depot_id = $1
      GROUP BY month, blt.bus_id, blt.route_id, blt.assignment_id
      ORDER BY month
    `, [depot_id]);

    // For each trip, get all tracking points and calculate trip distance
    const monthlyTotals = {};
    for (const trip of trips.rows) {
      const pointsRes = await db.query(`
        SELECT latitude, longitude
        FROM bus_live_tracking
        WHERE bus_id = $1 AND route_id = $2 AND assignment_id = $3
          AND TO_CHAR(recorded_at, 'YYYY-MM') = $4
          AND latitude IS NOT NULL AND longitude IS NOT NULL
          AND latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180
        ORDER BY recorded_at ASC
      `, [
        trip.bus_id,
        trip.route_id,
        trip.assignment_id,
        trip.month
      ]);
      const points = pointsRes.rows;

      // Calculate trip distance (exactly like ScheduleMonitoring)
      let tripDistance = 0;
      for (let i = 1; i < points.length; i++) {
        tripDistance += haversine(
          points[i-1].latitude, points[i-1].longitude,
          points[i].latitude, points[i].longitude
        );
      }

      // Add trip distance to monthly total
      if (!monthlyTotals[trip.month]) monthlyTotals[trip.month] = 0;
      monthlyTotals[trip.month] += tripDistance;
    }

    // Format for frontend
    const data = Object.entries(monthlyTotals).map(([month, total_distance]) => ({
      month,
      total_distance: Number(total_distance.toFixed(2))
    }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch distance summary', details: err.message });
  }
});

// Helper: Haversine formula for distance in km
function haversine(lat1, lon1, lat2, lon2) {
  function toRad(x) { return x * Math.PI / 180; }
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

module.exports = router;