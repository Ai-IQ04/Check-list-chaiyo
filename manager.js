/**
 * Area Manager Document Audit Module Logic
 * Version 1.0.0
 */

// Manager App State
const mgrState = {
  selectedCategory: null,        // Unselected initially so user MUST choose first
  selectedSubType: null,         // Unselected initially
  hasGuarantor: false,
  isStep1Confirmed: false,       // Locked until user chooses category & subtype
  images: [], // Attached screenshots [{ id, file, dataUrl }]
  extractedBlueTexts: [], // Extracted filenames from OCR [{ cleanName, ext, raw }]
  auditResults: [], // Audit items matched against checklist
  activeTableFilter: 'all', // 'all', 'missing', 'warning', 'pass'
};

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initLucideIcons();
  setupStep1Listeners();
  setupDropzoneListeners();
  setupAuditListeners();
  setupTableFilterListeners();
  setupApiKeyModalListeners();
  updateStep1UI();
  updateApiKeyStatusUI();
});

// Built-in Default System API Key (Fallback to empty string - users enter via UI modal)
const DEFAULT_SYSTEM_API_KEY = '';

function getGeminiApiKey() {
  const savedKey = localStorage.getItem('MGR_GEMINI_API_KEY');
  return (savedKey && savedKey.trim().length > 0) ? savedKey.trim() : DEFAULT_SYSTEM_API_KEY;
}

function getSelectedVisionModel() {
  return localStorage.getItem('MGR_VISION_MODEL') || 'gemini-3.5-flash-lite';
}

function updateApiKeyStatusUI() {
  const btnText = document.getElementById('apiKeyStatusText');
  const apiKey = getGeminiApiKey();
  const model = getSelectedVisionModel();
  if (btnText) {
    const isCustom = !!localStorage.getItem('MGR_GEMINI_API_KEY');
    const modelShort = model === 'google-cloud-vision' ? 'Cloud Vision' : model.replace('gemini-', '');
    btnText.innerText = `🟢 Vision AI พร้อมใช้งาน (${modelShort}${isCustom ? ' • คีย์ส่วนตัว' : ' • คีย์ระบบกลาง'})`;
    btnText.className = 'text-emerald-700 font-extrabold';
  }
}

function setupApiKeyModalListeners() {
  const modal = document.getElementById('apiKeyModal');
  const btnOpen = document.getElementById('btnOpenApiKeyModal');
  const btnClose = document.getElementById('btnCloseApiKeyModal');
  const btnSave = document.getElementById('btnSaveApiKey');
  const btnClear = document.getElementById('btnClearApiKey');
  const inputKey = document.getElementById('inputApiKey');
  const selectModel = document.getElementById('selectVisionModel');

  if (!modal) return;

  if (btnOpen) {
    btnOpen.addEventListener('click', () => {
      if (inputKey) inputKey.value = getGeminiApiKey();
      if (selectModel) selectModel.value = getSelectedVisionModel();
      modal.classList.remove('hidden');
    });
  }

  if (btnClose) {
    btnClose.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }

  const btnTest = document.getElementById('btnTestApiKey');
  const boxResult = document.getElementById('apiKeyTestResultBox');
  const textResult = document.getElementById('apiKeyTestResultText');

  if (btnTest) {
    btnTest.addEventListener('click', async () => {
      const val = inputKey ? inputKey.value.trim() : '';
      if (!val) {
        showToast('กรุณาใส่ API Key หรือ Token ก่อนทดสอบ', 'warning');
        return;
      }

      if (boxResult) boxResult.classList.remove('hidden');
      if (textResult) {
        textResult.className = 'font-mono text-[11px] text-amber-700 animate-pulse';
        textResult.innerText = '⏳ กำลังทดสอบเชื่อมต่อ Google Vision / Gemini API...';
      }

      // 1-pixel test image
      const testBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      try {
        const items = await runVisionAI(`data:image/png;base64,${testBase64}`, val);
        if (textResult) {
          textResult.className = 'font-mono text-[11px] text-emerald-700 font-bold';
          textResult.innerText = '🟢 เชื่อมต่อสำเร็จ 100%! API Key / Token สมบูรณ์และพร้อมใช้งาน';
        }
        showToast('🟢 API Key สามารถใช้งานได้เรียบร้อยแล้ว', 'success');
      } catch (testErr) {
        if (textResult) {
          textResult.className = 'font-mono text-[11px] text-rose-700 font-bold break-words';
          textResult.innerText = `🔴 ล้มเหลว: ${testErr.message || 'Google API ไม่รองรับ Token นี้'}`;
        }
        showToast('🔴 การทดสอบเชื่อมต่อล้มเหลว', 'error');
      }
    });
  }

  if (btnSave) {
    btnSave.addEventListener('click', () => {
      const val = inputKey ? inputKey.value.trim() : '';
      if (selectModel) {
        localStorage.setItem('MGR_VISION_MODEL', selectModel.value);
      }
      if (val) {
        localStorage.setItem('MGR_GEMINI_API_KEY', val);
        showToast('บันทึก API Key และเลือกโมเดลเรียบร้อยแล้ว', 'success');
      } else {
        localStorage.removeItem('MGR_GEMINI_API_KEY');
        showToast('ลบ API Key เรียบร้อย', 'info');
      }
      modal.classList.add('hidden');
      updateApiKeyStatusUI();
    });
  }

  if (btnClear) {
    btnClear.addEventListener('click', () => {
      localStorage.removeItem('MGR_GEMINI_API_KEY');
      if (inputKey) inputKey.value = '';
      showToast('ลบ API Key เรียบร้อยแล้ว', 'info');
      modal.classList.add('hidden');
      updateApiKeyStatusUI();
    });
  }
}

function initLucideIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Toast notification helper
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const bgColors = {
    info: 'bg-indigo-600 text-white',
    success: 'bg-emerald-600 text-white',
    warning: 'bg-amber-600 text-white',
    error: 'bg-rose-600 text-white',
  };

  const toast = document.createElement('div');
  toast.className = `px-4 py-3 rounded-2xl shadow-xl text-xs font-bold ${bgColors[type] || bgColors.info} animate-toast flex items-center gap-2 pointer-events-auto`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* =========================================================
 * STEP 1: Loan Type & SubType Selection Logic
 * ========================================================= */
function setupStep1Listeners() {
  // Category buttons
  document.querySelectorAll('.mgr-cat-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const cat = btn.getAttribute('data-cat');
      mgrState.selectedCategory = cat;

      // Assign default subType if none selected or if mortgage invalid for non-land
      if (!mgrState.selectedSubType || (cat !== 'land' && mgrState.selectedSubType === 'mortgage')) {
        mgrState.selectedSubType = 'pledge';
      }

      mgrState.isStep1Confirmed = true;
      updateStep1UI();
    });
  });

  // SubType buttons
  document.querySelectorAll('.mgr-subtype-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const sub = btn.getAttribute('data-subtype');
      mgrState.selectedSubType = sub;
      if (!mgrState.selectedCategory) {
        mgrState.selectedCategory = 'car';
      }
      mgrState.isStep1Confirmed = true;
      updateStep1UI();
    });
  });

  // Guarantor buttons
  const btnNo = document.getElementById('btnGuarantorNo');
  const btnYes = document.getElementById('btnGuarantorYes');

  if (btnNo && btnYes) {
    btnNo.addEventListener('click', () => {
      mgrState.hasGuarantor = false;
      updateStep1UI();
    });
    btnYes.addEventListener('click', () => {
      mgrState.hasGuarantor = true;
      updateStep1UI();
    });
  }

  // Toggle Checklist Preview Collapse
  const btnTogglePreview = document.getElementById('btnToggleChecklistPreview');
  const previewContainer = document.getElementById('step1ChecklistPreviewContainer');
  const toggleText = document.getElementById('toggleChecklistPreviewText');
  const toggleIcon = document.getElementById('toggleChecklistPreviewIcon');

  if (btnTogglePreview && previewContainer) {
    btnTogglePreview.addEventListener('click', () => {
      const isHidden = previewContainer.classList.contains('hidden');
      if (isHidden) {
        previewContainer.classList.remove('hidden');
        if (toggleText) toggleText.innerText = 'ซ่อนรายการ';
        if (toggleIcon) toggleIcon.setAttribute('data-lucide', 'chevron-up');
      } else {
        previewContainer.classList.add('hidden');
        if (toggleText) toggleText.innerText = 'แสดงรายการ';
        if (toggleIcon) toggleIcon.setAttribute('data-lucide', 'chevron-down');
      }
      initLucideIcons();
    });
  }
}

