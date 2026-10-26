import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { apiUrl } from './utils/api';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LogDowntimeModal from './components/LogDowntimeModal';
import CriticalAlertToast from './components/CriticalAlertToast';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MachinesPage from './pages/MachinesPage';
import DowntimePage from './pages/DowntimePage';
import AlertsPage from './pages/AlertsPage';
import ReportsPage from './pages/ReportsPage';
import RolesPage from './pages/RolesPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';

import MyMachinePage from './pages/MyMachinePage';
import MyShiftPage from './pages/MyShiftPage';
import RequestsPage from './pages/RequestsPage';
import HandoverPage from './pages/HandoverPage';
import MyActivityPage from './pages/MyActivityPage';

function MainApp() {
  const { user, token, isAuthenticated, logout } = useAuth();
  const { socket } = useSocket();

  // Show login page when not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const [currentPage, setCurrentPage] = useState(() => (user?.role === 'OPERATOR' ? 'myMachine' : 'dashboard'));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Guard: redirect operators away from restricted admin/manager pages
  useEffect(() => {
    if (user?.role === 'OPERATOR') {
      const restricted = ['machines', 'downtime', 'alerts', 'reports', 'roles', 'settings'];
      if (restricted.includes(currentPage)) {
        setCurrentPage('myMachine');
      }
    }
  }, [user?.role, currentPage]);

  const [machines, setMachines] = useState([]);
  const [oeeMap, setOeeMap] = useState({});
  const [lineOee, setLineOee] = useState(72);
  const [downtimeLogs, setDowntimeLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [trendsData, setTrendsData] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [simulatorRunning, setSimulatorRunning] = useState(true);

  const getHeaders = useCallback(() => {
    const h = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  }, [token]);

  // Fetch initial state from REST API
  const refreshAllData = useCallback(async () => {
    try {
      // Fetch machines
      const mRes = await fetch(apiUrl('/api/machines'), { headers: getHeaders() });
      if (mRes.ok) {
        const mData = await mRes.json();
        setMachines(mData);
      }

      // Fetch OEE
      const oeeRes = await fetch(apiUrl('/api/oee'), { headers: getHeaders() });
      if (oeeRes.ok) {
        const oeeData = await oeeRes.json();
        const map = {};
        let total = 0;
        oeeData.forEach((item) => {
          map[item.machineId] = item;
          total += item.oee || 0;
        });
        setOeeMap(map);
        if (oeeData.length > 0) {
          setLineOee(Math.round(total / oeeData.length));
        }
      }

      // Fetch downtime logs
      const dtRes = await fetch(apiUrl('/api/downtime'), { headers: getHeaders() });
      if (dtRes.ok) {
        const dtData = await dtRes.json();
        setDowntimeLogs(dtData);
      }

      // Fetch alerts
      const alRes = await fetch(apiUrl('/api/oee/predictive-alerts'), { headers: getHeaders() });
      if (alRes.ok) {
        const alData = await alRes.json();
        setAlerts(alData);
      }

      // Fetch trends
      const trRes = await fetch(apiUrl('/api/oee/trends/7day'), { headers: getHeaders() });
      if (trRes.ok) {
        const trData = await trRes.json();
        setTrendsData(trData);
      }

      // Fetch users
      const uRes = await fetch(apiUrl('/api/users'), { headers: getHeaders() });
      if (uRes.ok) {
        const uData = await uRes.json();
        setAllUsers(uData);
      }

      // Fetch simulator status
      const simRes = await fetch(apiUrl('/api/simulator/status'));
      if (simRes.ok) {
        const simData = await simRes.json();
        setSimulatorRunning(simData.isRunning);
      }
    } catch (err) {
      console.warn('Initial data sync fallback (mock mode available):', err.message);
    }
  }, [getHeaders]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Setup Socket.IO real-time event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('oeeUpdate', (payload) => {
      setOeeMap((prev) => ({
        ...prev,
        [payload.machineId]: payload,
      }));

      // Update machine shift counts if provided
      if (payload.currentShift) {
        setMachines((prev) =>
          prev.map((m) =>
            m._id === payload.machineId
              ? { ...m, currentShift: payload.currentShift, status: payload.status || m.status }
              : m
          )
        );
      }
    });

    socket.on('lineOeeUpdate', (payload) => {
      if (typeof payload.oee === 'number') {
        setLineOee(payload.oee);
      }
    });

    socket.on('machineStatusUpdate', (payload) => {
      setMachines((prev) =>
        prev.map((m) => (m._id === payload._id ? { ...m, status: payload.status } : m))
      );
    });

    socket.on('downtimeStarted', (payload) => {
      setDowntimeLogs((prev) => [payload, ...prev]);
      if (payload.machine?._id || payload.machine) {
        const mId = payload.machine._id || payload.machine;
        setMachines((prev) =>
          prev.map((m) => (m._id === mId ? { ...m, status: 'DOWN' } : m))
        );
      }
    });

    socket.on('downtimeResolved', (payload) => {
      setDowntimeLogs((prev) =>
        prev.map((l) => (l._id === payload._id ? payload : l))
      );
      if (payload.machine?._id || payload.machine) {
        const mId = payload.machine._id || payload.machine;
        setMachines((prev) =>
          prev.map((m) => (m._id === mId ? { ...m, status: 'RUNNING' } : m))
        );
      }
    });

    socket.on('simulatorStateChange', (payload) => {
      setSimulatorRunning(payload.isRunning);
    });

    return () => {
      socket.off('oeeUpdate');
      socket.off('lineOeeUpdate');
      socket.off('machineStatusUpdate');
      socket.off('downtimeStarted');
      socket.off('downtimeResolved');
      socket.off('simulatorStateChange');
    };
  }, [socket]);

  // Actions
  const handleLogDowntime = async ({ machineId, reason, notes }) => {
    const res = await fetch(apiUrl('/api/downtime'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ machineId, reason, notes }),
    });
    if (res.ok) {
      const data = await res.json();
      setDowntimeLogs((prev) => [data, ...prev]);
      setMachines((prev) =>
        prev.map((m) => (m._id === machineId ? { ...m, status: 'DOWN' } : m))
      );
    }
  };

  const handleResolveDowntime = async (logId) => {
    const res = await fetch(apiUrl(`/api/downtime/${logId}/resolve`), {
      method: 'PATCH',
      headers: getHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      setDowntimeLogs((prev) =>
        prev.map((l) => (l._id === logId ? data : l))
      );
      const mId = data.machine?._id || data.machine;
      if (mId) {
        setMachines((prev) =>
          prev.map((m) => (m._id === mId ? { ...m, status: 'RUNNING' } : m))
        );
      }
    }
  };

  const handleUpdateStatus = async (machineId, status) => {
    const res = await fetch(apiUrl(`/api/machines/${machineId}/status`), {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setMachines((prev) =>
        prev.map((m) => (m._id === machineId ? updated : m))
      );
    }
  };

  const handleAddMachine = async (machineData) => {
    const res = await fetch(apiUrl('/api/machines'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(machineData),
    });
    if (res.ok) {
      const newMachine = await res.json();
      setMachines((prev) => [...prev, newMachine]);
    } else {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create machine');
    }
  };

  const handleToggleSimulator = async () => {
    const res = await fetch(apiUrl('/api/simulator/toggle'), {
      method: 'POST',
      headers: getHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      setSimulatorRunning(data.isRunning);
    }
  };

  const handleTriggerAnomaly = async () => {
    await fetch(apiUrl('/api/simulator/trigger-anomaly'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ reason: 'BREAKDOWN', notes: 'Simulated review demo breakdown' }),
    });
  };

  // Badge calculations
  const activeDowntimesCount = downtimeLogs.filter((l) => !l.endTime).length;
  const highRiskAlertsCount = alerts.filter((a) => a.atRisk).length;

  return (
    <div>
      <Header
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onSelectPage={(page) => setCurrentPage(page)}
      />

      <div className="app-body">
        <Sidebar
          currentPage={currentPage}
          onSelectPage={(page) => setCurrentPage(page)}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          downtimeBadge={activeDowntimesCount}
          alertsBadge={highRiskAlertsCount}
        />

        <main className="content">
          {currentPage === 'dashboard' && (
            <DashboardPage
              machines={machines}
              oeeMap={oeeMap}
              lineOee={lineOee}
              downtimeLogs={downtimeLogs}
              alerts={alerts}
              onOpenLogDowntime={() => setIsLogModalOpen(true)}
              onResolveDowntime={handleResolveDowntime}
            />
          )}

          {currentPage === 'machines' && (
            <MachinesPage
              machines={machines}
              oeeMap={oeeMap}
              onUpdateStatus={handleUpdateStatus}
              onAddMachine={handleAddMachine}
            />
          )}

          {currentPage === 'downtime' && (
            <DowntimePage
              downtimeLogs={downtimeLogs}
              machines={machines}
              onOpenLogDowntime={() => setIsLogModalOpen(true)}
              onResolveDowntime={handleResolveDowntime}
            />
          )}

          {currentPage === 'alerts' && <AlertsPage alerts={alerts} />}

          {currentPage === 'reports' && (
            <ReportsPage trendsData={trendsData} machines={machines} />
          )}

          {currentPage === 'roles' && <RolesPage users={allUsers} />}

          {currentPage === 'settings' && (
            <SettingsPage
              simulatorRunning={simulatorRunning}
              onToggleSimulator={handleToggleSimulator}
              onTriggerAnomaly={handleTriggerAnomaly}
            />
          )}

          {/* Operator Console Pages */}
          {currentPage === 'myMachine' && (
            <MyMachinePage
              machines={machines}
              oeeMap={oeeMap}
              downtimeLogs={downtimeLogs}
              onUpdateStatus={handleUpdateStatus}
              onResolveDowntime={handleResolveDowntime}
              onLogDowntime={handleLogDowntime}
              onOpenShiftPage={() => setCurrentPage('myShift')}
            />
          )}

          {currentPage === 'myShift' && (
            <MyShiftPage machines={machines} />
          )}

          {currentPage === 'requests' && (
            <RequestsPage machines={machines} />
          )}

          {currentPage === 'handover' && (
            <HandoverPage machines={machines} />
          )}

          {currentPage === 'myActivity' && (
            <MyActivityPage />
          )}

          {currentPage === 'profile' && <ProfilePage machines={machines} />}

        </main>
      </div>

      <LogDowntimeModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        machines={machines}
        onSubmit={handleLogDowntime}
      />

      <CriticalAlertToast
        alerts={alerts}
        onNavigateAlerts={() => setCurrentPage('alerts')}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <MainApp />
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
