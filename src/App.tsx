import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RouterProvider } from 'react-router-dom';
import { StoreProvider } from './api/store';
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';
import Landing from './pages/Landing';
import UserHome from './pages/user/UserHome';
import UserLiveMap from './pages/user/UserLiveMap';
import StartDrive from './pages/user/StartDrive';
import HazardDetail from './pages/user/HazardDetail';
import Routes from './pages/user/Routes';
import ReportHazard from './pages/user/ReportHazard';
import JourneyHistory from './pages/user/JourneyHistory';
import VehicleProfile from './pages/user/VehicleProfile';
import Profile from './pages/user/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLiveMap from './pages/admin/AdminLiveMap';
import HazardManagement from './pages/admin/HazardManagement';
import AdminHazardDetail from './pages/admin/AdminHazardDetail';
import VerificationQueue from './pages/admin/VerificationQueue';
import Repairs from './pages/admin/Repairs';
import Analytics from './pages/admin/Analytics';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSettings from './pages/admin/AdminSettings';

const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  {
    path: '/app',
    element: <UserLayout />,
    children: [
      { index: true, element: <UserHome /> },
      { path: 'map', element: <UserLiveMap /> },
      { path: 'drive', element: <StartDrive /> },
      { path: 'routes', element: <Routes /> },
      { path: 'reports', element: <ReportHazard /> },
      { path: 'history', element: <JourneyHistory /> },
      { path: 'vehicle', element: <VehicleProfile /> },
      { path: 'profile', element: <Profile /> },
      { path: 'hazard/:id', element: <HazardDetail /> },
      { path: '*', element: <Navigate to="/app" replace /> },
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'map', element: <AdminLiveMap /> },
      { path: 'hazards', element: <HazardManagement /> },
      { path: 'hazards/detail', element: <AdminHazardDetail /> },
      { path: 'verification', element: <VerificationQueue /> },
      { path: 'repairs', element: <Repairs /> },
      { path: 'analytics', element: <Analytics /> },
      { path: 'users', element: <AdminUsers /> },
      { path: 'settings', element: <AdminSettings /> },
      { path: '*', element: <Navigate to="/admin" replace /> },
    ],
  },
]);

export default function App() {
  return (
    <StoreProvider>
      <RouterProvider router={router} />
    </StoreProvider>
  );
}
