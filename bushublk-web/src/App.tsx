import React, { useContext } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AppContext } from './context/AppContext'
import Home from './pages/Home'
import Login from './pages/Login'
import About from './pages/About'
import Contact from './pages/Contact'
import Myprofile from './pages/Myprofile'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import DashboardLayout from './components/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'

// Admin Components
import AdminSidebarContent from './components/admin/AdminSidebarContent'
import CreateAccount from './pages/dashboards/admin/CreateAccount'
import AdminDashboard from './pages/dashboards/admin'
import ManageRoles from './pages/dashboards/admin/DepotAndRegions'
import Employees from './pages/dashboards/admin/Employees'
import BusManaging from './pages/dashboards/admin/BusManaging'
import RoutesMngmnt from './pages/dashboards/admin/RoutesMngmnt'



// Depot Manager Components
import DepotManagerSidebarContent from './components/depot-manager/DepotManagerSidebarContent'
import DepotManagerDashboard from './pages/dashboards/depot-manager'
import FleetManagement from './pages/dashboards/depot-manager/FleetManagement'
import ChecklistVerification from './pages/dashboards/depot-manager/ChecklistVerification'
import DriverManagement from './pages/dashboards/depot-manager/DriverManagement'
import Assignments from './pages/dashboards/depot-manager/Assignments'
import Maintenance from './pages/dashboards/depot-manager/Maintenance'
import Announcements from './pages/dashboards/depot-manager/Announcements'
import Reports from './pages/dashboards/depot-manager/Reports'
import Settings from './pages/dashboards/depot-manager/Settings'

// Depot Operations Manager Components  
import DepotOperationsManagerSidebarContent from './components/depot-ops/DepotOperationsManagerSidebarContent'
import DepotOperationsManagerDashboard from './pages/dashboards/depot-ops'
import DailyOperations from './pages/dashboards/depot-ops/DailyOperations'
import ScheduleMonitoring from './pages/dashboards/depot-ops/ScheduleMonitoring'
import CrewManagement from './pages/dashboards/depot-ops/CrewManagement'
import IncidentManagement from './pages/dashboards/depot-ops/IncidentManagement'  
import AnnouncementCenter from './pages/dashboards/depot-ops/AnnouncementCenter'
import OperationsReports from './pages/dashboards/depot-ops/OperationsReports'

// Depot Engineer Components  
import DepotEngineerSidebarContent from './components/depot-engineer/DepotEngineerSidebarContent'
import DepotEngineerDashboard from './pages/dashboards/depot-engineer/index'
import Busmanagement from './pages/dashboards/depot-engineer/Busmanagement'
import Busavailability from './pages/dashboards/depot-engineer/Busavailability'
import Scheduling from './pages/dashboards/depot-engineer/Scheduling'
import Spareparts from './pages/dashboards/depot-engineer/Spareparts'
import Autoforwardbusstatus from './pages/dashboards/depot-engineer/Autoforwardbusstatus'
import DepotEscalateissues from './pages/dashboards/depot-engineer/DepotEscalateissues'



// Regional Technical Officer Components
import RegionalTechnicalOfficerSidebarContent from './components/regional-tech/RegionalTechnicalOfficerSidebarContent'
import RegionalTechnicalOfficerDashboard from './pages/dashboards/regional-tech/index'
import Investigationlogs from './pages/dashboards/regional-tech/Investigationlogs'
import Regionservicemonitor from './pages/dashboards/regional-tech/Regionservicemonitor'
import Inspectionschedular from './pages/dashboards/regional-tech/Inspectionschedular'
import Rtoissuetracker from './pages/dashboards/regional-tech/Rtoissuetracker'

// Regional Operations Officer Components
import RegionalOperationsOfficerSidebarContent from './components/regional-ops/RegionalOperationsOfficerSidebarContent'
import RegionalOperationsOfficerDashboard from './pages/dashboards/regional-ops/index'
import DepotManagement from './pages/dashboards/regional-ops/DepotManagement'
import FleetCoordination from './pages/dashboards/regional-ops/FleetCoordination'
import ScheduleOversight from './pages/dashboards/regional-ops/ScheduleOversight'
import CrewOverview from './pages/dashboards/regional-ops/CrewOverview'
import IncidentTracking from './pages/dashboards/regional-ops/IncidentTracking'
import CommCenter from './pages/dashboards/regional-ops/CommCenter'
import OpsReports from './pages/dashboards/regional-ops/OpsReports'

// DGM Operations Components
import DGMOperationsSidebarContent from './components/dgm-ops/DGMOperationsSidebarContent'
import DGMOperationsDashboard from './pages/dashboards/dgm-ops/index'
import NationalOverview from './pages/dashboards/dgm-ops/NationalOverview'
import CommunicationCenter from './pages/dashboards/dgm-ops/CommunicationCenter'
import Feedback from './pages/dashboards/dgm-ops/Feedback'
import ExecutiveSettings from './pages/dashboards/dgm-ops/ExecutiveSettings'
import CrewOversight from './pages/dashboards/dgm-ops/CrewOversight'

