import React, { useState } from 'react';

const MACHINE_TYPES = ['CNC', 'Press', 'Welding', 'Assembly', 'Painting', 'Lathe', 'Milling', 'Robot', 'Conveyor', 'Other'];
const LINE_IDS = ['LINE-A', 'LINE-B', 'LINE-C', 'LINE-D'];

const EMPTY_FORM = {
  name: '',
  type: 'CNC',
  lineId: 'LINE-A',
  idealCycleTimeSeconds: '',
  plannedProductionMinutesPerShift: 480,
  status: 'IDLE',
};

function AddMachineModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  if (!isOpen) return null;

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Machine name is required';
    if (!form.idealCycleTimeSeconds || Number(form.idealCycleTimeSeconds) <= 0)
      e.idealCycleTimeSeconds = 'Must be a positive number (seconds)';
    if (!form.plannedProductionMinutesPerShift || Number(form.plannedProductionMinutesPerShift) <= 0)
      e.plannedProductionMinutesPerShift = 'Must be a positive number (minutes)';
    return e;
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await onSubmit({
        ...form,
        idealCycleTimeSeconds: Number(form.idealCycleTimeSeconds),
        plannedProductionMinutesPerShift: Number(form.plannedProductionMinutesPerShift),
      });
      setForm(EMPTY_FORM);
      setErrors({});
      onClose();
    } catch (err) {
      setApiError(err.message || 'Failed to add machine. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      }}
    >
      <div style={{
        background: 'var(--panel)', border: '1px solid var(--steel)',
        borderRadius: '16px', width: '100%', maxWidth: '540px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        animation: 'modalIn 0.22s ease',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px 16px', borderBottom: '1px solid var(--steel)',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                fontSize: '22px', background: 'var(--amber)', borderRadius: '8px',
                width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>⚙️</span>
              <div>
                <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)' }}>Add New Machine</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Register a new asset to the production line</div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--steel)', border: 'none', color: 'var(--text-muted)',
              width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer',
              fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px 24px' }}>
          {apiError && (
            <div style={{
              background: 'rgba(230,72,60,0.12)', border: '1px solid var(--red)',
              borderRadius: '8px', padding: '10px 14px', marginBottom: '16px',
              fontSize: '13px', color: 'var(--red)',
            }}>{apiError}</div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Machine Name */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Machine Name *</label>
              <input
                id="machine-name-input"
                style={{ ...inputStyle, borderColor: errors.name ? 'var(--red)' : 'var(--steel)' }}
                placeholder="e.g. CNC Machine 3"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
              {errors.name && <div style={errorStyle}>{errors.name}</div>}
            </div>

            {/* Machine Type */}
            <div>
              <label style={labelStyle}>Machine Type *</label>
              <select
                id="machine-type-select"
                style={inputStyle}
                value={form.type}
                onChange={(e) => handleChange('type', e.target.value)}
              >
                {MACHINE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Line ID */}
            <div>
              <label style={labelStyle}>Production Line *</label>
              <select
                id="machine-line-select"
                style={inputStyle}
                value={form.lineId}
                onChange={(e) => handleChange('lineId', e.target.value)}
              >
                {LINE_IDS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            {/* Ideal Cycle Time */}
            <div>
              <label style={labelStyle}>Ideal Cycle Time (seconds) *</label>
              <input
                id="machine-cycle-input"
                type="number"
                min="1"
                style={{ ...inputStyle, borderColor: errors.idealCycleTimeSeconds ? 'var(--red)' : 'var(--steel)' }}
                placeholder="e.g. 30"
                value={form.idealCycleTimeSeconds}
                onChange={(e) => handleChange('idealCycleTimeSeconds', e.target.value)}
              />
              {errors.idealCycleTimeSeconds && <div style={errorStyle}>{errors.idealCycleTimeSeconds}</div>}
            </div>

            {/* Planned Production Minutes */}
            <div>
              <label style={labelStyle}>Shift Duration (minutes) *</label>
              <input
                id="machine-shift-input"
                type="number"
                min="1"
                style={{ ...inputStyle, borderColor: errors.plannedProductionMinutesPerShift ? 'var(--red)' : 'var(--steel)' }}
                placeholder="e.g. 480"
                value={form.plannedProductionMinutesPerShift}
                onChange={(e) => handleChange('plannedProductionMinutesPerShift', e.target.value)}
              />
              {errors.plannedProductionMinutesPerShift && <div style={errorStyle}>{errors.plannedProductionMinutesPerShift}</div>}
            </div>

            {/* Initial Status */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Initial Status</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '6px' }}>
                {['IDLE', 'RUNNING', 'MAINTENANCE'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    id={`status-${s.toLowerCase()}`}
                    onClick={() => handleChange('status', s)}
                    style={{
                      padding: '7px 18px', borderRadius: '8px', cursor: 'pointer',
                      fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px',
                      border: form.status === s ? '1px solid var(--amber)' : '1px solid var(--steel)',
                      background: form.status === s ? 'rgba(242,169,59,0.15)' : 'var(--panel-2)',
                      color: form.status === s ? 'var(--amber)' : 'var(--text-muted)',
                      transition: 'all 0.15s',
                    }}
                  >{s}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="button" onClick={onClose} className="btn" style={{ minWidth: '90px' }}>
              Cancel
            </button>
            <button
              type="submit"
              id="add-machine-submit"
              disabled={loading}
              style={{
                minWidth: '130px', padding: '10px 22px', borderRadius: '8px',
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? 'var(--steel)' : 'linear-gradient(135deg, var(--amber), #e0852a)',
                color: loading ? 'var(--text-muted)' : '#111',
                fontWeight: 700, fontSize: '13px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.2s',
              }}
            >
              {loading ? (
                <><span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid #888', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Adding…</>
              ) : '⚙️ Add Machine'}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        @keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #1B2024; color: #E9EAEA; }
      `}</style>
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.6px',
  color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px',
};
const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: '8px',
  background: 'var(--panel-2)', border: '1px solid var(--steel)',
  color: 'var(--text)', fontSize: '14px', outline: 'none',
  fontFamily: 'var(--font-body)',
};
const errorStyle = { fontSize: '11px', color: 'var(--red)', marginTop: '4px' };

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MachinesPage({ machines = [], oeeMap = {}, onUpdateStatus, onAddMachine }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const statusColor = (s) => (s === 'RUNNING' ? 'green' : s === 'DOWN' ? 'red' : 'amber');
  const oeeColor = (v) => (v >= 75 ? 'var(--green)' : v >= 55 ? 'var(--amber)' : 'var(--red)');

  const handleAddMachine = async (data) => {
    await onAddMachine(data);
    setSuccessMsg(`✅ "${data.name}" added to ${data.lineId}`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '4px' }}>
        <div>
          <div className="page-title">Machines &amp; Assets</div>
          <p className="page-desc">
            Complete equipment register for all production lines with cycle configuration, live telemetry health, and control overrides.
          </p>
        </div>
        <button
          id="open-add-machine-btn"
          onClick={() => setModalOpen(true)}
          style={{
            padding: '10px 20px', borderRadius: '10px', border: 'none',
            background: 'linear-gradient(135deg, var(--amber), #e0852a)',
            color: '#111', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 4px 18px rgba(242,169,59,0.3)',
            transition: 'box-shadow 0.2s, transform 0.15s',
            whiteSpace: 'nowrap',
          }}
          onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 6px 28px rgba(242,169,59,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseOut={(e) => { e.currentTarget.style.boxShadow = '0 4px 18px rgba(242,169,59,0.3)'; e.currentTarget.style.transform = 'none'; }}
        >
          <span style={{ fontSize: '16px' }}>⊕</span> Add Machine
        </button>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div style={{
          background: 'rgba(63,182,95,0.12)', border: '1px solid var(--green)',
          borderRadius: '8px', padding: '10px 16px', marginBottom: '16px',
          fontSize: '13px', color: 'var(--green)', animation: 'fadeInDown 0.3s ease',
        }}>
          {successMsg}
        </div>
      )}

      {/* Stats Bar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', margin: '16px 0' }}>
        {[
          { label: 'Total Machines', value: machines.length, color: 'var(--cyan)' },
          { label: 'Running', value: machines.filter(m => m.status === 'RUNNING').length, color: 'var(--green)' },
          { label: 'Down', value: machines.filter(m => m.status === 'DOWN').length, color: 'var(--red)' },
          { label: 'Idle / Maint.', value: machines.filter(m => m.status === 'IDLE' || m.status === 'MAINTENANCE').length, color: 'var(--amber)' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'var(--panel)', border: '1px solid var(--steel)',
            borderRadius: '10px', padding: '12px 18px', display: 'flex',
            alignItems: 'center', gap: '10px', minWidth: '140px',
          }}>
            <span style={{ fontSize: '22px', fontWeight: 800, color: stat.color, fontFamily: 'var(--font-mono)' }}>{stat.value}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="panel">
        <div style={{ overflowX: 'auto' }}>
          {machines.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏭</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>No machines registered yet</div>
              <div style={{ fontSize: '13px', marginBottom: '20px' }}>Add your first machine to start monitoring OEE.</div>
              <button
                onClick={() => setModalOpen(true)}
                style={{
                  padding: '10px 24px', borderRadius: '8px', border: 'none',
                  background: 'var(--amber)', color: '#111', fontWeight: 700, cursor: 'pointer',
                }}
              >+ Add First Machine</button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Machine Asset</th>
                  <th>Type</th>
                  <th>Line</th>
                  <th>Ideal Cycle</th>
                  <th>Shift Good Units</th>
                  <th>Defects</th>
                  <th>Status</th>
                  <th>Live OEE</th>
                  <th>Quick Control</th>
                </tr>
              </thead>
              <tbody>
                {machines.map((m) => {
                  const oee = Math.round(oeeMap[m._id]?.oee ?? 75);
                  const sColor = statusColor(m.status);

                  return (
                    <tr key={m._id}>
                      <td>
                        <strong style={{ color: 'var(--text)' }}>{m.name}</strong>
                      </td>
                      <td>{m.type}</td>
                      <td>
                        <span style={{ background: 'var(--panel-2)', padding: '2px 8px', borderRadius: '5px', fontSize: '12px', fontWeight: 600 }}>
                          {m.lineId}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{m.idealCycleTimeSeconds}s</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>
                        {m.currentShift?.goodUnits ?? 0}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: (m.currentShift?.defectiveUnits ?? 0) > 0 ? 'var(--red)' : 'var(--text-muted)' }}>
                        {m.currentShift?.defectiveUnits ?? 0}
                      </td>
                      <td>
                        <span className="pill">
                          <span className="dot" style={{ background: `var(--${sColor})` }}></span>
                          {m.status}
                        </span>
                      </td>
                      <td style={{ color: oeeColor(oee), fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '15px' }}>
                        {oee}%
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {m.status !== 'RUNNING' ? (
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => onUpdateStatus(m._id, 'RUNNING')}
                            >
                              Set Running
                            </button>
                          ) : (
                            <button
                              className="btn btn-sm"
                              onClick={() => onUpdateStatus(m._id, 'IDLE')}
                            >
                              Set Idle
                            </button>
                          )}
                          {m.status !== 'DOWN' && (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => onUpdateStatus(m._id, 'DOWN')}
                            >
                              Set Down
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AddMachineModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddMachine}
      />
      <style>{`@keyframes fadeInDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
