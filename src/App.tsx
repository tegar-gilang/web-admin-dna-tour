import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { useStore } from './core/store';

// Features
import Login from './features/auth/Login';
import Registration from './features/registration/Registration';
import Pilgrims from './features/pilgrims/Pilgrims';
import Groups from './features/groups/Groups';
import GroupDetail from './features/groups/GroupDetail';
import RoomAllocation from './features/roomAllocation/RoomAllocation';
import TourLeaders from './features/tourLeaders/TourLeaders';
import Mutawifs from './features/mutawifs/Mutawifs';
import StaffStock from './features/staffStock/StaffStock';
import Journey from './features/journey/Journey';
import LiveMonitoring from './features/liveMonitoring/LiveMonitoring';
import Broadcast from './features/broadcast/Broadcast';
import Emergency from './features/emergency/Emergency';
import Reports from './features/reports/Reports';
import Finance from './features/finance/Finance';
import Trash from './features/trash/Trash';
import Notifications from './features/notifications/Notifications';

function App() {
  const { isAuthenticated } = useStore();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/registration" replace />} />
          <Route path="registration" element={<Registration />} />
          <Route path="finance" element={<Finance />} />
          <Route path="pilgrims" element={<Pilgrims />} />
          <Route path="groups" element={<Groups />} />
          <Route path="groups/:groupId" element={<GroupDetail />} />
          <Route path="room-allocation" element={<RoomAllocation />} />
          <Route path="tour-leaders" element={<TourLeaders />} />
          <Route path="mutawifs" element={<Mutawifs />} />
          <Route path="staff-stock" element={<StaffStock />} />
          <Route path="journey" element={<Journey />} />
          <Route path="live-monitoring" element={<LiveMonitoring />} />
          <Route path="broadcast" element={<Broadcast />} />
          <Route path="emergency" element={<Emergency />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="reports" element={<Reports />} />
          <Route path="trash" element={<Trash />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
