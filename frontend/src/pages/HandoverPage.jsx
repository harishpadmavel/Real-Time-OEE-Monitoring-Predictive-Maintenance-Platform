import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../utils/api';

export default function HandoverPage({ machines = [] }) {
  const { user } = useAuth();

  const assignedMachineIds = new Set(
    (user?.assignedMachines || []).map((m) => (m._id ? m._id.toString() : m.toString()))
  );
  const operatorMachines = assignedMachineIds.size > 0
    ? machines.filter((m) => assignedMachineIds.has(m._id.toString()))
    : machines;

  const [selectedMachineId, setSelectedMachineId] = useState(operatorMachines[0]?._id || '');
  const [latestNote, setLatestNote] = useState(null);
  const [historyNotes, setHistoryNotes] = useState([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (operatorMachines.length > 0 && !selectedMachineId) {
      setSelectedMachineId(operatorMachines[0]._id);
    }
  }, [operatorMachines, selectedMachineId]);

  const fetchNotes = useCallback(async (mId) => {
    if (!mId) return;
    setLoading(true);
    try {
      const [latestRes, historyRes] = await Promise.all([
        fetch(apiUrl(`/api/handover/latest?machineId=${mId}`), {
          headers: { Authorization: `Bearer ${localStorage.getItem('oee_token') || ''}` },
        }),
        fetch(apiUrl(`/api/handover/history?machineId=${mId}`), {
          headers: { Authorization: `Bearer ${localStorage.getItem('oee_token') || ''}` },
        }),
      ]);

      if (latestRes.ok) {
        const lData = await latestRes.json();
        setLatestNote(lData);
      }
      if (historyRes.ok) {
        const hData = await historyRes.json();
        setHistoryNotes(hData);
      }
    } catch (err) {
      console.warn('Failed to load handover notes:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedMachineId) {
      fetchNotes(selectedMachineId);
    }
  }, [selectedMachineId, fetchNotes]);

  const handlePostNote = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newNoteText.trim()) {
      setErrorMsg('Please enter note text.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(apiUrl('/api/handover'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('oee_token') || ''}`,
        },
        body: JSON.stringify({
          machineId: selectedMachineId,
          text: newNoteText.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit handover note');
      }

      setSuccessMsg('Handover note saved successfully!');
      setNewNoteText('');
      fetchNotes(selectedMachineId);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to post note.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-title">Shift-to-Shift Handover Notes</div>
      <p className="page-desc">
        Seamless communication between incoming and outgoing operators regarding station health, batches, and tooling observations.
      </p>

      {/* Machine selector if multiple */}
      {operatorMachines.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {operatorMachines.map((m) => (
            <button
              key={m._id}
              className={`btn ${selectedMachineId === m._id ? 'btn-primary' : ''}`}
              onClick={() => setSelectedMachineId(m._id)}
            >
              {m.name}
            </button>
          ))}
        </div>
      )}

      {errorMsg && (
        <div className="login-alert login-alert--error" style={{ marginBottom: '16px' }}>
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="login-alert login-alert--success" style={{ marginBottom: '16px' }}>
          {successMsg}
        </div>
      )}

      {/* Latest Active Handover Note */}
      <div
        className="panel"
        style={{
          borderLeft: '4px solid var(--cyan)',
          background: 'linear-gradient(135deg, rgba(79,195,217,0.06), var(--panel))',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '15px', color: 'var(--cyan)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📬</span> LATEST INCOMING NOTE FOR THIS STATION
          </h2>
          {latestNote && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {new Date(latestNote.createdAt).toLocaleDateString()} {new Date(latestNote.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ padding: '16px', color: 'var(--text-muted)' }}>Loading notes...</div>
        ) : latestNote ? (
          <div>
            <div style={{ fontSize: '15px', color: 'var(--text)', lineHeight: '1.6', marginBottom: '10px', fontStyle: 'italic' }}>
              "{latestNote.text}"
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Written by: <strong style={{ color: 'var(--text)' }}>{latestNote.author?.name || 'Operator'}</strong> ({latestNote.author?.role || 'OPERATOR'})
            </div>
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '10px 0' }}>
            No incoming handover note left for this station yet.
          </div>
        )}
      </div>

      {/* Write New Handover Note */}
      <div className="panel" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '15px', marginBottom: '14px' }}>
          WRITE HANDOVER NOTE FOR NEXT OPERATOR
        </h2>
        <form onSubmit={handlePostNote}>
          <div className="form-group">
            <textarea
              id="input-new-handover-text"
              className="form-textarea"
              placeholder="e.g. Completed order #491. Tooling bit 3 shows slight wear; replaced hydraulic fluid at 15:30. Staged raw material for Shift B..."
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              id="btn-save-handover-note"
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ padding: '10px 22px', fontSize: '13px', fontWeight: 700 }}
            >
              {submitting ? 'Posting Note...' : '📩 Post Handover Note'}
            </button>
          </div>
        </form>
      </div>

      {/* Handover History Feed */}
      <div className="panel">
        <h2 style={{ fontSize: '15px', marginBottom: '16px' }}>
          STATION HANDOVER LOG HISTORY
        </h2>
        {historyNotes.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No previous handover history for this station.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {historyNotes.map((note) => (
              <div
                key={note._id}
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--panel-2)',
                  borderRadius: '8px',
                  padding: '14px 16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <strong style={{ color: 'var(--text)', fontSize: '13px' }}>
                    {note.author?.name || 'Operator'}
                  </strong>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {new Date(note.createdAt).toLocaleDateString()} {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.5' }}>
                  {note.text}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
