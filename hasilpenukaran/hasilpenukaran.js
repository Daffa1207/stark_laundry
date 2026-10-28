function openDetailModal(id, custName, custId, custPhone, rewardName, rewardCode, token, points, time, cashier, orders) {
    document.getElementById('modalRewardId').innerText = id;
    document.getElementById('modalCustomerName').innerText = custName;
    document.getElementById('modalCustomerId').innerText = custId;
    document.getElementById('modalCustomerPhone').innerText = custPhone;
    document.getElementById('modalRewardName').innerText = rewardName;
    document.getElementById('modalRewardCode').innerText = 'ID Hadiah: ' + rewardCode;
    document.getElementById('modalVoucherToken').innerText = token;
    document.getElementById('modalPoints').innerText = points;
    document.getElementById('modalTime').innerText = time;
    document.getElementById('modalCashier').innerText = cashier;
    document.getElementById('modalOrderStats').innerText = orders;

    const modal = document.getElementById('modalDetail');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  function closeDetailModal() {
    const modal = document.getElementById('modalDetail');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  function showToast(text) {
    const toast = document.getElementById('toastMessage');
    const toastText = document.getElementById('toastText');
    toastText.innerText = text;
    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => {
      toast.classList.add('translate-y-20', 'opacity-0');
    }, 2400);
  }

  function copyId(val) {
    navigator.clipboard.writeText(val).then(() => {
      showToast('ID ' + val + ' berhasil disalin!');
    }).catch(() => {
      showToast('ID ' + val + ' siap digunakan.');
    });
  }

  function copyToken() {
    const token = document.getElementById('modalVoucherToken').innerText;
    navigator.clipboard.writeText(token).then(() => {
      showToast('Kode voucher ' + token + ' disalin!');
    });
  }

  function printReceipt() {
    showToast('Mengirim perintah cetak ke Printer POS Bluetooth...');
  }

  function sendWhatsapp() {
    const phone = document.getElementById('modalCustomerPhone').innerText;
    showToast('Tautan WhatsApp disiapkan untuk: ' + phone);
  }

  // Filter pencarian tabel sederhana
  document.getElementById('searchInput')?.addEventListener('input', function(e) {
    const term = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('tbody tr');
    rows.forEach(row => {
      const text = row.innerText.toLowerCase();
      if (text.includes(term)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  });
