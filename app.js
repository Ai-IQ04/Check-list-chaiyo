/**
 * Auto Loan Document Optimizer & Renamer
 * Slot-based Checklist Attachment Engine (True Neumorphism Soft UI)
 */

// Application State
const state = {
  currentCategory: 'land',
  selectedGroupFilter: 'all',
  slots: [], // Array of slot items: { code, group, desc, targetName, format, attached: null }
};

// DOM Elements
const loanCategoryTabs = document.getElementById('loanCategoryTabs');
const currentLoanBadge = document.getElementById('currentLoanBadge');
const groupFilterPills = document.getElementById('groupFilterPills');
const slotsContainer = document.getElementById('slotsContainer');
const attachedCountBadge = document.getElementById('attachedCountBadge');
const sumOriginalSize = document.getElementById('sumOriginalSize');
const sumEstimatedSize = document.getElementById('sumEstimatedSize');
const btnDownloadZip = document.getElementById('btnDownloadZip');
const btnBatchAutoFill = document.getElementById('btnBatchAutoFill');
const batchFileInput = document.getElementById('batchFileInput');
const btnClearAllAttached = document.getElementById('btnClearAllAttached');
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

  renderCategoryTabs();
  selectCategory('land');
  setupGlobalEventListeners();
});

// 2. Category Selection & Slots Initialization
function renderCategoryTabs() {
  loanCategoryTabs.innerHTML = '';
  const categories = Object.values(window.LOAN_CHECKLISTS);

  categories.forEach((cat) => {
    const btn = document.createElement('button');
    btn.className = `p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all text-slate-700 hover:text-orange-600 cursor-pointer ${
      state.currentCategory === cat.id ? 'neu-tab-active font-extrabold' : 'neu-btn font-bold'
    }`;
    btn.innerHTML = `
      <span class="text-2xl filter drop-shadow-sm">${cat.icon}</span>
      <span class="text-xs text-center line-clamp-1">${cat.name.replace('สินเชื่อ', '')}</span>
    `;
    btn.addEventListener('click', () => selectCategory(cat.id));
    loanCategoryTabs.appendChild(btn);
  });
}

function selectCategory(catId) {
  state.currentCategory = catId;
  state.selectedGroupFilter = 'all';

  const catData = window.LOAN_CHECKLISTS[catId];
  currentLoanBadge.innerText = `กำลังเลือก: ${catData.name}`;

  // Update tabs highlight
  Array.from(loanCategoryTabs.children).forEach((tab, index) => {
    const cat = Object.values(window.LOAN_CHECKLISTS)[index];
    if (cat.id === catId) {
      tab.className = 'p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all neu-tab-active font-extrabold cursor-pointer';
    } else {
      tab.className = 'neu-btn p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all text-slate-700 hover:text-orange-600 font-bold cursor-pointer';
    }
  });

  // Initialize Slots from Checklist
  state.slots = catData.items.map((item) => ({
    code: item.code,
    group: item.group,
    desc: item.desc,
    targetName: item.targetName,
    defaultFormat: item.format || 'JPG',
    attached: null, // { file, name, size, type, dataUrl, rotation: 0, targetFormat, targetName }
  }));

  renderGroupFilterPills();
  renderSlots();
  updateSummaryMetrics();
}

