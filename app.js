/**
 * Auto Loan Document Optimizer & Renamer
 * Clean Layout with Floating Bottom Dock, Fullscreen Preview Lightbox & Rich Smooth Animations
 */

// Application State
const state = {
  currentCategory: 'land',
  selectedGroupFilter: 'all', // 'all', 'unattached', or specific group name
  slots: [], // Standard Checklist slots
  customSlots: [], // User-added custom document slots
  customCounter: 1,
  activePreviewSlotId: null, // Track slot currently being previewed
};

// DOM Elements
const loanCategoryTabs = document.getElementById('loanCategoryTabs');
const currentLoanBadge = document.getElementById('currentLoanBadge');
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

// Preview Modal DOM Elements
const previewModal = document.getElementById('previewModal');
const previewModalCode = document.getElementById('previewModalCode');
const previewModalTitle = document.getElementById('previewModalTitle');
const previewModalSubtitle = document.getElementById('previewModalSubtitle');
const previewModalFormat = document.getElementById('previewModalFormat');
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

// Toast
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toastMsg');
const toastIcon = document.getElementById('toastIcon');

// 1. Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  if (!window.LOAN_CHECKLISTS) {
    console.error('LOAN_CHECKLISTS data not found!');
    showToast('ไม่พบข้อมูล Checklist กรุณาโหลดไฟล์ checklists.js', 'error');
    return;
  }

  renderBottomDock();
  selectCategory('land');
  setupGlobalEventListeners();
  setupPreviewModalListeners();
});

// 2. Render Floating Bottom Dock
function renderBottomDock() {
  loanCategoryTabs.innerHTML = '';
  const categories = Object.values(window.LOAN_CHECKLISTS);

  categories.forEach((cat) => {
    const btn = document.createElement('button');
    const isActive = state.currentCategory === cat.id;
    btn.className = `px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 transition-all text-slate-700 hover:text-orange-600 cursor-pointer ${
      isActive ? 'neu-dock-active font-extrabold text-orange-600' : 'neu-btn font-bold text-xs hover:-translate-y-1'
    }`;
    
    let shortName = cat.name.replace('สินเชื่อ', '').trim();
    if (shortName.length > 10) shortName = shortName.split('/')[0].trim();

    btn.innerHTML = `
      <span class="text-lg sm:text-xl filter drop-shadow-sm leading-none transition-transform group-hover:scale-110">${cat.icon}</span>
      <span class="text-[11px] sm:text-xs text-center whitespace-nowrap leading-none">${shortName}</span>
    `;
    btn.addEventListener('click', () => selectCategory(cat.id));
    loanCategoryTabs.appendChild(btn);
  });
}

function selectCategory(catId) {
  state.currentCategory = catId;
  state.selectedGroupFilter = 'all';

  const catData = window.LOAN_CHECKLISTS[catId];
  currentLoanBadge.innerHTML = `${catData.icon} ${catData.name}`;

  renderBottomDock();

  // Initialize Slots from Checklist
  state.slots = catData.items.map((item) => ({
    id: `slot_${item.code}`,
    code: item.code,
    group: item.group,
    desc: item.desc,
    targetName: item.targetName,
    defaultFormat: item.format || 'JPG',
    isCustom: false,
    attached: null,
  }));

  renderGroupFilterPills();
  renderSlots();
  updateSummaryMetrics();
}

function getAllSlots() {
  return [...state.slots, ...state.customSlots];
}

