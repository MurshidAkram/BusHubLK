// src/pages/dashboards/ceo/RegionalOverviewPage.tsx
import React, { useState } from 'react';
import {
  HiExclamationCircle,
  HiOfficeBuilding,
  HiCurrencyDollar,
  HiTrendingUp,
  HiUsers,
} from 'react-icons/hi';

type Depot = {
  id: number;
  name: string;
  staff: number;
  effeciency: number,
  vehicles: number;
};

// 1) Define your data: provinces → districts → depot arrays
const data: Record<string, Record<string, Depot[]>> = {
  'Western Province': {
    'Colombo District': [
      { id: 1, name: 'Colombo Central Depot',   vehicles: 120, staff: 100, effeciency:80 },
      { id: 2, name: 'Avissawella Depot',  vehicles: 70, staff: 50, effeciency:90 },
      { id: 3, name: 'Homagama Depot',  vehicles: 80, staff: 80, effeciency:75 },
      { id: 4, name: 'Maharagama Depot',  vehicles: 60, staff: 40, effeciency:85 },
      { id: 5, name: 'Moratuwa Depot',  vehicles: 70, staff: 70, effeciency:90},
      { id: 6, name: 'Thalangama Depot',  vehicles: 75, staff: 60, effeciency:85 },
    ],
    'Gampaha District': [
      { id: 7, name: 'Gampaha Depot',   vehicles: 70, staff: 50, effeciency:90 },
      { id: 8, name: 'Kelaniya Depot',  vehicles: 60, staff: 40, effeciency:75 },
      { id: 9, name: 'Negombo Depot',   vehicles: 65, staff: 45, effeciency:82 },
    ],
    'Kaluthara District': [
      { id: 10, name: 'Kaluthara Depot',  vehicles: 70, staff: 60, effeciency:90},
      { id: 11, name: 'Mathugama Depot',  vehicles: 60, staff: 50, effeciency:75 },
      { id: 12, name: 'Panadura Depot',  vehicles: 80, staff: 65, effeciency:85},
    ],
  },
  'Central Province': {
    'Kandy District': [
      { id: 1, name: 'Kandy North Depot', vehicles: 80, staff: 50, effeciency:75 },
      { id: 2, name: 'Kandy South Depot', vehicles: 75, staff: 40, effeciency:70 },
      { id: 3, name: 'Theldeniya Depot', vehicles: 45, staff: 30, effeciency:70 },
    ],
    'Nuwara-Eliya District': [
      { id: 4, name: 'Nuwara-Eliya Depot', vehicles: 40, staff: 60, effeciency:80 },
      { id: 5, name: 'Kothmale Depot', vehicles: 35, staff: 20, effeciency:75 },
      { id: 6, name: 'Walapane Depot', vehicles: 40, staff: 30, effeciency:90 },
    ],
    'Matale District': [
      { id: 7, name: 'Matale Depot', vehicles: 50, staff: 40, effeciency:80 },
      { id: 8, name: 'Dambulla Depot', vehicles: 65, staff: 50, effeciency:90 },
      { id: 9, name: 'Raththota Depot', vehicles: 45, staff: 30, effeciency:75 },
    ],
  },
  'Southern Province': {
    'Galle District': [
      { id: 1, name: 'Galle Depot',   vehicles: 120, staff: 60, effeciency:80 },
      { id: 2, name: 'Koggala Depot',  vehicles: 80, staff: 60, effeciency:80},
      { id: 3, name: 'Hikkadauwa Depot',  vehicles: 70, staff: 60, effeciency:80 },
    ],
    'Matara District': [
      { id: 4, name: 'Matara Depot',   vehicles: 80, staff: 60, effeciency:80 },
      { id: 5, name: 'Weligama Depot',   vehicles: 60, staff: 60, effeciency:80 },
    ],
    'Hambantota District': [
      { id: 8, name: 'Tangalle Depot',     vehicles: 40, staff: 60, effeciency:80 },
    ],
  },
  'Northern Province': {
    'Jaffna District': [
      { id: 1, name: 'Jaffna Depot',   vehicles: 120, staff: 60, effeciency:80 },
      { id: 2, name: 'Kankesanthurei Depot',  vehicles: 80, staff: 60, effeciency:80},
      { id: 3, name: 'Chavakachcheri Depot',  vehicles: 70, staff: 60, effeciency:80 },
    ],
    'Kilinochchi District': [
      { id: 4, name: 'Kilinochchi Depot',   vehicles: 80, staff: 60, effeciency:80 },
      { id: 5, name: 'Punarin Depot',   vehicles: 60, staff: 60 , effeciency:80},
    ],
    'Vavuniya District': [
      { id: 8, name: 'Matale Depot',     vehicles: 40, staff: 60 , effeciency:80},
    ],
    'Mannar District': [
      { id: 8, name: 'Matale Depot',     vehicles: 40, staff: 60, effeciency:80 },
    ],
    'Mullativu District': [
      { id: 8, name: 'Matale Depot',     vehicles: 40, staff: 60, effeciency:80 },
    ],
  },
  'Eastern Province': {
    'Ampara District': [
      { id: 1, name: 'Colombo Depot',   vehicles: 120, staff: 60, effeciency:80},
      { id: 2, name: 'Homagama Depot',  vehicles: 80, staff: 60 , effeciency:80},
      { id: 3, name: 'Moratuwa Depot',  vehicles: 70, staff: 60, effeciency:80},
    ],
    'Batticaloa District': [
      { id: 4, name: 'Gampaha Depot',   vehicles: 80, staff: 60, effeciency:80 },
      { id: 5, name: 'Negombo Depot',   vehicles: 60, staff: 60, effeciency:80},
    ],
    'Trincomalee District': [
      { id: 8, name: 'Matale Depot',     vehicles: 40, staff: 60, effeciency:80 },
    ],
  },
  'North-Central Province': {
    'Anuradhapura District': [
      { id: 1, name: 'Colombo Depot',   vehicles: 120, staff: 60, effeciency:80},
      { id: 2, name: 'Homagama Depot',  vehicles: 8, staff: 600, effeciency:80 },
      { id: 3, name: 'Moratuwa Depot',  vehicles: 70, staff: 60, effeciency:80 },
    ],
    'Polonnaruwa District': [
      { id: 4, name: 'Gampaha Depot',   vehicles: 80, staff: 60, effeciency:80 },
      { id: 5, name: 'Negombo Depot',   vehicles: 60, staff: 60, effeciency:80},
    ],
  },
  'North-West Province': {
    'Kurunegala District': [
      { id: 1, name: 'Colombo Depot',   vehicles: 120, staff: 60, effeciency:80 },
      { id: 2, name: 'Homagama Depot',  vehicles: 80, staff: 60, effeciency:80},
      { id: 3, name: 'Moratuwa Depot',  vehicles: 70, staff: 60, effeciency:80 },
    ],
    'Puttalam District': [
      { id: 4, name: 'Gampaha Depot',   vehicles: 80, staff: 60, effeciency:80 },
      { id: 5, name: 'Negombo Depot',   vehicles: 60, staff: 60, effeciency:80 },
    ],
  },
  'Uva Province': {
    'Badulla District': [
      { id: 1, name: 'Colombo Depot',   vehicles: 70, staff: 60, effeciency:80},
      { id: 2, name: 'Homagama Depot',  vehicles: 80, staff: 60, effeciency:80},
      { id: 3, name: 'Moratuwa Depot',  vehicles: 70, staff: 60, effeciency:80 },
    ],
    'Monaragala District': [
      { id: 4, name: 'Gampaha Depot',   vehicles: 80, staff: 60, effeciency:80},
      { id: 5, name: 'Negombo Depot',   vehicles: 60, staff: 60, effeciency:80},
    ],
  },
  'Sabaragamuwa': {
    'Rathnapura District': [
      { id: 1, name: 'Colombo Depot',   vehicles: 120, staff: 60, effeciency:80 },
      { id: 2, name: 'Homagama Depot',  vehicles: 80, staff: 60, effeciency:80 },
      { id: 3, name: 'Moratuwa Depot',  vehicles: 70, staff: 60, effeciency:80},
    ],
    'Kegalle District': [
      { id: 4, name: 'Gampaha Depot',   vehicles: 80, staff: 60, effeciency:80 },
      { id: 5, name: 'Negombo Depot',   vehicles: 60, staff: 60, effeciency:80 },
    ],
  },
  
};

