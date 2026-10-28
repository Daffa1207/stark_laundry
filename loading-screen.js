(function () {
  const COPY = {
    login: {
      title: 'Sedang masuk…',
      message: 'Kami sedang memeriksa akses akun Stark Laundry Anda.',
      doneTitle: 'Login berhasil',
      doneMessage: 'Menyiapkan halaman akun Anda…'
    },
    register: {
      title: 'Membuat akun…',
      message: 'Mohon tunggu, kami sedang menyiapkan akun Stark Laundry Anda.',
      doneTitle: 'Pendaftaran selesai',
      doneMessage: 'Mengalihkan Anda ke halaman login…'
    },
    logout: {
      title: 'Sedang keluar…',
      message: 'Kami sedang mengakhiri sesi Stark Laundry Anda.',
      doneTitle: 'Anda sudah keluar',
      doneMessage: 'Terima kasih sudah menggunakan Stark Laundry.'
    }
  };

  let overlay;
  let active = false;
  let replayingButton = false;

  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.className = 'stark-loading-screen';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <section class="stark-loading-card" aria-label="Memproses permintaan">
        <img class="stark-loading-logo" src="../login/stark-laundry-mark.png" alt="Logo Stark Laundry">
        <p class="stark-loading-brand">Stark Laundry</p>
        <h1 class="stark-loading-title"></h1>
        <p class="stark-loading-message"></p>
        <div class="stark-loading-track" aria-hidden="true"></div>
      </section>`;
    document.body.appendChild(overlay);
    return overlay;
  }

  function showLoadingScreen(action, options) {
    const copy = COPY[action] || COPY.login;
    const settings = options || {};
    const element = ensureOverlay();
    const title = element.querySelector('.stark-loading-title');
    const message = element.querySelector('.stark-loading-message');
    const duration = Math.max(800, settings.duration || 1450);

    active = true;
    title.textContent = settings.title || copy.title;
    message.textContent = settings.message || copy.message;
    element.setAttribute('aria-hidden', 'false');
    element.classList.add('is-visible');
    document.body.style.overflow = 'hidden';

    return new Promise((resolve) => {
      window.setTimeout(() => {
        title.textContent = settings.doneTitle || copy.doneTitle;
        message.textContent = settings.doneMessage || copy.doneMessage;
      }, Math.floor(duration * 0.58));

      window.setTimeout(() => {
        active = false;
        element.classList.remove('is-visible');
        element.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        resolve();
      }, duration);
    });
  }

  window.StarkLoading = { show: showLoadingScreen };

  document.addEventListener('click', function (event) {
    const target = event.target instanceof Element ? event.target : null;
    if (!target || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const logoutLink = target.closest('a.site-header-logout');
    if (logoutLink) {
      event.preventDefault();
      if (active) return;
      const destination = logoutLink.href;
      showLoadingScreen('logout').then(() => window.location.assign(destination));
      return;
    }

    const button = target.closest('button');
    if (!button || button.disabled || replayingButton) return;
    if (!button.hasAttribute('data-stark-loading')) return;

    // Login and registration already show their own branded loading flow on submit.
    const form = button.form;
    if (button.type === 'submit' && form && (
      form.id === 'registerForm' ||
      (form.getAttribute('onsubmit') || '').includes('handleLogin')
    )) return;

    // Let native validation appear before showing a loading screen for form actions.
    if (button.type === 'submit' && form && !form.reportValidity()) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    if (active) return;

    const labelClone = button.cloneNode(true);
    labelClone.querySelectorAll('.material-symbols-outlined, svg, img').forEach((icon) => icon.remove());
    const label = (button.getAttribute('aria-label') || button.getAttribute('title') || labelClone.textContent || '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '') || 'aksi ini';

    showLoadingScreen('action', {
      title: button.dataset.loadingTitle || 'Memproses…',
      message: button.dataset.loadingMessage || `Stark Laundry sedang menyiapkan ${label}.`,
      doneTitle: button.dataset.loadingDoneTitle || 'Siap dilanjutkan',
      doneMessage: button.dataset.loadingDoneMessage || 'Permintaan Anda sedang dijalankan.',
      duration: Number(button.dataset.loadingDuration) || 1000
    }).then(() => {
      if (!button.isConnected || button.disabled) return;
      replayingButton = true;
      button.click();
      replayingButton = false;
    });
  }, true);
})();
