import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DepotReport {
  depot: string;
  totalBuses: number;
  totalCrew: number;
  fleetUtilizationPercent: number;
  passengerFeedbackScore: number;
  routesCovered: number;
  totalRoutes: number;
}

const depotReports: DepotReport[] = [
  { depot: 'Colombo Depot', totalBuses: 120, totalCrew: 250, fleetUtilizationPercent: 85, passengerFeedbackScore: 4.3, routesCovered: 30, totalRoutes: 32 },
  { depot: 'Pettah', totalBuses: 80, totalCrew: 160, fleetUtilizationPercent: 72, passengerFeedbackScore: 4.0, routesCovered: 22, totalRoutes: 25 },
  { depot: 'Nugegoda', totalBuses: 70, totalCrew: 150, fleetUtilizationPercent: 77, passengerFeedbackScore: 3.8, routesCovered: 20, totalRoutes: 21 },
  { depot: 'Kotte', totalBuses: 65, totalCrew: 140, fleetUtilizationPercent: 79, passengerFeedbackScore: 4.1, routesCovered: 18, totalRoutes: 20 },
  { depot: 'Dehiwala', totalBuses: 90, totalCrew: 180, fleetUtilizationPercent: 80, passengerFeedbackScore: 4.2, routesCovered: 25, totalRoutes: 27 },
];

const COLORS = ['#0088FE', '#00C49F'];

const OpsReports = () => {
  return (
    <div >
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Operations Reports - Depot Summary</h1>
        <p className="text-gray-600 mb-6">
          Regional performance reports including fleet usage, crew availability, passenger feedback, and route coverage.
        </p>

        {/* Fleet Utilization Bar Chart */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Fleet Utilization % by Depot</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={depotReports} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="depot" />
              <YAxis unit="%" domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="fleetUtilizationPercent" fill="#3182CE" name="Fleet Utilization (%)" />
            </BarChart>
          </ResponsiveContainer>
        </section>

        {/* Passenger Feedback Radar Chart */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Passenger Feedback Scores by Depot</h2>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={depotReports}>
              <PolarGrid />
              <PolarAngleAxis dataKey="depot" />
              <PolarRadiusAxis angle={30} domain={[0, 5]} />
              <Radar
                name="Feedback Score"
                dataKey="passengerFeedbackScore"
                stroke="#FF7F50"
                fill="#FF7F50"
                fillOpacity={0.6}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </section>

        {/* Route Coverage Pie Charts */}
        <section>
          <h2 className="text-xl font-semibold mb-6">Route Coverage per Depot</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {depotReports.map(({ depot, routesCovered, totalRoutes }) => {
              const data = [
                { name: 'Covered', value: routesCovered },
                { name: 'Remaining', value: totalRoutes - routesCovered },
              ];

              return (
                <div key={depot} className="text-center bg-gray-100 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">{depot}</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <p className="mt-2 text-gray-700 font-medium">
                    {routesCovered} of {totalRoutes} routes covered
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default OpsReports;
