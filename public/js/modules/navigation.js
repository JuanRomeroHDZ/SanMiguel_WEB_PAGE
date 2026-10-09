/**
 * navigation.js - Modulo atomico para navegacion responsive, marquesina accesible y efectos de scroll
 */

export function initNavigation() {
    // 1. MENU RESPONSIVE MOVIL
    const navElement = document.querySelector('nav');
    const mobileToggle = document.getElementById('mobileNavToggle');
    const navLinks = document.getElementById('primaryNavLinks');

    if (mobileToggle && navElement) {
        const toggleMenu = (open) => {
            const isCurrentlyOpen = navElement.classList.contains('nav-open');
            const shouldOpen = open !== undefined ? open : !isCurrentlyOpen;

            navElement.classList.toggle('nav-open', shouldOpen);
            mobileToggle.setAttribute('aria-expanded', String(shouldOpen));
            mobileToggle.setAttribute('aria-label', shouldOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');
        };

        mobileToggle.addEventListener('click', () => toggleMenu());

        // Cerrar al dar click a cualquier enlace de la lista
        if (navLinks) {
            navLinks.addEventListener('click', (e) => {
                if (e.target.tagName === 'A') {
                    toggleMenu(false);
                }
            });
        }

        // Cerrar con la tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navElement.classList.contains('nav-open')) {
                toggleMenu(false);
                mobileToggle.focus();
            }
        });
    }

    // 2. PAUSA ACCESIBLE DE MARQUESINA (WCAG 2.2.2)
    const marqueeToggleBtn = document.getElementById('marqueeToggleBtn');
    const marqueeContent = document.querySelector('.marquee-content');

    if (marqueeToggleBtn && marqueeContent) {
        let isPaused = false;
        marqueeToggleBtn.addEventListener('click', () => {
            isPaused = !isPaused;
            marqueeContent.classList.toggle('is-paused', isPaused);
            marqueeToggleBtn.setAttribute('aria-label', isPaused ? 'Reanudar marquesina' : 'Pausar marquesina');
            marqueeToggleBtn.setAttribute('title', isPaused ? 'Reanudar marquesina' : 'Pausar marquesina');
            marqueeToggleBtn.classList.toggle('active', isPaused);
        });
    }

    // 3. CAMBIO DE BOTON DE WHATSAPP AL LLEGAR AL FINAL (BOTTOM SWAP) Y OCULTAR/MOSTRAR HEADER
    const navContactBtn = document.querySelector('.nav-contact-btn');
    let ticking = false;
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
        const currentScrollY = window.scrollY;
        const delta = currentScrollY - lastScrollY;

        // Ocultar header al scrollear hacia abajo, asomar al scrollear hacia arriba
        if (currentScrollY <= 15) {
            document.body.classList.remove('header-hidden');
        } else if (Math.abs(delta) > 6) {
            if (delta > 0 && currentScrollY > 70) {
                // Scrolleando hacia abajo: ocultar header si el menu movil no esta desplegado
                if (!navElement || !navElement.classList.contains('nav-open')) {
                    document.body.classList.add('header-hidden');
                }
            } else if (delta < 0) {
                // Scrolleando hacia arriba: volver a mostrar header
                document.body.classList.remove('header-hidden');
            }
        }
        lastScrollY = currentScrollY <= 0 ? 0 : currentScrollY;

        const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
        const isNearBottom = scrollableHeight > 0 && window.scrollY >= (scrollableHeight - 120);

        if (isNearBottom) {
            document.body.classList.add('is-bottom');
            document.body.classList.remove('header-hidden');
            if (navContactBtn) navContactBtn.setAttribute('aria-hidden', 'false');
        } else {
            const footer = document.querySelector('footer');
            let footerVisible = false;
            if (footer) {
                const rect = footer.getBoundingClientRect();
                footerVisible = rect.top < (window.innerHeight - 50);
            }

            if (!footerVisible) {
                document.body.classList.remove('is-bottom');
                if (navContactBtn) navContactBtn.setAttribute('aria-hidden', 'true');
            } else {
                document.body.classList.add('is-bottom');
                document.body.classList.remove('header-hidden');
                if (navContactBtn) navContactBtn.setAttribute('aria-hidden', 'false');
            }
        }
        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(handleScroll);
            ticking = true;
        }
    }, { passive: true });

    const footerElem = document.querySelector('footer');
    if (footerElem) {
        const footerObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    document.body.classList.add('is-bottom');
                    document.body.classList.remove('header-hidden');
                    if (navContactBtn) navContactBtn.setAttribute('aria-hidden', 'false');
                } else {
                    handleScroll();
                }
            });
        }, { threshold: 0.1 });
        footerObserver.observe(footerElem);
    }

    handleScroll();

    // 4. ANIMACION DE ENTRADA PARA UBICACION
    const locationSec = document.querySelector('.location-section');
    if (locationSec) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });
        revealObserver.observe(locationSec);
    }

    // 5. AÑO ACTUAL EN FOOTER
    const footerYear = document.getElementById('footerYear');
    if (footerYear) {
        footerYear.textContent = new Date().getFullYear();
    }

    // 6. SCROLLSPY ACCESIBLE
    const navSectionLinks = document.querySelectorAll('.nav-links a[data-section]');
    const spyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navSectionLinks.forEach(l => l.classList.toggle('active-section', l.dataset.section === entry.target.id));
            }
        });
    }, { rootMargin: '-40% 0px -55% 0px' });

    ['catalogo', 'opiniones', 'ubicacion'].forEach(id => {
        const sec = document.getElementById(id);
        if (sec) spyObserver.observe(sec);
    });

    // 7. EFECTO ONDA EN BOTON FLOTANTE WHATSAPP (FAB)
    const fab = document.getElementById('whatsappFab');
    if (fab) {
        fab.addEventListener('touchstart', () => {}, { passive: true });
        fab.addEventListener('mousedown', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const circle = document.createElement('span');
            circle.classList.add('ripple');
            circle.style.left = `${x}px`;
            circle.style.top = `${y}px`;

            this.appendChild(circle);
            setTimeout(() => circle.remove(), 600);
        });
    }
}
