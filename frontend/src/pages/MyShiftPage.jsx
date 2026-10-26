import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import ShiftSummaryModal from '../components/ShiftSummaryModal';

export default function MyShiftPage({ machines = [] }) {
  const { user } = useAuth();
  const { socket } = useSocket();

  const assignedMachineIds = new Set(
    (user?.assignedMachines || []).map((m) => (m._id ? m._id.toString() : m.toString()))
  );
  const operatorMachines = assignedMachineIds.size > 0
    ? machines.filter((m) => assignedMachineIds.has(m._id?.toString()))
    : machines;

  const [activeShift, setActiveShift] = useState(null);
  const [shiftHistory, setShiftHistory] = useState([]);
  const [latestHandover, setLatestHandover] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Start shift form
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [shiftName, setShiftName] = useState('Shift A');
  const [targetUnits, setTargetUnits] = useState('800');

  // End shift form
  const [endNotes, setEndNotes] = useState('');
  const [handoverText, setHandoverText] = useState('');
  const [summarySession, setSummarySession] = useState(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  // Set default machine
  useEffect(() => {
    if (operatorMachines.length > 0 && !selectedMachineId) {
      setSelectedMachineId(operatorMachines[0]._id);
    }
  }, [operatorMachines, selectedMachineId]);

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
      console.warn('Failed to load active shift:', err.message);
    }
  }, []);

  const fetchShiftHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/shifts/my', {
        headers: { Authorization: `Bearer ${localStorage.getItem('oee_token') || ''}` },
      });
      if (res.ok) {
        const data = await res.json();
        setShiftHistory(data);
      }
    } catch (err) {
      console.warn('Failed to load shift history:', err.message);
    }
  }, []);

  // Fetch latest handover note when machine is selected
  const fetchLatestHandover = useCallback(async (mId) => {
    if (!mId) return;
    try {
      const res = await fetch(`/api/handover/latest?machineId=${mId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('oee_token') || ''}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLatestHandover(data);
      }
    } catch (err) {
      console.warn('Failed to load latest handover note:', err.message);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchActiveShift(), fetchShiftHistory()]).finally(() => setLoading(false));
  }, [fetchActiveShift, fetchShiftHistory]);

  useEffect(() => {
    const targetId = activeShift?.machine?._id || selectedMachineId;
    if (targetId) {
      fetchLatestHandover(targetId);
    }
  }, [activeShift, selectedMachineId, fetchLatestHandover]);

  const handleStartShift = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const targetMachine = selectedMachineId || operatorMachines[0]?._id;
    if (!targetMachine) {
      setErrorMsg('No machine station assigned to your account.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/shifts/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('oee_token') || ''}`,
        },
        body: JSON.stringify({
          machineId: targetMachine,
          shiftName,
          targetUnits: parseInt(targetUnits, 10) || 800,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to start shift');
      }

      setActiveShift(data);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to start shift.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndShift = async (e) => {
    e.preventDefault();
    if (!activeShift) return;
    setErrorMsg('');
    setActionLoading(true);

    try {
      // If handover note is provided, post it first
      if (handoverText.trim()) {
        await fetch('/api/handover', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('oee_token') || ''}`,
          },
          body: JSON.stringify({
            machineId: activeShift.machine._id || activeShift.machine,
            text: handoverText.trim(),
            shiftSessionId: activeShift._id,
          }),
        });
      }

      // End shift
      const res = await fetch(`/api/shifts/${activeShift._id}/end`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('oee_token') || ''}`,
        },
        body: JSON.stringify({ notes: endNotes }),
      });

      const endedData = await res.json();
      if (!res.ok) {
        throw new Error(endedData.message || 'Failed to end shift');
      }

      setSummarySession(endedData);
      setIsSummaryOpen(true);
      setActiveShift(null);
      setEndNotes('');
      setHandoverText('');
      fetchShiftHistory();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to end shift.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className="page-title">Operator Shift Session Management</div>
      <p className="page-desc">
        Track shop floor work shifts, set production quotas, leave handover notes, and inspect end-of-shift OEE performance.
      </p>

      {errorMsg && (
        <div className="login-alert login-alert--error" style={{ marginBottom: '16px' }}>
          {errorMsg}
        </div>
      )}

      {/* Active Shift OR Start Shift Box */}
      {activeShift ? (
        <div className="panel" style={{ borderLeft: '4px solid var(--green)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="pill" style={{ background: 'rgba(63,182,95,0.15)', borderColor: 'var(--green)', color: 'var(--green)' }}>
                  ● SHIFT IN PROGRESS
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Started {new Date(activeShift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h2 style={{ fontSize: '22px', margin: '8px 0 4px', color: 'var(--text)' }}>
                {activeShift.shiftName} — {activeShift.machine?.name}
              </h2>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Target Output Quota: <strong style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>{activeShift.targetUnits} units</strong>
              </div>
            </div>
          </div>

          {/* End Shift Form */}
          <form onSubmit={handleEndShift} style={{ background: 'var(--bg)', padding: '20px', borderRadius: '8px', border: '1px solid var(--steel)' }}>
            <h3 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              End Shift Actions & Handover
            </h3>

            <div className="form-group">
              <label className="form-label">OPERATOR SHIFT LOG / COMMENTS</label>
              <textarea
                className="form-textarea"
                placeholder="Brief summary of shift events, stoppages, or tooling notes..."
                value={endNotes}
                onChange={(e) => setEndNotes(e.target.value)}
                rows={2}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--cyan)' }}>
                HANDOVER NOTE FOR INCOMING OPERATOR
              </label>
              <textarea
                id="input-handover-text"
                className="form-textarea"
                placeholder="e.g. Completed batch B. Cleaned coolant filter at 13:45. Material palette #4 staged for Shift B."
                value={handoverText}
                onChange={(e) => setHandoverText(e.target.value)}
                rows={2}
                style={{ borderColor: 'var(--cyan)' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                id="btn-end-shift"
                type="submit"
                className="btn btn-primary"
                disabled={actionLoading}
                style={{
                  background: 'linear-gradient(135deg, var(--red), #b73228)',
                  borderColor: 'var(--red)',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: 800,
                }}
              >
                {actionLoading ? 'Finalizing Shift...' : '🏁 End Shift & View Summary'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="panel" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>
            START NEW OPERATOR SHIFT SESSION
          </h2>

          {/* Latest Handover Note From Previous Shift */}
          {latestHandover && (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(79,195,217,0.1), rgba(79,195,217,0.04))',
                border: '1px solid rgba(79,195,217,0.4)',
                borderLeft: '4px solid var(--cyan)',
                borderRadius: '8px',
                padding: '14px 18px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1px', color: 'var(--cyan)', textTransform: 'uppercase' }}>
                  📩 Incoming Handover Note from {latestHandover.author?.name || 'Previous Operator'}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {new Date(latestHandover.createdAt).toLocaleDateString()} {new Date(latestHandover.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ fontSize: '13.5px', color: 'var(--text)', fontStyle: 'italic' }}>
                "{latestHandover.text}"
              </div>
            </div>
          )}

          <form onSubmit={handleStartShift}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">ASSIGNED MACHINE</label>
                <select
                  id="select-shift-machine"
                  className="form-select"
                  value={selectedMachineId}
                  onChange={(e) => setSelectedMachineId(e.target.value)}
                  required
                >
                  {operatorMachines.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">SHIFT SCHEDULE</label>
                <select
                  id="select-shift-name"
                  className="form-select"
                  value={shiftName}
                  onChange={(e) => setShiftName(e.target.value)}
                >
                  <option value="Shift A (Morning 06:00 - 14:00)">Shift A (Morning 06:00 - 14:00)</option>
                  <option value="Shift B (Evening 14:00 - 22:00)">Shift B (Evening 14:00 - 22:00)</option>
                  <option value="Shift C (Night 22:00 - 06:00)">Shift C (Night 22:00 - 06:00)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">TARGET UNITS QUOTA</label>
                <input
                  id="input-target-units"
                  type="number"
                  min="1"
                  className="form-input"
                  value={targetUnits}
                  onChange={(e) => setTargetUnits(e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button
                id="btn-start-shift"
                type="submit"
                className="btn btn-primary"
                disabled={actionLoading || operatorMachines.length === 0}
                style={{ padding: '12px 28px', fontSize: '14px', fontWeight: 800 }}
              >
                {actionLoading ? 'Initializing...' : '▶ Start Operator Shift'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Shift History Register */}
      <div className="panel">
        <h2 style={{ fontSize: '15px', marginBottom: '16px' }}>
          RECENT COMPLETED SHIFTS (MY HISTORY)
        </h2>

        {shiftHistory.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No previous completed shift records found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Shift Name</th>
                  <th>Machine</th>
                  <th>Started</th>
                  <th>Ended</th>
                  <th>Good Units</th>
                  <th>Rejects</th>
                  <th>Downtime</th>
                  <th>Shift OEE</th>
                </tr>
              </thead>
              <tbody>
                {shiftHistory.map((s) => {
                  const oeeScore = Math.round(s.summary?.oee ?? 0);
                  const oeeCol = oeeScore >= 75 ? 'var(--green)' : oeeScore >= 55 ? 'var(--amber)' : 'var(--red)';
                  return (
                    <tr key={s._id}>
                      <td><strong style={{ color: 'var(--text)' }}>{s.shiftName}</strong></td>
                      <td>{s.machine?.name || 'Machine'}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(s.startTime).toLocaleDateString()} {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {s.endTime ? new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>
                        {s.summary?.goodUnits ?? 0}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: (s.summary?.rejectedUnits ?? 0) > 0 ? 'var(--red)' : 'var(--text-muted)' }}>
                        {s.summary?.rejectedUnits ?? 0}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber)' }}>
                        {s.summary?.downtimeMinutes ?? 0}m
                      </td>
                      <td>
                        <span className="pill" style={{ borderColor: oeeCol, color: oeeCol, fontFamily: 'var(--font-mono)' }}>
                          {oeeScore}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ShiftSummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        shiftSession={summarySession}
      />
    </div>
  );
}
