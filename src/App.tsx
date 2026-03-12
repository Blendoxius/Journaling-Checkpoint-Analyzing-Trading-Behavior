/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
import Calendar from './pages/Calendar';
import MarketCalendar from './pages/MarketCalendar';
import Charts from './pages/Charts';
import Playbooks from './pages/Playbooks';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/charts" replace />} />
          <Route path="charts" element={<Charts />} />
          <Route path="playbooks" element={<Playbooks />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="market-calendar" element={<MarketCalendar />} />
          <Route path="journal" element={<Journal />} />
          <Route path="dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
