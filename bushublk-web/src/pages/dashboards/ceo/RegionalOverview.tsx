// src/pages/dashboards/ceo/RegionalOverviewPage.tsx
import React, { useState } from 'react';
import {
  HiExclamationCircle,
  HiOfficeBuilding,
  HiCurrencyDollar,
  HiTrendingUp,
} from 'react-icons/hi';

type Depot = {
  id: number;
  name: string;
  vehicles: number;
  revenue: number;
  efficiency: number;
};

// 1) Define your data: provinces → districts → depot arrays
const data: Record<string, Record<string, Depot[]>> = {
  'Western Province': {
    'Colombo District': [
      { id: 1, name: 'Colombo Depot',   vehicles: 120, revenue: 120_000_000, efficiency: 91 },
      { id: 2, name: 'Homagama Depot',  vehicles: 80,  revenue:  90_000_000, efficiency: 88 },
      { id: 3, name: 'Moratuwa Depot',  vehicles: 70,  revenue:  75_000_000, efficiency: 89 },
    ],
    'Gampaha District': [
      { id: 4, name: 'Gampaha Depot',   vehicles: 80,  revenue:  85_000_000, efficiency: 87 },
      { id: 5, name: 'Negombo Depot',   vehicles: 60,  revenue:  65_000_000, efficiency: 82 },
    ],
    'Kaluthara District': [
      { id: 8, name: 'Matale Depot',     vehicles: 40, revenue:  50_000_000, efficiency: 82 },
    ],
  },
  'Central Province': {
    'Kandy District': [
      { id: 6, name: 'Kandy North Depot', vehicles: 60, revenue:  70_000_000, efficiency: 85 },
      { id: 7, name: 'Kandy South Depot', vehicles: 55, revenue:  60_000_000, efficiency: 83 },
    ],
    'Nuwara-Eliya District': [
      { id: 8, name: 'Matale Depot',     vehicles: 40, revenue:  50_000_000, efficiency: 82 },
    ],
    'Matale District': [
      { id: 8, name: 'Matale Depot',     vehicles: 40, revenue:  50_000_000, efficiency: 82 },
    ],
  },
  'Southern Province': {
    'Galle District': [
      { id: 1, name: 'Colombo Depot',   vehicles: 120, revenue: 120_000_000, efficiency: 91 },
      { id: 2, name: 'Homagama Depot',  vehicles: 80,  revenue:  90_000_000, efficiency: 88 },
      { id: 3, name: 'Moratuwa Depot',  vehicles: 70,  revenue:  75_000_000, efficiency: 89 },
    ],
    'Matara District': [
      { id: 4, name: 'Gampaha Depot',   vehicles: 80,  revenue:  85_000_000, efficiency: 87 },
      { id: 5, name: 'Negombo Depot',   vehicles: 60,  revenue:  65_000_000, efficiency: 82 },
    ],
    'Hambantota District': [
      { id: 8, name: 'Matale Depot',     vehicles: 40, revenue:  50_000_000, efficiency: 82 },
    ],
  },
  'Northern Province': {
    'Jaffna District': [
      { id: 1, name: 'Colombo Depot',   vehicles: 120, revenue: 120_000_000, efficiency: 91 },
      { id: 2, name: 'Homagama Depot',  vehicles: 80,  revenue:  90_000_000, efficiency: 88 },
      { id: 3, name: 'Moratuwa Depot',  vehicles: 70,  revenue:  75_000_000, efficiency: 89 },
    ],
    'Kilinochchi District': [
      { id: 4, name: 'Gampaha Depot',   vehicles: 80,  revenue:  85_000_000, efficiency: 87 },
      { id: 5, name: 'Negombo Depot',   vehicles: 60,  revenue:  65_000_000, efficiency: 82 },
    ],
    'Vavuniya District': [
      { id: 8, name: 'Matale Depot',     vehicles: 40, revenue:  50_000_000, efficiency: 82 },
    ],
    'Mannar District': [
      { id: 8, name: 'Matale Depot',     vehicles: 40, revenue:  50_000_000, efficiency: 82 },
    ],
    'Mullativu District': [
      { id: 8, name: 'Matale Depot',     vehicles: 40, revenue:  50_000_000, efficiency: 82 },
    ],
  },
  'Eastern Province': {
    'Ampara District': [
      { id: 1, name: 'Colombo Depot',   vehicles: 120, revenue: 120_000_000, efficiency: 91 },
      { id: 2, name: 'Homagama Depot',  vehicles: 80,  revenue:  90_000_000, efficiency: 88 },
      { id: 3, name: 'Moratuwa Depot',  vehicles: 70,  revenue:  75_000_000, efficiency: 89 },
    ],
    'Batticaloa District': [
      { id: 4, name: 'Gampaha Depot',   vehicles: 80,  revenue:  85_000_000, efficiency: 87 },
      { id: 5, name: 'Negombo Depot',   vehicles: 60,  revenue:  65_000_000, efficiency: 82 },
    ],
    'Trincomalee District': [
      { id: 8, name: 'Matale Depot',     vehicles: 40, revenue:  50_000_000, efficiency: 82 },
    ],
  },
  'North-Central Province': {
    'Anuradhapura District': [
      { id: 1, name: 'Colombo Depot',   vehicles: 120, revenue: 120_000_000, efficiency: 91 },
      { id: 2, name: 'Homagama Depot',  vehicles: 80,  revenue:  90_000_000, efficiency: 88 },
      { id: 3, name: 'Moratuwa Depot',  vehicles: 70,  revenue:  75_000_000, efficiency: 89 },
    ],
    'Polonnaruwa District': [
      { id: 4, name: 'Gampaha Depot',   vehicles: 80,  revenue:  85_000_000, efficiency: 87 },
      { id: 5, name: 'Negombo Depot',   vehicles: 60,  revenue:  65_000_000, efficiency: 82 },
    ],
  },
  'North-West Province': {
    'Kurunegala District': [
      { id: 1, name: 'Colombo Depot',   vehicles: 120, revenue: 120_000_000, efficiency: 91 },
      { id: 2, name: 'Homagama Depot',  vehicles: 80,  revenue:  90_000_000, efficiency: 88 },
      { id: 3, name: 'Moratuwa Depot',  vehicles: 70,  revenue:  75_000_000, efficiency: 89 },
    ],
    'Puttalam District': [
      { id: 4, name: 'Gampaha Depot',   vehicles: 80,  revenue:  85_000_000, efficiency: 87 },
      { id: 5, name: 'Negombo Depot',   vehicles: 60,  revenue:  65_000_000, efficiency: 82 },
    ],
  },
  'Uva Province': {
    'Badulla District': [
      { id: 1, name: 'Colombo Depot',   vehicles: 120, revenue: 120_000_000, efficiency: 91 },
      { id: 2, name: 'Homagama Depot',  vehicles: 80,  revenue:  90_000_000, efficiency: 88 },
      { id: 3, name: 'Moratuwa Depot',  vehicles: 70,  revenue:  75_000_000, efficiency: 89 },
    ],
    'Monaragala District': [
      { id: 4, name: 'Gampaha Depot',   vehicles: 80,  revenue:  85_000_000, efficiency: 87 },
      { id: 5, name: 'Negombo Depot',   vehicles: 60,  revenue:  65_000_000, efficiency: 82 },
    ],
  },
  'Sabaragamuwa': {
    'Rathnapura District': [
      { id: 1, name: 'Colombo Depot',   vehicles: 120, revenue: 120_000_000, efficiency: 91 },
      { id: 2, name: 'Homagama Depot',  vehicles: 80,  revenue:  90_000_000, efficiency: 88 },
      { id: 3, name: 'Moratuwa Depot',  vehicles: 70,  revenue:  75_000_000, efficiency: 89 },
    ],
    'Kegalle District': [
      { id: 4, name: 'Gampaha Depot',   vehicles: 80,  revenue:  85_000_000, efficiency: 87 },
      { id: 5, name: 'Negombo Depot',   vehicles: 60,  revenue:  65_000_000, efficiency: 82 },
    ],
  },
  
};

// helper lists
const provinces = Object.keys(data);
const formatCurrency = (amt: number) => {
  if (amt >= 1e9)   return `Rs. ${(amt / 1e9).toFixed(1)}B`;
  if (amt >= 1e6)   return `Rs. ${(amt / 1e6).toFixed(1)}M`;
  return `Rs. ${amt.toLocaleString()}`;
};

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
              <div className="text-sm text-gray-600 space-y-1 mb-3">
                <p>
                  <HiOfficeBuilding className="inline-block mr-1" />
                  Vehicles: <span className="font-medium">{depot.vehicles}</span>
                </p>
                <p>
                  <HiCurrencyDollar className="inline-block mr-1" />
                  Revenue: <span className="font-medium">{formatCurrency(depot.revenue)}</span>
                </p>
              </div>
              <div className="flex items-center">
                <HiTrendingUp className="inline-block mr-1 text-gray-500" />
                <span className="font-medium">{depot.efficiency}%</span>
                {depot.efficiency < 85 && (
                  <div className="flex items-center text-red-600 ml-2">
                    <HiExclamationCircle className="h-4 w-4 mr-1" />
                    <span className="text-xs">Low Efficiency</span>
                  </div>
                )}
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
