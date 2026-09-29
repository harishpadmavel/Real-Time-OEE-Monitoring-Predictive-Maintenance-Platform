import React from 'react';

const MACHINE_ICONS = {
  CNC: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.4">
      <circle cx="32" cy="32" r="10" />
      <path d="M32 8v10M32 46v10M8 32h10M46 32h10M15 15l7 7M42 42l7 7M49 15l-7 7M22 42l-7 7" />
    </svg>
  ),
  Press: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.4">
      <path d="M16 12h32M22 12v8M42 12v8M18 20h28l-4 8H22z" />
      <path d="M32 28v10" /><rect x="18" y="38" width="28" height="8" /><path d="M20 46v6M44 46v6" />
    </svg>
  ),
  Welding: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.4">
      <path d="M14 50 30 34" /><path d="M27 31l10-10 6 6-10 10z" /><path d="M42 18l4-4" />
      <path d="M46 22l4 4M50 16l3 3M44 12l3 3M40 20l3 -3" />
    </svg>
  ),
  Assembly: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.4">
      <rect x="10" y="26" width="14" height="14" rx="1" /><circle cx="16" cy="48" r="4" /><circle cx="46" cy="48" r="4" />
      <path d="M12 48h30" /><path d="M24 30h26" /><circle cx="54" cy="30" r="6" />
    </svg>
  ),
  Painting: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.4">
      <path d="M14 34 30 18l6 6-16 16z" /><path d="M20 40l-8 8" /><path d="M38 20l6-6" />
      <path d="M46 12c3 2 3 6 0 8M50 8c4 3 4 9 0 12M42 16c2 1 2 4 0 5" />
    </svg>
  ),
};

const MACHINE_SUBTITLES = {
  CNC: 'Precision cutting',
  Press: 'Sheet forming',
  Welding: 'Joint fusion',
  Assembly: 'Component build',
  Painting: 'Finish coating',
};

export default function StationCard({ machine, oeeData, onQuickAction }) {
  const oee = Math.round(oeeData?.oee ?? 75);
  const a = Math.round(oeeData?.availability ?? 85);
  const p = Math.round(oeeData?.performance ?? 90);
  const q = Math.round(oeeData?.quality ?? 98);

  const status = machine.status || 'RUNNING';
  const statusColorClass = status === 'RUNNING' ? 'green' : status === 'DOWN' ? 'red' : 'amber';
  const oeeColor = oee >= 75 ? 'var(--green)' : oee >= 55 ? 'var(--amber)' : 'var(--red)';

  const icon = MACHINE_ICONS[machine.type] || MACHINE_ICONS.CNC;
  const subtitle = MACHINE_SUBTITLES[machine.type] || machine.type;

  return (
    <div className="station">
      <div className="station-head">
        <div className="station-icon">{icon}</div>
        <div>
          <div className="station-name">{machine.name.toUpperCase()}</div>
          <div className="station-sub">{subtitle}</div>
        </div>
      </div>

      <div className="status-row">
        <div className="status-indicator">
          <span className={`led ${statusColorClass}`}></span>
          <span className="status-text">{status}</span>
        </div>
        <span className="station-cycle">{machine.idealCycleTimeSeconds}s cycle</span>
      </div>

      <div className="gauge-wrap">
        <svg viewBox="0 0 120 66" width="100%">
          <path
            d="M10,60 A50,50 0 0 1 110,60"
            fill="none"
            stroke="var(--steel)"
            strokeWidth="9"
            strokeLinecap="round"
            pathLength="100"
          />
          <path
            d="M10,60 A50,50 0 0 1 110,60"
            fill="none"
            stroke={oeeColor}
            strokeWidth="9"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={100 - Math.min(100, Math.max(0, oee))}
            style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s ease' }}
          />
        </svg>
        <div className="gauge-value" style={{ color: oeeColor }}>
          {oee}%
        </div>
      </div>
      <div className="gauge-caption">OEE SCORE</div>

      <div className="apq-bars">
        <div className="apq-row">
          <span className="apq-label">A</span>
          <div className="apq-track">
            <div className="apq-fill" style={{ width: `${a}%`, background: 'var(--amber)' }}></div>
          </div>
          <span className="apq-num">{a}%</span>
        </div>
        <div className="apq-row">
          <span className="apq-label">P</span>
          <div className="apq-track">
            <div className="apq-fill" style={{ width: `${p}%`, background: 'var(--cyan)' }}></div>
          </div>
          <span className="apq-num">{p}%</span>
        </div>
        <div className="apq-row">
          <span className="apq-label">Q</span>
          <div className="apq-track">
            <div className="apq-fill" style={{ width: `${q}%`, background: 'var(--green)' }}></div>
          </div>
          <span className="apq-num">{q}%</span>
        </div>
      </div>

      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--steel)', display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
        <span>Output: <strong style={{ color: 'var(--text)' }}>{machine.currentShift?.goodUnits ?? 0}</strong></span>
        <span>Rejects: <strong style={{ color: (machine.currentShift?.defectiveUnits ?? 0) > 10 ? 'var(--red)' : 'var(--text-muted)' }}>{machine.currentShift?.defectiveUnits ?? 0}</strong></span>
      </div>
    </div>
  );
}