// DGM Technical Components
import DGMTechnicalSidebarContent from './components/dgm-tech/DGMTechnicalSidebarContent'
import DGMTechnicalDashboard from './pages/dashboards/dgm-tech/index'
import Fleetmonitor from './pages/dashboards/dgm-tech/Fleetmonitor'
import Servicehistoryexplorer from './pages/dashboards/dgm-tech/Servicehistoryexplorer'
import GenerateReports from './pages/dashboards/dgm-tech/GenerateReports'
import Dgmtechnicalissue from './pages/dashboards/dgm-tech/Dgmtechnicalissue'


// CEO Components
import CEOSidebarContent from './components/ceo/CEOSidebarContent'
import CEODashboard from './pages/dashboards/ceo/index'
import DepotAndRegions from './pages/dashboards/admin/DepotAndRegions'
import BusManagement from './pages/dashboards/admin/BusManaging'
import RegionalOverviewPage from './pages/dashboards/ceo/RegionalOverview';
import WorkforceAnalyticsPage from './pages/dashboards/ceo/Workforce';
import DepotOverviewPage from './pages/dashboards/ceo/DepotOverview';
import RoutePerformancePage from './pages/dashboards/ceo/RoutePerformance';
import OperationalOverviewPage from './pages/dashboards/ceo/OperationalOverview';
import AnnouncementCenterPage from './pages/dashboards/ceo/AnnouncementCenter';
import AccidentBreakdownPage from './pages/dashboards/ceo/AccidentBreakdowns'
//import Dgmtechnicalissue from './pages/dashboards/dgm-tech/Dgmtechnicalissue'
//import Rtoissuetracker from './pages/dashboards/regional-tech/Rtoissuetracker'
//import DepotEscalateissues from './pages/dashboards/depot-engineer/DepotEscalateissues'
//import Inspectionschedular from './pages/dashboards/regional-tech/Inspectionschedular'
//import Investigationlogs from './pages/dashboards/regional-tech/Investigationlogs'
//import Regionservicemonitor from './pages/dashboards/regional-tech/Regionservicemonitor'
//import Escalate from './pages/dashboards/depot-engineer/Escalate'

