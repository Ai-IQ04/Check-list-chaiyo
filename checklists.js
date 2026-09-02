/**
 * Loan Documents Checklists & Rules Master Database (v3.1.0)
 * C04 หนังสือติดตามทวงถามหนี้ / AA07 ใบมอบอำนาจ / AA08 ใบคำขอโอน / AA12 ใบรับมอบสินค้า อยู่ในหมวด C พิจารณาอนุมัติสินเชื่อ
 */
window.LOAN_CHECKLISTS = {
  "motorcycle": {
    "id": "motorcycle",
    "name": "สินเชื่อรถมอเตอร์ไซค์",
    "icon": "bike",
    "iconBadge": "bg-orange-500 text-white",
    "subTypes": [
      {
        "id": "pledge",
        "name": "🏷️ จำนำเล่มทะเบียน"
      },
      {
        "id": "refinance",
        "name": "🔄 รีไฟแนนซ์"
      },
      {
        "id": "topup",
        "name": "➕ Top-up (กู้เพิ่ม)"
      }
    ],
    "items": [
      {
        "code": "A01",
        "group": "A ยืนยันตัวตน",
        "desc": "สำเนาบัตรประชาชน ผู้กู้",
        "targetName": "สำเนาบัตร ปชช.ผู้กู้",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "A02",
        "group": "A ยืนยันตัวตน",
        "desc": "สำเนาบัตรประชาชน ผู้ค้ำประกัน (ถ้ามี)",
        "targetName": "สำเนาบัตร ปชช.ผู้ค้ำ",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "A03",
        "group": "A ยืนยันตัวตน",
        "desc": "สำเนาทะเบียนบ้าน ผู้กู้",
        "targetName": "สำเนาทะเบียนบ้านผู้กู้",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "A04",
        "group": "A ยืนยันตัวตน",
        "desc": "สำเนาทะเบียนบ้าน ผู้ค้ำ (ถ้ามี)",
        "targetName": "สำเนาทะเบียนบ้านผู้ค้ำ",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "A05",
        "group": "A ยืนยันตัวตน",
        "desc": "ใบเปลี่ยนชื่อ-นามสกุล (ถ้ามี)",
        "targetName": "ใบเปลี่ยนชื่อนามสกุล",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "A06",
        "group": "A ยืนยันตัวตน",
        "desc": "รูปถ่ายพนักงานยืนคู่กับลูกค้าแสดงบัตรประชาชน",
        "targetName": "รูปยืนยันตัวตน",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B10",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปหลังรถเห็นป้ายทะเบียน พร้อม เซลฟี่ + ถือบัตรพนักงาน",
        "targetName": "รูปรถ 1",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B11",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปหน้ารถ",
        "targetName": "รูปรถ 2",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B12",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปด้านข้างซ้าย",
        "targetName": "รูปรถ 3",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B13",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปด้านข้างขวา",
        "targetName": "รูปรถ 4",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B14",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "เลขตัวถังรถ",
        "targetName": "รูปรถ 5",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B101",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปถ่ายเล่มทะเบียน หน้าปก",
        "targetName": "เล่มหน้าปก",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B102",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปถ่ายเล่มทะเบียน หน้ารายการจดทะเบียน",
        "targetName": "เล่มหน้ารายการ",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B103",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปถ่ายเล่มทะเบียน หน้ากลางเล่ม",
        "targetName": "เล่มหน้ากลาง",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B104",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปถ่ายเล่มทะเบียน หน้ารายการภาษี",
        "targetName": "เล่มหน้าภาษี",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B105",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปถ่ายเล่มทะเบียน หน้าบันทึกเจ้าหน้าที่",
        "targetName": "เล่มหน้าบันทึก",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B107",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปภาพป้ายภาษี",
        "targetName": "ป้ายภาษี",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B108",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "หน้าตรวจสอบการชำระภาษีจากเว็บกรมการขนส่งทางบก",
        "targetName": "เว็บขนส่ง",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "C01",
        "group": "C พิจารณาอนุมัติสินเชื่อ",
        "desc": "สำเนาสมุดคู่ฝากธนาคารเพื่อใช้ในการโอนเงิน (บัญชีลูกค้าเท่านั้น)",
        "targetName": "สำเนาบัญชีธนาคาร",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "C04",
        "group": "C พิจารณาอนุมัติสินเชื่อ",
        "desc": "หนังสือติดตามทวงถามหนี้ (หนังสือให้ติดตามทวงถามหนี้)",
        "targetName": "หนังสือให้ติดตามทวงถามหนี้",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "AA07",
        "group": "C พิจารณาอนุมัติสินเชื่อ",
        "desc": "หนังสือมอบอำนาจ (ใบมอบอำนาจ)",
        "targetName": "หนังสือมอบอำนาจ",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "AA08",
        "group": "C พิจารณาอนุมัติสินเชื่อ",
        "desc": "แบบคำขอโอนและรับโอน (ใบคำขอโอน)",
        "targetName": "แบบคำขอโอนรับโอน",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "AA12",
        "group": "C พิจารณาอนุมัติสินเชื่อ",
        "desc": "ใบรับมอบสินค้า (สำหรับรถ)",
        "targetName": "ใบรับมอบสินค้า",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C07",
        "group": "C พิจารณาอนุมัติสินเชื่อ",
        "desc": "หนังสือ/อีเมลขออนุโลมประกันภัย (ถ้ามี)",
        "targetName": "อนุโลมประกัน",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C05",
        "group": "C พิจารณาอนุมัติสินเชื่อ",
        "desc": "แบบฟอร์มตรวจที่พักอาศัย (ถ้ามี)",
        "targetName": "แบบฟอร์มตรวจที่พักอาศัย",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C06",
        "group": "C พิจารณาอนุมัติสินเชื่อ",
        "desc": "อีเมลผล ABC (ถ้ามี)",
        "targetName": "ผล ABC",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C101",
        "group": "C1 รายได้",
        "desc": "แบบฟอร์มประเมินรายได้ ผู้กู้",
        "targetName": "ประเมินรายได้ผู้กู้",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "C102",
        "group": "C1 รายได้",
        "desc": "แบบฟอร์มประเมินรายได้ ผู้ค้ำ (ถ้ามี)",
        "targetName": "ประเมินรายได้ผู้ค้ำ",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C105",
        "group": "C1 รายได้",
        "desc": "เอกสารรายได้ ของผู้กู้ (สลิปเงินเดือน / Bank Statement / ใบประทวน)",
        "targetName": "เอกสารรายได้ผู้กู้",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C106",
        "group": "C1 รายได้",
        "desc": "เอกสารรายได้ ของผู้ค้ำ (ถ้ามี) (สลิปเงินเดือน / Bank Statement)",
        "targetName": "เอกสารรายได้ผู้ค้ำ",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C107",
        "group": "C1 รายได้",
        "desc": "แบบฟอร์มตรวจสอบภาคสนาม และข้อมูลบุคคลอ้างอิง",
        "targetName": "ตรวจสอบภาคสนามและบุคคลอ้างอิง",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C201",
        "group": "C2 ยืนยันการประกอบอาชีพ",
        "desc": "รูปถ่ายกิจการ ของผู้กู้ (Time Stamp)",
        "targetName": "รูปถ่ายกิจการผู้กู้",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "C202",
        "group": "C2 ยืนยันการประกอบอาชีพ",
        "desc": "รูปถ่ายกิจการ ของผู้ค้ำ (ถ้ามี) (Time Stamp)",
        "targetName": "รูปถ่ายกิจการผู้ค้ำ",
        "format": "JPG",
        "mandatory": false
      },
      {
        "code": "C305",
        "group": "C3 เอกสารเพิ่มเติม รีไฟแนนซ์/ต่อสัญญา",
        "desc": "สัญญาคู่ฉบับไฟแนนซ์เดิม เช่น สัญญาเช่าซื้อ / สัญญาเงินกู้ / การ์ดค่างวด",
        "targetName": "สัญญาคู่ฉบับไฟแนนซ์เดิม",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C306",
        "group": "C3 เอกสารเพิ่มเติม รีไฟแนนซ์/ต่อสัญญา",
        "desc": "ใบเสร็จชำระค่างวด",
        "targetName": "ใบเสร็จชำระค่างวด",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "C307",
        "group": "C3 เอกสารเพิ่มเติม รีไฟแนนซ์/ต่อสัญญา",
        "desc": "ใบสอบถามยอดหนี้ไฟแนนซ์เดิม",
        "targetName": "ใบสอบถามยอดหนี้",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "C308",
        "group": "C3 เอกสารเพิ่มเติม รีไฟแนนซ์/ต่อสัญญา",
        "desc": "ใบเรียกเก็บดอกเบี้ยสะสม (เฉพาะลูกค้า Top up ของ AutoX)",
        "targetName": "ใบเรียกเก็บดอกเบี้ยสะสม",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "AA01",
        "group": "AA สัญญาสำหรับผู้กู้",
        "desc": "สัญญากู้เงิน (ฉบับที่ลูกค้าต้องเซ็นลงนาม)",
        "targetName": "สัญญากู้เงิน",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "AA09",
        "group": "AA สัญญาสำหรับผู้กู้",
        "desc": "ตารางผ่อนชำระ (ลูกค้าเซ็นทุกหน้า)",
        "targetName": "ตารางผ่อนชำระ",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "AA02",
        "group": "AA สัญญาสำหรับผู้กู้",
        "desc": "ใบรับเงินกู้",
        "targetName": "ใบรับเงินกู้",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "AA11",
        "group": "AA สัญญาสำหรับผู้กู้",
        "desc": "Checklist เอกสารมอบให้ลูกค้าทำสินเชื่อ",
        "targetName": "เอกสารมอบให้ลูกค้า",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "C304",
        "group": "C3 เอกสารเพิ่มเติม รีไฟแนนซ์/ต่อสัญญา",
        "desc": "หนังสือส่งมอบใบคู่มือจดทะเบียนรถ",
        "targetName": "หนังสือส่งมอบใบคู่มือจดทะเบียนรถ",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "A023",
        "group": "A ยืนยันตัวตน",
        "desc": "หนังสือมอบอำนาจ (สำหรับรีไฟแนนซ์)",
        "targetName": "หนังสือมอบอำนาจรีไฟแนนซ์",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "BB01",
        "group": "BB สัญญาสำหรับผู้ค้ำประกัน",
        "desc": "สัญญาค้ำประกัน",
        "targetName": "สัญญาค้ำ",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "BB02",
        "group": "BB สัญญาสำหรับผู้ค้ำประกัน",
        "desc": "คำเตือนสำหรับผู้ค้ำประกัน",
        "targetName": "คำเตือนผู้ค้ำ",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "CC03",
        "group": "CC Sales Sheet",
        "desc": "Sale Sheet (มีลายเซ็นผู้กู้ลงนาม)",
        "targetName": "Sale Sheet",
        "format": "JPG",
        "mandatory": true
      }
    ]
  },
  "car": {
    "id": "car",
    "name": "สินเชื่อรถเก๋ง / กระบะ / รถตู้",
    "icon": "🚗",
    "subTypes": [
      {
        "id": "pledge",
        "name": "🏷️ จำนำเล่มทะเบียน"
      },
      {
        "id": "refinance",
        "name": "🔄 รีไฟแนนซ์"
      },
      {
        "id": "topup",
        "name": "➕ Top-up (กู้เพิ่ม)"
      }
    ],
    "items": [
      {
        "code": "A01",
        "group": "A ยืนยันตัวตน",
        "desc": "สำเนาบัตรประชาชน ผู้กู้",
        "targetName": "สำเนาบัตร ปชช.ผู้กู้",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "A02",
        "group": "A ยืนยันตัวตน",
        "desc": "สำเนาบัตรประชาชน ผู้ค้ำประกัน (ถ้ามี)",
        "targetName": "สำเนาบัตร ปชช.ผู้ค้ำ",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "A03",
        "group": "A ยืนยันตัวตน",
        "desc": "สำเนาทะเบียนบ้าน ผู้กู้",
        "targetName": "สำเนาทะเบียนบ้านผู้กู้",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "A04",
        "group": "A ยืนยันตัวตน",
        "desc": "สำเนาทะเบียนบ้าน ผู้ค้ำ (ถ้ามี)",
        "targetName": "สำเนาทะเบียนบ้านผู้ค้ำ",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "A05",
        "group": "A ยืนยันตัวตน",
        "desc": "ใบเปลี่ยนชื่อ-นามสกุล (ถ้ามี)",
        "targetName": "ใบเปลี่ยนชื่อนามสกุล",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "A06",
        "group": "A ยืนยันตัวตน",
        "desc": "รูปถ่ายพนักงานยืนคู่กับลูกค้าแสดงบัตรประชาชน",
        "targetName": "รูปยืนยันตัวตน",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B01",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปหลังรถเห็นป้ายทะเบียน พร้อม เซลฟี่-ถือบัตรพนักงาน",
        "targetName": "รูปรถ 1",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B02",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปหน้ารถ เห็นป้ายทะเบียน / เปิดกระโปรงหน้า + เห็นเครื่องยนต์",
        "targetName": "รูปรถ 2",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B03",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปหน้ารถ - เฉียงซ้าย 45 องศา",
        "targetName": "รูปรถ 3",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B04",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปหน้ารถ – เฉียงขวา 45 องศา",
        "targetName": "รูปรถ 4",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B05",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปหลังรถ - เฉียงซ้าย 45 องศา",
        "targetName": "รูปรถ 5",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B06",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปหลังรถ - เฉียงขวา 45 องศา",
        "targetName": "รูปรถ 6",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B07",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปภายในรถให้เห็นเกียร์+คอนโซล",
        "targetName": "รูปรถ 7",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B08",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปเลขตัวถัง/คัสซี",
        "targetName": "รูปรถ 8",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B09",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปเกียร์ 4x4 / 4WD (ถ้ามี)_สำหรับรถกระบะที่ขับเคลื่อน 4ล้อ",
        "targetName": "รูปรถ 9",
        "format": "JPG",
        "mandatory": false
      },
      {
        "code": "B101",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปถ่ายเล่มทะเบียน หน้าปก",
        "targetName": "เล่มหน้าปก",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B102",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปถ่ายเล่มทะเบียน หน้ารายการจดทะเบียน",
        "targetName": "เล่มหน้ารายการ",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B103",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปถ่ายเล่มทะเบียน หน้ากลางเล่ม",
        "targetName": "เล่มหน้ากลาง",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B104",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปถ่ายเล่มทะเบียน หน้ารายการภาษี",
        "targetName": "เล่มหน้าภาษี",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B105",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปถ่ายเล่มทะเบียน หน้าบันทึกเจ้าหน้าที่",
        "targetName": "เล่มหน้าบันทึก",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B106",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "ผลเช็คต้น (ตามเงื่อนไข)",
        "targetName": "เช็คต้น",
        "format": "JPG",
        "mandatory": false
      },
      {
        "code": "B107",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปภาพป้ายภาษี",
        "targetName": "ป้ายภาษี",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B108",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "หน้าตรวจสอบการชำระภาษีจากเว็บกรมการขนส่งทางบก",
        "targetName": "เว็บขนส่ง",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "C01",
        "group": "C พิจารณาอนุมัติสินเชื่อ",
        "desc": "สำเนาสมุดคู่ฝากธนาคารเพื่อใช้ในการโอนเงิน (บัญชีลูกค้าเท่านั้น)",
        "targetName": "สำเนาบัญชีธนาคาร",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "C04",
        "group": "C พิจารณาอนุมัติสินเชื่อ",
        "desc": "หนังสือติดตามทวงถามหนี้ (หนังสือให้ติดตามทวงถามหนี้)",
        "targetName": "หนังสือให้ติดตามทวงถามหนี้",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "AA07",
        "group": "C พิจารณาอนุมัติสินเชื่อ",
        "desc": "หนังสือมอบอำนาจ (ใบมอบอำนาจ)",
        "targetName": "หนังสือมอบอำนาจ",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "AA08",
        "group": "C พิจารณาอนุมัติสินเชื่อ",
        "desc": "แบบคำขอโอนและรับโอน (ใบคำขอโอน)",
        "targetName": "แบบคำขอโอนรับโอน",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "AA12",
        "group": "C พิจารณาอนุมัติสินเชื่อ",
        "desc": "ใบรับมอบสินค้า (สำหรับรถ)",
        "targetName": "ใบรับมอบสินค้า",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C05",
        "group": "C พิจารณาอนุมัติสินเชื่อ",
        "desc": "แบบฟอร์มตรวจที่พักอาศัย (ถ้ามี)",
        "targetName": "แบบฟอร์มตรวจที่พักอาศัย",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C06",
        "group": "C พิจารณาอนุมัติสินเชื่อ",
        "desc": "อีเมลผล ABC (ถ้ามี)",
        "targetName": "ผล ABC",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C101",
        "group": "C1 รายได้",
        "desc": "แบบฟอร์มประเมินรายได้ ผู้กู้",
        "targetName": "ประเมินรายได้ผู้กู้",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "C102",
        "group": "C1 รายได้",
        "desc": "แบบฟอร์มประเมินรายได้ ผู้ค้ำ (ถ้ามี)",
        "targetName": "ประเมินรายได้ผู้ค้ำ",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C105",
        "group": "C1 รายได้",
        "desc": "เอกสารรายได้ ของผู้กู้ (สลิปเงินเดือน / Bank Statement / ใบประทวน)",
        "targetName": "เอกสารรายได้ผู้กู้",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C106",
        "group": "C1 รายได้",
        "desc": "เอกสารรายได้ ของผู้ค้ำ (ถ้ามี) (สลิปเงินเดือน / Bank Statement)",
        "targetName": "เอกสารรายได้ผู้ค้ำ",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C107",
        "group": "C1 รายได้",
        "desc": "แบบฟอร์มตรวจสอบภาคสนาม และข้อมูลบุคคลอ้างอิง",
        "targetName": "ตรวจสอบภาคสนามและบุคคลอ้างอิง",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C201",
        "group": "C2 ยืนยันการประกอบอาชีพ",
        "desc": "รูปถ่ายกิจการ ของผู้กู้ (Time Stamp)",
        "targetName": "รูปถ่ายกิจการผู้กู้",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "C202",
        "group": "C2 ยืนยันการประกอบอาชีพ",
        "desc": "รูปถ่ายกิจการ ของผู้ค้ำ (ถ้ามี) (Time Stamp)",
        "targetName": "รูปถ่ายกิจการผู้ค้ำ",
        "format": "JPG",
        "mandatory": false
      },
      {
        "code": "C305",
        "group": "C3 เอกสารเพิ่มเติม รีไฟแนนซ์/ต่อสัญญา",
        "desc": "สัญญาคู่ฉบับไฟแนนซ์เดิม เช่น สัญญาเช่าซื้อ / สัญญาเงินกู้ / การ์ดค่างวด",
        "targetName": "สัญญาคู่ฉบับไฟแนนซ์เดิม",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C306",
        "group": "C3 เอกสารเพิ่มเติม รีไฟแนนซ์/ต่อสัญญา",
        "desc": "ใบเสร็จชำระค่างวด",
        "targetName": "ใบเสร็จชำระค่างวด",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "C307",
        "group": "C3 เอกสารเพิ่มเติม รีไฟแนนซ์/ต่อสัญญา",
        "desc": "ใบสอบถามยอดหนี้ไฟแนนซ์เดิม",
        "targetName": "ใบสอบถามยอดหนี้",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "C308",
        "group": "C3 เอกสารเพิ่มเติม รีไฟแนนซ์/ต่อสัญญา",
        "desc": "ใบเรียกเก็บดอกเบี้ยสะสม (เฉพาะลูกค้า Top up ของ AutoX)",
        "targetName": "ใบเรียกเก็บดอกเบี้ยสะสม",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "D01",
        "group": "D เอกสารอนุโลม",
        "desc": "อนุโลม ต่อสัญญา One-Time หรือ รายปี",
        "targetName": "อนุโลมต่อสัญญา",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "D02",
        "group": "D เอกสารอนุโลม",
        "desc": "อนุโลม ผู้กู้ทำหรือไม่ทำประกัน (PA Safety Loan) / ประกันภัย",
        "targetName": "อนุโลมประกัน",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "AA01",
        "group": "AA สัญญาสำหรับผู้กู้",
        "desc": "สัญญากู้เงิน (ฉบับที่ลูกค้าต้องเซ็นลงนาม)",
        "targetName": "สัญญากู้เงิน",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "AA09",
        "group": "AA สัญญาสำหรับผู้กู้",
        "desc": "ตารางผ่อนชำระ (ลูกค้าเซ็นทุกหน้า)",
        "targetName": "ตารางผ่อนชำระ",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "AA02",
        "group": "AA สัญญาสำหรับผู้กู้",
        "desc": "ใบรับเงินกู้",
        "targetName": "ใบรับเงินกู้",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "AA11",
        "group": "AA สัญญาสำหรับผู้กู้",
        "desc": "Checklist เอกสารมอบให้ลูกค้าทำสินเชื่อ",
        "targetName": "เอกสารมอบให้ลูกค้า",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "C304",
        "group": "C3 เอกสารเพิ่มเติม รีไฟแนนซ์/ต่อสัญญา",
        "desc": "หนังสือส่งมอบใบคู่มือจดทะเบียนรถ",
        "targetName": "หนังสือส่งมอบใบคู่มือจดทะเบียนรถ",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "A023",
        "group": "A ยืนยันตัวตน",
        "desc": "หนังสือมอบอำนาจ (สำหรับรีไฟแนนซ์)",
        "targetName": "หนังสือมอบอำนาจรีไฟแนนซ์",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "BB01",
        "group": "BB สัญญาสำหรับผู้ค้ำประกัน",
        "desc": "สัญญาค้ำประกัน",
        "targetName": "สัญญาค้ำ",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "BB02",
        "group": "BB สัญญาสำหรับผู้ค้ำประกัน",
        "desc": "คำเตือนสำหรับผู้ค้ำประกัน",
        "targetName": "คำเตือนผู้ค้ำ",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "CC03",
        "group": "CC Sales Sheet",
        "desc": "Sale Sheet (มีลายเซ็นผู้กู้ลงนาม)",
        "targetName": "Sale Sheet",
        "format": "JPG",
        "mandatory": true
      }
    ]
  },
  "truck": {
    "id": "truck",
    "name": "สินเชื่อรถบรรทุก",
    "icon": "🚛",
    "subTypes": [
      {
        "id": "pledge",
        "name": "🏷️ จำนำเล่มทะเบียน"
      },
      {
        "id": "refinance",
        "name": "🔄 รีไฟแนนซ์"
      },
      {
        "id": "topup",
        "name": "➕ Top-up (กู้เพิ่ม)"
      }
    ],
    "items": [
      {
        "code": "A01",
        "group": "A ยืนยันตัวตน",
        "desc": "สำเนาบัตรประชาชน ผู้กู้",
        "targetName": "สำเนาบัตร ปชช.ผู้กู้",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "A02",
        "group": "A ยืนยันตัวตน",
        "desc": "สำเนาบัตรประชาชน ผู้ค้ำประกัน (ถ้ามี)",
        "targetName": "สำเนาบัตร ปชช.ผู้ค้ำ",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "A03",
        "group": "A ยืนยันตัวตน",
        "desc": "สำเนาทะเบียนบ้าน ผู้กู้",
        "targetName": "สำเนาทะเบียนบ้านผู้กู้",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "A04",
        "group": "A ยืนยันตัวตน",
        "desc": "สำเนาทะเบียนบ้าน ผู้ค้ำ (ถ้ามี)",
        "targetName": "สำเนาทะเบียนบ้านผู้ค้ำ",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "A05",
        "group": "A ยืนยันตัวตน",
        "desc": "ใบเปลี่ยนชื่อ-นามสกุล (ถ้ามี)",
        "targetName": "ใบเปลี่ยนชื่อนามสกุล",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "A06",
        "group": "A ยืนยันตัวตน",
        "desc": "รูปถ่ายพนักงานยืนคู่กับลูกค้าแสดงบัตรประชาชน",
        "targetName": "รูปยืนยันตัวตน",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B15",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปหน้ารถ เห็นป้ายทะเบียน พร้อม เซลฟี่-ถือบัตรพนักงาน",
        "targetName": "รูปรถ 1",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B16",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปหลังรถเห็นป้ายทะเบียน",
        "targetName": "รูปรถ 2",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B17",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปหน้ารถ - เฉียงซ้าย 45 องศา",
        "targetName": "รูปรถ 3",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B18",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปหน้ารถ – เฉียงขวา 45 องศา",
        "targetName": "รูปรถ 4",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B19",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปหลังรถ - เฉียงซ้าย 45 องศา",
        "targetName": "รูปรถ 5",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B20",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปหลังรถ - เฉียงขวา 45 องศา",
        "targetName": "รูปรถ 6",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B21",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปเลขไมล์",
        "targetName": "รูปรถ 7",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B22",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปเลขตัวถัง/คัสซี",
        "targetName": "รูปรถ 8",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B23",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปเลขเครื่องยนต์",
        "targetName": "รูปรถ 9",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B24",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปป้ายด้านข้างรถ",
        "targetName": "รูปรถ 10",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B25",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปป้ายรอบคัน",
        "targetName": "รูปรถ 11",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B101",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปถ่ายเล่มทะเบียน หน้าปก",
        "targetName": "เล่มหน้าปก",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B102",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปถ่ายเล่มทะเบียน หน้ารายการจดทะเบียน",
        "targetName": "เล่มหน้ารายการ",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B103",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปถ่ายเล่มทะเบียน หน้ากลางเล่ม",
        "targetName": "เล่มหน้ากลาง",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B104",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปถ่ายเล่มทะเบียน หน้ารายการภาษี",
        "targetName": "เล่มหน้าภาษี",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B105",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปถ่ายเล่มทะเบียน หน้าบันทึกเจ้าหน้าที่",
        "targetName": "เล่มหน้าบันทึก",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B106",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "ผลเช็คต้น (ตามเงื่อนไข)",
        "targetName": "เช็คต้น",
        "format": "JPG",
        "mandatory": false
      },
      {
        "code": "B107",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปภาพป้ายภาษี",
        "targetName": "ป้ายภาษี",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B108",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "หน้าตรวจสอบการชำระภาษีจากเว็บกรมการขนส่งทางบก",
        "targetName": "เว็บขนส่ง",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "C01",
        "group": "C พิจารณาอนุมัติสินเชื่อ",
        "desc": "สำเนาสมุดคู่ฝากธนาคารเพื่อใช้ในการโอนเงิน (บัญชีลูกค้าเท่านั้น)",
        "targetName": "สำเนาบัญชีธนาคาร",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "C04",
        "group": "C พิจารณาอนุมัติสินเชื่อ",
        "desc": "หนังสือติดตามทวงถามหนี้ (หนังสือให้ติดตามทวงถามหนี้)",
        "targetName": "หนังสือให้ติดตามทวงถามหนี้",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "AA07",
        "group": "C พิจารณาอนุมัติสินเชื่อ",
        "desc": "หนังสือมอบอำนาจ (ใบมอบอำนาจ)",
        "targetName": "หนังสือมอบอำนาจ",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "AA08",
        "group": "C พิจารณาอนุมัติสินเชื่อ",
        "desc": "แบบคำขอโอนและรับโอน (ใบคำขอโอน)",
        "targetName": "แบบคำขอโอนรับโอน",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "AA12",
        "group": "C พิจารณาอนุมัติสินเชื่อ",
        "desc": "ใบรับมอบสินค้า (สำหรับรถ)",
        "targetName": "ใบรับมอบสินค้า",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C05",
        "group": "C พิจารณาอนุมัติสินเชื่อ",
        "desc": "แบบฟอร์มตรวจที่พักอาศัย (ถ้ามี)",
        "targetName": "แบบฟอร์มตรวจที่พักอาศัย",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C06",
        "group": "C พิจารณาอนุมัติสินเชื่อ",
        "desc": "อีเมลผล ABC (ถ้ามี)",
        "targetName": "ผล ABC",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C101",
        "group": "C1 รายได้",
        "desc": "แบบฟอร์มประเมินรายได้ ผู้กู้",
        "targetName": "ประเมินรายได้ผู้กู้",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "C102",
        "group": "C1 รายได้",
        "desc": "แบบฟอร์มประเมินรายได้ ผู้ค้ำ (ถ้ามี)",
        "targetName": "ประเมินรายได้ผู้ค้ำ",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C105",
        "group": "C1 รายได้",
        "desc": "เอกสารรายได้ ของผู้กู้ (สลิปเงินเดือน / Bank Statement / ใบประทวน)",
        "targetName": "เอกสารรายได้ผู้กู้",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C106",
        "group": "C1 รายได้",
        "desc": "เอกสารรายได้ ของผู้ค้ำ (ถ้ามี) (สลิปเงินเดือน / Bank Statement)",
        "targetName": "เอกสารรายได้ผู้ค้ำ",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C107",
        "group": "C1 รายได้",
        "desc": "แบบฟอร์มตรวจสอบภาคสนาม และข้อมูลบุคคลอ้างอิง",
        "targetName": "ตรวจสอบภาคสนามและบุคคลอ้างอิง",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C201",
        "group": "C2 ยืนยันการประกอบอาชีพ",
        "desc": "รูปถ่ายกิจการ ของผู้กู้ (Time Stamp)",
        "targetName": "รูปถ่ายกิจการผู้กู้",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "C202",
        "group": "C2 ยืนยันการประกอบอาชีพ",
        "desc": "รูปถ่ายกิจการ ของผู้ค้ำ (ถ้ามี) (Time Stamp)",
        "targetName": "รูปถ่ายกิจการผู้ค้ำ",
        "format": "JPG",
        "mandatory": false
      },
      {
        "code": "C305",
        "group": "C3 เอกสารเพิ่มเติม รีไฟแนนซ์/ต่อสัญญา",
        "desc": "สัญญาคู่ฉบับไฟแนนซ์เดิม เช่น สัญญาเช่าซื้อ / สัญญาเงินกู้ / การ์ดค่างวด",
        "targetName": "สัญญาคู่ฉบับไฟแนนซ์เดิม",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C306",
        "group": "C3 เอกสารเพิ่มเติม รีไฟแนนซ์/ต่อสัญญา",
        "desc": "ใบเสร็จชำระค่างวด",
        "targetName": "ใบเสร็จชำระค่างวด",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "C307",
        "group": "C3 เอกสารเพิ่มเติม รีไฟแนนซ์/ต่อสัญญา",
        "desc": "ใบสอบถามยอดหนี้ไฟแนนซ์เดิม",
        "targetName": "ใบสอบถามยอดหนี้",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "C308",
        "group": "C3 เอกสารเพิ่มเติม รีไฟแนนซ์/ต่อสัญญา",
        "desc": "ใบเรียกเก็บดอกเบี้ยสะสม (เฉพาะลูกค้า Top up ของ AutoX)",
        "targetName": "ใบเรียกเก็บดอกเบี้ยสะสม",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "D01",
        "group": "D เอกสารอนุโลม",
        "desc": "อนุโลม ต่อสัญญา One-Time หรือ รายปี",
        "targetName": "อนุโลมต่อสัญญา",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "AA01",
        "group": "AA สัญญาสำหรับผู้กู้",
        "desc": "สัญญากู้เงิน (ฉบับที่ลูกค้าต้องเซ็นลงนาม)",
        "targetName": "สัญญากู้เงิน",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "AA09",
        "group": "AA สัญญาสำหรับผู้กู้",
        "desc": "ตารางผ่อนชำระ (ลูกค้าเซ็นทุกหน้า)",
        "targetName": "ตารางผ่อนชำระ",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "AA02",
        "group": "AA สัญญาสำหรับผู้กู้",
        "desc": "ใบรับเงินกู้",
        "targetName": "ใบรับเงินกู้",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "AA11",
        "group": "AA สัญญาสำหรับผู้กู้",
        "desc": "Checklist เอกสารมอบให้ลูกค้าทำสินเชื่อ",
        "targetName": "เอกสารมอบให้ลูกค้า",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "C304",
        "group": "C3 เอกสารเพิ่มเติม รีไฟแนนซ์/ต่อสัญญา",
        "desc": "หนังสือส่งมอบใบคู่มือจดทะเบียนรถ",
        "targetName": "หนังสือส่งมอบใบคู่มือจดทะเบียนรถ",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "A023",
        "group": "A ยืนยันตัวตน",
        "desc": "หนังสือมอบอำนาจ (สำหรับรีไฟแนนซ์)",
        "targetName": "หนังสือมอบอำนาจรีไฟแนนซ์",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "BB01",
        "group": "BB สัญญาสำหรับผู้ค้ำประกัน",
        "desc": "สัญญาค้ำประกัน",
        "targetName": "สัญญาค้ำ",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "BB02",
        "group": "BB สัญญาสำหรับผู้ค้ำประกัน",
        "desc": "คำเตือนสำหรับผู้ค้ำประกัน",
        "targetName": "คำเตือนผู้ค้ำ",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "CC03",
        "group": "CC Sales Sheet",
        "desc": "Sale Sheet (มีลายเซ็นผู้กู้ลงนาม)",
        "targetName": "Sale Sheet",
        "format": "JPG",
        "mandatory": true
      }
    ]
  },
  "agri": {
    "id": "agri",
    "name": "สินเชื่อรถเพื่อการเกษตร",
    "icon": "🚜",
    "subTypes": [
      {
        "id": "pledge",
        "name": "🏷️ จำนำเล่มทะเบียน"
      },
      {
        "id": "refinance",
        "name": "🔄 รีไฟแนนซ์"
      },
      {
        "id": "topup",
        "name": "➕ Top-up (กู้เพิ่ม)"
      }
    ],
    "items": [
      {
        "code": "A01",
        "group": "A ยืนยันตัวตน",
        "desc": "สำเนาบัตรประชาชน ผู้กู้",
        "targetName": "สำเนาบัตร ปชช.ผู้กู้",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "A02",
        "group": "A ยืนยันตัวตน",
        "desc": "สำเนาบัตรประชาชน ผู้ค้ำประกัน (ถ้ามี)",
        "targetName": "สำเนาบัตร ปชช.ผู้ค้ำ",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "A03",
        "group": "A ยืนยันตัวตน",
        "desc": "สำเนาทะเบียนบ้าน ผู้กู้",
        "targetName": "สำเนาทะเบียนบ้านผู้กู้",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "A04",
        "group": "A ยืนยันตัวตน",
        "desc": "สำเนาทะเบียนบ้าน ผู้ค้ำ (ถ้ามี)",
        "targetName": "สำเนาทะเบียนบ้านผู้ค้ำ",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "A05",
        "group": "A ยืนยันตัวตน",
        "desc": "ใบเปลี่ยนชื่อ-นามสกุล (ถ้ามี)",
        "targetName": "ใบเปลี่ยนชื่อนามสกุล",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "A06",
        "group": "A ยืนยันตัวตน",
        "desc": "รูปถ่ายพนักงานยืนคู่กับลูกค้าแสดงบัตรประชาชน",
        "targetName": "รูปยืนยันตัวตน",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B26",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปหลังรถเห็นป้ายทะเบียน พร้อม เซลฟี่-ถือบัตรพนักงาน",
        "targetName": "รูปรถ 1",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B27",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปหน้ารถ",
        "targetName": "รูปรถ 2",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B28",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปหน้ารถ - เฉียงซ้าย 45 องศา",
        "targetName": "รูปรถ 3",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B29",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปหน้ารถ – เฉียงขวา 45 องศา",
        "targetName": "รูปรถ 4",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B30",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปหลังรถ - เฉียงซ้าย 45 องศา",
        "targetName": "รูปรถ 5",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B31",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปหลังรถ - เฉียงขวา 45 องศา",
        "targetName": "รูปรถ 6",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B32",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปเลขไมล์",
        "targetName": "รูปรถ 7",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B33",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปเลขตัวถัง/คัสซี",
        "targetName": "รูปรถ 8",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B34",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปเลขเครื่องยนต์",
        "targetName": "รูปรถ 9",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B35",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปอุปกรณ์ต่อพ่วง (ถ้ามี)",
        "targetName": "รูปรถ 10",
        "format": "JPG",
        "mandatory": false
      },
      {
        "code": "B101",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปถ่ายเล่มทะเบียน หน้าปก",
        "targetName": "เล่มหน้าปก",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B102",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปถ่ายเล่มทะเบียน หน้ารายการจดทะเบียน",
        "targetName": "เล่มหน้ารายการ",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B103",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปถ่ายเล่มทะเบียน หน้ากลางเล่ม",
        "targetName": "เล่มหน้ากลาง",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B104",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปถ่ายเล่มทะเบียน หน้ารายการภาษี",
        "targetName": "เล่มหน้าภาษี",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B105",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปถ่ายเล่มทะเบียน หน้าบันทึกเจ้าหน้าที่",
        "targetName": "เล่มหน้าบันทึก",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B106",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "ผลเช็คต้น (ตามเงื่อนไข)",
        "targetName": "เช็คต้น",
        "format": "JPG",
        "mandatory": false
      },
      {
        "code": "B107",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปภาพป้ายภาษี",
        "targetName": "ป้ายภาษี",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B108",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "หน้าตรวจสอบการชำระภาษีจากเว็บกรมการขนส่งทางบก",
        "targetName": "เว็บขนส่ง",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "C01",
        "group": "C พิจารณาอนุมัติสินเชื่อ",
        "desc": "สำเนาสมุดคู่ฝากธนาคารเพื่อใช้ในการโอนเงิน (บัญชีลูกค้าเท่านั้น)",
        "targetName": "สำเนาบัญชีธนาคาร",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C04",
        "group": "C พิจารณาอนุมัติสินเชื่อ",
        "desc": "หนังสือติดตามทวงถามหนี้ (หนังสือให้ติดตามทวงถามหนี้)",
        "targetName": "หนังสือให้ติดตามทวงถามหนี้",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "AA07",
        "group": "C พิจารณาอนุมัติสินเชื่อ",
        "desc": "หนังสือมอบอำนาจ (ใบมอบอำนาจ)",
        "targetName": "หนังสือมอบอำนาจ",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "AA08",
        "group": "C พิจารณาอนุมัติสินเชื่อ",
        "desc": "แบบคำขอโอนและรับโอน (ใบคำขอโอน)",
        "targetName": "แบบคำขอโอนรับโอน",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "AA12",
        "group": "C พิจารณาอนุมัติสินเชื่อ",
        "desc": "ใบรับมอบสินค้า (สำหรับรถ)",
        "targetName": "ใบรับมอบสินค้า",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C05",
        "group": "C พิจารณาอนุมัติสินเชื่อ",
        "desc": "แบบฟอร์มตรวจที่พักอาศัย (ถ้ามี)",
        "targetName": "แบบฟอร์มตรวจที่พักอาศัย",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C06",
        "group": "C พิจารณาอนุมัติสินเชื่อ",
        "desc": "อีเมลผล ABC (ถ้ามี)",
        "targetName": "ผล ABC",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C101",
        "group": "C1 รายได้",
        "desc": "แบบฟอร์มประเมินรายได้ ผู้กู้",
        "targetName": "ประเมินรายได้ผู้กู้",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "C102",
        "group": "C1 รายได้",
        "desc": "แบบฟอร์มประเมินรายได้ ผู้ค้ำ (ถ้ามี)",
        "targetName": "ประเมินรายได้ผู้ค้ำ",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C105",
        "group": "C1 รายได้",
        "desc": "เอกสารรายได้ ของผู้กู้ (สลิปเงินเดือน / Bank Statement / ใบประทวน)",
        "targetName": "เอกสารรายได้ผู้กู้",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C106",
        "group": "C1 รายได้",
        "desc": "เอกสารรายได้ ของผู้ค้ำ (ถ้ามี) (สลิปเงินเดือน / Bank Statement)",
        "targetName": "เอกสารรายได้ผู้ค้ำ",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C107",
        "group": "C1 รายได้",
        "desc": "แบบฟอร์มตรวจสอบภาคสนาม และข้อมูลบุคคลอ้างอิง",
        "targetName": "ตรวจสอบภาคสนามและบุคคลอ้างอิง",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C201",
        "group": "C2 ยืนยันการประกอบอาชีพ",
        "desc": "รูปถ่ายกิจการ ของผู้กู้ (Time Stamp)",
        "targetName": "รูปถ่ายกิจการผู้กู้",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "C202",
        "group": "C2 ยืนยันการประกอบอาชีพ",
        "desc": "รูปถ่ายกิจการ ของผู้ค้ำ (ถ้ามี) (Time Stamp)",
        "targetName": "รูปถ่ายกิจการผู้ค้ำ",
        "format": "JPG",
        "mandatory": false
      },
      {
        "code": "C305",
        "group": "C3 เอกสารเพิ่มเติม รีไฟแนนซ์/ต่อสัญญา",
        "desc": "สัญญาคู่ฉบับไฟแนนซ์เดิม เช่น สัญญาเช่าซื้อ / สัญญาเงินกู้ / การ์ดค่างวด",
        "targetName": "สัญญาคู่ฉบับไฟแนนซ์เดิม",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C306",
        "group": "C3 เอกสารเพิ่มเติม รีไฟแนนซ์/ต่อสัญญา",
        "desc": "ใบเสร็จชำระค่างวด",
        "targetName": "ใบเสร็จชำระค่างวด",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "C307",
        "group": "C3 เอกสารเพิ่มเติม รีไฟแนนซ์/ต่อสัญญา",
        "desc": "ใบสอบถามยอดหนี้ไฟแนนซ์เดิม",
        "targetName": "ใบสอบถามยอดหนี้",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "C308",
        "group": "C3 เอกสารเพิ่มเติม รีไฟแนนซ์/ต่อสัญญา",
        "desc": "ใบเรียกเก็บดอกเบี้ยสะสม (เฉพาะลูกค้า Top up ของ AutoX)",
        "targetName": "ใบเรียกเก็บดอกเบี้ยสะสม",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "C501",
        "group": "C5 เอกสารรถเกษตรใหม่",
        "desc": "เอกสารแสดงกรรมสิทธิ์ที่ดิน หรือสัญญาเช่าที่ดินที่ชัดเจน",
        "targetName": "เอกสารสิทธิ์ที่ดิน",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "C502",
        "group": "C5 เอกสารรถเกษตรใหม่",
        "desc": "ใบเสนอราคาจากดีลเลอร์",
        "targetName": "ใบเสนอราคาจากดีลเลอร์",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "C503",
        "group": "C5 เอกสารรถเกษตรใหม่",
        "desc": "สำเนาชุดแจ้งจำหน่าย (เฉพาะกรณีรถเกษตรใหม่)",
        "targetName": "สำเนาชุดแจ้งจำหน่าย",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "C504",
        "group": "C5 เอกสารรถเกษตรใหม่",
        "desc": "แบบฟอร์มการแจ้งการเก็บรวบรวมใช้และเปิดเผยข้อมูลส่วนบุคคล (PDPA)",
        "targetName": "แบบฟอร์มการเก็บรวบรวมข้อมูลส่วนบุคคล",
        "format": "JPG",
        "mandatory": false
      },
      {
        "code": "D01",
        "group": "D เอกสารอนุโลม",
        "desc": "อนุโลม ต่อสัญญา One-Time หรือ รายปี",
        "targetName": "อนุโลมต่อสัญญา",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "AA01",
        "group": "AA สัญญาสำหรับผู้กู้",
        "desc": "สัญญากู้เงิน (ฉบับที่ลูกค้าต้องเซ็นลงนาม)",
        "targetName": "สัญญากู้เงิน",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "AA09",
        "group": "AA สัญญาสำหรับผู้กู้",
        "desc": "ตารางผ่อนชำระ (ลูกค้าเซ็นทุกหน้า)",
        "targetName": "ตารางผ่อนชำระ",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "AA02",
        "group": "AA สัญญาสำหรับผู้กู้",
        "desc": "ใบรับเงินกู้",
        "targetName": "ใบรับเงินกู้",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "AA11",
        "group": "AA สัญญาสำหรับผู้กู้",
        "desc": "Checklist เอกสารมอบให้ลูกค้าทำสินเชื่อ",
        "targetName": "เอกสารมอบให้ลูกค้า",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "C304",
        "group": "C3 เอกสารเพิ่มเติม รีไฟแนนซ์/ต่อสัญญา",
        "desc": "หนังสือส่งมอบใบคู่มือจดทะเบียนรถ",
        "targetName": "หนังสือส่งมอบใบคู่มือจดทะเบียนรถ",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "A023",
        "group": "A ยืนยันตัวตน",
        "desc": "หนังสือมอบอำนาจ (สำหรับรีไฟแนนซ์)",
        "targetName": "หนังสือมอบอำนาจรีไฟแนนซ์",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "BB01",
        "group": "BB สัญญาสำหรับผู้ค้ำประกัน",
        "desc": "สัญญาค้ำประกัน",
        "targetName": "สัญญาค้ำ",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "BB02",
        "group": "BB สัญญาสำหรับผู้ค้ำประกัน",
        "desc": "คำเตือนสำหรับผู้ค้ำประกัน",
        "targetName": "คำเตือนผู้ค้ำ",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "CC03",
        "group": "CC Sales Sheet",
        "desc": "Sale Sheet (มีลายเซ็นผู้กู้ลงนาม)",
        "targetName": "Sale Sheet",
        "format": "JPG",
        "mandatory": true
      }
    ]
  },
  "land": {
    "id": "land",
    "name": "สินเชื่อที่ดิน",
    "icon": "🏠",
    "subTypes": [
      {
        "id": "land_pledge",
        "name": "🟢 จำนำโฉนด"
      },
      {
        "id": "land_refinance_pledge",
        "name": "🔵 รีไฟแนนซ์จำนำ"
      },
      {
        "id": "land_mortgage",
        "name": "🟣 จำนองที่ดิน"
      },
      {
        "id": "land_refinance_mortgage",
        "name": "🟠 รีไฟแนนซ์จำนอง"
      },
      {
        "id": "land_topup",
        "name": "🟡 Top-up (กู้เพิ่ม)"
      }
    ],
    "items": [
      {
        "code": "A01",
        "group": "A ยืนยันตัวตน",
        "desc": "สำเนาบัตรประชาชน ผู้กู้",
        "targetName": "สำเนาบัตร ปชช.ผู้กู้",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "A02",
        "group": "A ยืนยันตัวตน",
        "desc": "สำเนาบัตรประชาชน ผู้ค้ำประกัน (ถ้ามี)",
        "targetName": "สำเนาบัตร ปชช.ผู้ค้ำ",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "A03",
        "group": "A ยืนยันตัวตน",
        "desc": "สำเนาทะเบียนบ้าน ผู้กู้",
        "targetName": "สำเนาทะเบียนบ้านผู้กู้",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "A04",
        "group": "A ยืนยันตัวตน",
        "desc": "สำเนาทะเบียนบ้าน ผู้ค้ำ (ถ้ามี)",
        "targetName": "สำเนาทะเบียนบ้านผู้ค้ำ",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "A05",
        "group": "A ยืนยันตัวตน",
        "desc": "ใบเปลี่ยนชื่อ-นามสกุล (ถ้ามี)",
        "targetName": "ใบเปลี่ยนชื่อนามสกุล",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "A06",
        "group": "A ยืนยันตัวตน",
        "desc": "รูปถ่ายพนักงานยืนคู่กับลูกค้าแสดงบัตรประชาชน",
        "targetName": "รูปยืนยันตัวตน",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B36",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปหลักประกัน (ที่ดิน/สิ่งปลูกสร้าง)",
        "targetName": "รูปหลักประกัน 1-10",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B37",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปทางเข้าหลักประกัน (การเดินทางถึงหลักประกัน)",
        "targetName": "รูปทางเข้าหลักประกัน",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "B201",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปถ่ายโฉนดที่ดิน ด้านหน้า",
        "targetName": "หน้าโฉนด",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B202",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปถ่ายโฉนดที่ดิน ด้านหลัง",
        "targetName": "หลังโฉนด",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B203",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปถ่ายโฉนดที่ดิน ลายน้ำ",
        "targetName": "ลายน้ำโฉนด",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B204",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "ใบคู่คัดสำเนาโฉนดฉบับสำนักงานที่ดิน",
        "targetName": "สำเนาโฉนด",
        "format": "JPG",
        "mandatory": false
      },
      {
        "code": "B205",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "ใบประเมินจากกรมที่ดิน (อายุเอกสารไม่เกิน 30 วัน)",
        "targetName": "ประเมินจากกรมที่ดิน",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B206",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "ใบประเมินจาก SCB หรือบริษัทประเมินนอกตามที่กำหนด (อายุไม่เกิน 1 ปี)",
        "targetName": "ประเมินภายนอก",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "B207",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "ใบเสร็จชมพูฟ้า",
        "targetName": "ใบเสร็จชมพูฟ้า",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B208",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "ใบปลอดภาระนิติบุคคลอาคารชุด (กรณีโฉนด อช2)",
        "targetName": "ใบปลอดภาระ อช2",
        "format": "JPG",
        "mandatory": false
      },
      {
        "code": "B209",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "บิลค่าน้ำค่าไฟ (กรณีที่ดินพร้อมสิ่งปลูกสร้าง)",
        "targetName": "บิลน้ำไฟ",
        "format": "JPG",
        "mandatory": false
      },
      {
        "code": "B210",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "ใบระวาง (อายุเอกสารไม่เกิน 30 วัน กรณีโฉนด นส.3ก)",
        "targetName": "ใบระวาง",
        "format": "JPG",
        "mandatory": false
      },
      {
        "code": "B211",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "รูปถ่ายพนักงานเซลฟี่กับกรมที่ดิน (Time Stamp)",
        "targetName": "เซลฟี่กับกรมที่ดิน",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B212",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "ตรวจสอบเว็บไซต์ Landmap",
        "targetName": "Landmap",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "B213",
        "group": "B ตรวจสอบหลักประกัน",
        "desc": "ตรวจสอบจากเว็บไซต์กรมธนารักษ์",
        "targetName": "ธนารักษ์",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "C01",
        "group": "C พิจารณาอนุมัติสินเชื่อ",
        "desc": "สำเนาสมุดคู่ฝากธนาคารเพื่อใช้ในการโอนเงิน (บัญชีลูกค้าเท่านั้น)",
        "targetName": "สำเนาบัญชีธนาคาร",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "C02",
        "group": "C พิจารณาอนุมัติสินเชื่อ",
        "desc": "เอกสารยินยอมนิติกรรมคู่สมรส",
        "targetName": "เอกสารยินยอมนิติกรรมคู่สมรส",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C03",
        "group": "C พิจารณาอนุมัติสินเชื่อ",
        "desc": "สำเนาทะเบียนคู่สมรส (กรณีมี)",
        "targetName": "สำเนาทะเบียนคู่สมรส",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C04",
        "group": "C พิจารณาอนุมัติสินเชื่อ",
        "desc": "หนังสือติดตามทวงถามหนี้ (หนังสือให้ติดตามทวงถามหนี้)",
        "targetName": "หนังสือให้ติดตามทวงถามหนี้",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "AA07",
        "group": "C พิจารณาอนุมัติสินเชื่อ",
        "desc": "หนังสือมอบอำนาจ (ใบมอบอำนาจ)",
        "targetName": "หนังสือมอบอำนาจ",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "AA08",
        "group": "C พิจารณาอนุมัติสินเชื่อ",
        "desc": "แบบคำขอโอนและรับโอน (ใบคำขอโอน)",
        "targetName": "แบบคำขอโอนรับโอน",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "C05",
        "group": "C พิจารณาอนุมัติสินเชื่อ",
        "desc": "แบบฟอร์มตรวจที่พักอาศัย (ถ้ามี)",
        "targetName": "แบบฟอร์มตรวจที่พักอาศัย",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C06",
        "group": "C พิจารณาอนุมัติสินเชื่อ",
        "desc": "อีเมลผล ABC (ถ้ามี)",
        "targetName": "ผล ABC",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C101",
        "group": "C1 รายได้",
        "desc": "แบบฟอร์มประเมินรายได้ ผู้กู้",
        "targetName": "ประเมินรายได้ผู้กู้",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "C102",
        "group": "C1 รายได้",
        "desc": "แบบฟอร์มประเมินรายได้ ผู้ค้ำ (ถ้ามี)",
        "targetName": "ประเมินรายได้ผู้ค้ำ",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C105",
        "group": "C1 รายได้",
        "desc": "เอกสารรายได้ ของผู้กู้ (สลิปเงินเดือน / Bank Statement / ใบประทวน)",
        "targetName": "เอกสารรายได้ผู้กู้",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C106",
        "group": "C1 รายได้",
        "desc": "เอกสารรายได้ ของผู้ค้ำ (ถ้ามี) (สลิปเงินเดือน / Bank Statement)",
        "targetName": "เอกสารรายได้ผู้ค้ำ",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C107",
        "group": "C1 รายได้",
        "desc": "แบบฟอร์มตรวจสอบภาคสนาม และข้อมูลบุคคลอ้างอิง",
        "targetName": "ตรวจสอบภาคสนามและบุคคลอ้างอิง",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C201",
        "group": "C2 ยืนยันการประกอบอาชีพ",
        "desc": "รูปถ่ายกิจการ ของผู้กู้ (Time Stamp)",
        "targetName": "รูปถ่ายกิจการผู้กู้",
        "format": "JPG",
        "mandatory": true
      },
      {
        "code": "C202",
        "group": "C2 ยืนยันการประกอบอาชีพ",
        "desc": "รูปถ่ายกิจการ ของผู้ค้ำ (ถ้ามี) (Time Stamp)",
        "targetName": "รูปถ่ายกิจการผู้ค้ำ",
        "format": "JPG",
        "mandatory": false
      },
      {
        "code": "C305",
        "group": "C3 เอกสารเพิ่มเติม รีไฟแนนซ์/ต่อสัญญา",
        "desc": "สัญญาคู่ฉบับไฟแนนซ์เดิม เช่น สัญญาเช่าซื้อ / สัญญาเงินกู้ / การ์ดค่างวด",
        "targetName": "สัญญาคู่ฉบับไฟแนนซ์เดิม",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "C306",
        "group": "C3 เอกสารเพิ่มเติม รีไฟแนนซ์/ต่อสัญญา",
        "desc": "ใบเสร็จชำระค่างวด",
        "targetName": "ใบเสร็จชำระค่างวด",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "C307",
        "group": "C3 เอกสารเพิ่มเติม รีไฟแนนซ์/ต่อสัญญา",
        "desc": "ใบสอบถามยอดหนี้ไฟแนนซ์เดิม",
        "targetName": "ใบสอบถามยอดหนี้",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "C308",
        "group": "C3 เอกสารเพิ่มเติม รีไฟแนนซ์/ต่อสัญญา",
        "desc": "ใบเรียกเก็บดอกเบี้ยสะสม (เฉพาะลูกค้า Top up ของ AutoX)",
        "targetName": "ใบเรียกเก็บดอกเบี้ยสะสม",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "D01",
        "group": "D เอกสารอนุโลม",
        "desc": "อนุโลม ต่อสัญญา One-Time หรือ รายปี",
        "targetName": "อนุโลมต่อสัญญา",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "D02",
        "group": "D เอกสารอนุโลม",
        "desc": "อนุโลม ผู้กู้ทำหรือไม่ทำประกัน (PA Safety Loan) / ประกันภัย",
        "targetName": "ประกัน",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "AA01",
        "group": "AA สัญญาสำหรับผู้กู้",
        "desc": "สัญญากู้เงิน (ฉบับที่ลูกค้าต้องเซ็นลงนาม)",
        "targetName": "สัญญากู้เงิน",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "AA09",
        "group": "AA สัญญาสำหรับผู้กู้",
        "desc": "ตารางผ่อนชำระ (ลูกค้าเซ็นทุกหน้า)",
        "targetName": "ตารางผ่อนชำระ",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "AA021",
        "group": "AA สัญญาสำหรับผู้กู้",
        "desc": "รายละเอียดหลักประกัน (เอกสารแนบ ก.)",
        "targetName": "เอกสารแนบ ก.",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "AA022",
        "group": "AA สัญญาสำหรับผู้กู้",
        "desc": "หนังสือสัญญาต่อท้ายสัญญาจำนองที่ดิน/ห้องชุดเป็นประกัน",
        "targetName": "สัญญาต่อท้ายสัญญาจำนอง",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "AA02",
        "group": "AA สัญญาสำหรับผู้กู้",
        "desc": "ใบรับเงินกู้",
        "targetName": "ใบรับเงินกู้",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "AA023",
        "group": "A ยืนยันตัวตน",
        "desc": "หนังสือมอบอำนาจ (สำหรับรีไฟแนนซ์)",
        "targetName": "หนังสือมอบอำนาจรีไฟแนนซ์",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "AA11",
        "group": "AA สัญญาสำหรับผู้กู้",
        "desc": "Checklist เอกสารมอบให้ลูกค้าทำสินเชื่อ",
        "targetName": "เอกสารมอบให้ลูกค้า",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "AA10",
        "group": "AA สัญญาสำหรับผู้กู้",
        "desc": "ตั๋วสัญญาใช้เงิน",
        "targetName": "ตั๋วใช้เงิน",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "DD01",
        "group": "DD เอกสารหลังจดจำนองที่ดิน",
        "desc": "หนังสือสัญญาจำนองที่ดิน",
        "targetName": "สัญญาจำนอง",
        "format": "PDF",
        "mandatory": false
      },
      {
        "code": "DD02",
        "group": "DD เอกสารหลังจดจำนองที่ดิน",
        "desc": "ใบเสร็จจดจำนอง (ชมพู ฟ้า)",
        "targetName": "ใบเสร็จจดจำนอง",
        "format": "JPG",
        "mandatory": false
      },
      {
        "code": "DD03",
        "group": "DD เอกสารหลังจดจำนองที่ดิน",
        "desc": "รูปถ่ายโฉนดที่ดินด้านหลัง ที่มีสลักหลังบริษัทผู้รับจำนอง",
        "targetName": "โฉนดที่ดินสลักหลัง",
        "format": "JPG",
        "mandatory": false
      },
      {
        "code": "BB01",
        "group": "BB สัญญาสำหรับผู้ค้ำประกัน",
        "desc": "สัญญาค้ำประกัน",
        "targetName": "สัญญาค้ำ",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "BB02",
        "group": "BB สัญญาสำหรับผู้ค้ำประกัน",
        "desc": "คำเตือนสำหรับผู้ค้ำประกัน",
        "targetName": "คำเตือนผู้ค้ำ",
        "format": "PDF",
        "mandatory": true
      },
      {
        "code": "CC03",
        "group": "CC Sales Sheet",
        "desc": "Sale Sheet (มีลายเซ็นผู้กู้ลงนาม)",
        "targetName": "Sale Sheet",
        "format": "JPG",
        "mandatory": true
      }
    ]
  }
};
