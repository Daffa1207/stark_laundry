// Quick simulated interactive state handlers
  function toggleScanner(show) {
    const scanner = document.getElementById('scanner-viewfinder');
    if (show) {
      scanner.classList.remove('hidden');
    } else {
      scanner.classList.add('hidden');
      const video = document.getElementById('reward-scan-video');
      if (window.stopQrCamera && video) window.stopQrCamera(video);
    }
  }
  window.toggleScanner = toggleScanner;

  document.getElementById('btn-camera-trigger').addEventListener('click', function() {
    const scanner = document.getElementById('scanner-viewfinder');
    toggleScanner(true);
    const video = document.getElementById('reward-scan-video');
    const status = document.getElementById('reward-camera-status');
    if (window.startQrCamera) window.startQrCamera(video, status, code => {
      document.getElementById('manual-ticket-input').value = code.trim();
      status.textContent = 'QR terbaca. Tiket sedang diverifikasi…';
      document.getElementById('btn-confirm-redeem')?.click();
    });
  });

  function simulateCheckTicket() {
    const inputVal = document.getElementById('manual-ticket-input').value.trim();
    if (!inputVal) {
      alert('Silakan masukkan nomor tiket reward.');
      return;
    }
    showToast('Tiket ' + inputVal + ' berhasil ditemukan!');
    document.getElementById('live-ticket-result').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function confirmRedeemAction() {
    const btn = document.getElementById('btn-confirm-redeem');
    btn.innerHTML = '<span class="material-symbols-outlined text-[20px]">done_all</span><span>Hadiah Sudah Diserahkan</span>';
    btn.classList.remove('bg-secondary', 'hover:bg-on-secondary-container');
    btn.classList.add('bg-surface-container-high', 'text-on-surface', 'cursor-default');
    btn.disabled = true;

    showToast('Tiket RW-001245 diverifikasi! Status: Sudah Diambil');
  }

  function switchMainTab(tab) {
    const tabHistory = document.getElementById('tab-content-history');
    const tabCatalog = document.getElementById('tab-content-catalog');
    const btnHistory = document.getElementById('tab-btn-history');
    const btnCatalog = document.getElementById('tab-btn-catalog');

    if (tab === 'history') {
      tabHistory.classList.remove('hidden');
      tabCatalog.classList.add('hidden');
      btnHistory.className = 'px-space-lg py-space-sm font-label-lg text-label-lg rounded-xl bg-primary-container text-on-primary-container transition-all shadow-sm';
      btnCatalog.className = 'px-space-lg py-space-sm font-label-lg text-label-lg rounded-xl text-on-surface-variant hover:text-on-surface transition-all';
    } else {
      tabHistory.classList.add('hidden');
      tabCatalog.classList.remove('hidden');
      btnCatalog.className = 'px-space-lg py-space-sm font-label-lg text-label-lg rounded-xl bg-primary-container text-on-primary-container transition-all shadow-sm';
      btnHistory.className = 'px-space-lg py-space-sm font-label-lg text-label-lg rounded-xl text-on-surface-variant hover:text-on-surface transition-all';
    }
  }

  function filterStatus(status) {
    // Update button styles
    const buttons = document.querySelectorAll('.status-filter-btn');
    buttons.forEach(btn => {
      btn.className = 'status-filter-btn px-space-md py-1.5 rounded-full font-label-sm text-label-sm bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-semibold whitespace-nowrap';
    });
    event.target.className = 'status-filter-btn px-space-md py-1.5 rounded-full font-label-sm text-label-sm bg-primary text-on-primary font-bold shadow-xs whitespace-nowrap';

    // Filter table rows
    const rows = document.querySelectorAll('#history-table-body tr');
    rows.forEach(row => {
      const rowStatus = row.getAttribute('data-status');
      if (status === 'all' || rowStatus === status) {
        row.classList.remove('hidden');
      } else {
        row.classList.add('hidden');
      }
    });
  }

  function filterHistoryTable() {
    const query = document.getElementById('search-history-input').value.toLowerCase();
    const rows = document.querySelectorAll('#history-table-body tr');
    rows.forEach(row => {
      const text = row.innerText.toLowerCase();
      if (text.includes(query)) {
        row.classList.remove('hidden');
      } else {
        row.classList.add('hidden');
      }
    });
  }

  function selectTicketForValidation(id) {
    document.getElementById('manual-ticket-input').value = id;
    document.getElementById('live-ticket-result').scrollIntoView({ behavior: 'smooth' });
    showToast('Tiket ' + id + ' dipilih untuk divalidasi.');
  }

  function viewDetailsModal(id) {
    const modal = document.getElementById('action-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    const confirmBtn = document.getElementById('modal-confirm-btn');

    title.innerText = 'Riwayat Penukaran: ' + id;
    body.innerHTML = `
      <div class="p-3 bg-surface-container-low rounded-xl flex flex-col gap-2">
        <div class="flex justify-between text-body-sm">
          <span class="text-on-surface-variant">Kasir Pemeriksa:</span>
          <span class="font-bold text-on-surface">Siti Rahma (Counter 01)</span>
        </div>
        <div class="flex justify-between text-body-sm">
          <span class="text-on-surface-variant">Status Voucher:</span>
          <span class="font-bold text-secondary">Sudah Diserahkan Fisik</span>
        </div>
        <div class="flex justify-between text-body-sm">
          <span class="text-on-surface-variant">Catatan Kasir:</span>
          <span class="text-on-surface">Pelanggan menunjukkan tiket di ponsel dan menerima voucher fisik.</span>
        </div>
      </div>
    `;
    confirmBtn.innerText = 'Cetak Ulang Struk';
    confirmBtn.onclick = function() {
      showToast('Mencetak struk validasi ' + id);
      closeModal();
    };

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  function editRewardModal(name, points) {
    const modal = document.getElementById('action-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    const confirmBtn = document.getElementById('modal-confirm-btn');

    title.innerText = 'Edit Item: ' + name;
    body.innerHTML = `
      <div class="flex flex-col gap-3">
        <div>
          <label class="font-label-sm text-label-sm text-on-surface-variant block mb-1">Nama Hadiah</label>
          <input type="text" value="${name}" class="w-full h-11 px-3 bg-surface-container-low rounded-xl font-body-sm text-on-surface outline-none" />
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="font-label-sm text-label-sm text-on-surface-variant block mb-1">Jumlah Poin Diperlukan</label>
            <input type="number" value="${points}" class="w-full h-11 px-3 bg-surface-container-low rounded-xl font-body-sm text-on-surface outline-none" />
          </div>
          <div>
            <label class="font-label-sm text-label-sm text-on-surface-variant block mb-1">Status Aktivasi</label>
            <select class="w-full h-11 px-3 bg-surface-container-low rounded-xl font-body-sm text-on-surface outline-none">
              <option selected>Tersedia (Aktif)</option>
              <option>Nonaktifkan</option>
            </select>
          </div>
        </div>
      </div>
    `;
    confirmBtn.innerText = 'Simpan Katalog';
    confirmBtn.onclick = function() {
      showToast('Katalog reward berhasil diperbarui.');
      closeModal();
    };

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  function openAddRewardModal() {
    editRewardModal('Item Reward Baru', 100);
    document.getElementById('modal-title').innerText = 'Tambah Hadiah Baru ke Katalog';
  }

  function closeModal() {
    const modal = document.getElementById('action-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  function showToast(msg) {
    const toast = document.getElementById('toast-notification');
    const toastText = document.getElementById('toast-text');
    toastText.innerText = msg;
    toast.classList.remove('translate-y-20', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
  }

  function exportCSV() {
    showToast('Mengunduh data riwayat klaim reward...');
  }
