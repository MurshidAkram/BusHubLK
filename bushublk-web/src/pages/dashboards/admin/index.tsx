// pages/dashboard/admin/index.tsx
import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../../context/AppContext';
import { 
  HiUserAdd, 
  HiCog, 
  HiUsers, 
  HiChartBar, 
  HiOutlineTruck, 
  HiOutlineOfficeBuilding, 
  HiOutlineUserGroup, 
  HiOutlineShieldCheck 
} from 'react-icons/hi';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { toast } from 'react-toastify';

// --- Interfaces for fetched data ---
interface User {
  id: string;
  username: string;
  role: string;
  is_active: boolean;
  created_at?: string;
}

interface Bus {
  bus_id: string;
  registration_number: string;
  status: string;
  created_at?: string;
}

interface Depot {
  depot_id: string;
  depot_name: string;
}

// --- Interfaces for chart data ---
interface ChartData {
  name: string;
  value: number;
}

// --- Helper function to format time strings ---
const timeAgo = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return "Just now";
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    totalBuses: 0,
    totalDepots: 0,
  });
  const [roleDistribution, setRoleDistribution] = useState<ChartData[]>([]);
  const [busStatusDistribution, setBusStatusDistribution] = useState<ChartData[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const context = useContext(AppContext);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersRes, busesRes, depotsRes] = await Promise.all([
          fetch('http://43.205.127.30:5000/api/users', { headers: { 'Authorization': `Bearer ${context?.token}` } }),
          fetch('http://43.205.127.30:5000/api/buses', { headers: { 'Authorization': `Bearer ${context?.token}` } }),
          fetch('http://43.205.127.30:5000/api/depots', { headers: { 'Authorization': `Bearer ${context?.token}` } })
        ]);

        if (!usersRes.ok || !busesRes.ok || !depotsRes.ok) {
          throw new Error('Failed to fetch dashboard data. Please refresh.');
        }

        const usersData = await usersRes.json();
        const busesData = await busesRes.json();
        const depotsData = await depotsRes.json();

        const users: User[] = usersData.users || [];
        const buses: Bus[] = busesData.buses || [];
        const depots: Depot[] = depotsData.depots || [];

        // --- Process Stats ---
        setStats({
          totalEmployees: users.length,
          activeEmployees: users.filter(u => u.is_active).length,
          totalBuses: buses.length,
          totalDepots: depots.length,
        });

        // --- Process Chart Data ---
        const roleCounts = users.reduce((acc, user) => {
          const roleName = user.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          acc[roleName] = (acc[roleName] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        setRoleDistribution(Object.entries(roleCounts).map(([name, value]) => ({ name, value })));

        const statusCounts = buses.reduce((acc, bus) => {
          acc[bus.status] = (acc[bus.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        setBusStatusDistribution(Object.entries(statusCounts).map(([name, value]) => ({ name, value })));

        // --- Process Recent Activities ---
        const latestUsers = users
          .filter(u => u.created_at)
          .map(u => ({ type: 'user', data: u, time: new Date(u.created_at!) }));
        
        const latestBuses = buses
          .filter(b => b.created_at)
          .map(b => ({ type: 'bus', data: b, time: new Date(b.created_at!) }));

        const combinedActivities = [...latestUsers, ...latestBuses]
          .sort((a, b) => b.time.getTime() - a.time.getTime())
          .slice(0, 5);
        setRecentActivities(combinedActivities);

      } catch (error: any) {
        toast.error(error.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    if (context?.token) {
      fetchData();
    }
  }, [context?.token]);

  const quickActions = [
    { icon: <HiUserAdd className="h-6 w-6" />, name: 'Add Employee', href: 'admin/create-account' },
    { icon: <HiCog className="h-6 w-6" />, name: 'Manage Depots and Regions', href: 'admin/depot-and-regions' },
    { icon: <HiUsers className="h-6 w-6" />, name: 'View All Staff', href: 'admin/employees' },
    { icon: <HiChartBar className="h-6 w-6" />, name: 'Manage Buses', href: 'admin/buses' },
  ];

  const statCards = [
    { name: 'Total Employees', value: stats.totalEmployees, icon: <HiOutlineUserGroup className="h-6 w-6 text-blue-500" /> },
    { name: 'Active Staff', value: stats.activeEmployees, icon: <HiOutlineShieldCheck className="h-6 w-6 text-green-500" /> },
    { name: 'Total Buses', value: stats.totalBuses, icon: <HiOutlineTruck className="h-6 w-6 text-yellow-500" /> },
    { name: 'Managed Depots', value: stats.totalDepots, icon: <HiOutlineOfficeBuilding className="h-6 w-6 text-purple-500" /> },
  ];

  const PIE_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white p-5 rounded-xl shadow-md flex items-center space-x-4">
            <div className="bg-gray-100 p-3 rounded-full">{stat.icon}</div>
            <div>
              <p className="text-sm text-gray-500">{stat.name}</p>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Employee Distribution by Role</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={roleDistribution} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name="Employees" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Bus Status Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={busStatusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {busStatusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
          <h2 className="font-semibold text-gray-700 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <a
                key={action.name}
                href={action.href}
                className="flex flex-col items-center justify-center p-4 rounded-lg bg-gray-50 hover:bg-blue-100 hover:shadow-lg transition-all duration-300"
              >
                <div className="p-3 rounded-full text-blue-600 mb-2">
                  {action.icon}
                </div>
                <span className="text-sm text-center text-gray-600 font-medium">{action.name}</span>
              </a>
            ))}
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="font-semibold text-gray-700 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivities.length > 0 ? recentActivities.map((item, index) => (
              <div key={index} className="flex items-start">
                <div className={`p-2 rounded-full mr-3 mt-1 ${item.type === 'user' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                  {item.type === 'user' 
                    ? <HiUserAdd className="h-5 w-5 text-green-600" />
                    : <HiOutlineTruck className="h-5 w-5 text-yellow-600" />
                  }
                </div>
                <div>
                  <p className="text-sm text-gray-800">
                    {item.type === 'user'
                      ? <>New user <span className="font-semibold">@{item.data.username}</span> created.</>
                      : <>Bus <span className="font-semibold">{item.data.registration_number}</span> registered.</>
                    }
                  </p>
                  <p className="text-xs text-gray-500">{timeAgo(item.time.toISOString())}</p>
                </div>
              </div>
            )) : <p className="text-sm text-gray-500">No recent activities found.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard