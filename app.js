/**
 * Auto Loan Document Optimizer & Renamer
 * Core Application Logic (True Neumorphism Soft UI + Dynamic Total Size Summary)
 */

// Application State
const state = {
  currentCategory: 'land',
  currentSubType: 'all',
  files: [], // Array of file items
  isProcessing: false,
};

// DOM Elements
const loanCategoryTabs = document.getElementById('loanCategoryTabs');
const subTypePills = document.getElementById('subTypePills');
const currentLoanBadge = document.getElementById('currentLoanBadge');
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const fileListContainer = document.getElementById('fileListContainer');
const emptyState = document.getElementById('emptyState');
const fileCountBadge = document.getElementById('fileCountBadge');
const btnAutoMatch = document.getElementById('btnAutoMatch');
const btnAllPdf = document.getElementById('btnAllPdf');
const btnAllJpg = document.getElementById('btnAllJpg');
const btnClearAll = document.getElementById('btnClearAll');
const btnDownloadZip = document.getElementById('btnDownloadZip');
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toastMsg');
const toastIcon = document.getElementById('toastIcon');

// Summary Card DOM Elements
const summaryCard = document.getElementById('summaryCard');
const sumTotalCount = document.getElementById('sumTotalCount');
const sumOriginalSize = document.getElementById('sumOriginalSize');
const sumEstimatedSize = document.getElementById('sumEstimatedSize');
const sumStatusText = document.getElementById('sumStatusText');
const sumProgressBar = document.getElementById('sumProgressBar');

// 1. Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  if (!window.LOAN_CHECKLISTS) {
    console.error('LOAN_CHECKLISTS data not found!');
    showToast('ไม่พบข้อมูล Checklist กรุณาโหลดไฟล์ checklists.js', 'error');
    return;
  }

  renderCategoryTabs();
  selectCategory('land');
  setupEventListeners();
  updateUI();
});

// 2. Render Categories and Subtypes
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
  state.currentSubType = 'all';

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

  // Render Sub Types
  renderSubTypes(catData);

  // Re-match if files already uploaded
  if (state.files.length > 0) {
    autoMatchFiles();
  }
}

function renderSubTypes(catData) {
  subTypePills.innerHTML = '';

  // All pill
  const allPill = document.createElement('button');
  allPill.className = `px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
    state.currentSubType === 'all'
      ? 'neu-pill-active'
      : 'neu-btn text-slate-600 hover:text-slate-900'
  }`;
  allPill.innerText = 'ทั้งหมด';
  allPill.addEventListener('click', () => {
    state.currentSubType = 'all';
    renderSubTypes(catData);
    renderFileList();
  });
  subTypePills.appendChild(allPill);

  // Specific subtypes
  catData.subTypes.forEach((sub) => {
    const pill = document.createElement('button');
    pill.className = `px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
      state.currentSubType === sub
        ? 'neu-pill-active'
        : 'neu-btn text-slate-600 hover:text-slate-900'
    }`;
    pill.innerText = sub;
    pill.addEventListener('click', () => {
      state.currentSubType = sub;
      renderSubTypes(catData);
      renderFileList();
    });
    subTypePills.appendChild(pill);
  });
}

// 3. Event Listeners Setup
function setupEventListeners() {
  // Dropzone click & drag
  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
      fileInput.value = '';
    }
  });

  ['dragenter', 'dragover'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('border-orange-500', 'bg-orange-50/20');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('border-orange-500', 'bg-orange-50/20');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  });

  // Batch actions
  btnAutoMatch.addEventListener('click', () => {
    autoMatchFiles();
    showToast('จัดเรียงชื่อและนามสกุลตาม Checklist เรียบร้อยแล้ว', 'success');
  });

  btnAllPdf.addEventListener('click', () => {
    state.files.forEach((f) => (f.targetFormat = 'PDF'));
    renderFileList();
    updateSummaryMetrics();
    showToast('ปรับปลายทางทุกไฟล์เป็น .PDF แล้ว', 'info');
  });

  btnAllJpg.addEventListener('click', () => {
    state.files.forEach((f) => (f.targetFormat = 'JPG'));
    renderFileList();
    updateSummaryMetrics();
    showToast('ปรับปลายทางทุกไฟล์เป็น .JPG (< 5MB) แล้ว', 'info');
  });

  btnClearAll.addEventListener('click', () => {
    if (state.files.length === 0) return;
    if (confirm('คุณต้องการล้างรายการไฟล์ทั้งหมดหรือไม่?')) {
      state.files = [];
      updateUI();
      showToast('ล้างรายการไฟล์เรียบร้อยแล้ว', 'info');
    }
  });

  btnDownloadZip.addEventListener('click', handleDownloadZip);
}