function checkAndConfirmStep1() {
  mgrState.isStep1Confirmed = true;
}

function updateStep1UI() {
  // Category buttons active state
  document.querySelectorAll('.mgr-cat-btn').forEach((btn) => {
    const cat = btn.getAttribute('data-cat');
    if (cat === mgrState.selectedCategory) {
      btn.className = 'mgr-cat-btn neu-btn neu-pill-active p-3 rounded-2xl flex flex-col items-center gap-1 text-center transition-all';
    } else {
      btn.className = 'mgr-cat-btn neu-btn p-3 rounded-2xl flex flex-col items-center gap-1 text-center transition-all text-slate-700 hover:text-indigo-600';
    }
  });

  // SubType buttons availability & active state
  document.querySelectorAll('.mgr-subtype-btn').forEach((btn) => {
    const sub = btn.getAttribute('data-subtype');

    // Disable mortgage for non-land (vehicles only do pledge/refinance/topup)
    if (sub === 'mortgage' && mgrState.selectedCategory !== 'land') {
      btn.classList.add('opacity-40', 'cursor-not-allowed', 'pointer-events-none');
      btn.classList.remove('hover:text-indigo-600');
    } else {
      btn.classList.remove('opacity-40', 'cursor-not-allowed', 'pointer-events-none');
    }

    if (sub === mgrState.selectedSubType) {
      btn.className = 'mgr-subtype-btn neu-btn neu-pill-active px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5';
    } else {
      btn.className = 'mgr-subtype-btn neu-btn px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 text-slate-700 hover:text-indigo-600';
    }
  });

  // Guarantor UI
  const btnNo = document.getElementById('btnGuarantorNo');
  const btnYes = document.getElementById('btnGuarantorYes');
  if (btnNo && btnYes) {
    if (!mgrState.hasGuarantor) {
      btnNo.className = 'mgr-guarantor-btn neu-btn neu-pill-active px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5';
      btnYes.className = 'mgr-guarantor-btn neu-btn px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 text-slate-700';
    } else {
      btnNo.className = 'mgr-guarantor-btn neu-btn px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 text-slate-700';
      btnYes.className = 'mgr-guarantor-btn neu-btn neu-pill-active px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5';
    }
  }

  // Update Lock Overlay on Step 2
  const lockOverlay = document.getElementById('dropzoneLockOverlay');
  const statusBadge = document.getElementById('step1StatusBadge');
  const catNames = { motorcycle: 'มอเตอร์ไซค์', car: 'รถเก๋ง/กระบะ/ตู้', truck: 'รถบรรทุก', agri: 'รถเกษตร', land: 'สินเชื่อที่ดิน' };
  const subNames = { pledge: 'จำนำเล่ม', mortgage: 'จำนอง', refinance: 'รีไฟแนนซ์', topup: 'Top-up' };

  if (mgrState.isStep1Confirmed && mgrState.selectedCategory) {
    if (lockOverlay) lockOverlay.classList.add('hidden');
    if (statusBadge) {
      statusBadge.className = 'text-xs px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 flex items-center gap-1';
      statusBadge.innerHTML = `<i data-lucide="check-circle" class="w-3.5 h-3.5"></i> เลือกแล้ว: ${catNames[mgrState.selectedCategory] || ''} - ${subNames[mgrState.selectedSubType] || ''}`;
    }
  } else {
    if (lockOverlay) lockOverlay.classList.remove('hidden');
    if (statusBadge) {
      statusBadge.className = 'text-xs px-3 py-1 rounded-xl bg-amber-100 text-amber-800 font-bold border border-amber-300 flex items-center gap-1 animate-pulse';
      statusBadge.innerHTML = '<i data-lucide="alert-circle" class="w-3.5 h-3.5"></i> กรุณาเลือกประเภทสินเชื่อและธุรกรรมด้านบนก่อน';
    }
  }

  // Update Live Expected Checklist Preview
  renderStep1ChecklistPreview();

  initLucideIcons();
}

/**
 * Filter checklist items strictly based on Category, SubType, and Guarantor.
 * Excludes refinance (C3/A023), land mortgage (DD), and guarantor docs when irrelevant.
 */
function getFilteredItemsForProduct(catId, subTypeId, hasGuarantor) {
  const catData = window.LOAN_CHECKLISTS ? window.LOAN_CHECKLISTS[catId] : null;
  if (!catData || !catData.items) return [];
  let items = [...catData.items];

  const sub = (subTypeId || 'pledge').toLowerCase();

  // 1. If Land loan
  if (catId === 'land') {
    const isLandMortgage = sub === 'mortgage' || sub === 'land_mortgage' || sub === 'land_refinance_mortgage';
    if (!isLandMortgage) {
      // โหมดจำนำที่ดิน และ Top-up ที่ดิน: ไม่ต้องแสดงเอกสารจดจำนองที่ดิน (หมวด DD)
      items = items.filter((it) => !(it.code || '').toUpperCase().startsWith('DD'));
    }
  }

  // 2. Filter Refinance & Top-up documents (หมวด C3 เอกสารเพิ่มเติม รีไฟแนนซ์/ต่อสัญญา/Top-up)
  const isRefinanceOrTopup = ['refinance', 'topup', 'land_refinance_pledge', 'land_refinance_mortgage', 'land_topup'].includes(sub);
  const isRefinance = ['refinance', 'land_refinance_pledge', 'land_refinance_mortgage'].includes(sub);

  if (!isRefinanceOrTopup) {
    // โหมดจำนำ และ จำนอง: ไม่ต้องแสดงหมวด C3 และ ไม่ต้องแสดงหนังสือมอบอำนาจรีไฟแนนซ์ (A023/AA023)
    items = items.filter((it) => {
      const c = (it.code || '').toUpperCase();
      const grp = (it.group || '').toUpperCase();
      const targetName = it.targetName || '';
      if (c === 'A023' || c === 'AA023' || targetName.includes('หนังสือมอบอำนาจรีไฟแนนซ์')) {
        return false;
      }
      if (grp.startsWith('C3') || c.startsWith('C3')) {
        return false;
      }
      return true;
    });
  } else if (!isRefinance) {
    // โหมด Top-up: ซ่อนหนังสือมอบอำนาจรีไฟแนนซ์ และสัญญาไฟแนนซ์เดิม เปิดเฉพาะใบเรียกเก็บดอกเบี้ยสะสม Top-up
    items = items.filter((it) => {
      const c = (it.code || '').toUpperCase();
      const targetName = it.targetName || '';
      if (c === 'A023' || c === 'AA023' || targetName.includes('หนังสือมอบอำนาจรีไฟแนนซ์')) {
        return false;
      }
      if (c === 'C305' || c === 'C307' || targetName.includes('ใบสอบถามยอดหนี้') || targetName.includes('สัญญาคู่ฉบับไฟแนนซ์เดิม')) {
        return false;
      }
      return true;
    });
  }

  // 3. Filter Guarantor items when in "No Guarantor" mode
  if (!hasGuarantor) {
    items = items.filter((it) => {
      const c = (it.code || '').toUpperCase();
      const grp = (it.group || '').toUpperCase();
      const desc = it.desc || '';
      const targetName = it.targetName || '';
      
      if (['A02', 'A04', 'C102', 'C106', 'C202', 'BB01', 'BB02'].includes(c)) return false;
      if (grp.startsWith('BB')) return false;
      if (desc.includes('ผู้ค้ำ') || targetName.includes('ผู้ค้ำ')) return false;
      return true;
    });
  }

  return items;
}

