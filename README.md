# Site Survey & Project Requirement Management System 📋🚀

ระบบบันทึก จัดการ และออกรายงานการสำรวจหน้างาน (AV / IT / Engineering Requirement) พัฒนาให้เป็น Web Application พร้อมใช้งานออนไลน์ผ่าน **GitHub Pages** สามารถเข้าถึงได้ทุกที่ทุกเวลา ทั้งบนมือถือ แท็บเล็ต และคอมพิวเตอร์

---

## 🌟 ฟีเจอร์หลัก (Key Features)

1. **📋 หน้ารายการโครงการ (Project List)**
   - แสดงรายการงานสำรวจทั้งหมด (ชื่องาน, ลูกค้า, สถานที่, วันที่สำรวจ, จำนวนรูปภาพ)
   - ช่องค้นหา (Search) ค้นหาจากชื่องาน หรือชื่อลูกค้าได้ทันที
   - ปุ่ม Action: ✏️ แก้ไขต่อ, 👁 พรีวิวเอกสาร, 🖨 พิมพ์ PDF, 📋 โคลนโครงการ (Duplicate), 🗑 ลบ

2. **✏️ แบบฟอร์มสำรวจหน้างาน 8 หมวดหมู่ (Form View)**
   - โครงสร้างและข้อมูลครบถ้วนตามมาตรฐานเดิม
   - ปรับปุ่มเลือกเป็น **Pill Touch Buttons** กดง่ายบนมือถือ
   - ระบบ Auto-Save บันทึกอัตโนมัติลงฐานข้อมูล ป้องกันข้อมูลสูญหาย

3. **📷 ระบบแนบรูปภาพหน้างาน**
   - แตะถ่ายรูปจากกล้องมือถือ หรือเลือกหลายๆ รูปพร้อมกันได้
   - **Auto Resize**: ย่อขนาดรูปให้อัตโนมัติ (1600px Quality 0.82) เพื่อประหยัดพื้นที่และทำงานลื่นไหล
   - ใส่คำอธิบายใต้รูปภาพ (Caption) ได้
   - **Lightbox Viewer**: แตะที่รูปเพื่อดูภาพขนาดใหญ่ ซูมดูรายละเอียด และกดเลื่อนรูปซ้าย-ขวาได้

4. **🖨 พรีวิวเอกสาร & Export PDF ทางการ (A4 Format)**
   - สลับดูเอกสารทางการได้ทันที
   - จัดหน้าตาราง กริดรูปภาพ และช่องลงนามแบบ A4 สมบูรณ์แบบ
   - รองรับการสั่งพิมพ์ออกเป็นไฟล์ PDF หรือพิมพ์ลงกระดาษโดยตรง

5. **🔄 ระบบสำรองข้อมูล & นำเข้า (Backup & Transfer)**
   - ดาวน์โหลดไฟล์สำรอง `.json` ของทุกโครงการเก็บไว้
   - นำเข้าไฟล์สำรองเพื่อกู้คืนหรือย้ายเครื่องได้ง่ายดาย

---

## 🚀 วิธีนำขึ้น GitHub และเปิดใช้งาน GitHub Pages

### ขั้นตอนที่ 1: สร้าง Repository บน GitHub
1. เข้าเว็บไซต์ [https://github.com](https://github.com) และเข้าสู่ระบบ
2. กดปุ่ม **New** เพื่อสร้าง Repository ใหม่ (เช่น ตั้งชื่อว่า `site-survey-project`)
3. เลือกเป็น **Public** แล้วกดปุ่ม **Create repository**

---

### ขั้นตอนที่ 2: อัปโหลดไฟล์ขึ้น GitHub

#### วิธีที่ A: อัปโหลดผ่านหน้าเว็บ GitHub (ง่ายที่สุด ไม่ต้องใช้คำสั่ง)
1. ในหน้า Repository บน GitHub ให้คลิกที่ **"uploading an existing file"**
2. ลากไฟล์และโฟลเดอร์ทั้งหมดในโฟลเดอร์นี้ขึ้นไป:
   - `index.html`
   - โฟลเดอร์ `css/` (ข้างในมี `style.css`)
   - โฟลเดอร์ `js/` (ข้างในมี `app.js`, `db.js`, `sample-data.js`)
   - `README.md`
3. กดปุ่ม **Commit changes**

#### วิธีที่ B: อัปโหลดผ่าน Git Command Line
```bash
git init
git add .
git commit -m "Initial commit - Site survey project"
git branch -M main
git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git
git push -u origin main
```

---

### ขั้นตอนที่ 3: เปิดใช้งาน GitHub Pages (เพียง 2 คลิก)
1. ในหน้า Repository บน GitHub ให้ไปที่ **Settings** > **Pages**
2. ใต้หัวข้อ **Build and deployment > Branch**:
   - เลือก Branch เป็น **`main`**
   - โฟลเดอร์เลือกเป็น **`/(root)`**
3. กดปุ่ม **Save**
4. รอประมาณ 1-2 นาที คุณจะได้ลิงก์เว็บไซต์พร้อมใช้งาน เช่น:
   ```
   https://<YOUR-USERNAME>.github.io/<YOUR-REPO-NAME>/
   ```

---

## 📂 โครงสร้างไฟล์ในโปรเจกต์

```
site-survey-project/
├── index.html            # โครงสร้างหน้าเว็บหลัก (หน้ารวมงาน, แบบฟอร์ม, พรีวิว)
├── README.md             # คู่มือการใช้งานและการนำขึ้น GitHub Pages
├── css/
│   └── style.css         # สไตล์การตกแต่งและจัดหน้า A4 Print
└── js/
    ├── app.js            # ตรรกะการทำงานหลัก (View Switch, Form, Image Resize, Lightbox)
    ├── db.js             # ตัวจัดการฐานข้อมูล IndexedDB เก็บข้อมูลโครงการและรูปภาพ
    └── sample-data.js    # ข้อมูลตัวอย่างเริ่มต้น
```
