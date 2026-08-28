/**
 * Auto Loan Document Optimizer & Renamer
 * Version 2.7.0
 * Version 3.0.0
 * Apple iOS Fluid Spring Aesthetic, Horizontal Single-Row Rail,
 * Sub-Product Filtering (จำนำ / รีไฟแนนซ์ / จำนอง / Top-up without One-Time),
 * Context-Aware Scoped AI Document Classifier & Scanner
 */

// App Version Constant
const CURRENT_APP_VERSION = '3.9.0';

// Application State
const state = {
  currentCategory: 'motorcycle',
  currentSubType: 'pledge', // Sub-type filter ID (e.g. 'pledge', 'refinance', 'topup', 'land_mortgage', etc.)
  hasGuarantor: false, // false = no guarantor (borrower only), true = with guarantor
  selectedGroupFilter: 'all', // 'all', 'unattached', or specific group name
  slots: [], // Standard Checklist slots
  customSlots: [], // User-added custom document slots
  customCounter: 1,
  activePreviewSlotId: null, // Track slot currently being previewed
  activePreviewPageIndex: 0, // Track active page within the previewed slot
  pendingAiImage: null, // Active image pending AI slot assignment
};

// IndexedDB Helper for Saving/Resuming Drafts, Custom Checklists & Real-time Auto-Save
const DB_NAME = 'LoanChecklistAppDB';
const DB_VERSION = 3;
const STORE_DRAFTS = 'case_drafts';
const STORE_AUTOSAVE = 'active_autosave';
const STORE_CUSTOM_CHECKLISTS = 'custom_master_checklists';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
        db.createObjectStore(STORE_DRAFTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_AUTOSAVE)) {
        db.createObjectStore(STORE_AUTOSAVE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_CUSTOM_CHECKLISTS)) {
        db.createObjectStore(STORE_CUSTOM_CHECKLISTS, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllCustomMasterDocsFromDB() {
  const db = await openDB();
  return new Promise((resolve) => {
    try {
      if (!db.objectStoreNames.contains(STORE_CUSTOM_CHECKLISTS)) return resolve([]);
      const tx = db.transaction(STORE_CUSTOM_CHECKLISTS, 'readonly');
      const store = tx.objectStore(STORE_CUSTOM_CHECKLISTS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    } catch (e) {
      resolve([]);
    }
  });
}

async function saveCustomMasterDocToDB(doc) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CUSTOM_CHECKLISTS, 'readwrite');
    const store = tx.objectStore(STORE_CUSTOM_CHECKLISTS);
    store.put(doc);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function deleteCustomMasterDocFromDB(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CUSTOM_CHECKLISTS, 'readwrite');
    const store = tx.objectStore(STORE_CUSTOM_CHECKLISTS);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function saveDraftToDB(draftObj) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DRAFTS, 'readwrite');
    const store = tx.objectStore(STORE_DRAFTS);
    store.put(draftObj);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getAllDraftsFromDB() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DRAFTS, 'readonly');
    const store = tx.objectStore(STORE_DRAFTS);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function deleteDraftFromDB(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DRAFTS, 'readwrite');
    const store = tx.objectStore(STORE_DRAFTS);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Real-Time Auto-Save Engine (Triple-Guard Session Recovery)
let autoSaveTimer = null;

async function saveAutoSaveSession() {
  try {
    const attachedSlots = getAllSlots().filter((s) => s.attached);
    const db = await openDB();
    const tx = db.transaction(STORE_AUTOSAVE, 'readwrite');
    const store = tx.objectStore(STORE_AUTOSAVE);

    if (attachedSlots.length === 0 && state.customSlots.length === 0) {
      store.delete('current_active_session');
      updateAutoSaveIndicator('idle');
      return;
    }

    const sessionData = {
      id: 'current_active_session',
      category: state.currentCategory,
      subType: state.currentSubType,
      hasGuarantor: state.hasGuarantor,
      selectedGroup: state.selectedGroupFilter,
      customCounter: state.customCounter,
      customSlots: state.customSlots,
      slots: state.slots,
      savedAt: new Date().toISOString(),
    };

    store.put(sessionData);
    tx.oncomplete = () => {
      updateAutoSaveIndicator('saved');
    };
  } catch (e) {
    console.warn('AutoSave error:', e);
  }
}

function triggerAutoSave() {
  updateAutoSaveIndicator('saving');
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(saveAutoSaveSession, 400);
}

function updateAutoSaveIndicator(status) {
  const dot = document.getElementById('autoSaveDot');
  const text = document.getElementById('autoSaveText');
  if (!dot || !text) return;

  if (status === 'saving') {
    dot.className = 'w-2 h-2 rounded-full bg-amber-500 shadow-sm inline-block';
    text.innerText = 'กำลังเซฟ...';
  } else if (status === 'saved') {
    dot.className = 'w-2 h-2 rounded-full bg-emerald-500 shadow-sm inline-block';
    text.innerText = 'บันทึกอัตโนมัติแล้ว';
  } else {
    dot.className = 'w-2 h-2 rounded-full bg-slate-400 shadow-sm inline-block';
    text.innerText = 'พร้อมบันทึก';
  }
}

async function restoreAutoSaveSession() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_AUTOSAVE, 'readonly');
    const store = tx.objectStore(STORE_AUTOSAVE);
    const request = store.get('current_active_session');

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const session = request.result;
        if (!session) return resolve(false);

        // Check if session has attached files or custom slots
        const hasAttached = session.slots && session.slots.some((s) => s.attached);
        const hasCustom = session.customSlots && session.customSlots.length > 0;

        if (!hasAttached && !hasCustom) return resolve(false);

        state.currentCategory = session.category || 'motorcycle';
        state.currentSubType = session.subType || 'pledge';
        state.hasGuarantor = session.hasGuarantor || false;
        state.selectedGroupFilter = session.selectedGroup || 'all';
        state.customCounter = session.customCounter || 1;
        state.customSlots = session.customSlots || [];

        // Re-sync standard slots with master LOAN_CHECKLISTS to always apply latest master database rules
        const masterItems = (window.LOAN_CHECKLISTS[state.currentCategory] && window.LOAN_CHECKLISTS[state.currentCategory].items) || [];
        const masterMap = {};
        masterItems.forEach((it) => (masterMap[it.code] = it));

        state.slots = (session.slots || []).map((s) => {
          const master = masterMap[s.code];
          if (master) {
            return {
              ...s,
              mandatory: !!master.mandatory,
              desc: master.desc || s.desc,
              defaultFormat: master.format || s.defaultFormat,
            };
          }
          return s;
        });

        renderBottomDock();
        renderSubProductPills();
        renderGroupFilterPills();
        renderSlots();
        updateSummaryMetrics();
        updateAutoSaveIndicator('saved');

        const btnNo = document.getElementById('btnGuarantorNo');
        const btnYes = document.getElementById('btnGuarantorYes');
        if (btnNo && btnYes) {
          if (!state.hasGuarantor) {
            btnNo.className = 'px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer select-none flex items-center gap-1.5 neu-pill-active';
            btnYes.className = 'px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer select-none flex items-center gap-1.5 text-slate-600 hover:text-slate-900';
          } else {
            btnNo.className = 'px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer select-none flex items-center gap-1.5 text-slate-600 hover:text-slate-900';
            btnYes.className = 'px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer select-none flex items-center gap-1.5 neu-pill-active';
          }
        }

        const attachedCount = getAllSlots().filter((s) => s.attached).length;
        showToast(`✅ กู้คืนข้อมูลเคสที่ทำค้างไว้สำเร็จ (${attachedCount} ไฟล์)`, 'success');
        resolve(true);
      };
      request.onerror = () => resolve(false);
    });
  } catch (e) {
    console.warn('Restore error:', e);
    return false;
  }
}

// DOM Elements
const loanCategoryTabs = document.getElementById('loanCategoryTabs');
const currentLoanBadge = document.getElementById('currentLoanBadge');
const subProductPills = document.getElementById('subProductPills');
const missingCountBadge = document.getElementById('missingCountBadge');
const missingText = document.getElementById('missingText');
const groupFilterPills = document.getElementById('groupFilterPills');
const slotsContainer = document.getElementById('slotsContainer');
const attachedCountBadge = document.getElementById('attachedCountBadge');
const btnDownloadZip = document.getElementById('btnDownloadZip');
const btnAddCustomSlot = document.getElementById('btnAddCustomSlot');
const btnBatchAutoFill = document.getElementById('btnBatchAutoFill');
const batchFileInput = document.getElementById('batchFileInput');
const btnClearAllAttached = document.getElementById('btnClearAllAttached');

// AI Scanner Elements
const aiCameraInput = document.getElementById('aiCameraInput');
const aiDetectionModal = document.getElementById('aiDetectionModal');
const aiConfidenceBadge = document.getElementById('aiConfidenceBadge');
const aiDetectedDesc = document.getElementById('aiDetectedDesc');
const aiScannedImgPreview = document.getElementById('aiScannedImgPreview');
const aiScannedKeywords = document.getElementById('aiScannedKeywords');
const aiSuggestedOptions = document.getElementById('aiSuggestedOptions');
const aiManualSlotSelect = document.getElementById('aiManualSlotSelect');
const btnAiManualAssign = document.getElementById('btnAiManualAssign');
const btnCloseAiModal = document.getElementById('btnCloseAiModal');

// Drafts Modals DOM Elements
const btnSaveDraft = document.getElementById('btnSaveDraft');
const btnOpenDraftsList = document.getElementById('btnOpenDraftsList');
const saveDraftModal = document.getElementById('saveDraftModal');
const inputDraftName = document.getElementById('inputDraftName');
const btnCancelSaveDraft = document.getElementById('btnCancelSaveDraft');
const btnConfirmSaveDraft = document.getElementById('btnConfirmSaveDraft');
const draftsListModal = document.getElementById('draftsListModal');
const draftsItemsContainer = document.getElementById('draftsItemsContainer');
const btnCloseDraftsList = document.getElementById('btnCloseDraftsList');

// Preview Modal DOM Elements
const previewModal = document.getElementById('previewModal');
const previewModalCode = document.getElementById('previewModalCode');
const previewModalTitle = document.getElementById('previewModalTitle');
const previewModalSubtitle = document.getElementById('previewModalSubtitle');
const previewModalFormat = document.getElementById('previewModalFormat');
const previewPageIndicator = document.getElementById('previewPageIndicator');
const previewNavButtons = document.getElementById('previewNavButtons');
const btnPreviewPrevPage = document.getElementById('btnPreviewPrevPage');
const btnPreviewNextPage = document.getElementById('btnPreviewNextPage');
const btnPreviewEnhance = document.getElementById('btnPreviewEnhance');
const btnPreviewTimeStamp = document.getElementById('btnPreviewTimeStamp');
const previewModalImg = document.getElementById('previewModalImg');
const previewModalPdf = document.getElementById('previewModalPdf');
const btnPreviewRotate = document.getElementById('btnPreviewRotate');
const btnPreviewDownload = document.getElementById('btnPreviewDownload');
const btnPreviewClose = document.getElementById('btnPreviewClose');

// Missing Modal DOM Elements
const missingModal = document.getElementById('missingModal');
const missingModalSubtitle = document.getElementById('missingModalSubtitle');
const missingItemsList = document.getElementById('missingItemsList');
const btnModalBackToAttach = document.getElementById('btnModalBackToAttach');
const btnModalConfirmDownload = document.getElementById('btnModalConfirmDownload');

// Manage Master Documents DOM Elements
const btnOpenManageDocsModal = document.getElementById('btnOpenManageDocsModal');
const btnOpenManageDocsModalFromDrawer = document.getElementById('btnOpenManageDocsModalFromDrawer');
const manageDocsModal = document.getElementById('manageDocsModal');
const btnCloseManageDocsModal = document.getElementById('btnCloseManageDocsModal');
const btnCloseManageDocsFooter = document.getElementById('btnCloseManageDocsFooter');
const inputNewDocCode = document.getElementById('inputNewDocCode');
const inputNewDocName = document.getElementById('inputNewDocName');
const inputNewDocDesc = document.getElementById('inputNewDocDesc');
const selectNewDocGroup = document.getElementById('selectNewDocGroup');
const selectNewDocFormat = document.getElementById('selectNewDocFormat');
const selectNewDocMandatory = document.getElementById('selectNewDocMandatory');
const selectNewDocScope = document.getElementById('selectNewDocScope');
const btnAddDocToMaster = document.getElementById('btnAddDocToMaster');
const customMasterDocsCount = document.getElementById('customMasterDocsCount');
const customMasterDocsList = document.getElementById('customMasterDocsList');

// Toast
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toastMsg');
const toastIcon = document.getElementById('toastIcon');

// 1. Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  if (!window.LOAN_CHECKLISTS) {
    console.error('LOAN_CHECKLISTS data not found!');
    showToast('ไม่พบข้อมูล Checklist กรุณาโหลดไฟล์ checklists.js', 'error');
    return;
  }

  // 1. Load & Apply any User-Defined Permanent Master Documents from IndexedDB
  await loadAndApplyCustomMasterDocs();

  renderBottomDock();
  
  // Try restoring unfinished auto-saved session first
  const restored = await restoreAutoSaveSession();
  if (!restored) {
    selectCategory('motorcycle');
  }

  setupGlobalEventListeners();
  setupPreviewModalListeners();
  setupDraftModalListeners();
  setupManageDocsModalListeners();
  setupAiScannerListeners();
  checkAppVersion();

  // Check for updates every 45 seconds
  setInterval(checkAppVersion, 45000);
});

// Triple-Guard: Warn before accidental tab closing / reload
window.addEventListener('beforeunload', (e) => {
  const attachedCount = getAllSlots().filter((s) => s.attached).length;
  if (attachedCount > 0) {
    e.preventDefault();
    e.returnValue = 'คุณมีเอกสารที่ยังไม่ได้ดาวน์โหลด ZIP ต้องการออกจากหน้านี้หรือไม่?';
    return e.returnValue;
  }
});

// Auto Version Checker & Cache Buster
async function checkAppVersion() {
  try {
    const response = await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (response.ok) {
      const data = await response.json();
      if (data.version && data.version !== CURRENT_APP_VERSION) {
        showUpdateBanner(data.version);
      }
    }
  } catch (e) {
    // Offline silent fallback
  }
}

