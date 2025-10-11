import React from 'react';
import { 
  HiGlobeAlt, 
  HiTruck, 
  HiUsers, 
  HiCurrencyDollar, 
  HiFlag, 
  HiExclamationCircle 
} from 'react-icons/hi';

const DGMOperationsDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="bg-white text-black rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-2">DGM Operations Executive Dashboard</h1>
        <p className="text-grey-100">Strategic oversight of national bus operations across all regions</p>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">4</p>
            <p className="text-sm opacity-90">Regions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">32</p>
            <p className="text-sm opacity-90">Depots</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">1,247</p>
            <p className="text-sm opacity-90">Total Fleet</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">2,494</p>
            <p className="text-sm opacity-90">Total Staff</p>
          </div>
        </div>
      </div>

      {/* Key Operational KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <HiTruck className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Fleet Utilization</p>
              <p className="text-3xl font-bold text-gray-900">91.2%</p>
              <p className="text-sm text-blue-600">1,137 buses active</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <HiCurrencyDollar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Revenue Efficiency</p>
              <p className="text-3xl font-bold text-gray-900">94.7%</p>
              <p className="text-sm text-purple-600">Target: 95%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-orange-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <HiUsers className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Staff Efficiency</p>
              <p className="text-3xl font-bold text-gray-900">88.9%</p>
              <p className="text-sm text-orange-600">2,217 active today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Regional Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Regional Performance Matrix</h2>
              <HiGlobeAlt className="w-6 h-6 text-gray-400" />
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[ 
                { region: "Western Region", depots: 8, otp: 89.2, efficiency: 92, budget: 98, status: "excellent" },
                { region: "Central Region", depots: 7, otp: 87.1, efficiency: 89, budget: 94, status: "good" },
                { region: "Southern Region", depots: 9, otp: 84.3, efficiency: 87, budget: 91, status: "average" },
                { region: "Northern Region", depots: 8, otp: 82.7, efficiency: 85, budget: 89, status: "needs_attention" },
              ].map((region, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${
                        region.status === 'excellent' ? 'bg-green-500' :
                        region.status === 'good' ? 'bg-blue-500' :
                        region.status === 'average' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{region.region}</h3>
                        <p className="text-sm text-gray-500">{region.depots} depots</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      region.status === 'excellent' ? 'bg-green-100 text-green-800' :
                      region.status === 'good' ? 'bg-blue-100 text-blue-800' :
                      region.status === 'average' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {region.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-lg font-semibold text-gray-900">{region.otp}%</p>
                      <p className="text-xs text-gray-500">OTP</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-gray-900">{region.efficiency}%</p>
                      <p className="text-xs text-gray-500">Efficiency</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-gray-900">{region.budget}%</p>
                      <p className="text-xs text-gray-500">Budget</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DGMOperationsDashboard;
