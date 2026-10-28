(() => {
    let demoUser = null;
    try {
        demoUser = JSON.parse(sessionStorage.getItem('starkDemoSession') || 'null');
    } catch (_) {
        sessionStorage.removeItem('starkDemoSession');
    }

    const toggles = document.querySelectorAll('.site-header-menu-toggle');

    const closeMenu = (button) => {
        const header = button.closest('.site-header');
        if (!header) return;

        header.classList.remove('site-header--menu-open');
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-label', 'Buka menu navigasi');
        const icon = button.querySelector('.material-symbols-outlined');
        if (icon) icon.textContent = 'menu';
    };

    toggles.forEach((button) => {
        const header = button.closest('.site-header');
        const nav = document.getElementById(button.getAttribute('aria-controls'));
        if (!header || !nav) return;

        button.addEventListener('click', () => {
            const isOpen = header.classList.toggle('site-header--menu-open');
            button.setAttribute('aria-expanded', String(isOpen));
            button.setAttribute('aria-label', isOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi');
            const icon = button.querySelector('.material-symbols-outlined');
            if (icon) icon.textContent = isOpen ? 'close' : 'menu';
        });

        nav.addEventListener('click', (event) => {
            if (event.target.closest('a')) closeMenu(button);
        });

        document.addEventListener('click', (event) => {
            if (!header.contains(event.target)) closeMenu(button);
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeMenu(button);
        });

        const breakpoint = button.classList.contains('site-header-menu-toggle--xl') ? 1200 : 768;
        window.addEventListener('resize', () => {
            if (window.innerWidth >= breakpoint) closeMenu(button);
        });
    });

    document.querySelectorAll('.site-header-logout').forEach((link) => {
        link.addEventListener('click', async (event) => {
            event.preventDefault();
            link.setAttribute('aria-busy', 'true');

            if (demoUser) {
                sessionStorage.removeItem('starkDemoSession');
                window.location.assign(link.href);
                return;
            }

            try {
                const endpoint = new URL('../api/auth/logout.php', window.location.href);
                const response = await fetch(endpoint, {
                    method: 'POST',
                    credentials: 'same-origin'
                });
                if (!response.ok) throw new Error('Sesi belum berhasil ditutup.');
                window.location.assign(link.href);
            } catch (error) {
                link.removeAttribute('aria-busy');
                alert(error.message || 'Tidak dapat menghubungi server untuk keluar.');
            }
        });
    });

    if (demoUser?.name) {
        const fullName = demoUser.name.trim();
        const firstName = fullName.split(/\s+/)[0];
        window.StarkUser = demoUser;
        document.querySelectorAll('[data-user-name]').forEach((element) => {
            element.textContent = fullName;
        });
        document.querySelectorAll('[data-user-first-name]').forEach((element) => {
            element.textContent = firstName;
        });
    } else if (document.querySelector('[data-user-name], [data-user-first-name]')) {
        const endpoint = new URL('../api/auth/me.php', window.location.href);
        fetch(endpoint, { credentials: 'same-origin' })
            .then((response) => response.ok ? response.json() : null)
            .then((result) => {
                if (!result?.ok || !result.user?.name) return;

                const fullName = result.user.name.trim();
                const firstName = fullName.split(/\s+/)[0];
                window.StarkUser = result.user;

                document.querySelectorAll('[data-user-name]').forEach((element) => {
                    element.textContent = fullName;
                });
                document.querySelectorAll('[data-user-first-name]').forEach((element) => {
                    element.textContent = firstName;
                });
            })
            .catch(() => {});
    }
})();
