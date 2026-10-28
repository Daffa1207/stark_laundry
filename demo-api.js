/*
 * Front-end-only API simulation for the public GitHub Pages demo.
 * This is intentionally not authentication or storage for real customer data.
 */
(() => {
  const nativeFetch = window.fetch.bind(window);
  const storageKey = 'starkLaundryDemoData:v1';
  const rewardsSeed = [
    { id: 1, name: 'Voucher Laundry Rp10.000', description: 'Potongan Rp10.000 untuk transaksi laundry berikutnya.', category: 'voucher', point_cost: 100, is_active: 1 },
    { id: 2, name: 'Kantong Laundry Eksklusif Anti-Air', description: 'Kantong laundry praktis untuk membawa pakaian.', category: 'product', point_cost: 80, is_active: 1 },
    { id: 3, name: 'Voucher Laundry Rp25.000', description: 'Potongan Rp25.000 untuk transaksi laundry berikutnya.', category: 'voucher', point_cost: 200, is_active: 1 },
    { id: 4, name: 'Pewangi Laundry 250 ml', description: 'Pewangi pakaian pilihan untuk penggunaan di rumah.', category: 'product', point_cost: 150, is_active: 1 },
    { id: 5, name: 'Gratis Laundry Kiloan Maks. 4 Kg', description: 'Gratis satu layanan kiloan hingga 4 Kg.', category: 'service', point_cost: 300, is_active: 1 }
  ];
  const servicesSeed = [
    ['Cuci Lipat Reguler', 'kiloan', '/ Kg', 7000, 1, 48],
    ['Cuci Setrika Express', 'kiloan', '/ Kg', 12000, 1, 24],
    ['Cuci Kilat Super Express', 'kiloan', '/ Kg', 20000, 1, 8],
    ['Bed Cover & Selimut', 'satuan', '/ Pcs', 25000, 1, 48],
    ['Jas & Kemeja Formal', 'dry_clean', '/ Pcs', 30000, 1, 72],
    ['Karpet Tebal Ruang Tamu', 'satuan', '/ m²', 50000, 1, 120],
    ['Sepatu & Sneakers Premium', 'dry_clean', '/ Pasang', 35000, 1, 72],
    ['Gorden & Vitrase Lembut', 'satuan', '/ Kg', 18000, 1, 72]
  ].map((row, index) => ({ id: index + 1, name: row[0], category: row[1], unit: row[2], price_per_unit: row[3], minimum_quantity: row[4], estimated_hours: row[5], is_active: 1 }));

  const readStore = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (saved && Array.isArray(saved.orders) && Array.isArray(saved.services)) return saved;
    } catch (_) { /* Restore a clean demo store if local data is damaged. */ }
    const fresh = { nextOrderId: 1, nextServiceId: servicesSeed.length + 1, orders: [], services: servicesSeed, rewards: rewardsSeed, redemptions: [], pointLedger: [] };
    localStorage.setItem(storageKey, JSON.stringify(fresh));
    return fresh;
  };
  const writeStore = store => localStorage.setItem(storageKey, JSON.stringify(store));
  const currentUser = () => {
    try { return JSON.parse(sessionStorage.getItem('starkDemoSession') || 'null'); }
    catch (_) { return null; }
  };
  const makeResponse = (data, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
  const failed = (message, status = 422) => makeResponse({ ok: false, message }, status);
  const pointBalance = (store, userId) => store.pointLedger.filter(row => row.user_id === userId).reduce((sum, row) => sum + Number(row.points_delta), 0);
  const isoNow = () => new Date().toISOString().slice(0, 19).replace('T', ' ');
  const randomCode = prefix => `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const orderItems = order => order.items.map(item => `${item.service_name_snapshot} × ${item.quantity}`).join(', ');
  const normalizePhone = value => {
    let digits = String(value || '').replace(/\D/g, '');
    if (digits.startsWith('62')) digits = `0${digits.slice(2)}`;
    else if (digits.startsWith('8')) digits = `0${digits}`;
    return digits;
  };

  function customerDashboard(store, user) {
    const orders = store.orders.filter(order => Number(order.customer_id) === Number(user.id)).map(order => ({ ...order, items: orderItems(order) }));
    const redemptions = store.redemptions.filter(item => item.user_id === user.id);
    return {
      ok: true,
      user: { id: user.id, name: user.name, email: user.identifier, phone: user.phone },
      orders,
      points: pointBalance(store, user.id),
      point_history: store.pointLedger.filter(row => row.user_id === user.id).sort((a, b) => b.created_at.localeCompare(a.created_at)),
      rewards: store.rewards.filter(reward => Number(reward.is_active)),
      redemptions
    };
  }

  function adminDashboard(store, user) {
    const completed = store.orders.filter(order => order.status === 'completed').length;
    return {
      ok: true,
      admin: { id: user.id, name: user.name },
      orders: store.orders.map(order => ({ ...order, items: orderItems(order) })).sort((a, b) => b.created_at.localeCompare(a.created_at)),
      services: store.services,
      rewards: store.rewards,
      redemptions: store.redemptions,
      summary: {
        order_count: store.orders.length,
        active_count: store.orders.filter(order => ['new', 'processing', 'ready_for_pickup'].includes(order.status)).length,
        completed_count: completed
      }
    };
  }

  async function handleDemoApi(url, init, user) {
    const path = url.pathname.toLowerCase();
    const method = String(init?.method || 'GET').toUpperCase();
    let data = {};
    if (init?.body) {
      try { data = JSON.parse(init.body); } catch (_) { return failed('Data simulasi tidak terbaca.', 400); }
    }
    const store = readStore();

    if (path.endsWith('/api/auth/me.php')) return user ? makeResponse({ ok: true, user: { ...user, full_name: user.name } }) : failed('Silakan masuk kembali.', 401);
    if (path.endsWith('/api/auth/logout.php')) return makeResponse({ ok: true });
    if (path.endsWith('/api/customer/dashboard.php')) {
      if (user?.role !== 'customer') return failed('Masuk sebagai pelanggan untuk melihat halaman ini.', 403);
      return makeResponse(customerDashboard(store, user));
    }
    if (path.endsWith('/api/admin/dashboard.php')) {
      if (user?.role !== 'admin') return failed('Masuk sebagai Admin / Kasir untuk melihat halaman ini.', 403);
      return makeResponse(adminDashboard(store, user));
    }
    if (path.endsWith('/api/admin/services.php')) {
      if (user?.role !== 'admin') return failed('Aksi ini hanya tersedia untuk Admin / Kasir.', 403);
      if (method === 'GET') return makeResponse({ ok: true, services: store.services });
      if (data.action === 'toggle') {
        const service = store.services.find(item => item.id === Number(data.id));
        if (!service) return failed('Layanan tidak ditemukan.', 404);
        service.is_active = Number(service.is_active) ? 0 : 1;
        writeStore(store);
        return makeResponse({ ok: true, message: 'Status layanan demo diperbarui.' });
      }
      const name = String(data.name || '').trim();
      const price = Number(data.price_per_unit);
      const minimum = Number(data.minimum_quantity || 1);
      if (!name || !data.unit || !Number.isFinite(price) || price < 0 || !Number.isFinite(minimum) || minimum <= 0) return failed('Lengkapi nama, kategori, satuan, harga, dan jumlah minimum layanan.');
      let service = data.id ? store.services.find(item => item.id === Number(data.id)) : null;
      if (!service) {
        service = { id: store.nextServiceId++, is_active: 1 };
        store.services.push(service);
      }
      const categoryInput = String(data.category || '').toLowerCase();
      const category = categoryInput.includes('dry') ? 'dry_clean' : categoryInput.includes('satuan') ? 'satuan' : 'kiloan';
      Object.assign(service, { name, category, unit: data.unit, price_per_unit: price, minimum_quantity: minimum, estimated_hours: Number(data.estimated_hours) || null });
      writeStore(store);
      return makeResponse({ ok: true, message: 'Layanan demo berhasil disimpan.', id: service.id });
    }
    if (path.endsWith('/api/admin/create-order.php')) {
      if (user?.role !== 'admin') return failed('Aksi ini hanya tersedia untuk Admin / Kasir.', 403);
      const name = String(data.customer_name || '').trim();
      const phone = normalizePhone(data.customer_phone);
      if (!name || phone.length < 8 || !Array.isArray(data.items) || !data.items.length) return failed('Nama, nomor WhatsApp, dan minimal satu layanan wajib diisi.');
      const items = [];
      for (const item of data.items) {
        const service = store.services.find(row => row.id === Number(item.service_id) && Number(row.is_active));
        const quantity = Number(item.quantity);
        if (!service || !Number.isFinite(quantity) || quantity < Number(service.minimum_quantity)) return failed('Layanan tidak tersedia atau jumlah belum memenuhi minimum.');
        items.push({ service_id: service.id, service_name_snapshot: service.name, unit_snapshot: service.unit, quantity, unit_price: Number(service.price_per_unit), line_total: Number(service.price_per_unit) * quantity });
      }
      const total = items.reduce((sum, item) => sum + item.line_total, 0);
      const order = {
        id: store.nextOrderId++, receipt_code: randomCode('LD'), qr_token: randomCode('QR'), customer_id: phone === '081234567802' ? 2 : phone === '081234567801' ? 1 : null,
        customer_name: name, customer_phone: phone, status: 'new', payment_method: data.payment_method || 'cash', payment_status: data.payment_status || 'unpaid',
        subtotal: total, total, created_at: isoNow(), items
      };
      store.orders.unshift(order);
      writeStore(store);
      return makeResponse({ ok: true, message: 'Pesanan demo berhasil dibuat.', order: { id: order.id, receipt_code: order.receipt_code, qr_token: order.qr_token, customer_id: order.customer_id, customer_name: name, customer_phone: phone, status: order.status, total } });
    }
    if (path.endsWith('/api/admin/update-order-status.php')) {
      if (user?.role !== 'admin') return failed('Aksi ini hanya tersedia untuk Admin / Kasir.', 403);
      const order = store.orders.find(item => item.id === Number(data.order_id));
      const valid = ['new', 'processing', 'ready_for_pickup', 'completed', 'cancelled'];
      if (!order || !valid.includes(data.status)) return failed('Pesanan atau status tidak valid.', 404);
      if (['completed', 'cancelled'].includes(order.status) && order.status !== data.status) return failed('Pesanan yang sudah selesai atau dibatalkan tidak dapat diubah lagi.');
      const previous = order.status;
      order.status = data.status;
      if (data.status === 'ready_for_pickup') order.ready_at ||= isoNow();
      if (data.status === 'completed' && previous !== 'completed' && order.customer_id) {
        const points = Math.floor(Number(order.total) / 1000);
        if (points > 0 && !store.pointLedger.some(row => row.order_id === order.id)) store.pointLedger.push({ user_id: order.customer_id, order_id: order.id, event_type: 'earned', points_delta: points, note: 'Poin dari pesanan selesai', created_at: isoNow() });
      }
      writeStore(store);
      return makeResponse({ ok: true, message: 'Status pesanan demo diperbarui.', status: order.status });
    }
    if (path.endsWith('/api/admin/lookup-order.php')) {
      if (user?.role !== 'admin') return failed('Aksi ini hanya tersedia untuk Admin / Kasir.', 403);
      const code = String(data.code || '').trim().toUpperCase();
      const order = store.orders.find(item => item.receipt_code.toUpperCase() === code || item.qr_token.toUpperCase() === code);
      return order ? makeResponse({ ok: true, order: { ...order, items: orderItems(order) } }) : failed('Nota tidak ditemukan di data demo.', 404);
    }
    if (path.endsWith('/api/customer/order-token.php')) {
      if (user?.role !== 'customer') return failed('Masuk sebagai pelanggan untuk melihat QR pesanan.', 403);
      const code = String(data.receipt_code || '').trim().toUpperCase();
      const order = store.orders.find(item => item.receipt_code.toUpperCase() === code || item.qr_token.toUpperCase() === code);
      if (!order) return failed('Nota tidak ditemukan di simulasi ini.', 404);
      if (order.customer_id && Number(order.customer_id) !== Number(user.id)) return failed('Nota ini sudah terhubung ke akun customer lain.', 409);
      order.customer_id = Number(user.id);
      order.customer_name = user.name;
      order.customer_phone = normalizePhone(user.phone);
      writeStore(store);
      return makeResponse({ ok: true, qr_token: order.qr_token, message: 'Nota berhasil dihubungkan ke akun demo.' });
    }
    if (path.endsWith('/api/customer/redeem.php')) {
      if (user?.role !== 'customer') return failed('Masuk sebagai pelanggan untuk menukar hadiah.', 403);
      const reward = store.rewards.find(item => item.id === Number(data.reward_id) && Number(item.is_active));
      const balance = pointBalance(store, user.id);
      if (!reward) return failed('Hadiah tidak tersedia.');
      if (balance < Number(reward.point_cost)) return failed('Poin kamu belum cukup untuk menukar hadiah.');
      const code = randomCode('RW');
      const redemption = { id: store.redemptions.length + 1, code, user_id: user.id, reward_id: reward.id, reward_name: reward.name, reward_name_snapshot: reward.name, points_spent: Number(reward.point_cost), status: 'active', created_at: isoNow() };
      store.redemptions.unshift(redemption);
      store.pointLedger.push({ user_id: user.id, redemption_id: redemption.id, event_type: 'spent', points_delta: -redemption.points_spent, note: `Penukaran hadiah: ${reward.name}`, created_at: isoNow() });
      writeStore(store);
      return makeResponse({ ok: true, message: 'Hadiah demo berhasil ditukar.', redemption: { ...redemption, balance: balance - redemption.points_spent } });
    }
    if (path.endsWith('/api/admin/redeem.php')) {
      if (user?.role !== 'admin') return failed('Aksi ini hanya tersedia untuk Admin / Kasir.', 403);
      const redemption = store.redemptions.find(item => item.code.toUpperCase() === String(data.code || '').trim().toUpperCase());
      if (!redemption || redemption.status !== 'active') return failed('Tiket reward tidak ditemukan atau sudah diproses.');
      redemption.status = 'redeemed';
      redemption.redeemed_at = isoNow();
      writeStore(store);
      return makeResponse({ ok: true, message: 'Tiket demo berhasil dikonfirmasi.' });
    }
    return failed('Aksi demo ini belum disimulasikan.', 501);
  }

  window.fetch = async (input, init = {}) => {
    const user = currentUser();
    if (!user?.role) return nativeFetch(input, init);
    let url;
    try { url = new URL(input instanceof Request ? input.url : input, window.location.href); }
    catch (_) { return nativeFetch(input, init); }
    if (!url.pathname.toLowerCase().includes('/api/')) return nativeFetch(input, init);
    return handleDemoApi(url, init, user);
  };
})();
