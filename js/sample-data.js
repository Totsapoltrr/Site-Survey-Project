/**
 * sample-data.js - Initial demo dataset (English)
 */
const SAMPLE_SURVEYS = [
  {
    id: "srv_sample_01",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    fields: {
      projectName: "Executive Town Hall AV System Upgrade - 15th Floor",
      customer: "Thai Innovation Corp.",
      salesOwner: "John Smith",
      engineeringOwner: "David Tan",
      surveyDate: "2026-08-10",
      proposalDueDate: "2026-08-25",
      siteLocation: "Headquarters Tower, Bangkok",
      projectType: "Renovation + AV System",
      audioChannels: "5.1 Surround + 4 Ceiling Zones",
      classificationOther: "Hybrid Studio",
      budgetRange: "$45,000 - $65,000",
      leadTime: "8 Weeks",
      preferredBrand: "Shure, Extron, Samsung, Bose",
      brandPreference: "Wireless ceiling microphones and P1.5 Fine Pitch LED Wall",
      width: "12.5",
      length: "18.0",
      height: "3.8",
      capacity: "120",
      viewingDistance: "3.5 - 15 meters",
      ceilingType: "T-Bar & Acoustic Panel",
      floorType: "Carpet Tile",
      wallMaterial: "Acoustic Fabric + Drywall",
      additionalInfo: "East-facing glass wall has direct sunlight, motorized blackout shades required",
      siteConstraints: "Installation permitted only on weekends and after 18:00 on weekdays",
      scopeOther: "MS Teams/Zoom Room system with auto-tracking PTZ cameras",
      siteRisk: "HVAC noise on northern zone needs building management acoustic dampening",
      preparedBy: "David Tan",
      preparedDate: "2026-08-10",
      reviewedBy: "John Smith",
      reviewedDate: "2026-08-11",
      approvedBy: "Robert Vance",
      approvedDate: "2026-08-12"
    },
    groups: {
      classification: ["Town Hall", "Meeting Room", "LED Wall"],
      priority: ["Timeline"],
      systemGrade: ["Premium Solutions"],
      warranty: ["3 Years"],
      powerAvailable: ["Yes"],
      networkAvailable: ["Yes"],
      scope: ["Renovation Only", "Audio", "Video", "LED", "Lighting", "Control", "Conference"],
      conferenceType: ["Hybrid"],
      deliverables: ["BOQ", "System Diagram", "Layout Drawing", "Perspective"]
    },
    tech: [
      { req: "Acoustic Interior", use: "Reduce reverberation RT60 < 0.8s", eq: "Existing panels deteriorated" },
      { req: "Main LED Screen P1.5", use: "Town Hall & Presentations", eq: "Existing projector has insufficient lumens" },
      { req: "Ceiling Array Microphones", use: "Auto voice capture for all participants", eq: "Table wired mics create clutter" }
    ],
    images: []
  }
];
