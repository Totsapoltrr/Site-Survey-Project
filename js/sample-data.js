/**
 * sample-data.js - Initial demo dataset
 */
const SAMPLE_SURVEYS = [
  {
    id: "srv_sample_01",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    fields: {
      projectName: "โครงการปรับปรุงระบบ AV ห้องประชุมใหญ่ Town Hall ชั้น 15",
      customer: "บริษัท นวัตกรรมไทย จำกัด (มหาชน)",
      salesOwner: "สมชาย ใจดี",
      engineeringOwner: "วิศวกร ธนวัฒน์",
      surveyDate: "2026-08-10",
      proposalDueDate: "2026-08-25",
      siteLocation: "อาคารวิทยุการบิน กรุงเทพฯ",
      projectType: "Renovation + AV System",
      audioChannels: "5.1 Surround + 4 Ceiling Zones",
      classificationOther: "Online Hybrid Studio",
      budgetRange: "1,500,000 - 2,200,000 บาท",
      leadTime: "8 สัปดาห์",
      preferredBrand: "Shure, Extron, Samsung, Bose",
      brandPreference: "ลูกค้าเน้นไมค์ไร้สายคุณภาพสูงและจอ LED P1.5",
      width: "12.5",
      length: "18.0",
      height: "3.8",
      capacity: "120",
      viewingDistance: "3.5 - 15 เมตร",
      ceilingType: "T-Bar & Acoustic Panel",
      floorType: "Carpet Tile",
      wallMaterial: "Acoustic Fabric + Drywall",
      additionalInfo: "ห้องมีแสงธรรมชาติเข้าจากฝั่งทิศตะวันออก ต้องมีม่านกันแสง",
      siteConstraints: "เข้าติดตั้งได้เฉพาะวันเสาร์-อาทิตย์ และหลัง 18:00 น.",
      scopeOther: "ระบบ Video Conference Teams/Zoom พร้อม Tracking Camera",
      siteRisk: "ท่อแอร์เดิมเสียงดังเล็กน้อย ต้องประสานงานฝ่ายอาคารปรับปรุง และมีงานเจาะคานคอนกรีต",
      preparedBy: "วิศวกร ธนวัฒน์",
      preparedDate: "2026-08-10",
      reviewedBy: "สมชาย ใจดี",
      reviewedDate: "2026-08-11",
      approvedBy: "ผู้จัดการ วิชัย",
      approvedDate: "2026-08-12"
    },
    groups: {
      classification: ["Town Hall", "Meeting Room", "LED Wall"],
      priority: ["Timeline"],
      systemGrade: ["Premium Solutions"],
      warranty: ["3 Years"],
      powerAvailable: ["Y"],
      networkAvailable: ["Y"],
      scope: ["Renovation Only", "Audio", "Video", "LED", "Lighting", "Control", "Conference"],
      conferenceType: ["Hybrid"],
      deliverables: ["BOQ", "System Diagram", "Layout Drawing", "Perspective"]
    },
    tech: [
      { req: "Acoustic Interior", use: "ลดเสียงสะท้อน RT60 ไม่เกิน 0.8s", eq: "ผนังดูดซับเสียงเดิมชำรุด" },
      { req: "Main LED Screen P1.5", use: "แสดงผลงาน Town Hall & Presentation", eq: "Projector เดิมความสว่างไม่พอ" },
      { req: "Ceiling Array Mic", use: "รับเสียงพูดของผู้เข้าร่วมประชุมอัตโนมัติ", eq: "ไมค์สายเดิมระโยงระยาง" }
    ],
    images: []
  }
];
