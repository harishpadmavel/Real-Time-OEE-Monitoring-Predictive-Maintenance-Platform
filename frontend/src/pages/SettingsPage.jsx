import React, { useState } from 'react';

export default function SettingsPage({
  simulatorRunning = true,
  onToggleSimulator,
  onTriggerAnomaly,
}) {
  const [threshold, setThreshold] = useState(55);
  const [predictiveNotify, setPredictiveNotify] = useState(true);
  const [emailSummary, setEmailSummary] = useState(false);
  const [socketRefresh, setSocketRefresh] = useState(true);
  const [triggering, setTriggering] = useState(false);

  const handleTriggerAnomaly = async () => {
    setTriggering(true);
    try {
      await onTriggerAnomaly();
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div>
      <div className="page-title">System Settings & Telemetry Controls</div>
      <p className="page-desc">
        Configure threshold alerting, automated predictive triggers, and shop-floor IoT simulation engine.
      </p>

      {/* Simulator Control Panel */}
      <div className="panel" style={{ marginBottom: '24px', borderLeft: '4px solid var(--amber)' }}>
        <h2>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          SHOP FLOOR TELEMETRY SIMULATOR (PRESENTATION / DEMO UTILITY)
        </h2>
        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.4' }}>
          Simulates PLC / IoT gateway sensor heartbeats, machine cycle completions, and piece counts in real-time. Use this to demonstrate live updates during review presentations without requiring physical shop-floor hardware.
        </p>

        <div className="settings-row">
          <div>
            <div className="settings-label">Live Telemetry Simulation Engine</div>
            <div className="settings-hint">
              Cycles every 3s: increments production units, updates availability & OEE, emits Socket.IO packets
            </div>
          </div>
          <div
            className={`toggle ${simulatorRunning ? 'on' : ''}`}
            onClick={onToggleSimulator}
            title={simulatorRunning ? 'Click to pause simulation' : 'Click to start simulation'}
          ></div>
        </div>

        <div className="settings-row" style={{ borderBottom: 'none' }}>
          <div>
            <div className="settings-label">Simulate Shop Floor Stoppage Anomaly</div>
            <div className="settings-hint">
              Instantly trips a machine status to DOWN and broadcasts a real-time downtime alert across all connected screens
            </div>
          </div>
          <button
            className="btn btn-danger"
            onClick={handleTriggerAnomaly}
            disabled={triggering}
          >
            {triggering ? 'Simulating...' : '⚡ Trigger Shop Floor Anomaly'}
          </button>
        </div>
      </div>

      {/* General Settings */}
      <div className="panel">
        <h2>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1z"/></svg>
          ALERT THRESHOLDS & DISPATCH
        </h2>

        <div className="settings-row">
          <div>
            <div className="settings-label">Low-OEE Warning Threshold: <strong style={{ color: 'var(--amber)' }}>{threshold}%</strong></div>
            <div className="settings-hint">Trigger amber alert when machine shift effectiveness falls below target</div>
          </div>
          <input
            type="range"
            className="range-input"
            min="30"
            max="80"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
          />
        </div>

        <div className="settings-row">
          <div>
            <div className="settings-label">Predictive Maintenance Trend Alerts</div>
            <div className="settings-hint">Automatically flag machines showing accelerating breakdown frequency</div>
          </div>
          <div
            className={`toggle ${predictiveNotify ? 'on' : ''}`}
            onClick={() => setPredictiveNotify(!predictiveNotify)}
          ></div>
        </div>

        <div className="settings-row">
          <div>
            <div className="settings-label">Shift Summary Report Dispatch</div>
            <div className="settings-hint">Aggregate shift end OEE numbers for Plant Manager and Supervisors</div>
          </div>
          <div
            className={`toggle ${emailSummary ? 'on' : ''}`}
            onClick={() => setEmailSummary(!emailSummary)}
          ></div>
        </div>

        <div className="settings-row">
          <div>
            <div className="settings-label">Real-Time Socket.IO Synchronization</div>
            <div className="settings-hint">Broadcast telemetry state instantly to all connected operator terminals</div>
          </div>
          <div
            className={`toggle ${socketRefresh ? 'on' : ''}`}
            onClick={() => setSocketRefresh(!socketRefresh)}
          ></div>
        </div>
      </div>
    </div>
  );
}
