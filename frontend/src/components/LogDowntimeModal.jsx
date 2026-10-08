import React, { useState, useEffect } from 'react';

export const DOWNTIME_REASONS = [
  { value: 'BREAKDOWN', label: 'Mechanical / Electrical Breakdown', icon: '💥' },
  { value: 'MATERIAL_SHORTAGE', label: 'Material / Part Shortage', icon: '📦' },
  { value: 'CHANGEOVER_SETUP', label: 'Tool Changeover & Setup', icon: '🔄' },
  { value: 'MINOR_STOPPAGE', label: 'Minor Stoppage / Sensor Trip', icon: '⚠️' },
  { value: 'QUALITY_ISSUE', label: 'Quality Reject Quarantine', icon: '🔬' },
  { value: 'OPERATOR_UNAVAILABLE', label: 'Operator Unavailable / Break', icon: '☕' },
  { value: 'OTHER', label: 'Other Facility Interruption', icon: '⚡' },
];

export default function LogDowntimeModal({
  isOpen,
  onClose,
  machines = [],
  presetMachineId = null,
  onSubmit,
}) {
  const [machineId, setMachineId] = useState('');
  const [reason, setReason] = useState('BREAKDOWN');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (presetMachineId) {
      setMachineId(presetMachineId);
    } else if (machines.length > 0 && !machineId) {
      setMachineId(machines[0]._id);
    }
  }, [presetMachineId, machines, machineId]);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setReason('BREAKDOWN');
      setNotes('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentMachine = machines.find((m) => m._id === (presetMachineId || machineId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const targetId = presetMachineId || machineId;
    if (!targetId) {
      setErrorMsg('Please select a machine.');
      return;
    }

    // Guard: if machine is already down
    if (currentMachine && currentMachine.status === 'DOWN') {
      setErrorMsg('This machine is already marked as DOWN with an active stoppage.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      await onSubmit({ machineId: targetId, reason, notes });
      setNotes('');
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to start downtime event.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🛑</span> RECORD MACHINE STOPPAGE
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {errorMsg && (
          <div className="login-alert login-alert--error" style={{ marginBottom: '14px' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {presetMachineId && currentMachine ? (
            <div className="form-group" style={{ background: 'var(--panel)', padding: '10px 14px', borderRadius: '6px' }}>
              <label className="form-label">ASSIGNED MACHINE</label>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
                {currentMachine.name} ({currentMachine.type} · Line {currentMachine.lineId || 'A'})
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">SELECT MACHINE</label>
              <select
                className="form-select"
                value={machineId || (machines[0]?._id || '')}
                onChange={(e) => {
                  setMachineId(e.target.value);
                  setErrorMsg('');
                }}
                required
              >
                {machines.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.type} · {m.status})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick-Pick Reason Grid */}
          <div className="form-group">
            <label className="form-label">QUICK-PICK STOPPAGE REASON</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {DOWNTIME_REASONS.map((r) => {
                const isSelected = reason === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setReason(r.value)}
                    style={{
                      background: isSelected ? 'rgba(230,72,60,0.18)' : 'var(--bg)',
                      border: `1.5px solid ${isSelected ? 'var(--red)' : 'var(--steel)'}`,
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: isSelected ? '#fff' : 'var(--text-muted)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12.5px',
                      fontWeight: isSelected ? 700 : 500,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{r.icon}</span>
                    <span>{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">OPERATOR NOTES / ROOT CAUSE OBSERVATIONS (OPTIONAL)</label>
            <textarea
              className="form-textarea"
              placeholder="e.g. Wire feeder jammed on Station 1, calling maintenance."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              id="btn-confirm-downtime"
              type="submit"
              className="btn"
              disabled={submitting}
              style={{
                background: 'linear-gradient(135deg, var(--red), #b73228)',
                color: '#fff',
                fontWeight: 700,
                border: 'none',
              }}
            >
              {submitting ? 'Initiating Stoppage...' : '🛑 STOP MACHINE & START TIMER'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