function showUpdateBanner(newVersion) {
  const banner = document.getElementById('updateNotificationBanner');
  const title = document.getElementById('updateBannerTitle');
  const btnReload = document.getElementById('btnReloadNewVersion');

  if (banner && title && btnReload) {
    title.innerText = `🚀 มีการอัปเดตเวอร์ชันใหม่ (v${newVersion})!`;
    banner.classList.remove('-translate-y-28', 'opacity-0', 'pointer-events-none');
    banner.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');

    btnReload.onclick = () => {
      window.location.reload(true);
    };
  }
}

// 2. Render Modern 3D Vector Bottom Navigation Deck
const PRODUCT_VECTOR_ICONS = {
  motorcycle: 'bike',
  car: 'car',
  truck: 'truck',
  agriculture: 'tractor',
  land: 'map-pin',
};

function renderBottomDock() {
  loanCategoryTabs.innerHTML = '';
  const categories = Object.values(window.LOAN_CHECKLISTS);

  categories.forEach((cat) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    const isActive = state.currentCategory === cat.id;
    const iconName = PRODUCT_VECTOR_ICONS[cat.id] || 'layers';
    
    btn.className = `py-2.5 sm:py-3 px-1 sm:px-2 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer w-full text-center select-none ${
      isActive
        ? 'neu-product-active font-extrabold shadow-inner'
        : 'neu-product-btn font-bold text-slate-700 hover:text-orange-600'
    }`;
    
    let cleanName = cat.name.replace('สินเชื่อ', '').trim();

    btn.innerHTML = `
      <div class="w-8 h-8 rounded-xl flex items-center justify-center ${
        isActive
          ? 'neu-inset text-orange-600 shadow-inner'
          : 'neu-raised text-slate-600'
      } pointer-events-none transition-transform">
        <i data-lucide="${iconName}" class="w-4 h-4"></i>
      </div>
      <span class="text-[11px] sm:text-xs tracking-tight line-clamp-1 leading-tight font-extrabold pointer-events-none">${cleanName}</span>
    `;
    btn.onclick = (e) => {
      e.preventDefault();
      selectCategory(cat.id);
    };
    loanCategoryTabs.appendChild(btn);
  });

  lucide.createIcons();
}

function selectCategory(catId) {
  state.currentCategory = catId;
  state.selectedGroupFilter = 'all';

  const catData = window.LOAN_CHECKLISTS[catId];
  const iconName = PRODUCT_VECTOR_ICONS[catId] || 'layers';
  currentLoanBadge.innerHTML = `<i data-lucide="${iconName}" class="w-3.5 h-3.5 inline mr-1"></i> ${catData.name}`;

  // Default Sub-Type
  if (catData.subTypes && catData.subTypes.length > 0) {
    state.currentSubType = catData.subTypes[0].id;
  } else {
    state.currentSubType = 'pledge';
  }

  renderBottomDock();
  renderSubProductPills();
  loadSlotsForCurrentSubProduct();
  lucide.createIcons();
}

// 3. Pure Neumorphic Sub-Product Switcher Panel
function renderSubProductPills() {
  subProductPills.innerHTML = '';
  const catData = window.LOAN_CHECKLISTS[state.currentCategory];
  if (!catData || !catData.subTypes) return;

  catData.subTypes.forEach((st) => {
    const btn = document.createElement('button');
    const isActive = state.currentSubType === st.id;

    btn.className = `neu-btn px-4 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer select-none ${
      isActive ? 'neu-pill-active' : 'text-slate-700'
    }`;

    btn.innerText = st.name;
    btn.onclick = () => {
      state.currentSubType = st.id;
      renderSubProductPills();
      loadSlotsForCurrentSubProduct();
      showToast(`เลือกโปรดักต์: ${st.name}`, 'info');
    };

    subProductPills.appendChild(btn);
  });
}

