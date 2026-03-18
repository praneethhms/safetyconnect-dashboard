import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FilterProvider } from './context/FilterContext';
import { TopBar } from './components/layout/TopBar';
import { GlobalFilterBar } from './components/layout/GlobalFilterBar';
import { TabNav } from './components/layout/TabNav';
import { ExecutiveKPI } from './pages/ExecutiveKPI/index';
import { CommercialStatus } from './pages/CommercialStatus/index';
import { AdoptionUsage } from './pages/AdoptionUsage/index';
import { HealthRisk } from './pages/HealthRisk/index';
import { ActionCenter } from './pages/ActionCenter/index';
import { TrendsAnalytics } from './pages/TrendsAnalytics/index';

function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <TopBar />
      <GlobalFilterBar />
      <TabNav />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/executive" element={<ExecutiveKPI />} />
          <Route path="/commercial" element={<CommercialStatus />} />
          <Route path="/adoption" element={<AdoptionUsage />} />
          <Route path="/health" element={<HealthRisk />} />
          <Route path="/actions" element={<ActionCenter />} />
          <Route path="/trends" element={<TrendsAnalytics />} />
          <Route path="*" element={<Navigate to="/executive" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FilterProvider>
          <Layout />
        </FilterProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