function renderGroupFilterPills() {
  groupFilterPills.innerHTML = '';
  const allSlots = getAllSlots();
  const unattachedCount = state.slots.filter((s) => !s.attached).length;

  // 1. "All" Pill
  const allPill = document.createElement('button');
  allPill.className = `px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
    state.selectedGroupFilter === 'all'
      ? 'neu-pill-active'
      : 'neu-btn text-slate-600 hover:text-slate-900'
  }`;
  allPill.innerText = `ทั้งหมด (${allSlots.length})`;
  allPill.addEventListener('click', () => {
    state.selectedGroupFilter = 'all';
    renderGroupFilterPills();
    renderSlots();
  });
  groupFilterPills.appendChild(allPill);

  // 2. "Unattached" Filter Pill (Missing Items)
  if (unattachedCount > 0) {
    const missingPill = document.createElement('button');
    missingPill.className = `px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
      state.selectedGroupFilter === 'unattached'
        ? 'bg-amber-500 text-white shadow-md'
        : 'neu-btn text-amber-700 hover:text-amber-900 border border-amber-300'
    }`;
    missingPill.innerHTML = `<span class="flex items-center gap-1"><i data-lucide="alert-circle" class="w-3 h-3"></i> ยังไม่แนบ (${unattachedCount})</span>`;
    missingPill.addEventListener('click', () => {
      state.selectedGroupFilter = 'unattached';
      renderGroupFilterPills();
      renderSlots();
    });
    groupFilterPills.appendChild(missingPill);
  }

  // 3. Specific Group Pills
  const groups = Array.from(new Set(allSlots.map((s) => s.group)));
  groups.forEach((groupName) => {
    const countInGroup = allSlots.filter((s) => s.group === groupName).length;
    const attachedInGroup = allSlots.filter((s) => s.group === groupName && s.attached).length;

    const pill = document.createElement('button');
    pill.className = `px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
      state.selectedGroupFilter === groupName
        ? 'neu-pill-active'
        : 'neu-btn text-slate-600 hover:text-slate-900'
    }`;
    pill.innerText = `${groupName.substring(0, 16)} (${attachedInGroup}/${countInGroup})`;
    pill.addEventListener('click', () => {
      state.selectedGroupFilter = groupName;
      renderGroupFilterPills();
      renderSlots();
    });
    groupFilterPills.appendChild(pill);
  });

  lucide.createIcons();
}

