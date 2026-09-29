import React, { useState } from 'react';

export default function DowntimePage({
  downtimeLogs = [],
  machines = [],
  onOpenLogDowntime,
  onResolveDowntime,
}) {
  const [selectedMachine, setSelectedMachine] = useState('ALL');
  const [selectedReason, setSelectedReason] = useState('ALL');

  const filteredLogs = downtimeLogs.filter((log) => {
    const matchMachine = selectedMachine === 'ALL' || log.machine?._id === selectedMachine || log.machine === selectedMachine;
    const matchReason = selectedReason === 'ALL' || log.reason === selectedReason;
    return matchMachine && matchReason;
  });

  // Calculate Pareto summary
  const reasonSummary = downtimeLogs.reduce((acc, log) => {
    const r = log.reason || 'OTHER';
    acc[r] = (acc[r] || 0) + (log.durationMinutes || 5);
    return acc;
  }, {});

  const totalDowntime = Object.values(reasonSummary).reduce((a, b) => a + b, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
        <div>
          <div className="page-title">Downtime Log & Root Cause Analysis</div>
          <p className="page-desc" style={{ marginBottom: 0 }}>
            Shift downtime events categorized by standard TPM reasons with operator notes.
          </p>
        </div>
        <button className="btn btn-primary" onClick={onOpenLogDowntime}>
          + Log New Downtime Event
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="panel" style={{ marginBottom: '20px', padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label className="form-label">FILTER MACHINE</label>
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '180px' }}
              value={selectedMachine}
              onChange={(e) => setSelectedMachine(e.target.value)}
            >
              <option value="ALL">All Machines (Line-A)</option>
              {machines.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">FILTER REASON</label>
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '220px' }}
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
            >
              <option value="ALL">All Reasons</option>
              <option value="BREAKDOWN">Breakdown</option>
              <option value="MATERIAL_SHORTAGE">Material Shortage</option>
              <option value="CHANGEOVER_SETUP">Changeover & Setup</option>
              <option value="MINOR_STOPPAGE">Minor Stoppage</option>
              <option value="QUALITY_ISSUE">Quality Issue</option>
            </select>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
            <div className="shift-tag" style={{ alignSelf: 'flex-end' }}>
              Total Lost: <strong style={{ color: 'var(--amber)' }}>{totalDowntime} mins</strong>
            </div>
            <div className="shift-tag" style={{ alignSelf: 'flex-end' }}>
              Events: <strong style={{ color: 'var(--text)' }}>{downtimeLogs.length}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Reasons breakdown bar */}
      <div className="panel" style={{ marginBottom: '20px' }}>
        <h2><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>LOSS CATEGORY DISTRIBUTION</h2>
        <div style={{ display: 'flex', height: '14px', borderRadius: '3px', overflow: 'hidden', background: 'var(--steel)', margin: '10px 0 16px' }}>
          {Object.entries(reasonSummary).map(([reason, mins], i) => {
            const pct = totalDowntime > 0 ? (mins / totalDowntime) * 100 : 0;
            const colors = ['#E6483C', '#F2A93B', '#3FB65F', '#4fc3d9', '#8a7bff', '#e066ff'];
            const col = colors[i % colors.length];
            return (
              <div
                key={reason}
                title={`${reason}: ${mins}m (${pct.toFixed(1)}%)`}
                style={{ width: `${pct}%`, background: col }}
              />
            );
          })}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
          {Object.entries(reasonSummary).map(([reason, mins], i) => {
            const colors = ['#E6483C', '#F2A93B', '#3FB65F', '#4fc3d9', '#8a7bff', '#e066ff'];
            return (
              <div key={reason} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: colors[i % colors.length] }}></span>
                <span>{reason.replace(/_/g, ' ')}: <strong>{mins}m</strong></span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full ticket list */}
      <div className="panel">
        <ul className="ticket-list" style={{ maxHeight: '600px', overflowY: 'auto' }}>
          {filteredLogs.map((log) => {
            const machineName = log.machine?.name || 'Machine';
            const time = new Date(log.startTime).toLocaleTimeString();
            const date = new Date(log.startTime).toLocaleDateString();
            const isOngoing = !log.endTime;

            return (
              <li key={log._id} className="ticket" style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', width: '80px', flexShrink: 0 }}>
                  <span className="t-time" style={{ width: 'auto' }}>{time}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{date}</span>
                </div>
                <span className="t-machine" style={{ fontSize: '13px' }}>{machineName}</span>
                <div style={{ flex: 1 }}>
                  <div className="t-reason" style={{ fontWeight: 600 }}>{log.reason.replace(/_/g, ' ')}</div>
                  {log.notes && (
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {log.notes}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="t-dur" style={{ fontSize: '13px' }}>
                    {isOngoing ? (
                      <span className="pill" style={{ borderColor: 'var(--red)', color: 'var(--red)' }}>
                        <span className="dot" style={{ background: 'var(--red)' }}></span>
                        ACTIVE
                      </span>
                    ) : (
                      `${log.durationMinutes || 1} mins`
                    )}
                  </span>
                  {isOngoing && (
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => onResolveDowntime(log._id)}
                    >
                      Resolve & Run
                    </button>
                  )}
                </div>
              </li>
            );
          })}
          {filteredLogs.length === 0 && (
            <li className="ticket" style={{ justifyContent: 'center', padding: '24px', color: 'var(--text-muted)' }}>
              No downtime records found matching current filter.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
