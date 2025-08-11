import React, { useEffect, useState } from 'react';
import { HiClock, HiTruck, HiUsers, HiExclamationCircle } from 'react-icons/hi';

type CrewStatus = 'Off Duty' | 'On Duty' | 'On Break';

interface CrewMember {
  id: number;
  name: string;
  contact: string;
  role: 'Driver' | 'Conductor';
  status: CrewStatus;
}

const DepotOperationsManagerDashboard = () => {
  const [crewList, setCrewList] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(false);

  // Replace with actual depot/region if needed
  const depotId = 1;
  const regionId = 1;

  useEffect(() => {
    const fetchCrew = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(
          `http://localhost:5000/api/crew?depot_id=${depotId}&region_id=${regionId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        if (!res.ok) throw new Error('Failed to fetch crew');
        const data = await res.json();
        setCrewList(
          data.map((member: any) => ({
            id: member.person_id,
            name: member.name,
            contact: member.contact,
            role: member.role,
            status: member.status,
          }))
        );
      } catch (err) {
        setCrewList([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCrew();
  }, [depotId, regionId]);

  // Count on-duty drivers and conductors
  const onDutyDrivers = crewList.filter(
    (member) => member.role === 'Driver' && member.status === 'On Duty'
  ).length;
  const onDutyConductors = crewList.filter(
    (member) => member.role === 'Conductor' && member.status === 'On Duty'
  ).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Operations Control Center</h1>
        <p className="text-gray-600">Real-time monitoring and coordination of depot operations</p>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <HiTruck className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Buses</p>
              <p className="text-2xl font-semibold text-gray-900">8</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <HiClock className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Drivers</p>
              <p className="text-2xl font-semibold text-gray-900">{loading ? '-' : onDutyDrivers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <HiUsers className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Conductors</p>
              <p className="text-2xl font-semibold text-gray-900">{loading ? '-' : onDutyConductors}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <HiExclamationCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Incidents</p>
              <p className="text-2xl font-semibold text-gray-900">2</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Operations Grid - now only 1 component per column */}
      <div >
        {/* Live Schedule Status */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900"> Schedule Status</h2>
              <HiClock className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6 space-y-4">
            {[
              { route: "Route 138", status: "On Time", delay: "0 min", bus: "NP-1234", color: "green" },
              { route: "Route 101", status: "Delayed", delay: "12 min", bus: "NY-8901", color: "red" },
              { route: "Route 154", status: "On Time", delay: "0 min", bus: "LA-9871", color: "green" },
              { route: "Route 122", status: "Early", delay: "-3 min", bus: "NC-1234", color: "blue" },
              { route: "Route 120", status: "Delayed", delay: "8 min", bus: "NP-3456", color: "red" },
            ].map((schedule, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    schedule.color === 'green' ? 'bg-green-500' :
                    schedule.color === 'red' ? 'bg-red-500' : 'bg-blue-500'
                  }`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{schedule.route}</p>
                    <p className="text-xs text-gray-500">Bus: {schedule.bus}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    schedule.color === 'green' ? 'bg-green-100 text-green-800' :
                    schedule.color === 'red' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {schedule.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{schedule.delay}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empty placeholder for grid alignment */}
        <div className="hidden lg:block" />
      </div>

      
        </div>
    
  );
};

export default DepotOperationsManagerDashboard;
