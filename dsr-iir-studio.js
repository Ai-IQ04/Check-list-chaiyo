/**
 * DSR & IIR STUDIO INTEGRATION (Chaiyo Credit Studio ปกค035)
 * จัดการหน้าต่างโมดูลคำนวณ IIR / DSR และประเมินภาระหนี้
 */

(function () {
  'use strict';

  let isDsrIirLoaded = false;
  let isMaximized = false;

  // เปิดโมดอลคำนวณ DSR / IIR
  function openDsrIirModal() {
    const modal = document.getElementById('dsrIirModal');
    const iframe = document.getElementById('dsrIirIframe');
    if (!modal) return;

    // Lazy load iframe เมื่อเปิดครั้งแรก เพื่อประหยัดทรัพยากรเครื่อง
    if (iframe && !isDsrIirLoaded) {
      const targetSrc = iframe.getAttribute('data-src') || 'dsr-iir.html';
      iframe.src = targetSrc;
      isDsrIirLoaded = true;
    }

    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  // ปิดโมดอลคำนวณ DSR / IIR
  function closeDsrIirModal() {
    const modal = document.getElementById('dsrIirModal');
    if (!modal) return;

    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }

  // สลับขนาดหน้าต่าง (ขยายเต็มจอ / คืนค่าขนาดปกติ)
  function toggleMaximizeDsrIirModal() {
    const container = document.getElementById('dsrIirModalContainer');
    const maxIcon = document.getElementById('dsrIirMaxIcon');
    if (!container) return;

    isMaximized = !isMaximized;
    if (isMaximized) {
      container.classList.remove('max-w-7xl', 'h-[92vh]', 'rounded-3xl', 'my-auto');
      container.classList.add('w-full', 'h-full', 'rounded-none', 'm-0');
      if (maxIcon) maxIcon.setAttribute('data-lucide', 'minimize-2');
    } else {
      container.classList.add('max-w-7xl', 'h-[92vh]', 'rounded-3xl', 'my-auto');
      container.classList.remove('w-full', 'h-full', 'rounded-none', 'm-0');
      if (maxIcon) maxIcon.setAttribute('data-lucide', 'maximize-2');
    }

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  // ตั้งค่า Event Listeners
  function initDsrIirStudio() {
    // ปุ่มที่ Top Header Bar
    const btnHeader = document.getElementById('btnOpenDsrIirModal');
    if (btnHeader) {
      btnHeader.addEventListener('click', openDsrIirModal);
    }

    // ปุ่มใน Hamburger Side Menu
    const btnMenu = document.getElementById('btnOpenDsrIirModalMenu');
    if (btnMenu) {
      btnMenu.addEventListener('click', () => {
        // ปิด hamburger overlay ถ้าเปิดอยู่
        const hamburgerOverlay = document.getElementById('hamburgerMenuOverlay');
        if (hamburgerOverlay) {
          hamburgerOverlay.style.opacity = '0';
          const panel = document.getElementById('hamburgerMenuPanel');
          if (panel) {
            panel.classList.remove('translate-x-0');
            panel.classList.add('translate-x-full');
          }
          setTimeout(() => {
            hamburgerOverlay.classList.add('hidden');
          }, 250);
        }
        openDsrIirModal();
      });
    }

    // ปุ่มปิดหน้าต่าง
    const btnClose = document.getElementById('btnCloseDsrIirModal');
    if (btnClose) {
      btnClose.addEventListener('click', closeDsrIirModal);
    }

    // ปุ่มขยายเต็มจอ
    const btnToggleMax = document.getElementById('btnToggleMaxDsrIirModal');
    if (btnToggleMax) {
      btnToggleMax.addEventListener('click', toggleMaximizeDsrIirModal);
    }

    // ปิดเมื่อคลิกที่พื้นหลัง Overlay
    const modal = document.getElementById('dsrIirModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeDsrIirModal();
        }
      });
    }

    // ปิดเมื่อกดปุ่ม Escape (Esc)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
        closeDsrIirModal();
      }
    });

    // รับคำสั่ง postMessage จากภายใน iframe
    window.addEventListener('message', (event) => {
      if (event.data && event.data.action === 'closeDsrIirModal') {
        closeDsrIirModal();
      }
    });
  }

  // Expose ฟังก์ชันสู่ Global Scope
  window.DsrIirStudio = {
    open: openDsrIirModal,
    close: closeDsrIirModal,
    toggleMaximize: toggleMaximizeDsrIirModal
  };

  window.openDsrIirModal = openDsrIirModal;
  window.closeDsrIirModal = closeDsrIirModal;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDsrIirStudio);
  } else {
    initDsrIirStudio();
  }
})();
