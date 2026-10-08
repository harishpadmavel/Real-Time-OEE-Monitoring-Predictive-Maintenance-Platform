import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export default function MaintenanceRequestPanel() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch('/api/maintenance-requests', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('oee_token') || ''}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    if (!socket) return;

    const handleCreated = (newReq) => {
      setRequests((prev) => [newReq, ...prev.filter((r) => r._id !== newReq._id)]);
    };

    const handleUpdated = (updatedReq) => {
      setRequests((prev) =>
        prev.map((r) => (r._id === updatedReq._id ? updatedReq : r))
      );
    };

    socket.on('maintenanceRequestCreated', handleCreated);
    socket.on('maintenanceRequestUpdated', handleUpdated);

    return () => {
      socket.off('maintenanceRequestCreated', handleCreated);
      socket.off('maintenanceRequestUpdated', handleUpdated);
    };
  }, [socket]);

  const handleAction = async (requestId, action) => {
    setActionLoadingId(requestId);
    try {
      const res = await fetch(`/api/maintenance-requests/${requestId}/${action}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('oee_token') || ''}`,
        },
      });
      if (res.ok) {
        const updated = await res.json();
        setRequests((prev) =>
          prev.map((r) => (r._id === requestId ? updated : r))
        );
      }
    } catch (err) {
      console.error(`Failed to ${action} request:`, err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const isResponder = ['MAINTENANCE', 'SUPERVISOR', 'ADMIN', 'MANAGER'].includes(user?.role);

  return (
    <div className="panel" style={{ marginTop: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
          OPERATOR CALLS & ASSISTANCE REQUESTS
        </h2>
        <span className="pill" style={{ fontSize: '11px' }}>
          {requests.filter((r) => r.status !== 'RESOLVED').length} Active
        </span>
      </div>

      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading requests...</div>
      ) : requests.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          No open maintenance or supervisor calls at this time.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {requests.map((req) => {
            const isHigh = req.priority === 'HIGH';
            const isAck = req.status === 'ACKNOWLEDGED';
            const isResolved = req.status === 'RESOLVED';

            return (
              <div
                key={req._id}
                style={{
                  background: 'var(--bg)',
                  border: `1px solid ${isHigh && !isResolved ? 'var(--red)' : isAck ? 'var(--amber)' : isResolved ? 'var(--steel)' : 'var(--panel-2)'}`,
                  borderLeft: `4px solid ${isHigh ? 'var(--red)' : req.priority === 'MEDIUM' ? 'var(--amber)' : 'var(--cyan)'}`,
                  borderRadius: '8px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: isHigh ? 'rgba(230,72,60,0.2)' : 'rgba(242,169,59,0.2)',
                        color: isHigh ? 'var(--red)' : 'var(--amber)',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {req.priority} PRIORITY
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                      {req.machine?.name || 'Machine'}
                    </span>
                    <span style={{ fontSize: '11.5px', color: 'var(--cyan)', background: 'rgba(79,195,217,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                      Target: {req.target}
                    </span>
                    <span
                      className="pill"
                      style={{
                        fontSize: '11px',
                        borderColor: isResolved ? 'var(--green)' : isAck ? 'var(--amber)' : 'var(--red)',
                        color: isResolved ? 'var(--green)' : isAck ? 'var(--amber)' : 'var(--red)',
                      }}
                    >
                      {req.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '13px', color: 'var(--text)', marginBottom: '6px' }}>
                    {req.description}
                  </div>

                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                    <span>Raised by: <strong style={{ color: 'var(--text)' }}>{req.raisedBy?.name || 'Operator'}</strong></span>
                    <span>Time: {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {req.acknowledgedBy && (
                      <span style={{ color: 'var(--amber)' }}>Ack by: {req.acknowledgedBy.name}</span>
                    )}
                    {req.resolvedBy && (
                      <span style={{ color: 'var(--green)' }}>Resolved by: {req.resolvedBy.name}</span>
                    )}
                  </div>
                </div>

                {/* Actions for responders */}
                {isResponder && !isResolved && (
                  <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                    {!isAck && (
                      <button
                        className="btn"
                        onClick={() => handleAction(req._id, 'acknowledge')}
                        disabled={actionLoadingId === req._id}
                        style={{
                          background: 'rgba(242,169,59,0.15)',
                          borderColor: 'var(--amber)',
                          color: 'var(--amber)',
                          fontSize: '12px',
                          fontWeight: 700,
                          padding: '8px 14px',
                        }}
                      >
                        {actionLoadingId === req._id ? 'Updating...' : '✔ Acknowledge'}
                      </button>
                    )}
                    <button
                      className="btn"
                      onClick={() => handleAction(req._id, 'resolve')}
                      disabled={actionLoadingId === req._id}
                      style={{
                        background: 'rgba(63,182,95,0.15)',
                        borderColor: 'var(--green)',
                        color: 'var(--green)',
                        fontSize: '12px',
                        fontWeight: 700,
                        padding: '8px 14px',
                      }}
                    >
                      {actionLoadingId === req._id ? 'Updating...' : '✔ Mark Resolved'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
