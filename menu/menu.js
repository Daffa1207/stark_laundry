(() => {
  const serviceGrid = document.getElementById('serviceGrid');
  const searchInput = document.getElementById('searchInput');
  const filterPills = [...document.querySelectorAll('.filter-pill')];
  const serviceModal = document.getElementById('serviceModal');
  const serviceForm = document.getElementById('serviceForm');
  const modeToggle = document.getElementById('btnModeToggle');
  const addServiceButton = document.getElementById('btnOpenModal');
  const cart = new Map();
  let editingCard = null;
  let activeCategory = 'all';
  let nextServiceId = 1;

  const byId = (id) => document.getElementById(id);
  const cleanText = (value) => (value || '').replace(/\s+/g, ' ').trim();
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
  const formatRupiah = (amount) => `Rp${Number(amount || 0).toLocaleString('id-ID')}`;
  const parseRupiah = (value) => Number(String(value || '').replace(/\D/g, '')) || 0;
  const allServiceCards = () => [...serviceGrid.querySelectorAll('.service-card')];

  function categoryKey(category) {
    const value = String(category || '').toLowerCase();
    if (value.includes('dry')) return 'dryclean';
    if (value.includes('satuan')) return 'satuan';
    return 'kiloan';
  }

  function categoryLabel(category) {
    if (category === 'kiloan') return 'Kiloan';
    if (category === 'satuan') return 'Satuan';
    return 'Dry Clean';
  }

  function getCardAvailabilityBadge(card) {
    const row = card.querySelector('.flex.items-start.justify-between');
    return row?.querySelector('span.inline-flex.items-center') || null;
  }

  function readService(card) {
    const title = cleanText(card.querySelector('h3')?.textContent);
    const priceElement = card.querySelector('.font-display-lg');
    const price = parseRupiah(priceElement?.textContent);
    const unitElement = priceElement?.parentElement?.querySelector('.font-label-md');
    const metaRow = card.querySelector('.uppercase');
    const minLabel = [...card.querySelectorAll('span')].find((span) => cleanText(span.textContent) === 'Min. Order');
    const minValue = cleanText(minLabel?.parentElement?.querySelector('span:last-child')?.textContent) || '1 Item';
    const estimateClone = metaRow?.lastElementChild?.cloneNode(true);
    estimateClone?.querySelectorAll('.material-symbols-outlined').forEach((icon) => icon.remove());
    const toggleButton = card.querySelector('[data-menu-action="toggle"]') || card.lastElementChild?.querySelectorAll('button')[1];
    const available = !toggleButton?.textContent.toLowerCase().includes('aktifkan kembali');
    const data = {
      id: card.dataset.serviceId || `service-${nextServiceId++}`,
      name: title,
      category: cleanText(metaRow?.firstElementChild?.textContent) || 'Kiloan',
      categoryKey: card.dataset.category || 'kiloan',
      estimate: cleanText(estimateClone?.textContent).replace(/^schedule\s*/i, '') || '24 Jam',
      minimum: minValue,
      price,
      unit: cleanText(unitElement?.textContent) || '/ Kg',
      available
    };
    card.dataset.serviceId = data.id;
    card.dataset.price = String(data.price);
    card.dataset.unit = data.unit;
    card.dataset.minimum = data.minimum;
    card.dataset.available = String(data.available);
    card.dataset.name = `${data.name} ${data.category}`.toLowerCase();
    return data;
  }

  function setCardAvailability(card, available) {
    card.dataset.available = String(available);
    card.classList.toggle('is-unavailable', !available);
    const button = card.querySelector('[data-menu-action="toggle"]');
    const badge = getCardAvailabilityBadge(card);
    if (button) {
      button.textContent = available ? 'Nonaktifkan' : 'Aktifkan Kembali';
      button.className = available
        ? 'min-h-[40px] px-space-md bg-surface-container-low hover:bg-error-container text-on-surface-variant hover:text-on-error-container font-label-md text-label-md rounded-lg transition-colors flex items-center justify-center'
        : 'min-h-[40px] px-space-md bg-secondary-container hover:bg-secondary-fixed text-on-secondary-container font-label-md text-label-md rounded-lg transition-colors flex items-center justify-center';
    }
    if (badge) {
      badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full ${available ? 'bg-secondary' : 'bg-outline'}"></span> ${available ? 'Tersedia' : 'Tidak tersedia'}`;
      badge.className = `service-availability inline-flex items-center gap-1 px-space-xs py-0.5 rounded-full font-label-sm text-label-sm ${available ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-on-surface-variant'}`;
    }
    const addButton = card.querySelector('.pos-add-button');
    if (addButton) addButton.disabled = !available;
  }

  function makeActionButton(label, action, extraClass = '', loading = false) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.menuAction = action;
    button.className = extraClass;
    button.textContent = label;
    if (loading) button.setAttribute('data-stark-loading', '');
    return button;
  }

  function setupServiceCard(card) {
    const data = readService(card);
    const actionRow = card.lastElementChild;
    if (!actionRow) return;
    actionRow.classList.add('admin-card-actions');
    const oldButtons = [...actionRow.querySelectorAll('button')];
    const editButton = oldButtons[0];
    const toggleButton = oldButtons[1];

    if (editButton) {
      editButton.removeAttribute('onclick');
      editButton.dataset.menuAction = 'edit';
      editButton.addEventListener('click', () => openServiceModal(readService(card), card));
    }
    if (toggleButton) {
      toggleButton.removeAttribute('onclick');
      toggleButton.dataset.menuAction = 'toggle';
      toggleButton.setAttribute('data-stark-loading', '');
    toggleButton.addEventListener('click', async () => {
        const service = readService(card);
      if (card.dataset.databaseServiceId) {
        try {
          const response = await fetch('../api/admin/services.php', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle', id: card.dataset.databaseServiceId }) });
          const result = await response.json();
          if (!response.ok || !result.ok) throw new Error(result.message || 'Status layanan belum tersimpan.');
        } catch (error) { alert(error.message); return; }
      }
        setCardAvailability(card, !service.available);
        if (!service.available) cart.delete(service.id);
        renderCart();
        updateMenuCounts();
      });
    }

    let deleteButton = actionRow.querySelector('[data-menu-action="delete"]');
    if (!deleteButton) {
      deleteButton = makeActionButton('Hapus', 'delete', 'menu-delete-service', true);
      actionRow.appendChild(deleteButton);
      deleteButton.addEventListener('click', async () => {
        const service = readService(card);
        if (!window.confirm(`Hapus layanan "${service.name}" dari menu?`)) return;
        if (card.dataset.databaseServiceId) {
          try {
            const response = await fetch('../api/admin/services.php', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle', id: card.dataset.databaseServiceId }) });
            const result = await response.json();
            if (!response.ok || !result.ok) throw new Error(result.message || 'Layanan belum dapat dihapus.');
          } catch (error) { alert(error.message); return; }
        }
        cart.delete(service.id);
        card.remove();
        renderCart();
        applyFilters();
        updateMenuCounts();
      });
    }

    let addButton = card.querySelector('.pos-add-button');
    if (!addButton) {
      addButton = makeActionButton('Tambah ke Pesanan', 'add', 'pos-add-button');
      addButton.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">add</span><span>Tambah ke Pesanan</span>';
      actionRow.after(addButton);
      addButton.addEventListener('click', () => addServiceToCart(readService(card)));
    }
    addButton.disabled = !data.available;
    setCardAvailability(card, data.available);
  }

  function minimumQuantity(minimum) {
    const amount = Number.parseFloat(String(minimum).replace(',', '.'));
    return Number.isFinite(amount) && amount > 0 ? amount : 1;
  }

  function addServiceToCart(service) {
    if (!service.available) return;
    const existing = cart.get(service.id);
    if (existing) existing.quantity += 1;
    else cart.set(service.id, { ...service, quantity: minimumQuantity(service.minimum) });
    renderCart();
  }

  function quantityLabel(quantity, unit) {
    return `${quantity} ${unit.replace(/^\//, '').trim()}`;
  }

  function renderCart() {
    const lines = byId('posCartLines');
    const items = [...cart.values()];
    const empty = byId('cartEmptyState');
    lines.querySelectorAll('.pos-cart-line').forEach((line) => line.remove());
    empty.classList.toggle('hidden', items.length > 0);
    let total = 0;

    items.forEach((item) => {
      const lineTotal = item.price * item.quantity;
      total += lineTotal;
      const line = document.createElement('div');
      line.className = 'pos-cart-line';
      line.dataset.serviceId = item.id;
      line.innerHTML = `
        <div class="pos-cart-line-copy">
          <strong>${escapeHtml(item.name)}</strong>
          <small>${formatRupiah(item.price)} ${escapeHtml(item.unit)} · ${escapeHtml(quantityLabel(item.quantity, item.unit))}</small>
          <div class="pos-quantity-controls">
            <button type="button" data-cart-action="minus" aria-label="Kurangi ${escapeHtml(item.name)}">−</button>
            <span>${escapeHtml(item.quantity)}</span>
            <button type="button" data-cart-action="plus" aria-label="Tambah ${escapeHtml(item.name)}">+</button>
            <button type="button" data-cart-action="remove" aria-label="Hapus ${escapeHtml(item.name)} dari pesanan">×</button>
          </div>
        </div>
        <strong class="pos-cart-line-total">${formatRupiah(lineTotal)}</strong>`;
      lines.appendChild(line);
    });

    byId('posCartTotal').textContent = formatRupiah(total);
    byId('cartItemCount').textContent = `${items.length} layanan`;
    byId('btnCreateOrder').disabled = items.length === 0;
  }

  byId('posCartLines').addEventListener('click', (event) => {
    const button = event.target.closest('[data-cart-action]');
    if (!button) return;
    const line = button.closest('.pos-cart-line');
    const item = cart.get(line?.dataset.serviceId);
    if (!item) return;
    const action = button.dataset.cartAction;
    if (action === 'remove') cart.delete(item.id);
    else if (action === 'plus') item.quantity += 1;
    else if (action === 'minus') {
      const floor = minimumQuantity(item.minimum);
      if (item.quantity > floor) item.quantity -= 1;
      else cart.delete(item.id);
    }
    renderCart();
  });

  function applyFilters() {
    const query = cleanText(searchInput.value).toLowerCase();
    allServiceCards().forEach((card) => {
      const service = readService(card);
      const matchesCategory = activeCategory === 'all' || service.categoryKey === activeCategory;
      const matchesSearch = !query || card.dataset.name.includes(query);
      card.classList.toggle('hidden', !(matchesCategory && matchesSearch));
    });
  }

  function updateMenuCounts() {
    const cards = allServiceCards();
    const availableCount = cards.filter((card) => card.dataset.available !== 'false').length;
    byId('activeCountText').textContent = `${availableCount} Layanan Tersedia`;
    filterPills.forEach((pill) => {
      const category = pill.dataset.category;
      const count = category === 'all' ? cards.length : cards.filter((card) => card.dataset.category === category).length;
      const countLabel = pill.querySelector('span');
      if (countLabel) countLabel.textContent = `(${count})`;
    });
  }

  filterPills.forEach((pill) => pill.addEventListener('click', () => {
    filterPills.forEach((item) => {
      item.classList.remove('bg-primary-container', 'text-on-primary-container', 'font-semibold');
      item.classList.add('text-on-surface-variant');
    });
    pill.classList.add('bg-primary-container', 'text-on-primary-container', 'font-semibold');
    pill.classList.remove('text-on-surface-variant');
    activeCategory = pill.dataset.category;
    applyFilters();
  }));

  searchInput.addEventListener('input', applyFilters);

  function setAdminMode(isAdmin) {
    document.body.classList.toggle('menu-admin-mode', isAdmin);
    document.body.classList.toggle('menu-pos-mode', !isAdmin);
    byId('menuPageEyebrow').textContent = isAdmin ? 'ADMINISTRASI MENU' : 'LIVE POS WORKSPACE';
    byId('menuPageTitle').textContent = isAdmin ? 'Kelola Menu Layanan' : 'Kasir Laundry';
    byId('menuPageDescription').textContent = isAdmin
      ? 'Tambah, ubah, nonaktifkan, atau hapus layanan yang tersedia di Stark Laundry.'
      : 'Pilih layanan untuk menyusun pesanan baru dan membuat nota pelanggan.';
    byId('modeToggleText').textContent = isAdmin ? 'Kembali ke Kasir' : 'Admin Mode';
    byId('modeToggleIcon').textContent = isAdmin ? 'point_of_sale' : 'admin_panel_settings';
    modeToggle.setAttribute('aria-pressed', String(isAdmin));
  }

  modeToggle.addEventListener('click', () => setAdminMode(!document.body.classList.contains('menu-admin-mode')));

  function openServiceModal(service = null, card = null) {
    editingCard = card;
    byId('modalTitle').textContent = service ? 'Edit Menu Layanan' : 'Tambah Menu Layanan';
    byId('inputServiceName').value = service?.name || '';
    byId('inputCategory').value = service?.category || 'Kiloan';
    byId('inputUnit').value = service?.unit || '/ Kg';
    byId('inputPrice').value = service ? Number(service.price).toLocaleString('id-ID') : '';
    byId('inputEstimate').value = service?.estimate || '';
    byId('inputMinOrder').value = service?.minimum || '';
    byId('inputAvailable').checked = service ? service.available : true;
    byId('serviceForm').querySelector('[type="submit"]').textContent = service ? 'Simpan Perubahan' : 'Tambah Layanan';
    serviceModal.classList.remove('hidden');
    serviceModal.classList.add('flex');
  }

  function hideServiceModal() {
    serviceModal.classList.add('hidden');
    serviceModal.classList.remove('flex');
    editingCard = null;
  }

  addServiceButton.addEventListener('click', () => openServiceModal());
  byId('btnCloseModal').addEventListener('click', hideServiceModal);
  byId('btnCancelModal').addEventListener('click', hideServiceModal);
  serviceModal.addEventListener('click', (event) => { if (event.target === serviceModal) hideServiceModal(); });

  function serviceFromForm() {
    return {
      name: cleanText(byId('inputServiceName').value),
      category: byId('inputCategory').value,
      unit: byId('inputUnit').value,
      price: parseRupiah(byId('inputPrice').value),
      estimate: cleanText(byId('inputEstimate').value),
      minimum: cleanText(byId('inputMinOrder').value) || '1 Item',
      available: byId('inputAvailable').checked
    };
  }

  function createServiceCard(service) {
    serviceGrid.querySelector('.database-empty-state')?.remove();
    const card = document.createElement('article');
    const category = categoryLabel(service.category);
    card.className = 'service-card group flex flex-col justify-between bg-surface-container-lowest p-space-lg rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-all';
    card.dataset.category = categoryKey(service.category);
    card.dataset.serviceId = `service-${nextServiceId++}`;
    if (service.databaseId) card.dataset.databaseServiceId = String(service.databaseId);
    card.innerHTML = `
      <div class="flex flex-col">
        <div class="flex items-start justify-between gap-space-sm mb-space-md">
          <div class="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0"><span class="material-symbols-outlined text-[26px]">dry_cleaning</span></div>
          <span class="service-availability inline-flex items-center gap-1 px-space-xs py-0.5 rounded-full font-label-sm text-label-sm"><span class="w-1.5 h-1.5 rounded-full"></span></span>
        </div>
        <div class="service-meta flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider mb-1"><span>${escapeHtml(category)}</span><span>•</span><span><span class="material-symbols-outlined text-[14px]">schedule</span> ${escapeHtml(service.estimate)}</span></div>
        <h3 class="font-headline-sm text-headline-sm text-on-surface font-bold leading-snug">${escapeHtml(service.name)}</h3>
        <p class="font-body-sm text-body-sm text-on-surface-variant mt-space-xs leading-relaxed min-h-[48px]">Layanan profesional Stark Laundry dengan hasil bersih dan rapi.</p>
        <div class="mt-space-md pt-space-sm bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between"><span class="font-body-sm text-body-sm text-on-surface-variant">Min. Order</span><span class="font-label-md text-label-md text-on-surface font-semibold">${escapeHtml(service.minimum)}</span></div>
        <div class="mt-space-md flex items-baseline gap-1"><span class="font-display-lg text-display-lg text-primary font-bold tracking-tight">${formatRupiah(service.price)}</span><span class="font-label-md text-label-md text-on-surface-variant">${escapeHtml(service.unit)}</span></div>
      </div>
      <div class="admin-card-actions"></div>`;
    const actions = card.querySelector('.admin-card-actions');
    const editButton = makeActionButton('Edit Tarif', 'edit', 'admin-edit-service');
    const toggleButton = makeActionButton('Nonaktifkan', 'toggle', 'admin-toggle-service', true);
    const deleteButton = makeActionButton('Hapus', 'delete', 'menu-delete-service', true);
    actions.append(editButton, toggleButton, deleteButton);
    editButton.addEventListener('click', () => openServiceModal(readService(card), card));
    toggleButton.addEventListener('click', async () => {
      const data = readService(card);
      if (card.dataset.databaseServiceId) {
        try {
          const response = await fetch('../api/admin/services.php', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle', id: card.dataset.databaseServiceId }) });
          const result = await response.json();
          if (!response.ok || !result.ok) throw new Error(result.message || 'Status layanan belum tersimpan.');
        } catch (error) { alert(error.message); return; }
      }
      setCardAvailability(card, !data.available);
      if (data.available) cart.delete(data.id);
      renderCart();
      updateMenuCounts();
    });
    deleteButton.addEventListener('click', async () => {
      const data = readService(card);
      if (!window.confirm(`Hapus layanan "${data.name}" dari menu?`)) return;
      if (card.dataset.databaseServiceId) {
        try {
          const response = await fetch('../api/admin/services.php', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle', id: card.dataset.databaseServiceId }) });
          const result = await response.json();
          if (!response.ok || !result.ok) throw new Error(result.message || 'Layanan belum dapat dihapus.');
        } catch (error) { alert(error.message); return; }
      }
      cart.delete(data.id);
      card.remove();
      renderCart();
      applyFilters();
      updateMenuCounts();
    });
    const addButton = makeActionButton('Tambah ke Pesanan', 'add', 'pos-add-button');
    addButton.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">add</span><span>Tambah ke Pesanan</span>';
    card.appendChild(addButton);
    addButton.addEventListener('click', () => addServiceToCart(readService(card)));
    serviceGrid.appendChild(card);
    setCardAvailability(card, service.available);
    readService(card);
    return card;
  }

  window.handleFormSubmit = async function (event) {
    event.preventDefault();
    const service = serviceFromForm();
    if (!service.name || service.price <= 0 || !service.estimate) return;
    const editingId = editingCard?.dataset.databaseServiceId || null;
    try {
      const response = await fetch('../api/admin/services.php', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingId, name: service.name, category: service.category, unit: service.unit, price_per_unit: service.price, minimum_quantity: parseFloat(service.minimum) || 1, estimated_hours: parseInt(service.estimate, 10) || null }) });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.message || 'Layanan belum dapat disimpan.');
      service.databaseId = result.id;
    } catch (error) { alert(error.message); return; }
    if (editingCard) {
      const card = editingCard;
      card.dataset.databaseServiceId = String(service.databaseId || editingId);
      const metaRow = card.querySelector('.uppercase');
      const title = card.querySelector('h3');
      const priceElement = card.querySelector('.font-display-lg');
      const unitElement = priceElement?.parentElement?.querySelector('.font-label-md');
      const minLabel = [...card.querySelectorAll('span')].find((span) => cleanText(span.textContent) === 'Min. Order');
      if (title) title.textContent = service.name;
      if (metaRow?.firstElementChild) metaRow.firstElementChild.textContent = categoryLabel(service.category);
      if (metaRow?.lastElementChild) metaRow.lastElementChild.innerHTML = `<span class="material-symbols-outlined text-[14px]">schedule</span> ${escapeHtml(service.estimate)}`;
      if (priceElement) priceElement.textContent = formatRupiah(service.price);
      if (unitElement) unitElement.textContent = service.unit;
      if (minLabel?.parentElement?.querySelector('span:last-child')) minLabel.parentElement.querySelector('span:last-child').textContent = service.minimum;
      card.dataset.category = categoryKey(service.category);
      card.dataset.name = `${service.name} ${categoryLabel(service.category)}`.toLowerCase();
      readService(card);
      setCardAvailability(card, service.available);
      const cartItem = cart.get(card.dataset.serviceId);
      if (cartItem && service.available) Object.assign(cartItem, service);
      else if (!service.available) cart.delete(card.dataset.serviceId);
    } else {
      createServiceCard(service);
    }
    hideServiceModal();
    applyFilters();
    updateMenuCounts();
    renderCart();
  };

  function openReceipt(order) {
    byId('receiptOrderCode').textContent = order.id;
    const summary = byId('receiptSummary');
    summary.innerHTML = '';
    const rows = [
      ['Pelanggan', order.customer],
      ['WhatsApp', order.phone],
      ['Layanan', order.items.map((item) => `${item.quantity} ${item.unit.replace(/^\//, '').trim()} ${item.name}`).join(', ')],
      ['Pembayaran', order.payment],
      ['Total', formatRupiah(order.total)]
    ];
    rows.forEach(([label, value]) => {
      const row = document.createElement('div');
      row.className = 'receipt-summary-row';
      row.innerHTML = `<span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>`;
      summary.appendChild(row);
    });

    const qrContainer = byId('receiptQr');
    qrContainer.replaceChildren();
    qrContainer.classList.remove('receipt-qr-fallback');
    if (window.QRCode) {
      new window.QRCode(qrContainer, {
        text: order.qrToken || order.id,
        width: 176,
        height: 176,
        colorDark: '#102a43',
        colorLight: '#ffffff',
        correctLevel: window.QRCode.CorrectLevel.M
      });
    } else {
      qrContainer.textContent = order.id;
      qrContainer.classList.add('receipt-qr-fallback');
    }
    byId('orderReceiptModal').classList.remove('hidden');
    byId('orderReceiptModal').classList.add('flex');
  }

  byId('posCheckoutForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!cart.size) return;
    const items = [...cart.values()].map((item) => ({ ...item }));
    try {
      const paymentLabel = cleanText(byId('posPaymentMethod').value).toLowerCase();
      const paymentMethod = paymentLabel.includes('qris') ? 'qris' : paymentLabel.includes('transfer') ? 'transfer' : paymentLabel.includes('tunai') ? 'cash' : 'other';
      const response = await fetch('../api/admin/create-order.php', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customer_name: cleanText(byId('posCustomerName').value), customer_phone: cleanText(byId('posCustomerPhone').value), payment_method: paymentMethod, payment_status: 'unpaid', items: items.map(item => ({ service_id: item.id, quantity: item.quantity })) }) });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.message || 'Pesanan belum dapat disimpan.');
      items.receiptCode = result.order.receipt_code;
      items.qrToken = result.order.qr_token;
    } catch (error) { alert(error.message); return; }
    const order = {
      id: items.receiptCode || `LD-${String(Date.now()).slice(-7)}`,
      qrToken: items.qrToken,
      customer: cleanText(byId('posCustomerName').value),
      phone: cleanText(byId('posCustomerPhone').value),
      payment: byId('posPaymentMethod').value,
      items,
      total: items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    };
    openReceipt(order);
    cart.clear();
    renderCart();
    byId('posCheckoutForm').reset();
  });

  const receiptModal = byId('orderReceiptModal');
  const closeReceipt = () => { receiptModal.classList.add('hidden'); receiptModal.classList.remove('flex'); };
  byId('btnCloseReceipt').addEventListener('click', closeReceipt);
  byId('btnFinishReceipt').addEventListener('click', closeReceipt);
  receiptModal.addEventListener('click', (event) => { if (event.target === receiptModal) closeReceipt(); });
  byId('btnPrintReceipt').addEventListener('click', () => window.print());

  window.starkReadServiceCard = readService;
  window.starkAddServiceToCart = addServiceToCart;
  window.starkCreateServiceCard = createServiceCard;
  window.starkSetServiceAvailability = setCardAvailability;
  allServiceCards().forEach(setupServiceCard);
  setAdminMode(false);
  updateMenuCounts();
  renderCart();
})();
