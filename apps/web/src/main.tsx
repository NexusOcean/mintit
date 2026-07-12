import '@fontsource/space-mono/400.css';
import '@fontsource/space-mono/400-italic.css';
import '@fontsource/space-mono/700.css';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './app/globals.css';

import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Providers from './components/Providers';

const LoginPage = lazy(() => import('./app/(auth)/login/page'));
const DashboardLayout = lazy(() => import('./app/(dashboard)/layout'));
const OverviewPage = lazy(() => import('./app/(dashboard)/page'));
const InvoicesPage = lazy(() => import('./app/(dashboard)/invoices/page'));
const InvoiceDetailPage = lazy(
  () => import('./app/(dashboard)/invoices/[id]/page'),
);
const WalletPage = lazy(() => import('./app/(dashboard)/wallet/page'));
const SettingsPage = lazy(() => import('./app/(dashboard)/settings/page'));
const ProfilePage = lazy(() => import('./app/(dashboard)/profile/page'));

createRoot(document.getElementById('root')!).render(
  <Providers>
    <BrowserRouter>
      <Suspense>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<DashboardLayout />}>
            <Route index element={<OverviewPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="invoices/:id" element={<InvoiceDetailPage />} />
            <Route path="wallet" element={<WalletPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </Providers>,
);
