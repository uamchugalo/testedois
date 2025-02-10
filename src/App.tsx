import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { PricingPage } from './components/PricingPage';
import { AssinaturaSucesso } from './pages/AssinaturaSucesso';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import Footer from './components/Footer';

function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <Toaster position="top-right" />
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={<LoginPage />} />
        
          {/* Rotas que precisam apenas de autenticação */}
          <Route
            path="/pricing"
            element={
              <ProtectedRoute requiresSubscription={false}>
                <PricingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment-success"
            element={
              <ProtectedRoute requiresSubscription={false}>
                <AssinaturaSucesso />
              </ProtectedRoute>
            }
          />

          {/* Rotas que precisam de autenticação e assinatura */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiresSubscription={true}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Redireciona / para /dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
          {/* Rota 404 */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
