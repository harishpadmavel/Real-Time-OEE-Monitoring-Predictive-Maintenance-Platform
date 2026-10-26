import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function RequestsPage({ machines = [] }) {
  const { user } = useAuth();
  const { socket } = useSocket();

  const assignedMachineIds = new Set(
    (user?.assignedMachines || []).map((m) => (m._id ? m._id.toString() : m.toString()))
  );
  const operatorMachines = assignedMachineIds.size > 0
    ? machines.filter((m) => assignedMachineIds.has(m._id.toString()))
    : machines;

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form fields
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [target, setTarget] = useState('MAINTENANCE');
  const [priority, setPriority] = useState('HIGH');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (operatorMachines.length > 0 && !selectedMachineId) {
      setSelectedMachineId(operatorMachines[0]._id);
    }
  }, [operatorMachines, selectedMachineId]);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch('/api/maintenance-requests', {
        headers: { Authorization: `Bearer ${localStorage.getItem('oee_token') || ''}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.warn('Failed to load requests:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Real-time updates via SocketContext
  useEffect(() => {
    if (!socket) return;

    const handleCreated = (req) => {
      setRequests((prev) => [req, ...prev.filter((r) => r._id !== req._id)]);
    };

    const handleUpdated = (updated) => {
      setRequests((prev) =>
        prev.map((r) => (r._id === updated._id ? updated : r))
      );
    };

    socket.on('maintenanceRequestCreated', handleCreated);
    socket.on('maintenanceRequestUpdated', handleUpdated);

    return () => {
      socket.off('maintenanceRequestCreated', handleCreated);
      socket.off('maintenanceRequestUpdated', handleUpdated);
    };
  }, [socket]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const targetMachine = selectedMachineId || operatorMachines[0]?._id;
    if (!targetMachine) {
      setErrorMsg('Please select a valid assigned machine.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Please enter a description for the assistance call.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/maintenance-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('oee_token') || ''}`,
        },
        body: JSON.stringify({
          machineId: targetMachine,
          target,
          priority,
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to dispatch request');
      }

      setSuccessMsg(`Dispatched ${priority} priority call to ${target}! Personnel notified.`);
      setDescription('');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-title">Operator Assistance & Maintenance Dispatch</div>
      <p className="page-desc">
        Call for immediate mechanical support or supervisor escalation with live status tracking.
      </p>

      {/* Raise Request Form */}
      <div className="panel" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '15px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          CALL MAINTENANCE OR SUPERVISOR
        </h2>

        {errorMsg && (
          <div className="login-alert login-alert--error" style={{ marginBottom: '14px' }}>
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="login-alert login-alert--success" style={{ marginBottom: '14px' }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">ASSIGNED MACHINE</label>
              <select
                id="select-request-machine"
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
              <label className="form-label">TARGET RECIPIENT</label>
              <select
                id="select-request-target"
                className="form-select"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              >
                <option value="MAINTENANCE">Maintenance Tech Team</option>
                <option value="SUPERVISOR">Shop Floor Supervisor</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">PRIORITY LEVEL</label>
              <select
                id="select-request-priority"
                className="form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={{
                  color: priority === 'HIGH' ? 'var(--red)' : priority === 'MEDIUM' ? 'var(--amber)' : 'var(--text)',
                  fontWeight: 700,
                }}
              >
                <option value="HIGH">HIGH (Immediate Stoppage / Hazard)</option>
                <option value="MEDIUM">MEDIUM (Impending Fault / Tool Wear)</option>
                <option value="LOW">LOW (Scheduled Check / General Query)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">ISSUE DESCRIPTION & FLOOR SYMPTOMS</label>
            <textarea
              id="input-request-desc"
              className="form-textarea"
              placeholder="Describe the issue (e.g. Overheating spindle bearing, abnormal grinding noise on axis Z, or hydraulic oil leak detected)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button
              id="btn-submit-request"
              type="submit"
              className="btn btn-primary"
              disabled={submitting || operatorMachines.length === 0}
              style={{
                background: priority === 'HIGH' ? 'linear-gradient(135deg, var(--red), #b73228)' : undefined,
                padding: '12px 26px',
                fontSize: '13.5px',
                fontWeight: 800,
              }}
            >
              {submitting ? 'Dispatching Call...' : `🚨 Send ${priority} Call to ${target}`}
            </button>
          </div>
        </form>
      </div>

      {/* Live Status of Operator Requests */}
      <div className="panel">
        <h2 style={{ fontSize: '15px', marginBottom: '16px' }}>
          REQUEST STATUS FEED (LIVE REAL-TIME UPDATES)
        </h2>

        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading requests...</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No requests raised yet. Use the form above if you require technician support or supervisor escalation.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {requests.map((r) => {
              const isHigh = r.priority === 'HIGH';
              const isAck = r.status === 'ACKNOWLEDGED';
              const isResolved = r.status === 'RESOLVED';

              return (
                <div
                  key={r._id}
                  style={{
                    background: 'var(--bg)',
                    border: `1px solid ${isResolved ? 'var(--steel)' : isAck ? 'var(--amber)' : isHigh ? 'var(--red)' : 'var(--panel-2)'}`,
                    borderLeft: `4px solid ${isHigh ? 'var(--red)' : r.priority === 'MEDIUM' ? 'var(--amber)' : 'var(--cyan)'}`,
                    borderRadius: '8px',
                    padding: '16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: isHigh ? 'rgba(230,72,60,0.2)' : 'rgba(242,169,59,0.2)',
                          color: isHigh ? 'var(--red)' : 'var(--amber)',
                        }}
                      >
                        {r.priority} PRIORITY
                      </span>
                      <strong style={{ color: 'var(--text)' }}>{r.machine?.name}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--cyan)' }}>➔ {r.target}</span>
                    </div>

                    <span
                      className="pill"
                      style={{
                        borderColor: isResolved ? 'var(--green)' : isAck ? 'var(--amber)' : 'var(--red)',
                        color: isResolved ? 'var(--green)' : isAck ? 'var(--amber)' : 'var(--red)',
                        fontWeight: 700,
                      }}
                    >
                      {r.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '13.5px', color: 'var(--text)', marginBottom: '8px' }}>
                    {r.description}
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <span>Dispatched: {new Date(r.createdAt).toLocaleDateString()} {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {r.acknowledgedBy && (
                      <span style={{ color: 'var(--amber)' }}>
                        ✔ Acknowledged by {r.acknowledgedBy.name} at {new Date(r.acknowledgedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    {r.resolvedBy && (
                      <span style={{ color: 'var(--green)' }}>
                        ✔ Resolved by {r.resolvedBy.name} at {new Date(r.resolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
