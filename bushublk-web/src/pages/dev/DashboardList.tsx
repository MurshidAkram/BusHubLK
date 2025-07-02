export default function DashboardList() {
  const dashboards = [
    { name: 'Admin', path: '/dashboard/admin' },
    { name: 'Depot Manager', path: '/dashboard/depot-manager' },
    // Add all other dashboard links
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard Access (Dev Mode)</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {dashboards.map((dashboard) => (
          <a
            key={dashboard.path}
            href={dashboard.path}
            className="block p-6 bg-white rounded-lg shadow hover:bg-gray-50"
          >
            <h3 className="text-lg font-medium">{dashboard.name} Dashboard</h3>
            <p className="text-gray-500">{dashboard.path}</p>
          </a>
        ))}
      </div>
    </div>
  );
}