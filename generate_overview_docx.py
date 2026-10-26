"""
Script to generate the comprehensive, publication-grade Word document:
'OEE_Project_Overview.docx'
"""

import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

def create_document():
    doc = docx.Document()

    # Page Margins: 1 inch
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        
        # Configure Header & Footer
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("Real-Time OEE Monitoring & Predictive Maintenance Platform | Technical Overview")
        hrun.font.name = "Segoe UI"
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(100, 116, 139) # Slate gray

        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        frun = fp.add_run("Industrial IoT & Smart Manufacturing Platform  •  Architecture & System Overview")
        frun.font.name = "Segoe UI"
        frun.font.size = Pt(8.5)
        frun.font.color.rgb = RGBColor(148, 163, 184)

    # Styling Helper Functions
    def set_cell_background(cell, hex_color):
        tcPr = cell._tc.get_or_add_tcPr()
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}" w:val="clear"/>')
        tcPr.append(shd)

    def set_cell_margins(cell, top=120, bottom=120, left=160, right=160):
        # 1 pt = 20 dxa
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = OxmlElement('w:tcMar')
        for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
            node = OxmlElement(f'w:{m}')
            node.set(qn('w:w'), str(val))
            node.set(qn('w:type'), 'dxa')
            tcMar.append(node)
        tcPr.append(tcMar)

    def set_table_borders(table, color="CBD5E1", sz="4", val="single"):
        tblPr = table._tbl.tblPr
        borders = parse_xml(
            f'<w:tblBorders {nsdecls("w")}>'
            f'  <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'  <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'  <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'  <w:insideV w:val="none"/>'
            f'  <w:left w:val="none"/>'
            f'  <w:right w:val="none"/>'
            f'</w:tblBorders>'
        )
        tblPr.append(borders)

    def add_callout(text, title="KEY ARCHITECTURAL HIGHLIGHT", border_color="1E40AF", bg_color="F0F7FF"):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False
        tbl.columns[0].width = Inches(6.5)
        cell = tbl.cell(0, 0)
        set_cell_background(cell, bg_color)
        set_cell_margins(cell, top=140, bottom=140, left=200, right=180)
        
        tcPr = cell._tc.get_or_add_tcPr()
        borders = parse_xml(
            f'<w:tcBorders {nsdecls("w")}>'
            f'  <w:left w:val="single" w:sz="36" w:color="{border_color}"/>'
            f'  <w:top w:val="none"/>'
            f'  <w:right w:val="none"/>'
            f'  <w:bottom w:val="none"/>'
            f'</w:tcBorders>'
        )
        tcPr.append(borders)
        
        cp = cell.paragraphs[0]
        cp.paragraph_format.space_before = Pt(0)
        cp.paragraph_format.space_after = Pt(3)
        trun1 = cp.add_run(f"[NOTE] {title}\n")
        trun1.bold = True
        trun1.font.name = "Segoe UI"
        trun1.font.size = Pt(10)
        trun1.font.color.rgb = RGBColor(30, 64, 175)
        
        trun2 = cp.add_run(text)
        trun2.font.name = "Segoe UI"
        trun2.font.size = Pt(9.5)
        trun2.font.color.rgb = RGBColor(30, 41, 59)
        
        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    def add_title(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(2)
        run = p.add_run(text)
        run.bold = True
        run.font.name = "Segoe UI"
        run.font.size = Pt(24)
        run.font.color.rgb = RGBColor(15, 23, 42) # Deep Slate/Navy

    def add_subtitle(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(14)
        run = p.add_run(text)
        run.font.name = "Segoe UI"
        run.font.size = Pt(12.5)
        run.font.color.rgb = RGBColor(30, 64, 175) # Accent Blue

    def add_heading1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.name = "Segoe UI"
        run.font.size = Pt(15)
        run.font.color.rgb = RGBColor(15, 23, 42) # Deep Slate

    def add_heading2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.name = "Segoe UI"
        run.font.size = Pt(12)
        run.font.color.rgb = RGBColor(30, 64, 175) # Blue

    def add_heading3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.name = "Segoe UI"
        run.font.size = Pt(10.5)
        run.font.color.rgb = RGBColor(51, 65, 85) # Slate

    def add_body(text, space_after=5):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(text)
        run.font.name = "Segoe UI"
        run.font.size = Pt(10)
        run.font.color.rgb = RGBColor(51, 65, 85)
        return p

    def add_bullet(bold_prefix, text):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        r1 = p.add_run(bold_prefix)
        r1.bold = True
        r1.font.name = "Segoe UI"
        r1.font.size = Pt(10)
        r1.font.color.rgb = RGBColor(15, 23, 42)
        
        r2 = p.add_run(text)
        r2.font.name = "Segoe UI"
        r2.font.size = Pt(10)
        r2.font.color.rgb = RGBColor(51, 65, 85)
        return p

    def create_styled_table(col_widths, headers, data, align_cols=None):
        table = doc.add_table(rows=len(data) + 1, cols=len(headers))
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.autofit = False
        set_table_borders(table)

        # Header Row
        hdr_cells = table.rows[0].cells
        for i, header_text in enumerate(headers):
            cell = hdr_cells[i]
            cell.width = col_widths[i]
            set_cell_background(cell, "1E3A8A") # Deep Navy header
            set_cell_margins(cell, top=140, bottom=140, left=140, right=140)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            if align_cols and align_cols[i] == "center":
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            elif align_cols and align_cols[i] == "right":
                p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            r = p.add_run(header_text)
            r.bold = True
            r.font.name = "Segoe UI"
            r.font.size = Pt(9.5)
            r.font.color.rgb = RGBColor(255, 255, 255)

        # Data Rows
        for r_idx, row_data in enumerate(data):
            row = table.rows[r_idx + 1]
            bg_color = "F8FAFC" if (r_idx % 2 == 1) else "FFFFFF"
            for c_idx, cell_value in enumerate(row_data):
                cell = row.cells[c_idx]
                cell.width = col_widths[c_idx]
                set_cell_background(cell, bg_color)
                set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
                cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
                p = cell.paragraphs[0]
                p.paragraph_format.space_before = Pt(0)
                p.paragraph_format.space_after = Pt(0)
                p.paragraph_format.line_spacing = 1.15
                if align_cols and align_cols[c_idx] == "center":
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                elif align_cols and align_cols[c_idx] == "right":
                    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
                else:
                    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                r = p.add_run(cell_value)
                r.font.name = "Segoe UI"
                r.font.size = Pt(9)
                r.font.color.rgb = RGBColor(30, 41, 59)

        doc.add_paragraph().paragraph_format.space_after = Pt(4)
        return table

    # =========================================================================
    # DOCUMENT CONTENT GENERATION
    # =========================================================================

    # Title & Metadata
    add_title("Real-Time OEE Monitoring & Predictive Maintenance Platform")
    add_subtitle("Comprehensive Technical Specification & Project Overview")

    # Metadata Summary Box
    meta_widths = [Inches(1.8), Inches(4.7)]
    meta_headers = ["Project Attribute", "Specification / Implementation Details"]
    meta_data = [
        ["Platform Name", "Forgepoint Real-Time OEE Monitoring & Predictive Maintenance Platform"],
        ["Target Domain", "Automotive Parts Manufacturing Line (Assembly, CNC, Press, Welding, Painting)"],
        ["Architecture & Tech Stack", "Full-Stack MERN (MongoDB, Express, React 19, Node.js) + Socket.IO + Vite"],
        ["Core Methodologies", "Overall Equipment Effectiveness (OEE), TPM 6 Big Losses, Predictive Velocity Scoring"],
        ["Operational Deployment", "Microservices-ready, Local Edge / Cloud Gateway, 1-Click Orchestration (start.bat)"],
    ]
    create_styled_table(meta_widths, meta_headers, meta_data)

    # Executive Table of Contents
    toc_widths = [Inches(1.0), Inches(3.5), Inches(2.0)]
    toc_headers = ["Section", "Topic / Title", "Core Focus Area"]
    toc_data = [
        ["Section 1", "Executive Summary", "Problem Statement & Strategic Value"],
        ["Section 2", "Mathematical Framework & OEE Core", "TPM Formulas, 6 Big Losses & Case Study"],
        ["Section 3", "System Architecture & Engineering Stack", "Event-Driven WebSockets & Telemetry Pipeline"],
        ["Section 4", "Predictive Maintenance Intelligence", "Rolling Velocity Algorithm & Playbooks"],
        ["Section 5", "Role-Based Access Control (RBAC)", "Personas, Permissions Matrix & Guards"],
        ["Section 6", "End-to-End Functional Modules", "Dashboard, Station Cards, Operator Workstation"],
        ["Section 7", "Database Schemas & Data Model Design", "Mongoose Models, Collections & Relations"],
        ["Section 8", "REST API & WebSockets Catalog", "Endpoints, Payloads & Socket Events"],
        ["Section 9", "Quality Assurance & Verification", "Automated Acceptance Testing (AC 1 – AC 9)"],
        ["Section 10", "Deployment, Setup & Operational Runbook", "One-Click Launcher & Roadmap"],
    ]
    create_styled_table(toc_widths, toc_headers, toc_data, align_cols=["center", "left", "left"])

    # -------------------------------------------------------------------------
    # SECTION 1: EXECUTIVE SUMMARY
    # -------------------------------------------------------------------------
    add_heading1("1. Executive Summary")
    add_body(
        "In modern discrete manufacturing—especially high-precision automotive component fabrication—unplanned "
        "downtime, micro-stoppages, sub-optimal machine running speeds, and quality scrap impose severe financial "
        "penalties. Traditional manufacturing execution systems (MES) often rely on manual, post-shift paper logs "
        "or siloed, batch-processed databases. This latency obscures root causes, delays maintenance response, and "
        "leaves plant leadership blind to emerging degradation patterns until catastrophic failure strikes."
    )
    add_body(
        "The Real-Time OEE Monitoring and Predictive Maintenance Platform solves this fundamental operational gap. "
        "Engineered as an industrial-grade, event-driven web platform, Forgepoint aggregates telemetry from physical "
        "manufacturing stations, decomposes equipment performance into the three foundational pillars of Total "
        "Productive Maintenance (TPM)—Availability, Performance, and Quality—and continuously updates live metrics "
        "over bi-directional WebSockets. By coupling real-time telemetry with a predictive rolling breakdown velocity "
        "engine, the platform transitions maintenance strategy from reactive firefighting to proactive, condition-based "
        "intervention."
    )

    add_callout(
        "The Forgepoint platform bridges the physical shop floor and executive leadership: operators receive a dedicated "
        "touch-friendly workstation console with active downtime timers and handover logs, while supervisors, maintenance "
        "engineers, and plant managers obtain real-time visibility, automated Pareto loss analysis, and condition-based predictive warnings.",
        "EXECUTIVE VALUE PROPOSITION"
    )

    # -------------------------------------------------------------------------
    # SECTION 2: MATHEMATICAL FRAMEWORK & OEE CORE
    # -------------------------------------------------------------------------
    add_heading1("2. Mathematical Framework & OEE Decomposition")
    add_body(
        "Overall Equipment Effectiveness (OEE) is the global gold standard for measuring manufacturing productivity. "
        "The platform implements strict mathematical models derived from the TPM framework established by Seiichi Nakajima, "
        "decomposing machine performance into three percentage factors, calculated as follows:"
    )

    add_heading2("2.1 The Three Core Factors")
    
    add_bullet(
        "1. Availability (A): ",
        "Measures operating time versus planned operating time. Accounts for all unplanned breakdowns, emergency halts, "
        "and scheduled changeovers/setups.\n"
        "Formula: Availability = Run Time / Planned Production Time = (Planned Production Minutes - Total Downtime Minutes) / Planned Production Minutes"
    )
    add_bullet(
        "2. Performance (P): ",
        "Measures speed efficiency while running. Compares actual operating speed against the engineering design limit "
        "(Ideal Cycle Time), accounting for micro-idling and minor slowdowns.\n"
        "Formula: Performance = (Ideal Cycle Time [sec] x Total Units Produced) / (Run Time [min] x 60 sec)"
    )
    add_bullet(
        "3. Quality (Q): ",
        "Measures yield efficiency. Compares defect-free units produced against total parts produced.\n"
        "Formula: Quality = Good Units / (Good Units + Defective Units)"
    )
    add_bullet(
        "Composite OEE Metric: ",
        "OEE = Availability x Performance x Quality (Clamped between 0.00% and 100.00% to safeguard against real-world telemetry anomalies)."
    )

    add_heading2("2.2 Numerical Case Study: Step-by-Step OEE Computation")
    add_body(
        "To illustrate the mathematical behavior of the calculation engine, consider CNC Machine 1 during an 8-hour shift:"
    )

    calc_widths = [Inches(1.8), Inches(1.5), Inches(3.2)]
    calc_headers = ["Parameter / Metric", "Value", "Calculation & Operational Significance"]
    calc_data = [
        ["Planned Production Time", "480 Minutes", "Scheduled 8-hour shift without scheduled plant-wide lunch breaks."],
        ["Unplanned Downtime", "28 Minutes", "Logged chip clearance (7 min) + tool inspection & replacement (21 min)."],
        ["Actual Run Time", "452 Minutes", "480 - 28 = 452 minutes of physical spindle rotation."],
        ["Availability (A)", "94.17%", "452 / 480 = 0.94166 (94.17%). High availability achieved."],
        ["Ideal Cycle Time", "25 Seconds / Part", "Engineering design standard for automotive cylinder housing."],
        ["Total Units Produced", "692 Units", "680 Good non-defective units + 12 defective units."],
        ["Ideal Run Time", "288.33 Minutes", "(25 sec x 692 units) / 60 sec = 288.33 minutes."],
        ["Performance (P)", "63.79%", "288.33 / 452 = 0.6379 (63.79%). Significant speed throttling / micro-stoppages."],
        ["Quality (Q)", "98.27%", "680 Good / 692 Total = 0.98265 (98.27%). High manufacturing quality."],
        ["Composite OEE", "59.03%", "0.9417 x 0.6379 x 0.9827 = 0.5903 (59.03%). Band: LOW (Review required)."],
    ]
    create_styled_table(calc_widths, calc_headers, calc_data)

    add_heading2("2.3 Alignment with the 'Six Big Losses'")
    add_body(
        "The platform structures every downtime ticket and defect count according to the TPM Six Big Losses, "
        "allowing root-cause categorization directly on the factory floor:"
    )

    tpm_widths = [Inches(1.5), Inches(1.2), Inches(1.8), Inches(2.0)]
    tpm_headers = ["TPM Loss Category", "OEE Factor", "Root Cause on Shop Floor", "Platform Mitigation"]
    tpm_data = [
        ["1. Equipment Failure", "Availability", "Spindle bearing seizure, hydraulic pack blowout", "Predictive velocity alerts & live downtime timer"],
        ["2. Setup & Adjustments", "Availability", "Die changeover, tooling realignment, warm-up", "Standardized changeover logging & duration Pareto"],
        ["3. Idling & Minor Stops", "Performance", "Part feed jam, optical sensor misread (<5 min)", "Status toggles, operator touch console logging"],
        ["4. Reduced Speed", "Performance", "Machine wear, operator throttling, material hardness", "Performance factor tracking vs Ideal Cycle Time"],
        ["5. Process Defects", "Quality", "Dimensional scrap, welding porosity, surface paint run", "Mandatory reject quantity and reason input modal"],
        ["6. Startup Scrap", "Quality", "Trial runs, die calibration test pieces", "Shift session scrap tagging & yield analytics"],
    ]
    create_styled_table(tpm_widths, tpm_headers, tpm_data, align_cols=["left", "center", "left", "left"])

    add_heading2("2.4 Industry Benchmark Classification Bands")
    add_body(
        "Every machine and manufacturing line is dynamically classified into internationally recognized manufacturing bands, "
        "driving visual color coding across the UI (Emerald, Slate, Amber, Rose):"
    )

    bench_widths = [Inches(1.4), Inches(1.1), Inches(1.6), Inches(2.4)]
    bench_headers = ["Benchmark Band", "OEE Threshold", "Operational Meaning", "System Action / Visual State"]
    bench_data = [
        ["WORLD_CLASS", "≥ 85.0%", "Global excellence; benchmark discrete line", "Green badge (#10B981), optimal operational state"],
        ["ACCEPTABLE", "60.0% – 84.9%", "Standard operational line; typical industry level", "Blue badge (#3B82F6), normal monitoring"],
        ["LOW", "40.0% – 59.9%", "Significant availability or speed losses", "Amber badge (#F59E0B), supervisory review advised"],
        ["CRITICAL", "< 40.0%", "Unacceptable performance; severe line bottleneck", "Red pulsing badge (#EF4444), immediate maintenance dispatch"],
    ]
    create_styled_table(bench_widths, bench_headers, bench_data, align_cols=["left", "center", "left", "left"])

    # -------------------------------------------------------------------------
    # SECTION 3: SYSTEM ARCHITECTURE & TECHNICAL STACK
    # -------------------------------------------------------------------------
    add_heading1("3. System Architecture & Engineering Stack")
    add_body(
        "The platform adopts a modern Real-Time Event-Driven Architecture (EDA). Rather than relying on periodic client "
        "polling, the server broadcasts state deltas over WebSocket channels whenever machine telemetry changes, an operator "
        "logs downtime, or an anomaly trips. This ensures sub-50ms synchronization across all connected dashboards."
    )

    add_heading2("3.1 Engineering Stack Breakdown")
    tech_widths = [Inches(1.6), Inches(1.8), Inches(3.1)]
    tech_headers = ["Layer", "Technologies Employed", "Role & Engineering Responsibility"]
    tech_data = [
        ["Frontend UI", "React 19, Vite, Vanilla CSS", "Industrial dark-mode control room (#14171A), SVG gauges, responsive operator views"],
        ["Real-Time Transport", "Socket.IO (Client & Server)", "Full-duplex WebSocket connection, event multiplexing, auto-reconnection"],
        ["Application Server", "Node.js, Express.js", "RESTful API routes, JWT authorization middleware, controller business logic"],
        ["Data Persistence", "MongoDB, Mongoose ODM", "Document database, indexed collections, aggregation pipelines for Pareto charts"],
        ["Shop Floor Engine", "Node.js Telemetry Simulator", "Realistic 3-second heartbeat simulator generating discrete production and scrap"],
        ["Testing & Quality", "Node.js Assert, REST Test Suite", "Acceptance suite testing all 9 operator and supervisor workflow criteria"],
    ]
    create_styled_table(tech_widths, tech_headers, tech_data)

    add_heading2("3.2 Real-Time Event-Driven WebSocket Pipeline")
    add_body(
        "The bi-directional WebSocket interface eliminates dashboard stale states through dedicated event channels:"
    )
    add_bullet("oeeUpdate: ", "Broadcasts individual machine OEE, Availability, Performance, Quality, and unit counts after each production tick or status change.")
    add_bullet("lineOeeUpdate: ", "Emits the aggregate arithmetic mean OEE across all active stations in Line-A.")
    add_bullet("machineStatusUpdate: ", "Instantaneously propagates machine state transitions (RUNNING -> IDLE -> DOWN) triggered by touch actions.")
    add_bullet("downtimeStarted / downtimeResolved: ", "Pushes new downtime incident tickets and resolution timestamps to all supervisors and managers.")
    add_bullet("simulatorStateChange: ", "Synchronizes simulator start/stop states across administrative control panels.")

    add_heading2("3.3 Shop Floor Simulation Engine")
    add_body(
        "To enable comprehensive offline demonstration and training without live physical PLC connections, the backend features "
        "an intelligent 3-second Telemetry Simulator engine (telemetrySimulator.js):\n"
        "• Automatic Active Session Collision Avoidance: The engine queries ShiftSession for active operator shifts. "
        "Machines with an active operator session are excluded from automated simulated unit production, preventing double-counting with manual operator entries.\n"
        "• Realistic Manufacturing Jitter: Running unmanned machines produce 1–3 units per tick with an 8% probability of generating defective scrap.\n"
        "• Live Heartbeat Emission: Every tick updates lastHeartbeat timestamps and recalculates Line-A composite OEE."
    )

    # -------------------------------------------------------------------------
    # SECTION 4: PREDICTIVE MAINTENANCE & ANOMALY DETECTION
    # -------------------------------------------------------------------------
    add_heading1("4. Predictive Maintenance Intelligence & Algorithms")
    add_body(
        "A standout capability of Forgepoint is its explainable predictive maintenance engine. Rather than using an "
        "opaque 'black box' machine learning model that shop floor technicians struggle to trust, the system implements "
        "a deterministic, condition-based Rolling 7-Day Breakdown Frequency Velocity Algorithm."
    )

    add_heading2("4.1 Rolling Velocity Algorithm Mechanics")
    add_body(
        "The algorithm queries all historical downtime logs tagged with reason 'BREAKDOWN' for a given machine over "
        "the previous 7 calendar days. It bifurcates this time horizon into two distinct windows:"
    )
    add_bullet("Window 1 (Baseline Period): ", "Historical window from Day -7.0 to Day -3.5 (the initial 84 hours).")
    add_bullet("Window 2 (Recent Period): ", "Recent window from Day -3.5 to Present (the most recent 84 hours).")
    add_body(
        "Velocity Evaluation Formula: Let N1 be the breakdown count in Window 1 and N2 be the breakdown count in Window 2. "
        "A machine is flagged as AT RISK if:\n"
        "Condition: (N2 > N1) AND (N2 >= 2)\n"
        "This mathematically proves that the failure rate is accelerating and that multiple breakdown events have occurred recently, "
        "indicating mechanical or electrical degradation that will culminate in severe failure if left unaddressed."
    )

    add_heading2("4.2 Prescriptive Diagnostic Playbooks")
    add_body(
        "Upon identifying an at-risk machine, the platform generates machine-specific prescriptive maintenance work instructions, "
        "tailored to the equipment's physical operating principles:"
    )

    pred_widths = [Inches(1.6), Inches(1.6), Inches(3.3)]
    pred_headers = ["Station Type", "Monitored Failure Mode", "Prescriptive Maintenance Action"]
    pred_data = [
        ["Welding Station", "Electrode wear, cooling failure", "Inspect wire feed drive rolls, remove nozzle spatter, verify cooling circuit flow."],
        ["Stamping Press", "Hydraulic drop, die misalignment", "Check hydraulic pack operating pressure, inspect cylinder seals, lubricate die guides."],
        ["CNC Machining", "Spindle runout, tool wear", "Execute vibration spectrum analysis, inspect high-speed spindle bearings and drawbar tension."],
        ["Assembly Line", "Conveyor belt slip, pneumatic drop", "Tension transfer drive belts, inspect pneumatic solenoids, verify torque drivers."],
        ["Painting Unit", "Nozzle clogging, air pressure drop", "Purge fluid delivery lines, clean atomizing spray nozzles, replace intake air filters."],
    ]
    create_styled_table(pred_widths, pred_headers, pred_data)

    # -------------------------------------------------------------------------
    # SECTION 5: ROLE-BASED ACCESS CONTROL (RBAC) & PERSONAS
    # -------------------------------------------------------------------------
    add_heading1("5. Role-Based Access Control (RBAC) & Personas")
    add_body(
        "The platform enforces strict enterprise security using JSON Web Tokens (JWT) and multi-layered route middleware. "
        "The system accommodates five operational personas, each granted an interface tailored strictly to their operational remit:"
    )

    rbac_widths = [Inches(1.2), Inches(1.5), Inches(1.8), Inches(2.0)]
    rbac_headers = ["Persona", "Primary Scope", "Granted Permissions", "Key Interface Views"]
    rbac_data = [
        ["Operator", "Single Assigned Machine (e.g., CNC 1)", "Start/End Shift, touch RUN/STOP, log rejects, call assistance, leave handover", "My Machine Console, My Shift, Requests, Handover"],
        ["Supervisor", "Entire Line (Line-A)", "Line overview, acknowledge operator calls, review shifts, approve changeovers", "Full Dashboard, Requests Management, Station Overview"],
        ["Maintenance", "Plant Equipment Health", "Diagnose machine alerts, resolve breakdown tickets, execute work orders", "Predictive Alerts, Downtime Log, Diagnostic Recommendations"],
        ["Plant Manager", "Multi-Shift / Plant Level", "Read-only global analytics, trend reports, benchmark compliance, audit trails", "OEE Reports, Pareto Charts, Historical Trend Comparisons"],
        ["Administrator", "Global System Root", "Full CRUD on users & machines, simulator overrides, system configuration", "User Management, Machine Register, Telemetry Simulator Controls"],
    ]
    create_styled_table(rbac_widths, rbac_headers, rbac_data)

    add_heading2("5.1 Security Guard Middleware Implementation")
    add_body(
        "API security is guaranteed through modular Express middleware functions located in auth.js:\n"
        "• requireAuth: Decodes and validates the Bearer JWT token, injecting req.user.\n"
        "• requireRole(...roles): Restricts critical routes to specific roles (e.g. only ADMIN can modify machines).\n"
        "• requireAssignedMachine: Validates that an OPERATOR can only view or control machines explicitly listed in their assignedMachines array. Any attempt to modify another station returns a 403 Forbidden."
    )

    # -------------------------------------------------------------------------
    # SECTION 6: FUNCTIONAL MODULES & USER INTERFACE
    # -------------------------------------------------------------------------
    add_heading1("6. End-to-End Functional Modules")
    add_body(
        "The user experience is built around an industrial dark mode theme (#14171A), high-contrast safety accents, "
        "and touch-first interfaces designed for shop-floor tablet and PC terminals:"
    )

    add_heading2("6.1 Executive Control Room Dashboard")
    add_body(
        "The central dashboard delivers immediate situational awareness:\n"
        "• Line-Wide OEE Indicator: Prominent semi-circular SVG gauge displaying the aggregate performance of Line-A.\n"
        "• Animated Conveyor Visualizer: Graphic conveyor line depicting sequential stations (CNC -> Press -> Welding -> Assembly -> Painting) with pulsing status rings.\n"
        "• 5 Live Station Cards: Each card displays station name, live status badge, Availability, Performance, Quality, OEE %, and quick action shortcuts.\n"
        "• Active Downtime Ticker & Predictive Alerts Badge: Real-time counter of unresolved stoppages and at-risk stations."
    )

    add_heading2("6.2 Operator Workstation Console (My Machine)")
    add_body(
        "Dedicated to the machine operator, this module replaces traditional paper travel sheets:\n"
        "• Touch Machine Controls: Large, finger-friendly buttons to toggle machine status (START / RUNNING, IDLE, STOP / DOWN).\n"
        "• Live Downtime Timer Banner: When a machine enters DOWN status, an active red banner displays elapsed time (MM:SS) with a one-click 'Back Up / Running' recovery button.\n"
        "• Production & Scrap Entry Form: Allows the operator to submit completed part batches, recording good count, rejected count, and specific defect reasons (e.g., Tool Mark, Porosity, Dimension Burr).\n"
        "• Assistance Call Panel: One-click emergency call buttons for Maintenance Technician or Line Supervisor with priority flagging (Low, Medium, High).\n"
        "• Shift Lifecycle Management: Start Shift, shift target tracking, Shift Summary Modal displaying final OEE score, and Handover Notes creation for the incoming operator."
    )

    add_heading2("6.3 Downtime Log & Pareto Loss Analysis")
    add_body(
        "Comprehensive tracking of all line stoppages:\n"
        "• Interactive Downtime Logging: Operators and supervisors log incidents with pre-defined categories (Breakdown, Setup/Changeover, Tooling, Material Shortage, Minor Stoppage).\n"
        "• Pareto 80/20 Loss Distribution: Visual bar chart breaking down lost minutes by reason category, allowing engineers to identify the 'vital few' causes responsible for 80% of lost production time.\n"
        "• Incident Resolution Workflow: Captures exact downtime duration in minutes and logs resolving technician ID."
    )

    add_heading2("6.4 OEE Reports & 7-Day Trend Analytics")
    add_body(
        "Historical reporting for plant managers and industrial engineers:\n"
        "• Multi-Factor Trend Line: 7-day historical chart with interactive toggles to view OEE, Availability, Performance, and Quality trends simultaneously.\n"
        "• Day-by-Day Station Breakdown: Granular table displaying scheduled run time, actual run time, total parts, scrap rate, and final OEE.\n"
        "• TPM Compliance Matrix: Compares current shift performance against the 85% World Class target."
    )

    # -------------------------------------------------------------------------
    # SECTION 7: DATABASE SCHEMA & DATA MODEL DESIGN
    # -------------------------------------------------------------------------
    add_heading1("7. Database Architecture & Data Models")
    add_body(
        "The platform utilizes MongoDB with Mongoose ODM. Schemas are strictly typed and indexed for high-frequency writes:"
    )

    schema_widths = [Inches(1.5), Inches(1.8), Inches(3.2)]
    schema_headers = ["Mongoose Model", "Key Fields & Types", "Business Purpose & Relationships"]
    schema_data = [
        ["Machine", "name, type, lineId, idealCycleTimeSeconds, status, currentShift (good, defective, downtime)", "Core asset record; stores live shift accumulator and heartbeat timestamp."],
        ["DowntimeLog", "machine (Ref), reason (Enum), notes, startTime, endTime, durationMinutes, loggedBy (Ref)", "Discrete downtime records; powers Pareto aggregation and predictive velocity."],
        ["ProductionLog", "machine (Ref), shiftSession (Ref), goodUnits, defectiveUnits, defectReason, operator (Ref)", "Log of manual batch completions; feeds Quality and Performance calculations."],
        ["ShiftSession", "operator (Ref), machine (Ref), shiftName, startTime, endTime, targetUnits, summary (Map)", "Represents one operator shift; captures complete end-of-shift OEE snapshot."],
        ["MaintenanceRequest", "machine (Ref), raisedBy (Ref), target (Enum), priority, description, status, resolvedBy", "Operator assistance call ticket; workflow states OPEN -> ACKNOWLEDGED -> RESOLVED."],
        ["HandoverNote", "machine (Ref), author (Ref), text, shiftSession (Ref)", "Free-text shift-to-shift communication passed to incoming operators at shift start."],
        ["User", "name, email, password (hashed), role (Enum), assignedLineId, assignedMachines [Ref]", "Authentication & RBAC entity; controls access boundaries and machine scopes."],
    ]
    create_styled_table(schema_widths, schema_headers, schema_data)

    # -------------------------------------------------------------------------
    # SECTION 8: REST API SPECIFICATION
    # -------------------------------------------------------------------------
    add_heading1("8. REST API Endpoint Catalog")
    add_body(
        "The backend exposes clean, RESTful JSON interfaces protected by JWT authentication:"
    )

    api_widths = [Inches(0.8), Inches(2.2), Inches(1.3), Inches(2.2)]
    api_headers = ["Method", "Endpoint Path", "Access Role", "Functional Description"]
    api_data = [
        ["POST", "/api/auth/login", "Public", "Authenticates user credentials, returns JWT token & role."],
        ["GET", "/api/machines", "All Authenticated", "Returns list of all registered physical machines."],
        ["PATCH", "/api/machines/:id/status", "Operator / Admin", "Updates machine status (RUNNING, IDLE, DOWN)."],
        ["GET", "/api/oee", "All Authenticated", "Calculates and returns live OEE metrics for all machines."],
        ["GET", "/api/oee/predictive-alerts", "All Authenticated", "Runs rolling velocity model and returns at-risk machines."],
        ["GET", "/api/oee/trends/7day", "All Authenticated", "Aggregates 7-day historical OEE, A, P, Q metrics."],
        ["POST", "/api/downtime", "Operator / Super", "Logs new downtime event, sets machine status to DOWN."],
        ["PATCH", "/api/downtime/:id/resolve", "Operator / Maint", "Resolves open downtime, records duration, sets RUNNING."],
        ["POST", "/api/shifts/start", "Operator", "Starts a new shift session for operator on assigned machine."],
        ["POST", "/api/shifts/end", "Operator", "Ends active shift session, computes final OEE snapshot."],
        ["POST", "/api/maintenance-requests", "Operator", "Raises emergency assistance call to Maintenance or Supervisor."],
        ["PATCH", "/api/maintenance-requests/:id/resolve", "Maint / Super", "Marks assistance call as resolved with technician notes."],
    ]
    create_styled_table(api_widths, api_headers, api_data, align_cols=["center", "left", "center", "left"])

    # -------------------------------------------------------------------------
    # SECTION 9: QUALITY ASSURANCE & ACCEPTANCE VERIFICATION
    # -------------------------------------------------------------------------
    add_heading1("9. Quality Assurance & Automated Test Suite")
    add_body(
        "To ensure uncompromising reliability in an industrial manufacturing setting, the platform includes an automated "
        "verification suite (test_operator_module.js) covering nine core acceptance criteria:"
    )

    qa_widths = [Inches(1.2), Inches(2.3), Inches(3.0)]
    qa_headers = ["Criteria ID", "Acceptance Requirement", "Verification Methodology & Result"]
    qa_data = [
        ["AC 1", "Machine Authorization Guard", "Simulated unassigned machine access returns 403 Forbidden; assigned access passes."],
        ["AC 2", "Single Active Shift Rule", "Prevents duplicate active shifts for same operator; enforces clean lifecycle."],
        ["AC 3", "Machine Status Transitions", "Touch transitions RUNNING -> IDLE -> DOWN emit correct real-time WebSocket payloads."],
        ["AC 4", "Production Batch Entry", "Submitting good and rejected counts accurately updates machine counters and Quality %."],
        ["AC 5", "Live Downtime Timer & Recovery", "Logging downtime starts active timer; resolving marks status RUNNING and records duration."],
        ["AC 6", "Assistance Call Triage", "Raising maintenance/supervisor call creates ticket; resolves with technician attribution."],
        ["AC 7", "Handover Notes Lifecycle", "Saving handover note at shift end correctly surfaces note to next incoming operator."],
        ["AC 8", "End-Shift Summary Calculation", "Terminating shift computes frozen summary snapshot of Good, Defect, Downtime, and OEE."],
        ["AC 9", "Audit Logging & Activity Feed", "Every operator action is captured chronologically in user activity feed."],
    ]
    create_styled_table(qa_widths, qa_headers, qa_data, align_cols=["center", "left", "left"])

    # -------------------------------------------------------------------------
    # SECTION 10: DEPLOYMENT & OPERATIONAL GUIDE
    # -------------------------------------------------------------------------
    add_heading1("10. Deployment, Setup & Operational Runbook")
    add_body(
        "The platform is packaged for zero-friction launch in industrial development and pilot plant environments."
    )

    add_heading2("10.1 One-Click Launch (start.bat)")
    add_body(
        "A single batch script in the repository root automates end-to-end execution:\n"
        "1. Checks for local MongoDB service (starts mongod if not active).\n"
        "2. Starts the Node.js Express + Socket.IO Backend on http://localhost:5001.\n"
        "3. Starts the React 19 + Vite Frontend on http://localhost:5173.\n"
        "4. Automatically launches the default web browser to the Forgepoint Control Room."
    )

    add_heading2("10.2 Pre-Configured Demo Credentials")
    user_widths = [Inches(1.4), Inches(1.8), Inches(1.2), Inches(2.1)]
    user_headers = ["Persona Role", "Login Email", "Password", "Default Assigned Machine"]
    user_data = [
        ["Shop Operator 1", "operator@oee.local", "oper123", "CNC Machine 1 (Line-A)"],
        ["Shop Operator 2", "operator2@oee.local", "oper123", "Stamping Press 1 (Line-A)"],
        ["Line Supervisor", "supervisor@oee.local", "super123", "All Line-A Stations"],
        ["Maintenance Tech", "maintenance@oee.local", "maint123", "Plant-wide Diagnostic Access"],
        ["Plant Manager", "manager@oee.local", "manager123", "Plant-wide Reporting Access"],
    ]
    create_styled_table(user_widths, user_headers, user_data, align_cols=["left", "left", "center", "left"])

    add_heading2("10.3 Future Architecture Roadmap")
    add_bullet("1. Industrial Edge Gateways: ", "Direct OPC-UA and MQTT protocol connectors to integrate directly with Siemens S7, Allen-Bradley ControlLogix, and Beckhoff PLCs.")
    add_bullet("2. Machine Learning RUL Estimation: ", "Remaining Useful Life (RUL) Weibull analysis models predicting MTBF hours based on vibration and thermal telemetry.")
    add_bullet("3. Multi-Plant Cloud Aggregation: ", "Multi-tenant cloud federation allowing enterprise executives to benchmark OEE across geographically distributed facilities.")

    # Save document
    filename = "OEE_Project_Overview.docx"
    doc.save(filename)
    print(f"SUCCESS: Generated {filename}")

if __name__ == "__main__":
    create_document()
