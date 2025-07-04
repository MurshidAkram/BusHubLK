import React, { useState, useMemo } from 'react';
import {
  FaBus,
  FaTools,
  FaChartLine,
  FaDownload,
  FaFilter,
} from 'react-icons/fa';

interface BreakdownItem {
  month: string;
  breakdowns: number;
}
type BreakdownData = BreakdownItem[];

interface CostItem {
  month: string;
  cost: number;
}
type CostData = CostItem[];

interface ReliabilityItem {
  rank: number;
  busId: string;
  daysSince: number;
  avgCost: number;
  score: number;
}
type ReliabilityData = ReliabilityItem[];

interface ChartCardProps {
  activeChart: string;
  breakdownData: BreakdownData;
  costData: CostData;
  maxBreakdowns: number;
  maxCost: number;
}

interface BarProps {
  item: BreakdownItem | CostItem;
  isCost: boolean;
  maxValue: number;
}

interface ReliabilityTableProps {
  data: ReliabilityData;
}

interface TableRowProps {
  bus: ReliabilityItem;
}

interface ScoreBarProps {
  score: number;
}

const PerformanceSection = () => {
  const [activeChart, setActiveChart] = useState('breakdown');

  const breakdownData = useMemo(() => [
    { month: 'Jan', breakdowns: 3 },
    { month: 'Feb', breakdowns: 2 },
    { month: 'Mar', breakdowns: 4 },
    { month: 'Apr', breakdowns: 1 },
    { month: 'May', breakdowns: 2 },
    { month: 'Jun', breakdowns: 0 },
  ], []);

  // Convert USD to LKR (approximately 1 USD = 320 LKR)
  const costData = useMemo(() => [
    { month: 'Jan', cost: 1250 * 320 },
    { month: 'Feb', cost: 850 * 320 },
    { month: 'Mar', cost: 2100 * 320 },
    { month: 'Apr', cost: 750 * 320 },
    { month: 'May', cost: 1100 * 320 },
    { month: 'Jun', cost: 400 * 320 },
  ], []);

  const reliabilityData = useMemo(() => [
    { rank: 1, busId: '#15', daysSince: 120, avgCost: 85 * 320, score: 98 },
    { rank: 2, busId: '#12', daysSince: 90, avgCost: 120 * 320, score: 92 },
    { rank: 3, busId: '#22', daysSince: 45, avgCost: 150 * 320, score: 85 },
    { rank: 4, busId: '#07', daysSince: 15, avgCost: 200 * 320, score: 72 },
  ], []);

  const maxBreakdowns = Math.max(...breakdownData.map(d => d.breakdowns));
  const maxCost = Math.max(...costData.map(d => d.cost));

  return (
    <section className="p-8 bg-gradient-to-br from-white-50 to-white-100 shadow-xl rounded-3xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-black-800 flex items-center gap-3">
         
          Bus Performance Overview
        </h2>
        {/* <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl">
            <FaDownload />
            Export
          </button>
          <button className="flex items-center gap-2 px-5 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all shadow-lg hover:shadow-xl">
            <FaFilter />
            Filter
          </button>
        </div> */}
      </div>

      {/* Chart Tabs */}
      <div className="flex gap-4">
        {['breakdown', 'cost'].map((type) => (
          <button
            key={type}
            onClick={() => setActiveChart(type)}
            className={`px-6 py-3 rounded-xl flex items-center gap-3 text-sm font-medium transition-all shadow-md hover:shadow-lg
              ${activeChart === type
                ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            {type === 'breakdown' ? <FaChartLine className="text-lg" /> : <FaTools className="text-lg" />}
            {type === 'breakdown' ? 'Breakdowns' : 'Maintenance Cost'}
          </button>
        ))}
      </div>

      {/* Chart Card */}
      <ChartCard
        activeChart={activeChart}
        breakdownData={breakdownData}
        costData={costData}
        maxBreakdowns={maxBreakdowns}
        maxCost={maxCost}
      />

      {/* Reliability Table */}
      <ReliabilityTable data={reliabilityData} />
    </section>
  );
};

const ChartCard: React.FC<ChartCardProps> = ({
  activeChart,
  breakdownData,
  costData,
  maxBreakdowns,
  maxCost,
}) => {
  const data = activeChart === 'breakdown' ? breakdownData : costData;
  const isCost = activeChart === 'cost';
  const maxValue = isCost ? maxCost : maxBreakdowns;

  return (
    <div className="bg-gray-50 rounded-xl p-5 shadow-inner">
      <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
        {isCost ? <FaTools className="text-blue-500" /> : <FaChartLine className="text-blue-500" />}
        {isCost ? 'Monthly Maintenance Cost (LKR)' : 'Monthly Breakdown Frequency'}
      </h3>
      
      {/* Chart Container with proper baseline */}
      <div className="relative">
        {/* Y-axis grid lines */}
        <div className="absolute left-0 right-0 h-56 flex flex-col justify-between">
          <div className="border-t border-gray-200"></div>
          <div className="border-t border-gray-200"></div>
          <div className="border-t border-gray-200"></div>
          <div className="border-t border-gray-300 border-t-2"></div>
        </div>
        
        {/* Chart bars */}
        <div className="flex items-end justify-between gap-4 h-56 relative">
          {data.map((item, idx) => (
            <Bar key={idx} item={item} isCost={isCost} maxValue={maxValue} />
          ))}
        </div>
      </div>
    </div>
  );
};

const Bar: React.FC<BarProps> = ({ item, isCost, maxValue }) => {
  const value = isCost ? (item as CostItem).cost : (item as BreakdownItem).breakdowns;
  const label = isCost ? `LKR ${Math.round(value / 1000)}k` : value;
  const heightPercent = maxValue ? (value / maxValue) * 100 : 0;

  return (
    <div className="flex flex-col items-center w-16">
      {/* Value label above bar */}
      <div className="text-xs font-medium text-gray-700 mb-1 h-4">
        {value > 0 ? label : ''}
      </div>
      
      {/* Bar */}
      <div className="w-full flex flex-col justify-end" style={{ height: '200px' }}>
        <div
          className="bg-blue-500 text-white text-xs rounded-t-md w-full transition-all duration-500 ease-out"
          style={{ height: `${Math.max(heightPercent, value > 0 ? 3 : 0)}%` }}
        >
        </div>
      </div>
      
      {/* Month label */}
      <div className="text-sm mt-2 text-gray-600">{item.month}</div>
    </div>
  );
};

const ReliabilityTable: React.FC<ReliabilityTableProps> = ({ data }) => (
  <div className="bg-white rounded-xl shadow p-5">
    <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
      <FaBus className="text-blue-500" />
      Reliability Ranking
    </h3>
    <div className="overflow-x-auto">
      <table className="w-full table-auto text-sm text-left border-collapse">
        <thead>
          <tr className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
            <th className="px-4 py-2">Rank</th>
            <th className="px-4 py-2">Bus ID</th>
            <th className="px-4 py-2">Days Since Breakdown</th>
            <th className="px-4 py-2">Avg. Cost (LKR)</th>
            <th className="px-4 py-2">Score</th>
          </tr>
        </thead>
        <tbody>
          {data.map((bus) => (
            <TableRow key={bus.rank} bus={bus} />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const TableRow: React.FC<TableRowProps> = ({ bus }) => (
  <tr className="border-b hover:bg-gray-50 transition">
    <td className="px-4 py-2">{bus.rank}</td>
    <td className="px-4 py-2 flex items-center gap-2">
      <FaBus className="text-blue-400" /> {bus.busId}
    </td>
    <td className="px-4 py-2">{bus.daysSince} days</td>
    <td className="px-4 py-2">LKR {Math.round(bus.avgCost / 1000)}k</td>
    <td className="px-4 py-2">
      <ScoreBar score={bus.score} />
    </td>
  </tr>
);

const ScoreBar: React.FC<ScoreBarProps> = ({ score }) => {
  const color =
    score >= 90 ? 'bg-green-500' : score >= 75 ? 'bg-yellow-400' : 'bg-red-500';
  return (
    <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
      <div
        className={`h-full text-xs text-white text-center ${color}`}
        style={{ width: `${score}%` }}
      >
        {score}%
      </div>
    </div>
  );
};

export default PerformanceSection;