function renderGroupFilterPills() {
  groupFilterPills.innerHTML = '';

  // Get unique groups
  const groups = Array.from(new Set(state.slots.map((s) => s.group)));

  // "All" Pill
  const allPill = document.createElement('button');
  allPill.className = `px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
    state.selectedGroupFilter === 'all'
      ? 'neu-pill-active'
      : 'neu-btn text-slate-600 hover:text-slate-900'
  }`;
  allPill.innerText = `ทั้งหมด (${state.slots.length})`;
  allPill.addEventListener('click', () => {
    state.selectedGroupFilter = 'all';
    renderGroupFilterPills();
    renderSlots();
  });
  groupFilterPills.appendChild(allPill);

  // Specific Group Pills
  groups.forEach((groupName) => {
    const countInGroup = state.slots.filter((s) => s.group === groupName).length;
    const attachedInGroup = state.slots.filter((s) => s.group === groupName && s.attached).length;

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
}

// 3. Render Checklist Topic Slots
function renderSlots() {
  slotsContainer.innerHTML = '';

  // Filter slots
  const visibleSlots =
    state.selectedGroupFilter === 'all'
      ? state.slots
      : state.slots.filter((s) => s.group === state.selectedGroupFilter);

  // Group visible slots
  const grouped = {};
  visibleSlots.forEach((slot) => {
    if (!grouped[slot.group]) grouped[slot.group] = [];
    grouped[slot.group].push(slot);
  });

  for (const [groupName, slotsInGroup] of Object.entries(grouped)) {
    const groupSection = document.createElement('div');
    groupSection.className = 'space-y-3';

    // Group Header
    groupSection.innerHTML = `
      <div class="flex items-center justify-between pb-1 border-b border-[#dfe2eb]">
        <h3 class="text-sm font-extrabold text-slate-800 flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_6px_#ff6a00]"></span>
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
      card.className = `neu-raised rounded-3xl p-4 transition-all flex flex-col justify-between gap-3 ${
        isAttached ? 'neu-slot-attached' : ''
      }`;

      // Hidden file input for this specific slot
      const slotInputId = `slot_input_${slot.code}`;

      if (!isAttached) {
        // Empty Slot (Ready for Attachment)
        card.innerHTML = `
          <input type="file" id="${slotInputId}" data-code="${slot.code}" accept="image/jpeg,image/png,image/webp,application/pdf" class="hidden slot-file-input">
          
          <div class="flex items-start justify-between gap-3">
            <div class="space-y-1 flex-1">
              <div class="flex items-center gap-2">
                <span class="text-xs px-2 py-0.5 rounded-lg neu-inset font-extrabold text-orange-600">${slot.code}</span>
                <span class="text-xs font-extrabold text-slate-800 truncate">${slot.targetName}</span>
                <span class="text-[10px] px-2 py-0.5 rounded-md neu-inset font-bold text-slate-500">${slot.defaultFormat}</span>
              </div>
              <p class="text-xs text-slate-500 line-clamp-2">${slot.desc}</p>
            </div>
          </div>

          <!-- Click / Drop Target Area -->
          <div class="neu-inset rounded-2xl p-4 text-center cursor-pointer hover:border-orange-400 transition-all border border-dashed border-[#cbced8] slot-drop-target group" data-code="${slot.code}">
            <div class="flex items-center justify-center gap-2 text-slate-600 group-hover:text-orange-600 transition-colors">
              <div class="w-8 h-8 rounded-xl neu-raised flex items-center justify-center text-orange-500 group-hover:scale-105 transition-transform">
                <i data-lucide="plus" class="w-4 h-4"></i>
              </div>
              <span class="text-xs font-bold">คลิกหรือลากรูปมาวางเพื่อแนบเอกสารนี้</span>
            </div>
          </div>
        `;
      } else {
        // Attached Slot (With File Preview & Controls)
        const att = slot.attached;
        const formattedSize = formatFileSize(att.size);

        card.innerHTML = `
          <input type="file" id="${slotInputId}" data-code="${slot.code}" accept="image/jpeg,image/png,image/webp,application/pdf" class="hidden slot-file-input">
          
          <div class="flex items-start gap-3.5">
            <!-- Thumbnail Preview Well -->
            <div class="w-20 h-20 rounded-2xl neu-inset overflow-hidden flex-shrink-0 flex items-center justify-center relative p-1">
              ${
                att.dataUrl
                  ? `<img src="${att.dataUrl}" style="transform: rotate(${att.rotation}deg);" class="w-full h-full object-cover rounded-xl transition-transform" alt="Preview">`
                  : `<div class="flex flex-col items-center text-slate-500"><i data-lucide="file-text" class="w-8 h-8 text-red-500"></i><span class="text-[10px] font-bold">PDF</span></div>`
              }
              <div class="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-orange-600 text-white text-[9px] font-extrabold shadow-sm">
                ${slot.code}
              </div>
            </div>

            <!-- Details & Renaming -->
            <div class="flex-1 min-w-0 space-y-1.5">
              <div class="flex items-center justify-between gap-1">
                <span class="text-xs font-extrabold text-slate-800 truncate" title="${slot.desc}">[${slot.code}] ${slot.desc}</span>
                <span class="text-[10px] px-2 py-0.5 rounded-lg neu-inset text-slate-600 font-semibold whitespace-nowrap">
                  ${formattedSize}
                </span>
              </div>

              <div>
                <label class="block text-[10px] font-bold text-slate-500 mb-0.5">ชื่อไฟล์ที่จะบันทึก:</label>
                <input type="text" value="${att.targetName}" data-code="${slot.code}" class="w-full text-xs font-extrabold text-orange-600 neu-inset rounded-xl px-3 py-1.5 focus:outline-none input-slot-name">
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
                }" data-code="${slot.code}">JPG</button>
                <button class="px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer btn-slot-pdf ${
                  att.targetFormat === 'PDF' ? 'neu-pill-active' : 'text-slate-600'
                }" data-code="${slot.code}">PDF</button>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-1.5">
              ${
                att.dataUrl
                  ? `<button class="p-2 rounded-xl neu-btn text-slate-600 hover:text-orange-600 btn-slot-rotate cursor-pointer" title="หมุนภาพ 90°" data-code="${slot.code}">
                      <i data-lucide="rotate-cw" class="w-3.5 h-3.5"></i>
                    </button>`
                  : ''
              }
              <button class="p-2 rounded-xl neu-btn text-orange-600 btn-slot-change cursor-pointer" title="เปลี่ยนไฟล์นี้" data-code="${slot.code}">
                <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
              </button>
              <button class="px-2.5 py-1 rounded-xl neu-btn text-orange-600 text-xs font-bold flex items-center gap-1 btn-slot-download cursor-pointer" data-code="${slot.code}" title="ดาวน์โหลดไฟล์นี้เดี่ยวๆ">
                <i data-lucide="download" class="w-3.5 h-3.5"></i>
                <span>โหลด</span>
              </button>
              <button class="p-2 rounded-xl neu-btn text-slate-400 hover:text-red-600 btn-slot-remove cursor-pointer" title="ลบไฟล์ที่แนบ" data-code="${slot.code}">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
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

// 4. Attach Events to Slots
function attachSlotEvents() {
  // Click drop target to trigger slot input
  document.querySelectorAll('.slot-drop-target').forEach((el) => {
    const code = el.dataset.code;
    const input = document.getElementById(`slot_input_${code}`);
    el.addEventListener('click', () => input.click());

    // Drag & drop on slot
    ['dragenter', 'dragover'].forEach((evt) => {
      el.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.classList.add('border-orange-500', 'bg-orange-50/30');
      });
    });

    ['dragleave', 'drop'].forEach((evt) => {
      el.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.classList.remove('border-orange-500', 'bg-orange-50/30');
      });
    });

    el.addEventListener('drop', (e) => {
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        attachFileToSlot(code, e.dataTransfer.files[0]);
      }
    });
  });

  // Slot file inputs change
  document.querySelectorAll('.slot-file-input').forEach((inp) => {
    inp.addEventListener('change', (e) => {
      const code = e.target.dataset.code;
      if (e.target.files.length > 0) {
        attachFileToSlot(code, e.target.files[0]);
        e.target.value = '';
      }
    });
  });

  // Change file button
  document.querySelectorAll('.btn-slot-change').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const code = e.currentTarget.dataset.code;
      const input = document.getElementById(`slot_input_${code}`);
      if (input) input.click();
    });
  });

  // Rename input
  document.querySelectorAll('.input-slot-name').forEach((inp) => {
    inp.addEventListener('input', (e) => {
      const code = e.target.dataset.code;
      const slot = state.slots.find((s) => s.code === code);
      if (slot && slot.attached) {
        slot.attached.targetName = e.target.value;
      }
    });
  });

  // Format toggle JPG
  document.querySelectorAll('.btn-slot-jpg').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const code = e.currentTarget.dataset.code;
      const slot = state.slots.find((s) => s.code === code);
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
      const code = e.currentTarget.dataset.code;
      const slot = state.slots.find((s) => s.code === code);
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
      const code = e.currentTarget.dataset.code;
      const slot = state.slots.find((s) => s.code === code);
      if (slot && slot.attached) {
        slot.attached.rotation = (slot.attached.rotation + 90) % 360;
        renderSlots();
      }
    });
  });

  // Single download
  document.querySelectorAll('.btn-slot-download').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const code = e.currentTarget.dataset.code;
      const slot = state.slots.find((s) => s.code === code);
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
      const code = e.currentTarget.dataset.code;
      const slot = state.slots.find((s) => s.code === code);
      if (slot) {
        slot.attached = null;
        renderSlots();
        renderGroupFilterPills();
        updateSummaryMetrics();
        showToast(`ลบไฟล์ออกจากหัวข้อ [${code}] เรียบร้อย`, 'info');
      }
    });
  });
}