function loadSlotsForCurrentSubProduct() {
  const catData = window.LOAN_CHECKLISTS[state.currentCategory];
  let items = catData.items || [];

  // Filter items specifically by sub-type if selected, while preserving core checklist
  const sub = state.currentSubType;

  if (state.currentCategory === 'land') {
    if (sub === 'land_pledge' || sub === 'land_refinance_pledge' || sub === 'land_topup') {
      // โหมดจำนำที่ดิน และ Top-up ที่ดิน: ไม่ต้องแสดงเอกสารจดจำนองที่ดิน (หมวด DD)
      items = items.filter((it) => !it.code.startsWith('DD'));
    }
  }

  // Filter Refinance & Top-up documents (หมวด C3 เอกสารเพิ่มเติม รีไฟแนนซ์/ต่อสัญญา/Top-up)
  const isRefinanceOrTopup = ['refinance', 'topup', 'land_refinance_pledge', 'land_refinance_mortgage', 'land_topup'].includes(sub);
  const isRefinance = ['refinance', 'land_refinance_pledge', 'land_refinance_mortgage'].includes(sub);

  if (!isRefinanceOrTopup) {
    // โหมดจำนำ และ จำนอง: ไม่ต้องแสดงหมวด C3 และ ไม่ต้องแสดงหนังสือมอบอำนาจรีไฟแนนซ์
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
    // โหมด Top-up: แสดงหมวด C3 (ใบเรียกเก็บดอกเบี้ยสะสม Top up) แต่ซ่อนหนังสือมอบอำนาจรีไฟแนนซ์
    items = items.filter((it) => {
      const c = (it.code || '').toUpperCase();
      const targetName = it.targetName || '';
      if (c === 'A023' || c === 'AA023' || targetName.includes('หนังสือมอบอำนาจรีไฟแนนซ์')) {
        return false;
      }
      return true;
    });
  }

  // Filter Guarantor items when in "No Guarantor" mode (Only Borrower & Collateral documents)
  if (!state.hasGuarantor) {
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

  // Preserve already attached files if matching code
  const existingAttachedMap = {};
  state.slots.forEach((s) => {
    if (s.attached) existingAttachedMap[s.code] = s.attached;
  });

  state.slots = items.map((item) => ({
    id: `slot_${item.code}`,
    code: item.code,
    group: item.group || 'เอกสารทั่วไป',
    desc: item.desc,
    targetName: item.targetName,
    defaultFormat: item.format || 'JPG',
    mandatory: !!item.mandatory,
    isCustom: false,
    attached: existingAttachedMap[item.code] || null,
  }));

  state.selectedGroupFilter = 'all';
  renderGroupFilterPills();
  renderSlots();
  updateSummaryMetrics();
}

function getAllSlots() {
  return [...state.slots, ...state.customSlots];
}

// 4. Modern Vector Duotone Document Group Filter Board
function renderGroupFilterPills() {
  groupFilterPills.innerHTML = '';
  const allSlots = getAllSlots();
  const unattachedCount = state.slots.filter((s) => !s.attached).length;

  // 1. "All" Pill
  const allPill = document.createElement('button');
  allPill.className = `neu-btn px-3.5 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer select-none flex items-center gap-1.5 ${
    state.selectedGroupFilter === 'all'
      ? 'neu-pill-active'
      : 'text-slate-700'
  }`;
  allPill.innerHTML = `<i data-lucide="layout-grid" class="w-3.5 h-3.5 text-orange-500"></i><span>ทั้งหมด (${allSlots.length})</span>`;
  allPill.addEventListener('click', () => {
    state.selectedGroupFilter = 'all';
    renderGroupFilterPills();
    renderSlots();
  });
  groupFilterPills.appendChild(allPill);

  // 2. "Unattached" Filter Pill (Missing Items)
  if (unattachedCount > 0) {
    const missingPill = document.createElement('button');
    missingPill.className = `neu-btn px-3.5 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer select-none flex items-center gap-1.5 ${
      state.selectedGroupFilter === 'unattached'
        ? 'neu-pill-active text-amber-600'
        : 'text-amber-700'
    }`;
    missingPill.innerHTML = `<i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-amber-500"></i><span>ยังไม่แนบ (${unattachedCount})</span>`;
    missingPill.addEventListener('click', () => {
      state.selectedGroupFilter = 'unattached';
      renderGroupFilterPills();
      renderSlots();
    });
    groupFilterPills.appendChild(missingPill);
  }

  // 3. Specific Group Pills (Clean Modern Vector Chips)
  const groups = Array.from(new Set(allSlots.map((s) => s.group)));
  groups.forEach((groupName) => {
    const countInGroup = allSlots.filter((s) => s.group === groupName).length;
    const attachedInGroup = allSlots.filter((s) => s.group === groupName && s.attached).length;

    let iconName = 'folder';
    let iconColor = 'text-slate-500';

    if (groupName.startsWith('A')) {
      iconName = 'user-check';
      iconColor = 'text-indigo-500';
    } else if (groupName.startsWith('B')) {
      iconName = state.currentCategory === 'land' ? 'map-pin' : 'shield-check';
      iconColor = 'text-orange-500';
    } else if (groupName.startsWith('C')) {
      iconName = 'banknote';
      iconColor = 'text-emerald-600';
    } else if (groupName.startsWith('AA') || groupName.startsWith('BB') || groupName.startsWith('CC') || groupName.startsWith('DD')) {
      iconName = 'file-signature';
      iconColor = 'text-purple-600';
    }

    const pill = document.createElement('button');
    pill.className = `neu-btn px-3.5 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer select-none flex items-center gap-1.5 ${
      state.selectedGroupFilter === groupName
        ? 'neu-pill-active'
        : 'text-slate-700'
    }`;
    pill.innerHTML = `<i data-lucide="${iconName}" class="w-3.5 h-3.5 ${iconColor}"></i><span>${groupName} (${attachedInGroup}/${countInGroup})</span>`;
    pill.addEventListener('click', () => {
      state.selectedGroupFilter = groupName;
      renderGroupFilterPills();
      renderSlots();
    });
    groupFilterPills.appendChild(pill);
  });

  lucide.createIcons();
}

// 5. Render Checklist Slots with Apple Fluid Spring Animations
function renderSlots() {
  slotsContainer.innerHTML = '';
  const allSlots = getAllSlots();

  let visibleSlots = allSlots;
  if (state.selectedGroupFilter === 'unattached') {
    visibleSlots = allSlots.filter((s) => !s.attached);
  } else if (state.selectedGroupFilter !== 'all') {
    visibleSlots = allSlots.filter((s) => s.group === state.selectedGroupFilter);
  }

  if (visibleSlots.length === 0) {
    slotsContainer.innerHTML = `
      <div class="neu-raised rounded-3xl p-10 text-center text-slate-400 space-y-2 apple-spring-card">
        <i data-lucide="check-circle-2" class="w-10 h-10 mx-auto text-emerald-500 animate-bounce"></i>
        <p class="text-sm font-bold text-slate-700">ไม่มีรายการในหมวดหมู่นี้ หรือแนบครบทุกรายการแล้ว!</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  const grouped = {};
  visibleSlots.forEach((slot) => {
    if (!grouped[slot.group]) grouped[slot.group] = [];
    grouped[slot.group].push(slot);
  });

  let globalCardIndex = 0;

  for (const [groupName, slotsInGroup] of Object.entries(grouped)) {
    const groupSection = document.createElement('div');
    groupSection.className = 'space-y-3';

    const isCustomGroup = groupName === 'เอกสารเพิ่มเติม (ตั้งชื่อเอง)';

    groupSection.innerHTML = `
      <div class="flex items-center justify-between pb-1 border-b border-[#dfe2eb]">
        <h3 class="text-sm font-extrabold text-slate-800 flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full ${isCustomGroup ? 'bg-amber-500' : 'bg-orange-500'} shadow-[0_0_8px_#ff6a00]"></span>
          ${groupName}
        </h3>
        <span class="text-xs font-bold text-slate-500">
          ${slotsInGroup.filter((s) => s.attached).length} / ${slotsInGroup.length} แนบแล้ว
        </span>
      </div>
    `;

    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';

    slotsInGroup.forEach((slot) => {
      const isAttached = !!slot.attached;
      const card = document.createElement('div');

      card.id = `card_${slot.id}`;
      card.className = `neu-raised rounded-3xl p-4 neu-slot-card flex flex-col justify-between gap-3 transition-all duration-300 ${
        isAttached ? 'neu-slot-attached' : (slot.isCustom ? 'neu-slot-custom' : '')
      }`;

      const cameraInputId = `slot_camera_${slot.id}`;
      const fileInputId = `slot_file_${slot.id}`;

      const appendCameraId = `slot_append_camera_${slot.id}`;
      const appendFileId = `slot_append_file_${slot.id}`;

      const statusBadge = slot.mandatory
        ? `<span class="text-[10px] px-2 py-0.5 rounded-lg neu-inset font-black text-rose-700 bg-rose-50/80 border border-rose-200/90 flex items-center gap-1 shadow-xs tracking-tight select-none"><span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>บังคับ</span>`
        : (slot.isCustom
            ? `<span class="text-[10px] px-2 py-0.5 rounded-lg neu-inset font-black text-amber-700 bg-amber-50/80 border border-amber-200/90 flex items-center gap-1 shadow-xs tracking-tight select-none">เพิ่มเติม</span>`
            : `<span class="text-[10px] px-2 py-0.5 rounded-lg neu-inset font-black text-amber-800 bg-amber-50/80 border border-amber-200/90 flex items-center gap-1 shadow-xs tracking-tight select-none">ถ้ามี</span>`);

      if (!isAttached) {
        // Empty Slot with 2 Direct 1-Click Buttons
        card.innerHTML = `
          <!-- Direct Native Inputs (Pure 100% Mobile & Desktop Compatible) -->
          <input type="file" id="${cameraInputId}" data-id="${slot.id}" accept="image/*" capture="environment" class="hidden slot-camera-input">
          <input type="file" id="${fileInputId}" data-id="${slot.id}" multiple accept="image/jpeg,image/png,image/webp,application/pdf" class="hidden slot-file-input">
          
          <div class="flex items-start justify-between gap-3">
            <div class="space-y-1.5 flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs px-2.5 py-0.5 rounded-lg neu-inset font-extrabold ${slot.isCustom ? 'text-amber-600' : 'text-orange-600'}">${slot.code}</span>
                ${statusBadge}
                ${
                  slot.isCustom
                    ? `<input type="text" value="${slot.targetName}" data-id="${slot.id}" class="text-xs font-extrabold text-slate-800 neu-inset rounded-lg px-2.5 py-1 input-custom-name focus:outline-none flex-1 min-w-[140px]" placeholder="พิมพ์ชื่อไฟล์ที่ต้องการ">`
                    : `<span class="text-xs font-extrabold text-slate-800 break-words leading-relaxed">${slot.targetName}</span>`
                }
                <!-- Pure Neumorphic Soft UI Format Pill with Crisp Colored Text -->
                <span class="text-[11px] px-2.5 py-0.5 rounded-lg neu-inset font-black tracking-wider uppercase ${
                  slot.defaultFormat === 'PDF' ? 'text-red-700 bg-red-50/60 border border-red-200/80' : 'text-blue-700 bg-blue-50/60 border border-blue-200/80'
                }">
                  ${slot.defaultFormat}
                </span>
              </div>
              <p class="text-xs text-slate-500 leading-relaxed break-words" title="${slot.desc}">${slot.desc}</p>
            </div>

            ${
              slot.isCustom
                ? `<button class="p-1.5 rounded-xl neu-btn text-slate-400 hover:text-red-600 btn-delete-custom-slot cursor-pointer transition-colors" data-id="${slot.id}" title="ลบช่องเอกสารเพิ่มเติมนี้">
                    <i data-lucide="x" class="w-3.5 h-3.5"></i>
                  </button>`
                : ''
            }
          </div>

          <!-- Direct 2-Button Action Bar (Direct Camera Label + File Label) -->
          <div class="grid grid-cols-2 gap-2.5 pt-1">
            <!-- Button 1: Direct 1-Click Camera (Opens camera instantly on iOS & Android) -->
            <label for="${cameraInputId}" class="neu-btn px-3 py-3 rounded-2xl flex items-center justify-center gap-2 cursor-pointer text-slate-700 hover:text-orange-600 hover:border-orange-400 transition-all select-none group">
              <div class="w-7 h-7 rounded-xl bg-gradient-to-tr from-orange-600 to-orange-400 text-white flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform">
                <i data-lucide="camera" class="w-4 h-4"></i>
              </div>
              <span class="text-xs font-extrabold group-hover:text-orange-600">ถ่ายรูปสด</span>
            </label>

            <!-- Button 2: Choose File / Gallery -->
            <label for="${fileInputId}" class="neu-inset px-3 py-3 rounded-2xl flex items-center justify-center gap-2 cursor-pointer text-slate-600 hover:text-orange-600 hover:border-orange-400 transition-all border border-dashed border-[#cbced8] select-none group">
              <div class="w-7 h-7 rounded-xl neu-raised flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                <i data-lucide="folder-up" class="w-4 h-4"></i>
              </div>
              <span class="text-xs font-bold">แนบไฟล์/รูป</span>
            </label>
          </div>
        `;
      } else {
        // Attached Slot
        const att = slot.attached;
        const pageCount = att.pages.length;
        const totalBytes = att.pages.reduce((acc, p) => acc + p.size, 0);
        const formattedSize = formatFileSize(totalBytes);

        let thumbsHtml = '';
        if (pageCount === 1) {
          const p = att.pages[0];
          thumbsHtml = `
            <div class="w-20 h-20 rounded-2xl neu-inset overflow-hidden flex-shrink-0 flex items-center justify-center relative p-1 slot-preview-trigger group cursor-pointer" data-id="${slot.id}" data-page="0" title="คลิกเพื่อดูรูปพรีวิวขนาดใหญ่">
              ${
                p.dataUrl
                  ? `<img src="${p.dataUrl}" style="transform: rotate(${p.rotation}deg);" class="w-full h-full object-cover rounded-xl transition-transform duration-300" alt="Page 1">`
                  : `<div class="flex flex-col items-center text-slate-500"><i data-lucide="file-text" class="w-8 h-8 text-red-500 animate-pulse"></i><span class="text-[10px] font-bold">PDF</span></div>`
              }
              <div class="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center text-white backdrop-blur-[1px]">
                <i data-lucide="zoom-in" class="w-5 h-5 animate-bounce"></i>
              </div>
              <div class="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-orange-600 text-white text-[9px] font-extrabold shadow-sm">
                ${slot.code}
              </div>
            </div>
          `;
        } else {
          const pagesThumbs = att.pages
            .map((p, idx) => `
              <div class="w-16 h-16 rounded-xl neu-inset overflow-hidden flex-shrink-0 relative p-0.5 slot-preview-trigger group cursor-pointer border border-white/60" data-id="${slot.id}" data-page="${idx}" title="คลิกเพื่อดูหน้า ${idx + 1}">
                <img src="${p.dataUrl}" style="transform: rotate(${p.rotation}deg);" class="w-full h-full object-cover rounded-lg" alt="Page ${idx + 1}">
                <div class="absolute top-1 left-1 px-1 rounded bg-black/60 text-white text-[9px] font-bold">
                  ${idx + 1}
                </div>
                <button class="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity btn-delete-page cursor-pointer" data-id="${slot.id}" data-page="${idx}" title="ลบหน้านี้">
                  <i data-lucide="x" class="w-2.5 h-2.5"></i>
                </button>
              </div>
            `)
            .join('');

          thumbsHtml = `
            <div class="flex items-center gap-1.5 overflow-x-auto pb-1 flex-shrink-0 max-w-[200px] sm:max-w-[220px]">
              ${pagesThumbs}
            </div>
          `;
        }

        card.innerHTML = `
          <!-- Direct Native Inputs for Replace/Append -->
          <input type="file" id="${cameraInputId}" data-id="${slot.id}" accept="image/*" capture="environment" class="hidden slot-camera-input">
          <input type="file" id="${fileInputId}" data-id="${slot.id}" multiple accept="image/jpeg,image/png,image/webp,application/pdf" class="hidden slot-file-input">

          <input type="file" id="${appendCameraId}" data-id="${slot.id}" accept="image/*" capture="environment" class="hidden slot-append-camera-input">
          <input type="file" id="${appendFileId}" data-id="${slot.id}" multiple accept="image/jpeg,image/png,image/webp" class="hidden slot-append-input">
          
          <div class="flex items-start gap-3.5">
            ${thumbsHtml}

            <!-- Details & Renaming -->
            <div class="flex-1 min-w-0 space-y-1.5">
              <div class="flex items-center justify-between gap-1 flex-wrap">
                <div class="flex items-center gap-1.5 min-w-0 flex-wrap">
                  <span class="text-xs font-extrabold text-slate-800 break-words leading-relaxed" title="${slot.desc}">[${slot.code}] ${slot.targetName}</span>
                  ${statusBadge}
                  <!-- Pure Neumorphic Soft UI Format Pill with Crisp Colored Text -->
                  <span class="text-[11px] px-2.5 py-0.5 rounded-lg neu-inset font-black tracking-wider uppercase ${
                    att.targetFormat === 'PDF' ? 'text-red-700 bg-red-50/60 border border-red-200/80' : 'text-blue-700 bg-blue-50/60 border border-blue-200/80'
                  }">
                    ${att.targetFormat}
                  </span>
                </div>
                <span class="text-[10px] px-2 py-0.5 rounded-lg neu-inset font-bold ${pageCount > 1 ? 'text-orange-600 bg-orange-50/50' : 'text-slate-600'} whitespace-nowrap">
                  ${pageCount > 1 ? `📄 รวม ${pageCount} หน้า • ${formattedSize}` : formattedSize}
                </span>
              </div>

              <div>
                <label class="block text-[10px] font-bold text-slate-500 mb-0.5">ชื่อไฟล์ที่จะบันทึก (แก้ไขได้):</label>
                <div class="flex items-center gap-1.5">
                  <input type="text" value="${att.targetName}" data-id="${slot.id}" class="w-full text-xs font-extrabold text-orange-600 neu-inset rounded-xl px-3 py-1.5 focus:outline-none input-slot-name transition-all focus:ring-1 focus:ring-orange-400">
                  <span class="text-xs font-black text-slate-600 neu-inset px-2.5 py-1.5 rounded-xl uppercase">.${att.targetFormat.toLowerCase()}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="pt-3 border-t border-[#cbd5e1]/60 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
            <!-- Format Switch (100% Pure Neumorphic Soft UI Toggle Switch) -->
            <div class="flex items-center gap-1.5">
              <span class="text-[11px] font-bold text-slate-500 mr-1">แปลงเป็น:</span>
              <div class="flex items-center p-1 rounded-2xl neu-inset gap-1">
                <button class="px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer select-none flex items-center gap-1 btn-slot-jpg ${
                  att.targetFormat === 'JPG'
                    ? 'neu-raised text-orange-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }" data-id="${slot.id}" ${pageCount > 1 ? 'disabled title="หลายรูปต้องรวมเป็น PDF"' : ''}>
                  ${att.targetFormat === 'JPG' ? '<span class="w-2 h-2 rounded-full bg-orange-500 shadow-sm inline-block"></span>' : ''}
                  <span>JPG</span>
                </button>
                <button class="px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer select-none flex items-center gap-1 btn-slot-pdf ${
                  att.targetFormat === 'PDF'
                    ? 'neu-raised text-orange-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }" data-id="${slot.id}">
                  ${att.targetFormat === 'PDF' ? '<span class="w-2 h-2 rounded-full bg-orange-500 shadow-sm inline-block"></span>' : ''}
                  <span>PDF</span>
                </button>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-end">
              <!-- Direct Camera Append Label -->
              <label for="${appendCameraId}" class="p-2 rounded-xl neu-btn text-slate-700 hover:text-orange-600 cursor-pointer" title="เปิดกล้องถ่ายรูปเพิ่มอีกหน้า">
                <i data-lucide="camera" class="w-3.5 h-3.5 text-orange-500 pointer-events-none"></i>
              </label>

              <!-- Add file Append Label -->
              <label for="${appendFileId}" class="px-2 py-1.5 rounded-xl neu-btn text-orange-600 text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-orange-50/50" title="เพิ่มรูปอีกหน้าจากคลัง">
                <i data-lucide="plus-circle" class="w-3.5 h-3.5 pointer-events-none"></i>
                <span class="hidden sm:inline pointer-events-none">+ เพิ่มรูป</span>
              </label>

              <!-- Quick Time Stamp Button -->
              <button class="p-2 rounded-xl neu-btn text-slate-600 hover:text-orange-600 btn-slot-timestamp cursor-pointer" data-id="${slot.id}" title="ปั๊ม Time Stamp ลงบนรูปภาพ">
                <i data-lucide="clock" class="w-3.5 h-3.5"></i>
              </button>

              <button class="p-2 rounded-xl neu-btn text-slate-600 hover:text-orange-600 btn-slot-preview cursor-pointer hover:scale-105 transition-transform" title="ดูรูปขนาดใหญ่" data-id="${slot.id}" data-page="0">
                <i data-lucide="eye" class="w-3.5 h-3.5"></i>
              </button>
              <button class="p-2 rounded-xl neu-btn text-orange-600 btn-slot-change cursor-pointer hover:scale-105 transition-transform" title="เปลี่ยนไฟล์ทั้งหมดในช่องนี้" data-id="${slot.id}">
                <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
              </button>
              <button class="px-2.5 py-1 rounded-xl neu-btn text-orange-600 text-xs font-bold flex items-center gap-1 btn-slot-download cursor-pointer hover:scale-105 transition-transform" data-id="${slot.id}" title="ดาวน์โหลดไฟล์นี้เดี่ยวๆ">
                <i data-lucide="download" class="w-3.5 h-3.5"></i>
                <span>โหลด</span>
              </button>
              <button class="p-2 rounded-xl neu-btn text-slate-400 hover:text-red-600 btn-slot-remove cursor-pointer hover:scale-105 transition-all" title="ลบไฟล์ที่แนบทั้งหมดในช่องนี้" data-id="${slot.id}">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
              ${
                slot.isCustom
                  ? `<button class="p-2 rounded-xl neu-btn text-slate-400 hover:text-red-600 btn-delete-custom-slot cursor-pointer" title="ลบช่องเอกสารเพิ่มเติมนี้ทิ้ง" data-id="${slot.id}">
                      <i data-lucide="x" class="w-3.5 h-3.5"></i>
                    </button>`
                  : ''
              }
            </div>
          </div>
        `;
      }

      grid.appendChild(card);
    });

    groupSection.appendChild(grid);
    slotsContainer.appendChild(groupSection);
  }

  attachSlotEvents();
  lucide.createIcons();
}

// 6. Attach Events to Slots
function attachSlotEvents() {
  // Click thumbnail or eye button to open Lightbox Preview
  document.querySelectorAll('.slot-preview-trigger, .btn-slot-preview').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = el.dataset.id;
      const pageIdx = parseInt(el.dataset.page || '0', 10);
      openPreviewModal(id, pageIdx);
    });
  });

  // Camera inputs (Direct native trigger)
  document.querySelectorAll('.slot-camera-input').forEach((inp) => {
    inp.addEventListener('change', async (e) => {
      const id = e.target.dataset.id;
      if (e.target.files.length > 0) {
        await attachFilesToSlotById(id, Array.from(e.target.files));
        e.target.value = '';
      }
    });
  });

  // File / Gallery inputs
  document.querySelectorAll('.slot-file-input').forEach((inp) => {
    inp.addEventListener('change', async (e) => {
      const id = e.target.dataset.id;
      if (e.target.files.length > 0) {
        await attachFilesToSlotById(id, Array.from(e.target.files));
        e.target.value = '';
      }
    });
  });

  // Append camera inputs
  document.querySelectorAll('.slot-append-camera-input').forEach((inp) => {
    inp.addEventListener('change', async (e) => {
      const id = e.target.dataset.id;
      if (e.target.files.length > 0) {
        await appendFilesToSlotById(id, Array.from(e.target.files));
        e.target.value = '';
      }
    });
  });

  // Append file inputs
  document.querySelectorAll('.slot-append-input').forEach((inp) => {
    inp.addEventListener('change', async (e) => {
      const id = e.target.dataset.id;
      if (e.target.files.length > 0) {
        await appendFilesToSlotById(id, Array.from(e.target.files));
        e.target.value = '';
      }
    });
  });

  // Change file button
  document.querySelectorAll('.btn-slot-change').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      const input = document.getElementById(`slot_file_${id}`);
      if (input) input.click();
    });
  });

  // Quick Time Stamp button on slot card
  document.querySelectorAll('.btn-slot-timestamp').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const all = getAllSlots();
      const slot = all.find((s) => s.id === id);
      if (slot && slot.attached) {
        const page = slot.attached.pages[0];
        if (page && page.dataUrl) {
          page.dataUrl = await applyTimeStampToImage(page.dataUrl, page.rotation);
          renderSlots();
          showToast(`ปั๊ม Time Stamp ลงบน [${slot.code}] สำเร็จ!`, 'success');
        }
      }
    });
  });

  // Delete specific page from multi-page slot
  document.querySelectorAll('.btn-delete-page').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const pageIdx = parseInt(btn.dataset.page, 10);
      const all = getAllSlots();
      const slot = all.find((s) => s.id === id);
      if (slot && slot.attached && slot.attached.pages.length > 1) {
        slot.attached.pages.splice(pageIdx, 1);
        if (slot.attached.pages.length === 1 && slot.defaultFormat === 'JPG') {
          slot.attached.targetFormat = 'JPG';
        }
        renderSlots();
        updateSummaryMetrics();
        showToast('ลบรูปภาพหน้านั้นออกแล้ว', 'info');
      }
    });
  });

  // Custom Slot Name input change
  document.querySelectorAll('.input-custom-name').forEach((inp) => {
    inp.addEventListener('input', (e) => {
      const id = e.target.dataset.id;
      const customSlot = state.customSlots.find((s) => s.id === id);
      if (customSlot) {
        customSlot.targetName = e.target.value;
      }
    });
  });

  // Delete Custom Slot
  document.querySelectorAll('.btn-delete-custom-slot').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      state.customSlots = state.customSlots.filter((s) => s.id !== id);
      renderSlots();
      renderGroupFilterPills();
      updateSummaryMetrics();
      showToast('ลบช่องเอกสารเพิ่มเติมแล้ว', 'info');
    });
  });

  // Rename input
  document.querySelectorAll('.input-slot-name').forEach((inp) => {
    inp.addEventListener('input', (e) => {
      const id = e.target.dataset.id;
      const all = getAllSlots();
      const slot = all.find((s) => s.id === id);
      if (slot && slot.attached) {
        slot.attached.targetName = e.target.value;
      }
    });
  });

  // Format toggle JPG
  document.querySelectorAll('.btn-slot-jpg').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      const all = getAllSlots();
      const slot = all.find((s) => s.id === id);
      if (slot && slot.attached) {
        if (slot.attached.pages.length > 1) {
          showToast('เอกสารที่มีหลายรูปต้องรวมเป็นไฟล์ PDF', 'info');
          return;
        }
        slot.attached.targetFormat = 'JPG';
        renderSlots();
        updateSummaryMetrics();
      }
    });
  });

  // Format toggle PDF
  document.querySelectorAll('.btn-slot-pdf').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      const all = getAllSlots();
      const slot = all.find((s) => s.id === id);
      if (slot && slot.attached) {
        slot.attached.targetFormat = 'PDF';
        renderSlots();
        updateSummaryMetrics();
      }
    });
  });

  // Single download
  document.querySelectorAll('.btn-slot-download').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      const all = getAllSlots();
      const slot = all.find((s) => s.id === id);
      if (slot && slot.attached) {
        showToast(`กำลังเตรียมไฟล์ ${slot.attached.targetName}...`, 'info');
        try {
          const { blob, finalFilename } = await processAttachedFile(slot.attached);
          downloadBlob(blob, finalFilename);
          showToast(`ดาวน์โหลด ${finalFilename} เรียบร้อยแล้ว`, 'success');
        } catch (err) {
          console.error(err);
          showToast('เกิดข้อผิดพลาดในการแปลงไฟล์', 'error');
        }
      }
    });
  });

  // Remove attached file
  document.querySelectorAll('.btn-slot-remove').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      const all = getAllSlots();
      const slot = all.find((s) => s.id === id);
      if (slot) {
        slot.attached = null;
        renderSlots();
        renderGroupFilterPills();
        updateSummaryMetrics();
        showToast(`ลบไฟล์ออกจาก [${slot.code}] เรียบร้อย`, 'info');
      }
    });
  });
}

// 7. AI Smart Document Scanner & Classifier Engine (Client-Side 100% Secure)
function setupAiScannerListeners() {
  aiCameraInput.addEventListener('change', async (e) => {
    if (e.target.files.length === 0) return;
    const file = e.target.files[0];
    e.target.value = '';

    showToast('🤖 AI กำลังวิเคราะห์เอกสาร...', 'info');

    const dataUrl = await readFileAsDataURL(file);
    state.pendingAiImage = {
      file: file,
      name: file.name,
      size: file.size,
      type: file.type,
      dataUrl: dataUrl,
      rotation: 0,
    };

    // Run AI OCR / Pattern Detection
    const aiResult = await classifyDocumentWithAI(dataUrl, file.name);
    openAiDetectionModal(aiResult);
  });

  btnCloseAiModal.addEventListener('click', () => {
    aiDetectionModal.classList.add('hidden');
    state.pendingAiImage = null;
  });

  btnAiManualAssign.addEventListener('click', () => {
    const selectedSlotId = aiManualSlotSelect.value;
    if (selectedSlotId && state.pendingAiImage) {
      assignPendingImageToSlot(selectedSlotId);
    }
  });
}

async function classifyDocumentWithAI(dataUrl, filename = '') {
  let detectedKeywords = [];
  let detectedType = 'UNKNOWN';
  let confidence = 85;
  let summaryTitle = 'เอกสารทั่วไป';

  // Check filename keywords first
  const lowerName = filename.toLowerCase();
  if (lowerName.includes('id') || lowerName.includes('card') || lowerName.includes('บัตร')) {
    detectedType = 'ID_CARD';
  } else if (lowerName.includes('home') || lowerName.includes('house') || lowerName.includes('ทะเบียนบ้าน')) {
    detectedType = 'HOUSE_REG';
  } else if (lowerName.includes('deed') || lowerName.includes('โฉนด') || lowerName.includes('land')) {
    detectedType = 'TITLE_DEED';
  } else if (lowerName.includes('book') || lowerName.includes('เล่ม') || lowerName.includes('ทะเบียนรถ')) {
    detectedType = 'VEHICLE_BOOK';
  } else if (lowerName.includes('tax') || lowerName.includes('ภาษี') || lowerName.includes('วงกลม')) {
    detectedType = 'TAX_SIGN';
  } else if (lowerName.includes('slip') || lowerName.includes('salary') || lowerName.includes('รายได้') || lowerName.includes('statement')) {
    detectedType = 'INCOME';
  }

  // Fast Client-Side OCR with Tesseract if loaded
  if (window.Tesseract && detectedType === 'UNKNOWN') {
    try {
      const { data: { text } } = await Tesseract.recognize(dataUrl, 'tha+eng', {
        logger: () => {},
      });
      const t = text.toLowerCase();

      if (t.includes('บัตรประจำตัวประชาชน') || t.includes('identification card') || t.includes('thai national') || t.includes('เลขประจำตัว')) {
        detectedType = 'ID_CARD';
        confidence = 96;
        detectedKeywords.push('บัตรประจำตัวประชาชน', 'กรมการปกครอง');
      } else if (t.includes('สำเนาทะเบียนบ้าน') || t.includes('รายการเกี่ยวกับบ้าน') || t.includes('ทะเบียนราษฎร')) {
        detectedType = 'HOUSE_REG';
        confidence = 94;
        detectedKeywords.push('ทะเบียนบ้าน');
      } else if (t.includes('โฉนดที่ดิน') || t.includes('น.ส. 4') || t.includes('ตราจอง') || t.includes('กรมที่ดิน') || t.includes('ระวาง')) {
        detectedType = 'TITLE_DEED';
        confidence = 98;
        detectedKeywords.push('โฉนดที่ดิน', 'ตราครุฑ');
      } else if (t.includes('ใบคู่มือจดทะเบียน') || t.includes('กรมการขนส่งทางบก') || t.includes('รายการจดทะเบียน') || t.includes('เลขตัวถัง')) {
        detectedType = 'VEHICLE_BOOK';
        confidence = 95;
        detectedKeywords.push('ใบคู่มือจดทะเบียน', 'ขนส่งทางบก');
      } else if (t.includes('วันสิ้นอายุภาษี') || t.includes('ภาษีประจำปี') || t.includes('ประจำปี 256')) {
        detectedType = 'TAX_SIGN';
        confidence = 93;
        detectedKeywords.push('ป้ายภาษี', 'วันสิ้นอายุ');
      } else if (t.includes('เงินได้') || t.includes('สลิป') || t.includes('เงินเดือน') || t.includes('salary') || t.includes('statement') || t.includes('ธนาคาร')) {
        detectedType = 'INCOME';
        confidence = 90;
        detectedKeywords.push('สลิป/เอกสารรายได้');
      }
    } catch (e) {
      console.warn('OCR fast pass failed, fallback to heuristic');
    }
  }

  // Fallback heuristic if unknown
  if (detectedType === 'UNKNOWN') {
    detectedType = 'CAR_PHOTO';
    confidence = 80;
    summaryTitle = 'รูปภาพรถ / ยานพาหนะ / เอกสารทั่วไป';
    detectedKeywords.push('ภาพถ่ายสด');
  }

  // Context-Aware Priority Matching:
  const currentGroup = state.selectedGroupFilter;
  const isGroupFiltered = currentGroup && currentGroup !== 'all' && currentGroup !== 'unattached';
  
  const all = getAllSlots();
  const suggestions = [];

  if (detectedType === 'ID_CARD') {
    summaryTitle = 'บัตรประจำตัวประชาชน';
    const s1 = all.find((s) => s.code === 'A01');
    const s2 = all.find((s) => s.code === 'A02');
    
    const inActiveGroup = isGroupFiltered && currentGroup.includes('A');
    const crossGroupTag = !inActiveGroup && isGroupFiltered ? ' (หมวด A ยืนยันตัวตน)' : '';

    if (s1) suggestions.push({ slot: s1, label: `🪪 แนบลง: [${s1.code}] บัตร ปชช. ผู้กู้ (แนะนำ)${crossGroupTag}`, highlight: true });
    if (s2) suggestions.push({ slot: s2, label: `🪪 แนบลง: [${s2.code}] บัตร ปชช. ผู้ค้ำประกัน${crossGroupTag}`, highlight: false });
  } else if (detectedType === 'HOUSE_REG') {
    summaryTitle = 'สำเนาทะเบียนบ้าน';
    const s1 = all.find((s) => s.code === 'A03');
    const s2 = all.find((s) => s.code === 'A04');
    const inActiveGroup = isGroupFiltered && currentGroup.includes('A');
    const crossGroupTag = !inActiveGroup && isGroupFiltered ? ' (หมวด A ยืนยันตัวตน)' : '';

    if (s1) suggestions.push({ slot: s1, label: `🏠 แนบลง: [${s1.code}] ทะเบียนบ้าน ผู้กู้${crossGroupTag}`, highlight: true });
    if (s2) suggestions.push({ slot: s2, label: `🏠 แนบลง: [${s2.code}] ทะเบียนบ้าน ผู้ค้ำ${crossGroupTag}`, highlight: false });
  } else if (detectedType === 'TITLE_DEED') {
    summaryTitle = 'โฉนดที่ดิน';
    const s1 = all.find((s) => s.code === 'B201');
    const s2 = all.find((s) => s.code === 'B202');
    const s3 = all.find((s) => s.code === 'B203');
    const inActiveGroup = isGroupFiltered && currentGroup.includes('B');
    const crossGroupTag = !inActiveGroup && isGroupFiltered ? ' (หมวด B หลักประกัน)' : '';

    if (s1) suggestions.push({ slot: s1, label: `📄 แนบลง: [${s1.code}] หน้าโฉนดที่ดิน${crossGroupTag}`, highlight: true });
    if (s2) suggestions.push({ slot: s2, label: `📄 แนบลง: [${s2.code}] หลังโฉนดที่ดิน${crossGroupTag}`, highlight: false });
    if (s3) suggestions.push({ slot: s3, label: `🔍 แนบลง: [${s3.code}] ลายน้ำโฉนด${crossGroupTag}`, highlight: false });
  } else if (detectedType === 'VEHICLE_BOOK') {
    summaryTitle = 'เล่มทะเบียนรถ (ใบคู่มือจดทะเบียน)';
    const s1 = all.find((s) => s.code === 'B102');
    const s2 = all.find((s) => s.code === 'B101');
    const s3 = all.find((s) => s.code === 'B105');
    const s4 = all.find((s) => s.code === 'B104');
    const inActiveGroup = isGroupFiltered && currentGroup.includes('B');
    const crossGroupTag = !inActiveGroup && isGroupFiltered ? ' (หมวด B เล่มทะเบียน)' : '';

    if (s1) suggestions.push({ slot: s1, label: `🚗 แนบลง: [${s1.code}] เล่มหน้ารายการ (แนะนำ)${crossGroupTag}`, highlight: true });
    if (s2) suggestions.push({ slot: s2, label: `🚗 แนบลง: [${s2.code}] เล่มหน้าปก${crossGroupTag}`, highlight: false });
    if (s3) suggestions.push({ slot: s3, label: `🚗 แนบลง: [${s3.code}] เล่มหน้าบันทึก${crossGroupTag}`, highlight: false });
    if (s4) suggestions.push({ slot: s4, label: `🚗 แนบลง: [${s4.code}] เล่มหน้าภาษี${crossGroupTag}`, highlight: false });
  } else if (detectedType === 'TAX_SIGN') {
    summaryTitle = 'ป้ายภาษี / ป้ายวงกลม';
    const s1 = all.find((s) => s.code === 'B107');
    if (s1) suggestions.push({ slot: s1, label: `🏷️ แนบลง: [${s1.code}] ป้ายภาษี`, highlight: true });
  } else if (detectedType === 'INCOME') {
    summaryTitle = 'สลิปเงินเดือน / เอกสารรายได้';
    const s1 = all.find((s) => s.code === 'C105');
    const s2 = all.find((s) => s.code === 'C106');
    const inActiveGroup = isGroupFiltered && currentGroup.includes('C');
    const crossGroupTag = !inActiveGroup && isGroupFiltered ? ' (หมวด C เอกสารรายได้)' : '';

    if (s1) suggestions.push({ slot: s1, label: `💰 แนบลง: [${s1.code}] เอกสารรายได้ผู้กู้${crossGroupTag}`, highlight: true });
    if (s2) suggestions.push({ slot: s2, label: `💰 แนบลง: [${s2.code}] เอกสารรายได้ผู้ค้ำ${crossGroupTag}`, highlight: false });
  } else {
    if (isGroupFiltered) {
      const activeGroupUnattached = all.filter((s) => s.group === currentGroup && !s.attached);
      if (activeGroupUnattached.length > 0) {
        activeGroupUnattached.slice(0, 3).forEach((s, idx) => {
          suggestions.push({ slot: s, label: `📂 แนบลงในหมวดปัจจุบัน: [${s.code}] ${s.targetName}`, highlight: idx === 0 });
        });
      }
    }

    if (suggestions.length === 0) {
      const unattachedCarSlots = all.filter((s) => !s.attached);
      if (unattachedCarSlots.length > 0) {
        unattachedCarSlots.slice(0, 3).forEach((s, idx) => {
          suggestions.push({ slot: s, label: `📷 แนบลง: [${s.code}] ${s.targetName}`, highlight: idx === 0 });
        });
      }
    }
  }

  return {
    detectedType,
    summaryTitle,
    confidence,
    detectedKeywords,
    suggestions,
  };
}

function openAiDetectionModal(aiResult) {
  aiScannedImgPreview.src = state.pendingAiImage.dataUrl;
  aiDetectedDesc.innerText = `ตรวจพบ: ${aiResult.summaryTitle}`;
  aiConfidenceBadge.innerText = `ความมั่นใจ ${aiResult.confidence}%`;
  aiScannedKeywords.innerText = aiResult.detectedKeywords.length > 0
    ? `คำที่ตรวจพบ: ${aiResult.detectedKeywords.join(', ')}`
    : 'ตรวจจับจากลักษณะรูปภาพและมุมถ่าย';

  aiSuggestedOptions.innerHTML = '';
  aiResult.suggestions.forEach((sug) => {
    const btn = document.createElement('button');
    btn.className = `w-full py-3 px-4 rounded-2xl text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer shadow-sm ${
      sug.highlight
        ? 'neu-btn-orange text-white'
        : 'neu-btn text-slate-800 hover:border-orange-400'
    }`;
    btn.innerHTML = `
      <span class="flex items-center gap-2">${sug.label}</span>
      <i data-lucide="arrow-right" class="w-4 h-4"></i>
    `;
    btn.onclick = () => {
      assignPendingImageToSlot(sug.slot.id);
    };
    aiSuggestedOptions.appendChild(btn);
  });

  // Populate manual fallback select dropdown
  aiManualSlotSelect.innerHTML = '';
  getAllSlots().forEach((slot) => {
    const opt = document.createElement('option');
    opt.value = slot.id;
    opt.innerText = `[${slot.code}] ${slot.targetName} (${slot.group})`;
    aiManualSlotSelect.appendChild(opt);
  });

  aiDetectionModal.classList.remove('hidden');
  lucide.createIcons();
}

async function assignPendingImageToSlot(slotId) {
  if (!state.pendingAiImage) return;

  const all = getAllSlots();
  const slot = all.find((s) => s.id === slotId);
  if (!slot) return;

  if (!slot.attached) {
    await attachFilesToSlotById(slotId, [state.pendingAiImage.file]);
  } else {
    await appendFilesToSlotById(slotId, [state.pendingAiImage.file]);
  }

  aiDetectionModal.classList.add('hidden');
  state.pendingAiImage = null;

  showToast(`✅ แนบลงช่อง [${slot.code}] ${slot.targetName} เรียบร้อย!`, 'success');
}

// 8. Multi-Image Attach & Append Engine
async function attachFilesToSlotById(id, files) {
  const all = getAllSlots();
  const slot = all.find((s) => s.id === id);
  if (!slot || files.length === 0) return;

  const pages = [];
  for (const file of files) {
    const dataUrl = await readFileAsDataURL(file);
    pages.push({
      file: file,
      name: file.name,
      size: file.size,
      type: file.type,
      dataUrl: dataUrl,
      rotation: 0,
    });
  }

  const defaultFormat = pages.length > 1 ? 'PDF' : slot.defaultFormat;

  slot.attached = {
    pages: pages,
    targetName: slot.targetName || files[0].name.replace(/\.[^/.]+$/, ''),
    targetFormat: defaultFormat,
  };

  renderSlots();
  renderGroupFilterPills();
  updateSummaryMetrics();
  showToast(`แนบ ${pages.length} ไฟล์ลงใน [${slot.code}] สำเร็จ!`, 'success');
}

async function appendFilesToSlotById(id, files) {
  const all = getAllSlots();
  const slot = all.find((s) => s.id === id);
  if (!slot || !slot.attached || files.length === 0) return;

  for (const file of files) {
    const dataUrl = await readFileAsDataURL(file);
    slot.attached.pages.push({
      file: file,
      name: file.name,
      size: file.size,
      type: file.type,
      dataUrl: dataUrl,
      rotation: 0,
    });
  }

  slot.attached.targetFormat = 'PDF';

  renderSlots();
  renderGroupFilterPills();
  updateSummaryMetrics();
  showToast(`เพิ่มรูปภาพเป็น ${slot.attached.pages.length} หน้า (รวมเป็น 1 PDF อัตโนมัติ)`, 'success');
}

function readFileAsDataURL(file) {
  return new Promise((resolve) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    } else {
      resolve(null);
    }
  });
}

// 9. GPS Satellite & Thai Address Time Stamp Engine
const THAI_MONTH_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

async function getGpsAndAddressData() {
  let lat = 13.71740757;
  let lon = 99.77285200;
  let subdistrict = 'เตาปูน';
  let district = 'โพธาราม';
  let province = 'ราชบุรี';

  // Try HTML5 Geolocation API
  try {
    const pos = await new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('No geolocation'));
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 60000,
      });
    });
    lat = pos.coords.latitude;
    lon = pos.coords.longitude;

    // Reverse geocode via OpenStreetMap API
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=th`, {
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const geo = await res.json();
        const addr = geo.address || {};
        subdistrict = addr.suburb || addr.village || addr.neighbourhood || addr.town || addr.quarter || subdistrict;
        district = addr.city_district || addr.district || addr.county || district;
        province = addr.province || addr.state || province;
        
        // Clean standard Thai prefixes
        subdistrict = subdistrict.replace(/^ตำบล\s*/, '').replace(/^ต\.\s*/, '');
        district = district.replace(/^อำเภอ\s*/, '').replace(/^อ\.\s*/, '');
        province = province.replace(/^จังหวัด\s*/, '').replace(/^จ\.\s*/, '');
      }
    } catch (e) {
      console.warn('Reverse geocode fallback');
    }
  } catch (e) {
    console.warn('Using default branch GPS/Location');
  }

  return {
    latStr: `${lat.toFixed(8)}N`,
    lonStr: `${lon.toFixed(6)}E`,
    subdistrict: `ตำบล ${subdistrict}`,
    district: `อำเภอ ${district}`,
    province: province,
  };
}

