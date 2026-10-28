// Filter tabs logic
  const filterTabs = document.querySelectorAll('.filter-tab');
  const orderCards = document.querySelectorAll('.order-card');
  const searchInput = document.getElementById('search-input');

  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => {
        t.classList.remove('bg-primary-container', 'text-on-primary', 'font-semibold');
        t.classList.add('bg-surface-container-lowest', 'text-on-surface-variant');
      });
      tab.classList.remove('bg-surface-container-lowest', 'text-on-surface-variant');
      tab.classList.add('bg-primary-container', 'text-on-primary', 'font-semibold');

      const filterVal = tab.getAttribute('data-filter');
      orderCards.forEach(card => {
        const cardStatus = card.getAttribute('data-status');
        if (cardStatus !== 'selesai' && (filterVal === 'all' || cardStatus === filterVal)) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Search filter logic
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      orderCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (card.getAttribute('data-status') !== 'selesai' && text.includes(q)) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }

  // Drawer logic
  const backdrop = document.getElementById('drawer-backdrop');
  const drawer = document.getElementById('order-drawer');
  const btnCloseDrawer = document.getElementById('btn-close-drawer');
  const btnDrawerCancel = document.getElementById('btn-drawer-cancel');
  const btnDrawerComplete = document.getElementById('btn-drawer-complete');
  const drawerCompletionMessage = document.getElementById('drawer-completion-message');
  let currentActiveId = 'LD-104';
  let currentActiveCard = null;

  function openDetailDrawer(orderId, name, custId, phone, item, qty, price, payment, statusLabel, machine, stepIndex) {
    currentActiveId = orderId;
    currentActiveCard = getOrderCard(orderId);
    document.getElementById('drawer-order-id').innerText = '#' + orderId;
    document.getElementById('drawer-cust-name').innerText = name;
    document.getElementById('drawer-cust-id').innerText = custId;
    document.getElementById('drawer-cust-phone').innerText = phone;
    document.getElementById('drawer-item-title').innerText = item;
    document.getElementById('drawer-item-qty').innerText = qty;
    document.getElementById('drawer-total-price').innerText = price;
    document.getElementById('drawer-payment-method').innerText = payment;
    document.getElementById('drawer-machine-label').innerText = machine;
    document.getElementById('drawer-avatar').innerText = name.split(' ').map(n => n[0]).join('').substring(0, 2);
    document.getElementById('btn-print-nota').innerHTML = '<span class="material-symbols-outlined text-[18px]">print</span><span>Cetak Thermal Struk (#' + orderId + ')</span>';

    const canFinish = statusLabel.trim().toLowerCase() === 'siap diambil';
    btnDrawerComplete.disabled = !canFinish;
    drawerCompletionMessage.textContent = canFinish
      ? 'Pesanan sudah siap. Apakah cucian ini sudah diserahkan kembali kepada pelanggan?'
      : `Pesanan belum siap diserahkan (status: ${statusLabel}). Selesaikan proses cucian terlebih dahulu.`;

    // Update timeline steps visuals
    const steps = document.querySelectorAll('.timeline-step');
    steps.forEach((step, idx) => {
      const circle = step.querySelector('div:first-child');
      if (idx < stepIndex) {
        circle.className = 'w-6 h-6 rounded-full bg-secondary text-on-secondary flex items-center justify-center text-xs font-bold shrink-0';
        circle.innerHTML = '<span class="material-symbols-outlined text-[14px]">check</span>';
      } else if (idx === stepIndex) {
        circle.className = 'w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-xs font-bold shrink-0 animate-pulse';
        circle.innerHTML = '<span class="material-symbols-outlined text-[14px]">sync</span>';
      } else {
        circle.className = 'w-6 h-6 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center text-xs font-bold shrink-0';
        circle.innerText = idx + 1;
      }
    });

    backdrop.classList.remove('opacity-0', 'pointer-events-none');
    backdrop.classList.add('opacity-100');
    drawer.classList.remove('translate-x-full');
  }

  function closeDrawer() {
    backdrop.classList.add('opacity-0', 'pointer-events-none');
    backdrop.classList.remove('opacity-100');
    drawer.classList.add('translate-x-full');
  }

  if (btnCloseDrawer) btnCloseDrawer.addEventListener('click', closeDrawer);
  if (btnDrawerCancel) btnDrawerCancel.addEventListener('click', closeDrawer);
  if (backdrop) backdrop.addEventListener('click', closeDrawer);

  if (btnDrawerComplete) {
    btnDrawerComplete.addEventListener('click', () => {
      if (!currentActiveCard || currentActiveCard.getAttribute('data-status') !== 'siap') return;
      currentActiveCard.setAttribute('data-status', 'selesai');
      currentActiveCard.style.display = 'none';
      alert('Pesanan #' + currentActiveId + ' berhasil diselesaikan.');
      closeDrawer();
    });
  }

  function getOrderCard(orderId) {
    return Array.from(orderCards).find(card => {
      const detailButton = card.querySelector('button[onclick*="openDetailDrawer"]');
      return detailButton?.getAttribute('onclick')?.includes(`'${orderId}'`);
    }) || null;
  }

  // Quick Action: Update order status
  function updateOrderStatus(orderId, nextStatus) {
    alert('Status Pesanan #' + orderId + ' berhasil diperbarui menjadi: ' + nextStatus);
  }

  function verifyPickup(orderId) {
    const card = getOrderCard(orderId);
    const detailButton = card?.querySelector('button[onclick*="openDetailDrawer"]');
    if (detailButton) detailButton.click();
  }

  // Scanner modal logic
  const modalScan = document.getElementById('modal-scan');
  const btnScan = document.getElementById('btn-scan');
  const btnCloseScan = document.getElementById('btn-close-scan');
  const btnSubmitManual = document.getElementById('btn-submit-manual-scan');
  const manualScanInput = document.getElementById('input-manual-scan');
  const scanError = document.getElementById('scan-error');

  if (btnScan) {
    btnScan.addEventListener('click', () => {
      modalScan.classList.remove('hidden');
      modalScan.classList.add('flex');
      const video = document.getElementById('order-scan-video');
      const placeholder = document.getElementById('order-camera-placeholder');
      const status = document.getElementById('order-camera-status');
      if (placeholder) placeholder.classList.add('hidden');
      if (window.startQrCamera) window.startQrCamera(video, status, code => {
        manualScanInput.value = code.trim();
        status.textContent = 'QR terbaca. Nota sedang diperiksa…';
        btnSubmitManual?.click();
      });
    });
  }

  if (btnCloseScan) {
    btnCloseScan.addEventListener('click', () => {
      modalScan.classList.add('hidden');
      modalScan.classList.remove('flex');
      const video = document.getElementById('order-scan-video');
      if (window.stopQrCamera && video) window.stopQrCamera(video);
    });
  }

  if (btnSubmitManual) {
    btnSubmitManual.addEventListener('click', () => {
      let code = manualScanInput.value.trim().toUpperCase().replace(/^#/, '').replace(/\s+/g, '');
      const codeParts = code.match(/^LD-?(\d+)$/);
      if (codeParts) code = `LD-${codeParts[1]}`;

      const card = getOrderCard(code);
      const detailButton = card?.querySelector('button[onclick*="openDetailDrawer"]');
      if (!detailButton) {
        scanError.textContent = code
          ? `Nota ${code} tidak ditemukan pada daftar pesanan aktif. Periksa kembali nomor notanya.`
          : 'Masukkan nomor nota yang ingin dipindai.';
        scanError.classList.remove('hidden');
        return;
      }

      scanError.classList.add('hidden');
      modalScan.classList.add('hidden');
      modalScan.classList.remove('flex');
      manualScanInput.value = '';
      detailButton.click();
    });
  }

  if (manualScanInput) {
    manualScanInput.addEventListener('input', () => scanError.classList.add('hidden'));
    manualScanInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') btnSubmitManual.click();
    });
  }
