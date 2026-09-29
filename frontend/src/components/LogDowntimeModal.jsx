import React, { useState } from 'react';

const DOWNTIME_REASONS = [
  { value: 'BREAKDOWN', label: 'Mechanical / Electrical Breakdown' },
  { value: 'MATERIAL_SHORTAGE', label: 'Material / Part Shortage' },
  { value: 'CHANGEOVER_SETUP', label: 'Tool Changeover & Setup' },
  { value: 'MINOR_STOPPAGE', label: 'Minor Stoppage / Sensor Trip' },
  { value: 'QUALITY_ISSUE', label: 'Quality Reject Quarantine' },
  { value: 'OPERATOR_UNAVAILABLE', label: 'Operator Unavailable / Break' },
  { value: 'OTHER', label: 'Other Facility Interruption' },
];

export default function LogDowntimeModal({ isOpen, onClose, machines = [], onSubmit }) {
  const [machineId, setMachineId] = useState(machines[0]?._id || '');
  const [reason, setReason] = useState('BREAKDOWN');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!machineId) return;

    setSubmitting(true);
    try {
      await onSubmit({ machineId, reason, notes });
      setNotes('');
      onClose();
    } catch (err) {
      console.error('Submit downtime error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">LOG DOWNTIME EVENT</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">SELECT MACHINE</label>
            <select
              className="form-select"
              value={machineId || (machines[0]?._id || '')}
              onChange={(e) => setMachineId(e.target.value)}
              required
            >
              {machines.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.type} · {m.status})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">DOWNTIME REASON CATEGORY</label>
            <select
              className="form-select"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            >
              {DOWNTIME_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">OPERATOR NOTES / ROOT CAUSE OBSERVATIONS</label>
            <textarea
              className="form-textarea"
              placeholder="e.g. Hydraulic pressure drop below 140 bar; replaced high-pressure O-ring."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Logging...' : '⚡ Log Downtime Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
