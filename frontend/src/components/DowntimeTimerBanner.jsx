import React, { useState, useEffect } from 'react';

export default function DowntimeTimerBanner({ downtimeLog, onResolve }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    if (!downtimeLog?.startTime) return;

    const startMs = new Date(downtimeLog.startTime).getTime();
    const updateElapsed = () => {
      const diff = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      setElapsedSeconds(diff);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [downtimeLog?.startTime]);

  if (!downtimeLog) return null;

  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  const formattedTimer = hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleResolveClick = async () => {
    setIsResolving(true);
    try {
      await onResolve(downtimeLog._id);
    } catch (err) {
      console.error('Failed to resolve downtime:', err);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div
      className="downtime-timer-banner"
      style={{
        background: 'linear-gradient(135deg, rgba(230,72,60,0.18), rgba(180,40,30,0.25))',
        border: '2px solid var(--red)',
        borderRadius: '12px',
        padding: '16px 22px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
        boxShadow: '0 0 24px rgba(230,72,60,0.25)',
        animation: 'pulseGlow 2.5s infinite',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '10px',
            background: 'var(--red)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '24px',
            flexShrink: 0,
            boxShadow: '0 0 12px rgba(230,72,60,0.6)',
          }}
        >
          ⏱
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '18px',
                letterSpacing: '1px',
                color: 'var(--red)',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              Active Machine Stoppage
            </span>
            <span
              className="pill"
              style={{
                background: 'rgba(230,72,60,0.2)',
                borderColor: 'var(--red)',
                color: '#fff',
                fontSize: '11px',
              }}
            >
              {downtimeLog.reason?.replace(/_/g, ' ') || 'STOPPED'}
            </span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '3px' }}>
            {downtimeLog.notes ? `Note: ${downtimeLog.notes}` : 'Machine is offline. Timer is recording duration.'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginLeft: 'auto' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Stoppage Duration
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '28px',
              fontWeight: 800,
              color: 'var(--red)',
              letterSpacing: '1px',
            }}
          >
            {formattedTimer}
          </div>
        </div>

        <button
          id="btn-machine-back-up"
          onClick={handleResolveClick}
          disabled={isResolving}
          style={{
            background: 'linear-gradient(135deg, var(--green), #2ea043)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            padding: '14px 24px',
            fontSize: '15px',
            fontWeight: 800,
            letterSpacing: '1px',
            cursor: isResolving ? 'not-allowed' : 'pointer',
            opacity: isResolving ? 0.7 : 1,
            boxShadow: '0 4px 14px rgba(63,182,95,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            if (!isResolving) e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {isResolving ? (
            'Resolving...'
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              MACHINE BACK UP
            </>
          )}
        </button>
      </div>
    </div>
  );
}