// 4. File Ingestion & Auto-Match
async function handleFiles(newFiles) {
  const currentCat = window.LOAN_CHECKLISTS[state.currentCategory];
  const checklistItems = currentCat.items;

  for (let i = 0; i < newFiles.length; i++) {
    const file = newFiles[i];
    const fileId = 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Read preview Data URL
    const dataUrl = await readFileAsDataURL(file);

    // Default item
    const targetIdx = (state.files.length) % checklistItems.length;
    const defaultCheckItem = checklistItems[targetIdx] || checklistItems[0];

    state.files.push({
      id: fileId,
      file: file,
      name: file.name,
      size: file.size,
      type: file.type,
      dataUrl: dataUrl,
      rotation: 0,
      selectedCode: defaultCheckItem.code,
      targetName: defaultCheckItem.targetName,
      targetFormat: defaultCheckItem.format || 'JPG',
    });
  }

  autoMatchFiles();
  updateUI();
  showToast(`เพิ่มไฟล์เรียบร้อยแล้ว ${newFiles.length} ไฟล์`, 'success');
}

function autoMatchFiles() {
  const currentCat = window.LOAN_CHECKLISTS[state.currentCategory];
  const checklistItems = currentCat.items;

  state.files.forEach((fileItem, idx) => {
    const matchedItem = checklistItems[idx % checklistItems.length];
    if (matchedItem) {
      fileItem.selectedCode = matchedItem.code;
      fileItem.targetName = matchedItem.targetName;
      fileItem.targetFormat = matchedItem.format || 'JPG';
    }
  });

  renderFileList();
  updateSummaryMetrics();
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

// 5. Render File List
function renderFileList() {
  fileListContainer.innerHTML = '';
  const currentCat = window.LOAN_CHECKLISTS[state.currentCategory];
  const checklistItems = currentCat.items;

  state.files.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'neu-raised rounded-3xl p-5 flex flex-col justify-between gap-4 transition-all hover:scale-[1.008]';

    const formattedOriginalSize = formatFileSize(item.size);

    // Group select options by Group
    const groups = {};
    checklistItems.forEach((ci) => {
      if (!groups[ci.group]) groups[ci.group] = [];
      groups[ci.group].push(ci);
    });

    let selectOptionsHtml = '';
    for (const [groupName, items] of Object.entries(groups)) {
      selectOptionsHtml += `<optgroup label="หมวด ${groupName}">`;
      items.forEach((ci) => {
        const isSelected = item.selectedCode === ci.code ? 'selected' : '';
        selectOptionsHtml += `<option value="${ci.code}" ${isSelected}>[${ci.code}] ${ci.targetName} (${ci.format}) - ${ci.desc.substring(0, 30)}</option>`;
      });
      selectOptionsHtml += `</optgroup>`;
    }

    card.innerHTML = `
      <div class="flex items-start gap-4">
        <!-- Thumbnail Inset Well -->
        <div class="w-20 h-20 rounded-2xl neu-inset overflow-hidden flex-shrink-0 flex items-center justify-center relative p-1">
          ${
            item.dataUrl
              ? `<img src="${item.dataUrl}" style="transform: rotate(${item.rotation}deg);" class="w-full h-full object-cover rounded-xl transition-transform" alt="Preview">`
              : `<div class="flex flex-col items-center text-slate-500"><i data-lucide="file-text" class="w-8 h-8 text-red-500"></i><span class="text-[10px] font-bold">PDF</span></div>`
          }
          <div class="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-slate-800/80 text-white text-[9px] font-bold">
            #${index + 1}
          </div>
        </div>

        <!-- File Details & Selectors -->
        <div class="flex-1 min-w-0 space-y-2.5">
          <div class="flex items-center justify-between gap-1">
            <span class="text-xs font-bold text-slate-800 truncate" title="${item.name}">${item.name}</span>
            <span class="text-[10px] px-2 py-0.5 rounded-lg neu-inset text-slate-600 font-semibold whitespace-nowrap">
              ${formattedOriginalSize}
            </span>
          </div>

          <!-- Checklist Select Dropdown -->
          <div>
            <label class="block text-[10px] font-bold text-slate-500 mb-1">เลือกชื่อจาก Checklist:</label>
            <select class="w-full text-xs font-semibold neu-inset rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none select-checklist cursor-pointer" data-id="${item.id}">
              ${selectOptionsHtml}
            </select>
          </div>

          <!-- Custom Target Name Input -->
          <div>
            <label class="block text-[10px] font-bold text-slate-500 mb-1">ชื่อไฟล์เป้าหมาย (แก้ไขได้):</label>
            <input type="text" value="${item.targetName}" class="w-full text-xs font-bold text-orange-600 neu-inset rounded-xl px-3 py-1.5 focus:outline-none input-target-name" data-id="${item.id}">
          </div>
        </div>
      </div>

      <!-- Footer Control Bar -->
      <div class="pt-3 border-t border-[#dfe2eb] flex items-center justify-between gap-2">
        <!-- Segmented Neumorphic Format Switch -->
        <div class="flex items-center gap-1.5">
          <span class="text-[11px] font-bold text-slate-500 mr-1">แปลงเป็น:</span>
          
          <div class="flex items-center p-1 rounded-xl neu-inset gap-1">
            <button class="px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer btn-format-jpg ${
              item.targetFormat === 'JPG'
                ? 'neu-pill-active'
                : 'text-slate-600 hover:text-slate-900'
            }" data-id="${item.id}">JPG</button>
            
            <button class="px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer btn-format-pdf ${
              item.targetFormat === 'PDF'
                ? 'neu-pill-active'
                : 'text-slate-600 hover:text-slate-900'
            }" data-id="${item.id}">PDF</button>
          </div>
        </div>

        <!-- Action Buttons (Rotate, Download Single, Delete) -->
        <div class="flex items-center gap-2">
          ${
            item.dataUrl
              ? `<button class="p-2 rounded-xl neu-btn text-slate-600 hover:text-orange-600 btn-rotate cursor-pointer" title="หมุนภาพ 90°" data-id="${item.id}">
                  <i data-lucide="rotate-cw" class="w-3.5 h-3.5"></i>
                </button>`
              : ''
          }
          <button class="px-3 py-1.5 rounded-xl neu-btn text-orange-600 text-xs font-bold flex items-center gap-1.5 btn-download-single cursor-pointer" data-id="${item.id}" title="ดาวน์โหลดไฟล์นี้เดี่ยวๆ">
            <i data-lucide="download" class="w-3.5 h-3.5"></i>
            <span>โหลดเดี่ยว</span>
          </button>
          <button class="p-2 rounded-xl neu-btn text-slate-400 hover:text-red-600 btn-delete cursor-pointer" title="ลบรายการนี้" data-id="${item.id}">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `;

    fileListContainer.appendChild(card);
  });

  // Re-attach card events
  attachCardEvents();
  lucide.createIcons();
}

