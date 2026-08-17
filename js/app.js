/**
 * app.js - Application Logic for Site Survey & Project Requirement Management
 */

/* ============================================================
   CONFIG
   ============================================================ */
const CLASSIFICATION = ["Meeting Room","Seminar Room","Auditorium","War Room","Board Room","Control Room","Town Hall","Hotel","Theatre","Education","Hospital","Restaurant","Stadium","Digital Signage","LED Wall","BGM/PA","BGM/Indoor","BGM/Outdoor","Home Theater","KTV Room","KTV Mobile Set","Room Booking"];
const PRIORITY = ["Budget","Timeline"];
const SYSTEM_GRADE = ["Save Budget Solutions","Standard Solutions","Premium Solutions"];
const WARRANTY = ["1 Year","2 Years","3 Years","5 Years"];
const YN = ["Y","N"];
const SCOPE = ["New Room Design + Interior","Renovation + Interior","Renovation Only","Audio","Video","LED","Lighting","Control","TV","Projector","Motorized Screen","Fixed Screen","Cabinet Screen","Conference"];
const CONFERENCE = ["Online","Offline","Hybrid"];
const DELIVERABLES = ["BOQ","System Diagram","Layout Drawing","Presentation","TOR","AutoCAD","PDF Drawing","Perspective","As-Built"];

/* ============================================================
   STATE
   ============================================================ */
let currentSurveyId = null;
let currentMode = "dashboard"; // 'dashboard' | 'edit' | 'preview'
let images = [];
let lightboxIndex = 0;
let autosaveTimer = null;
let allSurveysCache = [];

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener("DOMContentLoaded", async () => {
  buildAllPills();
  initTechTableDefault();
  initImageDropzone();

  // Load DB and seed sample if empty
  await window.db.isReady;
  const existing = await window.db.getAll();
  if (existing.length === 0 && typeof SAMPLE_SURVEYS !== "undefined") {
    for (const s of SAMPLE_SURVEYS) {
      await window.db.save(s);
    }
  }

  const hash = window.location.hash.replace("#", "");
  if (hash === "new") {
    createNewSurvey();
  } else {
    setMode("dashboard");
  }
});

/* ============================================================
   BUILD PILLS
   ============================================================ */
function buildPills(containerId, options, groupName, type) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = options.map(opt => {
    const id = groupName + "-" + opt.replace(/[^a-zA-Z0-9ก-๙]+/g, "_");
    return `<label class="pill"><input type="${type}" name="${groupName}" value="${escAttr(opt)}" id="${id}"><span>${escHtml(opt)}</span></label>`;
  }).join("");
}

function buildAllPills() {
  buildPills("grp-classification", CLASSIFICATION, "classification", "checkbox");
  buildPills("grp-priority", PRIORITY, "priority", "radio");
  buildPills("grp-systemGrade", SYSTEM_GRADE, "systemGrade", "radio");
  buildPills("grp-warranty", WARRANTY, "warranty", "radio");
  buildPills("grp-powerAvailable", YN, "powerAvailable", "radio");
  buildPills("grp-networkAvailable", YN, "networkAvailable", "radio");
  buildPills("grp-scope", SCOPE, "scope", "checkbox");
  buildPills("grp-conference", CONFERENCE, "conferenceType", "checkbox");
  buildPills("grp-deliverables", DELIVERABLES, "deliverables", "checkbox");
}

/* ============================================================
   VIEW MANAGEMENT
   ============================================================ */