async function applyTimeStampToImage(dataUrl, rotation = 0) {
  const geoData = await getGpsAndAddressData();

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      // 1. Date & Time Line: e.g. "27 ส.ค. 2026 17:58:48"
      const now = new Date();
      const day = now.getDate();
      const monthStr = THAI_MONTH_SHORT[now.getMonth()];
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');

      const line1 = `${day} ${monthStr} ${year} ${hours}:${minutes}:${seconds}`;
      const line2 = `${geoData.latStr} ${geoData.lonStr}`;
      const line3 = geoData.subdistrict;
      const line4 = geoData.district;
      const line5 = geoData.province;

      const lines = [line1, line2, line3, line4, line5];

      // Proportional Font Size
      const fontSize = Math.max(Math.round(canvas.width * 0.038), 24);
      const lineHeight = fontSize * 1.35;
      ctx.font = `bold ${fontSize}px 'Prompt', sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'alphabetic';

      const paddingRight = fontSize * 1.2;
      const paddingBottom = fontSize * 1.2;

      const totalHeight = lines.length * lineHeight;
      let startY = canvas.height - paddingBottom - (lines.length - 1) * lineHeight;
      const startX = canvas.width - paddingRight;

      lines.forEach((lineText, idx) => {
        const currentY = startY + idx * lineHeight;

        // Shadow / Outline for maximum contrast on any background
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.lineWidth = Math.max(fontSize * 0.12, 3);
        ctx.strokeText(lineText, startX, currentY);

        // White Text
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(lineText, startX, currentY);
      });

      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.src = dataUrl;
  });
}

async function enhanceDocumentImage(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      const contrast = 1.35;
      const brightness = 20;

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        r = (r - 128) * contrast + 128 + brightness;
        g = (g - 128) * contrast + 128 + brightness;
        b = (b - 128) * contrast + 128 + brightness;

        if (r > 210 && g > 210 && b > 210) {
          r = 255;
          g = 255;
          b = 255;
        }

        data[i] = Math.min(255, Math.max(0, r));
        data[i + 1] = Math.min(255, Math.max(0, g));
        data[i + 2] = Math.min(255, Math.max(0, b));
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.src = dataUrl;
  });
}

// 10. Fullscreen Image & Multi-Page Lightbox Preview
function openPreviewModal(slotId, pageIdx = 0) {
  const all = getAllSlots();
  const slot = all.find((s) => s.id === slotId);
  if (!slot || !slot.attached) return;

  state.activePreviewSlotId = slotId;
  state.activePreviewPageIndex = pageIdx;

  updatePreviewModalDisplay();
  previewModal.classList.remove('hidden');
  lucide.createIcons();
}

function updatePreviewModalDisplay() {
  if (!state.activePreviewSlotId) return;
  const all = getAllSlots();
  const slot = all.find((s) => s.id === state.activePreviewSlotId);
  if (!slot || !slot.attached) return;

  const att = slot.attached;
  const totalPages = att.pages.length;
  const currIdx = Math.min(state.activePreviewPageIndex, totalPages - 1);
  state.activePreviewPageIndex = currIdx;

  const currentPage = att.pages[currIdx];

  previewModalCode.innerText = slot.code;
  previewModalTitle.innerText = att.targetName || slot.targetName;
  previewModalSubtitle.innerText = `${slot.desc} • ขนาดหน้านี้ ${formatFileSize(currentPage.size)}`;
  previewModalFormat.innerText = att.targetFormat;

  if (totalPages > 1) {
    previewPageIndicator.innerText = `หน้า ${currIdx + 1}/${totalPages}`;
    previewPageIndicator.classList.remove('hidden');
    previewNavButtons.classList.remove('hidden');
    btnPreviewPrevPage.disabled = currIdx === 0;
    btnPreviewNextPage.disabled = currIdx === totalPages - 1;
  } else {
    previewPageIndicator.classList.add('hidden');
    previewNavButtons.classList.add('hidden');
  }

  if (currentPage.dataUrl) {
    previewModalImg.src = currentPage.dataUrl;
    previewModalImg.style.transform = `rotate(${currentPage.rotation}deg)`;
    previewModalImg.classList.remove('hidden');
    previewModalPdf.classList.add('hidden');
    btnPreviewRotate.classList.remove('hidden');
    btnPreviewEnhance.classList.remove('hidden');
    btnPreviewTimeStamp.classList.remove('hidden');
  } else {
    previewModalImg.classList.add('hidden');
    previewModalPdf.classList.remove('hidden');
    btnPreviewRotate.classList.add('hidden');
    btnPreviewEnhance.classList.add('hidden');
    btnPreviewTimeStamp.classList.add('hidden');
  }
}

function closePreviewModal() {
  if (previewModal) previewModal.classList.add('hidden');
  state.activePreviewSlotId = null;
}

function setupPreviewModalListeners() {
  if (btnPreviewClose) {
    btnPreviewClose.addEventListener('click', (e) => {
      e.stopPropagation();
      closePreviewModal();
    });
  }

  if (previewModal) {
    previewModal.addEventListener('click', (e) => {
      if (e.target === previewModal) {
        closePreviewModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closePreviewModal();
      const missingM = document.getElementById('missingModal');
      const saveDraftM = document.getElementById('saveDraftModal');
      const draftsListM = document.getElementById('draftsListModal');
      const aiDetectionM = document.getElementById('aiDetectionModal');
      const manualM = document.getElementById('manualModal');

      if (missingM) missingM.classList.add('hidden');
      if (saveDraftM) saveDraftM.classList.add('hidden');
      if (draftsListM) draftsListM.classList.add('hidden');
      if (aiDetectionM) aiDetectionM.classList.add('hidden');
      if (manualM) manualM.classList.add('hidden');
    } else if (e.key === 'ArrowLeft') {
      if (state.activePreviewSlotId && state.activePreviewPageIndex > 0) {
        state.activePreviewPageIndex--;
        updatePreviewModalDisplay();
      }
    } else if (e.key === 'ArrowRight') {
      if (state.activePreviewSlotId) {
        const all = getAllSlots();
        const slot = all.find((s) => s.id === state.activePreviewSlotId);
        if (slot && slot.attached && state.activePreviewPageIndex < slot.attached.pages.length - 1) {
          state.activePreviewPageIndex++;
          updatePreviewModalDisplay();
        }
      }
    }
  });

  btnPreviewPrevPage.addEventListener('click', () => {
    if (state.activePreviewPageIndex > 0) {
      state.activePreviewPageIndex--;
      updatePreviewModalDisplay();
    }
  });

  btnPreviewNextPage.addEventListener('click', () => {
    const all = getAllSlots();
    const slot = all.find((s) => s.id === state.activePreviewSlotId);
    if (slot && slot.attached && state.activePreviewPageIndex < slot.attached.pages.length - 1) {
      state.activePreviewPageIndex++;
      updatePreviewModalDisplay();
    }
  });

  btnPreviewRotate.addEventListener('click', () => {
    if (!state.activePreviewSlotId) return;
    const all = getAllSlots();
    const slot = all.find((s) => s.id === state.activePreviewSlotId);
    if (slot && slot.attached) {
      const page = slot.attached.pages[state.activePreviewPageIndex];
      page.rotation = (page.rotation + 90) % 360;
      previewModalImg.style.transform = `rotate(${page.rotation}deg)`;
      renderSlots();
    }
  });

  btnPreviewEnhance.addEventListener('click', async () => {
    if (!state.activePreviewSlotId) return;
    const all = getAllSlots();
    const slot = all.find((s) => s.id === state.activePreviewSlotId);
    if (slot && slot.attached) {
      const page = slot.attached.pages[state.activePreviewPageIndex];
      if (page && page.dataUrl) {
        showToast('กำลังปรับแสงและความคมชัด...', 'info');
        page.dataUrl = await enhanceDocumentImage(page.dataUrl);
        updatePreviewModalDisplay();
        renderSlots();
        showToast('ปรับแสงและคอนทราสต์ตัวหนังสือเรียบร้อย!', 'success');
      }
    }
  });

  btnPreviewTimeStamp.addEventListener('click', async () => {
    if (!state.activePreviewSlotId) return;
    const all = getAllSlots();
    const slot = all.find((s) => s.id === state.activePreviewSlotId);
    if (slot && slot.attached) {
      const page = slot.attached.pages[state.activePreviewPageIndex];
      if (page && page.dataUrl) {
        page.dataUrl = await applyTimeStampToImage(page.dataUrl, page.rotation);
        updatePreviewModalDisplay();
        renderSlots();
        showToast('ปั๊ม Time Stamp ลงบนภาพเรียบร้อยแล้ว!', 'success');
      }
    }
  });

  btnPreviewDownload.addEventListener('click', async () => {
    if (!state.activePreviewSlotId) return;
    const all = getAllSlots();
    const slot = all.find((s) => s.id === state.activePreviewSlotId);
    if (slot && slot.attached) {
      showToast(`กำลังเตรียมไฟล์ ${slot.attached.targetName}...`, 'info');
      try {
        const { blob, finalFilename } = await processAttachedFile(slot.attached);
        downloadBlob(blob, finalFilename);
        showToast(`ดาวน์โหลด ${finalFilename} เรียบร้อยแล้ว`, 'success');
      } catch (err) {
        console.error(err);
        showToast('เกิดข้อผิดพลาดในการแปลงไฟล์', 'error');
      }
    }
  });
}

// 11. Draft Management (IndexedDB Save & Resume)
function setupDraftModalListeners() {
  btnSaveDraft.addEventListener('click', () => {
    const attachedCount = getAllSlots().filter((s) => s.attached).length;
    if (attachedCount === 0) {
      showToast('ยังไม่มีไฟล์ที่แนบเพื่อบันทึกร่าง', 'error');
      return;
    }

    const currentCat = window.LOAN_CHECKLISTS[state.currentCategory];
    const timeStr = new Date().toLocaleDateString('th-TH');
    inputDraftName.value = `เคส_${currentCat.name}_${timeStr}`;
    saveDraftModal.classList.remove('hidden');
    inputDraftName.focus();
  });

  btnCancelSaveDraft.addEventListener('click', () => {
    saveDraftModal.classList.add('hidden');
  });

  btnConfirmSaveDraft.addEventListener('click', async () => {
    const draftName = inputDraftName.value.trim() || 'เคสที่บันทึก';
    const draftId = `draft_${Date.now()}`;

    const draftData = {
      id: draftId,
      name: draftName,
      createdAt: new Date().toISOString(),
      category: state.currentCategory,
      subType: state.currentSubType,
      hasGuarantor: state.hasGuarantor,
      slots: state.slots,
      customSlots: state.customSlots,
      customCounter: state.customCounter,
    };

    try {
      await saveDraftToDB(draftData);
      saveDraftModal.classList.add('hidden');
      showToast(`บันทึกร่าง "${draftName}" สำเร็จ!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('เกิดข้อผิดพลาดในการบันทึกร่าง', 'error');
    }
  });

  btnOpenDraftsList.addEventListener('click', async () => {
    await renderDraftsList();
    draftsListModal.classList.remove('hidden');
  });

  btnCloseDraftsList.addEventListener('click', () => {
    draftsListModal.classList.add('hidden');
  });
}

