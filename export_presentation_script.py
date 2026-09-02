import subprocess, os, shutil, sys

sys.stdout.reconfigure(encoding='utf-8')

chrome_exe = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
html_file = os.path.abspath('presentation_script.html')
pdf_eng = os.path.abspath('presentation_script.pdf')
pdf_thai = os.path.abspath('สคริปต์การนำเสนอ_ระบบจัดการเอกสารสินเชื่อ.pdf')

url = 'file:///' + html_file.replace('\\', '/')

cmd = [
    chrome_exe,
    '--headless=new',
    '--disable-gpu',
    '--no-pdf-header-footer',
    '--print-to-pdf=' + pdf_eng,
    url
]

print('Generating PDF from:', url)
res = subprocess.run(cmd, capture_output=True, text=True)

if os.path.exists(pdf_eng):
    shutil.copyfile(pdf_eng, pdf_thai)
    print('SUCCESS! PDF Presentation Script Created successfully!')
    print(f'File 1: {pdf_eng} ({os.path.getsize(pdf_eng)} bytes)')
    print(f'File 2: {pdf_thai} ({os.path.getsize(pdf_thai)} bytes)')
else:
    print('Failed to generate PDF. Error:', res.stderr)