// 3. Render Checklist Topic Slots & Custom Slots with Stagger Animations
function renderSlots() {
  slotsContainer.innerHTML = '';
  const allSlots = getAllSlots();

  // Filter slots
  let visibleSlots = allSlots;
  if (state.selectedGroupFilter === 'unattached') {
    visibleSlots = allSlots.filter((s) => !s.attached);
  } else if (state.selectedGroupFilter !== 'all') {
    visibleSlots = allSlots.filter((s) => s.group === state.selectedGroupFilter);
  }

  if (visibleSlots.length === 0) {
    slotsContainer.innerHTML = `
      <div class="neu-raised rounded-3xl p-10 text-center text-slate-400 space-y-2 animate-in fade-in zoom-in-95 duration-300">
        <i data-lucide="check-circle-2" class="w-10 h-10 mx-auto text-emerald-500 animate-bounce"></i>
        <p class="text-sm font-bold text-slate-700">ไม่มีรายการในหมวดหมู่นี้ หรือแนบครบทุกรายการแล้ว!</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  // Group visible slots
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

    // Group Header
    groupSection.innerHTML = `
      <div class="flex items-center justify-between pb-1 border-b border-[#dfe2eb]">
        <h3 class="text-sm font-extrabold text-slate-800 flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full ${isCustomGroup ? 'bg-amber-500' : 'bg-orange-500'} shadow-[0_0_8px_#ff6a00]"></span>
          หมวด ${groupName}
        </h3>
        <span class="text-xs font-bold text-slate-500">
          ${slotsInGroup.filter((s) => s.attached).length} / ${slotsInGroup.length} แนบแล้ว
        </span>
      </div>
    `;

    // Slots Grid for this group
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';

    slotsInGroup.forEach((slot) => {
      const isAttached = !!slot.attached;
      const card = document.createElement('div');
      
      const animDelay = Math.min(globalCardIndex * 25, 400);
      globalCardIndex++;

      card.className = `neu-raised rounded-3xl p-4 transition-all flex flex-col justify-between gap-3 slot-card-animate ${
        isAttached ? 'neu-slot-attached' : (slot.isCustom ? 'neu-slot-custom' : '')
      }`;
      card.style.animationDelay = `${animDelay}ms`;

      const slotInputId = `slot_input_${slot.id}`;

      if (!isAttached) {
        // Empty Slot
        card.innerHTML = `
          <input type="file" id="${slotInputId}" data-id="${slot.id}" accept="image/jpeg,image/png,image/webp,application/pdf" class="hidden slot-file-input">
          
          <div class="flex items-start justify-between gap-3">
            <div class="space-y-1 flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs px-2 py-0.5 rounded-lg neu-inset font-extrabold ${slot.isCustom ? 'text-amber-600' : 'text-orange-600'}">${slot.code}</span>
                ${
                  slot.isCustom
                    ? `<input type="text" value="${slot.targetName}" data-id="${slot.id}" class="text-xs font-extrabold text-slate-800 neu-inset rounded-lg px-2.5 py-1 input-custom-name focus:outline-none flex-1 min-w-[140px]" placeholder="พิมพ์ชื่อไฟล์ที่ต้องการ">`
                    : `<span class="text-xs font-extrabold text-slate-800 truncate">${slot.targetName}</span>`
                }
                <span class="text-[10px] px-2 py-0.5 rounded-md neu-inset font-bold text-slate-500">${slot.defaultFormat}</span>
              </div>
              <p class="text-xs text-slate-500 line-clamp-1" title="${slot.desc}">${slot.desc}</p>
            </div>

            ${
              slot.isCustom
                ? `<button class="p-1.5 rounded-xl neu-btn text-slate-400 hover:text-red-600 btn-delete-custom-slot cursor-pointer transition-colors" data-id="${slot.id}" title="ลบช่องเอกสารเพิ่มเติมนี้">
                    <i data-lucide="x" class="w-3.5 h-3.5"></i>
                  </button>`
                : ''
            }
          </div>

          <!-- Click / Drop Target Area -->
          <div class="neu-inset rounded-2xl p-4 text-center cursor-pointer hover:border-orange-400 transition-all border border-dashed border-[#cbced8] slot-drop-target group" data-id="${slot.id}">
            <div class="flex items-center justify-center gap-2 text-slate-600 group-hover:text-orange-600 transition-colors">
              <div class="w-8 h-8 rounded-xl neu-raised flex items-center justify-center text-orange-500 group-hover:scale-110 group-hover:rotate-12 transition-all">
                <i data-lucide="plus" class="w-4 h-4"></i>
              </div>
              <span class="text-xs font-bold group-hover:translate-x-1 transition-transform">คลิกหรือลากไฟล์มาวางเพื่อแนบเอกสารนี้</span>
            </div>
          </div>
        `;
      } else {
        // Attached Slot
        const att = slot.attached;
        const formattedSize = formatFileSize(att.size);

        card.innerHTML = `
          <input type="file" id="${slotInputId}" data-id="${slot.id}" accept="image/jpeg,image/png,image/webp,application/pdf" class="hidden slot-file-input">
          
          <div class="flex items-start gap-3.5">
            <!-- Thumbnail Preview Well (Clickable to view full-size lightbox) -->
            <div class="w-20 h-20 rounded-2xl neu-inset overflow-hidden flex-shrink-0 flex items-center justify-center relative p-1 slot-preview-trigger group cursor-pointer" data-id="${slot.id}" title="คลิกเพื่อดูรูปพรีวิวขนาดใหญ่">
              ${
                att.dataUrl
                  ? `<img src="${att.dataUrl}" style="transform: rotate(${att.rotation}deg);" class="w-full h-full object-cover rounded-xl transition-transform duration-300" alt="Preview">`
                  : `<div class="flex flex-col items-center text-slate-500"><i data-lucide="file-text" class="w-8 h-8 text-red-500 animate-pulse"></i><span class="text-[10px] font-bold">PDF</span></div>`
              }
              <div class="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center text-white backdrop-blur-[1px]">
                <i data-lucide="zoom-in" class="w-5 h-5 animate-bounce"></i>
              </div>
              <div class="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-orange-600 text-white text-[9px] font-extrabold shadow-sm">
                ${slot.code}
              </div>
            </div>

            <!-- Details & Renaming -->
            <div class="flex-1 min-w-0 space-y-1.5">
              <div class="flex items-center justify-between gap-1">
                <span class="text-xs font-extrabold text-slate-800 truncate" title="${slot.desc}">[${slot.code}] ${slot.targetName}</span>
                <span class="text-[10px] px-2 py-0.5 rounded-lg neu-inset text-slate-600 font-semibold whitespace-nowrap">
                  ${formattedSize}
                </span>
              </div>

              <div>
                <label class="block text-[10px] font-bold text-slate-500 mb-0.5">ชื่อไฟล์ที่จะบันทึก (แก้ไขได้):</label>
                <input type="text" value="${att.targetName}" data-id="${slot.id}" class="w-full text-xs font-extrabold text-orange-600 neu-inset rounded-xl px-3 py-1.5 focus:outline-none input-slot-name transition-all focus:ring-1 focus:ring-orange-400">
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="pt-2.5 border-t border-[#dfe2eb] flex items-center justify-between gap-2">
            <!-- Format Switch -->
            <div class="flex items-center gap-1">
              <span class="text-[11px] font-bold text-slate-500 mr-1">แปลงเป็น:</span>
              <div class="flex items-center p-1 rounded-xl neu-inset gap-1">
                <button class="px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer btn-slot-jpg ${
                  att.targetFormat === 'JPG' ? 'neu-pill-active' : 'text-slate-600'
                }" data-id="${slot.id}">JPG</button>
                <button class="px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer btn-slot-pdf ${
                  att.targetFormat === 'PDF' ? 'neu-pill-active' : 'text-slate-600'
                }" data-id="${slot.id}">PDF</button>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-1.5">
              <button class="p-2 rounded-xl neu-btn text-slate-600 hover:text-orange-600 btn-slot-preview cursor-pointer hover:scale-105 transition-transform" title="ดูรูปขนาดใหญ่" data-id="${slot.id}">
                <i data-lucide="eye" class="w-3.5 h-3.5"></i>
              </button>
              ${
                att.dataUrl
                  ? `<button class="p-2 rounded-xl neu-btn text-slate-600 hover:text-orange-600 btn-slot-rotate cursor-pointer hover:rotate-45 transition-all" title="หมุนภาพ 90°" data-id="${slot.id}">
                      <i data-lucide="rotate-cw" class="w-3.5 h-3.5"></i>
                    </button>`
                  : ''
              }
              <button class="p-2 rounded-xl neu-btn text-orange-600 btn-slot-change cursor-pointer hover:scale-105 transition-transform" title="เปลี่ยนไฟล์นี้" data-id="${slot.id}">
                <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
              </button>
              <button class="px-2.5 py-1 rounded-xl neu-btn text-orange-600 text-xs font-bold flex items-center gap-1 btn-slot-download cursor-pointer hover:scale-105 transition-transform" data-id="${slot.id}" title="ดาวน์โหลดไฟล์นี้เดี่ยวๆ">
                <i data-lucide="download" class="w-3.5 h-3.5"></i>
                <span>โหลด</span>
              </button>
              <button class="p-2 rounded-xl neu-btn text-slate-400 hover:text-red-600 btn-slot-remove cursor-pointer hover:scale-105 transition-all" title="ลบไฟล์ที่แนบ" data-id="${slot.id}">
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