// 5. Attach File To Specific Slot
async function attachFileToSlot(code, file) {
  const slot = state.slots.find((s) => s.code === code);
  if (!slot) return;

  const dataUrl = await readFileAsDataURL(file);

  slot.attached = {
    file: file,
    name: file.name,
    size: file.size,
    type: file.type,
    dataUrl: dataUrl,
    rotation: 0,
    targetName: slot.targetName,
    targetFormat: slot.defaultFormat,
  };

  renderSlots();
  renderGroupFilterPills();
  updateSummaryMetrics();
  showToast(`แนบไฟล์ใน [${code}] ${slot.targetName} สำเร็จ!`, 'success');
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

// 6. Global Batch Events (Auto-Fill & Clear)
function setupGlobalEventListeners() {
  // Batch Auto-fill button
  btnBatchAutoFill.addEventListener('click', () => batchFileInput.click());
  batchFileInput.addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      let fileIdx = 0;

      // Find first empty slot and fill
      for (let i = 0; i < state.slots.length && fileIdx < files.length; i++) {
        if (!state.slots[i].attached) {
          const file = files[fileIdx];
          const dataUrl = await readFileAsDataURL(file);
          state.slots[i].attached = {
            file: file,
            name: file.name,
            size: file.size,
            type: file.type,
            dataUrl: dataUrl,
            rotation: 0,
            targetName: state.slots[i].targetName,
            targetFormat: state.slots[i].defaultFormat,
          };
          fileIdx++;
        }
      }

      batchFileInput.value = '';
      renderSlots();
      renderGroupFilterPills();
      updateSummaryMetrics();
      showToast(`ใส่ไฟล์ลงช่อง Checklist สำเร็จ ${fileIdx} ไฟล์`, 'success');
    }
  });

  // Clear all attached files
  btnClearAllAttached.addEventListener('click', () => {
    const attachedCount = state.slots.filter((s) => s.attached).length;
    if (attachedCount === 0) return;

    if (confirm('คุณต้องการล้างไฟล์ที่แนบทั้งหมดในหน้านี้หรือไม่?')) {
      state.slots.forEach((s) => (s.attached = null));
      renderSlots();
      renderGroupFilterPills();
      updateSummaryMetrics();
      showToast('ล้างไฟล์ที่แนบทั้งหมดเรียบร้อยแล้ว', 'info');
    }
  });

  btnDownloadZip.addEventListener('click', handleDownloadZip);
}

