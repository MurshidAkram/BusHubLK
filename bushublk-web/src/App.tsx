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

// Admin Components
import AdminSidebarContent from './components/admin/AdminSidebarContent'
import CreateAccount from './pages/dashboards/admin/CreateAccount'
import AdminDashboard from './pages/dashboards/admin'
import ManageRoles from './pages/dashboards/admin/ManageRoles'
import Employees from './pages/dashboards/admin/Employees'

// Depot Manager Components
import DepotManagerSidebarContent from './components/depot-manager/DepotManagerSidebarContent'
import DepotManagerDashboard from './pages/dashboards/depot-manager'
import FleetManagement from './pages/dashboards/depot-manager/FleetManagement'
import DriverManagement from './pages/dashboards/depot-manager/DriverManagement'
import Schedules from './pages/dashboards/depot-manager/Schedules'

// Depot Operations Manager Components
import DepotOperationsManagerSidebarContent from './components/depot-ops/DepotOperationsManagerSidebarContent'
import DepotOperationsManagerDashboard from './pages/dashboards/depot-ops'

// Depot Engineer Components  
import DepotEngineerSidebarContent from './components/depot-engineer/DepotEngineerSidebarContent'
import DepotEngineerDashboard from './pages/dashboards/depot-engineer/index'
import Assignedbuses from './pages/dashboards/depot-engineer/Assignedbuses'
import Repairs from './pages/dashboards/depot-engineer/Repairs'
import Scheduling from './pages/dashboards/depot-engineer/Scheduling'
import Performance from './pages/dashboards/depot-engineer/Performance'


// Regional Technical Officer Components
import RegionalTechnicalOfficerSidebarContent from './components/regional-tech/RegionalTechnicalOfficerSidebarContent'
import RegionalTechnicalOfficerDashboard from './pages/dashboards/regional-tech/index'

// Regional Operations Officer Components
import RegionalOperationsOfficerSidebarContent from './components/regional-ops/RegionalOperationsOfficerSidebarContent'
import RegionalOperationsOfficerDashboard from './pages/dashboards/regional-ops/index'

// DGM Operations Components
import DGMOperationsSidebarContent from './components/dgm-ops/DGMOperationsSidebarContent'
import DGMOperationsDashboard from './pages/dashboards/dgm-ops/index'

// DGM Technical Components
import DGMTechnicalSidebarContent from './components/dgm-tech/DGMTechnicalSidebarContent'
import DGMTechnicalDashboard from './pages/dashboards/dgm-tech/index'

// CEO Components
import CEOSidebarContent from './components/ceo/CEOSidebarContent'
import CEODashboard from './pages/dashboards/ceo/index'

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
        <Route path="/admin" element={<DashboardLayout role="Admin" sidebarContent={<AdminSidebarContent />} />}>
          <Route index element={<AdminDashboard />} />
          <Route path="create-account" element={<CreateAccount />} />
          <Route path="manage-roles" element={<ManageRoles />} />
          <Route path="employees" element={<Employees />} />
        </Route>

        {/* Depot Manager Dashboard Routes */}
        <Route path="/depot-manager" element={<DashboardLayout role="Depot Manager" sidebarContent={<DepotManagerSidebarContent />} />}>
          <Route index element={<DepotManagerDashboard />} />
          <Route path="fleet-management" element={<FleetManagement />} />
          <Route path="driver-management" element={<DriverManagement />} /> 
          <Route path="schedules" element={<Schedules />} />
        </Route>

        {/* Depot Operations Manager Dashboard Routes */}
        <Route path="/depot-operations-manager" element={<DashboardLayout role="Depot Operations Manager" sidebarContent={<DepotOperationsManagerSidebarContent />} />}>
          <Route index element={<DepotOperationsManagerDashboard />} />
          {/* Add individual pages later */}
        </Route>

        {/* Depot Engineer Dashboard Routes */}
        <Route path="/depot-engineer" element={<DashboardLayout role="Depot Engineer" sidebarContent={<DepotEngineerSidebarContent />} />}>
          <Route index element={<DepotEngineerDashboard />} />
          <Route path="Repairs" element={<Repairs />} />
          <Route path="assigned-buses" element={<Assignedbuses />} />
          <Route path="scheduling" element={<Scheduling />} />
          <Route path="Performance" element={<Performance />} />
          {/* Add individual pages later */}
        </Route>

        {/* Regional Technical Officer Dashboard Routes */}
        <Route path="/regional-technical-officer" element={<DashboardLayout role="Regional Technical Officer" sidebarContent={<RegionalTechnicalOfficerSidebarContent />} />}>
          <Route index element={<RegionalTechnicalOfficerDashboard />} />
          {/* Add individual pages later */}
        </Route>

        {/* Regional Operations Officer Dashboard Routes */}
        <Route path="/regional-operations-officer" element={<DashboardLayout role="Regional Operations Officer" sidebarContent={<RegionalOperationsOfficerSidebarContent />} />}>
          <Route index element={<RegionalOperationsOfficerDashboard />} />
          {/* Add individual pages later */}
        </Route>

        {/* DGM Operations Dashboard Routes */}
        <Route path="/dgm-operations" element={<DashboardLayout role="DGM Operations" sidebarContent={<DGMOperationsSidebarContent />} />}>
          <Route index element={<DGMOperationsDashboard />} />
          {/* Add individual pages later */}  
        </Route>

        {/* DGM Technical Dashboard Routes */}
        <Route path="/dgm-technical" element={<DashboardLayout role="DGM Technical" sidebarContent={<DGMTechnicalSidebarContent />} />}>
          <Route index element={<DGMTechnicalDashboard />} />
          {/* Add individual pages later */}
        </Route>

        {/* CEO Dashboard Routes */}
        <Route path="/ceo" element={<DashboardLayout role="CEO" sidebarContent={<CEOSidebarContent />} />}>
          <Route index element={<CEODashboard />} />
          {/* Add individual pages later */}
        </Route>
      </Routes>
      
      {/* Conditionally render footer */}
      {showFooter && <Footer />}
    </div>
  )
}

export default App