function togglePasswordVisibility(fieldId, iconId) {
    const field = document.getElementById(fieldId);
    const icon = document.getElementById(iconId);

    if (field && icon) {
        if (field.type === 'password') {
            field.type = 'text';
            icon.textContent = 'visibility_off';
        } else {
            field.type = 'password';
            icon.textContent = 'visibility';
        }
    }
}

function handlePasswordStrength(val) {
    const bar = document.getElementById('strengthBar');
    const label = document.getElementById('strengthLabel');

    if (!bar || !label) return;

    if (!val || val.length === 0) {
        bar.style.width = '0%';
        bar.className = 'h-full bg-outline transition-all duration-300';
        label.textContent = 'Min. 6 Karakter';
        label.className = 'font-label-sm text-label-sm text-on-surface-variant';

    } else if (val.length < 6) {
        bar.style.width = '35%';
        bar.className = 'h-full bg-error transition-all duration-300';
        label.textContent = 'Terlalu pendek';
        label.className = 'font-label-sm text-label-sm text-error';

    } else if (val.length < 9) {
        bar.style.width = '70%';
        bar.className = 'h-full bg-tertiary-container transition-all duration-300';
        label.textContent = 'Cukup kuat';
        label.className = 'font-label-sm text-label-sm text-tertiary-container';

    } else {
        bar.style.width = '100%';
        bar.className = 'h-full bg-secondary transition-all duration-300';
        label.textContent = 'Kuat & Aman';
        label.className = 'font-label-sm text-label-sm text-secondary';
    }

    checkPasswordMatch();
}

function checkPasswordMatch() {
    const pwd = document.getElementById('password')?.value;
    const confirmField = document.getElementById('confirmPassword');
    const confirmPwd = confirmField?.value;
    const badge = document.getElementById('matchBadge');

    if (!badge || !confirmField) return;

    const matches = Boolean(confirmPwd && pwd && confirmPwd === pwd);
    confirmField.setCustomValidity(confirmPwd && !matches ? 'Ulangi kata sandi harus sama dengan kata sandi.' : '');

    if (matches && pwd.length >= 6) {
        badge.classList.remove('hidden');
        badge.classList.add('flex');
    } else {
        badge.classList.add('hidden');
        badge.classList.remove('flex');
    }
}
document.getElementById('registerForm')?.addEventListener('submit', async function (event) {
    event.preventDefault();
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    const terms = document.getElementById('terms');

    checkPasswordMatch();
    if (password.value !== confirmPassword.value) {
        confirmPassword.setCustomValidity('Ulangi kata sandi harus sama dengan kata sandi.');
        confirmPassword.reportValidity();
        confirmPassword.focus();
        return;
    }
    if (!terms.checked) {
        terms.setCustomValidity('Centang persetujuan syarat dan kebijakan untuk melanjutkan.');
        terms.reportValidity();
        terms.focus();
        return;
    }
    terms.setCustomValidity('');
    if (!this.reportValidity()) return;

    const submitButton = this.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    const goToLogin = () => window.location.assign('../login/login.html');

    try {
        const response = await fetch('../api/auth/register.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
                fullName: document.getElementById('fullName').value.trim(),
                whatsapp: document.getElementById('whatsapp').value.trim(),
                identifier: document.getElementById('userIdentifier').value.trim(),
                password: password.value,
                confirmPassword: confirmPassword.value,
                termsAccepted: terms.checked
            })
        });
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.message || 'Akun belum berhasil dibuat.');

        if (window.StarkLoading) await window.StarkLoading.show('register');
        alert('Akun Customer berhasil dibuat. Silakan login.');
        goToLogin();
    } catch (error) {
        alert(error.message || 'Tidak dapat terhubung ke server. Buka project melalui server PHP.');
        if (submitButton) submitButton.disabled = false;
    }
});
