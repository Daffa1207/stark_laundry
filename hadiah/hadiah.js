let currentBalance = 120;
let pendingReward = null;
let toastTimer = null;

function showRewardToast(title, message, isError = false) {
  const toast = document.getElementById('toastNotification');
  const icon = toast?.querySelector('.material-symbols-outlined');
  if (!toast) return;

  document.getElementById('toastMsg').innerText = title;
  document.getElementById('toastDescription').innerText = message;
  if (icon) {
    icon.innerText = isError ? 'error' : 'check_circle';
    icon.classList.toggle('text-error', isError);
    icon.classList.toggle('text-secondary-fixed', !isError);
  }

  toast.classList.remove('hidden');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.add('hidden'), 4000);
}

function updateRewardAvailability() {
  document.querySelectorAll('[data-reward-card]').forEach((card) => {
    const button = card.querySelector('[data-reward-button]');
    const status = card.querySelector('[data-reward-status]');
    if (!button || !status) return;

    const cost = Number(button.dataset.rewardCost);
    const available = Number.isFinite(cost) && cost > 0 && currentBalance >= cost;
    const shortage = Math.max(0, cost - currentBalance);

    button.disabled = !available;
    button.className = available
      ? 'px-space-md py-space-sm rounded-lg bg-primary-container text-on-primary hover:bg-primary transition-colors font-label-md text-label-md shadow-sm inline-flex items-center gap-1'
      : 'px-space-md py-space-sm rounded-lg bg-surface-container-high text-outline cursor-not-allowed font-label-md text-label-md';
    if (button.dataset.rewardCategory === 'service') button.classList.add('whitespace-nowrap');
    button.innerHTML = available
      ? '<span>Tukar Hadiah</span><span class="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_forward</span>'
      : '<span>Poin Belum Cukup</span>';

    status.className = available
      ? 'inline-flex items-center gap-1 px-space-sm py-0.5 rounded-full bg-secondary-fixed/50 text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold'
      : 'inline-flex items-center gap-1 px-space-sm py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm';
    status.innerHTML = available
      ? '<span class="material-symbols-outlined text-[13px]" aria-hidden="true">check_circle</span>Poin Cukup'
      : `<span class="material-symbols-outlined text-[13px]" aria-hidden="true">lock</span>Kurang ${shortage} pts`;

    card.classList.toggle('opacity-95', !available);
    const price = card.querySelector('[data-reward-price]');
    if (price) {
      price.classList.toggle('text-primary', available);
      price.classList.toggle('text-outline', !available);
    }
  });
}

function updateBalanceDisplay() {
  document.getElementById('userPointsDisplay').innerText = currentBalance;
  document.getElementById('modalCurrentBalanceDisplay').innerText = currentBalance + ' pts';

  const target = 200;
  const percent = Math.min(100, Math.round((currentBalance / target) * 100));
  document.getElementById('pointsProgressLabel').innerText = `${currentBalance} / ${target} pts (${percent}%)`;
  document.getElementById('pointsProgressBar').style.width = percent + '%';

  const goalCopy = document.getElementById('pointsGoalCopy');
  if (currentBalance >= target) {
    goalCopy.innerHTML = 'Target voucher Rp25.000 sudah tercapai.';
  } else {
    const needed = target - currentBalance;
    goalCopy.innerHTML = `Kurang <strong class="text-on-surface font-semibold" id="pointsNeeded">${needed} pts</strong> lagi untuk membuka diskon Rp25.000 bebas minimum transaksi.`;
  }

  updateRewardAvailability();
}

window.setRewardBalance = function (balance) {
  currentBalance = Math.max(0, Number(balance) || 0);
  updateBalanceDisplay();
};
window.getPendingRewardCost = function () { return pendingReward?.cost ?? null; };

function openRedeemModal(rewardName, ptsCost, category) {
  const cost = Number(ptsCost);
  if (!Number.isInteger(cost) || cost <= 0) return;
  if (cost > currentBalance) {
    showRewardToast('Poin belum cukup', `Kamu masih kekurangan ${cost - currentBalance} poin untuk hadiah ini.`, true);
    return;
  }

  pendingReward = { name: rewardName, cost, category };
  document.getElementById('modalRewardTitle').innerText = rewardName;
  document.getElementById('modalPointsCost').innerText = cost + ' pts';
  document.getElementById('modalDeduction').innerText = '-' + cost + ' pts';
  document.getElementById('modalRemainingPoints').innerText = (currentBalance - cost) + ' pts';
  document.getElementById('modalCurrentBalanceDisplay').innerText = currentBalance + ' pts';
  document.getElementById('redeemConfirmModal').classList.remove('hidden');
}

function closeRedeemModal() {
  document.getElementById('redeemConfirmModal').classList.add('hidden');
  pendingReward = null;
}

function revealTicket() {
  document.getElementById('ticketEmptyState')?.classList.add('hidden');
  document.getElementById('ticketContent')?.classList.remove('hidden');
  const headerStatus = document.getElementById('ticketHeaderStatus');
  if (headerStatus) headerStatus.innerText = 'Siap Digunakan';
}

function executeRedemption() {
  if (!pendingReward) return;

  // Check again at confirmation time so the balance can never go below zero.
  if (pendingReward.cost > currentBalance) {
    const shortage = pendingReward.cost - currentBalance;
    closeRedeemModal();
    updateBalanceDisplay();
    showRewardToast('Poin belum cukup', `Kamu masih kekurangan ${shortage} poin untuk hadiah ini.`, true);
    return;
  }

  const redeemedReward = { ...pendingReward };
  currentBalance -= redeemedReward.cost;
  updateBalanceDisplay();

  const newId = 'RW-00' + Math.floor(1000 + Math.random() * 9000);
  const today = '13 Oktober 2026';
  document.getElementById('ticketCodeDisplay').innerText = newId;
  document.getElementById('ticketRewardName').innerText = redeemedReward.name;
  document.getElementById('ticketDate').innerText = today;
  document.getElementById('ticketStatus').innerText = 'Menunggu Diambil';
  revealTicket();

  closeRedeemModal();
  showRewardToast('Hadiah berhasil ditukar!', 'Tiket QR reward baru telah siap digunakan.');

  if (window.innerWidth < 1024) {
    document.getElementById('activeTicketCard').scrollIntoView({ behavior: 'smooth' });
  }
}

function showTicketDetail(code, name, cost, date, status) {
  document.getElementById('ticketCodeDisplay').innerText = code;
  document.getElementById('ticketRewardName').innerText = name;
  document.getElementById('ticketDate').innerText = date;
  document.getElementById('ticketStatus').innerText = status;
  revealTicket();

  const ticketBox = document.getElementById('activeTicketCard');
  ticketBox.classList.add('ring-2', 'ring-primary');
  ticketBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => ticketBox.classList.remove('ring-2', 'ring-primary'), 1200);
}

function showClaimReceipt(id, name, date, outlet) {
  alert(`BUKTI PENGAMBILAN RESMI\nNomor: ${id}\nHadiah: ${name}\nTanggal: ${date}\nLokasi: ${outlet}\nStatus: Telah diserahkan oleh kasir.`);
}

function printTicketMock() {
  const code = document.getElementById('ticketCodeDisplay').innerText;
  const name = document.getElementById('ticketRewardName').innerText;
  alert(`Tiket reward ${code} (${name}) siap disimpan / screenshot ke galeri ponsel Anda.`);
}

updateBalanceDisplay();