// helper lists
const provinces = Object.keys(data);

const RegionalOverviewPage: React.FC = () => {
  const [activeProvince, setActiveProvince] = useState<string | null>(null);
  const [activeDistrict, setActiveDistrict]   = useState<string | null>(null);

  // when province changes, reset district
  const handleProvince = (prov: string) => {
    setActiveProvince(prev => (prev === prov ? null : prov));
    setActiveDistrict(null);
  };
  const handleDistrict = (dist: string) => {
    setActiveDistrict(prev => (prev === dist ? null : dist));
  };

  // get districts for the selected province
  const districts = activeProvince ? Object.keys(data[activeProvince]) : [];

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold">Regional & District Overview</h2>

      {/* 1) Province selector */}
      <div className="flex flex-wrap gap-3">
        {provinces.map(prov => {
          const isActive = prov === activeProvince;
          return (
            <button
              key={prov}
              onClick={() => handleProvince(prov)}
              className={`px-4 py-2 border rounded-lg transition ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              {prov}
            </button>
          );
        })}
      </div>

      {/* 2) District selector (if a province is chosen) */}
      {activeProvince && (
        <div className="flex flex-wrap gap-3 pt-4">
          {districts.map(dist => {
            const isActive = dist === activeDistrict;
            return (
              <button
                key={dist}
                onClick={() => handleDistrict(dist)}
                className={`px-4 py-2 border rounded-lg transition ${
                  isActive
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                {dist}
              </button>
            );
          })}
        </div>
      )}

      {/* 3) Depots grid */}
      {activeDistrict ? (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data[activeProvince!][activeDistrict!].map(depot => (
            <div
              key={depot.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-lg transition"
            >
              <h4 className="text-lg font-semibold mb-2">{depot.name}</h4>
              <div className="text-sm text-gray-600 space-y-2 mb-3">
                <p>
                  <HiOfficeBuilding className="inline-block mr-1" />
                  Active Buses: <span className="font-medium">{depot.vehicles}</span>
                </p>
                <p>
                  <HiUsers className="inline-block mr-1" />
                  Staff: <span className="font-medium">{depot.staff}</span>
                </p>
                <p>
                  <HiTrendingUp className="inline-block mr-1" />
                  Fleet Effeciency: <span className="font-medium">{depot.effeciency}%</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : activeProvince ? (
        <p className="text-gray-500 mt-4">Select a district to view its depots.</p>
      ) : (
        <p className="text-gray-500 mt-4">Select a province to begin.</p>
      )}
    </div>
  );
};

export default RegionalOverviewPage;