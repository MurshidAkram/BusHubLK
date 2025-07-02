import React from 'react';
import { 
  HiGlobeAlt, 
  HiOfficeBuilding, 
  HiTruck, 
  HiUsers, 
  HiChartBar,
  HiClock,
  HiExclamationCircle,
  HiCheckCircle,
  HiLocationMarker,
  HiTrendingUp,
  HiCurrencyDollar,
  HiFlag,
  HiLightBulb,
  HiShieldCheck,
  HiBriefcase,
  HiDocumentReport
} from 'react-icons/hi';

const DGMOperationsDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">DGM Operations Executive Dashboard</h1>
        <p className="text-indigo-100">Strategic oversight of national bus operations across all regions</p>
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

      {/* National KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <HiClock className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">National OTP</p>
              <p className="text-3xl font-bold text-gray-900">86.4%</p>
              <p className="text-sm text-green-600 flex items-center">
                <HiTrendingUp className="w-4 h-4 mr-1" />
                +2.1% vs last month
              </p>
            </div>
          </div>
        </div>

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Strategic Initiatives */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Strategic Initiatives</h2>
              <HiBriefcase className="w-6 h-6 text-gray-400" />
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[
                { 
                  initiative: "Fleet Modernization Program", 
                  progress: 68, 
                  budget: "Rs. 2.4B", 
                  completion: "Dec 2025",
                  status: "on_track"
                },
                { 
                  initiative: "Digital Transformation", 
                  progress: 45, 
                  budget: "Rs. 850M", 
                  completion: "Mar 2025",
                  status: "on_track"
                },
                { 
                  initiative: "Route Optimization Project", 
                  progress: 82, 
                  budget: "Rs. 120M", 
                  completion: "Aug 2024",
                  status: "ahead"
                },
                { 
                  initiative: "Staff Training Enhancement", 
                  progress: 34, 
                  budget: "Rs. 300M", 
                  completion: "Jun 2025",
                  status: "delayed"
                },
              ].map((project, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{project.initiative}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      project.status === 'ahead' ? 'bg-green-100 text-green-800' :
                      project.status === 'on_track' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          project.status === 'ahead' ? 'bg-green-500' :
                          project.status === 'on_track' ? 'bg-blue-500' : 'bg-red-500'
                        }`}
                        style={{width: `${project.progress}%`}}
                      ></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Budget: {project.budget}</span>
                    <span>Due: {project.completion}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Financial & Operational Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Overview */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Financial Performance</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Monthly Revenue</span>
                <span className="text-lg font-semibold text-green-600">Rs. 480M</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Operating Costs</span>
                <span className="text-lg font-semibold text-gray-900">Rs. 425M</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Profit Margin</span>
                <span className="text-lg font-semibold text-blue-600">11.5%</span>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">YTD Performance</span>
                  <span className="text-sm text-green-600 flex items-center">
                    <HiTrendingUp className="w-4 h-4 mr-1" />
                    +8.2%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Management */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Risk Assessment</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {[
                { risk: "Fleet Aging", level: "Medium", impact: "High", trend: "stable" },
                { risk: "Fuel Cost Volatility", level: "High", impact: "High", trend: "increasing" },
                { risk: "Staff Shortage", level: "Medium", impact: "Medium", trend: "decreasing" },
                { risk: "Route Competition", level: "Low", impact: "Medium", trend: "stable" },
              ].map((risk, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{risk.risk}</p>
                    <p className="text-xs text-gray-500">Impact: {risk.impact}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      risk.level === 'High' ? 'bg-red-100 text-red-800' :
                      risk.level === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {risk.level}
                    </span>
                    <p className={`text-xs mt-1 ${
                      risk.trend === 'increasing' ? 'text-red-600' :
                      risk.trend === 'decreasing' ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {risk.trend}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Innovation Pipeline */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Innovation Pipeline</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {[
                { project: "AI Route Optimization", stage: "Testing", priority: "High" },
                { project: "Electric Bus Pilot", stage: "Planning", priority: "High" },
                { project: "Mobile Ticketing 2.0", stage: "Development", priority: "Medium" },
                { project: "Predictive Maintenance", stage: "Research", priority: "Medium" },
              ].map((project, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <HiLightBulb className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{project.project}</p>
                      <p className="text-xs text-gray-500">{project.stage}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    project.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {project.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Executive Actions */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Executive Command Center</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center justify-center p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <HiDocumentReport className="w-8 h-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-blue-900">Generate Report</span>
            </button>
            <button className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <HiChartBar className="w-8 h-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-green-900">View Analytics</span>
            </button>
            <button className="flex flex-col items-center justify-center p-6 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <HiBriefcase className="w-8 h-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-purple-900">Strategic Planning</span>
            </button>
            <button className="flex flex-col items-center justify-center p-6 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
              <HiFlag className="w-8 h-8 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-orange-900">Compliance Review</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Executive Decisions */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Executive Decisions</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[
              { 
                decision: "Approved Rs. 500M budget allocation for Southern Region expansion", 
                impact: "High", 
                time: "2 hours ago", 
                category: "budget",
                status: "implemented"
              },
              { 
                decision: "Initiated emergency response protocol for Western Region flooding", 
                impact: "Critical", 
                time: "6 hours ago", 
                category: "emergency",
                status: "active"
              },
              { 
                decision: "Authorized pilot program for electric buses in Central Region", 
                impact: "Medium", 
                time: "1 day ago", 
                category: "innovation",
                status: "planning"
              },
              { 
                decision: "Approved new performance incentive structure for all regions", 
                impact: "High", 
                time: "2 days ago", 
                category: "policy",
                status: "rolling_out"
              },
            ].map((decision, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className={`w-3 h-3 rounded-full mt-1.5 ${
                  decision.category === 'budget' ? 'bg-green-500' :
                  decision.category === 'emergency' ? 'bg-red-500' :
                  decision.category === 'innovation' ? 'bg-purple-500' : 'bg-blue-500'
                }`}></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      decision.impact === 'Critical' ? 'bg-red-100 text-red-800' :
                      decision.impact === 'High' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {decision.impact} Impact
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      decision.status === 'active' ? 'bg-yellow-100 text-yellow-800' :
                      decision.status === 'implemented' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {decision.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{decision.decision}</p>
                  <p className="text-xs text-gray-500 mt-1">{decision.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DGMOperationsDashboard