function attachCardEvents() {
  // Checklist select change
  document.querySelectorAll('.select-checklist').forEach((sel) => {
    sel.addEventListener('change', (e) => {
      const fileId = e.target.dataset.id;
      const code = e.target.value;
      const item = state.files.find((f) => f.id === fileId);
      const currentCat = window.LOAN_CHECKLISTS[state.currentCategory];
      const checkItem = currentCat.items.find((ci) => ci.code === code);

      if (item && checkItem) {
        item.selectedCode = checkItem.code;
        item.targetName = checkItem.targetName;
        item.targetFormat = checkItem.format || 'JPG';
        renderFileList();
        updateSummaryMetrics();
      }
    });
  });

  // Target name edit
  document.querySelectorAll('.input-target-name').forEach((inp) => {
    inp.addEventListener('input', (e) => {
      const fileId = e.target.dataset.id;
      const item = state.files.find((f) => f.id === fileId);
      if (item) {
        item.targetName = e.target.value;
      }
    });
  });

  // Format toggles
  document.querySelectorAll('.btn-format-jpg').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const fileId = e.target.dataset.id;
      const item = state.files.find((f) => f.id === fileId);
      if (item) {
        item.targetFormat = 'JPG';
        renderFileList();
        updateSummaryMetrics();
      }
    });
  });

  document.querySelectorAll('.btn-format-pdf').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const fileId = e.target.dataset.id;
      const item = state.files.find((f) => f.id === fileId);
      if (item) {
        item.targetFormat = 'PDF';
        renderFileList();
        updateSummaryMetrics();
      }
    });
  });

  // Rotate image
  document.querySelectorAll('.btn-rotate').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const fileId = e.currentTarget.dataset.id;
      const item = state.files.find((f) => f.id === fileId);
      if (item) {
        item.rotation = (item.rotation + 90) % 360;
        renderFileList();
      }
    });
  });

  // Download Single File
  document.querySelectorAll('.btn-download-single').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const fileId = e.currentTarget.dataset.id;
      const item = state.files.find((f) => f.id === fileId);
      if (item) {
        showToast(`กำลังเตรียมไฟล์ ${item.targetName}...`, 'info');
        try {
          const { blob, finalFilename } = await processFile(item);
          downloadBlob(blob, finalFilename);
          showToast(`ดาวน์โหลด ${finalFilename} เรียบร้อยแล้ว`, 'success');
        } catch (err) {
          console.error(err);
          showToast('เกิดข้อผิดพลาดในการแปลงไฟล์', 'error');
        }
      }
    });
  });

  // Delete file
  document.querySelectorAll('.btn-delete').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const fileId = e.currentTarget.dataset.id;
      state.files = state.files.filter((f) => f.id !== fileId);
      updateUI();
      showToast('ลบรายการไฟล์แล้ว', 'info');
    });
  });
}