const App = () => {
  const location = useLocation()
  const context = useContext(AppContext)
  
  // Check if we're in a dashboard route
  const isDashboard = location.pathname.startsWith('/admin') || 
                     location.pathname.startsWith('/depot-manager') ||
                     location.pathname.startsWith('/depot-operations-manager') ||
                     location.pathname.startsWith('/depot-engineer') ||
                     location.pathname.startsWith('/regional-technical-officer') ||
                     location.pathname.startsWith('/regional-operations-officer') ||
                     location.pathname.startsWith('/dgm-technical') ||
                     location.pathname.startsWith('/dgm-operations') ||
                     location.pathname.startsWith('/ceo') ||
                     location.pathname.startsWith('/driver') || 
                     location.pathname.startsWith('/conductor')

  // Show footer only when not in dashboard and user is not authenticated
  const showFooter = !isDashboard && !context?.isAuthenticated

  if (context?.isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className='mx-4 sm:mx-[0.25%]'>
      <Navbar />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<Login />} />
        <Route path='/about' element={<About />} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/my-profile' element={<Myprofile/>} />
        
        {/* Admin Dashboard Routes */}
        <Route element={<ProtectedRoute requiredRole="admin" />}>
  <Route
    path="/admin"
    element={<DashboardLayout role="Admin" sidebarContent={<AdminSidebarContent />} />}
  >
    <Route index element={<AdminDashboard />} />
    <Route path="create-account" element={<CreateAccount />} />
    <Route path="depot-and-regions" element={<DepotAndRegions />} />
    <Route path="employees" element={<Employees />} />
    <Route path="buses" element={<BusManaging />} />
    <Route path="routes" element={<RoutesMngmnt />} />
    {/* Add more admin routes as needed */}
  </Route>
</Route>

        {/* Depot Manager Dashboard Routes */}
        <Route element={<ProtectedRoute requiredRole="depot_manager" />}>
        <Route path="/depot-manager" element={<DashboardLayout role="Depot Manager" sidebarContent={<DepotManagerSidebarContent />} />}>
          <Route index element={<DepotManagerDashboard />} />
          <Route path="fleet-management" element={<FleetManagement />} />
          <Route path="checklist-verification" element={<ChecklistVerification />} />
          <Route path="driver-management" element={<DriverManagement />} /> 
          <Route path="assignments" element={<Assignments />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

        {/* Depot Operations Manager Dashboard Routes */}
        <Route element={<ProtectedRoute requiredRole="depot_operations" />}>
          <Route path="/depot-operations-manager" element={<DashboardLayout role="Depot Operations Manager" sidebarContent={<DepotOperationsManagerSidebarContent />} />}>
            <Route index element={<DepotOperationsManagerDashboard />} />
            <Route path="fleet-management" element={<FleetManagement />} />
          <Route path="daily-operations" element={<DailyOperations />} />
          <Route path="schedule-monitoring" element={<ScheduleMonitoring />} />
          <Route path="crew-management" element={<CrewManagement />} />
          <Route path="incident-management" element={<IncidentManagement />} />
          <Route path="announcement-center" element={<AnnouncementCenter />} />
          <Route path="operations-reports" element={<OperationsReports />} />
          </Route>
        </Route>

        {/* Depot Engineer Dashboard Routes */}
        <Route element={<ProtectedRoute requiredRole="depot_engineer" />}>
        <Route path="/depot-engineer" element={<DashboardLayout role="depot_engineer" sidebarContent={<DepotEngineerSidebarContent />} />}>
          <Route index element={<DepotEngineerDashboard />} />
          <Route path="Busmanagement" element={<Busmanagement />} />
          <Route path="Busavailability" element={<Busavailability />} />
          <Route path="scheduling" element={<Scheduling />} />
          <Route path="Spareparts" element={<Spareparts />} />
          <Route path="Autoforwardbusstatus" element={<Autoforwardbusstatus />} />
          <Route path="DepotEscalateissues" element={<DepotEscalateissues />} />
          
          {/* Add individual pages later */}
        </Route>
        </Route>

        {/* Regional Technical Officer Dashboard Routes */}
        <Route element={<ProtectedRoute requiredRole="regional_tech" />}>
        <Route path="/regional-technical-officer" element={<DashboardLayout role="Regional Technical Officer" sidebarContent={<RegionalTechnicalOfficerSidebarContent />} />}>
          <Route index element={<RegionalTechnicalOfficerDashboard />} />
          <Route path="Inspectionschedular" element={<Inspectionschedular />} />
          <Route path="Investigationlogs" element={<Investigationlogs />} />
          <Route path="Regionservicemonitor" element={<Regionservicemonitor />} />
          <Route path="Rtoissuetracker" element={<Rtoissuetracker />} />
          {/* Add individual pages later */}
        </Route>
        </Route>

        {/* Regional Operations Officer Dashboard Routes */}
        <Route element={<ProtectedRoute requiredRole="regional_operations" />}>
          <Route path="/regional-operations-officer" element={<DashboardLayout role="Regional Operations Officer" sidebarContent={<RegionalOperationsOfficerSidebarContent />} />}>
            <Route index element={<RegionalOperationsOfficerDashboard />} />
            <Route path="depot-management" element={<DepotManagement />} />
    <Route path="fleet-coordination" element={<FleetCoordination />} />
    <Route path="schedule-oversight" element={<ScheduleOversight />} />
    <Route path="crew-overview" element={<CrewOverview />} />
    <Route path="incident-tracking" element={<IncidentTracking />} />
    <Route path="comm-center" element={<CommCenter />} />
    <Route path="ops-reports" element={<OpsReports />} />
    
            {/* Add individual pages later */}
          </Route>
        </Route>

        {/* DGM Operations Dashboard Routes */}
        <Route element={<ProtectedRoute requiredRole="dgm_operations" />}>
  <Route path="/dgm-operations" element={<DashboardLayout role="DGM Operations" sidebarContent={<DGMOperationsSidebarContent />} />}>
    <Route index element={<DGMOperationsDashboard />} />
    <Route path="national-overview" element={<NationalOverview />} />
    <Route path="communication-center" element={<CommunicationCenter />} />
    <Route path="feedback" element={<Feedback />} />
    <Route path="executive-settings" element={<ExecutiveSettings />} />
     <Route path="crew-oversight" element={<CrewOversight />} />
    {/* Add individual pages later */}
  </Route>
</Route>

        {/* DGM Technical Dashboard Routes */}
        {/* DGM Technical Dashboard Routes */}
<Route element={<ProtectedRoute requiredRole="dgm_technical" />}>
  <Route path="/dgm-technical" element={<DashboardLayout role="DGM Technical" sidebarContent={<DGMTechnicalSidebarContent />} />}>
    <Route index element={<DGMTechnicalDashboard />} />
    <Route path="Fleetmonitor" element={<Fleetmonitor />} />
    <Route path="Servicehistoryexplorer" element={<Servicehistoryexplorer />} />
    <Route path="GenerateReports" element={<GenerateReports />} />
    <Route path="Dgmtechnicalissue" element={<Dgmtechnicalissue />} />

  </Route>
</Route>

        {/* CEO Dashboard Routes */}
        <Route element={<ProtectedRoute requiredRole="ceo" />}>
        <Route path="/ceo" element={<DashboardLayout role="CEO" sidebarContent={<CEOSidebarContent />} />}>
          <Route index element={<CEODashboard />} />
          <Route path="regional-overview" element={<RegionalOverviewPage />} />
          <Route path="workforce-analytics" element={<WorkforceAnalyticsPage />} />
          <Route path="depot-overview" element={<DepotOverviewPage />} />
          <Route path="accident-breakdowns" element={<AccidentBreakdownPage/>} />
          <Route path="route-performance" element={<RoutePerformancePage />} />
          <Route path="operational-overview" element={<OperationalOverviewPage />} />
          <Route path="announcement-center" element={<AnnouncementCenterPage />} />
        </Route>
        </Route>

        {/* Fallback route */}
      </Routes>
      
      {/* Conditionally render footer */}
      {showFooter && <Footer />}
    </div>
  )
}

export default App