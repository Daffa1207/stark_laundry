let activeRole = 'pelanggan';

function switchRole(role) {
    activeRole = role;

    const btnPelanggan = document.getElementById('role-pelanggan');
    const btnStaff = document.getElementById('role-staff');
    const hint = document.getElementById('role-hint');
    const labelIdentifier = document.getElementById('label-identifier');
    const inputIdentifier = document.getElementById('identifier');

    if (role === 'pelanggan') {
        btnPelanggan.className = 'flex-1 py-2.5 px-3 rounded-md flex items-center justify-center gap-2 font-label-lg text-label-lg transition-all duration-150 bg-surface-container-lowest text-primary shadow-sm';
        btnPelanggan.setAttribute('aria-selected', 'true');

        btnStaff.className = 'flex-1 py-2.5 px-3 rounded-md flex items-center justify-center gap-2 font-label-lg text-label-lg transition-all duration-150 text-on-surface-variant hover:text-on-surface';
        btnStaff.setAttribute('aria-selected', 'false');

        hint.textContent = 'Pantau status cuci kiloan, riwayat nota, & poin member';
        labelIdentifier.textContent = 'Email atau Nomor WhatsApp';
        inputIdentifier.placeholder = 'Contoh: nama@email.com atau 08123456789';

    } else {

        btnStaff.className = 'flex-1 py-2.5 px-3 rounded-md flex items-center justify-center gap-2 font-label-lg text-label-lg transition-all duration-150 bg-surface-container-lowest text-primary shadow-sm';
        btnStaff.setAttribute('aria-selected', 'true');

        btnPelanggan.className = 'flex-1 py-2.5 px-3 rounded-md flex items-center justify-center gap-2 font-label-lg text-label-lg transition-all duration-150 text-on-surface-variant hover:text-on-surface';
        btnPelanggan.setAttribute('aria-selected', 'false');

        hint.textContent = 'Akses mesin kasir kasir POS, timbangan kilat, & laporan harian';
        labelIdentifier.textContent = 'ID Petugas / PIN Kasir';
        inputIdentifier.placeholder = 'Contoh: KASIR-01 atau ID Petugas';
    }
}

function togglePasswordVisibility() {
    const passwordField = document.getElementById('password');
    const eyeIcon = document.getElementById('eye-icon');

    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        eyeIcon.textContent = 'visibility_off';

    } else {

        passwordField.type = 'password';
        eyeIcon.textContent = 'visibility';
    }
}

async function handleLogin(e) {
    e.preventDefault();

    const btn = document.getElementById('btn-submit');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `
      <span class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
      <span>Memverifikasi...</span>
    `;

    try {
        const response = await fetch('../api/auth/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
                role: activeRole === 'pelanggan' ? 'customer' : 'admin',
                identifier: document.getElementById('identifier').value.trim(),
                password: document.getElementById('password').value
            })
        });
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.message || 'Login belum berhasil.');

        const destination = activeRole === 'pelanggan'
            ? '../customer/customer.html'
            : '../pesanan/pesanan.html';

        if (window.StarkLoading) {
            await window.StarkLoading.show('login', {
                doneMessage: 'Selamat datang. Menyiapkan halaman ' +
                    (activeRole === 'pelanggan' ? 'pelanggan' : 'Admin / Kasir') + '…'
            });
        }
        window.location.assign(destination);
    } catch (error) {
        alert(error.message || 'Tidak dapat terhubung ke server. Buka project melalui server PHP.');
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}