function setMode(mode) {
  currentMode = mode;
  const isDash = mode === "dashboard";
  const isEdit = mode === "edit";
  const isPrev = mode === "preview";

  document.getElementById("dashboardView").hidden = !isDash;
  document.getElementById("editView").hidden = !isEdit;
  document.getElementById("previewView").hidden = !isPrev;

  document.getElementById("tabDashboard").classList.toggle("active", isDash);
  document.getElementById("tabEdit").classList.toggle("active", isEdit);
  document.getElementById("tabPreview").classList.toggle("active", isPrev);

  document.querySelectorAll(".dash-only").forEach(el => el.hidden = !isDash);
  document.querySelectorAll(".edit-preview-only").forEach(el => el.hidden = isDash);

  if (isDash) {
    renderDashboard();
    window.location.hash = "list";
  } else if (isPrev) {
    const data = collectData();
    document.getElementById("docOutput").innerHTML = buildDocHTML(data);
    window.location.hash = "preview";
  } else if (isEdit) {
    window.location.hash = currentSurveyId ? `edit-${currentSurveyId}` : "new";
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ============================================================
   DASHBOARD / PROJECT LIST
   ============================================================ */
async function renderDashboard() {
  allSurveysCache = await window.db.getAll();
  filterDashboard();
}

function filterDashboard() {
  const query = (document.getElementById("dashSearch").value || "").toLowerCase().trim();
  const listContainer = document.getElementById("projectsList");
  const emptyState = document.getElementById("emptyDashboard");

  let filtered = allSurveysCache;

  if (query) {
    filtered = filtered.filter(s => {
      const pName = (s.fields?.projectName || "").toLowerCase();
      const cust = (s.fields?.customer || "").toLowerCase();
      const loc = (s.fields?.siteLocation || "").toLowerCase();
      const date = (s.fields?.surveyDate || "").toLowerCase();
      return pName.includes(query) || cust.includes(query) || loc.includes(query) || date.includes(query);
    });
  }

  if (filtered.length === 0) {
    listContainer.innerHTML = "";
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;
  listContainer.innerHTML = filtered.map(s => {
    const f = s.fields || {};
    const imgCount = (s.images || []).length;
    const updatedDate = s.updatedAt ? new Date(s.updatedAt).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
    const surveyDate = f.surveyDate ? fmtDate(f.surveyDate) : "";

    return `
      <tr>
        <td>
          <span class="p-name">${escHtml(f.projectName || "โครงการไม่ได้ระบุชื่อ")}</span>
          <div class="p-customer">
            <span>🏢 ${escHtml(f.customer || "ไม่ได้ระบุลูกค้า")}</span>
            ${f.siteLocation ? `<span>• 📍 ${escHtml(f.siteLocation)}</span>` : ""}
            ${surveyDate ? `<span>• 📅 สำรวจ: ${surveyDate}</span>` : ""}
            ${imgCount ? `<span class="badge blue">📷 ${imgCount} รูป</span>` : ""}
          </div>
        </td>
        <td style="font-size:.82rem; color:var(--ink-soft);">${updatedDate}</td>
        <td>
          <div class="act-btns">
            <button class="btn small primary" title="เปิดดูและแก้ไขต่อ" onclick="editSurvey('${s.id}')">✏️ แก้ไขต่อ</button>
            <button class="btn small outline-dark" title="ดูเอกสารแบบทางการ" onclick="previewSurvey('${s.id}')">👁 พรีวิว</button>
            <button class="btn small outline-dark" title="พิมพ์เป็น PDF" onclick="printSurvey('${s.id}')">🖨 PDF</button>
            <button class="btn small outline-dark" title="คัดลอกสร้างใหม่" onclick="duplicateSurvey('${s.id}')">📋 โคลน</button>
            <button class="btn small danger" title="ลบแบบสำรวจ" onclick="deleteSurvey('${s.id}')">🗑</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

async function createNewSurvey() {
  currentSurveyId = null;
  clearFormInputs();
  setMode("edit");
  showToast("เปิดแบบฟอร์มใหม่พร้อมกรอกข้อมูล");
}

async function editSurvey(id) {
  const survey = await window.db.getById(id);
  if (!survey) {
    alert("ไม่พบข้อมูลโครงการนี้");
    return;
  }
  currentSurveyId = id;
  applyData(survey);
  setMode("edit");
}

async function previewSurvey(id) {
  const survey = await window.db.getById(id);
  if (!survey) return;
  currentSurveyId = id;
  applyData(survey);
  setMode("preview");
}

async function printSurvey(id) {
  await previewSurvey(id);
  setTimeout(() => window.print(), 150);
}

async function duplicateSurvey(id) {
  if (!confirm("ต้องการคัดลอกโครงการนี้เพื่อสร้างแบบสำรวจใหม่ใช่หรือไม่?")) return;
  await window.db.duplicate(id);
  showToast("คัดลอกโครงการเรียบร้อยแล้ว");
  await renderDashboard();
}

async function deleteSurvey(id) {
  if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบแบบสำรวจนี้?")) return;
  await window.db.delete(id);
  showToast("ลบโครงการเรียบร้อย");
  await renderDashboard();
}

/* ============================================================
   TECH REQUIREMENT TABLE
   ============================================================ */
function addTechRow(data) {
  data = data || { req: "", use: "", eq: "" };
  const tbody = document.getElementById("techBody");
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input type="text" class="tr-req" placeholder="เช่น Acoustic Interior" value="${escAttr(data.req)}"></td>
    <td><input type="text" class="tr-use" placeholder="เช่น ลดเสียงสะท้อน" value="${escAttr(data.use)}"></td>
    <td><input type="text" class="tr-eq" placeholder="เช่น อุปกรณ์เดิม" value="${escAttr(data.eq)}"></td>
    <td class="del"><button type="button" class="icon-del" title="ลบแถว" onclick="this.closest('tr').remove(); scheduleAutosave();">✕</button></td>`;
  tbody.appendChild(tr);
}

function initTechTableDefault() {
  const tbody = document.getElementById("techBody");
  tbody.innerHTML = "";
  ["Acoustic Interior", "Change equipment – Grading station", "Change equipment – Content review station", "", ""].forEach(r => addTechRow({ req: r, use: "", eq: "" }));
}

function collectTechRows() {
  return [...document.querySelectorAll("#techBody tr")].map(tr => ({
    req: tr.querySelector(".tr-req").value.trim(),
    use: tr.querySelector(".tr-use").value.trim(),
    eq: tr.querySelector(".tr-eq").value.trim()
  }));
}

/* ============================================================
   IMAGE HANDLING (Upload, Resize, Gallery, Lightbox)
   ============================================================ */
function initImageDropzone() {
  const dropzone = document.getElementById("dropzone");
  if (!dropzone) return;

  ["dragenter", "dragover"].forEach(ev => dropzone.addEventListener(ev, e => {
    e.preventDefault();
    dropzone.classList.add("drag");
  }));
  ["dragleave", "drop"].forEach(ev => dropzone.addEventListener(ev, e => {
    e.preventDefault();
    dropzone.classList.remove("drag");
  }));
  dropzone.addEventListener("drop", e => {
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  });
}

function handleFiles(fileList) {
  [...fileList].forEach(file => {
    if (!file.type.startsWith("image/")) return;
    resizeImage(file, 1600, 0.82).then(dataUrl => {
      images.push({
        id: "img_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
        dataUrl,
        caption: "",
        name: file.name
      });
      renderGallery();
      scheduleAutosave();
    });
  });
}

function resizeImage(file, maxDim, quality) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w >= h) { h = Math.round(h * (maxDim / w)); w = maxDim; }
          else { w = Math.round(w * (maxDim / h)); h = maxDim; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderGallery() {
  const g = document.getElementById("gallery");
  const empty = document.getElementById("galleryEmpty");
  empty.style.display = images.length ? "none" : "block";
  g.innerHTML = images.map((im, i) => `
    <div class="gitem">
      <div class="thumb-wrap" onclick="openLightbox(${i})">
        <img src="${im.dataUrl}" alt="">
        <div class="thumb-tools">
          <button type="button" title="ลบ" onclick="event.stopPropagation(); removeImage('${im.id}')">✕</button>
        </div>
      </div>
      <input class="cap-input" placeholder="คำอธิบายรูป..." value="${escAttr(im.caption)}" oninput="updateCaption('${im.id}', this.value)">
    </div>`).join("");
}

function removeImage(id) {
  images = images.filter(im => im.id !== id);
  renderGallery();
  scheduleAutosave();
}

function updateCaption(id, val) {
  const im = images.find(x => x.id === id);
  if (im) {
    im.caption = val;
    scheduleAutosave();
  }
}

function openLightbox(i) {
  lightboxIndex = i;
  const im = images[i];
  if (!im) return;
  document.getElementById("lbImg").src = im.dataUrl;
  document.getElementById("lbCap").textContent = im.caption || im.name || "";
  document.getElementById("lightbox").hidden = false;
}

function closeLightbox() {
  document.getElementById("lightbox").hidden = true;
}

function navLightbox(dir) {
  if (images.length === 0) return;
  lightboxIndex = (lightboxIndex + dir + images.length) % images.length;
  openLightbox(lightboxIndex);
}

document.getElementById("lightbox").addEventListener("click", e => {
  if (e.target.id === "lightbox") closeLightbox();
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeLightbox();
  if (!document.getElementById("lightbox").hidden) {
    if (e.key === "ArrowLeft") navLightbox(-1);
    if (e.key === "ArrowRight") navLightbox(1);
  }
});

/* ============================================================
   DATA PERSISTENCE
   ============================================================ */
function textFieldNames() {
  return [...document.querySelectorAll("#editView input[type=text],#editView input[type=number],#editView input[type=date],#editView textarea")]
    .filter(el => el.name).map(el => el.name);
}

function collectData() {
  const data = {
    id: currentSurveyId,
    fields: {},
    groups: {},
    tech: [],
    images: images
  };

  textFieldNames().forEach(n => {
    const el = document.querySelector(`#editView [name="${n}"]`);
    data.fields[n] = el ? el.value : "";
  });

  ["classification", "priority", "systemGrade", "warranty", "powerAvailable", "networkAvailable", "scope", "conferenceType", "deliverables"].forEach(g => {
    data.groups[g] = [...document.querySelectorAll(`#editView [name="${g}"]:checked`)].map(el => el.value);
  });

  data.tech = collectTechRows();
  return data;
}

function applyData(data) {
  if (!data) return;
  currentSurveyId = data.id || null;

  Object.entries(data.fields || {}).forEach(([n, v]) => {
    const el = document.querySelector(`#editView [name="${n}"]`);
    if (el) el.value = v;
  });

  Object.entries(data.groups || {}).forEach(([g, vals]) => {
    document.querySelectorAll(`#editView [name="${g}"]`).forEach(el => {
      el.checked = (vals || []).includes(el.value);
    });
  });

  document.getElementById("techBody").innerHTML = "";
  (data.tech && data.tech.length ? data.tech : [{ req: "", use: "", eq: "" }]).forEach(r => addTechRow(r));
  images = (data.images || []).map(im => ({ ...im }));
  renderGallery();
}

function clearFormInputs() {
  document.querySelectorAll("#editView input[type=text],#editView input[type=number],#editView input[type=date],#editView textarea").forEach(el => el.value = "");
  document.querySelectorAll("#editView input[type=checkbox],#editView input[type=radio]").forEach(el => el.checked = false);
  images = [];
  renderGallery();
  initTechTableDefault();
}

async function saveCurrentSurvey(showToastMsg = true) {
  const data = collectData();
  const saved = await window.db.save(data);
  currentSurveyId = saved.id;
  if (showToastMsg) {
    showToast("💾 บันทึกข้อมูลเรียบร้อย");
  }
  return saved;
}

function scheduleAutosave() {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(async () => {
    if (currentMode === "edit") {
      const data = collectData();
      if (data.fields.projectName || data.fields.customer || currentSurveyId) {
        const saved = await window.db.save(data);
        currentSurveyId = saved.id;
      }
    }
  }, 1000);
}

document.getElementById("editView").addEventListener("input", scheduleAutosave);
document.getElementById("editView").addEventListener("change", scheduleAutosave);

/* ============================================================
   PREVIEW DOCUMENT GENERATION
   ============================================================ */
function esc(s) { return (s === undefined || s === null) ? "" : String(s); }
function escHtml(s) { return esc(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
function escAttr(s) { return esc(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function fmtDate(s) { if (!s) return ""; const d = new Date(s + "T00:00:00"); if (isNaN(d)) return s; return d.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" }); }
function kv(label, val) { return `<div class="kv"><b>${escHtml(label)}:</b>${val ? escHtml(val) : '<span class="doc-empty">—</span>'}</div>`; }
function chips(list) { return (list && list.length) ? list.map(v => `<span class="chip-tag">${escHtml(v)}</span>`).join("") : '<span class="doc-empty">ไม่ได้ระบุ</span>'; }

function buildDocHTML(d) {
  const f = d.fields || {};
  const g = d.groups || {};
  const techRows = (d.tech || []).filter(r => r.req || r.use || r.eq);
  const gallery = (d.images || []).map((im, i) => `
    <div class="gph" onclick="openLightbox(${i})">
      <img src="${im.dataUrl}" alt="">
      ${im.caption ? `<span>${escHtml(im.caption)}</span>` : ""}
    </div>`).join("");

  return `
  <div class="doc-title">
    <h1>Site Survey &amp; Project Requirement Form</h1>
    <p>${f.projectName ? escHtml(f.projectName) : "ยังไม่ระบุชื่อโครงการ"} • อัปเดตล่าสุด ${new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}</p>
  </div>
  <div style="padding:1rem 1.2rem 0;">
    <table class="doc-meta">
      <tr><td><b>Project Name</b>${escHtml(f.projectName) || "—"}</td><td><b>Customer</b>${escHtml(f.customer) || "—"}</td></tr>
      <tr><td><b>Sales Owner</b>${escHtml(f.salesOwner) || "—"}</td><td><b>Engineering Owner</b>${escHtml(f.engineeringOwner) || "—"}</td></tr>
      <tr><td><b>Survey Date</b>${fmtDate(f.surveyDate) || "—"}</td><td><b>Proposal Due Date</b>${fmtDate(f.proposalDueDate) || "—"}</td></tr>
      <tr><td><b>Site Location</b>${escHtml(f.siteLocation) || "—"}</td><td><b>Project Type</b>${escHtml(f.projectType) || "—"}</td></tr>
    </table>
  </div>

  <div class="doc-section">
    <h3><span class="n">1</span>Project Classification</h3>
    <div class="doc-row">${chips(g.classification)}</div>
    ${f.audioChannels ? kv("Audio Channels", f.audioChannels) : ""}
    ${f.classificationOther ? kv("Other", f.classificationOther) : ""}
  </div>

  <div class="doc-section">
    <h3><span class="n">2</span>Budget &amp; Business Requirement</h3>
    ${kv("Budget Range", f.budgetRange)}
    ${kv("Priority", (g.priority || []).join(", "))}
    ${kv("System Grade", (g.systemGrade || []).join(", "))}
    ${kv("Preferred Brand", f.preferredBrand)}
    ${kv("Brand Preference", f.brandPreference)}
    ${kv("Required Lead Time", f.leadTime)}
    ${kv("Warranty", (g.warranty || []).join(", "))}
  </div>

  <div class="doc-section">
    <h3><span class="n">3</span>Site Information</h3>
    <table class="doc-table">
      <thead><tr><th>Width (m.)</th><th>Length (m.)</th><th>Height (m.)</th><th>Capacity (Seats)</th><th>Viewing Distance</th></tr></thead>
      <tbody><tr><td>${escHtml(f.width) || "—"}</td><td>${escHtml(f.length) || "—"}</td><td>${escHtml(f.height) || "—"}</td><td>${escHtml(f.capacity) || "—"}</td><td>${escHtml(f.viewingDistance) || "—"}</td></tr></tbody>
    </table>
    <table class="doc-table" style="margin-top:.6rem;">
      <thead><tr><th>Ceiling Type</th><th>Floor Type</th><th>Wall Material</th><th>Power Available</th><th>Network Available</th></tr></thead>
      <tbody><tr><td>${escHtml(f.ceilingType) || "—"}</td><td>${escHtml(f.floorType) || "—"}</td><td>${escHtml(f.wallMaterial) || "—"}</td><td>${(g.powerAvailable || []).join(", ") || "—"}</td><td>${(g.networkAvailable || []).join(", ") || "—"}</td></tr></tbody>
    </table>
    ${f.additionalInfo ? `<div style="margin-top:.6rem;">${kv("Additional Information", f.additionalInfo)}</div>` : ""}
    ${f.siteConstraints ? kv("Site Constraints", f.siteConstraints) : ""}
    <div style="margin-top:.7rem;">
      <b style="font-size:.78rem; color:var(--ink-soft); text-transform:uppercase;">Reference Drawings / Photos Attached</b>
      ${(d.images && d.images.length) ? `<div class="doc-gallery">${gallery}</div>` : '<div class="doc-empty" style="margin-top:.3rem;">ไม่มีรูปแนบ</div>'}
    </div>
  </div>

  <div class="doc-section">
    <h3><span class="n">4</span>Technical Requirement</h3>
    ${techRows.length ? `
      <table class="doc-table">
        <thead><tr><th>Requirement</th><th>Use Case</th><th>Existing Equipment</th></tr></thead>
        <tbody>${techRows.map(r => `<tr><td>${escHtml(r.req) || "—"}</td><td>${escHtml(r.use) || "—"}</td><td>${escHtml(r.eq) || "—"}</td></tr>`).join("")}</tbody>
      </table>` : '<div class="doc-empty">ไม่มีข้อมูล</div>'}
  </div>

  <div class="doc-section">
    <h3><span class="n">5</span>Scope of Work</h3>
    <div class="doc-row">${chips(g.scope)}</div>
    ${(g.conferenceType && g.conferenceType.length) ? kv("Conference Type", g.conferenceType.join(", ")) : ""}
    ${f.scopeOther ? kv("Other Scope", f.scopeOther) : ""}
  </div>

  <div class="doc-section">
    <h3><span class="n">6</span>Design Deliverables</h3>
    <div class="doc-row">${chips(g.deliverables)}</div>
  </div>

  <div class="doc-section">
    <h3><span class="n">7</span>Site Constraint &amp; Risk</h3>
    <p style="font-size:.85rem; white-space:pre-wrap;">${f.siteRisk ? escHtml(f.siteRisk) : '<span class="doc-empty">ไม่มีข้อมูล</span>'}</p>
  </div>

  <div class="doc-section">
    <h3><span class="n">8</span>Approval</h3>
    <div class="approval-grid">
      <div class="approval-box"><div class="role">Prepared By</div>${escHtml(f.preparedBy) || "—"}<br><span style="color:var(--ink-soft);">${fmtDate(f.preparedDate) || ""}</span></div>
      <div class="approval-box"><div class="role">Reviewed By</div>${escHtml(f.reviewedBy) || "—"}<br><span style="color:var(--ink-soft);">${fmtDate(f.reviewedDate) || ""}</span></div>
      <div class="approval-box"><div class="role">Approved By</div>${escHtml(f.approvedBy) || "—"}<br><span style="color:var(--ink-soft);">${fmtDate(f.approvedDate) || ""}</span></div>
    </div>
  </div>

  <div class="report-footer">Site Survey &amp; Project Requirement Form — generated ${new Date().toLocaleString("th-TH")}</div>
  `;
}

/* ============================================================
   EXPORT & DOWNLOAD
   ============================================================ */
function exportPDF() {
  const data = collectData();
  document.getElementById("docOutput").innerHTML = buildDocHTML(data);
  setMode("preview");
  setTimeout(() => window.print(), 150);
}

function downloadReport() {
  const data = collectData();
  const inner = buildDocHTML(data);
  const projectName = (data.fields.projectName || "site-survey").trim().replace(/[^a-zA-Z0-9ก-๙_-]+/g, "_") || "site-survey";
  
  const styleText = [...document.styleSheets].map(sheet => {
    try {
      return [...sheet.cssRules].map(r => r.cssText).join("\n");
    } catch(e) { return ""; }
  }).join("\n");

  const html = `<!DOCTYPE html>
<html lang="th"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Site Survey Report - ${escHtml(data.fields.projectName || "")}</title>
<style>${styleText}</style>
<style>
  body{padding:1rem;}
  .report-toolbar{max-width:900px;margin:0 auto 1rem;display:flex;justify-content:flex-end;gap:.5rem;}
  .report-toolbar button{border:1px solid var(--brand);background:var(--brand);color:#fff;padding:.55rem 1rem;border-radius:8px;cursor:pointer;font-size:.85rem;font-family:inherit;}
  #previewView{display:block;max-width:900px;margin:0 auto;}
  @media print{ .report-toolbar{display:none;} }
</style>
</head><body>
<div class="report-toolbar"><button onclick="window.print()">🖨 พิมพ์ / บันทึกเป็น PDF</button></div>
<main class="sheet" id="previewView"><div class="doc" id="docOutput">${inner}</div></main>
</body></html>`;

  downloadBlob(html, `${projectName}_survey_report.html`, "text/html");
  showToast("ดาวน์โหลดรายงาน HTML สำเร็จ");
}

function downloadCurrentDraftJSON() {
  const data = collectData();
  const name = (data.fields.projectName || "draft").trim().replace(/[^a-zA-Z0-9ก-๙_-]+/g, "_") || "draft";
  downloadBlob(JSON.stringify(data, null, 2), `${name}_draft.json`, "application/json");
  showToast("บันทึกไฟล์ JSON สำเร็จ");
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ============================================================
   BACKUP MODAL
   ============================================================ */
function openBackupModal() {
  document.getElementById("backupModal").hidden = false;
}
function closeBackupModal() {
  document.getElementById("backupModal").hidden = true;
}

async function exportAllData() {
  const json = await window.db.exportAll();
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadBlob(json, `site_surveys_backup_${dateStr}.json`, "application/json");
  showToast("สำรองข้อมูลทั้งหมดเรียบร้อยแล้ว");
}

function triggerImportAll() {
  document.getElementById("importFileInput").click();
}

async function handleImportAll(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const count = await window.db.importAll(e.target.result);
      showToast(`นำเข้าข้อมูลเรียบร้อย ${count} โครงการ`);
      closeBackupModal();
      await renderDashboard();
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการนำเข้าไฟล์: " + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

/* ============================================================
   TOAST HELPER
   ============================================================ */
let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById("statusToast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}