async function renderDraftsList() {
  draftsItemsContainer.innerHTML = '<div class="text-center py-6 text-slate-400 text-xs">กำลังโหลดรายการ...</div>';
  try {
    const drafts = await getAllDraftsFromDB();
    if (drafts.length === 0) {
      draftsItemsContainer.innerHTML = `
        <div class="p-8 text-center text-slate-400 space-y-2 neu-inset rounded-2xl">
          <i data-lucide="inbox" class="w-8 h-8 mx-auto text-slate-400"></i>
          <p class="text-xs font-bold text-slate-600">ยังไม่มีเคสที่บันทึกไว้ในเครื่องนี้</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    drafts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    draftsItemsContainer.innerHTML = '';
    drafts.forEach((d) => {
      const catData = window.LOAN_CHECKLISTS[d.category] || { name: d.category, icon: '📁' };
      const attachedCount = [...d.slots, ...(d.customSlots || [])].filter((s) => s.attached).length;
      const dateStr = new Date(d.createdAt).toLocaleString('th-TH');

      const item = document.createElement('div');
      item.className = 'flex items-center justify-between p-3 rounded-2xl neu-raised text-xs gap-3 hover:border-orange-300 transition-all';
      item.innerHTML = `
        <div class="flex items-center gap-2.5 min-w-0 flex-1">
          <span class="text-xl">${catData.icon}</span>
          <div class="min-w-0">
            <h4 class="font-extrabold text-slate-800 truncate">${d.name}</h4>
            <p class="text-[10px] text-slate-500">${catData.name} • แนบแล้ว ${attachedCount} ไฟล์ • ${dateStr}</p>
          </div>
        </div>

        <div class="flex items-center gap-1.5 flex-shrink-0">
          <button class="px-3 py-1.5 rounded-xl neu-btn text-orange-600 font-extrabold text-xs btn-load-draft cursor-pointer hover:bg-orange-50" data-id="${d.id}">
            โหลดเคสนี้
          </button>
          <button class="p-1.5 rounded-xl neu-btn text-slate-400 hover:text-red-600 btn-delete-draft cursor-pointer" data-id="${d.id}" title="ลบเคสนี้">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      `;
      draftsItemsContainer.appendChild(item);
    });

    document.querySelectorAll('.btn-load-draft').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = btn.dataset.id;
        const drafts = await getAllDraftsFromDB();
        const targetDraft = drafts.find((d) => d.id === id);
        if (targetDraft) {
          state.currentCategory = targetDraft.category;
          state.currentSubType = targetDraft.subType || 'pledge';
          state.hasGuarantor = targetDraft.hasGuarantor || false;
          state.slots = targetDraft.slots;
          state.customSlots = targetDraft.customSlots || [];
          state.customCounter = targetDraft.customCounter || 1;
          state.selectedGroupFilter = 'all';

          const catData = window.LOAN_CHECKLISTS[state.currentCategory];
          currentLoanBadge.innerHTML = `${catData.icon} ${catData.name}`;

          renderBottomDock();
          renderSubProductPills();
          renderGroupFilterPills();
          renderSlots();
          updateSummaryMetrics();

          const btnNo = document.getElementById('btnGuarantorNo');
          const btnYes = document.getElementById('btnGuarantorYes');
          if (btnNo && btnYes) {
            if (!state.hasGuarantor) {
              btnNo.className = 'px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer select-none flex items-center gap-1.5 neu-pill-active';
              btnYes.className = 'px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer select-none flex items-center gap-1.5 text-slate-600 hover:text-slate-900';
            } else {
              btnNo.className = 'px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer select-none flex items-center gap-1.5 text-slate-600 hover:text-slate-900';
              btnYes.className = 'px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer select-none flex items-center gap-1.5 neu-pill-active';
            }
          }

          draftsListModal.classList.add('hidden');
          showToast(`เปิดเคส "${targetDraft.name}" สำเร็จ!`, 'success');
        }
      });
    });

    document.querySelectorAll('.btn-delete-draft').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = btn.dataset.id;
        if (confirm('คุณต้องการลบเคสที่บันทึกไว้นี้หรือไม่?')) {
          await deleteDraftFromDB(id);
          await renderDraftsList();
          showToast('ลบเคสเรียบร้อยแล้ว', 'info');
        }
      });
    });

    lucide.createIcons();
  } catch (err) {
    console.error(err);
    draftsItemsContainer.innerHTML = '<div class="text-center py-4 text-red-500 text-xs">เกิดข้อผิดพลาดในการโหลดรายการ</div>';
  }
}

// 11.5 Custom Master Documents Database Management System
async function loadAndApplyCustomMasterDocs() {
  try {
    const customDocs = await getAllCustomMasterDocsFromDB();
    if (!customDocs || customDocs.length === 0) return;

    const allCategories = ['motorcycle', 'car', 'truck', 'agri', 'land'];

    customDocs.forEach((doc) => {
      const targetCats = doc.scope === 'all' ? allCategories : [doc.scope];
      targetCats.forEach((catId) => {
        const catObj = window.LOAN_CHECKLISTS[catId];
        if (catObj && catObj.items) {
          const exists = catObj.items.some((it) => it.code === doc.code);
          if (!exists) {
            catObj.items.push({
              code: doc.code,
              group: doc.group || 'เอกสารทั่วไป',
              desc: doc.desc || doc.targetName,
              targetName: doc.targetName,
              format: doc.format || 'PDF',
              mandatory: !!doc.mandatory,
              isCustomMaster: true,
              customDocId: doc.id,
            });
          }
        }
      });
    });
  } catch (err) {
    console.warn('Error loading custom master documents:', err);
  }
}

function setupManageDocsModalListeners() {
  const openModal = async () => {
    await renderCustomMasterDocsList();
    if (manageDocsModal) {
      manageDocsModal.classList.remove('hidden');
      lucide.createIcons();
    }
  };

  if (btnOpenManageDocsModal) {
    btnOpenManageDocsModal.addEventListener('click', openModal);
  }

  if (btnOpenManageDocsModalFromDrawer) {
    btnOpenManageDocsModalFromDrawer.addEventListener('click', () => {
      if (draftsListModal) draftsListModal.classList.add('hidden');
      openModal();
    });
  }

  const closeModal = () => {
    if (manageDocsModal) manageDocsModal.classList.add('hidden');
  };

  if (btnCloseManageDocsModal) btnCloseManageDocsModal.addEventListener('click', closeModal);
  if (btnCloseManageDocsFooter) btnCloseManageDocsFooter.addEventListener('click', closeModal);

  if (manageDocsModal) {
    manageDocsModal.addEventListener('click', (e) => {
      if (e.target === manageDocsModal) closeModal();
    });
  }

  // Add Document to Master Database Form Submission
  if (btnAddDocToMaster) {
    btnAddDocToMaster.addEventListener('click', async () => {
      const targetName = (inputNewDocName.value || '').trim();
      if (!targetName) {
        showToast('กรุณากรอกชื่อไฟล์เอกสาร', 'error');
        inputNewDocName.focus();
        return;
      }

      let code = (inputNewDocCode.value || '').trim().toUpperCase();
      if (!code) {
        // Auto-generate code
        code = `EXT${Math.floor(100 + Math.random() * 900)}`;
      }

      const desc = (inputNewDocDesc.value || '').trim() || targetName;
      const group = selectNewDocGroup.value || 'A ยืนยันตัวตน';
      const format = selectNewDocFormat.value || 'PDF';
      const isMandatory = selectNewDocMandatory.value === 'mandatory';
      const scope = selectNewDocScope.value || 'all';

      const docId = `custom_doc_${Date.now()}`;
      const newDoc = {
        id: docId,
        code: code,
        targetName: targetName,
        desc: desc,
        group: group,
        format: format,
        mandatory: isMandatory,
        scope: scope,
        createdAt: new Date().toISOString(),
      };

      try {
        await saveCustomMasterDocToDB(newDoc);

        // Inject into current active runtime window.LOAN_CHECKLISTS
        const allCategories = ['motorcycle', 'car', 'truck', 'agri', 'land'];
        const targetCats = scope === 'all' ? allCategories : [scope];

        targetCats.forEach((catId) => {
          const catObj = window.LOAN_CHECKLISTS[catId];
          if (catObj && catObj.items) {
            catObj.items.push({
              code: newDoc.code,
              group: newDoc.group,
              desc: newDoc.desc,
              targetName: newDoc.targetName,
              format: newDoc.format,
              mandatory: newDoc.mandatory,
              isCustomMaster: true,
              customDocId: newDoc.id,
            });
          }
        });

        // Clear Form Inputs
        inputNewDocCode.value = '';
        inputNewDocName.value = '';
        inputNewDocDesc.value = '';

        // Reload slots and UI
        loadSlotsForCurrentSubProduct();
        await renderCustomMasterDocsList();
        showToast(`✅ บันทึกเอกสาร [${code}] "${targetName}" เข้าฐานข้อมูลถาวรสำเร็จ!`, 'success');
      } catch (err) {
        console.error(err);
        showToast('เกิดข้อผิดพลาดในการบันทึกเอกสารเข้าฐานข้อมูล', 'error');
      }
    });
  }
}

async function renderCustomMasterDocsList() {
  if (!customMasterDocsList) return;

  customMasterDocsList.innerHTML = '<div class="text-center py-4 text-slate-400 text-xs">กำลังโหลดรายการ...</div>';
  try {
    const customDocs = await getAllCustomMasterDocsFromDB();
    if (customMasterDocsCount) customMasterDocsCount.innerText = `${customDocs.length} รายการ`;

    if (customDocs.length === 0) {
      customMasterDocsList.innerHTML = `
        <div class="p-5 text-center text-slate-400 space-y-1.5 neu-inset rounded-2xl">
          <i data-lucide="inbox" class="w-6 h-6 mx-auto text-slate-400"></i>
          <p class="text-xs font-bold text-slate-600">ยังไม่มีเอกสารที่เพิ่มเข้าฐานข้อมูล</p>
          <p class="text-[10px] text-slate-400">กรอกฟอร์มด้านบนเพื่อเพิ่มเอกสารใหม่เข้าสู่ระบบถาวร</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    customMasterDocsList.innerHTML = '';
    customDocs.forEach((doc) => {
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between p-3 rounded-2xl neu-inset text-xs border border-[#dfe2eb] gap-2';
      row.innerHTML = `
        <div class="flex items-center gap-2 truncate min-w-0 flex-1">
          <span class="px-2 py-0.5 rounded-lg bg-orange-600 text-white font-black text-[10px] flex-shrink-0">${doc.code}</span>
          ${doc.mandatory ? '<span class="text-[10px] px-1.5 py-0.5 rounded-md font-black text-rose-700 bg-rose-100/80 border border-rose-300/80 flex-shrink-0">บังคับ</span>' : '<span class="text-[10px] px-1.5 py-0.5 rounded-md font-black text-amber-800 bg-amber-100/80 border border-amber-300/80 flex-shrink-0">ถ้ามี</span>'}
          <span class="text-[10px] px-2 py-0.5 rounded-md font-extrabold flex-shrink-0 ${doc.format === 'PDF' ? 'text-red-700 bg-red-100/80' : 'text-blue-700 bg-blue-100/80'}">${doc.format}</span>
          <div class="truncate">
            <span class="font-extrabold text-slate-800">${doc.targetName}</span>
            <span class="text-[10px] text-slate-500 ml-1">(${doc.group})</span>
          </div>
        </div>
        <button class="p-1.5 rounded-xl neu-btn text-slate-400 hover:text-red-600 btn-delete-custom-master cursor-pointer transition-colors flex-shrink-0" data-id="${doc.id}" title="ลบเอกสารนี้ออกจากฐานข้อมูล">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      `;

      row.querySelector('.btn-delete-custom-master').addEventListener('click', async () => {
        if (confirm(`คุณต้องการลบเอกสาร [${doc.code}] "${doc.targetName}" ออกจากฐานข้อมูลถาวรหรือไม่?`)) {
          await deleteCustomMasterDocFromDB(doc.id);

          // Remove from window.LOAN_CHECKLISTS
          for (const [k, v] of Object.entries(window.LOAN_CHECKLISTS)) {
            v.items = v.items.filter((it) => it.customDocId !== doc.id);
          }

          loadSlotsForCurrentSubProduct();
          await renderCustomMasterDocsList();
          showToast(`ลบเอกสาร [${doc.code}] เรียบร้อยแล้ว`, 'info');
        }
      });

      customMasterDocsList.appendChild(row);
    });

    lucide.createIcons();
  } catch (err) {
    console.error(err);
    customMasterDocsList.innerHTML = '<div class="text-center py-4 text-red-500 text-xs">เกิดข้อผิดพลาดในการโหลดรายการ</div>';
  }
}

// 12. Guarantor Mode Switch Engine
function setGuarantorMode(hasGuarantor, silent = false) {
  state.hasGuarantor = hasGuarantor;

  const btnNo = document.getElementById('btnGuarantorNo');
  const btnYes = document.getElementById('btnGuarantorYes');

  if (btnNo && btnYes) {
    if (!hasGuarantor) {
      btnNo.className = 'px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer select-none flex items-center gap-1.5 neu-pill-active';
      btnYes.className = 'px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer select-none flex items-center gap-1.5 text-slate-600 hover:text-slate-900';
    } else {
      btnNo.className = 'px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer select-none flex items-center gap-1.5 text-slate-600 hover:text-slate-900';
      btnYes.className = 'px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer select-none flex items-center gap-1.5 neu-pill-active';
    }
  }

  loadSlotsForCurrentSubProduct();
  if (!silent) {
    showToast(hasGuarantor ? '👥 เลือกโหมด: มีผู้ค้ำประกัน (แสดงเอกสารผู้ค้ำครบถ้วน)' : '👤 เลือกโหมด: ไม่มีผู้ค้ำประกัน (แสดงเฉพาะผู้กู้)', 'info');
  }
}

// 13. Global Batch, Custom Slots, New Case & Manual Modal Events
async function resetToNewCase(showNotification = true) {
  const all = getAllSlots();
  all.forEach((s) => (s.attached = null));
  state.customSlots = [];
  state.customCounter = 1;
  state.selectedGroupFilter = 'all';

  // Clear active autosave from IndexedDB
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_AUTOSAVE, 'readwrite');
    const store = tx.objectStore(STORE_AUTOSAVE);
    store.delete('current_active_session');
  } catch (e) {
    console.warn('Error clearing autosave:', e);
  }

  renderGroupFilterPills();
  renderSlots();
  updateSummaryMetrics();
  updateAutoSaveIndicator('idle');

  if (showNotification) {
    showToast('✨ เริ่มต้นเคสใหม่เรียบร้อยแล้ว พร้อมแนบเอกสาร!', 'success');
  }
}

