import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export default function MyActivityPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [filterType, setFilterType] = useState('ALL'); // ALL | DOWNTIME | PRODUCTION | MAINTENANCE_REQUEST | SHIFT
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch('/api/activity/my', {
        headers: { Authorization: `Bearer ${localStorage.getItem('oee_token') || ''}` },
      });
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      }
    } catch (err) {
      console.warn('Failed to fetch activity feed:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const filtered = filterType === 'ALL'
    ? activities
    : activities.filter((a) => a.type === filterType);

  const typeConfig = {
    DOWNTIME: { icon: '🛑', color: 'var(--red)', label: 'Downtime' },
    PRODUCTION: { icon: '⚡', color: 'var(--green)', label: 'Production' },
    MAINTENANCE_REQUEST: { icon: '🚨', color: 'var(--amber)', label: 'Assistance Call' },
    SHIFT: { icon: '🏁', color: 'var(--cyan)', label: 'Shift Session' },
  };

  return (
    <div>
      <div className="page-title">My Operational Activity Feed</div>
      <p className="page-desc">
        Chronological record of all actions, downtime events, production logging, and assistance calls performed in the last 7 days.
      </p>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { key: 'ALL', label: `All Activity (${activities.length})` },
          { key: 'DOWNTIME', label: `Downtime (${activities.filter((a) => a.type === 'DOWNTIME').length})` },
          { key: 'PRODUCTION', label: `Production (${activities.filter((a) => a.type === 'PRODUCTION').length})` },
          { key: 'MAINTENANCE_REQUEST', label: `Calls (${activities.filter((a) => a.type === 'MAINTENANCE_REQUEST').length})` },
          { key: 'SHIFT', label: `Shifts (${activities.filter((a) => a.type === 'SHIFT').length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`btn ${filterType === tab.key ? 'btn-primary' : ''}`}
            onClick={() => setFilterType(tab.key)}
            style={{ fontSize: '12px', padding: '7px 14px' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="panel">
        <h2 style={{ fontSize: '15px', marginBottom: '16px' }}>
          CHRONOLOGICAL AUDIT TIMELINE
        </h2>

        {loading ? (
          <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading activity logs...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No activity records found matching the selected filter in the last 7 days.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map((item) => {
              const conf = typeConfig[item.type] || { icon: '📌', color: 'var(--steel)', label: item.type };

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--panel-2)',
                    borderLeft: `4px solid ${conf.color}`,
                    borderRadius: '8px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        background: 'var(--panel)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        flexShrink: 0,
                      }}
                    >
                      {conf.icon}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>
                          {item.title}
                        </span>
                        <span style={{ fontSize: '11px', color: conf.color, fontWeight: 700 }}>
                          [{conf.label}]
                        </span>
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Machine: <strong style={{ color: 'var(--text)' }}>{item.machine?.name || 'Assigned Station'}</strong> ·{' '}
                        {new Date(item.timestamp).toLocaleDateString()} at{' '}
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>

                      {/* Extra details row */}
                      {item.type === 'PRODUCTION' && item.details?.defectiveUnits > 0 && (
                        <div style={{ fontSize: '11.5px', color: 'var(--red)', marginTop: '4px' }}>
                          Reason: {item.details.rejectReason?.replace(/_/g, ' ')}
                        </div>
                      )}

                      {item.type === 'MAINTENANCE_REQUEST' && (
                        <div style={{ fontSize: '12px', color: 'var(--text)', marginTop: '4px' }}>
                          "{item.details?.description}"
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <span
                      className="pill"
                      style={{
                        fontSize: '11px',
                        borderColor: item.status === 'RESOLVED' || item.status === 'COMPLETED' ? 'var(--green)' : 'var(--amber)',
                        color: item.status === 'RESOLVED' || item.status === 'COMPLETED' ? 'var(--green)' : 'var(--amber)',
                      }}
                    >
                      {item.status}
                    </span>
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