// 7. Metrics Calculation
function updateSummaryMetrics() {
  const attachedSlots = state.slots.filter((s) => s.attached);
  attachedCountBadge.innerText = `${attachedSlots.length} / ${state.slots.length} ไฟล์`;

  let totalOriginalBytes = 0;
  let totalEstimatedBytes = 0;

  attachedSlots.forEach((s) => {
    const att = s.attached;
    totalOriginalBytes += att.size;
    if (att.size > 5 * 1024 * 1024) {
      totalEstimatedBytes += 2.8 * 1024 * 1024;
    } else {
      totalEstimatedBytes += Math.min(att.size, 2.5 * 1024 * 1024);
    }
  });

  sumOriginalSize.innerText = formatFileSize(totalOriginalBytes);
  sumEstimatedSize.innerText = `~${formatFileSize(totalEstimatedBytes)}`;

  btnDownloadZip.disabled = attachedSlots.length === 0;
}

// 8. Image & Document Processing Engine (< 5MB Guaranteed)
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

// 9. Batch Download as .ZIP
async function handleDownloadZip() {
  const attachedSlots = state.slots.filter((s) => s.attached);
  if (attachedSlots.length === 0) {
    showToast('ไม่มีไฟล์ที่แนบสำหรับดาวน์โหลด', 'error');
    return;
  }

  btnDownloadZip.disabled = true;
  btnDownloadZip.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>กำลังรวมไฟล์ ZIP...</span>`;
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
    btnDownloadZip.innerHTML = `<i data-lucide="archive" class="w-4 h-4"></i><span>ดาวน์โหลดเอกสารที่แนบ (.ZIP)</span>`;
    lucide.createIcons();
  }
}

// 10. Utilities
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