/**
 * Render Live Expected Document Checklist Preview for selected product in Step 1
 */
function renderStep1ChecklistPreview() {
  const titleElem = document.getElementById('previewSelectedProductTitle');
  const countBadge = document.getElementById('previewDocsCountBadge');
  const gridElem = document.getElementById('step1ChecklistPreviewGrid');

  if (!gridElem) return;

  if (!mgrState.selectedCategory) {
    if (titleElem) titleElem.innerText = 'กรุณาคลิกเลือกประเภทสินเชื่อและธุรกรรมด้านบน';
    if (countBadge) countBadge.innerText = 'รอการเลือก';
    gridElem.innerHTML = `
      <div class="col-span-full py-6 text-center text-xs text-slate-500 font-bold flex flex-col items-center gap-2">
        <i data-lucide="mouse-pointer-click" class="w-6 h-6 text-amber-500 animate-bounce"></i>
        <span>กรุณาคลิกเลือกประเภทสินเชื่อในข้อ 1 ด้านบน เพื่อดูรายการเอกสารที่ต้องใช้</span>
      </div>
    `;
    initLucideIcons();
    return;
  }

  const catNames = { 
    motorcycle: 'รถมอเตอร์ไซค์', 
    car: 'รถเก๋ง/กระบะ/ตู้', 
    truck: 'รถบรรทุก', 
    agri: 'รถการเกษตร', 
    land: 'สินเชื่อที่ดิน' 
  };
  const subNames = { 
    pledge: 'จำนำเล่มทะเบียน', 
    mortgage: 'จำนอง', 
    refinance: 'รีไฟแนนซ์', 
    topup: 'Top-up (กู้เพิ่ม)' 
  };

  const catName = catNames[mgrState.selectedCategory] || 'สินเชื่อ';
  const subName = subNames[mgrState.selectedSubType] || 'จำนำเล่มทะเบียน';
  const guarantorName = mgrState.hasGuarantor ? 'มีผู้ค้ำประกัน' : 'ไม่มีผู้ค้ำ';

  if (titleElem) {
    titleElem.innerText = `${catName} • ${subName} (${guarantorName})`;
  }

  const items = getFilteredItemsForProduct(mgrState.selectedCategory, mgrState.selectedSubType, mgrState.hasGuarantor);

  let pdfCount = 0;
  let jpgCount = 0;
  items.forEach(it => {
    if ((it.format || '').toUpperCase() === 'PDF') pdfCount++;
    else jpgCount++;
  });

  if (countBadge) {
    countBadge.innerText = `${items.length} รายการ (PDF ${pdfCount}, JPG ${jpgCount})`;
  }

  if (items.length === 0) {
    gridElem.innerHTML = '<div class="col-span-full py-4 text-center text-xs text-slate-500 font-bold">ไม่พบรายการเอกสารสำหรับเงื่อนไขนี้</div>';
    return;
  }

  gridElem.innerHTML = items.map((it, idx) => {
    const isPDF = (it.format || '').toUpperCase() === 'PDF';
    const fmtBadge = isPDF
      ? '<span class="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-red-100 text-red-700 border border-red-200">PDF</span>'
      : '<span class="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 border border-blue-200">JPG</span>';

    const reqBadge = it.mandatory
      ? '<span class="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200">บังคับ</span>'
      : '<span class="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">ถ้ามี</span>';

    return `
      <div class="neu-raised p-2.5 rounded-xl flex flex-col justify-between gap-1.5 border border-slate-300/40 hover:border-indigo-300 transition-all bg-[#e0e5ec]">
        <div class="flex items-start justify-between gap-1">
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="text-[10px] font-mono font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded neu-inset">${it.code || `DOC-${idx + 1}`}</span>
            <span class="text-xs font-black text-slate-800 truncate" title="${it.targetName}">${it.targetName}</span>
          </div>
          <div class="flex items-center gap-1 flex-shrink-0">
            ${fmtBadge}
            ${reqBadge}
          </div>
        </div>
        <p class="text-[11px] text-slate-600 line-clamp-1 leading-snug" title="${it.desc}">${it.desc}</p>
      </div>
    `;
  }).join('');
}

/* =========================================================
 * STEP 2: Screenshot Image Upload & Preview Logic
 * ========================================================= */
function setupDropzoneListeners() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('screenshotInput');
  const btnClear = document.getElementById('btnClearImages');
  const lockOverlay = document.getElementById('dropzoneLockOverlay');

  if (lockOverlay) {
    lockOverlay.addEventListener('click', () => {
      showToast('⚠️ กรุณาคลิกเลือกประเภทสินเชื่อและธุรกรรมในขั้นตอนที่ 1 ด้านบนก่อนวางรูปภาพ', 'warning');
      const step1 = document.querySelector('main section');
      if (step1) step1.scrollIntoView({ behavior: 'smooth' });
    });
  }

  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (!mgrState.isStep1Confirmed || !mgrState.selectedCategory) {
      return;
    }
    dropzone.classList.add('border-indigo-600', 'bg-indigo-50/50');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('border-indigo-600', 'bg-indigo-50/50');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('border-indigo-600', 'bg-indigo-50/50');
    if (!mgrState.isStep1Confirmed || !mgrState.selectedCategory) {
      showToast('⚠️ กรุณาคลิกเลือกประเภทสินเชื่อและธุรกรรมในขั้นตอนที่ 1 ด้านบนก่อนวางรูปภาพ', 'warning');
      const step1 = document.querySelector('main section');
      if (step1) step1.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (!mgrState.isStep1Confirmed || !mgrState.selectedCategory) {
      showToast('⚠️ กรุณาคลิกเลือกประเภทสินเชื่อและธุรกรรมในขั้นตอนที่ 1 ด้านบนก่อนวางรูปภาพ', 'warning');
      fileInput.value = '';
      const step1 = document.querySelector('main section');
      if (step1) step1.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (fileInput.files && fileInput.files.length > 0) {
      handleFilesAdded(fileInput.files);
      fileInput.value = '';
    }
  });

  if (btnClear) {
    btnClear.addEventListener('click', () => {
      mgrState.images = [];
      renderImageGrid();
      document.getElementById('auditResultsSection').classList.add('hidden');
      showToast('ล้างรูปภาพเรียบร้อยแล้ว', 'info');
    });
  }
}

function handleFilesAdded(files) {
  if (!mgrState.isStep1Confirmed || !mgrState.selectedCategory) {
    showToast('⚠️ กรุณาคลิกเลือกประเภทสินเชื่อและธุรกรรมในขั้นตอนที่ 1 ด้านบนก่อนวางรูปภาพ', 'warning');
    const step1 = document.querySelector('main section');
    if (step1) step1.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  Array.from(files).forEach((file) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      mgrState.images.push({
        id: 'img_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        file: file,
        dataUrl: e.target.result,
      });
      renderImageGrid();
    };
    reader.readAsDataURL(file);
  });
}

