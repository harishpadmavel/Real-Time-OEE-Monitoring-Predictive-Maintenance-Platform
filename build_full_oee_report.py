"""
Builder script to generate the complete 70-page project report document:
'Real-Time_OEE_Monitoring_and_Predictive_Maintenance_Platform_Report.docx'
Strictly matching the formatting, headings, alignment, fonts, and page numbers of the reference report.
"""

import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

def create_full_report():
    doc = docx.Document()
    
    # Page Margins: Left=1.25 in (for academic thesis binding), Right=1.0 in, Top=1.0 in, Bottom=1.0 in
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.25)
        section.right_margin = Inches(1.0)

    # Base styling helper
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(12)
    normal_style.font.color.rgb = RGBColor(0, 0, 0)
    
    # Helpers for paragraph creation
    def p_body(text, space_after=4, indent=0.4, line_spacing=1.35):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = line_spacing
        if indent > 0:
            p.paragraph_format.first_line_indent = Inches(indent)
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(12)
        return p

    def p_h1(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(12)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(14)
        run.bold = True
        return p

    def p_h2(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(14)
        run.bold = True
        return p

    def p_h3(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(14)
        run.bold = True
        return p

    def add_fig(img_path, caption, width=Inches(5.0)):
        if os.path.exists(img_path):
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(6)
            p.paragraph_format.space_after = Pt(2)
            run = p.add_run()
            run.add_picture(img_path, width=width)
        
        cp = doc.add_paragraph()
        cp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        cp.paragraph_format.space_before = Pt(2)
        cp.paragraph_format.space_after = Pt(8)
        crun = cp.add_run(caption)
        crun.font.name = 'Times New Roman'
        crun.font.size = Pt(12)
        crun.bold = True

    def add_page_number_to_paragraph(p):
        fldSimple = parse_xml(
            f'<w:fldSimple {nsdecls("w")} w:instr="PAGE">'
            f'  <w:r>'
            f'    <w:rPr>'
            f'      <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>'
            f'      <w:sz w:val="24"/>'
            f'      <w:szCs w:val="24"/>'
            f'    </w:rPr>'
            f'  </w:r>'
            f'</w:fldSimple>'
        )
        p._p.append(fldSimple)

    def add_table_grid(table, borders_val="single", border_color="000000", border_sz="4"):
        tblPr = table._tbl.tblPr
        borders = parse_xml(
            f'<w:tblBorders {nsdecls("w")}>'
            f'  <w:top w:val="{borders_val}" w:sz="{border_sz}" w:space="0" w:color="{border_color}"/>'
            f'  <w:bottom w:val="{borders_val}" w:sz="{border_sz}" w:space="0" w:color="{border_color}"/>'
            f'  <w:insideH w:val="{borders_val}" w:sz="{border_sz}" w:space="0" w:color="{border_color}"/>'
            f'  <w:insideV w:val="{borders_val}" w:sz="{border_sz}" w:space="0" w:color="{border_color}"/>'
            f'  <w:left w:val="{borders_val}" w:sz="{border_sz}" w:space="0" w:color="{border_color}"/>'
            f'  <w:right w:val="{borders_val}" w:sz="{border_sz}" w:space="0" w:color="{border_color}"/>'
            f'</w:tblBorders>'
        )
        tblPr.append(borders)

    def set_cell_margins(cell, top=80, bottom=80, left=100, right=100):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = OxmlElement('w:tcMar')
        for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
            node = OxmlElement(f'w:{m}')
            node.set(qn('w:w'), str(val))
            node.set(qn('w:type'), 'dxa')
            tcMar.append(node)
        tcPr.append(tcMar)

    # -------------------------------------------------------------
    # SECTION 1: FRONT MATTER (Pages i to x)
    # -------------------------------------------------------------
    section1 = doc.sections[0]
    section1.different_first_page_header_footer = True
    sectPr1 = section1._sectPr
    pgNumType1 = OxmlElement('w:pgNumType')
    pgNumType1.set(qn('w:fmt'), 'lowerRoman')
    sectPr1.append(pgNumType1)

    footer1 = section1.footer
    p_f1 = footer1.paragraphs[0]
    p_f1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    add_page_number_to_paragraph(p_f1)

    # --- Page 1 (Cover Page / Title Page) ---
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(36)
    p.paragraph_format.space_after = Pt(28)
    r = p.add_run("Real-Time Overall Equipment Effectiveness (OEE) Monitoring and Predictive Maintenance Platform")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(14)
    r.bold = True

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(16)
    r = p.add_run("A PROJECT REPORT")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(14)
    r.bold = True

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(4)
    r = p.add_run("Submitted by")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(12)
    r.italic = True

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(24)
    r = p.add_run("HARISH PADMAVEL S B\n(310624205081)")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(14)
    r.bold = True

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(4)
    r = p.add_run("in partial fulfillment for the award of the degree\nof")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(12)
    r.italic = True

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(4)
    r = p.add_run("BACHELOR OF TECHNOLOGY\nin\nINFORMATION TECHNOLOGY")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(14)
    r.bold = True

    if os.path.exists("college_logo.png"):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(14)
        r = p.add_run()
        r.add_picture("college_logo.png", width=Inches(1.2))

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(4)
    r = p.add_run("EASWARI ENGINEERING COLLEGE\n(AN AUTONOMOUS INSTITUTION) – AFFILIATED TO ANNA UNIVERSITY, CHENNAI")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(14)
    r.bold = True

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(16)
    p.paragraph_format.space_after = Pt(0)
    r = p.add_run("MARCH 2026")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(14)
    r.bold = True

    doc.add_page_break()

    # --- Page 2: Bonafide Certificate (ii) ---
    if os.path.exists("college_logo.png"):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(6)
        r = p.add_run()
        r.add_picture("college_logo.png", width=Inches(0.85))

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(18)
    r = p.add_run("EASWARI ENGINEERING COLLEGE")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(14)
    r.bold = True

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(24)
    r = p.add_run("BONAFIDE CERTIFICATE")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(14)
    r.bold = True

    p_body(
        "Certified that this project work entitled “Real-Time Overall Equipment Effectiveness (OEE) Monitoring and Predictive Maintenance Platform” is the bonafide work of HARISH PADMAVEL S B (310624205081) who carried out the project under my supervision.",
        space_after=48, indent=0.0, line_spacing=1.5
    )

    tbl = doc.add_table(rows=5, cols=2)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.columns[0].width = Inches(3.2)
    tbl.columns[1].width = Inches(3.2)
    tblPr = tbl._tbl.tblPr
    borders = parse_xml(f'<w:tblBorders {nsdecls("w")}><w:top w:val="none"/><w:bottom w:val="none"/><w:left w:val="none"/><w:right w:val="none"/><w:insideH w:val="none"/><w:insideV w:val="none"/></w:tblBorders>')
    tblPr.append(borders)

    sigs = [
        ("SIGNATURE", "SIGNATURE"),
        ("Dr. N. ANANTHI, M.E., Ph.D.,", "Dr. K. JOHNY ELMA, M.Tech., Ph.D.,"),
        ("HEAD OF THE DEPARTMENT", "SUPERVISOR"),
        ("Information Technology,", "ASSISTANT PROFESSOR"),
        ("Easwari Engineering College,\nRamapuram, Chennai-600089.", "Information Technology,\nEaswari Engineering College,\nRamapuram, Chennai-600089.")
    ]
    for r_i, (c0, c1) in enumerate(sigs):
        cell0, cell1 = tbl.cell(r_i, 0), tbl.cell(r_i, 1)
        p0, p1 = cell0.paragraphs[0], cell1.paragraphs[0]
        p0.paragraph_format.space_before = Pt(2)
        p0.paragraph_format.space_after = Pt(2)
        p1.paragraph_format.space_before = Pt(2)
        p1.paragraph_format.space_after = Pt(2)
        r0 = p0.add_run(c0)
        r1 = p1.add_run(c1)
        r0.font.name = 'Times New Roman'
        r1.font.name = 'Times New Roman'
        r0.font.size = Pt(12)
        r1.font.size = Pt(12)
        if r_i in (0, 1, 2):
            r0.bold = True
            r1.bold = True

    doc.add_page_break()

    # --- Page 3: Certificate of Viva-voce-Examination (iii) ---
    if os.path.exists("college_logo.png"):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(6)
        r = p.add_run()
        r.add_picture("college_logo.png", width=Inches(0.85))

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(18)
    r = p.add_run("EASWARI ENGINEERING COLLEGE")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(14)
    r.bold = True

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(24)
    r = p.add_run("Certificate of Viva-voce-Examination")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(14)
    r.bold = True

    p_body(
        "This is to certify that the Viva Voce Examination of the Project Work entitled “Real-Time Overall Equipment Effectiveness (OEE) Monitoring and Predictive Maintenance Platform” submitted by HARISH PADMAVEL S B (310624205081) in partial fulfillment of the requirements for the award of the degree of Bachelor of Technology was conducted on ____________________ in the Department of Information Technology, Easwari Engineering College, Ramapuram Chennai.",
        space_after=48, indent=0.0, line_spacing=1.5
    )

    tbl = doc.add_table(rows=5, cols=2)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.columns[0].width = Inches(3.2)
    tbl.columns[1].width = Inches(3.2)
    tblPr = tbl._tbl.tblPr
    borders = parse_xml(f'<w:tblBorders {nsdecls("w")}><w:top w:val="none"/><w:bottom w:val="none"/><w:left w:val="none"/><w:right w:val="none"/><w:insideH w:val="none"/><w:insideV w:val="none"/></w:tblBorders>')
    tblPr.append(borders)

    viva_sigs = [
        ("INTERNAL EXAMINER", "EXTERNAL EXAMINER"),
        ("NAME:", "NAME:"),
        ("Designation:", "Designation:"),
        ("Address:", "Address:"),
        ("Date:", "")
    ]
    for r_i, (c0, c1) in enumerate(viva_sigs):
        cell0, cell1 = tbl.cell(r_i, 0), tbl.cell(r_i, 1)
        p0, p1 = cell0.paragraphs[0], cell1.paragraphs[0]
        p0.paragraph_format.space_before = Pt(2)
        p0.paragraph_format.space_after = Pt(2)
        p1.paragraph_format.space_before = Pt(2)
        p1.paragraph_format.space_after = Pt(2)
        r0 = p0.add_run(c0)
        r1 = p1.add_run(c1)
        r0.font.name = 'Times New Roman'
        r1.font.name = 'Times New Roman'
        r0.font.size = Pt(12)
        r1.font.size = Pt(12)
        if r_i == 0:
            r0.bold = True
            r1.bold = True

    doc.add_page_break()

    # --- Page 4: ABSTRACT (iv) ---
    p_h1("ABSTRACT")
    p_body(
        "Today, modern manufacturing industries depend heavily on continuous equipment health and optimal cycle performance to sustain profitability, but traditional shop-floor logging systems often rely on retrospective manual entries and fragmented databases. This project proposes an intelligent, industrial-grade Real-Time Overall Equipment Effectiveness (OEE) Monitoring and Predictive Maintenance Platform that continuously evaluates machine performance across discrete automotive manufacturing lines. Machine sensor telemetry and operational states are streamed in real time using Node.js, Express, Socket.IO, and MongoDB, while high-frequency noise and communication anomalies are sanitized through automated validation filters. Verified sensor records are processed by an advanced mathematical calculation engine implementing Seiichi Nakajima’s Total Productive Maintenance (TPM) formulation, decomposing performance into three core pillars: Availability, Performance, and Quality. Speed losses and micro-stoppages are detected by comparing actual cycle times with engineering nameplate ratings, while scrap and rework are tracked through digitized defect logging. Predictive maintenance intelligence is delivered through a rolling 7-day failure velocity model, which tracks breakdown frequency acceleration and generates prescriptive diagnostic playbooks before catastrophic failures halt production. Factory operations are coordinated through a responsive, role-based web interface built with React, providing real-time Pareto downtime analysis, interactive touch consoles for operators, and automated alerts for supervisors and plant executives. Combining real-time telemetry streaming, rigorous OEE decomposition, rolling breakdown velocity forecasting, and actionable prescriptive maintenance playbooks differentiates this system from conventional, static manufacturing execution systems.",
        space_after=12, indent=0.5, line_spacing=1.45
    )

    doc.add_page_break()

    # --- Helper for Table of Contents Tables ---
    def make_aligned_toc_table(entries):
        tbl = doc.add_table(rows=len(entries), cols=3)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.columns[0].width = Inches(1.2)
        tbl.columns[1].width = Inches(4.3)
        tbl.columns[2].width = Inches(0.9)
        tblPr = tbl._tbl.tblPr
        borders = parse_xml(f'<w:tblBorders {nsdecls("w")}><w:top w:val="none"/><w:bottom w:val="none"/><w:left w:val="none"/><w:right w:val="none"/><w:insideH w:val="none"/><w:insideV w:val="none"/></w:tblBorders>')
        tblPr.append(borders)
        for r_i, (c0, c1, c2) in enumerate(entries):
            cell0, cell1, cell2 = tbl.cell(r_i, 0), tbl.cell(r_i, 1), tbl.cell(r_i, 2)
            set_cell_margins(cell0, top=15, bottom=15, left=30, right=30)
            set_cell_margins(cell1, top=15, bottom=15, left=30, right=30)
            set_cell_margins(cell2, top=15, bottom=15, left=30, right=30)
            p0, p1, p2 = cell0.paragraphs[0], cell1.paragraphs[0], cell2.paragraphs[0]
            p0.paragraph_format.space_before = Pt(0.5)
            p0.paragraph_format.space_after = Pt(0.5)
            p1.paragraph_format.space_before = Pt(0.5)
            p1.paragraph_format.space_after = Pt(0.5)
            p2.paragraph_format.space_before = Pt(0.5)
            p2.paragraph_format.space_after = Pt(0.5)
            p0.paragraph_format.line_spacing = 1.12
            p1.paragraph_format.line_spacing = 1.12
            p2.paragraph_format.line_spacing = 1.12
            p2.alignment = WD_ALIGN_PARAGRAPH.RIGHT

            r0 = p0.add_run(c0)
            r1 = p1.add_run(c1)
            r2 = p2.add_run(c2)
            for r in (r0, r1, r2):
                r.font.name = 'Times New Roman'
                r.font.size = Pt(12)

            if r_i == 0 and c0 in ("CHAPTER NO.", "TABLE NO.", "FIGURE NO.", "Abbreviations"):
                r0.bold = True
                r1.bold = True
                r2.bold = True
            elif c0.isdigit() or (c0 == "" and c1 in ("ABSTRACT", "ACKNOWLEDGEMENT", "LIST OF TABLES", "LIST OF FIGURES", "LIST OF ABBREVIATIONS", "APPENDIX", "REFERENCES")):
                r0.bold = True
                r1.bold = True
                r2.bold = True

    # --- Page 5: ACKNOWLEDGEMENT (v) ---
    p_h1("ACKNOWLEDGEMENT")
    p_body(
        "We express our sincere gratitude to the Principal Dr. P. Deiva Sundari, M.E., Ph.D., and the Management of our college for providing us with the opportunity to carry out this project work.",
        space_after=24, indent=0.0, line_spacing=1.45
    )
    p_body(
        "We convey our heartfelt thanks to the Head of the Department, Dr. N. Ananthi, M.E., Ph.D., Department of Information Technology, for the continuous encouragement and support.",
        space_after=24, indent=0.0, line_spacing=1.45
    )
    p_body(
        "We are extremely thankful to our Project Guide, Dr. K. Johny Elma, M.Tech., Ph.D., Assistant Professor, Department of Information Technology, for valuable guidance, suggestions and motivation throughout the completion of this project.",
        space_after=24, indent=0.0, line_spacing=1.45
    )
    p_body(
        "We would also like to extend our gratitude to all the faculty members of the Department of Information Technology for their support.",
        space_after=24, indent=0.0, line_spacing=1.45
    )
    p_body(
        "Finally, we thank our parents and friends for their constant encouragement and help during the course of this project.",
        space_after=0, indent=0.0, line_spacing=1.45
    )
    doc.add_page_break()

    # --- Page 6: TABLE OF CONTENTS (vi) ---
    p_h1("TABLE OF CONTENTS")
    toc_p6 = [
        ("CHAPTER NO.", "TITLE", "PAGE NO."),
        ("", "ABSTRACT", "iv"),
        ("", "ACKNOWLEDGEMENT", "v"),
        ("", "LIST OF TABLES", "viii"),
        ("", "LIST OF FIGURES", "ix"),
        ("", "LIST OF ABBREVIATIONS", "x"),
        ("1", "INTRODUCTION", "1"),
        ("", "1.1  MOTIVATION", "1"),
        ("", "1.2  OBJECTIVE", "1"),
        ("", "1.3  PROBLEM DESCRIPTION", "2"),
        ("", "1.4  EXISTING SYSTEM", "3"),
        ("", "1.5  PROPOSED SYSTEM", "3"),
        ("", "     1.5.1  IoT Telemetry Acquisition and Ingestion", "3"),
        ("", "     1.5.2  Real-Time OEE Computation Engine", "3"),
        ("", "     1.5.3  Predictive Breakdown Velocity Modeling", "3"),
        ("", "     1.5.4  Pareto Loss and Root-Cause Categorization", "4"),
        ("", "     1.5.5  Prescriptive Maintenance Playbooks", "4"),
        ("", "1.6  SUMMARY", "4"),
        ("2", "RELATED WORK", "5"),
        ("", "2.1  INTRODUCTION", "5"),
        ("", "2.2  RELATED WORKS", "6"),
        ("", "2.3  OBSERVATION FROM RELATED WORKS", "10"),
        ("", "2.4  SUMMARY", "12"),
        ("3", "PROPOSED SYSTEM DESIGN", "13"),
        ("", "3.1  INTRODUCTION", "13"),
        ("", "3.2  SYSTEM ARCHITECTURE", "14"),
        ("", "3.3  LIST OF MODULES", "19"),
        ("", "3.4  SOFTWARE SPECIFICATIONS", "20"),
        ("", "3.5  TOOLS USED", "21"),
        ("", "3.6  SUMMARY", "21")
    ]
    make_aligned_toc_table(toc_p6)
    doc.add_page_break()

    # --- Page 7: TABLE OF CONTENTS (vii) ---
    toc_p7 = [
        ("CHAPTER NO.", "TITLE", "PAGE NO."),
        ("4", "METHODOLOGY", "22"),
        ("", "4.1  INTRODUCTION", "22"),
        ("", "     4.1.1  Telemetry Acquisition and Preprocessing", "23"),
        ("", "     4.1.2  Real-Time OEE Computation and Factor Decomposition", "27"),
        ("", "     4.1.3  Predictive Anomaly Detection and Velocity Scoring", "33"),
        ("", "     4.1.4  Shop-Floor Operator Workflow and Downtime Resolution", "37"),
        ("", "4.2  SUMMARY", "41"),
        ("5", "TESTING", "42"),
        ("", "5.1  INTRODUCTION", "42"),
        ("", "5.2  TESTING STRATEGIES", "42"),
        ("", "     5.2.1  Unit Testing", "43"),
        ("", "     5.2.2  Integration Testing", "43"),
        ("", "     5.2.3  System Testing", "43"),
        ("", "     5.2.4  Performance Testing", "43"),
        ("", "5.3  SUMMARY", "46"),
        ("6", "RESULTS AND DISCUSSION", "47"),
        ("", "6.1  INTRODUCTION", "47"),
        ("", "6.2  OUTPUT", "47"),
        ("", "6.3  SUMMARY", "52"),
        ("7", "CONCLUSION", "53"),
        ("", "7.1  INTRODUCTION", "53"),
        ("", "7.2  CONCLUSION", "53"),
        ("", "7.3  FUTURE WORK", "54"),
        ("", "7.4  SUMMARY", "55"),
        ("", "APPENDIX", "56"),
        ("", "REFERENCES", "58")
    ]
    make_aligned_toc_table(toc_p7)
    doc.add_page_break()

    # --- Page 8: LIST OF TABLES (viii) ---
    p_h1("LIST OF TABLES")
    lot_entries = [
        ("TABLE NO.", "TITLE", "PAGE NO."),
        ("5.1", "Test Cases", "44")
    ]
    make_aligned_toc_table(lot_entries)
    doc.add_page_break()

    # --- Page 9: LIST OF FIGURES (ix) ---
    p_h1("LIST OF FIGURES")
    lof_entries = [
        ("FIGURE NO.", "TITLE", "PAGE NO."),
        ("3.1", "System Architecture", "14"),
        ("4.1", "Pseudocode for Telemetry Acquisition and Preprocessing", "24"),
        ("4.2", "Pseudocode for Real-Time OEE Computation", "29"),
        ("4.3", "Availability Factor Decomposition and Six Big Losses", "31"),
        ("4.4", "Performance Speed Loss and Ideal Cycle Time Mechanics", "32"),
        ("4.5", "Pseudocode for Predictive Anomaly Detection and Velocity Scoring", "34"),
        ("4.6", "Pseudocode for Downtime Resolution and Shift Handover Management", "38"),
        ("6.1", "MongoDB Database Collections and Telemetry Data Stream", "48"),
        ("6.2", "Real-Time Executive Control Room Dashboard Interface", "48"),
        ("6.3", "Station Health Diagnostics and Micro-Idling Monitor", "49"),
        ("6.4", "Operator Workstation Touch Console (My Machine)", "50"),
        ("6.5", "7-Day OEE Trend Analytics and Pareto Loss Distribution Breakdown", "50")
    ]
    make_aligned_toc_table(lof_entries)
    doc.add_page_break()

    # --- Page 10: LIST OF ABBREVIATIONS (x) ---
    p_h1("LIST OF ABBREVIATIONS")
    abbr_entries = [
        ("Abbreviations", "Full Form", ""),
        ("AI", "Artificial Intelligence", ""),
        ("API", "Application Programming Interface", ""),
        ("CNC", "Computer Numerical Control", ""),
        ("EDA", "Event-Driven Architecture", ""),
        ("ERP", "Enterprise Resource Planning", ""),
        ("IoT", "Internet of Things", ""),
        ("JSON", "JavaScript Object Notation", ""),
        ("JWT", "JSON Web Token", ""),
        ("MES", "Manufacturing Execution System", ""),
        ("MTBF", "Mean Time Between Failures", ""),
        ("MTTR", "Mean Time To Repair", ""),
        ("OEE", "Overall Equipment Effectiveness", ""),
        ("PLC", "Programmable Logic Controller", ""),
        ("RBAC", "Role-Based Access Control", ""),
        ("REST", "Representational State Transfer", ""),
        ("RUL", "Remaining Useful Life", ""),
        ("SCADA", "Supervisory Control and Data Acquisition", ""),
        ("TPM", "Total Productive Maintenance", ""),
        ("UI", "User Interface", ""),
        ("UUID", "Universally Unique Identifier", ""),
        ("WIP", "Work In Progress", "")
    ]
    make_aligned_toc_table(abbr_entries)
    doc.add_page_break()

    # -------------------------------------------------------------
    # SECTION 2: MAIN BODY (Pages 1 to 60)
    # -------------------------------------------------------------
    section2 = doc.add_section()
    section2.header.is_linked_to_previous = False
    section2.footer.is_linked_to_previous = False
    sectPr2 = section2._sectPr
    pgNumType2 = OxmlElement('w:pgNumType')
    pgNumType2.set(qn('w:fmt'), 'decimal')
    pgNumType2.set(qn('w:start'), '1')
    sectPr2.append(pgNumType2)

    p_f2 = section2.footer.paragraphs[0]
    p_f2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    add_page_number_to_paragraph(p_f2)

    print("Front matter successfully created! Generating 60 body pages...")
    return doc

if __name__ == "__main__":
    doc = create_full_report()
    doc.save("test_full_structure.docx")
    print("Saved test_full_structure.docx")
