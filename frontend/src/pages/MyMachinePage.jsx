import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import DowntimeTimerBanner from '../components/DowntimeTimerBanner';
import ProductionEntryForm from '../components/ProductionEntryForm';
import LogDowntimeModal from '../components/LogDowntimeModal';

export default function MyMachinePage({
  machines = [],
  oeeMap = {},
  downtimeLogs = [],
  onUpdateStatus,
  onResolveDowntime,
  onLogDowntime,
  onOpenShiftPage,
}) {
  const { user } = useAuth();
  const { socket } = useSocket();

  // Filter only machines assigned to this operator
  const assignedMachineIds = new Set(
    (user?.assignedMachines || []).map((m) => (m._id ? m._id.toString() : m.toString()))
  );

  const operatorMachines = machines.filter((m) =>
    assignedMachineIds.has(m._id.toString())
  );

  const [selectedMachineId, setSelectedMachineId] = useState(
    operatorMachines[0]?._id || machines[0]?._id || ''
  );

  useEffect(() => {
    if (!selectedMachineId && operatorMachines.length > 0) {
      setSelectedMachineId(operatorMachines[0]._id);
    }
  }, [operatorMachines, selectedMachineId]);

  const [activeShift, setActiveShift] = useState(null);
  const [isDowntimeModalOpen, setIsDowntimeModalOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  // Fetch active shift session for target progress
  const fetchActiveShift = useCallback(async () => {
    try {
      const res = await fetch('/api/shifts/active', {
        headers: { Authorization: `Bearer ${localStorage.getItem('oee_token') || ''}` },
      });
      if (res.ok) {
        const data = await res.json();
        setActiveShift(data);
      }
    } catch (err) {
      console.warn('Failed to fetch active shift:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchActiveShift();
  }, [fetchActiveShift]);

  // Listen to socket events for shift and machine updates
  useEffect(() => {
    if (!socket) return;
    socket.on('shiftStarted', (shift) => {
      if (shift.operator?._id === user?.id || shift.operator === user?.id) {
        setActiveShift(shift);
      }
    });
    socket.on('shiftEnded', (shift) => {
      if (shift.operator?._id === user?.id || shift.operator === user?.id) {
        setActiveShift(null);
      }
    });
    return () => {
      socket.off('shiftStarted');
      socket.off('shiftEnded');
    };
  }, [socket, user]);

  const machine = operatorMachines.find((m) => m._id === selectedMachineId) || operatorMachines[0];

  // Find active downtime log for this machine
  const activeDowntime = downtimeLogs.find(
    (l) => (l.machine?._id === machine?._id || l.machine === machine?._id) && !l.endTime
  );

  if (!machine) {
    return (
      <div className="panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</div>
        <div className="page-title" style={{ fontSize: '20px' }}>No Assigned Machine Station</div>
        <p style={{ color: 'var(--text-muted)', maxWidth: '460px', margin: '0 auto 16px' }}>
          Your operator account currently has no machine assigned. Contact your shop supervisor or plant administrator to assign your production station.
        </p>
      </div>
    );
  }

  const oeeData = oeeMap[machine._id] || {};
  const oee = Math.round(oeeData.oee ?? 75);
  const a = Math.round(oeeData.availability ?? 85);
  const p = Math.round(oeeData.performance ?? 90);
  const q = Math.round(oeeData.quality ?? 98);

  const status = machine.status || 'RUNNING';
  const oeeColor = oee >= 75 ? 'var(--green)' : oee >= 55 ? 'var(--amber)' : 'var(--red)';

  // Shift progress calculation
  const targetUnits = activeShift?.targetUnits || 1000;
  const goodUnits = machine.currentShift?.goodUnits || 0;
  const progressPct = Math.min(100, Math.round((goodUnits / (targetUnits || 1)) * 100));

  const handleStatusChange = async (newStatus) => {
    if (newStatus === 'DOWN') {
      setIsDowntimeModalOpen(true);
      return;
    }
    setStatusLoading(true);
    try {
      await onUpdateStatus(machine._id, newStatus);
    } catch (err) {
      console.error('Failed to change status:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <div className="operator-console">
      {/* Top Banner if machine selector has multiple assigned */}
      {operatorMachines.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {operatorMachines.map((m) => (
            <button
              key={m._id}
              className={`btn ${selectedMachineId === m._id ? 'btn-primary' : ''}`}
              onClick={() => setSelectedMachineId(m._id)}
              style={{ fontSize: '13px', padding: '8px 16px' }}
            >
              {m.name} ({m.status})
            </button>
          ))}
        </div>
      )}

      {/* Active Downtime Timer Banner */}
      {status === 'DOWN' && activeDowntime && (
        <DowntimeTimerBanner
          downtimeLog={activeDowntime}
          onResolve={onResolveDowntime}
        />
      )}

      {/* Main Console Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Machine Status & Large Touch Controls */}
        <div className="panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Station Console · Line {machine.lineId || 'A'}
              </div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', margin: '4px 0', color: 'var(--text)' }}>
                {machine.name}
              </h1>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {machine.type} Station · Cycle Time: {machine.idealCycleTimeSeconds}s
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  background: status === 'RUNNING' ? 'rgba(63,182,95,0.15)' : status === 'DOWN' ? 'rgba(230,72,60,0.15)' : 'rgba(242,169,59,0.15)',
                  border: `1.5px solid ${status === 'RUNNING' ? 'var(--green)' : status === 'DOWN' ? 'var(--red)' : 'var(--amber)'}`,
                }}
              >
                <span className={`led ${status === 'RUNNING' ? 'green' : status === 'DOWN' ? 'red' : 'amber'}`} />
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '15px',
                    fontWeight: 800,
                    color: status === 'RUNNING' ? 'var(--green)' : status === 'DOWN' ? 'var(--red)' : 'var(--amber)',
                    letterSpacing: '1px',
                  }}
                >
                  {status}
                </span>
              </div>
            </div>
          </div>

          {/* Touch-Friendly Machine Action Buttons */}
          <div style={{ marginTop: '20px' }}>
            <div style={{ fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
              MACHINE STATE CONTROL (TOUCH-ENABLED)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {/* START */}
              <button
                id="btn-machine-start"
                type="button"
                onClick={() => handleStatusChange('RUNNING')}
                disabled={statusLoading || status === 'RUNNING'}
                style={{
                  minHeight: '74px',
                  borderRadius: '12px',
                  border: 'none',
                  background: status === 'RUNNING' ? 'rgba(63,182,95,0.25)' : 'linear-gradient(135deg, var(--green), #2ea043)',
                  color: status === 'RUNNING' ? 'var(--green)' : '#fff',
                  borderStyle: status === 'RUNNING' ? 'dashed' : 'none',
                  borderWidth: status === 'RUNNING' ? '2px' : 0,
                  borderColor: 'var(--green)',
                  cursor: status === 'RUNNING' || statusLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  boxShadow: status === 'RUNNING' ? 'none' : '0 4px 14px rgba(63,182,95,0.4)',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 800, letterSpacing: '1px' }}>
                  {status === 'RUNNING' ? 'RUNNING' : 'START'}
                </span>
              </button>

              {/* IDLE */}
              <button
                id="btn-machine-idle"
                type="button"
                onClick={() => handleStatusChange('IDLE')}
                disabled={statusLoading || status === 'IDLE'}
                style={{
                  minHeight: '74px',
                  borderRadius: '12px',
                  border: 'none',
                  background: status === 'IDLE' ? 'rgba(242,169,59,0.25)' : 'linear-gradient(135deg, var(--amber), #cf8823)',
                  color: status === 'IDLE' ? 'var(--amber)' : '#fff',
                  borderStyle: status === 'IDLE' ? 'dashed' : 'none',
                  borderWidth: status === 'IDLE' ? '2px' : 0,
                  borderColor: 'var(--amber)',
                  cursor: status === 'IDLE' || statusLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  boxShadow: status === 'IDLE' ? 'none' : '0 4px 14px rgba(242,169,59,0.35)',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                </svg>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 800, letterSpacing: '1px' }}>
                  {status === 'IDLE' ? 'IDLE' : 'SET IDLE'}
                </span>
              </button>

              {/* STOP */}
              <button
                id="btn-machine-stop"
                type="button"
                onClick={() => handleStatusChange('DOWN')}
                disabled={statusLoading || status === 'DOWN'}
                style={{
                  minHeight: '74px',
                  borderRadius: '12px',
                  border: 'none',
                  background: status === 'DOWN' ? 'rgba(230,72,60,0.25)' : 'linear-gradient(135deg, var(--red), #b73228)',
                  color: status === 'DOWN' ? 'var(--red)' : '#fff',
                  borderStyle: status === 'DOWN' ? 'dashed' : 'none',
                  borderWidth: status === 'DOWN' ? '2px' : 0,
                  borderColor: 'var(--red)',
                  cursor: status === 'DOWN' || statusLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  boxShadow: status === 'DOWN' ? 'none' : '0 4px 14px rgba(230,72,60,0.4)',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                </svg>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 800, letterSpacing: '1px' }}>
                  {status === 'DOWN' ? 'STOPPED' : 'STOP'}
                </span>
              </button>
            </div>
          </div>

          {/* Shift Target Progress Bar */}
          <div style={{ marginTop: '26px', padding: '16px', background: 'var(--panel-2)', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text)' }}>
                  Shift Target Progress
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                  ({activeShift ? activeShift.shiftName : 'No Active Shift'})
                </span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 800, color: 'var(--cyan)' }}>
                {goodUnits} / {targetUnits} units ({progressPct}%)
              </span>
            </div>

            <div style={{ height: '14px', background: 'var(--panel)', borderRadius: '7px', overflow: 'hidden', border: '1px solid var(--steel)' }}>
              <div
                style={{
                  height: '100%',
                  width: `${progressPct}%`,
                  background: progressPct >= 100 ? 'var(--green)' : 'linear-gradient(90deg, var(--cyan), var(--green))',
                  borderRadius: '7px',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>

            {!activeShift && (
              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="btn"
                  onClick={onOpenShiftPage}
                  style={{ fontSize: '11px', padding: '4px 10px', color: 'var(--amber)', borderColor: 'var(--amber)' }}
                >
                  ▶ Start Operator Shift Session
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Live OEE Gauge & APQ Breakdown */}
        <div className="panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '15px', margin: 0 }}>LIVE STATION OEE GAUGE</h2>
              <span className="pill" style={{ fontSize: '11px', borderColor: oeeColor, color: oeeColor }}>
                {oee >= 85 ? 'WORLD CLASS' : oee >= 70 ? 'TARGET' : 'NEEDS ATTENTION'}
              </span>
            </div>

            <div className="gauge-wrap" style={{ margin: '14px auto 8px', maxWidth: '240px' }}>
              <svg viewBox="0 0 120 66" width="100%">
                <path
                  d="M10,60 A50,50 0 0 1 110,60"
                  fill="none"
                  stroke="var(--steel)"
                  strokeWidth="9"
                  strokeLinecap="round"
                  pathLength="100"
                />
                <path
                  d="M10,60 A50,50 0 0 1 110,60"
                  fill="none"
                  stroke={oeeColor}
                  strokeWidth="9"
                  strokeLinecap="round"
                  pathLength="100"
                  strokeDasharray="100"
                  strokeDashoffset={100 - Math.min(100, Math.max(0, oee))}
                  style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s ease' }}
                />
              </svg>
              <div className="gauge-value" style={{ color: oeeColor, fontSize: '38px' }}>
                {oee}%
              </div>
            </div>
            <div className="gauge-caption" style={{ marginBottom: '16px' }}>CURRENT OEE INDEX</div>

            {/* Availability, Performance, Quality bars */}
            <div className="apq-bars">
              <div className="apq-row">
                <span className="apq-label">A</span>
                <div className="apq-track">
                  <div className="apq-fill" style={{ width: `${a}%`, background: 'var(--amber)' }} />
                </div>
                <span className="apq-num">{a}%</span>
              </div>
              <div className="apq-row">
                <span className="apq-label">P</span>
                <div className="apq-track">
                  <div className="apq-fill" style={{ width: `${p}%`, background: 'var(--cyan)' }} />
                </div>
                <span className="apq-num">{p}%</span>
              </div>
              <div className="apq-row">
                <span className="apq-label">Q</span>
                <div className="apq-track">
                  <div className="apq-fill" style={{ width: `${q}%`, background: 'var(--green)' }} />
                </div>
                <span className="apq-num">{q}%</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid var(--steel)', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
            <span>Good: <strong style={{ color: 'var(--green)' }}>{goodUnits}</strong></span>
            <span>Rejects: <strong style={{ color: (machine.currentShift?.defectiveUnits || 0) > 0 ? 'var(--red)' : 'var(--text-muted)' }}>{machine.currentShift?.defectiveUnits || 0}</strong></span>
            <span>Downtime: <strong style={{ color: 'var(--amber)' }}>{machine.currentShift?.totalDowntimeMinutes || 0}m</strong></span>
          </div>
        </div>
      </div>

      {/* Production Entry Section */}
      <div style={{ marginTop: '24px' }}>
        <ProductionEntryForm
          machineId={machine._id}
          shiftSessionId={activeShift?._id}
          onSubmitted={() => {
            fetchActiveShift();
          }}
        />
      </div>

      {/* Modal for stopping machine */}
      <LogDowntimeModal
        isOpen={isDowntimeModalOpen}
        onClose={() => setIsDowntimeModalOpen(false)}
        machines={[machine]}
        presetMachineId={machine._id}
        onSubmit={async (payload) => {
          await onLogDowntime(payload);
          setIsDowntimeModalOpen(false);
        }}
      />
    </div>
  );
}
