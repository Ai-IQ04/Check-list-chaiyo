import sys, os, json, re, pypdf

# Ensure clean UTF-8
sys.stdout.reconfigure(encoding='utf-8')

# Custom mapping & parsing for the 5 loan types
pdf_files = [
    {
        'id': 'land',
        'name': 'สินเชื่อที่ดิน',
        'icon': '🏠',
        'file': 'ที่ดิน.pdf',
        'subTypes': ['จำนำ (ผ่อนรายเดือน)', 'จำนำ (One-Time)', 'รีไฟแนนซ์ (ผ่อนรายเดือน)', 'รีไฟแนนซ์ (One-Time)', 'จำนอง (ผ่อนรายเดือน)', 'จำนอง (One-Time)']
    },
    {
        'id': 'motorcycle',
        'name': 'สินเชื่อรถจักรยานยนต์',
        'icon': '🏍️',
        'file': 'รถจักยานยนต์.pdf',
        'subTypes': ['จำนำ (ผ่อนรายเดือน)', 'รีไฟแนนซ์ (ผ่อนรายเดือน)', 'รีไฟแนนซ์ Top Up (ผ่อนรายเดือน)']
    },
    {
        'id': 'truck',
        'name': 'สินเชื่อรถบรรทุก',
        'icon': '🚛',
        'file': 'รถบรรทุก.pdf',
        'subTypes': ['จำนำ (ผ่อนรายเดือน)', 'รีไฟแนนซ์ (ผ่อนรายเดือน)', 'รีไฟแนนซ์ Top Up', 'ต่อสัญญา (One-Time)']
    },
    {
        'id': 'car',
        'name': 'สินเชื่อรถเก๋ง / กระบะ / รถตู้',
        'icon': '🚗',
        'file': 'รถเก๋ง กระบะ รถตู้.pdf',
        'subTypes': ['จำนำ (ผ่อนรายเดือน)', 'รีไฟแนนซ์ (ผ่อนรายเดือน)', 'รีไฟแนนซ์ Top Up', 'จำนำ (One-Time)', 'ต่อสัญญา (One-Time)']
    },
    {
        'id': 'agri',
        'name': 'สินเชื่อรถเพื่อการเกษตร',
        'icon': '🚜',
        'file': 'รถเพื่อการเกษตร.pdf',
        'subTypes': ['รถเกษตรใหม่ (Dealer)', 'จำนำรถเกษตรเก่า', 'รีไฟแนนซ์รถเกษตรเก่า', 'รีไฟแนนซ์ Top Up', 'ต่อสัญญา (One-Time)']
    }
]

