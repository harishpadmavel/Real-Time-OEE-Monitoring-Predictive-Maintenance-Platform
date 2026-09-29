import React from 'react';

export default function AlertsPage({ alerts = [] }) {
  return (
    <div>
      <div className="page-title">Predictive Maintenance & Health Diagnostics</div>
      <p className="page-desc">
        Algorithmic trend detection identifying equipment degradation before catastrophic failure occurs.
      </p>

      {/* Algorithm explanation banner */}
      <div className="panel" style={{ marginBottom: '20px', borderLeft: '4px solid var(--amber)' }}>
        <h2 style={{ fontSize: '13.5px', marginBottom: '8px' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          PREDICTIVE MAINTENANCE LOGIC (REVIEW / VIVA EXPLANATION)
        </h2>
        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          This platform tracks breakdown incidence velocity across a rolling 7-day time window. When breakdown frequency in the second half of the evaluation window (last 3.5 days) exceeds the first half and reaches critical thresholds (≥ 2 events), the machine is flagged for predictive intervention.
        </p>
      </div>

      <div className="panel">
        <div className="alert-list">
          {alerts.map((alert) => (
            <div
              key={alert.machineId}
              className={`alert-card ${alert.atRisk ? 'high' : 'medium'}`}
              style={{ padding: '16px 18px' }}
            >
              <div className={`alert-title ${alert.atRisk ? 'high' : 'medium'}`} style={{ fontSize: '14px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⚠ {alert.machineName} ({alert.type})</span>
                  <span className="pill" style={{ borderColor: alert.atRisk ? 'var(--red)' : 'var(--amber)', fontSize: '11px' }}>
                    <span className="dot" style={{ background: alert.atRisk ? 'var(--red)' : 'var(--amber)' }}></span>
                    {alert.atRisk ? 'HIGH PROBABILITY OF UNPLANNED FAILURE' : 'MODERATE RISK'}
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                  Line: {alert.lineId}
                </div>
              </div>

              <div className="alert-body" style={{ fontSize: '13px', marginBottom: '12px' }}>
                {alert.message}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', background: 'var(--panel)', padding: '10px 14px', borderRadius: '3px', margin: '8px 0 12px' }}>
                <div>
                  <div className="pm-label">7-Day Breakdowns</div>
                  <div className="pm-value" style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber)' }}>
                    {alert.breakdownsLast7Days} events
                  </div>
                </div>
                <div>
                  <div className="pm-label">Days 1–3.5 Window</div>
                  <div className="pm-value" style={{ fontFamily: 'var(--font-mono)' }}>
                    {alert.breakdownsFirstHalf} incidents
                  </div>
                </div>
                <div>
                  <div className="pm-label">Days 3.5–7 Window (Recent)</div>
                  <div className="pm-value" style={{ fontFamily: 'var(--font-mono)', color: alert.breakdownsSecondHalf >= 2 ? 'var(--red)' : 'var(--text)' }}>
                    {alert.breakdownsSecondHalf} incidents
                  </div>
                </div>
                <div>
                  <div className="pm-label">Velocity Trend</div>
                  <div className="pm-value" style={{ fontFamily: 'var(--font-mono)', color: alert.atRisk ? 'var(--red)' : 'var(--green)' }}>
                    {alert.atRisk ? '▲ ACCELERATING' : '— STABLE'}
                  </div>
                </div>
              </div>

              {alert.recommendation && (
                <div className="alert-recommendation" style={{ fontSize: '12.5px', marginTop: '10px' }}>
                  <span>🔧 <strong>Recommended Maintenance Action:</strong></span> {alert.recommendation}
                </div>
              )}
            </div>
          ))}

          {alerts.length === 0 && (
            <div className="alert-empty" style={{ padding: '36px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>✅</div>
              <div style={{ fontSize: '15px', color: 'var(--green)', fontWeight: 600, marginBottom: '4px' }}>
                All Equipment Operating in Nominal Health State
              </div>
              <div>No accelerated failure patterns detected across current 7-day operational telemetry.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
