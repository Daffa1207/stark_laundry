(() => {
  const path = location.pathname.toLowerCase();
  const isAdmin = /\/(menu|pesanan|riwayat-admin|penukaran|hasilpenukaran)\//.test(path);
  const endpoint = isAdmin ? '../api/admin/dashboard.php' : '../api/customer/dashboard.php';
  const money = value => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value) || 0);
  const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const date = value => value ? new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short'}).format(new Date(String(value).replace(' ','T'))) : '—';
  const empty = (title, detail) => `<div class="database-empty-state" style="padding:28px;text-align:center;border-radius:16px;background:#f2f5ff;color:#26334c"><strong>${safe(title)}</strong><p style="margin:6px 0 0;color:#59657a">${safe(detail)}</p></div>`;
  const banner = message => {
    let el = document.getElementById('databaseStatusNotice');
    if (!el) { el=document.createElement('div');el.id='databaseStatusNotice';el.style.cssText='margin:16px auto;padding:12px 16px;max-width:1100px;border-radius:12px;background:#fff1d6;color:#674500;font:500 14px/1.5 system-ui';document.querySelector('main')?.prepend(el); }
    el.textContent=message;
  };
  let demoSession = null;
  try {
    demoSession = JSON.parse(sessionStorage.getItem('starkDemoSession') || 'null');
  } catch (_) {
    sessionStorage.removeItem('starkDemoSession');
  }
  if (demoSession?.role) {
    banner(demoSession.role === 'admin'
      ? 'MODE DEMO: buat nota dengan nomor 081234567801 atau 081234567802 agar masuk ke akun customer demo. Data disimpan di browser ini saja.'
      : 'MODE DEMO: pesanan dan poin dimulai dari 0. Aktivitas demo disimpan di browser ini saja.');
    const notice = document.getElementById('databaseStatusNotice');
    if (notice) {
      notice.style.cssText += ';background:#eaf2ff;color:#174a91;border:1px solid #c9dcff;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap';
      const reset = document.createElement('button');
      reset.type = 'button';
      reset.textContent = 'Reset simulasi';
      reset.style.cssText = 'border:0;border-radius:8px;padding:7px 11px;background:#d5e5ff;color:#174a91;font:600 12px system-ui;cursor:pointer';
      reset.addEventListener('click', () => {
        if (!window.confirm('Hapus semua pesanan, poin, dan penukaran demo di browser ini?')) return;
        localStorage.removeItem('starkLaundryDemoData:v1');
        location.reload();
      });
      notice.append(reset);
    }
  }
  const showDatabaseFallback = () => {
    if (/\/riwayat\//.test(path)) { const box=document.getElementById('cardsContainer');if(box)box.innerHTML=empty('Memuat riwayat…','Mengambil data transaksi dari database.'); }
    if (/\/hadiah\//.test(path)) { const points=document.getElementById('userPointsDisplay');if(points)points.textContent='…';document.querySelectorAll('[data-reward-card]').forEach(card=>card.hidden=true); }
    if (/\/pesanan\//.test(path)) { const box=document.getElementById('order-cards-container');if(box)box.innerHTML=empty('Memuat pesanan…','Mengambil daftar pesanan dari database.'); }
    if (/\/menu\//.test(path)) document.querySelectorAll('#serviceGrid .service-card').forEach(card=>card.hidden=true);
    if (/\/riwayat-admin\//.test(path)) { const wrapper=document.querySelector('main')?.firstElementChild;if(wrapper)[...wrapper.children].slice(1).forEach(el=>el.hidden=true); }
    if (/\/hasilpenukaran\//.test(path)) { const wrapper=document.querySelector('main')?.firstElementChild;const content=wrapper?.children[1];if(content)[...content.children].slice(1).forEach(el=>el.hidden=true); }
    if (/\/penukaran\//.test(path)) { const tbody=document.getElementById('history-table-body');if(tbody)tbody.innerHTML='<tr><td colspan="6" style="padding:24px;text-align:center">Memuat data penukaran…</td></tr>';document.getElementById('live-ticket-result')?.classList.add('hidden'); }
    if (!/\/customer\//.test(path)) return;
    const search=document.getElementById('laundrySearchInput');
    const grid=search?.closest('.mb-space-md')?.nextElementSibling;
    if(grid)grid.hidden=true;
    if(search){let feed=document.getElementById('databaseCustomerOrders');if(!feed){feed=document.createElement('div');feed.id='databaseCustomerOrders';feed.style.cssText='display:grid;gap:12px;margin:14px 0';search.closest('div')?.insertAdjacentElement('afterend',feed);}feed.innerHTML=empty('Memuat pesanan…','Mengambil data pesanan dari akun kamu.');}
    document.querySelectorAll('main span').forEach(label=>{const text=label.textContent.trim().toLowerCase();if(text==='cucian sedang aktif'){const count=label.parentElement?.querySelectorAll('span')[1];if(count)count.textContent='Memuat…';const detail=label.parentElement?.querySelector('.truncate');if(detail)detail.textContent='Mengambil status pesanan';}if(text==='saldo poin reward'){const value=label.parentElement?.querySelectorAll('span')[1];if(value)value.textContent='Memuat…';}});
  };
  const statusName = value => ({new:'Pesanan Baru',processing:'Sedang Diproses',ready_for_pickup:'Siap Diambil',completed:'Selesai',cancelled:'Dibatalkan'})[value] || value;
  const card = order => `<article class="order-card" data-id="${safe(order.receipt_code)}" data-title="${safe(order.items||'Laundry')}" data-category="${order.type==='reward'?'reward':'laundry'}" data-status="${safe(order.status)}" style="padding:18px;border-radius:16px;background:#fff;box-shadow:0 1px 8px #102b5510;margin-bottom:12px"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><div><strong style="color:#1455c0">${safe(order.receipt_code||order.code)}</strong><h3 style="margin:5px 0">${safe(order.items||order.reward_name||'Pesanan laundry')}</h3><span>${safe(date(order.created_at))}</span></div><strong>${safe(statusName(order.status))}</strong></div><div style="margin-top:10px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><span>${safe(order.customer_name||'')} ${order.points_spent ? `• ${safe(order.points_spent)} poin` : ''}</span><strong>${order.total != null ? money(order.total) : ''}</strong></div></article>`;
  const updateName = user => {
    document.querySelectorAll('[data-user-name]').forEach(el => el.textContent=user.name||'Pelanggan');
    document.querySelectorAll('[data-user-first-name]').forEach(el => el.textContent=(user.name||'Pelanggan').trim().split(/\s+/)[0]);
  };
  const applyCustomerDashboard = data => {
    updateName(data.user);
    const active=data.orders.filter(o=>['new','processing','ready_for_pickup'].includes(o.status));
    document.querySelectorAll('main span').forEach(label=>{
      const text=label.textContent.trim().toLowerCase();
      if(text==='saldo poin reward'){const value=label.parentElement?.querySelectorAll('span')[1];if(value)value.textContent=`${Number(data.points||0).toLocaleString('id-ID')} Pts`;}
      if(text==='cucian sedang aktif'){const count=label.parentElement?.querySelectorAll('span')[1];if(count)count.textContent=`${active.length} Pesanan`;const detail=label.parentElement?.querySelector('.truncate');if(detail){const processing=active.filter(o=>['new','processing'].includes(o.status)).length,ready=active.filter(o=>o.status==='ready_for_pickup').length;detail.textContent=`${processing} Sedang Diproses • ${ready} Siap Diambil`;}}
    });
    document.querySelectorAll('main h2').forEach(heading=>{if(heading.textContent.trim()==='Daftar Cucian Berjalan'){const badge=heading.parentElement?.querySelector('span');if(badge)badge.textContent=`${active.length} Aktif`;}});
    document.querySelectorAll('main span').forEach(label=>{if(label.textContent.trim().toLowerCase()==='total laundry selesai'){const value=label.parentElement?.querySelector('.font-headline-md,.font-headline-lg');if(value)value.textContent=String(data.orders.filter(o=>o.status==='completed').length)+' Transaksi';}});
    const search=document.getElementById('laundrySearchInput');
    if(search){let feed=document.getElementById('databaseCustomerOrders');if(!feed){feed=document.createElement('div');feed.id='databaseCustomerOrders';feed.style.cssText='display:grid;gap:12px;margin:14px 0';search.closest('div')?.insertAdjacentElement('afterend',feed);}feed.hidden=false;feed.innerHTML=active.length?active.map(o=>`${card(o)}<button type="button" data-open-order-qr="${safe(o.receipt_code)}" style="margin:-8px 0 8px auto;padding:9px 14px;border:0;border-radius:9px;background:#e8eeff;color:#1455c0;font-weight:700">Tampilkan QR pesanan</button>`).join(''):empty('Belum ada pesanan aktif','Pesanan laundry akan tampil di sini setelah kasir membuat nota untuk akun ini.');feed.querySelectorAll('[data-open-order-qr]').forEach(button=>button.addEventListener('click',()=>window.openDatabaseOrderQr(button.dataset.openOrderQr)));search.addEventListener('input',()=>{const q=search.value.toLowerCase();feed.querySelectorAll('.order-card').forEach(el=>el.hidden=!el.textContent.toLowerCase().includes(q));});const sampleGrid=feed.parentElement?.nextElementSibling;if(sampleGrid?.querySelector('[onclick*="openQrModal"]'))sampleGrid.hidden=true;}
    // Remove the sample receipt cards so customer views only their account records.
    document.querySelectorAll('main [onclick*="openQrModal"]').forEach(button=>{let node=button;for(let i=0;i<7&&node.parentElement;i++,node=node.parentElement){if(/rounded-(xl|2xl)/.test(node.className||'')&&/shadow/.test(node.className||'')){node.hidden=true;break;}}});
    document.querySelectorAll('main [data-order-count]').forEach(el=>el.textContent=String(data.orders.length));
  };
  const applyHistory = data => {
    const box=document.getElementById('cardsContainer');if(!box)return;
    const records=[...data.orders.map(o=>({...o,type:'laundry'})),...data.redemptions.map(r=>({...r,receipt_code:r.code,type:'reward',status:r.status==='redeemed'?'redeemed':r.status,items:r.reward_name}))].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
    box.innerHTML=records.length?records.map(card).join(''):empty('Belum ada riwayat transaksi','Pesanan dan penukaran hadiah kamu akan muncul di sini setelah ada aktivitas.');
    box.style.maxHeight='';box.style.overflow='visible';window.updateCardFeedHeight=()=>{box.style.maxHeight='';box.style.overflow='visible';};
    const search=document.getElementById('searchInput');let filter='all';
    const apply=()=>{const q=(search?.value||'').toLowerCase();let n=0;box.querySelectorAll('.order-card').forEach(el=>{const category=el.dataset.category;const show=el.textContent.toLowerCase().includes(q)&&(filter==='all'||filter===category);el.hidden=!show;if(show)n++;});let note=box.querySelector('.database-empty-state');if(note)note.hidden=n>0;};
    search?.addEventListener('input',apply);
    document.querySelectorAll('.filter-pill').forEach(pill=>pill.addEventListener('click',()=>{filter=/reward|hadiah/i.test(pill.textContent)?'reward':/laundry/i.test(pill.textContent)?'laundry':'all';apply();}));
  };
  const applyRewards = data => {
    const balance=Number(data.points)||0;
    window.setRewardBalance?.(balance);
    const points=document.getElementById('userPointsDisplay');if(points)points.textContent=balance.toLocaleString('id-ID');
    const modalBalance=document.getElementById('modalCurrentBalanceDisplay');if(modalBalance)modalBalance.textContent=`${balance} pts`;
    const progress=document.getElementById('pointsProgressLabel');if(progress)progress.textContent=`${balance} / 200 pts (${Math.min(100,Math.round(balance/2))}%)`;
    const bar=document.getElementById('pointsProgressBar');if(bar)bar.style.width=`${Math.min(100,Math.round(balance/2))}%`;
    const goal=document.getElementById('pointsGoalCopy');if(goal)goal.textContent=balance>=200?'Target voucher Rp25.000 sudah tercapai.':`Kurang ${200-balance} poin lagi untuk membuka voucher Rp25.000.`;
    document.querySelectorAll('[data-reward-card]').forEach(el=>{const name=el.querySelector('h3')?.textContent?.trim()||el.querySelector('[data-reward-name]')?.textContent?.trim();const button=el.querySelector('[data-reward-button]');const actionName=button?.getAttribute('onclick')?.match(/openRedeemModal\('([^']+)'/)?.[1];const staticCost=Number(button?.dataset.rewardCost);const reward=data.rewards.find(r=>actionName&&r.name.toLowerCase()===actionName.toLowerCase())||data.rewards.find(r=>name&&(r.name.toLowerCase().includes(name.toLowerCase())||name.toLowerCase().includes(r.name.toLowerCase())))||data.rewards.find(r=>Number(r.point_cost)===staticCost);if(!reward||!button)return;el.hidden=false;button.dataset.rewardId=reward.id;button.dataset.rewardCost=reward.point_cost;button.disabled=balance<Number(reward.point_cost);});
    const ticket=data.redemptions.find(r=>r.status==='active');
    const emptyTicket=document.getElementById('ticketEmptyState'),content=document.getElementById('ticketContent');
    if(ticket&&emptyTicket&&content){emptyTicket.classList.add('hidden');content.classList.remove('hidden');document.getElementById('ticketCodeDisplay').textContent=ticket.code;document.getElementById('ticketRewardName').textContent=ticket.reward_name;document.getElementById('ticketDate').textContent=date(ticket.created_at);document.getElementById('ticketStatus').textContent='Menunggu Digunakan';}
    let ledger=document.getElementById('databasePointHistory');if(!ledger){ledger=document.createElement('section');ledger.id='databasePointHistory';ledger.style.cssText='margin:18px 0;padding:18px;border-radius:16px;background:#fff;box-shadow:0 2px 12px #102b5510';document.getElementById('earnPointsGuide')?.insertAdjacentElement('afterend',ledger);}
    ledger.innerHTML=`<h3 style="font-size:18px;font-weight:700;margin:0 0 10px">Riwayat Poin</h3>${data.point_history.length?data.point_history.map(entry=>`<div style="display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-top:1px solid #edf0f6"><span>${safe(entry.note||'Aktivitas poin')}<br><small>${safe(date(entry.created_at))}</small></span><strong style="color:${Number(entry.points_delta)<0?'#b42318':'#146c43'}">${Number(entry.points_delta)>0?'+':''}${safe(entry.points_delta)} pts</strong></div>`).join(''):empty('Belum ada poin','Poin akan tercatat setelah pesanan kamu selesai atau setelah penukaran hadiah.')}`;
    window.executeRedemption=async()=>{const title=document.getElementById('modalRewardTitle')?.textContent||'';const selected=data.rewards.find(r=>r.name===title)||data.rewards.find(r=>title.toLowerCase().includes(r.name.toLowerCase())||r.name.toLowerCase().includes(title.toLowerCase()))||data.rewards.find(r=>Number(r.point_cost)===Number(window.getPendingRewardCost?.()));if(!selected){alert('Pilih hadiah yang tersedia dari katalog.');return;}try{const response=await fetch('../api/customer/redeem.php',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({reward_id:selected.id})});const result=await response.json();if(!response.ok||!result.ok)throw new Error(result.message||'Penukaran gagal.');document.getElementById('redeemConfirmModal')?.classList.add('hidden');alert(`Hadiah berhasil ditukar. Kode tiket: ${result.redemption.code}`);location.reload();}catch(error){alert(error.message);}};
  };
  const applyAdminOrders = data => {
    const box=document.getElementById('order-cards-container');if(!box)return;
    box.innerHTML=data.orders.length?data.orders.map(o=>`<article class="order-card p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-space-md" data-status="${safe(o.status)}" data-order-id="${o.id}" style="padding:16px;border:1px solid #e6eaf3;border-radius:14px"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><div><strong style="color:#1455c0">${safe(o.receipt_code)}</strong><h3 style="margin:4px 0">${safe(o.customer_name)}</h3><span>${safe(o.customer_phone)} · ${safe(o.items||'Tanpa rincian item')}</span></div><div style="text-align:right"><strong>${money(o.total)}</strong><div>${safe(statusName(o.status))}</div></div></div><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><span>${safe(date(o.created_at))}</span><label style="display:flex;align-items:center;gap:8px">Ubah status <select data-order-status="${o.id}" data-prev="${safe(o.status)}" style="padding:8px;border:1px solid #ccd5e5;border-radius:8px"><option value="new" ${o.status==='new'?'selected':''}>Pesanan Baru</option><option value="processing" ${o.status==='processing'?'selected':''}>Diproses</option><option value="ready_for_pickup" ${o.status==='ready_for_pickup'?'selected':''}>Siap Diambil</option><option value="completed" ${o.status==='completed'?'selected':''}>Selesai</option><option value="cancelled" ${o.status==='cancelled'?'selected':''}>Dibatalkan</option></select></label></div></article>`).join(''):empty('Belum ada pesanan','Pesanan dari kasir akan tampil di sini setelah nota berhasil dibuat.');
    document.querySelectorAll('main span').forEach(label=>{const text=label.textContent.trim().toLowerCase();if(text==='aktif diproses'){const value=label.parentElement?.querySelector('.font-headline-lg,.font-headline-md');if(value)value.textContent=String(data.orders.filter(o=>['new','processing'].includes(o.status)).length);}if(text==='siap diambil'){const value=label.parentElement?.querySelector('.font-headline-lg,.font-headline-md');if(value)value.textContent=String(data.orders.filter(o=>o.status==='ready_for_pickup').length);}});
    box.querySelectorAll('[data-order-status]').forEach(select=>select.addEventListener('change',async()=>{const prev=select.dataset.prev||select.value;try{const r=await fetch('../api/admin/update-order-status.php',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({order_id:select.dataset.orderStatus,status:select.value})});const d=await r.json();if(!r.ok||!d.ok)throw new Error(d.message||'Status gagal disimpan.');select.dataset.prev=select.value;location.reload();}catch(e){alert(e.message);select.value=prev;}}));
    let activeFilter='all';const search=document.getElementById('search-input');
    const apply=()=>box.querySelectorAll('.order-card').forEach(el=>{const status=el.dataset.status;const q=(search?.value||'').toLowerCase();const matches=el.textContent.toLowerCase().includes(q);const statusMatch=activeFilter==='all'||activeFilter===status;el.hidden=!(matches&&statusMatch);});
    document.querySelectorAll('#status-filter-container [data-filter],#status-filter-container button').forEach(button=>button.addEventListener('click',()=>{const label=(button.dataset.filter||button.textContent).toLowerCase();activeFilter=label==='all'||label.includes('semua')?'all':label.includes('proses')||label.includes('cuci')?'processing':label.includes('siap')?'ready_for_pickup':label.includes('baru')||label.includes('menunggu')?'new':label.includes('selesai')?'completed':'all';apply();}));
    search?.addEventListener('input',apply);
    const scanButton=document.getElementById('btn-submit-manual-scan'),scanInput=document.getElementById('input-manual-scan'),scanError=document.getElementById('scan-error');
    scanButton?.addEventListener('click',async event=>{event.preventDefault();event.stopImmediatePropagation();const code=scanInput?.value.trim();if(!code){if(scanError){scanError.textContent='Masukkan kode nota atau pindai QR pesanan.';scanError.classList.remove('hidden');}return;}try{const response=await fetch('../api/admin/lookup-order.php',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({code})});const result=await response.json();if(!response.ok||!result.ok)throw new Error(result.message||'Nota belum ditemukan.');const o=result.order;document.getElementById('modal-scan')?.classList.add('hidden');document.getElementById('modal-scan')?.classList.remove('flex');const summary=`Nota ${o.receipt_code}\nPelanggan: ${o.customer_name}\nLayanan: ${o.items||'—'}\nTotal: ${money(o.total)}\nStatus: ${statusName(o.status)}`;if(o.status!=='ready_for_pickup'){alert(`${summary}\n\nPesanan belum siap diserahkan.`);return;}if(!window.confirm(`${summary}\n\nSelesaikan pesanan setelah cucian diserahkan ke pelanggan?`))return;const save=await fetch('../api/admin/update-order-status.php',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({order_id:o.id,status:'completed',note:'Diselesaikan setelah nota pengembalian diverifikasi'})});const saved=await save.json();if(!save.ok||!saved.ok)throw new Error(saved.message||'Status belum dapat disimpan.');alert('Pesanan berhasil diselesaikan dan poin pelanggan sudah diperbarui.');location.reload();}catch(error){if(scanError){scanError.textContent=error.message;scanError.classList.remove('hidden');}else alert(error.message);}},true);
  };
  const applyAdminCatalog = data => {
    if(!/\/menu\//.test(path))return;
    const grid=document.getElementById('serviceGrid');if(!grid)return;
    const existing=[...grid.querySelectorAll('.service-card')];
    if(!data.services.length){grid.innerHTML=empty('Belum ada layanan di database','Impor pembaruan database, lalu tambahkan layanan di menu Admin.');return;}
    const categoryLabel=category=>category==='kiloan'?'Kiloan':category==='satuan'?'Satuan':'Dry Clean';
    data.services.forEach((service,i)=>{let el=existing[i];if(!el&&window.starkCreateServiceCard)el=window.starkCreateServiceCard({name:service.name,category:service.category,estimate:`${service.estimated_hours||24} Jam`,minimum:`${service.minimum_quantity} ${service.unit.replace(/^\/\s*/, '')}`,price:Number(service.price_per_unit),unit:service.unit,available:Boolean(Number(service.is_active)),databaseId:service.id});if(!el)return;el.dataset.serviceId=String(service.id);el.dataset.databaseServiceId=String(service.id);el.dataset.category=service.category==='dry_clean'?'dryclean':service.category;el.dataset.name=service.name.toLowerCase();const title=el.querySelector('h3');if(title)title.textContent=service.name;const meta=el.querySelector('.uppercase');if(meta?.firstElementChild)meta.firstElementChild.textContent=categoryLabel(service.category);if(meta?.lastElementChild)meta.lastElementChild.textContent=`${service.estimated_hours||24} Jam`;const price=el.querySelector('.font-display-lg');if(price)price.textContent=money(service.price_per_unit);const unit=price?.parentElement?.querySelector('.font-label-md');if(unit)unit.textContent=service.unit;const labels=[...el.querySelectorAll('span')];const min=labels.find(s=>s.textContent.trim()==='Min. Order')?.parentElement?.querySelector('span:last-child');if(min)min.textContent=`${service.minimum_quantity} ${service.unit.replace(/^\/\s*/, '')}`;window.starkSetServiceAvailability?.(el,Boolean(Number(service.is_active)));});
    existing.slice(data.services.length).forEach(el=>el.hidden=true);
    const active=document.getElementById('activeCountText');if(active)active.textContent=`${data.services.filter(s=>Number(s.is_active)).length} Layanan Tersedia`;
  };
  const applyAdminHistory = data => {
    if(!/\/(riwayat-admin|hasilpenukaran)\//.test(path))return;
    const main=document.querySelector('main');if(!main)return;
    const wrapper=main.firstElementChild;
    if(/riwayat-admin/.test(path)&&wrapper){[...wrapper.children].slice(1).forEach(el=>el.hidden=true);}
    if(/hasilpenukaran/.test(path)&&wrapper){const content=wrapper.children[1];if(content)[...content.children].slice(1).forEach(el=>el.hidden=true);}
    const panel=document.createElement('section');panel.id='databaseAdminHistory';panel.style.cssText='max-width:1500px;margin:24px auto;padding:0 20px;width:100%';
    const records=[...data.orders.map(o=>({...o,record_type:'Pesanan'})),...data.redemptions.map(r=>({...r,receipt_code:r.code,items:r.reward_name,total:`${r.points_spent} poin`,status:r.status==='active'?'Menunggu Ditukar':r.status==='redeemed'?'Sudah Ditukar':'Dibatalkan',record_type:'Penukaran hadiah'}))].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
    panel.innerHTML=`<div style="padding:20px;border-radius:18px;background:#fff;box-shadow:0 4px 18px #1a376018"><h2 style="font-size:20px;font-weight:700;margin:0 0 14px">${/hasilpenukaran/.test(path)?'Data Penukaran Hadiah':'Riwayat Transaksi Database'}</h2>${records.length?records.map(r=>{const amount=typeof r.total==='number'?money(r.total):(r.total??'');return `<article style="padding:14px 0;border-top:1px solid #e9edf5;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap"><div><strong>${safe(r.receipt_code||'')}</strong><div>${safe(r.customer_name||'Pelanggan')} · ${safe(r.record_type)}</div><small>${safe(r.items||'')} · ${safe(date(r.created_at))}</small></div><strong>${safe(r.status)}${amount?` · ${safe(amount)}`:''}</strong></article>`;}).join(''):empty('Belum ada riwayat','Transaksi dan penukaran dari database akan tampil di sini.')}</div>`;
    main.append(panel);
  };
  const applyAdminRedemption = data => {
    if(!/\/penukaran\//.test(path))return;
    const tbody=document.getElementById('history-table-body');if(tbody){tbody.innerHTML=data.redemptions.length?data.redemptions.map(r=>`<tr><td>${safe(r.code)}</td><td>${safe(r.customer_name)}</td><td>${safe(r.reward_name_snapshot||r.reward_name)}</td><td>${safe(r.points_spent)} pts</td><td>${safe(r.status==='active'?'Menunggu Ditukar':r.status==='redeemed'?'Sudah Ditukar':'Dibatalkan')}</td><td>${safe(date(r.created_at))}</td></tr>`).join(''):`<tr><td colspan="6" style="padding:24px;text-align:center">Belum ada penukaran hadiah.</td></tr>`;}
    const catalog=document.getElementById('tab-content-catalog');if(catalog)catalog.innerHTML=data.rewards.length?`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">${data.rewards.map(r=>`<article style="padding:16px;border-radius:14px;background:#fff;border:1px solid #e7ebf4"><strong>${safe(r.name)}</strong><p style="color:#657087;min-height:40px">${safe(r.description)}</p><div style="display:flex;justify-content:space-between"><b>${safe(r.point_cost)} poin</b><span>${Number(r.is_active)?'Aktif':'Nonaktif'}</span></div></article>`).join('')}</div>`:empty('Katalog hadiah masih kosong','Tambahkan hadiah di database untuk mulai menerima penukaran.');
    const scanResult=document.getElementById('live-ticket-result');if(scanResult)scanResult.classList.add('hidden');
    const input=document.getElementById('manual-ticket-input'),confirmButton=document.getElementById('btn-confirm-redeem');if(input)input.value='';
    confirmButton?.addEventListener('click',async event=>{event.preventDefault();event.stopImmediatePropagation();const code=input?.value?.trim();if(!code)return;try{const response=await fetch('../api/admin/redeem.php',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({code})});const result=await response.json();if(!response.ok||!result.ok)throw new Error(result.message||'Tiket belum dapat diproses.');alert(result.message);location.reload();}catch(error){alert(error.message);}},true);
  };
  window.openDatabaseOrderQr = async code => {
    try {
      const response=await fetch('../api/customer/order-token.php',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({receipt_code:code})});
      const result=await response.json();if(!response.ok||!result.ok)throw new Error(result.message||'QR pesanan belum dapat dimuat.');
      const modal=document.getElementById('qrModal');if(!modal)throw new Error('Tampilan QR tidak ditemukan.');
      document.getElementById('modalTicketId').textContent=`QR Pengambilan — ${code}`;
      const text=document.getElementById('modalQrCodeText');text.textContent=code;
      const host=text.parentElement;let qr=document.getElementById('database-order-qr');if(!qr){qr=document.createElement('div');qr.id='database-order-qr';qr.style.cssText='display:flex;justify-content:center;margin:10px auto';host.insertAdjacentElement('beforebegin',qr);}qr.replaceChildren();if(window.QRCode)new window.QRCode(qr,{text:result.qr_token,width:176,height:176,colorDark:'#102a43',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M});else qr.textContent='QR code tidak dapat dimuat. Kode pesanan: '+code;
      modal.classList.remove('hidden');
    }catch(error){alert(error.message);}
  };
  showDatabaseFallback();
  fetch(endpoint,{credentials:'same-origin'}).then(async response=>{const data=await response.json();if(!response.ok||!data.ok)throw new Error(data.message||'Data belum dapat dimuat.');if(isAdmin){if(data.admin?.name)document.querySelectorAll('.site-header-user-details span:first-child,.site-header-mobile-profile-copy strong').forEach(el=>el.textContent=data.admin.name);applyAdminOrders(data);applyAdminCatalog(data);applyAdminHistory(data);applyAdminRedemption(data);}else{applyCustomerDashboard(data);applyHistory(data);applyRewards(data);}}).catch(error=>{banner(`Data database belum dapat dimuat: ${error.message} Pastikan MySQL aktif dan jalankan file database/002_rewards_and_catalog.sql di phpMyAdmin.`);if(!isAdmin){const feed=document.getElementById('databaseCustomerOrders');if(feed)feed.innerHTML=empty('Data pesanan belum dapat dimuat','Periksa koneksi database lalu muat ulang halaman.');const box=document.getElementById('cardsContainer');if(box)box.innerHTML=empty('Riwayat belum dapat dimuat','Periksa koneksi database lalu muat ulang halaman.');document.querySelectorAll('[data-reward-card]').forEach(card=>card.hidden=true);}});
})();
