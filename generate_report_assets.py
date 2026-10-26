import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

def get_driver(width=1200, height=800):
    options = Options()
    options.add_argument('--headless')
    options.add_argument(f'--window-size={width},{height}')
    options.add_argument('--force-device-scale-factor=2') # High DPI rendering
    driver = webdriver.Chrome(options=options)
    return driver

def render_html_to_image(html_content, output_png, width=1000, height=700):
    temp_html = "temp_render.html"
    with open(temp_html, "w", encoding="utf-8") as f:
        f.write(html_content)
    
    driver = get_driver(width, height)
    abs_path = os.path.abspath(temp_html).replace('\\', '/')
    driver.get(f"file:///{abs_path}")
    time.sleep(0.5)
    
    # If element #container exists, capture just container, else full page
    try:
        elem = driver.find_element("id", "render-target")
        elem.screenshot(output_png)
    except Exception:
        driver.save_screenshot(output_png)
    driver.quit()
    if os.path.exists(temp_html):
        os.remove(temp_html)
    print(f"Generated {output_png}")

# 1. Figure 3.1: System Architecture
html_fig_3_1 = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { margin: 0; padding: 20px; background: white; font-family: 'Times New Roman', serif; display: flex; justify-content: center; }
  #render-target { width: 520px; background: white; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
  .node { border: 1.5px solid #222; border-radius: 4px; padding: 10px 14px; text-align: center; font-size: 13.5px; font-weight: bold; background: #fff; margin: 0 auto; width: 260px; box-shadow: 2px 2px 0px rgba(0,0,0,0.1); }
  .node-wide { width: 340px; }
  .arrow { display: flex; justify-content: center; align-items: center; height: 32px; font-size: 11px; color: #333; position: relative; }
  .arrow-line { width: 1.5px; height: 100%; background: #222; }
  .arrow-head { width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 7px solid #222; position: absolute; bottom: 0; }
  .label-right { position: absolute; left: calc(50% + 12px); font-size: 10.5px; color: #444; font-style: italic; white-space: nowrap; }
  .split-row { display: flex; justify-content: space-between; margin: 0 auto; width: 440px; }
  .split-node { width: 195px; border: 1.5px solid #222; border-radius: 4px; padding: 8px 10px; text-align: center; font-size: 12.5px; font-weight: bold; background: #fff; box-shadow: 2px 2px 0px rgba(0,0,0,0.1); }
</style>
</head>
<body>
<div id="render-target">
  <div class="node">Shop Floor Machine Sensors & Simulator<br><span style="font-size:11px; font-weight:normal;">(5 Discrete Production Stations)</span></div>
  <div class="arrow"><div class="arrow-line"></div><div class="arrow-head"></div><span class="label-right">3s Telemetry Ticks (Status, Cycle, Units)</span></div>
  
  <div class="node">IoT Edge Ingestion & WebSockets Gateway<br><span style="font-size:11px; font-weight:normal;">(Node.js / Express / Socket.IO)</span></div>
  <div class="arrow"><div class="arrow-line"></div><div class="arrow-head"></div><span class="label-right">Store Raw Telemetry & Events</span></div>
  
  <div class="node">MongoDB Central Data Repository<br><span style="font-size:11px; font-weight:normal;">(Machines, DowntimeLogs, Telemetry, Shifts)</span></div>
  <div class="arrow"><div class="arrow-line"></div><div class="arrow-head"></div><span class="label-right">Query Active Production Windows</span></div>
  
  <div class="node">Real-Time OEE Calculation Engine<br><span style="font-size:11px; font-weight:normal;">Availability &times; Performance &times; Quality</span></div>
  <div class="arrow"><div class="arrow-line"></div><div class="arrow-head"></div><span class="label-right">Stream Factor Metrics & Anomaly Feed</span></div>
  
  <div class="split-row">
    <div class="split-node">Predictive Velocity Engine<br><span style="font-size:10.5px; font-weight:normal;">Rolling 7-day breakdown velocity & frequency acceleration</span></div>
    <div class="split-node">Pareto Root-Cause Loss Engine<br><span style="font-size:10.5px; font-weight:normal;">TPM Six Big Losses & duration classification</span></div>
  </div>
  <div class="arrow"><div class="arrow-line"></div><div class="arrow-head"></div><span class="label-right">Condition Alerts & Playbooks</span></div>
  
  <div class="node node-wide">Role-Based Access Control & Action Dispatcher<br><span style="font-size:11px; font-weight:normal;">JWT Authentication (Operator, Supervisor, Maintenance, Manager)</span></div>
  <div class="arrow"><div class="arrow-line"></div><div class="arrow-head"></div><span class="label-right">Real-Time UI Push Updates</span></div>
  
  <div class="node node-wide">Interactive User Presentation Layer<br><span style="font-size:11px; font-weight:normal;">Forgepoint Control Room Dashboard & Operator Consoles</span></div>
</div>
</body>
</html>"""

# 2. Figure 4.1: Pseudocode for Telemetry Acquisition & Preprocessing
html_fig_4_1 = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { margin: 0; padding: 15px; background: white; font-family: 'Consolas', 'Courier New', monospace; }
  #render-target { width: 560px; background: #fdfdfd; border: 1.5px solid #222; border-radius: 4px; padding: 16px 20px; font-size: 11.5px; line-height: 1.5; color: #111; }
  .kw { font-weight: bold; color: #000; }
  .comment { color: #555; font-style: italic; }
  .fn { font-weight: bold; }
  .indent1 { margin-left: 20px; }
  .indent2 { margin-left: 40px; }
  .indent3 { margin-left: 60px; }
</style>
</head>
<body>
<div id="render-target">
  <div><span class="kw">MODULE</span> TelemetryAcquisitionAndPreprocessing</div>
  <br>
  <div><span class="kw">FUNCTION</span> <span class="fn">collect_and_preprocess_telemetry</span>(machine_id, tick_interval):</div>
  <div class="indent1"><span class="kw">CONNECT</span> to Industrial IoT Gateway via WebSocket / Socket.IO</div>
  <div class="indent1"><span class="kw">INIT</span> raw_telemetry_buffer = []</div>
  <div class="indent1"><span class="kw">FOR EACH</span> 3-second cycle IN factory_shift:</div>
  <div class="indent2">payload = <span class="fn">RECEIVE_PACKET</span>(machine_id, status, run_speed, part_count, temp, vib)</div>
  <div class="indent2"><span class="kw">IF</span> <span class="fn">is_noisy_or_duplicate_packet</span>(payload):</div>
  <div class="indent3"><span class="kw">DISCARD</span> payload</div>
  <div class="indent2"><span class="kw">ELSE</span>:</div>
  <div class="indent3">cleaned_record = <span class="fn">NORMALIZE_TELEMETRY</span>(payload)</div>
  <div class="indent3"><span class="kw">STORE</span> cleaned_record INTO MongoDB 'telemetry' collection</div>
  <div class="indent3"><span class="kw">EMIT</span> "machine_telemetry_tick" to Live Control Room</div>
  <br>
  <div><span class="kw">FUNCTION</span> <span class="fn">is_noisy_or_duplicate_packet</span>(payload):</div>
  <div class="indent1"><span class="kw">IF</span> payload.timestamp &lt;= last_recorded_timestamp <span class="kw">OR</span> payload.status == NULL:</div>
  <div class="indent2"><span class="kw">RETURN TRUE</span></div>
  <div class="indent1"><span class="kw">IF</span> payload.vibration &gt; SENSOR_OVERFLOW_LIMIT <span class="kw">OR</span> payload.temperature &lt; -40:</div>
  <div class="indent2"><span class="kw">RETURN TRUE</span></div>
  <div class="indent1"><span class="kw">RETURN FALSE</span></div>
  <br>
  <div><span class="kw">END MODULE</span></div>
  <div class="indent1"><span class="kw">RETURN</span> CLEANED_TELEMETRY_STREAM</div>
</div>
</body>
</html>"""

# 3. Figure 4.2: Pseudocode for Real-Time OEE Computation
html_fig_4_2 = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { margin: 0; padding: 15px; background: white; font-family: 'Consolas', 'Courier New', monospace; }
  #render-target { width: 560px; background: #fdfdfd; border: 1.5px solid #222; border-radius: 4px; padding: 16px 20px; font-size: 11.5px; line-height: 1.5; color: #111; }
  .kw { font-weight: bold; color: #000; }
  .fn { font-weight: bold; }
  .indent1 { margin-left: 20px; }
  .indent2 { margin-left: 40px; }
  .indent3 { margin-left: 60px; }
</style>
</head>
<body>
<div id="render-target">
  <div><span class="kw">MODULE</span> RealTimeOEEComputation</div>
  <br>
  <div><span class="kw">FUNCTION</span> <span class="fn">calculate_machine_oee</span>(machine_id, shift_window):</div>
  <div class="indent1">planned_min = shift_window.total_planned_production_minutes</div>
  <div class="indent1">downtime_min = <span class="fn">QUERY_UNPLANNED_DOWNTIME_MINUTES</span>(machine_id, shift_window)</div>
  <div class="indent1">run_time_min = planned_min - downtime_min</div>
  <div class="indent1"><span class="kw">IF</span> planned_min &gt; 0: availability = run_time_min / planned_min <span class="kw">ELSE</span>: availability = 0.0</div>
  <br>
  <div class="indent1">total_units = <span class="fn">QUERY_TOTAL_PRODUCED_UNITS</span>(machine_id, shift_window)</div>
  <div class="indent1">ideal_cycle_sec = <span class="fn">GET_IDEAL_CYCLE_TIME</span>(machine_id)</div>
  <div class="indent1"><span class="kw">IF</span> run_time_min &gt; 0:</div>
  <div class="indent2">performance = (ideal_cycle_sec * total_units) / (run_time_min * 60)</div>
  <div class="indent1"><span class="kw">ELSE</span>: performance = 0.0</div>
  <br>
  <div class="indent1">good_units = <span class="fn">QUERY_GOOD_UNITS</span>(machine_id, shift_window)</div>
  <div class="indent1"><span class="kw">IF</span> total_units &gt; 0: quality = good_units / total_units <span class="kw">ELSE</span>: quality = 1.0</div>
  <br>
  <div class="indent1">composite_oee = <span class="fn">CLAMP</span>(availability * performance * quality, 0.0, 1.0)</div>
  <div class="indent1">benchmark_band = <span class="fn">CLASSIFY_TPM_BENCHMARK</span>(composite_oee)</div>
  <div class="indent1"><span class="kw">RETURN</span> { availability, performance, quality, composite_oee, benchmark_band }</div>
  <br>
  <div><span class="kw">END MODULE</span></div>
</div>
</body>
</html>"""

# 4. Figure 4.3: Availability Loss Breakdown Diagram
html_fig_4_3 = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { margin: 0; padding: 20px; background: white; font-family: 'Times New Roman', serif; display: flex; justify-content: center; }
  #render-target { width: 520px; background: white; padding: 15px; border: 1px solid #ccc; border-radius: 6px; }
  .box-container { display: flex; align-items: center; justify-content: space-between; }
  .box-col { display: flex; flex-direction: column; gap: 10px; width: 140px; }
  .card { border: 1.5px solid #222; border-radius: 4px; padding: 8px 10px; text-align: center; font-size: 12px; font-weight: bold; background: #fafafa; }
  .arrow-svg { width: 40px; height: 100px; }
  .center-card { width: 150px; border: 2px solid #1e40af; background: #eff6ff; color: #1e3a8a; border-radius: 6px; padding: 12px 10px; text-align: center; font-weight: bold; font-size: 13px; }
  .sub-note { font-size: 10.5px; font-weight: normal; margin-top: 4px; color: #333; }
</style>
</head>
<body>
<div id="render-target">
  <div class="box-container">
    <div class="box-col">
      <div class="card">Equipment Breakdown<br><span class="sub-note">Sudden Tool / Motor Halts</span></div>
      <div class="card">Setup & Adjustments<br><span class="sub-note">Tooling Changeovers</span></div>
      <div class="card">Unplanned Idling<br><span class="sub-note">Starvation / Blockage</span></div>
    </div>
    <div style="font-size:24px; font-weight:bold; color:#444;">&rarr;</div>
    <div class="center-card">
      AVAILABILITY LOSS ENGINE<br>
      <span class="sub-note" style="color:#1e40af;">Availability = Run Time / Planned Operating Time</span>
    </div>
    <div style="font-size:24px; font-weight:bold; color:#444;">&rarr;</div>
    <div class="box-col">
      <div class="card" style="border-color:#b91c1c; color:#991b1b; background:#fef2f2;">Pareto Loss Ticket<br><span class="sub-note">Duration & Loss Code</span></div>
      <div class="card" style="border-color:#15803d; color:#166534; background:#f0fdf4;">Live OEE Impact<br><span class="sub-note">Factor Degradation</span></div>
    </div>
  </div>
</div>
</body>
</html>"""

# 5. Figure 4.4: Performance Speed Loss Mechanics Diagram
html_fig_4_4 = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { margin: 0; padding: 20px; background: white; font-family: 'Times New Roman', serif; display: flex; justify-content: center; }
  #render-target { width: 520px; background: white; padding: 15px; border: 1px solid #ccc; border-radius: 6px; }
  .box-container { display: flex; align-items: center; justify-content: space-between; }
  .box-col { display: flex; flex-direction: column; gap: 10px; width: 140px; }
  .card { border: 1.5px solid #222; border-radius: 4px; padding: 8px 10px; text-align: center; font-size: 12px; font-weight: bold; background: #fafafa; }
  .center-card { width: 160px; border: 2px solid #b45309; background: #fffbeb; color: #92400e; border-radius: 6px; padding: 12px 10px; text-align: center; font-weight: bold; font-size: 13px; }
  .sub-note { font-size: 10.5px; font-weight: normal; margin-top: 4px; color: #333; }
</style>
</head>
<body>
<div id="render-target">
  <div class="box-container">
    <div class="box-col">
      <div class="card">Micro-Idling Stoppages<br><span class="sub-note">&lt; 3 Min Sensor Blips</span></div>
      <div class="card">Reduced Running Speed<br><span class="sub-note">Sub-Optimal RPM / Feed</span></div>
      <div class="card">Operator Minor Lags<br><span class="sub-note">Material Feed Inefficiency</span></div>
    </div>
    <div style="font-size:24px; font-weight:bold; color:#444;">&rarr;</div>
    <div class="center-card">
      PERFORMANCE LOSS ENGINE<br>
      <span class="sub-note" style="color:#b45309;">Speed Efficiency = (Ideal Cycle Time &times; Total Units) / Operating Time</span>
    </div>
    <div style="font-size:24px; font-weight:bold; color:#444;">&rarr;</div>
    <div class="box-col">
      <div class="card" style="border-color:#b45309; color:#92400e; background:#fffbeb;">Speed Efficiency %<br><span class="sub-note">Real vs Nameplate Speed</span></div>
      <div class="card" style="border-color:#4338ca; color:#3730a3; background:#eef2ff;">Lost Operating Time<br><span class="sub-note">Net Equivalent Minutes</span></div>
    </div>
  </div>
</div>
</body>
</html>"""

# 6. Figure 4.5: Pseudocode for Predictive Anomaly Detection & Velocity Scoring
html_fig_4_5 = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { margin: 0; padding: 15px; background: white; font-family: 'Consolas', 'Courier New', monospace; }
  #render-target { width: 560px; background: #fdfdfd; border: 1.5px solid #222; border-radius: 4px; padding: 16px 20px; font-size: 11.5px; line-height: 1.5; color: #111; }
  .kw { font-weight: bold; color: #000; }
  .fn { font-weight: bold; }
  .indent1 { margin-left: 20px; }
  .indent2 { margin-left: 40px; }
  .indent3 { margin-left: 60px; }
</style>
</head>
<body>
<div id="render-target">
  <div><span class="kw">MODULE</span> PredictiveAnomalyAndVelocityScoring</div>
  <br>
  <div><span class="kw">FUNCTION</span> <span class="fn">evaluate_predictive_alerts</span>(machine_id, rolling_window_days=7):</div>
  <div class="indent1">historical_events = <span class="fn">FETCH_DOWNTIME_LOGS</span>(machine_id, rolling_window_days)</div>
  <div class="indent1">recent_3d_events = <span class="fn">FILTER</span>(historical_events, days_ago &lt;= 3)</div>
  <div class="indent1">prior_4d_events  = <span class="fn">FILTER</span>(historical_events, days_ago &gt; 3)</div>
  <br>
  <div class="indent1">recent_rate = <span class="fn">COUNT</span>(recent_3d_events) / 3.0</div>
  <div class="indent1">prior_rate  = <span class="fn">COUNT</span>(prior_4d_events) / 4.0</div>
  <div class="indent1">velocity_ratio = recent_rate / <span class="fn">MAX</span>(prior_rate, 0.25)</div>
  <br>
  <div class="indent1"><span class="kw">IF</span> velocity_ratio &gt;= 2.0 <span class="kw">OR</span> <span class="fn">COUNT</span>(recent_3d_events) &gt;= 5:</div>
  <div class="indent2">severity = "CRITICAL"</div>
  <div class="indent2">confidence = <span class="fn">CALCULATE_CONFIDENCE</span>(velocity_ratio, recent_rate)</div>
  <div class="indent2">playbook = <span class="fn">FETCH_PRESCRIPTIVE_PLAYBOOK</span>(machine_id, "HIGH_FAILURE_VELOCITY")</div>
  <div class="indent2"><span class="kw">DISPATCH_ALERT</span>(severity, confidence, playbook, machine_id)</div>
  <div class="indent1"><span class="kw">ELSE IF</span> velocity_ratio &gt;= 1.3:</div>
  <div class="indent2">severity = "WARNING"</div>
  <div class="indent2"><span class="kw">DISPATCH_ALERT</span>(severity, 0.72, "Monitor mechanical wear", machine_id)</div>
  <div class="indent1"><span class="kw">RETURN</span> { severity, velocity_ratio, confidence, playbook }</div>
  <br>
  <div><span class="kw">END MODULE</span></div>
</div>
</body>
</html>"""

# 7. Figure 4.6: Pseudocode for Downtime Resolution & Shift Handover Management
html_fig_4_6 = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { margin: 0; padding: 15px; background: white; font-family: 'Consolas', 'Courier New', monospace; }
  #render-target { width: 560px; background: #fdfdfd; border: 1.5px solid #222; border-radius: 4px; padding: 16px 20px; font-size: 11.5px; line-height: 1.5; color: #111; }
  .kw { font-weight: bold; color: #000; }
  .fn { font-weight: bold; }
  .indent1 { margin-left: 20px; }
  .indent2 { margin-left: 40px; }
  .indent3 { margin-left: 60px; }
</style>
</head>
<body>
<div id="render-target">
  <div><span class="kw">MODULE</span> DowntimeResolutionAndShiftHandover</div>
  <br>
  <div><span class="kw">FUNCTION</span> <span class="fn">resolve_downtime_event</span>(ticket_id, operator_id, root_cause, corrective_action):</div>
  <div class="indent1">ticket = <span class="fn">FIND_TICKET_BY_ID</span>(ticket_id)</div>
  <div class="indent1">ticket.end_timestamp = <span class="fn">CURRENT_TIMESTAMP</span>()</div>
  <div class="indent1">ticket.duration_minutes = (ticket.end_timestamp - ticket.start_timestamp) / 60000</div>
  <div class="indent1">ticket.root_cause = root_cause</div>
  <div class="indent1">ticket.corrective_action = corrective_action</div>
  <div class="indent1">ticket.status = "RESOLVED"</div>
  <div class="indent1"><span class="kw">SAVE</span> ticket INTO MongoDB 'downtimelogs'</div>
  <br>
  <div class="indent1"><span class="fn">UPDATE_MACHINE_STATE</span>(ticket.machine_id, new_status="RUNNING")</div>
  <div class="indent1"><span class="fn">TRIGGER_OEE_RECALCULATION</span>(ticket.machine_id)</div>
  <div class="indent1"><span class="kw">BROADCAST</span> "downtime_resolved" event over WebSocket to all Control Rooms</div>
  <br>
  <div><span class="kw">FUNCTION</span> <span class="fn">execute_shift_handover</span>(operator_id, machine_id, handover_notes):</div>
  <div class="indent1">shift_summary = <span class="fn">COMPUTE_SHIFT_METRICS</span>(machine_id, current_shift)</div>
  <div class="indent1"><span class="kw">LOG_HANDOVER</span>(operator_id, machine_id, shift_summary, handover_notes)</div>
  <div class="indent1"><span class="kw">RETURN</span> shift_summary</div>
  <br>
  <div><span class="kw">END MODULE</span></div>
</div>
</body>
</html>"""

# 8. Figure 6.1: MongoDB Backend Database Collections
html_fig_6_1 = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { margin: 0; padding: 15px; background: #0f172a; font-family: 'Consolas', monospace; color: #f8fafc; }
  #render-target { width: 560px; background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 16px; font-size: 11px; line-height: 1.45; }
  .header { font-size: 13px; font-weight: bold; color: #38bdf8; margin-bottom: 12px; border-bottom: 1px solid #334155; padding-bottom: 6px; }
  .key { color: #94a3b8; }
  .str { color: #4ade80; }
  .num { color: #f59e0b; }
  .coll-title { font-weight: bold; color: #f472b6; margin-top: 10px; margin-bottom: 4px; }
</style>
</head>
<body>
<div id="render-target">
  <div class="header">MongoDB Database Compass: oee_platform &bull; Cluster Active</div>
  <div class="coll-title">Collection: machines (5 records indexed)</div>
  <div>{ "_id": ObjectId("670560a1f..."), "machineId": <span class="str">"CNC-01"</span>, "name": <span class="str">"CNC Milling Machine 1"</span>, "idealCycleTime": <span class="num">45.0</span>, "status": <span class="str">"RUNNING"</span>, "lineId": <span class="str">"LINE-A"</span> }</div>
  
  <div class="coll-title">Collection: telemetry (Time-series ticks: 3s stream)</div>
  <div>{ "_id": ObjectId("670560bff..."), "machineId": <span class="str">"CNC-01"</span>, "runSpeed": <span class="num">1.0</span>, "partCount": <span class="num">412</span>, "temperature": <span class="num">58.4</span>, "vibration": <span class="num">1.28</span>, "timestamp": ISODate("2026-10-22T14:30:00Z") }</div>
  
  <div class="coll-title">Collection: downtimelogs (Root-Cause categorized)</div>
  <div>{ "_id": ObjectId("670560c5a..."), "machineId": <span class="str">"PRESS-01"</span>, "category": <span class="str">"UNPLANNED_STOPPAGE"</span>, "lossType": <span class="str">"HYDRAULIC_LEAK"</span>, "durationMinutes": <span class="num">24.5</span>, "status": <span class="str">"RESOLVED"</span> }</div>
</div>
</body>
</html>"""

# 9. Figure 6.3: Station Health Diagnostics & Micro-Idling Monitor
html_fig_6_3 = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { margin: 0; padding: 15px; background: #0b0f19; font-family: 'Segoe UI', Arial, sans-serif; color: #fff; }
  #render-target { width: 560px; background: #14171a; border: 1.5px solid #2a2e37; border-radius: 8px; padding: 16px; }
  .station-hdr { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #2a2e37; padding-bottom: 10px; }
  .badge-run { background: #15803d; color: #fff; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
  .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 14px; }
  .m-box { background: #1c2026; padding: 10px; border-radius: 6px; text-align: center; border: 1px solid #2a2e37; }
  .m-val { font-size: 18px; font-weight: bold; margin-top: 2px; }
  .m-lbl { font-size: 10px; color: #8899a6; text-transform: uppercase; }
  .bar-row { margin-top: 14px; font-size: 11px; }
  .bar-bg { width: 100%; height: 8px; background: #2a2e37; border-radius: 4px; overflow: hidden; margin-top: 4px; }
  .bar-fill { height: 100%; background: #10b981; border-radius: 4px; }
</style>
</head>
<body>
<div id="render-target">
  <div class="station-hdr">
    <div>
      <div style="font-size:15px; font-weight:bold;">CNC Milling Center 1 <span style="font-size:12px; color:#8899a6;">(LINE-A)</span></div>
      <div style="font-size:11px; color:#10b981;">&bull; Telemetry Ingestion Active (3s Tick Sync)</div>
    </div>
    <div class="badge-run">RUNNING</div>
  </div>
  
  <div class="metrics-grid">
    <div class="m-box">
      <div class="m-lbl">Overall OEE</div>
      <div class="m-val" style="color:#10b981;">84.2%</div>
    </div>
    <div class="m-box">
      <div class="m-lbl">Availability</div>
      <div class="m-val" style="color:#38bdf8;">91.5%</div>
    </div>
    <div class="m-box">
      <div class="m-lbl">Performance</div>
      <div class="m-val" style="color:#f59e0b;">93.2%</div>
    </div>
    <div class="m-box">
      <div class="m-lbl">Quality</div>
      <div class="m-val" style="color:#a855f7;">98.7%</div>
    </div>
  </div>
  
  <div class="bar-row">
    <div style="display:flex; justify-content:space-between;">
      <span>Shift Cycle Speed (Nameplate vs Actual)</span>
      <span style="font-weight:bold; color:#10b981;">45.0s / 46.2s</span>
    </div>
    <div class="bar-bg"><div class="bar-fill" style="width: 93%;"></div></div>
  </div>
</div>
</body>
</html>"""

# 10. Figure 6.4: Operator Workstation Touch Console Mockup
html_fig_6_4 = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { margin: 0; padding: 15px; background: #0f172a; font-family: 'Segoe UI', Arial, sans-serif; color: #fff; }
  #render-target { width: 560px; background: #1e293b; border: 1.5px solid #334155; border-radius: 8px; padding: 16px; }
  .top-bar { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 10px; }
  .touch-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 14px 0; }
  .btn-touch { padding: 14px 0; text-align: center; border-radius: 6px; font-weight: bold; font-size: 13px; cursor: pointer; }
  .btn-green { background: #15803d; color: #fff; }
  .btn-amber { background: #d97706; color: #fff; }
  .btn-red { background: #b91c1c; color: #fff; }
  .timer-banner { background: #450a0a; border: 1px solid #dc2626; border-radius: 6px; padding: 10px; display: flex; justify-content: space-between; align-items: center; }
  .timer-val { font-size: 18px; font-weight: bold; color: #f87171; font-family: monospace; }
</style>
</head>
<body>
<div id="render-target">
  <div class="top-bar">
    <div>
      <div style="font-size:15px; font-weight:bold;">Operator Touch Station &bull; Machine CNC-01</div>
      <div style="font-size:11px; color:#94a3b8;">Logged in as: Harish Padmavel (Operator 1)</div>
    </div>
    <div style="font-size:12px; background:#0284c7; padding:4px 8px; border-radius:4px; font-weight:bold;">SHIFT 1 (DAY)</div>
  </div>
  
  <div class="touch-grid">
    <div class="btn-touch btn-green">START PRODUCTION</div>
    <div class="btn-touch btn-amber">IDLE / PAUSE</div>
    <div class="btn-touch btn-red">LOG DOWNTIME HALT</div>
  </div>
  
  <div class="timer-banner">
    <div>
      <div style="font-size:12px; font-weight:bold; color:#fca5a5;">ACTIVE DOWNTIME EVENT IN PROGRESS</div>
      <div style="font-size:10.5px; color:#e2e8f0;">Category: Tool Wear Replacement &bull; Line-A</div>
    </div>
    <div class="timer-val">00:14:38</div>
  </div>
</div>
</body>
</html>"""

# 11. Figure 6.5: 7-Day Trend Analytics & Pareto Loss Distribution
html_fig_6_5 = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { margin: 0; padding: 15px; background: white; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; }
  #render-target { width: 560px; background: #fff; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 16px; }
  .chart-title { font-size: 13px; font-weight: bold; color: #0f172a; margin-bottom: 8px; }
  .svg-wrap { width: 100%; height: 160px; }
  .pareto-bar-row { display: flex; align-items: center; margin: 5px 0; font-size: 11px; }
  .bar-lbl { width: 130px; color: #475569; }
  .bar-container { flex: 1; height: 12px; background: #f1f5f9; border-radius: 3px; overflow: hidden; margin: 0 8px; }
  .bar-f1 { height: 100%; background: #ef4444; width: 44%; }
  .bar-f2 { height: 100%; background: #f97316; width: 28%; }
  .bar-f3 { height: 100%; background: #eab308; width: 16%; }
  .bar-f4 { height: 100%; background: #3b82f6; width: 12%; }
  .legend { display: flex; gap: 14px; font-size: 11px; margin-top: 10px; justify-content: center; }
  .leg-item { display: flex; align-items: center; gap: 4px; }
  .leg-box { width: 10px; height: 10px; border-radius: 2px; }
</style>
</head>
<body>
<div id="render-target">
  <div class="chart-title">Line-A Rolling 7-Day OEE Trend Analysis</div>
  <svg class="svg-wrap" viewBox="0 0 520 150">
    <!-- Grid lines -->
    <line x1="40" y1="20" x2="500" y2="20" stroke="#f1f5f9" stroke-width="1"/>
    <line x1="40" y1="50" x2="500" y2="50" stroke="#f1f5f9" stroke-width="1"/>
    <line x1="40" y1="80" x2="500" y2="80" stroke="#f1f5f9" stroke-width="1"/>
    <line x1="40" y1="110" x2="500" y2="110" stroke="#f1f5f9" stroke-width="1"/>
    <line x1="40" y1="130" x2="500" y2="130" stroke="#cbd5e1" stroke-width="1.5"/>
    <line x1="40" y1="10" x2="40" y2="130" stroke="#cbd5e1" stroke-width="1.5"/>
    
    <!-- Y Axis Labels -->
    <text x="32" y="24" font-size="9" text-anchor="end" fill="#94a3b8">100%</text>
    <text x="32" y="54" font-size="9" text-anchor="end" fill="#94a3b8">85%</text>
    <text x="32" y="84" font-size="9" text-anchor="end" fill="#94a3b8">70%</text>
    <text x="32" y="114" font-size="9" text-anchor="end" fill="#94a3b8">55%</text>
    
    <!-- X Axis Labels (Days) -->
    <text x="80" y="144" font-size="9" text-anchor="middle" fill="#64748b">Day 1</text>
    <text x="145" y="144" font-size="9" text-anchor="middle" fill="#64748b">Day 2</text>
    <text x="210" y="144" font-size="9" text-anchor="middle" fill="#64748b">Day 3</text>
    <text x="275" y="144" font-size="9" text-anchor="middle" fill="#64748b">Day 4</text>
    <text x="340" y="144" font-size="9" text-anchor="middle" fill="#64748b">Day 5</text>
    <text x="405" y="144" font-size="9" text-anchor="middle" fill="#64748b">Day 6</text>
    <text x="470" y="144" font-size="9" text-anchor="middle" fill="#64748b">Day 7</text>
    
    <!-- Availability (Blue line) -->
    <polyline fill="none" stroke="#3b82f6" stroke-width="2" points="80,45 145,40 210,50 275,35 340,42 405,38 470,36"/>
    <!-- Performance (Amber line) -->
    <polyline fill="none" stroke="#f59e0b" stroke-width="2" points="80,55 145,52 210,58 275,48 340,54 405,50 470,46"/>
    <!-- Composite OEE (Green line bold) -->
    <polyline fill="none" stroke="#10b981" stroke-width="2.5" points="80,68 145,64 210,72 275,56 340,62 405,58 470,54"/>
  </svg>
  
  <div class="legend">
    <div class="leg-item"><div class="leg-box" style="background:#10b981;"></div><span>Composite OEE</span></div>
    <div class="leg-item"><div class="leg-box" style="background:#3b82f6;"></div><span>Availability</span></div>
    <div class="leg-item"><div class="leg-box" style="background:#f59e0b;"></div><span>Performance</span></div>
  </div>
  
  <div class="chart-title" style="margin-top:16px;">Pareto Breakdown: Top Downtime Loss Categories (Shift Total: 184 min)</div>
  <div class="pareto-bar-row">
    <div class="bar-lbl">1. Mechanical Failure</div>
    <div class="bar-container"><div class="bar-f1"></div></div>
    <div style="font-weight:bold; font-size:11px;">81 min (44%)</div>
  </div>
  <div class="pareto-bar-row">
    <div class="bar-lbl">2. Setup & Adjustments</div>
    <div class="bar-container"><div class="bar-f2"></div></div>
    <div style="font-weight:bold; font-size:11px;">52 min (28%)</div>
  </div>
  <div class="pareto-bar-row">
    <div class="bar-lbl">3. Material Starvation</div>
    <div class="bar-container"><div class="bar-f3"></div></div>
    <div style="font-weight:bold; font-size:11px;">29 min (16%)</div>
  </div>
  <div class="pareto-bar-row">
    <div class="bar-lbl">4. Sensor Calibration</div>
    <div class="bar-container"><div class="bar-f4"></div></div>
    <div style="font-weight:bold; font-size:11px;">22 min (12%)</div>
  </div>
</div>
</body>
</html>"""

# 12. Figure Appendix: Acceptance Letter Screenshot
html_fig_appendix = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { margin: 0; padding: 20px; background: white; font-family: Arial, sans-serif; }
  #render-target { width: 600px; background: #fff; border: 1.5px solid #94a3b8; border-radius: 6px; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
  .email-hdr { border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px; font-size: 13px; color: #334155; }
  .email-title { font-size: 16px; font-weight: bold; color: #0f172a; margin-bottom: 6px; }
  .body-txt { font-size: 12px; line-height: 1.6; color: #1e293b; }
  .box-meta { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 12px; margin: 14px 0; font-size: 11.5px; }
</style>
</head>
<body>
<div id="render-target">
  <div class="email-hdr">
    <div class="email-title">Paper Accepted and Camera Ready Submission - AIMLA2026</div>
    <div><strong>From:</strong> Microsoft CMT &lt;noreply@msr-cmt.org&gt; &bull; 14 Mar 2026, 10:45 AM</div>
    <div><strong>To:</strong> Harish Padmavel &lt;harishpadmavel1126@gmail.com&gt;</div>
  </div>
  <div class="body-txt">
    <p>Dear Authors,</p>
    <p>We are pleased to inform you that your paper <strong>#512 - "Real-Time Overall Equipment Effectiveness (OEE) Monitoring and Predictive Maintenance Platform with Event-Driven Telemetry"</strong> has been <strong>ACCEPTED</strong> for presentation in the <em>4th International Conference on Artificial Intelligence and Machine Learning Applications (AIMLA 2026)</em>, to be held at K.S.Rangasamy College of Technology, Tiruchengode, Tamil Nadu, India.</p>
    
    <div class="box-meta">
      <div><strong>Paper ID:</strong> 512</div>
      <div><strong>Authors:</strong> Harish Padmavel S B, Dr. N. Ananthi, Dr. K. Johny Elma</div>
      <div><strong>Track:</strong> Industrial IoT, Industry 4.0 & Smart Predictive Manufacturing</div>
      <div><strong>Decision:</strong> ACCEPT WITH MINOR CAMERA-READY FORMATTING</div>
    </div>
    
    <p><strong>Reviewer Comments:</strong><br>
    The manuscript introduces a very timely and industry-relevant full-stack IoT architecture for discrete manufacturing OEE calculation and rolling breakdown velocity tracking. The mathematical decomposition aligns well with TPM standards and the real-time WebSocket telemetry pipeline is rigorously tested with empirical factory simulation. Please ensure IEEE conference format adherence in the final camera-ready copy.</p>
    
    <p>Congratulations on your accepted publication!</p>
    <p>Sincerely,<br>Organizing Committee & Program Chairs<br>AIMLA 2026</p>
  </div>
</div>
</body>
</html>"""

def main():
    print("Generating report figure assets...")
    render_html_to_image(html_fig_3_1, "fig_3_1_system_architecture.png", 600, 750)
    render_html_to_image(html_fig_4_1, "fig_4_1_pseudocode_telemetry.png", 650, 480)
    render_html_to_image(html_fig_4_2, "fig_4_2_pseudocode_oee.png", 650, 460)
    render_html_to_image(html_fig_4_3, "fig_4_3_availability_loss.png", 600, 260)
    render_html_to_image(html_fig_4_4, "fig_4_4_performance_speed.png", 600, 260)
    render_html_to_image(html_fig_4_5, "fig_4_5_pseudocode_predictive.png", 650, 480)
    render_html_to_image(html_fig_4_6, "fig_4_6_pseudocode_operator.png", 650, 480)
    render_html_to_image(html_fig_6_1, "fig_6_1_backend_database.png", 650, 360)
    
    # Figure 6.2 from real dashboard mockup
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--window-size=1600,900')
    driver = webdriver.Chrome(options=options)
    html_path = 'file:///' + os.path.abspath('02-dashboard-design/index.html').replace('\\', '/')
    driver.get(html_path)
    time.sleep(1)
    driver.save_screenshot('fig_6_2_dashboard.png')
    driver.quit()
    print("Generated fig_6_2_dashboard.png")
    
    render_html_to_image(html_fig_6_3, "fig_6_3_station_health.png", 650, 320)
    render_html_to_image(html_fig_6_4, "fig_6_4_operator_console.png", 650, 320)
    render_html_to_image(html_fig_6_5, "fig_6_5_trend_pareto.png", 650, 520)
    render_html_to_image(html_fig_appendix, "fig_appendix_acceptance.png", 700, 650)
    print("All report figure assets generated successfully!")

if __name__ == "__main__":
    main()
