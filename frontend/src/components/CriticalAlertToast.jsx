import React, { useState, useEffect, useRef } from 'react';

/**
 * CriticalAlertToast
 * Shows a stacked toast popup in the bottom-right corner for every
 * alert where atRisk === true. Each toast can be individually dismissed.
 * New critical alerts that weren't previously seen auto-pop in.
 */
export default function CriticalAlertToast({ alerts = [], onNavigateAlerts }) {
  const [dismissed, setDismissed] = useState(new Set());
  const [visible, setVisible] = useState(new Set());
  const prevCriticalIds = useRef(new Set());
  const audioCtx = useRef(null);

  const criticalAlerts = alerts.filter((a) => a.atRisk);

  // Detect newly-arrived critical alerts and add them to visible set
  useEffect(() => {
    const currentIds = new Set(criticalAlerts.map((a) => a.machineId));
    const newIds = [...currentIds].filter((id) => !prevCriticalIds.current.has(id));

    if (newIds.length > 0) {
      setVisible((prev) => {
        const next = new Set(prev);
        newIds.forEach((id) => next.add(id));
        return next;
      });
      // Remove from dismissed if it re-appears (e.g., refreshed data)
      setDismissed((prev) => {
        const next = new Set(prev);
        newIds.forEach((id) => next.delete(id));
        return next;
      });
      // Play a subtle alert beep
      playBeep();
    }
    prevCriticalIds.current = currentIds;
  }, [criticalAlerts]);

  const playBeep = () => {
    try {
      if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtx.current;
      [0, 180].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0, ctx.currentTime + delay / 1000);
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + delay / 1000 + 0.03);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + delay / 1000 + 0.2);
        osc.start(ctx.currentTime + delay / 1000);
        osc.stop(ctx.currentTime + delay / 1000 + 0.25);
      });
    } catch (_) { /* AudioContext not available */ }
  };

  const dismiss = (machineId) => {
    setDismissed((prev) => new Set([...prev, machineId]));
  };

  const dismissAll = () => {
    setDismissed(new Set(criticalAlerts.map((a) => a.machineId)));
  };

  const toasts = criticalAlerts.filter(
    (a) => visible.has(a.machineId) && !dismissed.has(a.machineId)
  );

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '360px',
        width: '100%',
      }}
    >
      {/* Dismiss-all bar when multiple toasts */}
      {toasts.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={dismissAll}
            style={{
              background: 'rgba(230,72,60,0.12)',
              border: '1px solid rgba(230,72,60,0.3)',
              color: '#E6483C',
              borderRadius: '8px',
              padding: '5px 14px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.5px',
            }}
          >
            DISMISS ALL ({toasts.length})
          </button>
        </div>
      )}

      {toasts.map((alert, i) => (
        <div
          key={alert.machineId}
          style={{
            background: 'linear-gradient(135deg, #1e0f0f, #2a1010)',
            border: '1px solid rgba(230,72,60,0.6)',
            borderLeft: '4px solid #E6483C',
            borderRadius: '12px',
            padding: '14px 16px',
            boxShadow: '0 8px 32px rgba(230,72,60,0.3), 0 2px 8px rgba(0,0,0,0.5)',
            animation: 'toastSlideIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
            animationDelay: `${i * 60}ms`,
            animationFillMode: 'both',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Pulsing red glow bar at top */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #E6483C, transparent)',
            animation: 'criticalPulse 1.4s ease-in-out infinite',
          }} />

          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              {/* Pulsing red icon */}
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'rgba(230,72,60,0.2)', border: '1px solid rgba(230,72,60,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', flexShrink: 0,
                animation: 'iconPulse 1.4s ease-in-out infinite',
              }}>🚨</div>
              <div>
                <div style={{
                  fontSize: '11px', fontWeight: 800, letterSpacing: '1px',
                  color: '#E6483C', textTransform: 'uppercase', marginBottom: '2px',
                }}>
                  ⚠ CRITICAL FAILURE RISK
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#F5F5F5' }}>
                  {alert.machineName}
                  <span style={{
                    marginLeft: '7px', fontSize: '10px', fontWeight: 500,
                    color: '#9AA5B1', background: 'rgba(255,255,255,0.07)',
                    padding: '1px 7px', borderRadius: '4px',
                  }}>{alert.type}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => dismiss(alert.machineId)}
              style={{
                background: 'rgba(255,255,255,0.07)', border: 'none',
                color: '#9AA5B1', width: '26px', height: '26px',
                borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >✕</button>
          </div>

          {/* Stats row */}
          <div style={{
            display: 'flex', gap: '8px', margin: '10px 0',
          }}>
            {[
              { label: '7-Day Breakdowns', value: `${alert.breakdownsLast7Days} events`, color: '#F2A93B' },
              { label: 'Recent Window', value: `${alert.breakdownsSecondHalf} incidents`, color: '#E6483C' },
              { label: 'Trend', value: '▲ ACCEL.', color: '#E6483C' },
            ].map((stat) => (
              <div key={stat.label} style={{
                flex: 1, background: 'rgba(255,255,255,0.05)',
                borderRadius: '6px', padding: '6px 8px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: stat.color, fontFamily: 'monospace' }}>{stat.value}</div>
                <div style={{ fontSize: '9px', color: '#64748B', marginTop: '2px', letterSpacing: '0.3px' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Message */}
          <div style={{ fontSize: '11.5px', color: '#9AA5B1', lineHeight: '1.5', marginBottom: '10px' }}>
            {alert.recommendation || alert.message}
          </div>

          {/* Action row */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => { onNavigateAlerts?.(); dismiss(alert.machineId); }}
              style={{
                flex: 1, padding: '7px 0', borderRadius: '7px', border: 'none',
                background: 'linear-gradient(135deg, #E6483C, #c0392b)',
                color: '#fff', fontWeight: 700, fontSize: '11px',
                cursor: 'pointer', letterSpacing: '0.5px',
              }}
            >VIEW ALERTS →</button>
            <button
              onClick={() => dismiss(alert.machineId)}
              style={{
                padding: '7px 14px', borderRadius: '7px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent', color: '#9AA5B1',
                fontSize: '11px', cursor: 'pointer',
              }}
            >Snooze</button>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(60px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0)   scale(1); }
        }
        @keyframes criticalPulse {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 1; }
        }
        @keyframes iconPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(230,72,60,0); }
          50%       { box-shadow: 0 0 0 6px rgba(230,72,60,0.25); }
        }
      `}</style>
    </div>
  );
}
