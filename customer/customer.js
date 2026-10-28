function openQrModal(id, service, rack, weight, price, payment) {
      document.getElementById('modalTicketId').innerText = 'QR Pengambilan — #' + id;
      document.getElementById('modalQrCodeText').innerText = 'Stark-PU-' + id.replace('-', '');
      document.getElementById('modalService').innerText = service;
      document.getElementById('modalRack').innerText = rack;
      document.getElementById('modalPayment').innerText = payment;
      const modal = document.getElementById('qrModal');
      modal.classList.remove('hidden');
    }

    function closeQrModal() {
      document.getElementById('qrModal').classList.add('hidden');
    }

    function openScanModal() {
      document.getElementById('scanModal').classList.remove('hidden');
      const video = document.getElementById('customer-scan-video');
      const placeholder = document.getElementById('customer-camera-placeholder');
      const status = document.getElementById('customer-camera-status');
      if (placeholder) placeholder.classList.add('hidden');
      if (window.startQrCamera) window.startQrCamera(video, status, code => {
        const input = document.getElementById('manualTicketInput');
        input.value = code.trim();
        status.textContent = 'QR berhasil dibaca. Periksa kode, lalu tekan Hubungkan.';
        input.focus();
      });
    }

    function closeScanModal() {
      document.getElementById('scanModal').classList.add('hidden');
      const video = document.getElementById('customer-scan-video');
      if (window.stopQrCamera && video) window.stopQrCamera(video);
    }

    function handleManualSubmit() {
      const input = document.getElementById('manualTicketInput');
      if (input.value.trim() !== '') {
        alert('Kode nota terbaca: ' + input.value.trim().toUpperCase() + '. Pastikan pesanan dibuat untuk akun yang sedang login.');
      } else {
        alert('Silakan masukkan nomor nota yang valid.');
      }
    }

    function toggleDetails(elementId) {
      const el = document.getElementById(elementId);
      const icon = document.getElementById(elementId + '-icon');
      const label = document.getElementById(elementId + '-label');
      
      if (el.classList.contains('hidden')) {
        el.classList.remove('hidden');
        if (icon) icon.classList.add('rotate-180');
        if (label) label.innerText = 'Sembunyikan';
      } else {
        el.classList.add('hidden');
        if (icon) icon.classList.remove('rotate-180');
        if (label) label.innerText = 'Cek Selengkapnya';
      }
    }

    // Client-side quick filter on cards
    document.getElementById('laundrySearchInput').addEventListener('input', function(e) {
      const query = e.target.value.toLowerCase();
      const cards = document.querySelectorAll('.grid.grid-cols-1.lg\\:grid-cols-12');
      cards.forEach(card => {
        const parentCard = card.closest('.relative.overflow-hidden');
        if (parentCard) {
          const text = parentCard.innerText.toLowerCase();
          if (text.includes(query)) {
            parentCard.style.display = 'block';
          } else {
            parentCard.style.display = 'none';
          }
        }
      });
    });

    // Close modals when clicking backdrop
    window.addEventListener('click', function(e) {
      const qrModal = document.getElementById('qrModal');
      const scanModal = document.getElementById('scanModal');
      if (e.target === qrModal) closeQrModal();
      if (e.target === scanModal) closeScanModal();
    });
