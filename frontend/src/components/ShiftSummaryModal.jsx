import React from 'react';

export default function ShiftSummaryModal({ isOpen, onClose, shiftSession }) {
  if (!isOpen || !shiftSession) return null;

  const summary = shiftSession.summary || {};
  const oee = Math.round(summary.oee || 0);
  const a = Math.round(summary.availability || 0);
  const p = Math.round(summary.performance || 0);
  const q = Math.round(summary.quality || 0);

  const downtimeByReason = summary.downtimeByReason || {};
  const reasonEntries = Object.entries(downtimeByReason);

  const oeeColor = oee >= 75 ? 'var(--green)' : oee >= 55 ? 'var(--amber)' : 'var(--red)';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🏁</span> SHIFT PERFORMANCE SUMMARY
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div style={{ marginBottom: '18px', padding: '12px 16px', background: 'var(--panel)', borderRadius: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)' }}>
            <span>Machine: <strong style={{ color: 'var(--text)' }}>{shiftSession.machine?.name || 'Machine'}</strong></span>
            <span>Shift: <strong style={{ color: 'var(--text)' }}>{shiftSession.shiftName || 'Shift'}</strong></span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            <span>Started: {new Date(shiftSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span>Ended: {shiftSession.endTime ? new Date(shiftSession.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}</span>
          </div>
        </div>

        {/* Overall OEE Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg)',
            border: `1px solid ${oeeColor}`,
            borderRadius: '8px',
            padding: '16px 20px',
            marginBottom: '18px',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              SHIFT OEE ACHIEVED
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', color: 'var(--text)' }}>
              {oee >= 85 ? 'World Class Performance' : oee >= 70 ? 'Operational Target Met' : 'Stoppage Impaired Output'}
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '38px', fontWeight: 800, color: oeeColor }}>
            {oee}%
          </div>
        </div>

        {/* A / P / Q Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '18px' }}>
          <div style={{ background: 'var(--panel)', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Availability</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: 'var(--amber)' }}>{a}%</div>
          </div>
          <div style={{ background: 'var(--panel)', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Performance</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: 'var(--cyan)' }}>{p}%</div>
          </div>
          <div style={{ background: 'var(--panel)', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Quality</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: 'var(--green)' }}>{q}%</div>
          </div>
        </div>

        {/* Units Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '18px' }}>
          <div style={{ background: 'var(--panel)', padding: '12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Good Units</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 800, color: 'var(--green)' }}>
              {summary.goodUnits ?? 0}
            </div>
          </div>
          <div style={{ background: 'var(--panel)', padding: '12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Rejected Units</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 800, color: (summary.rejectedUnits ?? 0) > 0 ? 'var(--red)' : 'var(--text-muted)' }}>
              {summary.rejectedUnits ?? 0}
            </div>
          </div>
          <div style={{ background: 'var(--panel)', padding: '12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Downtime</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 800, color: 'var(--amber)' }}>
              {summary.downtimeMinutes ?? 0}m
            </div>
          </div>
        </div>

        {/* Downtime grouped by reason */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px', color: 'var(--text-muted)' }}>
            Downtime Breakdown By Reason
          </div>
          {reasonEntries.length > 0 ? (
            <div style={{ background: 'var(--panel)', borderRadius: '6px', padding: '10px 14px' }}>
              {reasonEntries.map(([reason, minutes]) => (
                <div key={reason} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--steel)' }}>
                  <span style={{ fontSize: '13px' }}>{reason.replace(/_/g, ' ')}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--amber)' }}>
                    {minutes} mins
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '12.5px', color: 'var(--green)', padding: '8px 0' }}>
              ✔ No unplanned downtime logged during this shift.
            </div>
          )}
        </div>

        {shiftSession.notes && (
          <div style={{ marginBottom: '18px', padding: '10px 14px', background: 'var(--panel)', borderRadius: '6px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Shift Notes</div>
            <div style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--text)' }}>"{shiftSession.notes}"</div>
          </div>
        )}

        <div className="modal-actions">
          <button id="btn-close-shift-summary" type="button" className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>
            Acknowledge & Close Shift Summary
          </button>
        </div>
      </div>
    </div>
  );
}
