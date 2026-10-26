import os
import time
import shutil
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

def generate_image():
    html_content = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {
    box-sizing: border-box;
  }
  body {
    margin: 0;
    padding: 24px 32px 32px 32px;
    background: #ffffff;
    font-family: 'Times New Roman', Times, serif;
    width: 780px;
  }
  #capture-area {
    background: #ffffff;
    width: 710px;
  }
  .heading-1 {
    font-size: 21px;
    font-weight: bold;
    color: #000000;
    margin: 0 0 14px 0;
    letter-spacing: -0.2px;
  }
  .folder-tree-box {
    background: #f4f5f7;
    padding: 18px 24px;
    font-family: 'Courier New', Courier, monospace;
    font-size: 14px;
    line-height: 1.36;
    color: #111111;
    white-space: pre;
    border-radius: 2px;
    letter-spacing: 0px;
  }
  .heading-2 {
    font-size: 21px;
    font-weight: bold;
    color: #000000;
    margin: 20px 0 0 0;
    letter-spacing: -0.2px;
  }
</style>
</head>
<body>
<div id="capture-area">
  <div class="heading-1">1. Project Folder Structure</div>
  <div id="tree-box-only" class="folder-tree-box">real-time-oee-platform/
|-- backend/
|   |-- config/
|   |-- middleware/
|   |   \\-- auth.js
|   |-- models/
|   |   |-- DowntimeLog.js
|   |   |-- Machine.js
|   |   |-- ProductionLog.js
|   |   \\-- User.js
|   |-- routes/
|   |   |-- authRoutes.js
|   |   |-- downtimeRoutes.js
|   |   |-- machineRoutes.js
|   |   \\-- oeeRoutes.js
|   |-- simulator/
|   |-- sockets/
|   |-- utils/
|   |-- package.json
|   |-- seed.js
|   \\-- server.js
|-- frontend/
|   |-- src/
|   |   |-- assets/
|   |   |-- components/
|   |   |-- context/
|   |   |-- pages/
|   |   |-- App.css
|   |   |-- App.jsx
|   |   |-- index.css
|   |   \\-- main.jsx
|   |-- index.html
|   |-- package.json
|   \\-- vite.config.js
|-- README.md
\\-- start.bat</div>
  <div class="heading-2">2. Backend Package Installation Commands</div>
</div>
</body>
</html>"""

    temp_html = "temp_tree_render.html"
    with open(temp_html, "w", encoding="utf-8") as f:
        f.write(html_content)

    options = Options()
    options.add_argument('--headless')
    options.add_argument('--window-size=1200,1200')
    options.add_argument('--force-device-scale-factor=2') # 2x Retina resolution
    driver = webdriver.Chrome(options=options)

    abs_path = os.path.abspath(temp_html).replace('\\', '/')
    driver.get(f"file:///{abs_path}")
    time.sleep(0.6)

    # 1. Full image with headers (like reference screenshot)
    output_png = "project_folder_structure.png"
    elem = driver.find_element("id", "capture-area")
    elem.screenshot(output_png)

    # 2. Box-only image
    output_box_png = "project_folder_structure_box_only.png"
    elem_box = driver.find_element("id", "tree-box-only")
    elem_box.screenshot(output_box_png)

    driver.quit()

    if os.path.exists(temp_html):
        os.remove(temp_html)

    # Copy to artifact directory
    artifact_dir = r"C:\Users\haris\.gemini\antigravity-ide\brain\9154cdb7-ec77-4bee-93ee-652f981f9d90"
    if os.path.exists(artifact_dir):
        for fname in [output_png, output_box_png]:
            dest = os.path.join(artifact_dir, fname)
            shutil.copy2(fname, dest)
            print(f"Copied to artifact dir: {dest}")

    print(f"Successfully generated: {output_png} and {output_box_png}")

if __name__ == "__main__":
    generate_image()