// 4. Attach Events to Slots with Drag Animations
function attachSlotEvents() {
  // Click thumbnail or eye button to open Lightbox Preview
  document.querySelectorAll('.slot-preview-trigger, .btn-slot-preview').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = el.dataset.id;
      openPreviewModal(id);
    });
  });

  // Click drop target to trigger slot input
  document.querySelectorAll('.slot-drop-target').forEach((el) => {
    const id = el.dataset.id;
    const input = document.getElementById(`slot_input_${id}`);
    el.addEventListener('click', () => input.click());

    ['dragenter', 'dragover'].forEach((evt) => {
      el.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.classList.add('slot-drag-hover');
      });
    });

    ['dragleave', 'drop'].forEach((evt) => {
      el.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.classList.remove('slot-drag-hover');
      });
    });

    el.addEventListener('drop', (e) => {
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        attachFileToSlotById(id, e.dataTransfer.files[0]);
      }
    });
  });

  // Slot file inputs change
  document.querySelectorAll('.slot-file-input').forEach((inp) => {
    inp.addEventListener('change', (e) => {
      const id = e.target.dataset.id;
      if (e.target.files.length > 0) {
        attachFileToSlotById(id, e.target.files[0]);
        e.target.value = '';
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

  // Change file button
  document.querySelectorAll('.btn-slot-change').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      const input = document.getElementById(`slot_input_${id}`);
      if (input) input.click();
    });
  });

  // Rename input (when attached)
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

  // Rotate image
  document.querySelectorAll('.btn-slot-rotate').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      const all = getAllSlots();
      const slot = all.find((s) => s.id === id);
      if (slot && slot.attached) {
        slot.attached.rotation = (slot.attached.rotation + 90) % 360;
        renderSlots();
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

// 5. Fullscreen Image Lightbox Preview Functions
function openPreviewModal(slotId) {
  const all = getAllSlots();
  const slot = all.find((s) => s.id === slotId);
  if (!slot || !slot.attached) return;

  state.activePreviewSlotId = slotId;
  const att = slot.attached;

  previewModalCode.innerText = slot.code;
  previewModalTitle.innerText = att.targetName || slot.targetName;
  previewModalSubtitle.innerText = `${slot.desc} • ขนาด ${formatFileSize(att.size)}`;
  previewModalFormat.innerText = att.targetFormat;

  if (att.dataUrl) {
    previewModalImg.src = att.dataUrl;
    previewModalImg.style.transform = `rotate(${att.rotation}deg)`;
    previewModalImg.classList.remove('hidden');
    previewModalPdf.classList.add('hidden');
    btnPreviewRotate.classList.remove('hidden');
  } else {
    previewModalImg.classList.add('hidden');
    previewModalPdf.classList.remove('hidden');
    btnPreviewRotate.classList.add('hidden');
  }

  previewModal.classList.remove('hidden');
  lucide.createIcons();
}

function closePreviewModal() {
  previewModal.classList.add('hidden');
  state.activePreviewSlotId = null;
}

function setupPreviewModalListeners() {
  btnPreviewClose.addEventListener('click', closePreviewModal);

  previewModal.addEventListener('click', (e) => {
    if (e.target === previewModal) {
      closePreviewModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closePreviewModal();
      missingModal.classList.add('hidden');
    }
  });

  btnPreviewRotate.addEventListener('click', () => {
    if (!state.activePreviewSlotId) return;
    const all = getAllSlots();
    const slot = all.find((s) => s.id === state.activePreviewSlotId);
    if (slot && slot.attached) {
      slot.attached.rotation = (slot.attached.rotation + 90) % 360;
      previewModalImg.style.transform = `rotate(${slot.attached.rotation}deg)`;
      renderSlots();
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

// 6. Attach File To Specific Slot by ID
async function attachFileToSlotById(id, file) {
  const all = getAllSlots();
  const slot = all.find((s) => s.id === id);
  if (!slot) return;

  const dataUrl = await readFileAsDataURL(file);

  slot.attached = {
    file: file,
    name: file.name,
    size: file.size,
    type: file.type,
    dataUrl: dataUrl,
    rotation: 0,
    targetName: slot.targetName || file.name.replace(/\.[^/.]+$/, ''),
    targetFormat: slot.defaultFormat,
  };

  renderSlots();
  renderGroupFilterPills();
  updateSummaryMetrics();
  showToast(`แนบไฟล์ใน [${slot.code}] ${slot.attached.targetName} สำเร็จ!`, 'success');
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

// 7. Global Batch & Custom Slots Events
function setupGlobalEventListeners() {
  // Add Custom Slot Button
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

    const targetElement = document.getElementById(`slot_input_${customId}`);
    if (targetElement) {
      targetElement.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  // Batch Auto-fill button
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
            file: file,
            name: file.name,
            size: file.size,
            type: file.type,
            dataUrl: dataUrl,
            rotation: 0,
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

  // Clear all attached files
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

  // ZIP Download with Warning Validation
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

  // Modal Actions
  btnModalBackToAttach.addEventListener('click', () => {
    missingModal.classList.add('hidden');
    state.selectedGroupFilter = 'unattached';
    renderGroupFilterPills();
    renderSlots();
    showToast('กรองแสดงเฉพาะเอกสารที่ยังไม่ได้แนบ', 'info');
  });

  btnModalConfirmDownload.addEventListener('click', () => {
    missingModal.classList.add('hidden');
    executeZipDownload();
  });
}

function openMissingModal(unattachedSlots, attachedCount) {
  missingModalSubtitle.innerText = `แนบแล้ว ${attachedCount} ไฟล์ • ยังขาดอีก ${unattachedSlots.length} ไฟล์ Checklist`;
  
  missingItemsList.innerHTML = '';
  unattachedSlots.slice(0, 15).forEach((slot) => {
    const row = document.createElement('div');
    row.className = 'flex items-center justify-between p-2 rounded-xl neu-inset text-xs';
    row.innerHTML = `
      <div class="flex items-center gap-2 truncate">
        <span class="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 font-extrabold text-[10px]">${slot.code}</span>
        <span class="font-bold text-slate-800 truncate">${slot.targetName}</span>
      </div>
      <span class="text-[10px] text-slate-500 font-semibold whitespace-nowrap ml-2">หมวด ${slot.group.substring(0, 12)}</span>
    `;
    missingItemsList.appendChild(row);
  });

  if (unattachedSlots.length > 15) {
    const moreRow = document.createElement('div');
    moreRow.className = 'text-center text-xs font-bold text-slate-500 py-1';
    moreRow.innerText = `...และอีก ${unattachedSlots.length - 15} รายการ`;
    missingItemsList.appendChild(moreRow);
  }

  missingModal.classList.remove('hidden');
  lucide.createIcons();
}

// 8. Metrics Calculation
function updateSummaryMetrics() {
  const all = getAllSlots();
  const attachedSlots = all.filter((s) => s.attached);
  const unattachedChecklistCount = state.slots.filter((s) => !s.attached).length;

  attachedCountBadge.innerText = `${attachedSlots.length} / ${all.length} ไฟล์`;

  // Update Header Missing Indicator
  if (unattachedChecklistCount === 0 && state.slots.length > 0) {
    missingCountBadge.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-xl neu-inset text-emerald-700 font-bold text-xs';
    missingText.innerHTML = `<span class="flex items-center gap-1"><i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-500"></i> ครบ 100%</span>`;
  } else {
    missingCountBadge.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-xl neu-inset text-amber-700 font-bold text-xs';
    missingText.innerHTML = `<span class="flex items-center gap-1"><i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-amber-500"></i> ขาด ${unattachedChecklistCount}</span>`;
  }

  btnDownloadZip.disabled = attachedSlots.length === 0;
  lucide.createIcons();
}

// 9. Image & Document Processing Engine (< 5MB Guaranteed)
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

async function processAttachedFile(item) {
  const targetExt = item.targetFormat.toLowerCase();
  const cleanName = (item.targetName || 'เอกสาร').replace(/[\\/:*?"<>|]/g, '_');
  const finalFilename = `${cleanName}.${targetExt}`;

  // Case 1: Target is JPG
  if (item.targetFormat === 'JPG') {
    if (item.dataUrl) {
      const blob = await compressImageToBlob(item.dataUrl, item.rotation, MAX_FILE_SIZE_BYTES);
      return { blob, finalFilename };
    } else {
      return { blob: item.file, finalFilename: `${cleanName}.pdf` };
    }
  }

  // Case 2: Target is PDF
  if (item.targetFormat === 'PDF') {
    if (item.file.type === 'application/pdf') {
      return { blob: item.file, finalFilename };
    } else if (item.dataUrl) {
      const compressedImgBlob = await compressImageToBlob(item.dataUrl, item.rotation, 4.5 * 1024 * 1024);
      const pdfBlob = await convertImageBlobToPdf(compressedImgBlob);
      return { blob: pdfBlob, finalFilename };
    }
  }

  return { blob: item.file, finalFilename };
}

/**
 * Canvas Image Compressor (< 5MB Guaranteed)
 */
async function compressImageToBlob(dataUrl, rotation = 0, maxBytes = MAX_FILE_SIZE_BYTES) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      let width = img.width;
      let height = img.height;
      let quality = 0.92;
      let scale = 1.0;

      const isSwapped = rotation === 90 || rotation === 270;
      let maxDim = 3840;

      if (Math.max(width, height) > maxDim) {
        scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      let resultBlob = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = isSwapped ? height : width;
        canvas.height = isSwapped ? width : height;

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

        quality -= 0.12;
        width = Math.round(width * 0.85);
        height = Math.round(height * 0.85);
      }

      resolve(resultBlob);
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Convert Image to PDF
 */
async function convertImageBlobToPdf(imageBlob) {
  const arrayBuffer = await imageBlob.arrayBuffer();
  const pdfDoc = await PDFLib.PDFDocument.create();

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

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

// 10. Batch Download as .ZIP
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
    const zipName = `เอกสาร_${currentCat.name}_${timeStr}.zip`;

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, zipName);

    showToast(`ดาวน์โหลดไฟล์ ${zipName} สำเร็จ! (${attachedSlots.length} ไฟล์)`, 'success');
  } catch (err) {
    console.error('ZIP Error:', err);
    showToast('เกิดข้อผิดพลาดในการสร้างไฟล์ ZIP', 'error');
  } finally {
    btnDownloadZip.disabled = false;
    btnDownloadZip.innerHTML = `<i data-lucide="archive" class="w-3.5 h-3.5"></i><span>ดาวน์โหลด ZIP</span>`;
    lucide.createIcons();
  }
}

// 11. Utilities
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

  toast.classList.remove('translate-y-24', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-24', 'opacity-0');
  }, 3500);
}
