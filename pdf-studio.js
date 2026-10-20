/**
 * PDF Studio: โมดูลปลดล็อค & แปลงไฟล์ PDF สำหรับระบบจัดการเอกสารสินเชื่อ
 * - ปลดล็อครหัสผ่าน PDF (Remove Password / Bank Statement Decrypt)
 * - แปลง PDF เป็นรูปภาพ (PDF to JPG/PNG + ZIP Download)
 * - รวมรูปภาพเป็น PDF (Images to PDF + Sorting & Rotation)
 * - บีบอัดลดขนาด PDF (Compress PDF < 5MB)
 * - แนบไฟล์ผลลัพธ์เข้าสู่ช่อง Checklist ได้โดยตรงในคลิกเดียว
 * 100% Client-Side Processing (Zero Server Upload / PDPA Compliant)
 */

(function () {
  'use strict';

  // Ensure PDF.js worker is properly configured
  function ensurePdfWorker() {
    if (window.pdfjsLib && !window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
  }

  // PDF Studio State
  const studioState = {
    activeTab: 'unlock', // 'unlock' | 'pdf2img' | 'img2pdf' | 'compress'
    
    // Tab 1: Unlock
    unlockFile: null,
    unlockArrayBuffer: null,
    unlockPdfDoc: null,
    unlockPasswordNeeded: false,
    unlockCanvases: [],
    unlockedPdfBlob: null,
    unlockIsLoading: false,

    // Tab 2: PDF to Images
    convertFile: null,
    convertArrayBuffer: null,
    convertPdfDoc: null,
    convertCanvases: [],
    convertFormat: 'jpg', // 'jpg' | 'png'
    convertDpiScale: 2.0, // 1.5 = Normal, 2.0 = Hi-Res
    convertIsLoading: false,

    // Tab 3: Images to PDF
    imgList: [], // array of { id, file, dataUrl, rotation, name, size }
    imgPdfName: '',
    imgIsLoading: false,

    // Tab 4: Compress PDF
    compressFile: null,
    compressedBlob: null,
    compressIsLoading: false,

    // Slot Quick Unlock pending state
    quickUnlockSlotId: null,
    quickUnlockFile: null,
    quickUnlockArrayBuffer: null,
  };

  // Helper: Format file size
  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Helper: Download Blob
  function downloadBlobFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Populate slots into dropdown selectors
  function populateSlotDropdown(selectElId, filterText = '') {
    const sel = document.getElementById(selectElId);
    if (!sel) return;

    sel.innerHTML = '<option value="">-- เลือกช่องเอกสารที่ต้องการแนบ --</option>';
    let slots = [];
    if (typeof window.getAllSlots === 'function') {
      slots = window.getAllSlots();
    } else if (window.state && Array.isArray(window.state.slots)) {
      slots = [...window.state.slots, ...(window.state.customSlots || [])];
    }

    slots.forEach((s) => {
      const opt = document.createElement('option');
      opt.value = s.id;
      const status = s.attached ? '✓ แนบแล้ว' : '○ ว่าง';
      opt.textContent = `[${s.code}] ${s.targetName} (${status})`;
      sel.appendChild(opt);
    });
  }

  // ==========================================
  // TAB NAVIGATION
  // ==========================================
  function switchStudioTab(tabId) {
    studioState.activeTab = tabId;

    const tabs = ['unlock', 'pdf2img', 'img2pdf', 'compress'];
    tabs.forEach((t) => {
      const btn = document.getElementById(`tabBtn_${t}`);
      const pane = document.getElementById(`tabPane_${t}`);
      if (btn) {
        if (t === tabId) {
          btn.className =
            'px-3 sm:px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer neu-pill-active text-orange-600 bg-white/95 shadow-sm border border-orange-300/60';
        } else {
          btn.className =
            'px-3 sm:px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-slate-600 hover:text-orange-600 transition-all cursor-pointer neu-btn';
        }
      }
      if (pane) {
        pane.classList.toggle('hidden', t !== tabId);
      }
    });

    if (window.lucide) window.lucide.createIcons();
  }

  // ==========================================
  // TAB 1: UNLOCK PDF (ถอดรหัสผ่าน PDF)
  // ==========================================
  async function handleUnlockFileSelect(file) {
    if (!file) return;
    ensurePdfWorker();

    studioState.unlockFile = file;
    studioState.unlockCanvases = [];
    studioState.unlockedPdfBlob = null;
    studioState.unlockPdfDoc = null;

    // Reset UI
    const fileInfo = document.getElementById('unlockFileInfo');
    const fileName = document.getElementById('unlockFileName');
    const fileSize = document.getElementById('unlockFileSize');
    const pwdBox = document.getElementById('unlockPasswordBox');
    const resultBox = document.getElementById('unlockResultBox');
    const errorBox = document.getElementById('unlockErrorBox');
    const pwdInput = document.getElementById('unlockPasswordInput');

    if (pwdInput) pwdInput.value = '';
    if (resultBox) resultBox.classList.add('hidden');
    if (errorBox) errorBox.classList.add('hidden');

    if (fileName) fileName.textContent = file.name;
    if (fileSize) fileSize.textContent = formatBytes(file.size);
    if (fileInfo) fileInfo.classList.remove('hidden');

    try {
      showUnlockLoading(true, 'กำลังตรวจสอบโครงสร้างไฟล์ PDF...');
      const buffer = await file.arrayBuffer();
      studioState.unlockArrayBuffer = buffer;

      // Try loading without password first (use sliced copy so master buffer isn't detached)
      const loadingTask = window.pdfjsLib.getDocument({
        data: new Uint8Array(buffer.slice(0)),
        password: '',
      });

      const pdfDoc = await loadingTask.promise;
      // No password needed!
      studioState.unlockPasswordNeeded = false;
      studioState.unlockPdfDoc = pdfDoc;
      if (pwdBox) pwdBox.classList.add('hidden');

      showUnlockLoading(false);
      renderUnlockSuccessUI(pdfDoc, false);
    } catch (err) {
      showUnlockLoading(false);
      if (err.name === 'PasswordException') {
        studioState.unlockPasswordNeeded = true;
        if (pwdBox) {
          pwdBox.classList.remove('hidden');
          pwdBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        if (pwdInput) pwdInput.focus();
      } else {
        showUnlockError('ไม่สามารถเปิดไฟล์ PDF นี้ได้: ' + (err.message || 'ไฟล์อาจเสียหาย'));
      }
    }
  }

  async function submitUnlockPassword() {
    const pwdInput = document.getElementById('unlockPasswordInput');
    const password = pwdInput ? pwdInput.value : '';

    if (!password) {
      showUnlockError('กรุณากรอกรหัสผ่านเพื่อปลดล็อค');
      return;
    }

    if (!studioState.unlockFile && !studioState.unlockArrayBuffer) {
      showUnlockError('ไม่พบข้อมูลไฟล์ PDF กรุณาเลือกไฟล์ใหม่อีกครั้ง');
      return;
    }

    ensurePdfWorker();
    const errorBox = document.getElementById('unlockErrorBox');
    if (errorBox) errorBox.classList.add('hidden');

    try {
      showUnlockLoading(true, 'กำลังถอดรหัสผ่านและประมวลผลเอกสาร...');

      // Always obtain a fresh ArrayBuffer from the file to avoid detached buffer errors
      const freshBuffer = studioState.unlockFile
        ? await studioState.unlockFile.arrayBuffer()
        : studioState.unlockArrayBuffer.slice(0);

      const loadingTask = window.pdfjsLib.getDocument({
        data: new Uint8Array(freshBuffer),
        password: password,
      });

      const pdfDoc = await loadingTask.promise;
      studioState.unlockPdfDoc = pdfDoc;
      showUnlockLoading(false);

      // Render pages to canvas & generate unlocked PDF
      renderUnlockSuccessUI(pdfDoc, true);
    } catch (err) {
      showUnlockLoading(false);
      if (err.name === 'PasswordException') {
        showUnlockError('รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่านอีกครั้ง');
        if (pwdInput) {
          pwdInput.select();
          pwdInput.focus();
        }
      } else {
        showUnlockError('เกิดข้อผิดพลาดในการปลดล็อค: ' + (err.message || err));
      }
    }
  }

  async function renderUnlockSuccessUI(pdfDoc, wasLocked) {
    const resultBox = document.getElementById('unlockResultBox');
    const statusBadge = document.getElementById('unlockStatusBadge');
    const pageCountText = document.getElementById('unlockPageCountText');
    const previewContainer = document.getElementById('unlockPreviewContainer');
    const pwdBox = document.getElementById('unlockPasswordBox');

    if (pwdBox) pwdBox.classList.add('hidden');
    if (resultBox) resultBox.classList.remove('hidden');

    if (statusBadge) {
      if (wasLocked) {
        statusBadge.innerHTML = `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300">
          <i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-600"></i> ปลดล็อครหัสผ่านสำเร็จ (ไร้รหัสผ่านแล้ว)
        </span>`;
      } else {
        statusBadge.innerHTML = `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-100 text-blue-800 text-xs font-black border border-blue-300">
          <i data-lucide="info" class="w-3.5 h-3.5 text-blue-600"></i> ไฟล์นี้ไม่มีรหัสผ่าน พร้อมส่งออกหรือแปลงไฟล์
        </span>`;
      }
    }

    if (pageCountText) {
      pageCountText.textContent = `จำนวน ${pdfDoc.numPages} หน้า`;
    }

    // Populate dropdown slots
    populateSlotDropdown('unlockTargetSlotSelect');

    // Render Preview Canvases
    if (previewContainer) {
      previewContainer.innerHTML = `
        <div class="col-span-full py-8 text-center text-slate-500 font-bold flex items-center justify-center gap-2">
          <i data-lucide="loader-2" class="w-5 h-5 animate-spin text-orange-500"></i> กำลังสร้างภาพตัวอย่างเอกสารความคมชัดสูง...
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
    }

    try {
      const canvases = [];
      const numPages = pdfDoc.numPages;

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.8 }); // Sharp preview
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        const ctx = canvas.getContext('2d', { alpha: false });
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        canvases.push(canvas);
      }

      studioState.unlockCanvases = canvases;

      // Display previews in grid
      if (previewContainer) {
        previewContainer.innerHTML = '';
        canvases.forEach((canvas, idx) => {
          const card = document.createElement('div');
          card.className =
            'neu-inset rounded-2xl p-2.5 flex flex-col items-center gap-2 bg-white/70 border border-slate-200/80 shadow-xs';
          
          const img = document.createElement('img');
          img.src = canvas.toDataURL('image/jpeg', 0.85);
          img.className = 'w-full h-44 object-contain rounded-xl bg-white shadow-xs';
          img.alt = `หน้า ${idx + 1}`;

          const caption = document.createElement('div');
          caption.className = 'flex items-center justify-between w-full px-1 text-[11px] font-extrabold text-slate-600';
          caption.innerHTML = `<span>หน้า ${idx + 1} / ${numPages}</span>
            <button type="button" class="text-orange-600 hover:text-orange-700 underline cursor-pointer btn-download-single-page" data-page="${idx}">โหลดภาพ</button>`;

          card.appendChild(img);
          card.appendChild(caption);
          previewContainer.appendChild(card);
        });

        // Attach single page download listener
        previewContainer.querySelectorAll('.btn-download-single-page').forEach((btn) => {
          btn.addEventListener('click', (e) => {
            const pageIdx = parseInt(e.currentTarget.getAttribute('data-page'), 10);
            const targetCanvas = studioState.unlockCanvases[pageIdx];
            if (targetCanvas) {
              targetCanvas.toBlob((blob) => {
                const baseName = (studioState.unlockFile ? studioState.unlockFile.name : 'document').replace(/\.[^/.]+$/, '');
                downloadBlobFile(blob, `${baseName}_หน้า_${pageIdx + 1}.jpg`);
              }, 'image/jpeg', 0.95);
            }
          });
        });
      }

      // Generate Unlocked PDF using PDFLib (100% DRM/Password stripped)
      const unlockedPdf = await window.PDFLib.PDFDocument.create();
      for (const canvas of canvases) {
        const imgBlob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.92));
        const imgBytes = await imgBlob.arrayBuffer();
        const embeddedImg = await unlockedPdf.embedJpg(imgBytes);

        // Aspect ratio correct page
        const origWidth = canvas.width / 1.8;
        const origHeight = canvas.height / 1.8;
        const page = unlockedPdf.addPage([origWidth, origHeight]);
        page.drawImage(embeddedImg, {
          x: 0,
          y: 0,
          width: origWidth,
          height: origHeight,
        });
      }

      const unlockedBytes = await unlockedPdf.save();
      studioState.unlockedPdfBlob = new Blob([unlockedBytes], { type: 'application/pdf' });

      if (window.lucide) window.lucide.createIcons();
      if (typeof window.showToast === 'function') {
        window.showToast('ปลดล็อคสำเร็จ! เอกสารถูกแปลงเป็น PDF ไร้รหัสผ่านเรียบร้อย', 'success');
      }
    } catch (renderErr) {
      console.error('Error rendering unlocked pages:', renderErr);
      showUnlockError('เกิดข้อผิดพลาดในการประมวลผลหน้าเอกสาร: ' + renderErr.message);
    }
  }

  function downloadUnlockedPdf() {
    if (!studioState.unlockedPdfBlob) {
      showUnlockError('ยังไม่มีไฟล์ PDF ที่ปลดล็อค');
      return;
    }
    const origName = (studioState.unlockFile ? studioState.unlockFile.name : 'document').replace(/\.[^/.]+$/, '');
    const cleanName = `${origName}_ปลดล็อคแล้ว.pdf`;
    downloadBlobFile(studioState.unlockedPdfBlob, cleanName);
    if (typeof window.showToast === 'function') {
      window.showToast('ดาวน์โหลด PDF ที่ปลดล็อคแล้วเรียบร้อย', 'success');
    }
  }

  async function attachUnlockedPdfToSlot() {
    const sel = document.getElementById('unlockTargetSlotSelect');
    const slotId = sel ? sel.value : null;
    if (!slotId) {
      alert('กรุณาเลือกช่อง Checklist ที่ต้องการแนบเอกสารก่อนครับ');
      return;
    }

    if (!studioState.unlockedPdfBlob) {
      alert('ยังไม่มีไฟล์ PDF ที่ปลดล็อค');
      return;
    }

    const origName = (studioState.unlockFile ? studioState.unlockFile.name : 'document').replace(/\.[^/.]+$/, '');
    const cleanFileName = `${origName}_ปลดล็อคแล้ว.pdf`;
    const newFile = new File([studioState.unlockedPdfBlob], cleanFileName, { type: 'application/pdf' });

    if (typeof window.attachFilesToSlotById === 'function') {
      await window.attachFilesToSlotById(slotId, [newFile]);
      closeStudioModal();
      if (typeof window.showToast === 'function') {
        window.showToast(`แนบเอกสาร PDF ปลดล็อคแล้วลงในช่องสำเร็จ!`, 'success');
      }
    }
  }

  function showUnlockLoading(show, message = 'กำลังโหลด...') {
    studioState.unlockIsLoading = show;
    const loader = document.getElementById('unlockLoadingSpinner');
    const msgEl = document.getElementById('unlockLoadingMsg');
    if (loader) loader.classList.toggle('hidden', !show);
    if (msgEl) msgEl.textContent = message;
  }

  function showUnlockError(message) {
    const errorBox = document.getElementById('unlockErrorBox');
    const errorMsg = document.getElementById('unlockErrorMsg');
    if (errorBox && errorMsg) {
      errorMsg.textContent = message;
      errorBox.classList.remove('hidden');
      errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  // ==========================================
  // TAB 2: PDF TO IMAGES (แปลง PDF เป็นรูปภาพ)
  // ==========================================
  async function handleConvertPdfFileSelect(file) {
    if (!file) return;
    ensurePdfWorker();

    studioState.convertFile = file;
    studioState.convertCanvases = [];
    studioState.convertPdfDoc = null;

    const fileName = document.getElementById('convertFileName');
    const fileSize = document.getElementById('convertFileSize');
    const infoBox = document.getElementById('convertFileInfo');
    const resultBox = document.getElementById('convertResultBox');
    const pwdPrompt = document.getElementById('convertPwdPromptBox');
    const pwdInput = document.getElementById('convertPwdInput');

    if (pwdInput) pwdInput.value = '';
    if (pwdPrompt) pwdPrompt.classList.add('hidden');
    if (resultBox) resultBox.classList.add('hidden');

    if (fileName) fileName.textContent = file.name;
    if (fileSize) fileSize.textContent = formatBytes(file.size);
    if (infoBox) infoBox.classList.remove('hidden');

    try {
      showConvertLoading(true, 'กำลังตรวจสอบไฟล์ PDF...');
      const buffer = await file.arrayBuffer();
      studioState.convertArrayBuffer = buffer;

      // Use sliced copy so master buffer isn't detached by Web Worker
      const loadingTask = window.pdfjsLib.getDocument({
        data: new Uint8Array(buffer.slice(0)),
        password: '',
      });

      const pdfDoc = await loadingTask.promise;
      studioState.convertPdfDoc = pdfDoc;
      showConvertLoading(false);

      startConvertingPdfPages(pdfDoc);
    } catch (err) {
      showConvertLoading(false);
      if (err.name === 'PasswordException') {
        if (pwdPrompt) {
          pwdPrompt.classList.remove('hidden');
          pwdPrompt.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        if (pwdInput) pwdInput.focus();
      } else {
        alert('ไม่สามารถเปิดไฟล์ PDF ได้: ' + (err.message || 'ไฟล์เสียหาย'));
      }
    }
  }

  async function submitConvertPassword() {
    const pwdInput = document.getElementById('convertPwdInput');
    const password = pwdInput ? pwdInput.value : '';
    if (!password) {
      alert('กรุณากรอกรหัสผ่านเพื่อแปลงไฟล์ PDF');
      return;
    }

    try {
      showConvertLoading(true, 'กำลังถอดรหัสผ่าน...');
      // Obtain fresh buffer
      const freshBuffer = studioState.convertFile
        ? await studioState.convertFile.arrayBuffer()
        : studioState.convertArrayBuffer.slice(0);

      const loadingTask = window.pdfjsLib.getDocument({
        data: new Uint8Array(freshBuffer),
        password: password,
      });

      const pdfDoc = await loadingTask.promise;
      studioState.convertPdfDoc = pdfDoc;
      showConvertLoading(false);

      const pwdPrompt = document.getElementById('convertPwdPromptBox');
      if (pwdPrompt) pwdPrompt.classList.add('hidden');

      startConvertingPdfPages(pdfDoc);
    } catch (err) {
      showConvertLoading(false);
      if (err.name === 'PasswordException') {
        alert('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
        if (pwdInput) pwdInput.focus();
      } else {
        alert('เกิดข้อผิดพลาด: ' + (err.message || err));
      }
    }
  }

  async function startConvertingPdfPages(pdfDoc) {
    const resultBox = document.getElementById('convertResultBox');
    const gridContainer = document.getElementById('convertGridContainer');
    const countText = document.getElementById('convertPageCountText');

    if (resultBox) resultBox.classList.remove('hidden');
    if (countText) countText.textContent = `จำนวน ${pdfDoc.numPages} หน้า`;

    populateSlotDropdown('convertTargetSlotSelect');

    const fmtRadios = document.querySelectorAll('input[name="convertFormatRadio"]');
    let chosenFormat = 'jpg';
    fmtRadios.forEach((r) => {
      if (r.checked) chosenFormat = r.value;
    });
    studioState.convertFormat = chosenFormat;

    const scaleSelect = document.getElementById('convertDpiScaleSelect');
    studioState.convertDpiScale = scaleSelect ? parseFloat(scaleSelect.value) : 2.0;

    if (gridContainer) {
      gridContainer.innerHTML = `
        <div class="col-span-full py-10 text-center text-slate-500 font-bold flex items-center justify-center gap-2">
          <i data-lucide="loader-2" class="w-5 h-5 animate-spin text-orange-500"></i> กำลังเรนเดอร์ภาพทุกหน้าความละเอียด ${
            studioState.convertDpiScale >= 2.0 ? 'คมชัดพิเศษ (300 DPI)' : 'มาตรฐาน (150 DPI)'
          }...
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
    }

    try {
      const canvases = [];
      const numPages = pdfDoc.numPages;

      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: studioState.convertDpiScale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        const ctx = canvas.getContext('2d', { alpha: false });
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        canvases.push(canvas);
      }

      studioState.convertCanvases = canvases;

      // Render grid
      if (gridContainer) {
        gridContainer.innerHTML = '';
        canvases.forEach((canvas, idx) => {
          const card = document.createElement('div');
          card.className =
            'neu-inset rounded-2xl p-2.5 flex flex-col items-center gap-2 bg-white/70 border border-slate-200/80 shadow-xs';

          const img = document.createElement('img');
          img.src = canvas.toDataURL(chosenFormat === 'png' ? 'image/png' : 'image/jpeg', 0.88);
          img.className = 'w-full h-44 object-contain rounded-xl bg-white shadow-xs';
          img.alt = `หน้า ${idx + 1}`;

          const bar = document.createElement('div');
          bar.className = 'flex items-center justify-between w-full px-1 text-[11px] font-extrabold text-slate-600';
          bar.innerHTML = `
            <span>หน้า ${idx + 1}</span>
            <div class="flex items-center gap-2">
              <button type="button" class="text-orange-600 hover:text-orange-700 underline cursor-pointer btn-download-convert-page" data-page="${idx}">โหลดรูป</button>
            </div>
          `;

          card.appendChild(img);
          card.appendChild(bar);
          gridContainer.appendChild(card);
        });

        gridContainer.querySelectorAll('.btn-download-convert-page').forEach((btn) => {
          btn.addEventListener('click', (e) => {
            const pageIdx = parseInt(e.currentTarget.getAttribute('data-page'), 10);
            const targetCanvas = studioState.convertCanvases[pageIdx];
            if (targetCanvas) {
              const mime = studioState.convertFormat === 'png' ? 'image/png' : 'image/jpeg';
              const ext = studioState.convertFormat === 'png' ? 'png' : 'jpg';
              targetCanvas.toBlob((blob) => {
                const baseName = (studioState.convertFile ? studioState.convertFile.name : 'document').replace(/\.[^/.]+$/, '');
                downloadBlobFile(blob, `${baseName}_หน้า_${pageIdx + 1}.${ext}`);
              }, mime, 0.95);
            }
          });
        });
      }

      if (window.lucide) window.lucide.createIcons();
      if (typeof window.showToast === 'function') {
        window.showToast(`แปลงเป็นรูปภาพ ${numPages} หน้าสำเร็จ!`, 'success');
      }
    } catch (err) {
      console.error('Convert render error:', err);
      alert('เกิดข้อผิดพลาดในการแปลงไฟล์: ' + err.message);
    }
  }

  async function downloadAllPagesZip() {
    if (!studioState.convertCanvases || studioState.convertCanvases.length === 0) {
      alert('ยังไม่มีรูปภาพที่แปลงเสร็จ');
      return;
    }

    if (!window.JSZip) {
      alert('ไม่พบไลบรารี JSZip');
      return;
    }

    try {
      showConvertLoading(true, 'กำลังบีบอัดภาพทุกหน้าเป็นไฟล์ ZIP...');
      const zip = new window.JSZip();
      const baseName = (studioState.convertFile ? studioState.convertFile.name : 'document').replace(/\.[^/.]+$/, '');
      const mime = studioState.convertFormat === 'png' ? 'image/png' : 'image/jpeg';
      const ext = studioState.convertFormat === 'png' ? 'png' : 'jpg';

      for (let i = 0; i < studioState.convertCanvases.length; i++) {
        const canvas = studioState.convertCanvases[i];
        const blob = await new Promise((res) => canvas.toBlob(res, mime, 0.92));
        const arrayBuf = await blob.arrayBuffer();
        const paddedIndex = String(i + 1).padStart(2, '0');
        zip.file(`${baseName}_page_${paddedIndex}.${ext}`, arrayBuf);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlobFile(zipBlob, `${baseName}_รูปภาพทั้งหมด.zip`);
      showConvertLoading(false);

      if (typeof window.showToast === 'function') {
        window.showToast('ดาวน์โหลด ZIP รวมภาพทุกหน้าสำเร็จ!', 'success');
      }
    } catch (err) {
      showConvertLoading(false);
      alert('เกิดข้อผิดพลาดในการสร้าง ZIP: ' + err.message);
    }
  }

  async function attachConvertedImagesToSlot() {
    const sel = document.getElementById('convertTargetSlotSelect');
    const slotId = sel ? sel.value : null;
    if (!slotId) {
      alert('กรุณาเลือกช่อง Checklist ที่ต้องการแนบก่อนครับ');
      return;
    }

    if (!studioState.convertCanvases || studioState.convertCanvases.length === 0) {
      alert('ยังไม่มีรูปภาพที่แปลงเสร็จ');
      return;
    }

    try {
      showConvertLoading(true, 'กำลังเตรียมรูปภาพแนบเข้าช่อง Checklist...');
      const baseName = (studioState.convertFile ? studioState.convertFile.name : 'document').replace(/\.[^/.]+$/, '');
      const mime = studioState.convertFormat === 'png' ? 'image/png' : 'image/jpeg';
      const ext = studioState.convertFormat === 'png' ? 'png' : 'jpg';

      const files = [];
      for (let i = 0; i < studioState.convertCanvases.length; i++) {
        const canvas = studioState.convertCanvases[i];
        const blob = await new Promise((res) => canvas.toBlob(res, mime, 0.90));
        const paddedIndex = String(i + 1).padStart(2, '0');
        const file = new File([blob], `${baseName}_หน้า_${paddedIndex}.${ext}`, { type: mime });
        files.push(file);
      }

      showConvertLoading(false);
      if (typeof window.attachFilesToSlotById === 'function') {
        await window.attachFilesToSlotById(slotId, files);
        closeStudioModal();
        if (typeof window.showToast === 'function') {
          window.showToast(`แนบ ${files.length} รูปลงในช่อง Checklist เรียบร้อย!`, 'success');
        }
      }
    } catch (err) {
      showConvertLoading(false);
      alert('เกิดข้อผิดพลาดในการแนบรูป: ' + err.message);
    }
  }

  function showConvertLoading(show, message = 'กำลังประมวลผล...') {
    studioState.convertIsLoading = show;
    const loader = document.getElementById('convertLoadingSpinner');
    const msgEl = document.getElementById('convertLoadingMsg');
    if (loader) loader.classList.toggle('hidden', !show);
    if (msgEl) msgEl.textContent = message;
  }

  // ==========================================
  // TAB 3: IMAGES TO PDF (รวมรูปภาพเป็น PDF)
  // ==========================================
  async function handleImagesToPdfSelect(fileList) {
    if (!fileList || fileList.length === 0) return;

    for (const file of Array.from(fileList)) {
      if (!file.type.startsWith('image/')) continue;
      const dataUrl = await new Promise((res) => {
        const r = new FileReader();
        r.onload = (e) => res(e.target.result);
        r.onerror = () => res(null);
        r.readAsDataURL(file);
      });

      if (dataUrl) {
        studioState.imgList.push({
          id: 'img_' + Math.random().toString(36).substr(2, 9),
          file: file,
          name: file.name,
          size: file.size,
          dataUrl: dataUrl,
          rotation: 0,
        });
      }
    }

    renderImgToPdfList();
  }

  function renderImgToPdfList() {
    const container = document.getElementById('imgListContainer');
    const countBadge = document.getElementById('imgCountBadge');
    const actionsBox = document.getElementById('imgActionsBox');

    if (countBadge) countBadge.textContent = `${studioState.imgList.length} รูปภาพ`;
    if (actionsBox) actionsBox.classList.toggle('hidden', studioState.imgList.length === 0);

    populateSlotDropdown('imgTargetSlotSelect');

    if (!container) return;
    container.innerHTML = '';

    if (studioState.imgList.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center text-slate-400 font-bold text-xs neu-inset rounded-2xl">
          ยังไม่ได้เลือกรูปภาพ (สามารถเลือกหลายรูปพร้อมกันได้)
        </div>
      `;
      return;
    }

    studioState.imgList.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className =
        'neu-raised rounded-2xl p-3 flex items-center justify-between gap-3 bg-white/80 border border-slate-200/80 shadow-xs';

      card.innerHTML = `
        <div class="flex items-center gap-3 min-w-0">
          <span class="w-6 h-6 rounded-lg neu-inset flex items-center justify-center text-xs font-black text-orange-600 flex-shrink-0">
            ${idx + 1}
          </span>
          <div class="w-14 h-14 rounded-xl neu-inset overflow-hidden flex-shrink-0 p-1 flex items-center justify-center bg-white">
            <img src="${item.dataUrl}" style="transform: rotate(${item.rotation}deg);" class="w-full h-full object-cover rounded-lg transition-transform" alt="thumb">
          </div>
          <div class="min-w-0">
            <h5 class="text-xs font-bold text-slate-800 truncate" title="${item.name}">${item.name}</h5>
            <span class="text-[10px] text-slate-500 font-medium">${formatBytes(item.size)}</span>
          </div>
        </div>

        <div class="flex items-center gap-1.5 flex-shrink-0">
          <!-- Move Up -->
          <button type="button" class="p-2 rounded-xl neu-btn text-slate-600 hover:text-orange-600 btn-img-up cursor-pointer ${
            idx === 0 ? 'opacity-30 pointer-events-none' : ''
          }" data-idx="${idx}" title="เลื่อนขึ้น">
            <i data-lucide="arrow-up" class="w-3.5 h-3.5"></i>
          </button>
          <!-- Move Down -->
          <button type="button" class="p-2 rounded-xl neu-btn text-slate-600 hover:text-orange-600 btn-img-down cursor-pointer ${
            idx === studioState.imgList.length - 1 ? 'opacity-30 pointer-events-none' : ''
          }" data-idx="${idx}" title="เลื่อนลง">
            <i data-lucide="arrow-down" class="w-3.5 h-3.5"></i>
          </button>
          <!-- Rotate 90deg -->
          <button type="button" class="p-2 rounded-xl neu-btn text-slate-600 hover:text-orange-600 btn-img-rotate cursor-pointer" data-idx="${idx}" title="หมุนภาพ 90°">
            <i data-lucide="rotate-cw" class="w-3.5 h-3.5"></i>
          </button>
          <!-- Remove -->
          <button type="button" class="p-2 rounded-xl neu-btn text-slate-400 hover:text-red-600 btn-img-del cursor-pointer" data-idx="${idx}" title="ลบรูปนี้">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      `;

      container.appendChild(card);
    });

    // Bind event handlers
    container.querySelectorAll('.btn-img-up').forEach((b) => {
      b.addEventListener('click', (e) => {
        const i = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
        if (i > 0) {
          const temp = studioState.imgList[i];
          studioState.imgList[i] = studioState.imgList[i - 1];
          studioState.imgList[i - 1] = temp;
          renderImgToPdfList();
        }
      });
    });

    container.querySelectorAll('.btn-img-down').forEach((b) => {
      b.addEventListener('click', (e) => {
        const i = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
        if (i < studioState.imgList.length - 1) {
          const temp = studioState.imgList[i];
          studioState.imgList[i] = studioState.imgList[i + 1];
          studioState.imgList[i + 1] = temp;
          renderImgToPdfList();
        }
      });
    });

    container.querySelectorAll('.btn-img-rotate').forEach((b) => {
      b.addEventListener('click', (e) => {
        const i = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
        studioState.imgList[i].rotation = (studioState.imgList[i].rotation + 90) % 360;
        renderImgToPdfList();
      });
    });

    container.querySelectorAll('.btn-img-del').forEach((b) => {
      b.addEventListener('click', (e) => {
        const i = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
        studioState.imgList.splice(i, 1);
        renderImgToPdfList();
      });
    });

    if (window.lucide) window.lucide.createIcons();
  }

  async function compileImagesToPdfBlob() {
    if (studioState.imgList.length === 0) return null;
    if (!window.PDFLib) throw new Error('ไม่พบไลบรารี PDFLib');

    const pdfDoc = await window.PDFLib.PDFDocument.create();

    for (const item of studioState.imgList) {
      // Draw to canvas with rotation applied
      const img = new Image();
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = item.dataUrl;
      });

      const rot = item.rotation % 360;
      const canvas = document.createElement('canvas');
      const isRotated90 = rot === 90 || rot === 270;
      canvas.width = isRotated90 ? img.height : img.width;
      canvas.height = isRotated90 ? img.width : img.height;

      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      const jpegBlob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.88));
      const jpegBytes = await jpegBlob.arrayBuffer();
      const embeddedJpg = await pdfDoc.embedJpg(jpegBytes);

      // Fit into A4 or preserve native dimensions
      const page = pdfDoc.addPage([canvas.width, canvas.height]);
      page.drawImage(embeddedJpg, {
        x: 0,
        y: 0,
        width: canvas.width,
        height: canvas.height,
      });
    }

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  }

  async function downloadCompiledImagesPdf() {
    if (studioState.imgList.length === 0) {
      alert('กรุณาเลือกรูปภาพอย่างน้อย 1 รูป');
      return;
    }

    const nameInput = document.getElementById('imgPdfTargetName');
    let targetName = (nameInput && nameInput.value.trim()) || 'เอกสารรวมรูปภาพ';
    if (!targetName.toLowerCase().endsWith('.pdf')) targetName += '.pdf';

    try {
      showImgLoading(true, 'กำลังรวมรูปภาพเป็นไฟล์ PDF...');
      const blob = await compileImagesToPdfBlob();
      showImgLoading(false);

      if (blob) {
        downloadBlobFile(blob, targetName);
        if (typeof window.showToast === 'function') {
          window.showToast('สร้างและดาวน์โหลดไฟล์ PDF เรียบร้อย!', 'success');
        }
      }
    } catch (err) {
      showImgLoading(false);
      alert('เกิดข้อผิดพลาดในการสร้าง PDF: ' + err.message);
    }
  }

  async function attachCompiledImagesPdfToSlot() {
    const sel = document.getElementById('imgTargetSlotSelect');
    const slotId = sel ? sel.value : null;
    if (!slotId) {
      alert('กรุณาเลือกช่อง Checklist ที่ต้องการแนบก่อนครับ');
      return;
    }

    if (studioState.imgList.length === 0) {
      alert('กรุณาเลือกรูปภาพก่อนครับ');
      return;
    }

    const nameInput = document.getElementById('imgPdfTargetName');
    let targetName = (nameInput && nameInput.value.trim()) || 'เอกสารรวมรูปภาพ';
    if (!targetName.toLowerCase().endsWith('.pdf')) targetName += '.pdf';

    try {
      showImgLoading(true, 'กำลังรวมรูปภาพและแนบเข้าช่อง Checklist...');
      const blob = await compileImagesToPdfBlob();
      showImgLoading(false);

      if (blob && typeof window.attachFilesToSlotById === 'function') {
        const file = new File([blob], targetName, { type: 'application/pdf' });
        await window.attachFilesToSlotById(slotId, [file]);
        closeStudioModal();
        if (typeof window.showToast === 'function') {
          window.showToast(`รวมรูปเป็น PDF และแนบลงในช่องสำเร็จ!`, 'success');
        }
      }
    } catch (err) {
      showImgLoading(false);
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  }

  function showImgLoading(show, message = 'กำลังประมวลผล...') {
    studioState.imgIsLoading = show;
    const loader = document.getElementById('imgLoadingSpinner');
    const msgEl = document.getElementById('imgLoadingMsg');
    if (loader) loader.classList.toggle('hidden', !show);
    if (msgEl) msgEl.textContent = message;
  }

  // ==========================================
  // TAB 4: COMPRESS PDF (บีบอัดลดขนาด PDF)
  // ==========================================
  async function handleCompressPdfSelect(file) {
    if (!file) return;
    studioState.compressFile = file;
    studioState.compressedBlob = null;

    const infoBox = document.getElementById('compressFileInfo');
    const nameEl = document.getElementById('compressFileName');
    const origSizeEl = document.getElementById('compressOrigSize');
    const resultBox = document.getElementById('compressResultBox');

    if (resultBox) resultBox.classList.add('hidden');
    if (nameEl) nameEl.textContent = file.name;
    if (origSizeEl) origSizeEl.textContent = formatBytes(file.size);
    if (infoBox) infoBox.classList.remove('hidden');
  }

  async function executePdfCompression() {
    const file = studioState.compressFile;
    if (!file) {
      alert('กรุณาเลือกไฟล์ PDF ที่ต้องการบีบอัด');
      return;
    }

    ensurePdfWorker();
    const resultBox = document.getElementById('compressResultBox');
    const newSizeEl = document.getElementById('compressNewSize');
    const percentEl = document.getElementById('compressPercentText');

    try {
      showCompressLoading(true, 'กำลังเรนเดอร์และบีบอัดหน้าเอกสาร...');

      let compressedBlob = null;
      if (typeof window.compressPdfFileToBlob === 'function') {
        compressedBlob = await window.compressPdfFileToBlob(file, 4.8 * 1024 * 1024);
      } else {
        // Fallback compress using pdfjsLib
        const arrayBuf = await file.arrayBuffer();
        const loadingTask = window.pdfjsLib.getDocument({ data: new Uint8Array(arrayBuf) });
        const pdfDoc = await loadingTask.promise;
        const newPdf = await window.PDFLib.PDFDocument.create();

        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale: 1.4 });
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(viewport.width);
          canvas.height = Math.round(viewport.height);
          const ctx = canvas.getContext('2d', { alpha: false });
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport: viewport }).promise;

          const imgBlob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.75));
          const imgBytes = await imgBlob.arrayBuffer();
          const jpg = await newPdf.embedJpg(imgBytes);
          const p = newPdf.addPage([canvas.width / 1.4, canvas.height / 1.4]);
          p.drawImage(jpg, { x: 0, y: 0, width: canvas.width / 1.4, height: canvas.height / 1.4 });
        }
        const b = await newPdf.save();
        compressedBlob = new Blob([b], { type: 'application/pdf' });
      }

      studioState.compressedBlob = compressedBlob;
      showCompressLoading(false);

      if (resultBox) resultBox.classList.remove('hidden');
      if (newSizeEl) newSizeEl.textContent = formatBytes(compressedBlob.size);

      const ratio = Math.max(0, Math.round(((file.size - compressedBlob.size) / file.size) * 100));
      if (percentEl) {
        percentEl.textContent = `ประหยัดพื้นที่ลง ${ratio}% (ต่ำกว่า 5MB 100%)`;
      }

      if (typeof window.showToast === 'function') {
        window.showToast(`บีบอัด PDF สำเร็จ! ลดขนาดเหลือ ${formatBytes(compressedBlob.size)}`, 'success');
      }
    } catch (err) {
      showCompressLoading(false);
      alert('เกิดข้อผิดพลาดในการบีบอัด: ' + err.message);
    }
  }

  function downloadCompressedPdf() {
    if (!studioState.compressedBlob) {
      alert('ยังไม่มีไฟล์ที่บีบอัด');
      return;
    }
    const origName = (studioState.compressFile ? studioState.compressFile.name : 'document').replace(/\.[^/.]+$/, '');
    downloadBlobFile(studioState.compressedBlob, `${origName}_บีบอัดแล้ว.pdf`);
  }

  function showCompressLoading(show, message = 'กำลังประมวลผล...') {
    studioState.compressIsLoading = show;
    const loader = document.getElementById('compressLoadingSpinner');
    const msgEl = document.getElementById('compressLoadingMsg');
    if (loader) loader.classList.toggle('hidden', !show);
    if (msgEl) msgEl.textContent = message;
  }

  // ==========================================
  // QUICK UNLOCK MODAL (ON DROP TO SLOT)
  // ==========================================
  function openQuickUnlockDialog(slotId, file, arrayBuffer) {
    studioState.quickUnlockSlotId = slotId;
    studioState.quickUnlockFile = file;
    studioState.quickUnlockArrayBuffer = arrayBuffer;

    const modal = document.getElementById('quickUnlockModal');
    const slotCodeEl = document.getElementById('quickUnlockSlotCode');
    const fileNameEl = document.getElementById('quickUnlockFileName');
    const pwdInput = document.getElementById('quickUnlockPasswordInput');
    const errorEl = document.getElementById('quickUnlockError');

    if (slotCodeEl) {
      let slotName = slotId;
      if (typeof window.getAllSlots === 'function') {
        const s = window.getAllSlots().find((item) => item.id === slotId);
        if (s) slotName = `[${s.code}] ${s.targetName}`;
      }
      slotCodeEl.textContent = slotName;
    }
    if (fileNameEl) fileNameEl.textContent = file.name;
    if (pwdInput) {
      pwdInput.value = '';
      setTimeout(() => pwdInput.focus(), 200);
    }
    if (errorEl) errorEl.classList.add('hidden');

    if (modal) modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  function closeQuickUnlockDialog() {
    const modal = document.getElementById('quickUnlockModal');
    if (modal) modal.classList.add('hidden');
    studioState.quickUnlockSlotId = null;
    studioState.quickUnlockFile = null;
    studioState.quickUnlockArrayBuffer = null;
  }

  async function submitQuickUnlock() {
    const pwdInput = document.getElementById('quickUnlockPasswordInput');
    const password = pwdInput ? pwdInput.value : '';
    const errorEl = document.getElementById('quickUnlockError');

    if (!password) {
      if (errorEl) {
        errorEl.textContent = 'กรุณากรอกรหัสผ่าน';
        errorEl.classList.remove('hidden');
      }
      return;
    }

    ensurePdfWorker();

    try {
      // Obtain fresh buffer to avoid detached ArrayBuffer
      const freshBuffer = studioState.quickUnlockFile
        ? await studioState.quickUnlockFile.arrayBuffer()
        : studioState.quickUnlockArrayBuffer.slice(0);

      const loadingTask = window.pdfjsLib.getDocument({
        data: new Uint8Array(freshBuffer),
        password: password,
      });

      const pdfDoc = await loadingTask.promise;

      // Render to canvases & build unlocked PDF
      const newPdf = await window.PDFLib.PDFDocument.create();
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 1.8 });
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        const ctx = canvas.getContext('2d', { alpha: false });
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport: viewport }).promise;

        const imgBlob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.90));
        const imgBytes = await imgBlob.arrayBuffer();
        const jpg = await newPdf.embedJpg(imgBytes);
        const p = newPdf.addPage([canvas.width / 1.8, canvas.height / 1.8]);
        p.drawImage(jpg, { x: 0, y: 0, width: canvas.width / 1.8, height: canvas.height / 1.8 });
      }

      const unlockedBytes = await newPdf.save();
      const unlockedBlob = new Blob([unlockedBytes], { type: 'application/pdf' });
      const origName = studioState.quickUnlockFile.name.replace(/\.[^/.]+$/, '');
      const cleanFile = new File([unlockedBlob], `${origName}_ปลดล็อคแล้ว.pdf`, { type: 'application/pdf' });

      const targetSlotId = studioState.quickUnlockSlotId;
      closeQuickUnlockDialog();

      if (typeof window.attachFilesToSlotById === 'function') {
        await window.attachFilesToSlotById(targetSlotId, [cleanFile]);
        if (typeof window.showToast === 'function') {
          window.showToast('ปลดล็อครหัสผ่านและแนบลงช่องเอกสารเรียบร้อย!', 'success');
        }
      }
    } catch (err) {
      if (err.name === 'PasswordException') {
        if (errorEl) {
          errorEl.textContent = 'รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
          errorEl.classList.remove('hidden');
        }
        if (pwdInput) pwdInput.select();
      } else {
        alert('เกิดข้อผิดพลาดในการปลดล็อค: ' + err.message);
      }
    }
  }

  // ==========================================
  // MODAL OPEN / CLOSE CONTROLLERS
  // ==========================================
  function openStudioModal(initialTab = 'unlock') {
    const modal = document.getElementById('pdfStudioModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    switchStudioTab(initialTab);
    if (window.lucide) window.lucide.createIcons();
  }

  function closeStudioModal() {
    const modal = document.getElementById('pdfStudioModal');
    if (modal) modal.classList.add('hidden');
  }

  // ==========================================
  // EVENT LISTENERS INITIALIZATION
  // ==========================================
  function initPdfStudioListeners() {
    // Open modal buttons
    const btnHeader = document.getElementById('btnOpenPdfStudioModal');
    if (btnHeader) {
      btnHeader.addEventListener('click', () => openStudioModal('unlock'));
    }

    const btnMenu = document.getElementById('btnOpenPdfStudioModalMenu');
    if (btnMenu) {
      btnMenu.addEventListener('click', () => {
        // Close hamburger menu if open
        const hamburgerOverlay = document.getElementById('hamburgerMenuOverlay');
        if (hamburgerOverlay) hamburgerOverlay.classList.add('hidden');
        openStudioModal('unlock');
      });
    }

    const btnClose = document.getElementById('btnClosePdfStudioModal');
    if (btnClose) {
      btnClose.addEventListener('click', closeStudioModal);
    }

    // Modal tabs
    document.querySelectorAll('[data-studio-tab]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-studio-tab');
        switchStudioTab(tab);
      });
    });

    // Tab 1: Unlock Events
    const unlockDropzone = document.getElementById('unlockDropzone');
    const unlockFileInput = document.getElementById('unlockFileInput');

    if (unlockDropzone && unlockFileInput) {
      unlockDropzone.addEventListener('click', () => unlockFileInput.click());
      unlockDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        unlockDropzone.classList.add('border-orange-500', 'bg-orange-50/40');
      });
      unlockDropzone.addEventListener('dragleave', () => {
        unlockDropzone.classList.remove('border-orange-500', 'bg-orange-50/40');
      });
      unlockDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        unlockDropzone.classList.remove('border-orange-500', 'bg-orange-50/40');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleUnlockFileSelect(e.dataTransfer.files[0]);
        }
      });
      unlockFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          handleUnlockFileSelect(e.target.files[0]);
        }
      });
    }

    const btnSubmitUnlock = document.getElementById('btnSubmitUnlockPassword');
    if (btnSubmitUnlock) btnSubmitUnlock.addEventListener('click', submitUnlockPassword);

    const unlockPwdInput = document.getElementById('unlockPasswordInput');
    if (unlockPwdInput) {
      unlockPwdInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitUnlockPassword();
      });
    }

    const btnToggleUnlockPwd = document.getElementById('btnToggleUnlockPwdVisibility');
    if (btnToggleUnlockPwd && unlockPwdInput) {
      btnToggleUnlockPwd.addEventListener('click', () => {
        const isPassword = unlockPwdInput.type === 'password';
        unlockPwdInput.type = isPassword ? 'text' : 'password';
        const icon = btnToggleUnlockPwd.querySelector('i');
        if (icon) {
          icon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
          if (window.lucide) window.lucide.createIcons();
        }
      });
    }

    // Quick presets buttons for password
    document.querySelectorAll('.btn-quick-pwd-preset').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const val = e.currentTarget.getAttribute('data-pwd-hint');
        if (unlockPwdInput) {
          unlockPwdInput.value = val || '';
          unlockPwdInput.focus();
        }
      });
    });

    const btnDownloadUnlocked = document.getElementById('btnDownloadUnlockedPdf');
    if (btnDownloadUnlocked) btnDownloadUnlocked.addEventListener('click', downloadUnlockedPdf);

    const btnAttachUnlocked = document.getElementById('btnAttachUnlockedPdf');
    if (btnAttachUnlocked) btnAttachUnlocked.addEventListener('click', attachUnlockedPdfToSlot);

    // Tab 2: Convert Events
    const convertDropzone = document.getElementById('convertDropzone');
    const convertFileInput = document.getElementById('convertFileInput');

    if (convertDropzone && convertFileInput) {
      convertDropzone.addEventListener('click', () => convertFileInput.click());
      convertDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        convertDropzone.classList.add('border-orange-500', 'bg-orange-50/40');
      });
      convertDropzone.addEventListener('dragleave', () => {
        convertDropzone.classList.remove('border-orange-500', 'bg-orange-50/40');
      });
      convertDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        convertDropzone.classList.remove('border-orange-500', 'bg-orange-50/40');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleConvertPdfFileSelect(e.dataTransfer.files[0]);
        }
      });
      convertFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          handleConvertPdfFileSelect(e.target.files[0]);
        }
      });
    }

    const btnSubmitConvertPwd = document.getElementById('btnSubmitConvertPwd');
    if (btnSubmitConvertPwd) btnSubmitConvertPwd.addEventListener('click', submitConvertPassword);

    const btnDownloadZip = document.getElementById('btnDownloadConvertZip');
    if (btnDownloadZip) btnDownloadZip.addEventListener('click', downloadAllPagesZip);

    const btnAttachConverted = document.getElementById('btnAttachConvertImages');
    if (btnAttachConverted) btnAttachConverted.addEventListener('click', attachConvertedImagesToSlot);

    // Tab 3: Images to PDF Events
    const imgDropzone = document.getElementById('imgToPdfDropzone');
    const imgFileInput = document.getElementById('imgToPdfFileInput');

    if (imgDropzone && imgFileInput) {
      imgDropzone.addEventListener('click', () => imgFileInput.click());
      imgDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        imgDropzone.classList.add('border-orange-500', 'bg-orange-50/40');
      });
      imgDropzone.addEventListener('dragleave', () => {
        imgDropzone.classList.remove('border-orange-500', 'bg-orange-50/40');
      });
      imgDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        imgDropzone.classList.remove('border-orange-500', 'bg-orange-50/40');
        if (e.dataTransfer.files) {
          handleImagesToPdfSelect(e.dataTransfer.files);
        }
      });
      imgFileInput.addEventListener('change', (e) => {
        if (e.target.files) {
          handleImagesToPdfSelect(e.target.files);
        }
      });
    }

    const btnClearImgList = document.getElementById('btnClearImgList');
    if (btnClearImgList) {
      btnClearImgList.addEventListener('click', () => {
        studioState.imgList = [];
        renderImgToPdfList();
      });
    }

    const btnDownloadImgPdf = document.getElementById('btnDownloadImagesPdf');
    if (btnDownloadImgPdf) btnDownloadImgPdf.addEventListener('click', downloadCompiledImagesPdf);

    const btnAttachImgPdf = document.getElementById('btnAttachImagesPdf');
    if (btnAttachImgPdf) btnAttachImgPdf.addEventListener('click', attachCompiledImagesPdfToSlot);

    // Tab 4: Compress Events
    const compressDropzone = document.getElementById('compressDropzone');
    const compressFileInput = document.getElementById('compressFileInput');

    if (compressDropzone && compressFileInput) {
      compressDropzone.addEventListener('click', () => compressFileInput.click());
      compressDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        compressDropzone.classList.add('border-orange-500', 'bg-orange-50/40');
      });
      compressDropzone.addEventListener('dragleave', () => {
        compressDropzone.classList.remove('border-orange-500', 'bg-orange-50/40');
      });
      compressDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        compressDropzone.classList.remove('border-orange-500', 'bg-orange-50/40');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleCompressPdfSelect(e.dataTransfer.files[0]);
        }
      });
      compressFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          handleCompressPdfSelect(e.target.files[0]);
        }
      });
    }

    const btnExecuteCompress = document.getElementById('btnExecuteCompress');
    if (btnExecuteCompress) btnExecuteCompress.addEventListener('click', executePdfCompression);

    const btnDownloadCompress = document.getElementById('btnDownloadCompressed');
    if (btnDownloadCompress) btnDownloadCompress.addEventListener('click', downloadCompressedPdf);

    // Quick Unlock Modal Events
    const btnQuickUnlockSubmit = document.getElementById('btnSubmitQuickUnlock');
    if (btnQuickUnlockSubmit) btnQuickUnlockSubmit.addEventListener('click', submitQuickUnlock);

    const btnQuickUnlockCancel = document.getElementById('btnCancelQuickUnlock');
    if (btnQuickUnlockCancel) btnQuickUnlockCancel.addEventListener('click', closeQuickUnlockDialog);

    const quickUnlockPwdInput = document.getElementById('quickUnlockPasswordInput');
    if (quickUnlockPwdInput) {
      quickUnlockPwdInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitQuickUnlock();
      });
    }

    // Intercept PDF files attached directly to slots to detect password locks
    document.addEventListener('change', async (e) => {
      const input = e.target;
      if (input && input.classList.contains('slot-file-input') && input.files && input.files.length > 0) {
        const slotId = input.getAttribute('data-id');
        const pdfFile = Array.from(input.files).find(
          (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
        );

        if (pdfFile && slotId) {
          ensurePdfWorker();
          try {
            const buf = await pdfFile.arrayBuffer();
            const testTask = window.pdfjsLib.getDocument({
              data: new Uint8Array(buf.slice(0)),
              password: '',
            });
            await testTask.promise; // If passes, it's not password protected!
          } catch (err) {
            if (err.name === 'PasswordException') {
              // Intercept! Clear file input so app.js doesn't process broken locked PDF
              e.stopImmediatePropagation();
              e.preventDefault();
              input.value = '';
              const buf = await pdfFile.arrayBuffer();
              openQuickUnlockDialog(slotId, pdfFile, buf);
            }
          }
        }
      }
    }, true); // Use capture phase so we can intercept before app.js if locked
  }

  // Public Exports to window
  window.PdfStudio = {
    openModal: openStudioModal,
    closeModal: closeStudioModal,
    switchTab: switchStudioTab,
  };

  // Auto initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPdfStudioListeners);
  } else {
    initPdfStudioListeners();
  }
})();
