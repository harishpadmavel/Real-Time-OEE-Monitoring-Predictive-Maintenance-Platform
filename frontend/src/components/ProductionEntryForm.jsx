import React, { useState } from 'react';
import { apiUrl } from '../utils/api';

const REJECT_REASONS = [
  { value: 'DIMENSION_OUT_OF_SPEC', label: 'Dimension Out of Spec' },
  { value: 'SURFACE_DEFECT', label: 'Surface Defect / Scratch' },
  { value: 'WELD_DEFECT', label: 'Weld Defect / Porosity' },
  { value: 'PAINT_DEFECT', label: 'Paint Defect / Blemish' },
  { value: 'OTHER', label: 'Other Flaw / Material Reject' },
];

export default function ProductionEntryForm({ machineId, shiftSessionId, onSubmitted }) {
  const [goodUnits, setGoodUnits] = useState('');
  const [rejectedUnits, setRejectedUnits] = useState('0');
  const [rejectReason, setRejectReason] = useState('DIMENSION_OUT_OF_SPEC');
  const [runTimeMinutes, setRunTimeMinutes] = useState('15');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const parsedRejects = parseInt(rejectedUnits, 10) || 0;
  const parsedGood = parseInt(goodUnits, 10) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (goodUnits === '' || parsedGood < 0) {
      setError('Please enter valid Good Units produced (>= 0).');
      return;
    }

    if (parsedRejects > 0 && !rejectReason) {
      setError('A Reject Reason is mandatory when logging rejected units.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/production'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('oee_token') || ''}`,
        },
        body: JSON.stringify({
          machineId,
          shiftSessionId,
          goodUnits: parsedGood,
          rejectedUnits: parsedRejects,
          rejectReason: parsedRejects > 0 ? rejectReason : undefined,
          runTimeMinutes: parseInt(runTimeMinutes, 10) || 15,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit production units');
      }

      setSuccess(`Successfully logged +${parsedGood} good units ${parsedRejects > 0 ? `and ${parsedRejects} rejects` : ''}!`);
      setGoodUnits('');
      setRejectedUnits('0');
      if (onSubmitted) onSubmitted(data);

      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to log production count.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel" style={{ padding: '20px' }}>
      <h2 style={{ fontSize: '15px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        LOG PRODUCTION OUTPUT
      </h2>

      {error && (
        <div className="login-alert login-alert--error" style={{ marginBottom: '14px' }}>
          {error}
        </div>
      )}
      {success && (
        <div className="login-alert login-alert--success" style={{ marginBottom: '14px' }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">GOOD UNITS</label>
            <input
              id="input-good-units"
              type="number"
              min="0"
              className="form-input"
              placeholder="e.g. 50"
              value={goodUnits}
              onChange={(e) => setGoodUnits(e.target.value)}
              required
              style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">REJECTED UNITS</label>
            <input
              id="input-rejected-units"
              type="number"
              min="0"
              className="form-input"
              placeholder="0"
              value={rejectedUnits}
              onChange={(e) => setRejectedUnits(e.target.value)}
              style={{
                fontSize: '16px',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                borderColor: parsedRejects > 0 ? 'var(--red)' : undefined,
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">INTERVAL RUNTIME (MIN)</label>
            <input
              id="input-runtime-mins"
              type="number"
              min="1"
              max="480"
              className="form-input"
              value={runTimeMinutes}
              onChange={(e) => setRunTimeMinutes(e.target.value)}
              style={{ fontSize: '15px', fontFamily: 'var(--font-mono)' }}
            />
          </div>
        </div>

        {parsedRejects > 0 && (
          <div className="form-group" style={{ marginTop: '14px', marginBottom: 0 }}>
            <label className="form-label" style={{ color: 'var(--red)' }}>
              REJECT REASON (REQUIRED)
            </label>
            <select
              id="select-reject-reason"
              className="form-select"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              required
              style={{ borderColor: 'var(--red)' }}
            >
              {REJECT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            id="btn-log-production"
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ padding: '10px 22px', fontSize: '13px', fontWeight: 700 }}
          >
            {loading ? 'Submitting...' : '⚡ Record Interval Output'}
          </button>
        </div>
      </form>
    </div>
  );
}
