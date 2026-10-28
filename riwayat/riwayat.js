// DOM Elements
  const searchInput = document.getElementById('searchInput');
  const clearSearch = document.getElementById('clearSearch');
  const filterPills = document.querySelectorAll('.filter-pill');
  const cards = document.querySelectorAll('.order-card');
  const cardsContainer = document.getElementById('cardsContainer');
  const noResults = document.getElementById('noResults');
  const detailModal = document.getElementById('detailModal');

  filterPills.forEach(pill => {
    pill.setAttribute('aria-pressed', String(pill.classList.contains('active')));
  });

  // Filter state
  let currentFilter = 'all';
  let searchQuery = '';

  function arrangeHistoryCardHeaders() {
    cards.forEach(card => {
      const header = card.firstElementChild;
      if (!header || header.classList.contains('history-order-header')) return;

      const mainGroup = header.children[0];
      const status = header.children[1];
      if (!mainGroup || !status) return;

      const icon = mainGroup.children[0];
      const details = mainGroup.children[1];
      const codeRow = details?.children[0];
      const title = details?.querySelector('h3');
      if (!icon || !details || !codeRow || !title) return;

      const points = codeRow.querySelector('span[class*="bg-secondary-container/40"]');
      if (points) codeRow.removeChild(points);

      header.className = 'history-order-header';
      mainGroup.className = 'history-order-main';
      details.classList.add('history-order-details');
      codeRow.classList.add('history-order-code');
      title.classList.add('history-order-title');

      const meta = document.createElement('div');
      meta.className = 'history-order-meta';
      if (points) meta.append(points);
      meta.append(status);

      header.append(meta);
    });
  }

  function updateCardFeedHeight(resetScroll = false) {
    if (!cardsContainer) return;

    const visibleCards = Array.from(cards).filter(card => !card.classList.contains('hidden'));
    const previousScrollTop = resetScroll ? 0 : cardsContainer.scrollTop;
    cardsContainer.style.maxHeight = '';
    cardsContainer.scrollTop = 0;

    if (visibleCards.length > 4) {
      const feedTop = cardsContainer.getBoundingClientRect().top;
      const fourthCardBottom = visibleCards[3].getBoundingClientRect().bottom;
      cardsContainer.style.maxHeight = `${Math.ceil(fourthCardBottom - feedTop)}px`;
    }

    const maxScrollTop = Math.max(0, cardsContainer.scrollHeight - cardsContainer.clientHeight);
    cardsContainer.scrollTop = Math.min(previousScrollTop, maxScrollTop);
  }

  function applyFilters() {
    let visibleCount = 0;
    const q = searchQuery.toLowerCase().trim();

    cards.forEach(card => {
      const id = card.getAttribute('data-id').toLowerCase();
      const title = card.getAttribute('data-title').toLowerCase();
      const category = card.getAttribute('data-category');

      const matchesSearch = id.includes(q) || title.includes(q);
      const matchesFilter = (currentFilter === 'all') || (category === currentFilter) || (currentFilter === 'selesai');

      if (matchesSearch && matchesFilter) {
        card.classList.remove('hidden');
        visibleCount++;
      } else {
        card.classList.add('hidden');
      }
    });

    if (visibleCount === 0) {
      noResults.classList.remove('hidden');
      noResults.classList.add('flex');
    } else {
      noResults.classList.add('hidden');
      noResults.classList.remove('flex');
    }

    requestAnimationFrame(() => updateCardFeedHeight(true));
  }

  // Search input handler
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    if (searchQuery.length > 0) {
      clearSearch.classList.remove('hidden');
    } else {
      clearSearch.classList.add('hidden');
    }
    applyFilters();
  });

  clearSearch.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearch.classList.add('hidden');
    applyFilters();
  });

  // Filter Pill clicks
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => {
        p.classList.remove('active', 'bg-primary-container', 'text-on-primary', 'shadow-sm');
        p.classList.add('bg-surface-container', 'text-on-surface-variant');
        p.setAttribute('aria-pressed', 'false');
      });

      pill.classList.add('active', 'bg-primary-container', 'text-on-primary', 'shadow-sm');
      pill.classList.remove('bg-surface-container', 'text-on-surface-variant');
      pill.setAttribute('aria-pressed', 'true');

      currentFilter = pill.getAttribute('data-filter');
      applyFilters();
    });
  });

  function resetFilters() {
    searchInput.value = '';
    searchQuery = '';
    clearSearch.classList.add('hidden');

    filterPills.forEach(p => {
      if (p.getAttribute('data-filter') === 'all') {
        p.classList.add('active', 'bg-primary-container', 'text-on-primary', 'shadow-sm');
        p.classList.remove('bg-surface-container', 'text-on-surface-variant');
        p.setAttribute('aria-pressed', 'true');
      } else {
        p.classList.remove('active', 'bg-primary-container', 'text-on-primary', 'shadow-sm');
        p.classList.add('bg-surface-container', 'text-on-surface-variant');
        p.setAttribute('aria-pressed', 'false');
      }
    });

    currentFilter = 'all';
    applyFilters();
  }

  // Modal open / close logic
  function openDetailModal(id) {
    const targetCard = document.querySelector(`.order-card[data-id="${id}"]`);
    if (!targetCard) return;

    document.getElementById('modalId').innerText = `#${targetCard.getAttribute('data-id')}`;
    document.getElementById('modalTitle').innerText = targetCard.getAttribute('data-title');
    document.getElementById('modalWeight').innerText = targetCard.getAttribute('data-weight');
    document.getElementById('modalItems').innerText = targetCard.getAttribute('data-items');
    document.getElementById('modalPrice').innerText = targetCard.getAttribute('data-price');
    document.getElementById('modalPayment').innerText = targetCard.getAttribute('data-payment');
    document.getElementById('modalPoints').innerText = targetCard.getAttribute('data-points');
    document.getElementById('modalDateIn').innerText = targetCard.getAttribute('data-date-in');
    document.getElementById('modalDateOut').innerText = targetCard.getAttribute('data-date-out');
    document.getElementById('modalOutlet').innerText = targetCard.getAttribute('data-outlet');
    document.getElementById('modalPerfume').innerText = targetCard.getAttribute('data-perfume');

    detailModal.classList.remove('opacity-0', 'pointer-events-none');
    detailModal.classList.add('opacity-100', 'pointer-events-auto');
    document.body.style.overflow = 'hidden';
  }

  function closeDetailModal() {
    detailModal.classList.remove('opacity-100', 'pointer-events-auto');
    detailModal.classList.add('opacity-0', 'pointer-events-none');
    document.body.style.overflow = '';
  }

  // Close modal on outside click
  detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) {
      closeDetailModal();
    }
  });

  // Simple alert simulation for download & print
  document.getElementById('downloadAllBtn').addEventListener('click', () => {
    alert('Mengunduh rekap riwayat transaksi dalam format PDF...');
  });

  function printReceiptMock() {
    window.print();
  }

  arrangeHistoryCardHeaders();
  requestAnimationFrame(updateCardFeedHeight);
  window.addEventListener('resize', () => requestAnimationFrame(updateCardFeedHeight));
  if (document.fonts?.ready) document.fonts.ready.then(updateCardFeedHeight);
