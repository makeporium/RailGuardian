// src/pages/SupervisorDashboard.tsx

import React from 'react';
import AdminDashboardPage from './AdminDashboard';

// The Supervisor role uses the same dashboard interface as the Admin.
// We render the AdminDashboardPage component here to avoid code duplication.
const SupervisorDashboardPage = () => {
  return <AdminDashboardPage />;
};

export default SupervisorDashboardPage;