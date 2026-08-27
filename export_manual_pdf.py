import subprocess, os, shutil, sys

sys.stdout.reconfigure(encoding='utf-8')

chrome_exe = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
html_file = os.path.abspath('manual.html')
pdf_temp = os.path.abspath('manual_guide.pdf')
thai_pdf = os.path.abspath('คู่มือการใช้งาน_ระบบจัดการเอกสารสินเชื่อ.pdf')

url = 'file:///' + html_file.replace('\\', '/')

cmd = [
    chrome_exe,
    '--headless=new',
    '--disable-gpu',
    '--no-pdf-header-footer',
    '--print-to-pdf=' + pdf_temp,
    url
]

print('Generating PDF from:', url)
res = subprocess.run(cmd, capture_output=True, text=True)

if os.path.exists(pdf_temp):
    shutil.copyfile(pdf_temp, thai_pdf)
    print(f'PDF manual created successfully!')
    print(f'File 1: {pdf_temp} ({os.path.getsize(pdf_temp)} bytes)')
    print(f'File 2: {thai_pdf} ({os.path.getsize(thai_pdf)} bytes)')
else:
    print('Failed to generate PDF. Stderr:', res.stderr)