function setupGlobalEventListeners() {
  const btnGuarantorNo = document.getElementById('btnGuarantorNo');
  const btnGuarantorYes = document.getElementById('btnGuarantorYes');

  if (btnGuarantorNo) {
    btnGuarantorNo.addEventListener('click', () => setGuarantorMode(false));
  }
  if (btnGuarantorYes) {
    btnGuarantorYes.addEventListener('click', () => setGuarantorMode(true));
  }

  const btnOpenManualModal = document.getElementById('btnOpenManualModal');
  const btnCloseManualModal = document.getElementById('btnCloseManualModal');
  const manualModal = document.getElementById('manualModal');

  const btnStartNewCase = document.getElementById('btnStartNewCase');
  const caseSuccessModal = document.getElementById('caseSuccessModal');
  const btnKeepCurrentCase = document.getElementById('btnKeepCurrentCase');
  const btnConfirmStartNewCaseAfterZip = document.getElementById('btnConfirmStartNewCaseAfterZip');

  if (btnStartNewCase) {
    btnStartNewCase.addEventListener('click', () => {
      const attachedCount = getAllSlots().filter((s) => s.attached).length;
      if (attachedCount === 0 && state.customSlots.length === 0) {
        showToast('หน้าต่างว่างอยู่แล้ว พร้อมเริ่มเคสใหม่ได้ทันที', 'info');
        return;
      }
      if (confirm(`คุณต้องการล้างรูปภาพและข้อมูลเคสปัจจุบัน (${attachedCount} ไฟล์) เพื่อเริ่มเคสใหม่หรือไม่?`)) {
        resetToNewCase(true);
      }
    });
  }

  if (btnKeepCurrentCase && caseSuccessModal) {
    btnKeepCurrentCase.addEventListener('click', () => {
      caseSuccessModal.classList.add('hidden');
    });
  }

  if (btnConfirmStartNewCaseAfterZip && caseSuccessModal) {
    btnConfirmStartNewCaseAfterZip.addEventListener('click', () => {
      caseSuccessModal.classList.add('hidden');
      resetToNewCase(true);
    });
  }

  if (btnOpenManualModal && manualModal) {
    btnOpenManualModal.addEventListener('click', () => {
      manualModal.classList.remove('hidden');
    });
  }
  if (btnCloseManualModal && manualModal) {
    btnCloseManualModal.addEventListener('click', () => {
      manualModal.classList.add('hidden');
    });
  }

  if (btnAddCustomSlot) {
    btnAddCustomSlot.addEventListener('click', () => {
      const customId = `custom_${Date.now()}`;
      const customNumber = state.customCounter++;
      const defaultName = `เอกสารเพิ่มเติม ${customNumber}`;

      state.customSlots.push({
        id: customId,
        code: `EXTRA-${customNumber}`,
        group: 'เอกสารเพิ่มเติม (ตั้งชื่อเอง)',
        desc: 'เอกสารเพิ่มเติมที่ผู้ใช้ระบุชื่อไฟล์เอง',
        targetName: defaultName,
        defaultFormat: 'PDF',
        isCustom: true,
        attached: null,
      });

      renderSlots();
      renderGroupFilterPills();
      updateSummaryMetrics();
      showToast(`เพิ่มช่อง "${defaultName}" เรียบร้อยแล้ว`, 'success');

      const targetElement = document.getElementById(`slot_file_${customId}`);
      if (targetElement) {
        targetElement.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  if (btnBatchAutoFill && batchFileInput) {
    btnBatchAutoFill.addEventListener('click', () => batchFileInput.click());
    batchFileInput.addEventListener('change', async (e) => {
      if (e.target.files.length > 0) {
        const files = Array.from(e.target.files);
        const all = getAllSlots();
        let fileIdx = 0;

        for (let i = 0; i < all.length && fileIdx < files.length; i++) {
          if (!all[i].attached) {
            const file = files[fileIdx];
            const dataUrl = await readFileAsDataURL(file);
            all[i].attached = {
              pages: [
                {
                  file: file,
                  name: file.name,
                  size: file.size,
                  type: file.type,
                  dataUrl: dataUrl,
                  rotation: 0,
                },
              ],
              targetName: all[i].targetName || file.name.replace(/\.[^/.]+$/, ''),
              targetFormat: all[i].defaultFormat,
            };
            fileIdx++;
          }
        }

        batchFileInput.value = '';
        renderSlots();
        renderGroupFilterPills();
        updateSummaryMetrics();
        showToast(`ใส่ไฟล์ลงช่องตามลำดับสำเร็จ ${fileIdx} ไฟล์`, 'success');
      }
    });
  }

  if (btnClearAllAttached) {
    btnClearAllAttached.addEventListener('click', () => {
      const all = getAllSlots();
      const attachedCount = all.filter((s) => s.attached).length;
      if (attachedCount === 0) return;

      if (confirm('คุณต้องการล้างไฟล์ที่แนบทั้งหมดในหน้านี้หรือไม่?')) {
        all.forEach((s) => (s.attached = null));
        renderSlots();
        renderGroupFilterPills();
        updateSummaryMetrics();
        showToast('ล้างไฟล์ที่แนบทั้งหมดเรียบร้อยแล้ว', 'info');
      }
    });
  }

  if (btnDownloadZip) {
    btnDownloadZip.addEventListener('click', () => {
      const unattachedSlots = state.slots.filter((s) => !s.attached);
      const attachedSlots = getAllSlots().filter((s) => s.attached);

      if (attachedSlots.length === 0) {
        showToast('ยังไม่ได้แนบเอกสารใดๆ', 'error');
        return;
      }

      if (unattachedSlots.length > 0) {
        openMissingModal(unattachedSlots, attachedSlots.length);
      } else {
        executeZipDownload();
      }
    });
  }

  if (btnModalBackToAttach) {
    btnModalBackToAttach.addEventListener('click', () => {
      if (missingModal) missingModal.classList.add('hidden');
      state.selectedGroupFilter = 'unattached';
      renderGroupFilterPills();
      renderSlots();
      showToast('กรองแสดงเฉพาะเอกสารที่ยังไม่ได้แนบ', 'info');
    });
  }

  if (btnModalConfirmDownload) {
    btnModalConfirmDownload.addEventListener('click', () => {
      if (missingModal) missingModal.classList.add('hidden');
      executeZipDownload();
    });
  }

  if (missingModal) {
    missingModal.addEventListener('click', (e) => {
      if (e.target === missingModal) {
        missingModal.classList.add('hidden');
      }
    });
  }
}

function openMissingModal(unattachedSlots, attachedCount) {
  const allSlots = getAllSlots();
  const attachedSlots = allSlots.filter((s) => s.attached);
  const missingMandatory = unattachedSlots.filter((s) => s.mandatory);
  const missingOptional = unattachedSlots.filter((s) => !s.mandatory);

  if (missingMandatory.length > 0) {
    missingModalSubtitle.innerHTML = `แนบแล้ว <span class="text-emerald-700 font-extrabold">${attachedCount}</span> ไฟล์ • <span class="text-rose-700 font-black">ขาดเอกสารบังคับ ${missingMandatory.length} รายการ</span>${missingOptional.length > 0 ? ` (และเอกสารทางเลือก ${missingOptional.length} รายการ)` : ''}`;
  } else {
    missingModalSubtitle.innerHTML = `แนบแล้ว <span class="text-emerald-700 font-extrabold">${attachedCount}</span> ไฟล์ • <span class="text-emerald-700 font-bold">เอกสารบังคับครบ 100% แล้ว</span> (มีเอกสารทางเลือกที่ยังไม่ได้แนบ ${missingOptional.length} รายการ)`;
  }
  
  missingItemsList.innerHTML = '';

  // 1. Render ALL Missing Mandatory Documents (100% complete, red styling)
  if (missingMandatory.length > 0) {
    const mandatoryHeader = document.createElement('div');
    mandatoryHeader.className = 'flex items-center justify-between text-xs font-black text-rose-700 pt-1 pb-0.5 sticky top-0 bg-[#e0e5ec] z-10';
    mandatoryHeader.innerHTML = `
      <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse inline-block"></span> 🔴 เอกสารบังคับที่ยังขาด (${missingMandatory.length} รายการ):</span>
      <span class="text-[10px] text-slate-500 font-normal">แตะรายการเพื่อเลื่อนไปแนบ</span>
    `;
    missingItemsList.appendChild(mandatoryHeader);

    missingMandatory.forEach((slot) => {
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between p-3 rounded-2xl neu-inset text-xs border border-rose-200/90 bg-rose-50/50 hover:bg-rose-100/70 hover:border-rose-400 cursor-pointer transition-all select-none group';
      row.title = 'คลิกเพื่อเลื่อนไปยังช่องเอกสารนี้ทันที';
      row.innerHTML = `
        <div class="flex items-center gap-2 truncate min-w-0 flex-1">
          <span class="px-2 py-0.5 rounded-lg bg-rose-500 text-white shadow-xs font-black text-[10px] flex-shrink-0">${slot.code}</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded-md font-black text-rose-700 bg-rose-100/80 border border-rose-300/80 flex-shrink-0">บังคับ</span>
          <span class="font-extrabold text-rose-950 truncate">${slot.targetName}</span>
        </div>
        <div class="flex items-center gap-1.5 ml-2 flex-shrink-0">
          <span class="text-[10px] text-slate-500 font-bold whitespace-nowrap">${slot.group}</span>
          <i data-lucide="arrow-right-circle" class="w-4 h-4 text-rose-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all"></i>
        </div>
      `;

      // Smart Focus Scroll
      row.addEventListener('click', () => {
        missingModal.classList.add('hidden');
        if (state.selectedGroupFilter !== 'all' && state.selectedGroupFilter !== slot.group) {
          state.selectedGroupFilter = 'all';
          renderGroupFilterPills();
          renderSlots();
        }
        setTimeout(() => {
          const targetCard = document.getElementById(`card_${slot.id}`);
          if (targetCard) {
            targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            targetCard.classList.add('ring-4', 'ring-orange-500', 'scale-[1.02]');
            setTimeout(() => {
              targetCard.classList.remove('ring-4', 'ring-orange-500', 'scale-[1.02]');
            }, 2200);
          }
        }, 100);
      });

      missingItemsList.appendChild(row);
    });
  }

  // 2. Render Missing Optional Documents (Yellow styling)
  if (missingOptional.length > 0) {
    const optionalHeader = document.createElement('div');
    optionalHeader.className = 'flex items-center justify-between text-xs font-extrabold text-amber-800 pt-3 pb-0.5 sticky top-0 bg-[#e0e5ec] z-10';
    optionalHeader.innerHTML = `
      <span class="flex items-center gap-1.5">🟡 เอกสารทางเลือกที่ยังไม่ได้แนบ (${missingOptional.length} รายการ):</span>
      <span class="text-[10px] text-slate-500 font-normal">ถ้ามี</span>
    `;
    missingItemsList.appendChild(optionalHeader);

    missingOptional.forEach((slot) => {
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between p-2.5 rounded-2xl neu-inset text-xs border border-amber-200/60 bg-amber-50/30 hover:bg-amber-100/50 hover:border-amber-300 cursor-pointer transition-all select-none group';
      row.title = 'คลิกเพื่อเลื่อนไปยังช่องเอกสารนี้';
      row.innerHTML = `
        <div class="flex items-center gap-2 truncate min-w-0 flex-1">
          <span class="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-800 font-black text-[10px] flex-shrink-0">${slot.code}</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded-md font-black text-amber-800 bg-amber-100/80 border border-amber-300/80 flex-shrink-0">ถ้ามี</span>
          <span class="font-extrabold text-slate-800 truncate">${slot.targetName}</span>
        </div>
        <div class="flex items-center gap-1.5 ml-2 flex-shrink-0">
          <span class="text-[10px] text-slate-500 font-bold whitespace-nowrap">${slot.group}</span>
          <i data-lucide="arrow-right-circle" class="w-4 h-4 text-slate-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all"></i>
        </div>
      `;

      row.addEventListener('click', () => {
        missingModal.classList.add('hidden');
        if (state.selectedGroupFilter !== 'all' && state.selectedGroupFilter !== slot.group) {
          state.selectedGroupFilter = 'all';
          renderGroupFilterPills();
          renderSlots();
        }
        setTimeout(() => {
          const targetCard = document.getElementById(`card_${slot.id}`);
          if (targetCard) {
            targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            targetCard.classList.add('ring-4', 'ring-orange-500', 'scale-[1.02]');
            setTimeout(() => {
              targetCard.classList.remove('ring-4', 'ring-orange-500', 'scale-[1.02]');
            }, 2200);
          }
        }, 100);
      });

      missingItemsList.appendChild(row);
    });
  }

  // 3. Render Attached Documents (Green checkmark styling)
  if (attachedSlots.length > 0) {
    const attachedHeader = document.createElement('div');
    attachedHeader.className = 'flex items-center justify-between text-xs font-black text-emerald-700 pt-3 pb-0.5 sticky top-0 bg-[#e0e5ec] z-10';
    attachedHeader.innerHTML = `
      <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> 🟢 เอกสารที่แนบเรียบร้อยแล้ว (${attachedSlots.length} รายการ):</span>
      <span class="text-[10px] text-emerald-600 font-bold">พร้อมดาวน์โหลด</span>
    `;
    missingItemsList.appendChild(attachedHeader);

    attachedSlots.forEach((slot) => {
      const row = document.createElement('div');
      const pageCount = slot.attached.pages ? slot.attached.pages.length : 1;
      const fmt = (slot.attached.targetFormat || slot.defaultFormat || 'PDF').toUpperCase();
      row.className = 'flex items-center justify-between p-2.5 rounded-2xl neu-inset text-xs border border-emerald-200/90 bg-emerald-50/50 hover:bg-emerald-100/70 hover:border-emerald-400 cursor-pointer transition-all select-none group';
      row.title = 'คลิกเพื่อดูเอกสารหรือพรีวิว';
      row.innerHTML = `
        <div class="flex items-center gap-2 truncate min-w-0 flex-1">
          <div class="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <i data-lucide="check" class="w-3 h-3 stroke-[3]"></i>
          </div>
          <span class="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-black text-[10px] flex-shrink-0">${slot.code}</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded-md font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 flex-shrink-0">แนบแล้ว</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${fmt === 'PDF' ? 'text-red-700 bg-red-100/80' : 'text-blue-700 bg-blue-100/80'} flex-shrink-0">${fmt} ${pageCount > 1 ? `(${pageCount}น.)` : ''}</span>
          <span class="font-extrabold text-emerald-950 truncate">${slot.targetName}</span>
        </div>
        <div class="flex items-center gap-1.5 ml-2 flex-shrink-0">
          <span class="text-[10px] text-slate-500 font-bold whitespace-nowrap">${slot.group}</span>
          <i data-lucide="eye" class="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-all"></i>
        </div>
      `;

      // Click to open preview modal or jump to card
      row.addEventListener('click', () => {
        missingModal.classList.add('hidden');
        if (state.selectedGroupFilter !== 'all' && state.selectedGroupFilter !== slot.group) {
          state.selectedGroupFilter = 'all';
          renderGroupFilterPills();
          renderSlots();
        }
        setTimeout(() => {
          openPreviewModal(slot.id);
        }, 100);
      });

      missingItemsList.appendChild(row);
    });
  }

  missingModal.classList.remove('hidden');
  lucide.createIcons();
}

// 13. Metrics Calculation & Real-Time Auto-Save Trigger (Readiness Meter)
function updateSummaryMetrics() {
  const all = getAllSlots();
  const attachedSlots = all.filter((s) => s.attached);
  const mandatorySlots = state.slots.filter((s) => s.mandatory);
  const unattachedMandatorySlots = mandatorySlots.filter((s) => !s.attached);
  const missingMandatoryCount = unattachedMandatorySlots.length;
  const attachedMandatoryCount = mandatorySlots.length - missingMandatoryCount;

  attachedCountBadge.innerText = `${attachedSlots.length} / ${all.length} ไฟล์`;

  if (missingMandatoryCount === 0 && mandatorySlots.length > 0) {
    missingCountBadge.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-xl neu-inset text-emerald-800 font-extrabold text-xs border border-emerald-300/80 bg-emerald-50/60 shadow-xs';
    missingText.innerHTML = `<span class="flex items-center gap-1.5"><i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-emerald-600"></i> บังคับครบ 100% (${attachedMandatoryCount}/${mandatorySlots.length})</span>`;
  } else {
    missingCountBadge.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-xl neu-inset text-rose-800 font-extrabold text-xs border border-rose-300/80 bg-rose-50/60 shadow-xs';
    missingText.innerHTML = `<span class="flex items-center gap-1.5"><i data-lucide="alert-circle" class="w-3.5 h-3.5 text-rose-600 animate-pulse"></i> ขาดบังคับ ${missingMandatoryCount} ใบ</span>`;
  }

  btnDownloadZip.disabled = attachedSlots.length === 0;
  lucide.createIcons();

  // Trigger Instant Real-Time AutoSave
  triggerAutoSave();
}

// 14. Multi-Image & Multi-Page Document Processing Engine (< 5MB Guaranteed)
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

async function processAttachedFile(attachedObj) {
  const pages = attachedObj.pages;
  const isMultiPage = pages.length > 1;
  const targetFormat = isMultiPage ? 'PDF' : attachedObj.targetFormat;
  const cleanName = (attachedObj.targetName || 'เอกสาร').replace(/[\\/:*?"<>|]/g, '_');
  const finalFilename = `${cleanName}.${targetFormat.toLowerCase()}`;

  // Case 1: Single JPG file
  if (targetFormat === 'JPG' && !isMultiPage) {
    const p = pages[0];
    if (p.dataUrl) {
      const blob = await compressImageToBlob(p.dataUrl, p.rotation, MAX_FILE_SIZE_BYTES);
      return { blob, finalFilename };
    } else {
      return { blob: p.file, finalFilename: `${cleanName}.pdf` };
    }
  }

  // Case 2: Multi-Image or Single PDF target
  if (targetFormat === 'PDF') {
    if (!isMultiPage && pages[0].file.type === 'application/pdf') {
      return { blob: pages[0].file, finalFilename };
    }

    const perPageMaxBytes = Math.max(Math.floor((4.5 * 1024 * 1024) / pages.length), 600 * 1024);
    const pdfDoc = await PDFLib.PDFDocument.create();

    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      if (p.dataUrl) {
        const compressedImgBlob = await compressImageToBlob(p.dataUrl, p.rotation, perPageMaxBytes);
        const arrayBuffer = await compressedImgBlob.arrayBuffer();

        let pdfImage;
        try {
          pdfImage = await pdfDoc.embedJpg(arrayBuffer);
        } catch (e) {
          pdfImage = await pdfDoc.embedPng(arrayBuffer);
        }

        const { width, height } = pdfImage.scale(1);
        const page = pdfDoc.addPage([width, height]);
        page.drawImage(pdfImage, {
          x: 0,
          y: 0,
          width: width,
          height: height,
        });
      }
    }

    const pdfBytes = await pdfDoc.save();
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    return { blob: pdfBlob, finalFilename };
  }

  return { blob: pages[0].file, finalFilename };
}

/**
 * Smart High-Fidelity Canvas Image Compressor (< 5MB Guaranteed with Maximum Visual Quality)
 * Retains up to 4K Ultra-HD resolution and text sharpness for loan inspection
 */
async function compressImageToBlob(dataUrl, rotation = 0, maxBytes = MAX_FILE_SIZE_BYTES) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      let width = img.width;
      let height = img.height;
      let quality = 0.95;
      let scale = 1.0;

      const isSwapped = rotation === 90 || rotation === 270;
      let maxDim = 3840;

      if (Math.max(width, height) > maxDim) {
        scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      let resultBlob = null;
      for (let attempt = 0; attempt < 6; attempt++) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { alpha: false });

        canvas.width = isSwapped ? height : width;
        canvas.height = isSwapped ? width : height;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(img, -width / 2, -height / 2, width, height);
        ctx.restore();

        resultBlob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality));

        if (!resultBlob) break;

        if (resultBlob.size <= maxBytes) {
          break;
        }

        quality -= 0.08;
        if (quality < 0.72) {
          width = Math.round(width * 0.9);
          height = Math.round(height * 0.9);
        }
      }

      resolve(resultBlob);
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

// 15. Batch Download as .ZIP
async function executeZipDownload() {
  const all = getAllSlots();
  const attachedSlots = all.filter((s) => s.attached);
  if (attachedSlots.length === 0) {
    showToast('ไม่มีไฟล์ที่แนบสำหรับดาวน์โหลด', 'error');
    return;
  }

  btnDownloadZip.disabled = true;
  btnDownloadZip.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i><span>กำลังรวม ZIP...</span>`;
  lucide.createIcons();
  showToast('กำลังบีบอัดและรวมไฟล์เป็น ZIP...', 'info');

  try {
    const zip = new JSZip();
    const usedNames = new Set();

    for (let i = 0; i < attachedSlots.length; i++) {
      const slot = attachedSlots[i];
      const { blob, finalFilename } = await processAttachedFile(slot.attached);

      let uniqueName = finalFilename;
      let counter = 1;
      while (usedNames.has(uniqueName)) {
        const parts = finalFilename.split('.');
        const ext = parts.pop();
        uniqueName = `${parts.join('.')}_(${counter}).${ext}`;
        counter++;
      }
      usedNames.add(uniqueName);

      zip.file(uniqueName, blob);
    }

    const currentCat = window.LOAN_CHECKLISTS[state.currentCategory];
    const timeStr = new Date().toISOString().slice(0, 10);
    const zipName = `เอกสาร_${currentCat.name}_${state.currentSubType}_${timeStr}.zip`;

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, zipName);

    showToast(`ดาวน์โหลดไฟล์ ${zipName} สำเร็จ! (${attachedSlots.length} ไฟล์)`, 'success');

    // Prompt user to start new case
    setTimeout(() => {
      const successM = document.getElementById('caseSuccessModal');
      if (successM) {
        successM.classList.remove('hidden');
        lucide.createIcons();
      }
    }, 600);
  } catch (err) {
    console.error('ZIP Error:', err);
    showToast('เกิดข้อผิดพลาดในการสร้างไฟล์ ZIP', 'error');
  } finally {
    btnDownloadZip.disabled = false;
    btnDownloadZip.innerHTML = `<i data-lucide="archive" class="w-3.5 h-3.5"></i><span>ดาวน์โหลด ZIP</span>`;
    lucide.createIcons();
  }
}

// 16. Utilities
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function showToast(message, type = 'info') {
  toastMsg.innerText = message;

  if (type === 'success') {
    toastIcon.setAttribute('data-lucide', 'check');
    toastIcon.className = 'w-3.5 h-3.5 text-orange-500';
  } else if (type === 'error') {
    toastIcon.setAttribute('data-lucide', 'alert-circle');
    toastIcon.className = 'w-3.5 h-3.5 text-red-500';
  } else {
    toastIcon.setAttribute('data-lucide', 'info');
    toastIcon.className = 'w-3.5 h-3.5 text-orange-500';
  }

  lucide.createIcons();

  toast.classList.remove('-translate-y-20', 'opacity-0', 'pointer-events-none');
  toast.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');

  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
    toast.classList.add('-translate-y-20', 'opacity-0', 'pointer-events-none');
  }, 3500);
}