function renderImageGrid() {
  const previewContainer = document.getElementById('previewContainer');
  const imgGrid = document.getElementById('imgGrid');
  const imgCountText = document.getElementById('imgCountText');

  if (!previewContainer || !imgGrid) return;

  if (mgrState.images.length === 0) {
    previewContainer.classList.add('hidden');
    return;
  }

  previewContainer.classList.remove('hidden');
  if (imgCountText) imgCountText.innerText = mgrState.images.length;

  imgGrid.innerHTML = mgrState.images
    .map(
      (img, index) => `
    <div class="neu-raised p-2 rounded-2xl relative group flex flex-col items-center">
      <img src="${img.dataUrl}" class="w-full h-24 object-cover rounded-xl neu-inset">
      <div class="mt-1 flex items-center justify-between w-full px-1">
        <span class="text-[10px] font-bold text-slate-500">รูปที่ ${index + 1}</span>
        <button onclick="removeImage('${img.id}')" class="text-rose-500 hover:text-rose-700 p-1 cursor-pointer" title="ลบรูปนี้">
          <i data-lucide="x" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    </div>
  `
    )
    .join('');

  initLucideIcons();
}

function removeImage(id) {
  mgrState.images = mgrState.images.filter((img) => img.id !== id);
  renderImageGrid();
}

/* =========================================================
 * STEP 3: Blue-Text Color Masking & OCR Audit Engine
 * ========================================================= */
function setupAuditListeners() {
  const btnStartAudit = document.getElementById('btnStartAudit');
  if (btnStartAudit) {
    btnStartAudit.addEventListener('click', runAuditEngine);
  }

  const btnCopyReport = document.getElementById('btnCopyReport');
  if (btnCopyReport) {
    btnCopyReport.addEventListener('click', copyAuditSummaryText);
  }
}

/**
 * Creates a high-contrast black/white mask focusing on Blue Text
 * (Blue text links in branch document table)
 */
function createBlueTextMaskCanvas(imageSrc) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Color filter: Isolate blue text pixels
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Blue dominant check: B is noticeably higher than R & G
        const isBlue = b > r + 15 && b > g + 10 && b > 60;
        // Dark blue / link text condition
        const isDarkLinkBlue = b > r * 1.25 && b > g * 1.1;

        if (isBlue || isDarkLinkBlue) {
          // Convert blue text to crisp black for OCR
          data[i] = 0;
          data[i + 1] = 0;
          data[i + 2] = 0;
        } else {
          // Wash out background to white
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
        }
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = imageSrc;
  });
}

/**
 * Google Cloud Vision API Endpoint (vision.googleapis.com)
 * Supports GCP API Keys & OAuth Bearer Tokens (AQ... / ya29...)
 */
async function runGoogleCloudVisionAPI(dataUrl, apiKey) {
  const base64Data = dataUrl.split(',')[1] || dataUrl;
  // Google OAuth2 Bearer tokens start with 'ya29.'
  // Modern Google AI Studio API Keys can start with 'AIza' or 'AQ.'
  const isOAuth = cleanKey.startsWith('ya29');

  // If using OAuth2 Bearer token, DO NOT append ?key= in URL to avoid GCP 401 API_KEY_SERVICE_BLOCKED
  const url = isOAuth
    ? `https://vision.googleapis.com/v1/images:annotate`
    : `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(cleanKey)}`;

  const headers = {
    'Content-Type': 'application/json',
  };

  if (isOAuth) {
    headers['Authorization'] = `Bearer ${cleanKey}`;
  } else {
    headers['x-goog-api-key'] = cleanKey;
  }

  const payload = {
    requests: [
      {
        image: { content: base64Data },
        features: [
          { type: 'TEXT_DETECTION' },
          { type: 'DOCUMENT_TEXT_DETECTION' }
        ]
      }
    ]
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    let errMessage = `Google Cloud Vision API Error (${response.status}): ${errText}`;
    try {
      const errJson = JSON.parse(errText);
      if (errJson.error?.message) {
        if (errJson.error.message.includes('has not been used in project') || errJson.error.message.includes('disabled')) {
          const projMatch = errText.match(/project[ =](\d+)/i);
          const projNum = projMatch ? projMatch[1] : '';
          const actUrl = projNum 
            ? `https://console.developers.google.com/apis/api/vision.googleapis.com/overview?project=${projNum}`
            : 'https://console.cloud.google.com/apis/library/vision.googleapis.com';
          errMessage = `ยังไม่ได้เปิดใช้งาน Cloud Vision API บน Google Cloud Project (${projNum}) กรุณาเปิดใช้งานที่: ${actUrl} แล้วรอ 1-2 นาที จากนั้นลองใหม่อีกครั้ง`;
        } else {
          errMessage = `Google Cloud Vision API Error (${response.status}): ${errJson.error.message}`;
        }
      }
    } catch (_) {}
    throw new Error(errMessage);
  }

  const json = await response.json();
  const text = json.responses?.[0]?.fullTextAnnotation?.text || json.responses?.[0]?.textAnnotations?.[0]?.description || '';
  
  if (!text) {
    return [];
  }

  const items = [];
  const lines = text.split('\n');
  lines.forEach((line) => {
    const clean = line.trim();
    if (clean.length < 3) return;

    const hasExt = /\.(pdf|jpg|png|jpeg)/i.test(clean);
    const matchesKeywords = /(บัตร|เล่ม|รูป|เอกสาร|สัญญา|ใบ|หนังสือ|ประเมิน|สมุด|สำเนา|แบบ|ป้าย|เว็บ)/i.test(clean);

    if (hasExt || matchesKeywords) {
      const extMatch = clean.match(/\.(pdf|jpg|png|jpeg)/i);
      const ext = extMatch ? extMatch[1].toUpperCase() : '';
      items.push({
        cleanName: clean.replace(/\.(pdf|jpg|png|jpeg).*/i, '').trim(),
        ext: ext,
        raw: clean,
      });
    }
  });

  return items;
}

/**
 * Safe Vision AI JSON & Prose Parser (Prevents JSON.parse SyntaxError)
 */
function safeParseJsonArray(text) {
  if (!text) return [];
  
  // 1. Try finding JSON array bracket [...]
  const arrayMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }

  // 2. Try parsing after removing markdown code fences
  const cleanJsonText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    const parsed = JSON.parse(cleanJsonText);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {}

  // 3. Fallback: Parse line-by-line filenames from plain text response
  const lines = text.split('\n');
  const items = [];
  lines.forEach((line) => {
    const clean = line.trim().replace(/^[-*•\d.\s]+/, '');
    if (clean.length < 3) return;
    const hasExt = /\.(pdf|jpg|png|jpeg)/i.test(clean);
    const matchesKeywords = /(บัตร|เล่ม|รูป|เอกสาร|สัญญา|ใบ|หนังสือ|ประเมิน|สมุด|สำเนา|แบบ|ป้าย|เว็บ)/i.test(clean);
    if (hasExt || matchesKeywords) {
      const extMatch = clean.match(/\.(pdf|jpg|png|jpeg)/i);
      const ext = extMatch ? extMatch[1].toUpperCase() : '';
      items.push({
        cleanName: clean.replace(/\.(pdf|jpg|png|jpeg).*/i, '').trim(),
        ext: ext,
        raw: clean,
      });
    }
  });
  return items;
}

/**
 * Gemini Multimodal Vision API Endpoint (generativelanguage.googleapis.com)
 */