def parse_pdf(file_path):
    reader = pypdf.PdfReader(file_path)
    items = []
    
    for pidx, page in enumerate(reader.pages):
        page_type = 'เอกสารประกอบสินเชื่อ (RC)' if pidx == 0 else 'เอกสารนิติกรรมสัญญา (CDM)'
        text = page.extract_text()
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        
        current_group = 'ทั่วไป'
        for line in lines:
            if re.match(r'^(A|B|C|C1|C2|C3|C5|D|AA|BB|CC)\s+', line):
                current_group = line
                continue
            
            m = re.match(r'^(\d+)\s+([A-Z0-9]+)\s+(.+?)(PDF|Jpeg\(รูปภาพ\)|Jpeg|JPG)\s*(.*)$', line, re.IGNORECASE)
            if m:
                no = int(m.group(1))
                code = m.group(2)
                raw_text = m.group(3).strip()
                fmt_raw = m.group(4)
                target_format = 'PDF' if 'pdf' in fmt_raw.lower() else 'JPG'
                
                # Split description and filename
                # Often in these checklists:
                # "สำเนาบัตรประชาชน ผู้กู้ สำเนาบัตร ปชช.ผู้กู้" -> target is "สำเนาบัตร ปชช.ผู้กู้"
                desc = raw_text
                target_name = raw_text
                
                # Intelligent clean target names
                if 'สำเนาบัตรประชาชน ผู้กู้' in raw_text:
                    desc = 'สำเนาบัตรประชาชน ผู้กู้'
                    target_name = 'สำเนาบัตร ปชช.ผู้กู้'
                elif 'สำเนาบัตรประชาชน ผู้ค้ำประกัน' in raw_text or 'สำเนาบัตรประชาชน ผู้ค ้าประกัน' in raw_text:
                    desc = 'สำเนาบัตรประชาชน ผู้ค้ำประกัน (ถ้ามี)'
                    target_name = 'สำเนาบัตร ปชช.ผู้ค้ำ'
                elif 'สำเนาทะเบียนบ้าน ผู้กู้' in raw_text or 'ส าเนาทะเบียนบ ้าน ผู้กู้' in raw_text:
                    desc = 'สำเนาทะเบียนบ้าน ผู้กู้'
                    target_name = 'สำเนาทะเบียนบ้านผู้กู้'
                elif 'สำเนาทะเบียนบ้าน ผู้ค้ำ' in raw_text or 'ส าเนาทะเบียนบ ้าน ผู้ค ้า' in raw_text:
                    desc = 'สำเนาทะเบียนบ้าน ผู้ค้ำ (ถ้ามี)'
                    target_name = 'สำเนาทะเบียนบ้านผู้ค้ำ'
                elif 'ใบเปลี่ยนชื่อ-นามสกุล' in raw_text or 'ใบเปลี่ยนชื่อ' in raw_text:
                    desc = 'ใบเปลี่ยนชื่อ-นามสกุล (ถ้ามี)'
                    target_name = 'ใบเปลี่ยนชื่อนามสกุล'
                elif 'สัญญากู้เงิน' in raw_text:
                    desc = 'สัญญากู้เงิน (ฉบับที่ลูกค้าต้องเซ็นลงนาม)'
                    target_name = 'สัญญากู้เงิน'
                elif 'ตารางผ่อนชำระ' in raw_text or 'ตารางผ่อนช าระ' in raw_text:
                    desc = 'ตารางผ่อนชำระ (ลูกค้าเซ็นทุกหน้า)'
                    target_name = 'ตารางผ่อนชำระ'
                elif 'สัญญาค้ำประกัน' in raw_text or 'สัญญาค ้าประกัน' in raw_text:
                    desc = 'สัญญาค้ำประกัน'
                    target_name = 'สัญญาค้ำ'
                elif 'คำเตือนสำหรับผู้ค้ำประกัน' in raw_text or 'ค าเตือนส าหรับผู้ค ้าประกัน' in raw_text:
                    desc = 'คำเตือนสำหรับผู้ค้ำประกัน'
                    target_name = 'คำเตือนผู้ค้ำ'
                elif 'Sale Sheet' in raw_text or 'Sales Sheet' in raw_text:
                    desc = 'Sale Sheet (มีลายเซ็นผู้กู้ลงนาม)'
                    target_name = 'Sale Sheet'
                elif 'หนังสือมอบอำนาจ (สำหรับรีไฟแนนซ์)' in raw_text or 'หนังสือมอบอ านาจ (ส าหรับรีไฟแนนซ์)' in raw_text:
                    desc = 'หนังสือมอบอำนาจ (สำหรับรีไฟแนนซ์)'
                    target_name = 'หนังสือมอบอำนาจรีไฟแนนซ์'
                elif 'หนังสือมอบอำนาจ' in raw_text or 'หนังสือมอบอ านาจ' in raw_text:
                    desc = 'หนังสือมอบอำนาจ'
                    target_name = 'หนังสือมอบอำนาจ'
                elif 'แบบคำขอโอนและรับโอน' in raw_text or 'แบบค าขอโอนและรับโอน' in raw_text:
                    desc = 'แบบคำขอโอนและรับโอน'
                    target_name = 'แบบคำขอโอนรับโอน'
                elif 'Checklist เอกสารมอบให้ลูกค้า' in raw_text or 'Checklist เอกสารมอบให ้ลูกค ้า' in raw_text:
                    desc = 'Checklist เอกสารมอบให้ลูกค้าทำสินเชื่อ'
                    target_name = 'เอกสารมอบให้ลูกค้า'
                elif 'หนังสือส่งมอบเล่มทะเบียน' in raw_text:
                    desc = 'หนังสือส่งมอบเล่มทะเบียน'
                    target_name = 'ส่งมอบเล่มทะเบียน'
                elif 'ใบรับเงินกู้' in raw_text:
                    desc = 'ใบรับเงินกู้'
                    target_name = 'ใบรับเงินกู้'
                elif 'รูปรถ' in raw_text or 'รูปหน้ารถ' in raw_text or 'รูปหลังรถ' in raw_text or 'รูปแปลงที่ดิน' in raw_text:
                    # Let's see if target_name like "รูปรถ 1", "รูปรถ 2", "รูปที่ดิน 1"
                    m_car = re.search(r'(รูปรถ\s*\d+|รูปที่ดิน\s*\d+|เล่ม\S+|เช็คต้น|ป้ายภาษี)', raw_text)
                    if m_car:
                        target_name = m_car.group(1).replace(' ', '')
                        desc = raw_text.replace(m_car.group(1), '').strip()
                elif 'สลิปเงินเดือน' in raw_text or 'เอกสารรายได้' in raw_text or 'เอกสำรรำยได้' in raw_text:
                    target_name = 'เอกสารรายได้ผู้กู้'
                    desc = 'เอกสารรายได้ ของผู้กู้ (สลิปเงินเดือน/Statement)'
                elif 'สมุดคู่ฝากธนาคาร' in raw_text or 'ส าเนาสมุดคู่ฝากธนาคาร' in raw_text:
                    target_name = 'สำเนาบัญชีธนาคาร'
                    desc = 'สำเนาสมุดคู่ฝากธนาคารสำหรับโอนเงิน'
                elif 'ประเมินความสามารถ' in raw_text:
                    target_name = 'ใบประเมินความสามารถ'
                    desc = 'ใบประเมินความสามารถลูกค้า (ผ่าน Branch App)'
                elif 'ประเมินรายได้ ผู้กู้' in raw_text or 'ประเมินรายได ้ ผู้กู้' in raw_text:
                    target_name = 'ประเมินรายได้ผู้กู้'
                    desc = 'แบบฟอร์มประเมินรายได้ ผู้กู้'
                elif 'ประเมินรายได้ ผู้ค้ำ' in raw_text or 'ประเมินรายได ้ ผู้ค ้า' in raw_text:
                    target_name = 'ประเมินรายได้ผู้ค้ำ'
                    desc = 'แบบฟอร์มประเมินรายได้ ผู้ค้ำ (ถ้ามี)'
                elif 'ใบเสนอราคา' in raw_text:
                    target_name = 'ใบเสนอราคาจากดีลเลอร์'
                    desc = 'ใบเสนอราคาจากดีลเลอร์'
                elif 'ชุดแจ้งจำหน่าย' in raw_text or 'ชุดแจ้งจ าหน่าย' in raw_text:
                    target_name = 'สำเนาชุดแจ้งจำหน่าย'
                    desc = 'สำเนาชุดแจ้งจำหน่าย'
                elif 'เก็บรวบรวม' in raw_text:
                    target_name = 'แบบฟอร์มการเก็บรวบรวมข้อมูลส่วนบุคคล'
                    desc = 'แบบฟอร์มการแจ้งการเก็บรวบรวมและเปิดเผยข้อมูลส่วนบุคคล (PDPA)'
                elif 'ต่อสัญญา One-Time' in raw_text:
                    target_name = 'อนุโลมต่อสัญญา'
                    desc = 'อนุโลม ต่อสัญญา One-Time'
                else:
                    # Generic cleanup
                    parts = raw_text.split(' ')
                    if len(parts) > 2:
                        target_name = parts[-1]
                        desc = ' '.join(parts[:-1])
                    else:
                        target_name = raw_text
                        desc = raw_text
                
                # normalize string
                desc = re.sub(r'ส\s+าเนา', 'สำเนา', desc)
                desc = re.sub(r'ให\s+้', 'ให้', desc)
                desc = re.sub(r'ใช\s+้', 'ใช้', desc)
                desc = re.sub(r'ได\s+้', 'ได้', desc)
                desc = re.sub(r'ข\s+้อ', 'ข้อ', desc)
                desc = re.sub(r'ค\s+้า', 'ค้ำ', desc)
                desc = re.sub(r'จ\s+า', 'จำ', desc)
                desc = re.sub(r'บ\s+้าน', 'บ้าน', desc)
                desc = re.sub(r'ด\s+้าน', 'ด้าน', desc)
                desc = re.sub(r'ต\s+้อง', 'ต้อง', desc)
                desc = re.sub(r'อ\s+้าง', 'อ้าง', desc)
                desc = re.sub(r'ช\s+าระ', 'ชำระ', desc)
                desc = re.sub(r'อ\s+านาจ', 'อำนาจ', desc)
                desc = re.sub(r'ค\s+า', 'คำ', desc)

                target_name = re.sub(r'ส\s+าเนา', 'สำเนา', target_name)
                target_name = re.sub(r'ให\s+้', 'ให้', target_name)
                target_name = re.sub(r'ใช\s+้', 'ใช้', target_name)
                target_name = re.sub(r'ได\s+้', 'ได้', target_name)
                target_name = re.sub(r'ข\s+้อ', 'ข้อ', target_name)
                target_name = re.sub(r'ค\s+้า', 'ค้ำ', target_name)
                target_name = re.sub(r'จ\s+า', 'จำ', target_name)
                target_name = re.sub(r'บ\s+้าน', 'บ้าน', target_name)
                target_name = re.sub(r'ด\s+้าน', 'ด้าน', target_name)
                target_name = re.sub(r'ต\s+้อง', 'ต้อง', target_name)
                target_name = re.sub(r'อ\s+้าง', 'อ้าง', target_name)
                target_name = re.sub(r'ช\s+าระ', 'ชำระ', target_name)
                target_name = re.sub(r'อ\s+านาจ', 'อำนาจ', target_name)
                target_name = re.sub(r'ค\s+า', 'คำ', target_name)

                items.append({
                    'code': code,
                    'group': current_group,
                    'pageType': page_type,
                    'desc': desc.strip(),
                    'targetName': target_name.strip(),
                    'format': target_format
                })
    return items

dataset = {}
for p in pdf_files:
    items = parse_pdf(p['file'])
    dataset[p['id']] = {
        'id': p['id'],
        'name': p['name'],
        'icon': p['icon'],
        'subTypes': p['subTypes'],
        'items': items
    }

js_content = '/**\n * Loan Documents Checklists & Rules Database\n * Extracted and compiled from official branch PDFs\n */\n'
js_content += 'window.LOAN_CHECKLISTS = ' + json.dumps(dataset, ensure_ascii=False, indent=2) + ';\n'

with open('checklists.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f'Generated checklists.js with {len(dataset)} loan categories.')
for k, v in dataset.items():
    print(f"  - {v['name']}: {len(v['items'])} document items")