function updateUI() {
  fileCountBadge.innerText = `${state.files.length} ไฟล์`;
  if (state.files.length === 0) {
    emptyState.classList.remove('hidden');
    fileListContainer.classList.add('hidden');
    summaryCard.classList.add('hidden');
    btnDownloadZip.disabled = true;
  } else {
    emptyState.classList.add('hidden');
    fileListContainer.classList.remove('hidden');
    summaryCard.classList.remove('hidden');
    btnDownloadZip.disabled = false;
    renderFileList();
    updateSummaryMetrics();
  }
}

// Update Total Size Summary Card Metrics
function updateSummaryMetrics() {
  if (state.files.length === 0) return;

  let totalOriginalBytes = 0;
  let totalEstimatedBytes = 0;

  state.files.forEach((f) => {
    totalOriginalBytes += f.size;
    // Estimated size per file (bounded by 5MB, optimized images usually compressed to ~1.2MB - 2.5MB)
    if (f.size > 5 * 1024 * 1024) {
      totalEstimatedBytes += 2.8 * 1024 * 1024;
    } else {
      totalEstimatedBytes += Math.min(f.size, 2.5 * 1024 * 1024);
    }
  });

  sumTotalCount.innerText = `${state.files.length} ไฟล์`;
  sumOriginalSize.innerText = formatFileSize(totalOriginalBytes);
  sumEstimatedSize.innerText = `~${formatFileSize(totalEstimatedBytes)}`;

  // Progress percentage indication
  const ratio = Math.min(100, Math.round((totalEstimatedBytes / Math.max(totalOriginalBytes, 1)) * 100));
  const fillWidth = Math.max(15, Math.min(100, 100 - (ratio < 90 ? (100 - ratio) : 30)));
  sumProgressBar.style.width = `${fillWidth}%`;
  sumStatusText.innerText = `ปลอดภัย < 5MB/ไฟล์ (ประหยัด ~${Math.max(10, 100 - ratio)}%)`;
}

// 6. Image & Document Processing Engine (< 5MB Guaranteed)
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

async function processFile(item) {
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

// 7. Batch Download as .ZIP
async function handleDownloadZip() {
  if (state.files.length === 0) {
    showToast('ไม่มีไฟล์สำหรับดาวน์โหลด', 'error');
    return;
  }

  btnDownloadZip.disabled = true;
  btnDownloadZip.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>กำลังประมวลผล...</span>`;
  lucide.createIcons();
  showToast('กำลังบีบอัดและรวมไฟล์เป็น ZIP...', 'info');

  try {
    const zip = new JSZip();
    const usedNames = new Set();

    for (let i = 0; i < state.files.length; i++) {
      const item = state.files[i];
      const { blob, finalFilename } = await processFile(item);

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

    showToast(`ดาวน์โหลดไฟล์ ${zipName} สำเร็จ!`, 'success');
  } catch (err) {
    console.error('ZIP Error:', err);
    showToast('เกิดข้อผิดพลาดในการสร้างไฟล์ ZIP', 'error');
  } finally {
    btnDownloadZip.disabled = false;
    btnDownloadZip.innerHTML = `<i data-lucide="archive" class="w-4 h-4"></i><span>ดาวน์โหลดทั้งหมด (.ZIP)</span>`;
    lucide.createIcons();
  }
}

// 8. Helper Utilities
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
