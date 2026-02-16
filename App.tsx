
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AuditCenter from './pages/AuditCenter';
import Establishments from './pages/Establishments';
import Checklists from './pages/Checklists';
import QRCodePanel from './pages/QRCodePanel';
import AuditExecution from './pages/AuditExecution';
import AuditHistory from './pages/AuditHistory';
import Scheduling from './pages/Scheduling';
import Users from './pages/Users';
import { QualificaProvider, useQualificaStore } from './store';

const AppRoutes: React.FC = () => {
  const { currentUser } = useQualificaStore();

  const isAuditor = currentUser?.role === 'AUDITOR' || currentUser?.role === 'INSPETOR';

  return (
    <Routes>
      <Route path="/login" element={currentUser ? <Navigate to="/dashboard" /> : <Login />} />
      
      <Route path="/" element={
        currentUser ? (isAuditor ? <Layout><AuditCenter /></Layout> : <Layout><Dashboard /></Layout>) : <Navigate to="/login" />
      } />
      
      <Route path="/dashboard" element={
        currentUser ? <Layout><Dashboard /></Layout> : <Navigate to="/login" />
      } />

      <Route path="/audit-center" element={
        currentUser ? <Layout><AuditCenter /></Layout> : <Navigate to="/login" />
      } />

      <Route path="/estabelecimentos" element={
        currentUser ? <Layout><Establishments /></Layout> : <Navigate to="/login" />
      } />

      <Route path="/usuarios" element={
        currentUser?.role === 'ADMIN_GERAL' ? <Layout><Users /></Layout> : <Navigate to="/dashboard" />
      } />

      <Route path="/checklists" element={
        currentUser ? <Layout><Checklists /></Layout> : <Navigate to="/login" />
      } />

      <Route path="/qr-codes/:checklistId" element={
        currentUser ? <Layout><QRCodePanel /></Layout> : <Navigate to="/login" />
      } />

      <Route path="/inspecao/new" element={
        currentUser ? <NewAuditRedirect /> : <Navigate to="/login" />
      } />

      <Route path="/inspecao/:auditoriaId" element={
        currentUser ? <Layout><AuditExecution /></Layout> : <Navigate to="/login" />
      } />

      <Route path="/minhas-auditorias" element={
        currentUser ? <Layout><AuditHistory /></Layout> : <Navigate to="/login" />
      } />

      <Route path="/agendamentos" element={
        currentUser ? <Layout><Scheduling /></Layout> : <Navigate to="/login" />
      } />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const NewAuditRedirect: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { startAuditoria } = useQualificaStore();
  const navigate = useNavigate();

  useEffect(() => {
    const estabId = searchParams.get('estabelecimento');
    const checkId = searchParams.get('checklist');
    const sectorId = searchParams.get('setor');

    if (estabId && checkId) {
      const audit = startAuditoria(estabId, checkId);
      const target = sectorId ? `/inspecao/${audit.id}?sector=${sectorId}` : `/inspecao/${audit.id}`;
      navigate(target, { replace: true });
    } else {
      navigate('/dashboard');
    }
  }, [searchParams, startAuditoria, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      <p className="ml-4 font-bold text-primary">Iniciando Auditoria...</p>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <QualificaProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </QualificaProvider>
  );
};

export default App;