async function runGeminiVisionOCR(dataUrl, apiKey, preferredModel) {
  const base64Data = dataUrl.split(',')[1] || dataUrl;
  const cleanKey = apiKey.trim();
  const isOAuth = cleanKey.startsWith('ya29');
  
  const targetModel = preferredModel && preferredModel !== 'google-cloud-vision' ? preferredModel : 'gemini-2.5-flash';
  const models = [...new Set([targetModel, 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.6-flash'])];
  let lastError = null;

  for (const model of models) {
    // If using OAuth2 Bearer token, DO NOT append ?key= in URL
    const url = isOAuth
      ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
      : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(cleanKey)}`;

    const headers = {
      'Content-Type': 'application/json',
    };

    if (isOAuth) {
      headers['Authorization'] = `Bearer ${cleanKey}`;
    } else {
      headers['x-goog-api-key'] = cleanKey;
    }

    const payload = {
      contents: [
        {
          parts: [
            {
              text: `You are an expert OCR AI extracting document filenames from a computer screen photo of a loan checklist system.
Focus strictly on Column 2 where uploaded filenames appear in BLUE TEXT (e.g. "Sale Sheet.pdf", "รูปรถ 6.jpg", "สำเนาบัตร ปชช.ผู้กู้.pdf", "หนังสือให้ติดตามทวงถามหนี้.pdf", "สำเนาบัญชีธนาคาร.pdf", "เล่มหน้ากลาง.jpg").

Return ONLY a strict JSON array of objects without markdown formatting or code blocks:
[
  { "cleanName": "สำเนาบัตร ปชช.ผู้กู้", "ext": "PDF", "raw": "สำเนาบัตร ปชช.ผู้กู้.pdf" }
]`
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Data
              }
            }
          ]
        }
      ]
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const json = await response.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return safeParseJsonArray(text);
      } else {
        const errText = await response.text();
        lastError = new Error(`Gemini API Error (${model} - ${response.status}): ${errText}`);
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('ไม่สามารถเชื่อมต่อ Gemini API ได้');
}

/**
 * Combined Vision AI Execution Engine
 * Respects user selected model tier (Flash, Pro, Cloud Vision)
 */
async function runVisionAI(dataUrl, apiKey) {
  const chosenModel = getSelectedVisionModel();
  if (chosenModel === 'google-cloud-vision') {
    return await runGoogleCloudVisionAPI(dataUrl, apiKey);
  } else {
    try {
      return await runGeminiVisionOCR(dataUrl, apiKey, chosenModel);
    } catch (geminiErr) {
      console.warn('Gemini Vision model failed, trying Google Cloud Vision API as fallback:', geminiErr);
      return await runGoogleCloudVisionAPI(dataUrl, apiKey);
    }
  }
}

async function runAuditEngine() {
  if (mgrState.images.length === 0) {
    showToast('กรุณาแนบรูปภาพถ่ายหน้าจอก่อนเริ่มการตรวจ', 'warning');
    return;
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    showToast('🔑 กรุณาใส่ Vision API Key ก่อนประมวลผล', 'warning');
    const modal = document.getElementById('apiKeyModal');
    if (modal) modal.classList.remove('hidden');
    return;
  }

  const progressModal = document.getElementById('ocrProgressModal');
  const progressBar = document.getElementById('ocrProgressBar');
  const progressStatus = document.getElementById('ocrProgressStatus');

  if (progressModal) progressModal.classList.remove('hidden');
  if (progressBar) progressBar.style.width = '10%';

  mgrState.extractedBlueTexts = [];

  try {
    const totalImages = mgrState.images.length;

    for (let i = 0; i < totalImages; i++) {
      const imgObj = mgrState.images[i];

      if (progressStatus) progressStatus.innerText = `กำลังส่งประมวลผลด้วย Google Vision AI (รูปที่ ${i + 1}/${totalImages})...`;
      if (progressBar) progressBar.style.width = `${Math.round(((i + 1) / totalImages) * 90)}%`;

      const items = await runVisionAI(imgObj.dataUrl, apiKey);
      if (Array.isArray(items)) {
        items.forEach((it) => {
          const cleanName = (it.cleanName || '').trim();
          const ext = (it.ext || '').toUpperCase();
          const raw = it.raw || `${cleanName}.${ext}`;

          if (!cleanName) return;

          // Deduplicate if already extracted from an overlapping screenshot
          const isDuplicate = mgrState.extractedBlueTexts.some((existing) => {
            const sameName = normalizeThaiDocName(existing.cleanName) === normalizeThaiDocName(cleanName);
            const isSameExt = (existing.ext === ext) || 
                              ((existing.ext === 'JPG' || existing.ext === 'JPEG') && (ext === 'JPG' || ext === 'JPEG'));
            return sameName && isSameExt;
          });

          if (!isDuplicate) {
            mgrState.extractedBlueTexts.push({
              cleanName: cleanName,
              ext: ext,
              raw: raw,
            });
          }
        });
      }
    }

    if (progressBar) progressBar.style.width = '100%';
    if (progressStatus) progressStatus.innerText = 'วิเคราะห์ด้วย Google Vision AI เสร็จสิ้น! กำลังเปรียบเทียบกับ Master Checklist...';

    evaluateChecklistMatching();

    setTimeout(() => {
      if (progressModal) progressModal.classList.add('hidden');
      renderAuditResults();
      showToast('ตรวจประมวลผลด้วย Google Vision AI เรียบร้อยแล้ว', 'success');
    }, 400);

  } catch (err) {
    console.error('Google Vision AI Error:', err);
    if (progressModal) progressModal.classList.add('hidden');
    
    // Display detailed error in Modal
    const fallbackModal = document.getElementById('apiErrorFallbackModal');
    const errDetailText = document.getElementById('apiErrorDetailText');

    if (errDetailText) {
      errDetailText.innerText = err.message || 'Google Vision API Key Error';
    }

    if (fallbackModal) {
      fallbackModal.classList.remove('hidden');
    }

    showToast('❌ การประมวลผล Google Vision AI ล้มเหลว', 'error');
  }
}

/* =========================================================
 * STEP 3: Audit Engine Trigger & Vision AI Call
 * ========================================================= */
function setupAuditListeners() {
  const btnStart = document.getElementById('btnStartAudit');
  if (btnStart) {
    btnStart.addEventListener('click', () => {
      if (!mgrState.isStep1Confirmed) {
        showToast('🔒 กรุณาเลือกประเภทสินเชื่อและผลิตภัณฑ์ในข้อ 1 ให้ครบถ้วนก่อน', 'warning');
        return;
      }
      runAuditEngine();
    });
  }
}

/* =========================================================
 * STEP 4: Matching Logic against Filtered LOAN_CHECKLISTS
 * ========================================================= */
function evaluateChecklistMatching() {
  const items = getFilteredItemsForProduct(mgrState.selectedCategory, mgrState.selectedSubType, mgrState.hasGuarantor);
  if (!items || items.length === 0) {
    mgrState.auditResults = [];
    return;
  }

  const hasGuarantor = mgrState.hasGuarantor;
  const usedExtractIndices = new Set();
  const results = [];

  items.forEach((item) => {

    let bestMatch = null;
    let bestMatchIdx = -1;
    let highestScore = 0;

    mgrState.extractedBlueTexts.forEach((extracted, idx) => {
      if (usedExtractIndices.has(idx)) return;
      const score = calculateFuzzyMatchScore(item.targetName, extracted.cleanName, item.desc, extracted.raw);
      if (score > highestScore) {
        highestScore = score;
        bestMatch = extracted;
        bestMatchIdx = idx;
      }
    });

    if (bestMatch && highestScore >= 0.45) {
      usedExtractIndices.add(bestMatchIdx);
      const isSameFormat = (e1, e2) => {
        if (!e1 || !e2) return true;
        const a = e1.toUpperCase();
        const b = e2.toUpperCase();
        if (a === b) return true;
        return (a === 'JPG' || a === 'JPEG') && (b === 'JPG' || b === 'JPEG');
      };
      const isFormatCorrect = isSameFormat(bestMatch.ext, item.format);
      results.push({
        ...item,
        status: isFormatCorrect ? 'PASS' : 'WARNING',
        foundName: `${bestMatch.cleanName}.${bestMatch.ext || item.format.toLowerCase()}`,
        reason: isFormatCorrect ? 'ถูกต้องครบถ้วน' : `นามสกุลไฟล์ไม่ตรง (กำหนดเป็น .${item.format})`,
      });
    } else {
      if (item.mandatory) {
        const isContractGroup = (item.code && (item.code.startsWith('AA') || item.code.startsWith('BB'))) || (item.group && (item.group.startsWith('AA') || item.group.startsWith('BB')));
        results.push({
          ...item,
          status: isContractGroup ? 'PENDING_CONTRACT' : 'MISSING',
          foundName: isContractGroup ? 'รอแนบหลังอนุมัติ (กลุ่ม AA/BB สัญญา)' : 'ไม่พบในภาพถ่าย',
          reason: isContractGroup ? 'เอกสารจัดทำสัญญา (สาขาแนบส่งหลังอนุมัติได้)' : 'ขาดเอกสารบังคับยื่นเรื่อง',
        });
      }
    }
  });

  // Handle truly custom branch attachments (Exclude duplicate scans of standard checklist documents)
  const seenAttachNorms = new Set();

  mgrState.extractedBlueTexts.forEach((extracted, idx) => {
    if (usedExtractIndices.has(idx)) return;

    // Check if this extracted text actually matches ANY standard checklist item (even if already matched)
    // E.g. an extra or scrolled photo of 'เล่มหน้าปก' or 'เล่มหน้ารายการ'
    const matchesStandardChecklist = items.some((it) => {
      const score = calculateFuzzyMatchScore(it.targetName, extracted.cleanName, it.desc, extracted.raw);
      return score >= 0.45;
    });

    // If it's just a duplicate scan of a standard checklist document, skip it!
    if (matchesStandardChecklist) return;

    // Deduplicate custom attachments by normalized name
    const norm = normalizeThaiDocName(extracted.cleanName);
    if (seenAttachNorms.has(norm)) return;
    seenAttachNorms.add(norm);

    results.push({
      code: 'ATTACH',
      group: 'เอกสารแนบเพิ่มจากสาขา',
      desc: 'เอกสารแนบเพิ่มเติมจากสาขา (ต้องตรวจสอบเนื้อหาก่อนอนุมัติ)',
      targetName: 'แนบเพิ่มเติม',
      format: extracted.ext || 'FILE',
      foundName: `${extracted.cleanName}.${extracted.ext || ''}`.replace(/\.$/, ''),
      mandatory: false,
      status: 'CUSTOM_ATTACHMENT',
      reason: 'สาขาแนบเอกสารเพิ่มเติม',
    });
  });

  mgrState.auditResults = results;
}

/**
 * Advanced Thai Document Matching Engine
 * Exact key phrase, core noun subject & typo tolerance alignment algorithm
 */
function calculateFuzzyMatchScore(targetName, extractedClean, targetDesc, rawExtracted) {
  const cleanTarget = normalizeThaiDocName(targetName);
  const cleanExtracted = normalizeThaiDocName(extractedClean);
  const rawClean = normalizeThaiDocName(rawExtracted);

  // 1. Direct exact match
  if (cleanExtracted === cleanTarget) return 1.0;

  // 2. Strict distinction between Borrower vs Guarantor
  const targetIsGuarantor = cleanTarget.includes('ผู้ค้ำ') || (targetDesc && targetDesc.includes('ผู้ค้ำ'));
  const extractedIsGuarantor = cleanExtracted.includes('ผู้ค้ำ') || rawClean.includes('ผู้ค้ำ');
  if (targetIsGuarantor !== extractedIsGuarantor) {
    return 0.05; // Strict penalty if Borrower/Guarantor role mismatches
  }

  // 3. Strict Photo Index Match (e.g. รูปรถ 1 vs รูปรถ 2 vs รูปรถ 3)
  const targetNumMatch = targetName.match(/\d+/);
  const extractedNumMatch = extractedClean.match(/\d+/);
  if (targetNumMatch && extractedNumMatch) {
    if (targetNumMatch[0] === extractedNumMatch[0]) {
      const targetPrefix = cleanTarget.replace(/\d+/g, '');
      const extractedPrefix = cleanExtracted.replace(/\d+/g, '');
      if (targetPrefix === extractedPrefix || targetPrefix.includes(extractedPrefix) || extractedPrefix.includes(targetPrefix)) {
        return 0.98; // Exact photo index match!
      }
    } else {
      return 0.1; // Photo index number mismatch penalty
    }
  }

  // 4. Strict Core Subject Noun Match (e.g. เงินกู้ vs มอบสินค้า vs มอบอำนาจ)
  const subjectTarget = getCoreDocSubject(cleanTarget);
  const subjectExtracted = getCoreDocSubject(cleanExtracted);
  const subjectSim = levenshteinSimilarity(subjectTarget, subjectExtracted);
  if (subjectSim < 0.6) {
    return 0.1; // Rejects mismatched documents like ใบรับเงินกู้ vs ใบรับมอบสินค้า!
  }

  // 5. Direct Substring Match
  if (cleanExtracted.includes(cleanTarget) || cleanTarget.includes(cleanExtracted)) return 0.95;
  if (rawClean.includes(cleanTarget)) return 0.90;

  // 6. Levenshtein Typo-Tolerant Similarity
  return Math.max(
    levenshteinSimilarity(cleanTarget, cleanExtracted),
    levenshteinSimilarity(cleanTarget, rawClean)
  );
}

/**
 * Strips common prefix words (ใบรับ, สำเนา, หนังสือ, รูปถ่าย) to isolate core document subject noun
 */
function getCoreDocSubject(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[._\-/\s]/g, '')
    .replace(/^(สำเนา|ใบรับ|ใบ|หนังสือ|แบบฟอร์ม|รูปถ่าย|รูป|เอกสาร|ฉบับ)/g, '');
}

function levenshteinSimilarity(s1, s2) {
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1.0;
  const len1 = s1.length;
  const len2 = s2.length;
  const track = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));
  for (let i = 0; i <= len1; i += 1) track[0][i] = i;
  for (let j = 0; j <= len2; j += 1) track[j][0] = j;
  for (let j = 1; j <= len2; j += 1) {
    for (let i = 1; i <= len1; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }
  const distance = track[len2][len1];
  return 1 - distance / Math.max(len1, len2);
}

function normalizeThaiDocName(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[._\-/\s]/g, '')
    .replace(/เว็บบนส่ง/g, 'เว็บขนส่ง') // Common OCR typo: บ instead of ข
    .replace(/เว็บขนส่งทางบก/g, 'เว็บขนส่ง')
    .replace(/เว็ปขนส่ง/g, 'เว็บขนส่ง')
    .replace(/เมลขออนุโลมประกัน/g, 'อนุโลมประกัน')
    .replace(/เมล์ขออนุโลมประกัน/g, 'อนุโลมประกัน')
    .replace(/ขออนุโลมประกัน/g, 'อนุโลมประกัน')
    .replace(/สำเนา/g, 'สำเนา')
    .replace(/บัตรปชช/g, 'บัตรประชาชน')
    .replace(/บัตรประชาชน/g, 'บัตรประชาชน')
    .replace(/ทะเบียนบ้าน/g, 'ทะเบียนบ้าน')
    .replace(/ทะเบียนรถ/g, 'เล่มทะเบียน')
    .replace(/คู่มือ/g, 'เล่มทะเบียน')
    .replace(/เล่ม/g, 'เล่มทะเบียน')
    .replace(/ผู้ค้ำประกัน/g, 'ผู้ค้ำ')
    .replace(/ทวงถามหนี้/g, 'ทวงถาม')
    .replace(/หนังสือทวงถาม/g, 'ทวงถาม');
}

function getThaiDocTokens(text) {
  const keywords = ['บัตรประชาชน', 'ทะเบียนบ้าน', 'เล่มทะเบียน', 'ผู้กู้', 'ผู้ค้ำ', 'ทวงถาม', 'สัญญา', 'ประเมิน', 'รูปรถ', 'รูปถ่าย', 'ใบเปลี่ยนชื่อ', 'ตารางผ่อน', 'สลิป', 'สเตทเม้นท์', 'โฉนด'];
  const tokens = [];
  keywords.forEach((kw) => {
    if (text.includes(kw)) tokens.push(kw);
  });
  if (tokens.length === 0) {
    tokens.push(text);
  }
  return tokens;
}

/* =========================================================
 * STEP 5: Render Audit Results Dashboard & Table
 * ========================================================= */
function renderAuditResults() {
  const section = document.getElementById('auditResultsSection');
  if (!section) return;

  section.classList.remove('hidden');

  const activeResults = mgrState.auditResults;
  const passCount = activeResults.filter((r) => r.status === 'PASS').length;
  const warningCount = activeResults.filter((r) => r.status === 'WARNING').length;
  const missingCount = activeResults.filter((r) => r.status === 'MISSING').length;
  const customCount = activeResults.filter((r) => r.status === 'CUSTOM_ATTACHMENT').length;
  const totalMandatory = activeResults.filter((r) => r.status !== 'CUSTOM_ATTACHMENT').length;

  // Update Metric Scorecards
  if (document.getElementById('metricTotal')) document.getElementById('metricTotal').innerText = totalMandatory;
  if (document.getElementById('metricPass')) document.getElementById('metricPass').innerText = passCount;
  if (document.getElementById('metricWarning')) document.getElementById('metricWarning').innerText = warningCount;
  if (document.getElementById('metricMissing')) document.getElementById('metricMissing').innerText = missingCount;
  if (document.getElementById('metricCustom')) document.getElementById('metricCustom').innerText = customCount;

  // Update Overall Status Banner
  const banner = document.getElementById('overallStatusBanner');
  const badge = document.getElementById('overallBadge');
  const title = document.getElementById('overallTitle');
  const subtitle = document.getElementById('overallSubtitle');
  const activeTag = document.getElementById('activeChecklistTag');

  const catNames = {
    motorcycle: 'สินเชื่อรถมอเตอร์ไซค์',
    car: 'สินเชื่อรถเก๋ง/กระบะ/รถตู้',
    truck: 'สินเชื่อรถบรรทุก',
    agri: 'สินเชื่อรถเพื่อการเกษตร',
    land: 'สินเชื่อที่ดิน',
  };

  const subNames = {
    pledge: 'จำนำเล่มทะเบียน',
    mortgage: 'จำนอง',
    refinance: 'รีไฟแนนซ์',
    topup: 'Top-up (กู้เพิ่ม)',
  };

  if (activeTag) {
    activeTag.innerText = `[${catNames[mgrState.selectedCategory]} • ${subNames[mgrState.selectedSubType]} • ${mgrState.hasGuarantor ? 'มีผู้ค้ำ' : 'ไม่มีผู้ค้ำ'}]`;
  }

  if (missingCount === 0 && warningCount === 0) {
    banner.className = 'neu-raised rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4 border-l-8 border-emerald-500 bg-emerald-50/40';
    badge.className = 'px-3 py-1 rounded-xl text-xs font-black bg-emerald-100 text-emerald-800';
    badge.innerText = '🟢 ผ่านทุกรายการบังคับ';
    title.innerText = 'เอกสารบังคับครบถ้วนและถูกต้องตามเกณฑ์';
    subtitle.innerText = customCount > 0 
      ? `เอกสารบังคับครบ แต่มีเอกสารแนบเพิ่มเติมจากสาขา ${customCount} รายการ ที่ต้องตรวจเนื้อหาก่อนอนุมัติ`
      : 'ไม่พบเอกสารขาดหรือชื่อไฟล์ผิด สามารถอนุมัติเคสต่อได้ทันที';
  } else if (missingCount > 0) {
    banner.className = 'neu-raised rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4 border-l-8 border-rose-500 bg-rose-50/40';
    badge.className = 'px-3 py-1 rounded-xl text-xs font-black bg-rose-100 text-rose-800';
    badge.innerText = `🔴 ขาดเอกสารบังคับ ${missingCount} รายการ`;
    title.innerText = 'พบรายการเอกสารบังคับที่ไม่ครบถ้วน';
    subtitle.innerText = 'โปรดแจ้งสาขาให้แนบเอกสารบังคับเพิ่มเติมตามรายการสีแดงด้านล่าง';
  } else {
    banner.className = 'neu-raised rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4 border-l-8 border-amber-500 bg-amber-50/40';
    badge.className = 'px-3 py-1 rounded-xl text-xs font-black bg-amber-100 text-amber-800';
    badge.innerText = `🟡 ข้อสังเกต ${warningCount} รายการ`;
    title.innerText = 'เอกสารครบ แต่พบชื่อไฟล์หรือชนิดไฟล์ไม่ตรงเกณฑ์';
    subtitle.innerText = 'โปรดตรวจสอบชื่อไฟล์หรือนามสกุลไฟล์สีน้ำเงินที่แจ้งไว้ด้านล่าง';
  }

  renderAuditTable();
}

function setupTableFilterListeners() {
  document.querySelectorAll('.table-filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.table-filter-btn').forEach((b) => {
        b.className = 'table-filter-btn neu-btn px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700';
      });
      btn.className = 'table-filter-btn neu-btn neu-pill-active px-3 py-1.5 rounded-xl text-xs font-bold';
      mgrState.activeTableFilter = btn.getAttribute('data-filter');
      renderAuditTable();
    });
  });
}

window.toggleApproveCustomAttachment = function(resultIndex) {
  const item = mgrState.auditResults[resultIndex];
  if (!item) return;

  if (item.status === 'CUSTOM_ATTACHMENT') {
    item.status = 'CUSTOM_APPROVED';
    item.reason = 'ผู้จัดการเขตตรวจเนื้อหาและกดอนุมัติเรียบร้อยแล้ว';
    showToast(`✅ อนุมัติเอกสารแนบเพิ่ม: "${item.foundName}" เรียบร้อยแล้ว`, 'success');
  } else if (item.status === 'CUSTOM_APPROVED') {
    item.status = 'CUSTOM_ATTACHMENT';
    item.reason = 'สาขาแนบเอกสารเพิ่มเติม (รอผจก.เขตอนุมัติ)';
    showToast(`↩️ ยกเลิกการอนุมัติเอกสารแนบเพิ่ม: "${item.foundName}"`, 'info');
  }

  renderAuditResults();
};

function renderAuditTable() {
  const tbody = document.getElementById('auditTableBody');
  if (!tbody) return;

  const filter = mgrState.activeTableFilter;
  let items = mgrState.auditResults;

  if (filter === 'missing') items = items.filter((r) => r.status === 'MISSING');
  if (filter === 'warning') items = items.filter((r) => r.status === 'WARNING');
  if (filter === 'custom') items = items.filter((r) => r.status === 'CUSTOM_ATTACHMENT' || r.status === 'CUSTOM_APPROVED');
  if (filter === 'pass') items = items.filter((r) => r.status === 'PASS' || r.status === 'CUSTOM_APPROVED');

  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-slate-500 font-bold">ไม่พบรายการที่ตรงตามตัวกรองนี้</td></tr>`;
    return;
  }

  tbody.innerHTML = items
    .map((item) => {
      // Find actual index in mgrState.auditResults
      const realIndex = mgrState.auditResults.indexOf(item);
      let badgeHtml = '';
      let rowBg = '';

      if (item.status === 'PASS') {
        badgeHtml = `<span class="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-black text-[11px] inline-flex items-center gap-1">🟢 ผ่าน</span>`;
      } else if (item.status === 'WARNING') {
        badgeHtml = `<span class="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-800 font-black text-[11px] inline-flex items-center gap-1">🟡 ชื่อ/ชนิดไม่ตรง</span>`;
        rowBg = 'bg-amber-50/50';
      } else if (item.status === 'MISSING') {
        badgeHtml = `<span class="px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800 font-black text-[11px] inline-flex items-center gap-1">🔴 ขาดเอกสารยื่นเรื่อง</span>`;
        rowBg = 'bg-rose-50/50';
      } else if (item.status === 'PENDING_CONTRACT') {
        badgeHtml = `<span class="px-2.5 py-1 rounded-xl bg-sky-100 text-sky-800 font-black text-[11px] inline-flex items-center gap-1">🟡 รอแนบหลังอนุมัติ (AA/BB)</span>`;
        rowBg = 'bg-sky-50/40';
      } else if (item.status === 'CUSTOM_ATTACHMENT') {
        badgeHtml = `
          <div class="flex flex-wrap items-center justify-center gap-1.5">
            <span class="px-2.5 py-1 rounded-xl bg-indigo-100 text-indigo-800 font-black text-[11px] inline-flex items-center gap-1">🔵 แนบเพิ่ม (ต้องตรวจ)</span>
            <button onclick="window.toggleApproveCustomAttachment(${realIndex})" class="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-[11px] transition-all neu-btn shadow-sm cursor-pointer inline-flex items-center gap-1">
              ✅ อนุมัติ
            </button>
          </div>
        `;
        rowBg = 'bg-indigo-50/40';
      } else if (item.status === 'CUSTOM_APPROVED') {
        badgeHtml = `
          <div class="flex flex-wrap items-center justify-center gap-1.5">
            <span class="px-2 py-0.5 rounded-xl bg-emerald-100 text-emerald-800 font-black text-[11px] inline-flex items-center gap-1">🟢 อนุมัติแล้ว</span>
            <button onclick="window.toggleApproveCustomAttachment(${realIndex})" class="px-2 py-0.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[10px] transition-all neu-btn cursor-pointer inline-flex items-center gap-1">
              ↩️ ยกเลิก
            </button>
          </div>
        `;
        rowBg = 'bg-emerald-50/40';
      }

      return `
      <tr class="${rowBg} hover:bg-slate-100/80 transition-colors">
        <td class="p-3 text-center font-extrabold text-slate-600">${item.code}</td>
        <td class="p-3">
          <p class="font-bold text-slate-800">${item.desc}</p>
          <span class="text-[10px] text-slate-500 font-semibold">${item.group}</span>
        </td>
        <td class="p-3">
          <span class="font-extrabold text-indigo-700">${item.targetName}</span>
          ${item.mandatory ? '<span class="ml-1 text-[10px] text-rose-600 font-black">[บังคับ]</span>' : ''}
        </td>
        <td class="p-3 font-bold text-blue-700">
          ${item.foundName}
        </td>
        <td class="p-3 text-center">
          ${badgeHtml}
        </td>
      </tr>
    `;
    })
    .join('');

  initLucideIcons();
}

/* =========================================================
 * STEP 6: Copy Audit Summary Text for LINE / Chat
 * ========================================================= */
function copyAuditSummaryText() {
  const catNames = {
    motorcycle: 'สินเชื่อรถมอเตอร์ไซค์',
    car: 'สินเชื่อรถเก๋ง/กระบะ/รถตู้',
    truck: 'สินเชื่อรถบรรทุก',
    agri: 'สินเชื่อรถเพื่อการเกษตร',
    land: 'สินเชื่อที่ดิน',
  };

  const subNames = {
    pledge: 'จำนำเล่มทะเบียน',
    mortgage: 'จำนอง',
    refinance: 'รีไฟแนนซ์',
    topup: 'Top-up (กู้เพิ่ม)',
  };

  const activeResults = mgrState.auditResults;
  const missingItems = activeResults.filter((r) => r.status === 'MISSING');
  const warningItems = activeResults.filter((r) => r.status === 'WARNING');
  const customPendingItems = activeResults.filter((r) => r.status === 'CUSTOM_ATTACHMENT');
  const customApprovedItems = activeResults.filter((r) => r.status === 'CUSTOM_APPROVED');
  const passCount = activeResults.filter((r) => r.status === 'PASS').length;

  let reportText = `📋 **รายงานผลการตรวจเอกสารสินเชื่อ (ผู้จัดการเขต)**\n`;
  reportText += `ประเภท: ${catNames[mgrState.selectedCategory]} (${subNames[mgrState.selectedSubType]})\n`;
  reportText += `การค้ำประกัน: ${mgrState.hasGuarantor ? 'มีผู้ค้ำประกัน' : 'ผู้กู้คนเดียว (ไม่มีผู้ค้ำ)'}\n`;
  reportText += `---------------------------------\n`;

  if (missingItems.length === 0 && warningItems.length === 0 && customPendingItems.length === 0) {
    reportText += `🟢 **สรุปภาพรวม: เอกสารครบถ้วน และ อนุมัติเอกสารแนบทั้งหมดแล้ว**\n`;
  } else if (missingItems.length > 0) {
    reportText += `🔴 **สรุปภาพรวม: ขาดเอกสารยื่นเรื่อง ${missingItems.length} รายการ**\n`;
  } else {
    reportText += `🟡 **สรุปภาพรวม: มีรายการรอตรวจสอบ/แก้ไข**\n`;
  }

  reportText += `• ครบถ้วน (Pass): ${passCount} รายการ\n`;
  reportText += `• ชื่อไฟล์ไม่ตรง (Warning): ${warningItems.length} รายการ\n`;
  reportText += `• ขาดเอกสารยื่นเรื่อง (Missing): ${missingItems.length} รายการ\n`;
  if (customApprovedItems.length > 0) {
    reportText += `• เอกสารแนบเพิ่ม (ผจก.เขตอนุมัติแล้ว): ${customApprovedItems.length} รายการ\n`;
  }
  if (customPendingItems.length > 0) {
    reportText += `• เอกสารแนบเพิ่ม (รอตรวจ): ${customPendingItems.length} รายการ\n`;
  }
  reportText += `\n`;

  if (missingItems.length > 0) {
    reportText += `🔴 **รายการเอกสารบังคับที่ยังขาด (โปรดแนบเพิ่ม):**\n`;
    missingItems.forEach((it, idx) => {
      reportText += `${idx + 1}. [${it.code}] ${it.targetName} (${it.format})\n`;
    });
    reportText += `\n`;
  }

  if (warningItems.length > 0) {
    reportText += `🟡 **รายการที่ชื่อไฟล์หรือนามสกุลไม่ตรง:**\n`;
    warningItems.forEach((it, idx) => {
      reportText += `${idx + 1}. [${it.code}] กำหนด: ${it.targetName}.${it.format.toLowerCase()} ➔ พบในภาพ: ${it.foundName}\n`;
    });
    reportText += `\n`;
  }

  if (customApprovedItems.length > 0) {
    reportText += `✅ **รายการเอกสารแนบเพิ่มเติมที่ ผจก.เขต อนุมัติแล้ว:**\n`;
    customApprovedItems.forEach((it, idx) => {
      reportText += `${idx + 1}. ${it.foundName} (อนุมัติแล้ว)\n`;
    });
    reportText += `\n`;
  }

  if (customPendingItems.length > 0) {
    reportText += `🔵 **รายการเอกสารแนบเพิ่มเติมจากสาขา (รอผจก.เขตตรวจ):**\n`;
    customPendingItems.forEach((it, idx) => {
      reportText += `${idx + 1}. ${it.foundName}\n`;
    });
    reportText += `\n`;
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString('th-TH') + ' ' + now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  reportText += `---------------------------------\n`;
  reportText += `ส่งจากระบบ Area Manager Audit Module • ${dateStr}`;

  navigator.clipboard
    .writeText(reportText)
    .then(() => {
      showToast('คัดลอกข้อความสรุปผลเรียบร้อยแล้ว (สามารถวางใน LINE ได้ทันที)', 'success');
    })
    .catch(() => {
      showToast('ไม่สามารถคัดลอกข้อความได้', 'error');
    });
}
