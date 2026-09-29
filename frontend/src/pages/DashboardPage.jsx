import React from 'react';
import StationCard from '../components/StationCard';

export default function DashboardPage({
  machines = [],
  oeeMap = {},
  lineOee = 72,
  downtimeLogs = [],
  alerts = [],
  onOpenLogDowntime,
  onResolveDowntime,
}) {
  const lineOeeColor = lineOee >= 75 ? 'var(--green)' : lineOee >= 55 ? 'var(--amber)' : 'var(--red)';

  return (
    <div>
      <div className="line-hero">
        <div>
          <div className="hero-label">LINE-A OVERALL OEE</div>
          <div className="hero-value" style={{ color: lineOeeColor }}>
            {lineOee}%
          </div>
        </div>
        <div className="hero-note">
          Live status across <b>5 stations</b> · CNC → Press → Weld → Assembly → Paint.
          <br />
          Real-time IoT gateway telemetry synced via <b>Socket.IO</b>.
        </div>
      </div>

      <div className="conveyor-wrap">
        <svg className="conveyor-svg" viewBox="0 0 1000 32" preserveAspectRatio="none">
          <line className="conveyor-track" x1="20" y1="16" x2="980" y2="16" />
          <line className="conveyor-dash" x1="20" y1="16" x2="980" y2="16" />
        </svg>
      </div>

      <div className="stations">
        {machines.map((m) => (
          <StationCard
            key={m._id}
            machine={m}
            oeeData={oeeMap[m._id]}
          />
        ))}
      </div>

      <div className="lower-grid">
        <div className="panel">
          <div className="panel-header-action">
            <h2>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 2" />
              </svg>
              DOWNTIME LOG — SHIFT A
            </h2>
            <button className="btn btn-sm btn-primary" onClick={onOpenLogDowntime}>
              + Log Downtime
            </button>
          </div>

          <ul className="ticket-list">
            {downtimeLogs.slice(0, 6).map((log) => {
              const machineName = log.machine?.name || 'Machine';
              const time = new Date(log.startTime).toTimeString().slice(0, 8);
              const isOngoing = !log.endTime;

              return (
                <li key={log._id} className="ticket">
                  <span className="t-time">{time}</span>
                  <span className="t-machine">{machineName}</span>
                  <span className="t-reason" title={log.notes || ''}>
                    {log.reason.replace(/_/g, ' ')}
                  </span>
                  <span className="t-dur">
                    {isOngoing ? (
                      <span style={{ color: 'var(--red)', fontWeight: 'bold' }}>ONGOING</span>
                    ) : (
                      `${log.durationMinutes || 1}m`
                    )}
                  </span>
                  {isOngoing && (
                    <button
                      className="btn btn-sm btn-danger t-action"
                      onClick={() => onResolveDowntime(log._id)}
                    >
                      Resolve
                    </button>
                  )}
                </li>
              );
            })}
            {downtimeLogs.length === 0 && (
              <li className="ticket" style={{ justifyContent: 'center', color: 'var(--text-muted)' }}>
                No active or recorded downtime incidents in current shift.
              </li>
            )}
          </ul>
        </div>

        <div className="panel">
          <h2>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3 2 20h20L12 3z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            PREDICTIVE MAINTENANCE ALERTS
          </h2>

          <div className="alert-list">
            {alerts.slice(0, 4).map((alert) => (
              <div
                key={alert.machineId}
                className={`alert-card ${alert.atRisk ? 'high' : 'medium'}`}
              >
                <div className={`alert-title ${alert.atRisk ? 'high' : 'medium'}`}>
                  <span>⚠ {alert.machineName} ({alert.type})</span>
                  <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: alert.atRisk ? 'rgba(230,72,60,0.2)' : 'rgba(242,169,59,0.2)' }}>
                    {alert.atRisk ? 'HIGH RISK' : 'MONITORING'}
                  </span>
                </div>
                <div className="alert-body">
                  {alert.message}
                </div>
                {alert.recommendation && (
                  <div className="alert-recommendation">
                    <span>🔧 Suggestion:</span> {alert.recommendation}
                  </div>
                )}
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="alert-empty">No active risk trends detected. Equipment operating within parameters.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
